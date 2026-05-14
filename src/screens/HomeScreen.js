import React, { useRef, useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, StatusBar, Alert, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { processTextAPI } from "../services/textApi";
import { uploadImageAPI } from "../services/imageApi";
import TextInputCard from "../components/TextInputCard";
import EditableTable from "../components/EditableTable";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

const { width, height } = Dimensions.get('window');

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

  // Auto open gallery when navigating from scan button
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

  // Handle scan - select image, crop, and process
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{getGreeting()},</Text>
          <Text style={styles.userNameText}>{user?.name || 'Friend'}! 👋</Text>
        </View>

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

        {/* Extra padding at bottom for bottom nav */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  fallbackText: {
    fontSize: SIZES.FONT_LG,
    color: COLORS.TEXT_SECONDARY,
  },
  greetingContainer: {
    paddingHorizontal: SIZES.PADDING_BASE,
    paddingTop: SIZES.PADDING_LG,
    marginBottom: SIZES.MARGIN_BASE,
  },
  greetingText: {
    fontSize: SIZES.FONT_LG,
    color: COLORS.TEXT_SECONDARY,
  },
  userNameText: {
    fontSize: SIZES.FONT_2XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.PADDING_BASE,
    paddingTop: SIZES.PADDING_SM,
    paddingBottom: SIZES.PADDING_2XL,
  },
});