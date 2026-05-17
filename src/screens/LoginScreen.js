import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorPopup from "../components/ErrorPopup";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";
import { BASE_URL } from "../services/baseUrl";
import { APP_VERSION } from "../services/appVersion";

export default function LoginScreen({ navigation, onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, title: "", message: "" });

  const showError = (message, title = "Login failed") => {
    setErrorPopup({ visible: true, title, message });
  };

  const handleLogin = async () => {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier || !password) {
      showError("Please enter your email, username, or mobile number and password.", "Missing details");
      return;
    }

    setLoading(true);
    try {
      console.log("App version:", APP_VERSION);

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: trimmedIdentifier, password, appVersion: APP_VERSION }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("appVersion", APP_VERSION);
        Keyboard.dismiss();
        onLogin(data.user);
      } else if (data.code === "APP_VERSION_MISMATCH") {
        console.log("Version mismatch:", {
          frontendVersion: data.frontendVersion,
          backendVersion: data.backendVersion,
        });
        showError(
          data.message || "App version update required. Kripya app update karein ya Admin se contact karein. Support: 8130703196",
          "App Version Issue"
        );
      } else {
        showError(data.message || "Please check your login details and try again.");
      }
    } catch (error) {
      showError("Could not connect to the server. Please check your internet connection and try again.", "Network error");
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

      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.circleTop} />
          <View style={styles.circleBottom} />
          <View style={styles.logo}>
            <Image source={require("../../assets/icon.png")} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Kirana Store</Text>
          <Text style={styles.subtitle}>Sign in to manage your item lists</Text>
        </View>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Welcome Back</Text>
          <Text style={styles.sectionSubtitle}>Use your registered account details</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email, Username, or Mobile</Text>
          <View style={[styles.inputShell, focusedField === "identifier" && styles.inputShellFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Enter email, username, or mobile"
              placeholderTextColor={COLORS.GRAY_400}
              value={identifier}
              onChangeText={setIdentifier}
              onFocus={() => setFocusedField("identifier")}
              onBlur={() => setFocusedField("")}
              autoCapitalize="none"
              keyboardType="default"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={[styles.inputShell, focusedField === "password" && styles.inputShellFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={COLORS.GRAY_400}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField("")}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.visibilityButton}
              onPress={() => setShowPassword((value) => !value)}
              activeOpacity={0.75}
            >
              <Text style={styles.visibilityText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to Kirana Store?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ErrorPopup
        visible={errorPopup.visible}
        title={errorPopup.title}
        message={errorPopup.message}
        onClose={() => setErrorPopup({ visible: false, title: "", message: "" })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  headerContainer: {
    overflow: "hidden",
  },
  headerGradient: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: (StatusBar.currentHeight || 0) + 28,
    paddingBottom: 92,
    paddingHorizontal: SIZES.PADDING_XL,
    alignItems: "center",
    position: "relative",
  },
  circleTop: {
    position: "absolute",
    top: -90,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  circleBottom: {
    position: "absolute",
    bottom: -70,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.MARGIN_BASE,
    ...SHADOWS.MEDIUM,
  },
  logoImage: {
    width: 58,
    height: 58,
    borderRadius: 18,
    resizeMode: "contain",
  },
  title: {
    fontSize: SIZES.FONT_3XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
    textAlign: "center",
  },
  subtitle: {
    fontSize: SIZES.FONT_BASE,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    marginTop: SIZES.MARGIN_SM,
  },
  formContainer: {
    flex: 1,
    marginTop: -48,
  },
  scrollContent: {
    marginHorizontal: SIZES.MARGIN_BASE,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_XL,
    paddingBottom: SIZES.PADDING_2XL,
    ...SHADOWS.MEDIUM,
  },
  sectionHeader: {
    marginBottom: SIZES.MARGIN_XL,
  },
  sectionTitle: {
    fontSize: SIZES.FONT_2XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  sectionSubtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SIZES.MARGIN_XS,
  },
  inputContainer: {
    marginBottom: SIZES.MARGIN_LG,
  },
  inputLabel: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SM,
  },
  inputShell: {
    height: SIZES.INPUT_HEIGHT + 4,
    backgroundColor: COLORS.GRAY_50,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_LG,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.PADDING_BASE,
  },
  inputShellFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.WHITE,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: 0,
  },
  visibilityButton: {
    minWidth: 50,
    alignItems: "flex-end",
    paddingLeft: SIZES.PADDING_SM,
  },
  visibilityText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  primaryButton: {
    height: SIZES.BUTTON_HEIGHT_LG,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS_LG,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.MARGIN_SM,
    ...SHADOWS.MEDIUM,
  },
  buttonDisabled: {
    backgroundColor: COLORS.GRAY_300,
  },
  primaryButtonText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.MARGIN_XL,
    gap: SIZES.MARGIN_XS,
  },
  footerText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
  },
  footerLink: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
});
