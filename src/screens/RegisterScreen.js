import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorPopup from "../components/ErrorPopup";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";
import { BASE_URL } from "../services/baseUrl";

export default function RegisterScreen({ navigation, onLogin }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, title: "", message: "" });

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validateMobile = (value) => /^[0-9]{10}$/.test(value);

  const showError = (message, title = "Registration failed") => {
    setErrorPopup({ visible: true, title, message });
  };

  const handleRegister = async () => {
    setErrorPopup({ visible: false, title: "", message: "" });

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();

    if (!trimmedName) {
      showError("Please enter your full name.", "Name required");
      return;
    }

    if (!trimmedUsername) {
      showError("Please choose a username.", "Username required");
      return;
    }

    if (trimmedUsername.length < 3) {
      showError("Username must be at least 3 characters long.", "Username too short");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      showError("Please enter a valid email address.", "Invalid email");
      return;
    }

    if (!validateMobile(trimmedMobile)) {
      showError("Mobile number must be exactly 10 digits.", "Invalid mobile number");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters long.", "Password too short");
      return;
    }

    if (password !== confirmPassword) {
      showError("Password and confirm password do not match.", "Password mismatch");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          username: trimmedUsername,
          email: trimmedEmail,
          mobile: trimmedMobile,
          password,
          role: "SELLER",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.message || "Could not create your account. Please try again.");
        return;
      }

      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: trimmedEmail, password }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        await AsyncStorage.setItem("token", loginData.token);
        await AsyncStorage.setItem("user", JSON.stringify(loginData.user));
        const expiryTime = new Date().getTime() + 5 * 60 * 1000;
        await AsyncStorage.setItem("tokenExpiry", expiryTime.toString());
        onLogin?.(loginData.user);
      } else {
        showError("Your account was created, but auto-login failed. Please login manually.", "Account created");
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start building item lists faster</Text>
        </View>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Text style={styles.sectionSubtitle}>Seller accounts are available now</Text>
        </View>

        <AuthInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          focused={focusedField === "name"}
          onFocus={() => setFocusedField("name")}
          onBlur={() => setFocusedField("")}
          autoCapitalize="words"
        />

        <AuthInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          focused={focusedField === "username"}
          onFocus={() => setFocusedField("username")}
          onBlur={() => setFocusedField("")}
          autoCapitalize="none"
        />

        <AuthInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          focused={focusedField === "email"}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField("")}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AuthInput
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          placeholder="10-digit mobile number"
          focused={focusedField === "mobile"}
          onFocus={() => setFocusedField("mobile")}
          onBlur={() => setFocusedField("")}
          keyboardType="numeric"
          maxLength={10}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          focused={focusedField === "password"}
          onFocus={() => setFocusedField("password")}
          onBlur={() => setFocusedField("")}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
        />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          focused={focusedField === "confirmPassword"}
          onFocus={() => setFocusedField("confirmPassword")}
          onBlur={() => setFocusedField("")}
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((value) => !value)}
        />

        <View style={styles.roleContainer}>
          <Text style={styles.inputLabel}>Account Type</Text>
          <View style={[styles.roleOption, styles.roleOptionDisabled]}>
            <View style={styles.radioButtonDisabled} />
            <View style={styles.roleContent}>
              <Text style={styles.roleTextDisabled}>Buyer</Text>
              <Text style={styles.roleDescription}>Currently disabled</Text>
            </View>
          </View>
          <View style={[styles.roleOption, styles.roleOptionSelected]}>
            <View style={styles.radioButtonSelected}>
              <View style={styles.radioDot} />
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleText}>Seller</Text>
              <Text style={styles.roleDescription}>Create and manage item lists</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Creating account..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Login</Text>
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

function AuthInput({ label, focused, ...props }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.GRAY_400}
          returnKeyType="next"
          {...props}
        />
      </View>
    </View>
  );
}

function PasswordInput({ label, focused, visible, onToggle, ...props }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.GRAY_400}
          secureTextEntry={!visible}
          returnKeyType="next"
          {...props}
        />
        <TouchableOpacity style={styles.visibilityButton} onPress={onToggle} activeOpacity={0.75}>
          <Text style={styles.visibilityText}>{visible ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: (StatusBar.currentHeight || 0) + 26,
    paddingBottom: 86,
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
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.MARGIN_BASE,
    ...SHADOWS.MEDIUM,
  },
  logoImage: {
    width: 56,
    height: 56,
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
  roleContainer: {
    marginBottom: SIZES.MARGIN_BASE,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.PADDING_BASE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_LG,
    marginBottom: SIZES.MARGIN_SM,
    backgroundColor: COLORS.GRAY_50,
  },
  roleOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#EEF3FF',
  },
  roleOptionDisabled: {
    opacity: 0.6,
  },
  radioButtonSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.MARGIN_BASE,
  },
  radioButtonDisabled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.GRAY_300,
    marginRight: SIZES.MARGIN_BASE,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  roleContent: {
    flex: 1,
  },
  roleText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  roleTextDisabled: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.GRAY_500,
  },
  roleDescription: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  primaryButton: {
    height: SIZES.BUTTON_HEIGHT_LG,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS_LG,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.MARGIN_BASE,
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
