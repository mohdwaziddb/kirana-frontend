import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer, CommonActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import HistoryScreen from "../screens/HistoryScreen";
import { COLORS, FONTS } from "../constants/theme";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef(null);

  // Check for existing session on app start
  useEffect(() => {
    checkSession();
  }, []);

  // Monitor user state changes and force navigation when user becomes null
  useEffect(() => {
    if (user === null && !loading && navigationRef.current) {
      setTimeout(() => {
        if (navigationRef.current) {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        }
      }, 100);
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
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
    setUser(null);
  };

  if (loading) {
    return null; // or loading spinner
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.WHITE,
          },
          headerTitleStyle: {
            color: COLORS.TEXT_PRIMARY,
            fontWeight: FONTS.BOLD,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: COLORS.BACKGROUND,
          },
        }}
      >
        {user ? (
          <>
            <Stack.Screen 
              name="Home" 
              options={({ navigation }) => ({ 
                title: "Kirana Store",
                headerRight: () => (
                  <View style={{ flexDirection: "row", alignItems: "center", marginRight: 10 }}>
                    <TouchableOpacity onPress={() => navigation.navigate("History")} style={{ marginRight: 15 }}>
                      <Text style={{ color: COLORS.PRIMARY, fontWeight: FONTS.SEMIBOLD }}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={{ marginRight: 15 }}>
                      <Text style={{ color: COLORS.PRIMARY, fontWeight: FONTS.SEMIBOLD }}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 10 }}>
                      <Text style={{ color: COLORS.ERROR, fontWeight: FONTS.SEMIBOLD }}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                )
              })}
            >
              {(props) => <HomeScreen {...props} user={user} onLogout={handleLogout} onUpdateUser={setUser} />}
            </Stack.Screen>
            <Stack.Screen 
              name="Profile" 
              options={{ title: "Profile" }}
            >
              {(props) => <ProfileScreen {...props} user={user} onLogout={handleLogout} onUpdateUser={setUser} key={user?.id || 'profile'} />}
            </Stack.Screen>
            <Stack.Screen 
              name="History" 
              options={{ title: "History" }}
            >
              {(props) => <HistoryScreen {...props} user={user} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              options={{ title: "Login" }}
            >
              {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen 
              name="Register" 
              options={{ title: "Register" }}
            >
              {(props) => <RegisterScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
