import React, { useState, useEffect } from "react";
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

  // Update user state when initialUser prop changes
  useEffect(() => {
    if (initialUser && initialUser !== user) {
      setUser(initialUser);
    }
  }, [initialUser, user]);

  // Listen for user changes from AsyncStorage (for profile updates)
  useEffect(() => {
    const checkUserUpdate = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData && userData.name !== user?.name) {
                        setUser(userData);
          }
        }
      } catch (error) {
        console.error("Error checking user update:", error);
      }
    };

    // Check immediately and then every 2 seconds
    checkUserUpdate();
    const interval = setInterval(checkUserUpdate, 2000);

    return () => clearInterval(interval);
  }, [user?.name]);

  // Use the prop onUpdateUser if available, otherwise use local handler
  const updateUserHandler = onUpdateUser || ((updatedUser) => {
    setUser(updatedUser);
  });

  // Fallback if user is null
  if (!user) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Loading user data...</Text>
      </View>
    );
  }

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-50);

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

  return (
    <View style={styles.container}>
      <View>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      </View>
      
      {/* Animated Header */}
      <View style={styles.header}>
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
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
            backgroundColor: user?.role === 'BUYER' ? COLORS.SECONDARY + '20' : COLORS.ACCENT + '20',
            borderWidth: 1,
            borderColor: user?.role === 'BUYER' ? COLORS.SECONDARY + '50' : COLORS.ACCENT + '50'
          }]}>
            <Text style={[styles.roleText, { 
              color: user?.role === 'BUYER' ? COLORS.SECONDARY : COLORS.ACCENT
            }]}>
              {user?.role === 'BUYER' ? '🛍️ Shopper' : '🏪 Vendor'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Floating Cards Container */}
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
          <Text style={styles.cardSubtitle}>Add your items in seconds</Text>
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
          setImage={setImage}
          onUpload={handleImage}
        />

        <EditableTable data={items} userId={user?.id} />

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
    backgroundColor: COLORS.PRIMARY,
    paddingTop: SIZES.PADDING_XL + 20,
    paddingBottom: SIZES.PADDING_XL,
    paddingHorizontal: SIZES.PADDING_XL,
    borderBottomLeftRadius: SIZES.RADIUS_2XL,
    borderBottomRightRadius: SIZES.RADIUS_2XL,
    ...SHADOWS.LARGE,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -20,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 20,
    left: -10,
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
    width: 56,
    height: 56,
    borderRadius: SIZES.RADIUS_FULL,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    fontSize: SIZES.FONT_BASE,
    color: COLORS.WHITE + 'CC',
    marginBottom: SIZES.MARGIN_XS,
  },
  welcomeText: {
    fontSize: SIZES.FONT_XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  roleBadge: {
    paddingHorizontal: SIZES.PADDING_BASE,
    paddingVertical: SIZES.PADDING_SM,
    borderRadius: SIZES.RADIUS_FULL,
    borderWidth: 1,
  },
  roleText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
  },
  floatingContainer: {
    paddingHorizontal: SIZES.PADDING_BASE,
    marginTop: -SIZES.MARGIN_LG,
    zIndex: 2,
  },
  floatingCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_LG,
    alignItems: 'center',
    ...SHADOWS.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '20',
  },
  cardTitle: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
    marginBottom: SIZES.MARGIN_XS,
  },
  cardSubtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: SIZES.MARGIN_BASE,
  },
  scrollContent: {
    padding: SIZES.PADDING_BASE,
    paddingTop: SIZES.PADDING_SM,
    paddingBottom: SIZES.PADDING_XL,
  },
});