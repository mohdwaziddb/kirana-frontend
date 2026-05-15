import React, { useRef, useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, StatusBar, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { processTextAPI } from "../services/textApi";
import { uploadImageAPI } from "../services/imageApi";
import TextInputCard from "../components/TextInputCard";
import EditableTable from "../components/EditableTable";
import { COLORS } from "../constants/theme";

export default function HomeScreen({ user: initialUser, onLogout, onUpdateUser, navigation, openGalleryOnMount, onGalleryOpened }) {

  const [user, setUser] = useState(initialUser);
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [extractedText, setExtractedText] = useState("");

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

  const handleText = async () => {
    if (!input.trim()) return;
    const data = await processTextAPI(input);
    setItems(data);
    setShowResult(true);
  };

  const handleGalleryScan = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const data = await uploadImageAPI(imageUri, setExtractedText);
        setItems(data);
        setShowResult(true);
        Alert.alert('Success! 🎉', 'Items extracted from image and added to list!');
      }
    } catch (error) {
      console.log('Gallery error:', error);
      Alert.alert('Error', 'Unable to select image. Please try again.');
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

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingTop: StatusBar.currentHeight + 16,
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
    paddingBottom: 40,
  },
});