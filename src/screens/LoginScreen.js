import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorPopup from "../components/ErrorPopup";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

export default function LoginScreen({ navigation, onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, message: "" });

  const handleLogin = async () => {
    if (!identifier || !password) {
      setErrorPopup({ visible: true, message: "Please fill all fields" });
      return;
    }

    setLoading(true);
    try {
            
      const response = await fetch("http://127.0.0.1:9001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        // Call onLogin to update user state in AuthNavigator
        onLogin(data.user);

        // Navigate to Home
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        setErrorPopup({ visible: true, message: data.message || "Login failed" });
      }
    } catch (error) {
      setErrorPopup({ visible: true, message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🏪</Text>
          </View>
        </View>
        <Text style={styles.title}>Kirana Store</Text>
        <Text style={styles.subtitle}>Welcome back! Login to continue</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email, Username, or Mobile</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email, username or mobile"
            placeholderTextColor={COLORS.GRAY_400}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="default"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.GRAY_400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>📝 Create New Account</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ErrorPopup
        visible={errorPopup.visible}
        message={errorPopup.message}
        onClose={() => setErrorPopup({ visible: false, message: "" })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING_XL,
    paddingBottom: SIZES.PADDING_2XL,
  },
  logoContainer: {
    marginBottom: SIZES.MARGIN_XL,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: SIZES.RADIUS_XL,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.MEDIUM,
  },
  logoText: {
    fontSize: SIZES.FONT_4XL,
  },
  title: {
    fontSize: SIZES.FONT_3XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SM,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: SIZES.RADIUS_2XL,
    borderTopRightRadius: SIZES.RADIUS_2XL,
    paddingHorizontal: SIZES.PADDING_XL,
    paddingTop: SIZES.PADDING_2XL,
    ...SHADOWS.LARGE,
  },
  inputContainer: {
    marginBottom: SIZES.MARGIN_LG,
  },
  inputLabel: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SM,
  },
  input: {
    height: SIZES.INPUT_HEIGHT,
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    paddingHorizontal: SIZES.PADDING_BASE,
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_PRIMARY,
  },
  button: {
    height: SIZES.BUTTON_HEIGHT,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS_BASE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.MARGIN_LG,
    marginBottom: SIZES.MARGIN_BASE,
    ...SHADOWS.MEDIUM,
  },
  buttonDisabled: {
    backgroundColor: COLORS.GRAY_300,
  },
  buttonText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_WHITE,
  },
  footer: {
    marginTop: SIZES.MARGIN_XL,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#10B981',
    paddingVertical: SIZES.PADDING_BASE,
    paddingHorizontal: SIZES.PADDING_2XL,
    borderRadius: SIZES.RADIUS_BASE,
    alignItems: 'center',
    ...SHADOWS.MEDIUM,
  },
  registerButtonText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
