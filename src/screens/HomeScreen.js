import React, { useRef, useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, StatusBar, TouchableOpacity, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { processTextAPI } from "../services/textApi";
import { uploadImageAPI } from "../services/imageApi";
import TextInputCard from "../components/TextInputCard";
import EditableTable from "../components/EditableTable";
import CommonModal from "../components/CommonModal";
import { COLORS } from "../constants/theme";

export default function HomeScreen({ user: initialUser, onLogout, onUpdateUser, navigation, openGalleryOnMount, onGalleryOpened }) {

  const [user, setUser] = useState(initialUser);
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imageError, setImageError] = useState({ visible: false, message: "" });

  const mergeUserData = (nextUser) => {
    if (!nextUser) return;
    setUser((currentUser) => {
      const mergedUser = { ...(currentUser || {}), ...nextUser };
      return JSON.stringify(mergedUser) === JSON.stringify(currentUser) ? currentUser : mergedUser;
    });
  };

  useEffect(() => {
    mergeUserData(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const checkUserUpdate = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          mergeUserData(userData);
        }
      } catch (error) {
        console.error("Error checking user update:", error);
      }
    };
    checkUserUpdate();
    const interval = setInterval(checkUserUpdate, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (openGalleryOnMount && onGalleryOpened) {
      const timer = setTimeout(() => {
        handleGalleryScan();
        onGalleryOpened();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [openGalleryOnMount]);

  const updateUserHandler = onUpdateUser || mergeUserData;

  const normalizeItems = (value) => {
    if (!Array.isArray(value)) return [];

    return value
      .filter(Boolean)
      .map((item) => {
        const quantity = item.quantity == null ? "" : String(item.quantity);
        const price = item.price == null ? "" : String(item.price);
        return {
          name: item.name || item.itemName || item.item || "",
          quantity,
          price,
          total: item.total || ((parseFloat(quantity) || 0) * (parseFloat(price) || 0)),
          matched: item.matched || false,
        };
      })
      .filter((item) => item.name.trim() !== "");
  };

  const appendItemsToTable = (nextItems) => {
    const normalizedItems = normalizeItems(nextItems);
    if (normalizedItems.length === 0) return [];

    setItems((currentItems) => {
      const existingItems = normalizeItems(currentItems);
      return [...existingItems, ...normalizedItems];
    });

    setShowResult(true);
    return normalizedItems;
  };

  const handleText = async () => {
    if (!input.trim()) return;
    const data = await processTextAPI(input);
    appendItemsToTable(data);
  };

  const handleGalleryScan = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setImageError({ visible: true, message: "Please allow photo access to select an image." });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        let imageResult;
        try {
          imageResult = await uploadImageAPI(imageUri, setExtractedText);
        } catch (uploadError) {
          console.log('Image upload error:', uploadError);
          setImageError({ visible: true, message: uploadError.message || "Image selected, but upload failed. Please try again." });
          return;
        }

        const extractedItems = normalizeItems(imageResult.items);

        if (extractedItems.length === 0) {
          const hasOcrText = imageResult.extractedText && !imageResult.extractedText.startsWith("Error:");
          setImageError({
            visible: true,
            message: hasOcrText
              ? "Image text was read, but no table items were found. Please try a clearer image."
              : imageResult.extractedText || "No items found in this image. Please try another image.",
          });
          return;
        }

        appendItemsToTable(extractedItems);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.log('Gallery error:', error);
      setImageError({ visible: true, message: "Unable to select image. Please try again." });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!user) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />

          <View style={styles.headerContent}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userNameText}>{user?.name || 'Friend'}</Text>
            <Text style={styles.welcomeText}>Ready to manage your inventory?</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TextInputCard
          input={input}
          setInput={setInput}
          onProcess={handleText}
        />

        <EditableTable
          data={items}
          userId={user?.id}
          storeName={user?.name}
          onUpdateUser={updateUserHandler}
        />
      </ScrollView>

      <CommonModal
        visible={showSuccessModal}
        type="success"
        image="🎉"
        title="Success!"
        message="Items extracted from image and added to list!"
        confirmText="Great"
        showOnlyConfirm={true}
        autoCloseTime={1200}
        onConfirm={() => setShowSuccessModal(false)}
      />

      <CommonModal
        visible={imageError.visible}
        type="error"
        image="❌"
        title="Image Error"
        message={imageError.message}
        confirmText="OK"
        showOnlyConfirm={true}
        onConfirm={() => setImageError({ visible: false, message: "" })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  fallbackText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },

  // Header
  headerContainer: {
    overflow: 'hidden',
  },
  headerGradient: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: (StatusBar.currentHeight || 0) + 16,
    paddingBottom: 70,
    paddingHorizontal: 24,
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle3: {
    position: 'absolute',
    top: '30%',
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    zIndex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  userNameText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },

  content: {
    flex: 1,
    marginTop: -85,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 150,
  },
});
