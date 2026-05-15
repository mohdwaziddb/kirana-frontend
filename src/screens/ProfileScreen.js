import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, StatusBar, Modal, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, SIZES, FONTS } from "../constants/theme";
import { BASE_URL } from "../services/baseUrl";

const { width } = Dimensions.get("window");

export default function ProfileScreen({ user, onLogout, onUpdateUser }) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (user && user.name) {
      setName(user.name);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      const loadUserName = async () => {
        try {
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            setName(userData.name);
          }
        } catch (error) {
          console.error('Error loading user:', error);
        }
      };
      loadUserName();
    }, [])
  );

  const handleUpdateProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (response.ok) {
        const storedUserStr = await AsyncStorage.getItem("user");
        const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};
        const serverUser = data.user || data;
        const updatedUser = {
          ...storedUser,
          ...user,
          ...serverUser,
          name: trimmedName,
        };

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setName(trimmedName);

        if (onUpdateUser && typeof onUpdateUser === 'function') {
          onUpdateUser(updatedUser);
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

      const response = await fetch(`${BASE_URL}/api/auth/change-password`, {
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
        setShowPasswordModal(false);
        Alert.alert("Success", "Password changed successfully. Please login with your new password.");
        if (onLogout) onLogout();
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
        { text: "Cancel", style: "cancel" },
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      {/* Modern Header with Gradient */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          {/* Decorative circles */}
          <View style={styles.circleTop} />
          <View style={styles.circleBottom} />
          <View style={styles.circleLeft} />
          <View style={styles.circleRight} />

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account</Text>

            {/* Profile Avatar - Bigger */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarOuter}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.avatarBadge}>
                  <Text style={styles.badgeIcon}>
                    {user.role === "BUYER" ? "🛒" : "🏪"}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.userName}>{name}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Personal Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>👤</Text>
              </View>
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, editMode && styles.editButtonActive]}
              onPress={() => editMode ? handleCancelEdit() : setEditMode(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.editButtonText, editMode && styles.editButtonTextActive]}>
                {editMode ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Full Name</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.GRAY_400}
              />
            ) : (
              <Text style={styles.value}>{name}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{user.username || "Not set"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>{user.mobile || "Not set"}</Text>
          </View>

          {editMode && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Security Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>🔐</Text>
              </View>
              <Text style={styles.cardTitle}>Security Settings</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.securityItem}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.securityItemLeft}>
              <Text style={styles.securityLabel}>Password</Text>
              <Text style={styles.securityValue}>Change your password</Text>
            </View>
            <View style={styles.chevron}>
              <Text style={styles.chevronText}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Type Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIconContainer, { backgroundColor: "#FFF3E0" }]}>
                <Text style={styles.cardIcon}>💼</Text>
              </View>
              <Text style={styles.cardTitle}>Account Type</Text>
            </View>
          </View>

          <View style={styles.roleContainer}>
            <View style={[styles.roleBadge, user.role === "BUYER" ? styles.buyerBadge : styles.sellerBadge]}>
              <Text style={styles.roleIcon}>
                {user.role === "BUYER" ? "🛒" : "🏪"}
              </Text>
              <Text style={[styles.roleText, user.role === "BUYER" ? styles.buyerText : styles.sellerText]}>
                {user.role === "BUYER" ? "Buyer Account" : "Seller Account"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.GRAY_400}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.GRAY_400}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.GRAY_400}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateButton, loading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={styles.updateButtonText}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: StatusBar.currentHeight + 24,
    paddingBottom: 100,
    paddingHorizontal: 24,
    position: "relative",
  },
  circleTop: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  circleBottom: {
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circleLeft: {
    position: "absolute",
    top: "30%",
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circleRight: {
    position: "absolute",
    top: "50%",
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerContent: {
    alignItems: "center",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 0,
  },
  avatarOuter: {
    width: 90,
    height: 90,
    borderRadius: 60,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 50,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeIcon: {
    fontSize: 20,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.WHITE,
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 16,
  },
  headerRoleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerRoleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    marginTop: -50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
  },
  editButtonActive: {
    backgroundColor: "#FFE8E8",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  editButtonTextActive: {
    color: "#E53935",
  },
  infoItem: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F2F5",
  },
  input: {
    height: 48,
    backgroundColor: "#F8F9FB",
    borderWidth: 1.5,
    borderColor: "#E8EAED",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  saveButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  securityItemLeft: {
    flex: 1,
  },
  securityLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  securityValue: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  chevronText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "300",
  },
  roleContainer: {
    alignItems: "flex-start",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buyerBadge: {
    backgroundColor: "#E8F5E9",
  },
  sellerBadge: {
    backgroundColor: "#FFF3E0",
  },
  roleIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  roleText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buyerText: {
    color: "#2E7D32",
  },
  sellerText: {
    color: "#E65100",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 50,
    backgroundColor: "#F8F9FB",
    borderWidth: 1.5,
    borderColor: "#E8EAED",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  alertBox: {
    backgroundColor: "#FFEBEE",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  alertText: {
    fontSize: 13,
    color: "#C62828",
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
  },
  updateButton: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.WHITE,
  },
});