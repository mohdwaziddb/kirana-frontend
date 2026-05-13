import React, { useRef, useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, StatusBar, Animated, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { processTextAPI } from "../services/textApi";
import { uploadImageAPI } from "../services/imageApi";
import ImageUploadCard from "../components/ImageUploadCard";
import TextInputCard from "../components/TextInputCard";
import EditableTable from "../components/EditableTable";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ user: initialUser, onLogout, onUpdateUser }) {

  const [user, setUser] = useState(initialUser);
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [image, setImage] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [extractedText, setExtractedText] = useState(""); // 🔥 Store raw OCR text

  const mergeUserData = (nextUser) => {
    if (!nextUser) return;

    setUser((currentUser) => {
      const mergedUser = {
        ...(currentUser || {}),
        ...nextUser,
      };

      return JSON.stringify(mergedUser) === JSON.stringify(currentUser) ? currentUser : mergedUser;
    });
  };

  // Update user state when initialUser prop changes
  useEffect(() => {
    mergeUserData(initialUser);
  }, [initialUser]);

  // Listen for user changes from AsyncStorage (for profile updates)
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

    // Check immediately and then every 2 seconds
    checkUserUpdate();
    const interval = setInterval(checkUserUpdate, 2000);

    return () => clearInterval(interval);
  }, []);

  // Use the prop onUpdateUser if available, otherwise use local handler
  const updateUserHandler = onUpdateUser || mergeUserData;

  const handleText = async () => {
    if (!input.trim()) {
      return;
    }
    const data = await processTextAPI(input);
    setItems(data);
    setShowResult(true);
  };

  const handleImage = async () => {
    if (!image) {
      return;
    }
    const data = await uploadImageAPI(image, setExtractedText);
    setItems(data);
    setShowResult(true);
  };

  const handleImageSelect = (selectedImage) => {
    setImage(selectedImage);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // Start animations on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false, // Fixed for web
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false, // Fixed for web
      }),
    ]).start();
  }, []);

  // Fallback if user is null
  if (!user) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Loading user data...</Text>
      </View>
    );
  }

  const userRole = user?.role || 'BUYER';

  return (
    <View style={styles.container}>
      <View>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      </View>
      
      <View style={styles.header}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeBlock} />
        
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
              </View>
            </View>
            <View style={styles.userText}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.welcomeText}>{user?.name || 'User'} 👋</Text>
            </View>
          </View>
          
          <View style={[styles.roleBadge, { 
            backgroundColor: userRole === 'BUYER' ? COLORS.SECONDARY + '20' : COLORS.ACCENT + '20',
            borderWidth: 1,
            borderColor: userRole === 'BUYER' ? COLORS.SECONDARY + '50' : COLORS.ACCENT + '50'
          }]}>
            <Text style={[styles.roleText, { 
              color: userRole === 'BUYER' ? COLORS.SECONDARY : COLORS.ACCENT
            }]}>
              {userRole === 'BUYER' ? '🛍️ Shopper' : '🏪 Vendor'}
            </Text>
          </View>
        </Animated.View>

      </View>

      <View style={styles.floatingContainer}>
        <Animated.View 
          style={[
            styles.floatingCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }]
            }
          ]}
        >
          <Text style={styles.cardTitle}>✨ Let's Get Started!</Text>
          <Text style={styles.cardSubtitle}>Type items or scan a photo, then review totals below.</Text>
        </Animated.View>
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

        <ImageUploadCard
          image={image}
          setImage={handleImageSelect}
          onUpload={handleImage}
        />

        <EditableTable
          data={items}
          userId={user?.id}
          storeName={user?.name}
          onUpdateUser={updateUserHandler}
        />

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
  header: {
    backgroundColor: COLORS.PRIMARY_DARK,
    paddingTop: SIZES.PADDING_XL + 20,
    paddingBottom: SIZES.PADDING_2XL,
    paddingHorizontal: SIZES.PADDING_XL,
    borderBottomLeftRadius: SIZES.RADIUS_2XL,
    borderBottomRightRadius: SIZES.RADIUS_2XL,
    ...SHADOWS.LARGE,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(49, 92, 255, 0.55)',
    top: -42,
    right: -28,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(14, 165, 164, 0.28)',
    bottom: -36,
    left: -24,
  },
  decorativeBlock: {
    position: 'absolute',
    width: 210,
    height: 64,
    borderRadius: SIZES.RADIUS_2XL,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    right: 120,
    bottom: 26,
    transform: [{ rotate: '-8deg' }],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: SIZES.MARGIN_BASE,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: SIZES.RADIUS_FULL,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.36)',
  },
  avatarText: {
    fontSize: SIZES.FONT_XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  userText: {
    flex: 1,
  },
  greeting: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.WHITE + 'CC',
    marginBottom: SIZES.MARGIN_XS,
  },
  welcomeText: {
    fontSize: SIZES.FONT_2XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  roleBadge: {
    paddingHorizontal: SIZES.PADDING_BASE,
    paddingVertical: SIZES.PADDING_SM,
    borderRadius: SIZES.RADIUS_FULL,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  roleText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
  },
  floatingContainer: {
    paddingHorizontal: SIZES.PADDING_BASE,
    marginTop: -SIZES.MARGIN_XL,
    zIndex: 2,
  },
  floatingCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_LG,
    alignItems: 'flex-start',
    ...SHADOWS.MEDIUM,
    borderWidth: 1,
    borderColor: '#E8EEF8',
  },
  promptIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.RADIUS_LG,
    backgroundColor: COLORS.PRIMARY + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.MARGIN_BASE,
  },
  promptIconText: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.EXTRABOLD,
    color: COLORS.PRIMARY,
  },
  promptText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_XS,
  },
  cardSubtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    marginTop: SIZES.MARGIN_SM,
  },
  scrollContent: {
    padding: SIZES.PADDING_BASE,
    paddingTop: SIZES.PADDING_SM,
    paddingBottom: SIZES.PADDING_XL,
  },
});
