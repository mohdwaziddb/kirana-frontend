import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { NavigationContainer, CommonActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import HistoryScreen from "../screens/HistoryScreen";
import CommonModal from "./CommonModal";
import { COLORS, FONTS, SIZES, SHADOWS } from "../constants/theme";

const Stack = createNativeStackNavigator();

// 20 funny logout messages (no religious content)
const logoutMessages = [
  "Arre mat jao na! 🥺",
  "Ek aur scan kar lo na! 📸",
  "Ghunghroo mat tukro! 💃",
  "Dil todo mat yaar! ❤️",
  "Chhod ke mat jao na! 🙏",
  "Room toot jayega! 🏠💔",
  "Mereko chhod ke jao mat! 😢",
  "A thoda aur raho! ⏰",
  "Kaam khatam nahi hua! 📋",
  "Bill toh bana lo pehle! 🧾",
  "Scan toh kar lo ek! 🔍",
  "Bas ek aur baar! 🤗",
  "Jaan jane mat do! 😰",
  "Pyaar se mat jao! 💕",
  "Kabhi toh waapis aana! 🔄",
  "Zindagi mein kuch kamm ke jao! 💼",
  "Chalo ek aur item add karo! ➕",
  "Total toh check karo! 💰",
  "Shopping toh khatam karo! 🛒",
  "Phir se login karna padega! 😏",
];

const getRandomLogoutMessage = () => {
  return logoutMessages[Math.floor(Math.random() * logoutMessages.length)];
};

// Single BottomNav component
function BottomNav({ currentScreen, navigation, setOpenGalleryOnMount, onLogout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");
  const insets = useSafeAreaInsets();

  const navigateTo = (screen) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screen);
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setOpenGalleryOnMount(false);
    try {
      if (onLogout) {
        await onLogout();
      }
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Logout Failed", "Unable to logout. Please try again.");
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleLogout = () => {
    setLogoutMessage(getRandomLogoutMessage());
    setShowLogoutModal(true);
  };

  return (
    <>
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, SIZES.PADDING_SM) }]}>
      <TouchableOpacity
        style={[styles.navItem, currentScreen === 'Home' && styles.navItemActive]}
        activeOpacity={0.7}
        onPress={() => navigateTo('Home')}
      >
        <View style={[styles.navIconContainer, currentScreen === 'Home' && styles.navIconContainerActive]}>
          <Text style={styles.navIcon}>🏠</Text>
        </View>
        <Text style={[styles.navLabel, currentScreen === 'Home' && styles.navLabelActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, currentScreen === 'Profile' && styles.navItemActive]}
        activeOpacity={0.7}
        onPress={() => navigateTo('Profile')}
      >
        <View style={[styles.navIconContainer, currentScreen === 'Profile' && styles.navIconContainerActive]}>
          <Text style={styles.navIcon}>👤</Text>
        </View>
        <Text style={[styles.navLabel, currentScreen === 'Profile' && styles.navLabelActive]}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, currentScreen === 'Scan' && styles.navItemActive]}
        activeOpacity={0.7}
        onPress={() => {
          setOpenGalleryOnMount(true);
          navigateTo('Home');
        }}
      >
        <View style={[styles.navIconContainer, styles.navIconScan, currentScreen === 'Scan' && styles.navIconContainerActive]}>
          <Text style={styles.navIconTextActive}>📷</Text>
        </View>
        <Text style={[styles.navLabel, currentScreen === 'Scan' && styles.navLabelActive]}>Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, currentScreen === 'History' && styles.navItemActive]}
        activeOpacity={0.7}
        onPress={() => navigateTo('History')}
      >
        <View style={[styles.navIconContainer, currentScreen === 'History' && styles.navIconContainerActive]}>
          <Text style={styles.navIcon}>📋</Text>
        </View>
        <Text style={[styles.navLabel, currentScreen === 'History' && styles.navLabelActive]}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={handleLogout}
      >
        <View style={styles.navIconContainer}>
          <Text style={styles.navIcon}>🚪</Text>
        </View>
        <Text style={styles.navLabel}>Logout</Text>
      </TouchableOpacity>
    </View>

    <CommonModal
      visible={showLogoutModal}
      type="confirm"
      title="Wait! ⏸️"
      message={`${logoutMessage || getRandomLogoutMessage()}\n\nAre you sure you want to logout?`}
      confirmText="Haan, jaa raha hoon 👋"
      cancelText="Nahi, raho"
      onConfirm={handleLogoutConfirm}
      onCancel={handleLogoutCancel}
      showCancel={true}
      image="👋"
    />
    </>
  );
}

export default function AuthNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [openGalleryOnMount, setOpenGalleryOnMount] = useState(false);
  const navigationRef = useRef(null);
  const isMounted = useRef(false);

  useEffect(() => {
    checkSession();
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (user === null && !loading && isMounted.current && navigationRef.current) {
      const route = navigationRef.current.getCurrentRoute();
      if (route && route.name !== 'Login' && route.name !== 'Register') {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  }, [user, loading]);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      if (token && userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (error) {
      console.error("Session check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "tokenExpiry"]);
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
    setCurrentScreen('Home');
    setOpenGalleryOnMount(false);
    setUser(null);
  };

  // Track current route and store navigation
  const [navRef, setNavRef] = useState(null);

  const onStateChange = (state) => {
    if (state && state.routes && state.routes.length > 0) {
      const current = state.routes[state.index].name;
      if (['Home', 'Profile', 'History'].includes(current)) {
        setCurrentScreen(current);
      }
    }
  };

  const handleNavigationRef = (ref) => {
    setNavRef(ref);
  };

  if (loading) {
    return null;
  }

  // When user is not logged in, show simple auth screens
  if (!user) {
    return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          <Stack.Screen name="Register">
            {(props) => <RegisterScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // When user is logged in, show main screens with bottom nav
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={(ref) => { navigationRef.current = ref; handleNavigationRef(ref); }} onStateChange={onStateChange}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home">
            {(props) => (
              <HomeScreen
                {...props}
                user={user}
                onLogout={handleLogout}
                onUpdateUser={setUser}
                openGalleryOnMount={openGalleryOnMount}
                onGalleryOpened={() => setOpenGalleryOnMount(false)}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Profile">
            {(props) => (
              <ProfileScreen
                {...props}
                user={user}
                onLogout={handleLogout}
                onUpdateUser={setUser}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="History">
            {(props) => (
              <HistoryScreen {...props} user={user} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      <BottomNav
        currentScreen={currentScreen}
        navigation={navRef}
        setOpenGalleryOnMount={setOpenGalleryOnMount}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingTop: SIZES.PADDING_SM,
    paddingHorizontal: SIZES.PADDING_XS,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 78,
    ...SHADOWS.MEDIUM,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    minHeight: 56,
  },
  navItemActive: {},
  navIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navIconContainerActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  navIconScan: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -8,
  },
  navIcon: {
    fontSize: 18,
  },
  navIconTextActive: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: FONTS.MEDIUM,
    lineHeight: 14,
  },
  navLabelActive: {
    color: COLORS.PRIMARY,
    fontWeight: FONTS.BOLD,
  },
});
