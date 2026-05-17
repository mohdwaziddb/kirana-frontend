import React, { useState, useEffect, useRef, useCallback } from "react";
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
import ProductScreen from "../screens/ProductScreen";
import CommonModal from "./CommonModal";
import { COLORS, FONTS, SIZES, SHADOWS } from "../constants/theme";
import { getRandomLogoutMessage } from "../constants/messages";
import { BASE_URL } from "../services/baseUrl";
import { APP_VERSION } from "../services/appVersion";

const Stack = createNativeStackNavigator();

const isSellerUser = (user) => String(user?.role || "").toUpperCase() === "SELLER";

// Single BottomNav component
function BottomNav({ currentScreen, navigationRef, setOpenGalleryOnMount, onLogout, user }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");
  const insets = useSafeAreaInsets();
  const showProductNav = isSellerUser(user);

  const navigateTo = (screen) => {
    navigationRef.current?.navigate(screen);
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
        <View style={[styles.navIconContainer, currentScreen === 'Scan' && styles.navIconContainerActive]}>
          <Text style={styles.navIcon}>📷</Text>
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

      {showProductNav ? (
        <TouchableOpacity
          style={[styles.navItem, currentScreen === 'Product' && styles.navItemActive]}
          activeOpacity={0.7}
          onPress={() => navigateTo('Product')}
        >
          <View style={[styles.navIconContainer, currentScreen === 'Product' && styles.navIconContainerActive]}>
            <Text style={styles.navIcon}>{"\u{1F4E6}"}</Text>
          </View>
          <Text style={[styles.navLabel, currentScreen === 'Product' && styles.navLabelActive]}>Product</Text>
        </TouchableOpacity>
      ) : null}

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
  const [versionIssueModal, setVersionIssueModal] = useState(false);
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
      const storedAppVersion = await AsyncStorage.getItem("appVersion");
      if (token && userStr && storedAppVersion !== APP_VERSION) {
        await AsyncStorage.multiRemove(["token", "user", "tokenExpiry", "appVersion"]);
        setUser(null);
        setVersionIssueModal(true);
        return;
      }

      if (token && userStr) {
        const userData = JSON.parse(userStr);
        const freshUser = await refreshUserProfile(token, userData);
        setUser(freshUser);
      }
    } catch (error) {
      console.error("Session check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async (token, storedUser) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "X-App-Version": APP_VERSION,
        },
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }

        if (errorData.code === "APP_VERSION_MISMATCH") {
          const error = new Error(errorData.message || "App version mismatch");
          error.code = "APP_VERSION_MISMATCH";
          throw error;
        }

        return storedUser;
      }

      const data = await response.json();
      const serverUser = data.user || data;
      const mergedUser = { ...storedUser, ...serverUser };
      await AsyncStorage.setItem("user", JSON.stringify(mergedUser));
      return mergedUser;
    } catch (error) {
      console.error("Profile refresh error:", error);
      if (error?.code === "APP_VERSION_MISMATCH") {
        await AsyncStorage.multiRemove(["token", "user", "tokenExpiry", "appVersion"]);
        setVersionIssueModal(true);
        return null;
      }
      return storedUser;
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleGalleryOpened = useCallback(() => {
    setOpenGalleryOnMount(false);
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user", "tokenExpiry", "appVersion"]);
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
    setCurrentScreen('Home');
    setOpenGalleryOnMount(false);
    setUser(null);
  };

  const showProductScreen = isSellerUser(user);

  const onStateChange = (state) => {
    if (state && state.routes && state.routes.length > 0) {
      const current = state.routes[state.index].name;
      if (current === 'Product' && !showProductScreen) {
        setCurrentScreen((previous) => previous === 'Home' ? previous : 'Home');
        navigationRef.current?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        );
        return;
      }

      const allowedScreens = showProductScreen
        ? ['Home', 'Profile', 'History', 'Product']
        : ['Home', 'Profile', 'History'];

      if (allowedScreens.includes(current)) {
        setCurrentScreen((previous) => previous === current ? previous : current);
      }
    }
  };

  if (loading) {
    return null;
  }

  // When user is not logged in, show simple auth screens
  if (!user) {
    return (
      <>
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
        <CommonModal
          visible={versionIssueModal}
          type="error"
          title="App Update Required"
          message="App version update required. Kripya app update karein ya Admin se contact karein. Support: 8130703196"
          confirmText="OK"
          showOnlyConfirm={true}
          onConfirm={() => setVersionIssueModal(false)}
        />
      </>
    );
  }

  // When user is logged in, show main screens with bottom nav
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} onStateChange={onStateChange}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home">
            {(props) => (
              <HomeScreen
                {...props}
                user={user}
                onLogout={handleLogout}
                onUpdateUser={setUser}
                openGalleryOnMount={openGalleryOnMount}
                onGalleryOpened={handleGalleryOpened}
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
          {showProductScreen ? (
            <Stack.Screen name="Product">
              {(props) => (
                <ProductScreen {...props} user={user} />
              )}
            </Stack.Screen>
          ) : null}
        </Stack.Navigator>
      </NavigationContainer>
      <BottomNav
        currentScreen={currentScreen}
        navigationRef={navigationRef}
        setOpenGalleryOnMount={setOpenGalleryOnMount}
        onLogout={handleLogout}
        user={user}
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
  navIcon: {
    fontSize: 19,
    lineHeight: 22,
    textAlign: 'center',
  },
  navLetter: {
    fontSize: 19,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_SECONDARY,
  },
  navLetterActive: {
    color: COLORS.WHITE,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: FONTS.MEDIUM,
    lineHeight: 13,
  },
  navLabelActive: {
    color: COLORS.PRIMARY,
    fontWeight: FONTS.BOLD,
  },
});
