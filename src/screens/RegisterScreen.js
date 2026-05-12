import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
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
  const [isBuyer, setIsBuyer] = useState(true); // Default to Buyer
  const [isSeller, setIsSeller] = useState(false); // Seller disabled
  const [loading, setLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, message: "" });

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Mobile validation function
  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const handleRegister = async () => {
    setErrorPopup({ visible: false, message: "" });

    // Validation
    if (!name.trim()) {
      setErrorPopup({ visible: true, message: "Name is required" });
      return;
    }

    if (!username.trim()) {
      setErrorPopup({ visible: true, message: "Username is required" });
      return;
    }

    if (username.length < 3) {
      setErrorPopup({ visible: true, message: "Username must be at least 3 characters" });
      return;
    }

    if (!validateEmail(email)) {
      setErrorPopup({ visible: true, message: "Please enter a valid email address" });
      return;
    }

    if (!validateMobile(mobile)) {
      setErrorPopup({ visible: true, message: "Mobile number must be 10 digits" });
      return;
    }

    if (password.length < 6) {
      setErrorPopup({ visible: true, message: "Password must be at least 6 characters" });
      return;
    }

    if (password !== confirmPassword) {
      setErrorPopup({ visible: true, message: "Passwords do not match" });
      return;
    }

    if (!isBuyer && !isSeller) {
      setErrorPopup({ visible: true, message: "Please select either Buyer or Seller role" });
      return;
    }

    const role = isBuyer ? "BUYER" : "SELLER";

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, username, email, mobile, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Registration successful:", data);
        
        // Auto-login after successful registration
        try {
          const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ identifier: email, password }),
          });

          const loginData = await loginResponse.json();

          if (loginResponse.ok) {
            // Store token and user info
            await AsyncStorage.setItem("token", loginData.token);
            await AsyncStorage.setItem("user", JSON.stringify(loginData.user));
            
            // Set token expiry (5 minutes from now)
            const expiryTime = new Date().getTime() + 5 * 60 * 1000;
            await AsyncStorage.setItem("tokenExpiry", expiryTime.toString());
            
            console.log("Auto-login successful, calling onLogin and navigating to Home");
            console.log("loginData.user:", loginData.user);
            console.log("onLogin function:", onLogin);
            
            // Call onLogin to update user state in AuthNavigator
            if (onLogin) {
              onLogin(loginData.user);
            } else {
              console.error("onLogin is undefined!");
            }
            
            // Navigate to Home
            navigation.replace("Home");
          } else {
            console.log("Auto-login failed:", loginData);
            setErrorPopup({ visible: true, message: "Registration successful but auto-login failed. Please login manually." });
          }
        } catch (error) {
          console.error("Auto-login error:", error);
          setErrorPopup({ visible: true, message: "Registration successful but auto-login failed. Please login manually." });
        }
      } else {
        console.log("Registration failed:", data);
        setErrorPopup({ visible: true, message: data.message || "Registration failed" });
      }
    } catch (error) {
      console.error("Registration error:", error);
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
      <View>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      </View>
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🏪</Text>
          </View>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Kirana Store today</Text>
      </View>

      <ScrollView 
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.GRAY_400}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor={COLORS.GRAY_400}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.GRAY_400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={COLORS.GRAY_400}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor={COLORS.GRAY_400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor={COLORS.GRAY_400}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
        
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Select Role:</Text>
          
          <TouchableOpacity 
            style={[styles.roleOption, isBuyer && styles.roleOptionSelected]}
            onPress={() => {
              setIsBuyer(!isBuyer);
              if (!isBuyer) setIsSeller(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.radioButton, isBuyer && styles.radioButtonSelected]}>
              {isBuyer && <View style={styles.radioDot} />}
            </View>
            <View style={styles.roleContent}>
              <Text style={[styles.roleText, isBuyer && styles.roleTextSelected]}>🛒 Buyer</Text>
              <Text style={styles.roleDescription}>Shop for products</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.roleOption, styles.roleOptionDisabled]}
            disabled={true}
          >
            <View style={[styles.radioButton, styles.radioButtonDisabled]}>
              <View style={styles.radioDot} />
            </View>
            <View style={styles.roleContent}>
              <Text style={[styles.roleText, styles.roleTextDisabled]}>🏪 Seller (Coming Soon)</Text>
              <Text style={styles.roleDescription}>Sell your products</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating Account..." : "Create Account"}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.6}
          >
            <Text style={styles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
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
    paddingTop: SIZES.PADDING_2XL,
    paddingBottom: SIZES.PADDING_XL,
    paddingHorizontal: SIZES.PADDING_XL,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: SIZES.MARGIN_LG,
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
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING_XL,
    paddingTop: SIZES.PADDING_2XL,
    paddingBottom: SIZES.PADDING_2XL,
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
  roleContainer: {
    marginBottom: SIZES.MARGIN_LG,
  },
  roleLabel: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_BASE,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING_BASE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    marginBottom: SIZES.MARGIN_BASE,
    backgroundColor: COLORS.INPUT_BACKGROUND,
  },
  roleOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  roleOptionDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.GRAY_100,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: SIZES.RADIUS_FULL,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    marginRight: SIZES.MARGIN_BASE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.PRIMARY,
  },
  radioButtonDisabled: {
    borderColor: COLORS.GRAY_300,
    backgroundColor: COLORS.GRAY_300,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: SIZES.RADIUS_FULL,
    backgroundColor: COLORS.PRIMARY,
  },
  roleContent: {
    flex: 1,
  },
  roleText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  roleTextSelected: {
    color: COLORS.PRIMARY,
  },
  roleTextDisabled: {
    color: COLORS.GRAY_500,
  },
  roleDescription: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.MARGIN_BASE,
  },
  footerText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginRight: SIZES.MARGIN_SM,
  },
  linkButton: {
    paddingVertical: SIZES.PADDING_XS,
  },
  linkText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
  },
});
