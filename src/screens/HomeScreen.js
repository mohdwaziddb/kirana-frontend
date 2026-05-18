import React, { useCallback, useRef, useState, useEffect } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, ScrollView, Text, View, StyleSheet, StatusBar, TouchableOpacity, Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { processTextAPI } from "../services/textApi";
import { uploadImageAPI } from "../services/imageApi";
import TextInputCard from "../components/TextInputCard";
import EditableTable from "../components/EditableTable";
import CommonModal from "../components/CommonModal";
import { COLORS } from "../constants/theme";

export default function HomeScreen({ user: initialUser, onLogout, onUpdateUser, navigation, scanRequestId = 0, onScanRequestHandled }) {

  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const scanInProgressRef = useRef(false);
  const [user, setUser] = useState(initialUser);
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imageError, setImageError] = useState({ visible: false, message: "" });
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [isScanningImage, setIsScanningImage] = useState(false);

  const areUsersEqual = (currentUser, nextUser) => {
    if (!currentUser && !nextUser) return true;
    if (!currentUser || !nextUser) return false;

    const keys = ["id", "name", "email", "username", "mobile", "role"];
    return keys.every((key) => String(currentUser?.[key] ?? "") === String(nextUser?.[key] ?? ""));
  };

  const mergeUserData = (nextUser) => {
    if (!nextUser) return;
    setUser((currentUser) => {
      const mergedUser = { ...(currentUser || {}), ...nextUser };
      return areUsersEqual(currentUser, mergedUser) ? currentUser : mergedUser;
    });
  };

  useEffect(() => {
    mergeUserData(initialUser);
  }, [initialUser]);

  useEffect(() => {
    Keyboard.dismiss();
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.activeElement?.blur?.();
    }
  }, []);

  const updateUserHandler = onUpdateUser || mergeUserData;

  const normalizeItems = (value) => {
    if (!Array.isArray(value)) return [];

    return value
      .filter(Boolean)
      .map((item) => {
        const quantity = item.quantity == null ? "" : String(item.quantity);
        const price = item.price == null ? "" : String(item.price);
        return {
          name: item.name || item.itemName || item.item || "",
          quantity,
          price,
          total: item.total || ((parseFloat(quantity) || 0) * (parseFloat(price) || 0)),
          matched: item.matched || false,
        };
      })
      .filter((item) => item.name.trim() !== "");
  };

  const appendItemsToTable = (nextItems) => {
    const normalizedItems = normalizeItems(nextItems);
    if (normalizedItems.length === 0) return [];

    setItems((currentItems) => {
      const existingItems = normalizeItems(currentItems);
      return [...existingItems, ...normalizedItems];
    });

    setShowResult(true);
    return normalizedItems;
  };

  const syncTableItems = useCallback((nextItems) => {
    const normalizedItems = normalizeItems(nextItems);
    setItems((currentItems) => (
      areItemListsEqual(normalizeItems(currentItems), normalizedItems) ? currentItems : normalizedItems
    ));
    setShowResult(normalizedItems.length > 0);
    return normalizedItems;
  }, []);

  const areItemListsEqual = (currentItems, nextItems) => {
    if (currentItems.length !== nextItems.length) return false;

    return nextItems.every((nextItem, index) => {
      const currentItem = currentItems[index] || {};
      return String(currentItem.name || "") === String(nextItem.name || "")
        && String(currentItem.quantity || "") === String(nextItem.quantity || "")
        && String(currentItem.price || "") === String(nextItem.price || "")
        && Number(currentItem.total || 0) === Number(nextItem.total || 0)
        && Boolean(currentItem.matched) === Boolean(nextItem.matched);
    });
  };

  const handleText = async () => {
    if (!input.trim() || isProcessingText) return;

    try {
      setIsProcessingText(true);
      const data = await processTextAPI(input, user?.id);
      appendItemsToTable(filterProcessedItems(data, input));
      setInput("");
    } finally {
      setIsProcessingText(false);
    }
  };

  const filterProcessedItems = (processedItems, sourceText) => {
    if (!Array.isArray(processedItems)) return [];

    const tokens = getInputItemTokens(sourceText);
    if (tokens.length === 0) return [];

    return tokens
      .map((token) => findBestProcessedItem(processedItems, token))
      .filter(Boolean);
  };

  const findBestProcessedItem = (processedItems, token) => {
    let bestItem = null;
    let bestScore = -1;

    processedItems.forEach((item, index) => {
      const itemName = normalizeText(item?.name || item?.itemName || item?.item || "");
      if (!itemName) return;

      const score = getMatchScore(itemName, token) - index * 0.001;
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    });

    return bestScore > 0 ? bestItem : null;
  };

  const getMatchScore = (itemName, token) => {
    const itemKey = normalizeProductKey(itemName);
    const tokenKey = normalizeProductKey(token);

    if (!itemKey || !tokenKey) return 0;
    if (itemKey === tokenKey) return 1000 + itemKey.length;
    if (itemKey.includes(tokenKey)) return 700 + tokenKey.length;
    if (tokenKey.includes(itemKey)) return 500 + itemKey.length;

    const itemWords = new Set(itemKey.match(/[a-z]+|\d+/g) || []);
    const tokenWords = new Set(tokenKey.match(/[a-z]+|\d+/g) || []);
    let commonWords = 0;
    tokenWords.forEach((word) => {
      if (itemWords.has(word)) commonWords += 1;
    });

    return commonWords;
  };

  const getInputItemTokens = (value) => {
    return String(value || "")
      .split(/[\n\r,;]+/)
      .map((part) => normalizeText(part.replace(/\s+\d+(\.\d+)?\s*(kg|g|gm|ltr|l|ml|pcs)?\s*$/i, "")))
      .filter((part) => part.length > 0);
  };

  const normalizeText = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizeProductKey = (value) => {
    return normalizeText(value)
      .replace(/\b(wali|wala|wale|waali|waala|waale)\b/g, "")
      .replace(/\s+/g, "");
  };

  const prepareImageForUpload = async (asset) => {
    if (Platform.OS === "web") return asset;

    const uri = asset?.uri;
    if (!uri) return asset;

    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: 0.75,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      ...asset,
      uri: manipulated.uri,
      fileName: "scan.jpg",
      name: "scan.jpg",
      mimeType: "image/jpeg",
      type: "image/jpeg",
    };
  };

  const ensureImagePickerAccess = async () => {
    if (Platform.OS === "web" || Platform.OS === "android") return true;

    const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (currentPermission.granted) return true;

    if (currentPermission.canAskAgain === false) {
      setImageError({
        visible: true,
        message: "Photo access is blocked. Please enable photo permission from app settings and try again.",
      });
      return false;
    }

    const requestedPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!requestedPermission.granted) {
      setImageError({
        visible: true,
        message: "Photo access is required to scan an image. Please allow photo access and try again.",
      });
      return false;
    }

    return true;
  };

  const handleGalleryScan = useCallback(async () => {
    if (scanInProgressRef.current) return;
    scanInProgressRef.current = true;

    try {
      const hasPickerAccess = await ensureImagePickerAccess();
      if (!hasPickerAccess) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        if (!user?.id) {
          setImageError({
            visible: true,
            message: "Login session not found. Please logout, login again, and try scan.",
          });
          return;
        }

        const imageAsset = await prepareImageForUpload(result.assets[0]);
        let imageResult;
        try {
          setIsScanningImage(true);
          imageResult = await uploadImageAPI(imageAsset, setExtractedText, user?.id);
        } catch (uploadError) {
          console.log('Image upload error:', uploadError);
          setImageError({
            visible: true,
            message: uploadError.message || "Image selected, but scan upload failed. Please check internet and try again.",
          });
          return;
        }

        const extractedItems = normalizeItems(imageResult.items);

        if (extractedItems.length === 0) {
          const hasOcrText = imageResult.extractedText && !imageResult.extractedText.startsWith("Error:");
          setImageError({
            visible: true,
            message: hasOcrText
              ? "Image text was read, but no matching table items were found for your product list. Please try a clearer image or add products first."
              : imageResult.extractedText || "No items found in this image. Please try a clearer image.",
          });
          return;
        }

        appendItemsToTable(extractedItems);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.log('Gallery error:', error);
      setImageError({
        visible: true,
        message: error?.message || "Unable to open or scan image. Please try again.",
      });
    } finally {
      scanInProgressRef.current = false;
      setIsScanningImage(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!scanRequestId) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        await handleGalleryScan();
      } finally {
        if (!cancelled) {
          onScanRequestHandled?.();
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scanRequestId, handleGalleryScan, onScanRequestHandled]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const scrollToSuggestions = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: scrollYRef.current + 110,
        animated: true,
      });
    }, 80);
  };

  const scrollToTableRow = (index = 0) => {
    if (Platform.OS === "ios") return;

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: scrollYRef.current + 150 + index * 46,
        animated: true,
      });
    }, 180);
  };

  if (!user) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      enabled={Platform.OS === "ios"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />

          <View style={styles.headerContent}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userNameText}>{user?.name || 'Friend'}</Text>
            <Text style={styles.welcomeText}>Ready to manage your inventory?</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.scrollContent}
      >
        <TextInputCard
          input={input}
          setInput={setInput}
          onProcess={handleText}
          userId={user?.id}
          isProcessing={isProcessingText}
        />

        <EditableTable
          data={items}
          userId={user?.id}
          storeName={user?.name}
          onItemsChange={syncTableItems}
          onUpdateUser={updateUserHandler}
          onSuggestionsVisible={scrollToSuggestions}
          onRowInputFocus={scrollToTableRow}
        />
      </ScrollView>

      <Modal transparent visible={isScanningImage} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingTitle}>Scanning image...</Text>
            <Text style={styles.loadingText}>Table data milte hi list update ho jayegi.</Text>
          </View>
        </View>
      </Modal>

      <CommonModal
        visible={showSuccessModal}
        type="success"
        image="🎉"
        title="Success!"
        message="Items extracted from image and added to list!"
        confirmText="Great"
        showOnlyConfirm={true}
        autoCloseTime={1200}
        onConfirm={() => setShowSuccessModal(false)}
      />

      <CommonModal
        visible={imageError.visible}
        type="error"
        image="❌"
        title="Image Error"
        message={imageError.message}
        confirmText="OK"
        showOnlyConfirm={true}
        onConfirm={() => setImageError({ visible: false, message: "" })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  fallbackText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },

  // Header
  headerContainer: {
    overflow: 'hidden',
  },
  headerGradient: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: (StatusBar.currentHeight || 0) + 16,
    paddingBottom: 70,
    paddingHorizontal: 24,
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle3: {
    position: 'absolute',
    top: '30%',
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    zIndex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  userNameText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.WHITE,
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },

  content: {
    flex: 1,
    marginTop: -85,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 150,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  loadingText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
});
