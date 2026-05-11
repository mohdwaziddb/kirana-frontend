import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

export default function ProfileScreen({ user, onLogout, onUpdateUser }) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Sync local state with user prop changes
  useEffect(() => {
    if (user && user.name) {
      console.log('ProfileScreen: Setting name from user prop:', user.name);
      setName(user.name);
    }
  }, [user]);

  // Reload user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadUserName = async () => {
        try {
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            console.log('ProfileScreen: Loading name on focus:', userData.name);
            setName(userData.name);
          }
        } catch (error) {
          console.error('ProfileScreen: Error loading user from AsyncStorage:', error);
        }
      };
      loadUserName();
    }, [])
  );

  
  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:9001/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local user data
        const updatedUser = { ...user, name };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        
        if (onUpdateUser && typeof onUpdateUser === 'function') {
          onUpdateUser(updatedUser);
        } else {
          console.error("ProfileScreen: onUpdateUser is not a function or is missing");
        }
        
        setEditMode(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", data.message || "Profile update failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await fetch("http://127.0.0.1:9001/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("Password changed successfully. Please login with your new password.");
        // Instant logout
        if (onLogout) {
          onLogout();
        }
      } else {
        setError(data.message || "Current password is incorrect");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setName(user.name);
  };

  const handleLogout = () => {
    if (!onLogout) {
      Alert.alert("Error", "Logout function not available");
      return;
    }
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await onLogout();
            } catch (error) {
              console.error("Error during logout:", error);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account settings</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => editMode ? handleCancelEdit() : setEditMode(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>{editMode ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.label}>Full Name</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.value}>{name}</Text>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{user.username || "N/A"}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>{user.mobile || "N/A"}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === "BUYER" ? "🛒 Buyer" : "🏪 Seller"}
              </Text>
            </View>
          </View>

          {editMode && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Security</Text>
          </View>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {success && (
            <Text style={styles.successText}>{success}</Text>
          )}
          
          <View style={styles.infoSection}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor={COLORS.GRAY_400}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.GRAY_400}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.GRAY_400}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.passwordButton]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? "Updating..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: SIZES.PADDING_XL,
    paddingBottom: SIZES.PADDING_LG,
    paddingHorizontal: SIZES.PADDING_XL,
    borderBottomLeftRadius: SIZES.RADIUS_2XL,
    borderBottomRightRadius: SIZES.RADIUS_2XL,
    ...SHADOWS.MEDIUM,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SIZES.MARGIN_BASE,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: SIZES.RADIUS_FULL,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.FONT_2XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.FONT_2XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
    marginBottom: SIZES.MARGIN_XS,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.WHITE + 'CC',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.PADDING_BASE,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_LG,
    marginBottom: SIZES.MARGIN_BASE,
    ...SHADOWS.SMALL,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_LG,
  },
  cardTitle: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  editButton: {
    paddingHorizontal: SIZES.PADDING_BASE,
    paddingVertical: SIZES.PADDING_SM,
    backgroundColor: COLORS.PRIMARY + '20',
    borderRadius: SIZES.RADIUS_BASE,
  },
  editButtonText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
  },
  infoSection: {
    marginBottom: SIZES.MARGIN_LG,
  },
  label: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SIZES.MARGIN_SM,
  },
  value: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.MEDIUM,
  },
  roleBadge: {
    backgroundColor: COLORS.PRIMARY + '20',
    paddingHorizontal: SIZES.PADDING_BASE,
    paddingVertical: SIZES.PADDING_SM,
    borderRadius: SIZES.RADIUS_BASE,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
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
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT_SM,
    marginBottom: SIZES.MARGIN_BASE,
    textAlign: 'center',
    backgroundColor: COLORS.ERROR + '10',
    padding: SIZES.PADDING_SM,
    borderRadius: SIZES.RADIUS_BASE,
  },
  successText: {
    color: COLORS.SUCCESS,
    fontSize: SIZES.FONT_SM,
    marginBottom: SIZES.MARGIN_BASE,
    textAlign: 'center',
    backgroundColor: COLORS.SUCCESS + '10',
    padding: SIZES.PADDING_SM,
    borderRadius: SIZES.RADIUS_BASE,
  },
  button: {
    height: SIZES.BUTTON_HEIGHT,
    borderRadius: SIZES.RADIUS_BASE,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  buttonText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_WHITE,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SIZES.MARGIN_BASE,
  },
  saveButton: {
    backgroundColor: COLORS.SUCCESS,
    flex: 1,
  },
  passwordButton: {
    backgroundColor: COLORS.SECONDARY,
  },
});
