import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SHADOWS, SIZES } from "../constants/theme";
import {
  addSellerProduct,
  deleteSellerProduct,
  getSellerProducts,
  updateSellerProduct,
} from "../services/productApi";
import CommonModal from "../components/CommonModal";

const emptyForm = {
  nameEnglish: "",
  nameHindi: "",
  pricePerUnit: "",
  unit: "",
  productImage: "",
  isProductLive: true,
};

const filters = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "hidden", label: "Hidden" },
];

const PAGE_SIZE = 25;
const MAX_PRODUCT_IMAGE_BYTES = 1.5 * 1024 * 1024;
const PRODUCT_IMAGE_COMPRESSION_STEPS = [
  { width: 1200, compress: 0.6 },
  { width: 900, compress: 0.5 },
  { width: 700, compress: 0.4 },
  { width: 500, compress: 0.3 },
];

export default function ProductScreen({ user }) {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [hindiNameTouched, setHindiNameTouched] = useState(false);
  const [productModal, setProductModal] = useState({
    visible: false,
    type: "success",
    title: "",
    message: "",
    confirmText: "OK",
    showCancel: false,
    onConfirm: null,
  });

  const canAddProduct = useMemo(() => {
    return form.nameEnglish.trim() && form.pricePerUnit.trim() && form.unit.trim();
  }, [form]);

  const loadProducts = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await getSellerProducts(user.id, { status, query });
      setProducts(Array.isArray(data) ? data : []);
      setVisibleCount(PAGE_SIZE);
    } catch (error) {
      Alert.alert("Products", error.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, [query, status, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleProductNameChange = (value) => {
    setForm((current) => ({
      ...current,
      nameEnglish: value,
      nameHindi: hindiNameTouched ? current.nameHindi : toHindiProductName(value),
    }));
  };

  const handleHindiNameChange = (value) => {
    setHindiNameTouched(true);
    updateForm("nameHindi", value);
  };

  const visibleProducts = products.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < products.length;

  const closeProductModal = () => {
    setProductModal((current) => ({ ...current, visible: false, onConfirm: null }));
  };

  const showProductModal = ({
    type = "success",
    title,
    message,
    confirmText = "OK",
    showCancel = false,
    onConfirm = null,
  }) => {
    setProductModal({
      visible: true,
      type,
      title,
      message,
      confirmText,
      showCancel,
      onConfirm,
    });
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Product photo", "Please allow photo access to select an image.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        const dataUri = await compressProductImage(asset);

        if (getDataUriSizeBytes(dataUri) > MAX_PRODUCT_IMAGE_BYTES) {
          showProductModal({
            type: "error",
            title: "Product Photo",
            message: "Image is too large even after compression. Please select a smaller photo.",
          });
          return;
        }

        updateForm("productImage", dataUri);
      }
    } catch (error) {
      console.log("Product photo error:", error);
      Alert.alert("Product photo", error?.message || "Unable to select product photo.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProductId(null);
    setHindiNameTouched(false);
  };

  const buildProductPayload = (price) => ({
    userId: user.id,
    nameEnglish: form.nameEnglish.trim(),
    nameHindi: form.nameHindi.trim() || form.nameEnglish.trim(),
    pricePerUnit: price,
    unit: form.unit.trim(),
    productImage: form.productImage,
    isProductLive: form.isProductLive,
  });

  const handleSaveProduct = async () => {
    if (!canAddProduct || saving) return;

    const price = Number(form.pricePerUnit);
    if (!Number.isFinite(price) || price <= 0) {
      showProductModal({
        type: "error",
        title: "Invalid Price",
        message: "Please enter a valid product price.",
      });
      return;
    }

    const isEditing = Boolean(editingProductId);
    setSaving(true);
    try {
      const payload = buildProductPayload(price);

      if (isEditing) {
        await updateSellerProduct(editingProductId, payload);
      } else {
        await addSellerProduct(payload);
      }

      resetForm();
      await loadProducts();
      showProductModal({
        type: "success",
        title: isEditing ? "Product Updated" : "Product Added",
        message: isEditing
          ? "Product details have been updated successfully."
          : "Product has been added successfully.",
      });
    } catch (error) {
      showProductModal({
        type: "error",
        title: "Product",
        message: error.message || "Unable to save product.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setForm({
      nameEnglish: product.nameEnglish || "",
      nameHindi: product.nameHindi || "",
      pricePerUnit: product.pricePerUnit == null ? "" : String(product.pricePerUnit),
      unit: product.unit || "",
      productImage: product.productImage || "",
      isProductLive: getLiveValue(product),
    });
    setHindiNameTouched(Boolean(product.nameHindi));
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const handleDeleteProduct = (product) => {
    showProductModal({
      type: "confirm",
      title: "Delete Product",
      message: `Delete ${product.nameEnglish || "this product"}?`,
      confirmText: "Delete",
      showCancel: true,
      onConfirm: () => confirmDeleteProduct(product),
    });
  };

  const confirmDeleteProduct = async (product) => {
    closeProductModal();
    try {
      await deleteSellerProduct(product.id, user.id);
      if (editingProductId === product.id) {
        resetForm();
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
      showProductModal({
        type: "success",
        title: "Product Deleted",
        message: "Product has been deleted successfully.",
      });
    } catch (error) {
      showProductModal({
        type: "error",
        title: "Product",
        message: error.message || "Unable to delete product.",
      });
    }
  };

  const handleDeleteAllProducts = () => {
    if (products.length === 0) return;

    showProductModal({
      type: "confirm",
      title: "Delete All Products",
      message: `Delete all ${products.length} products shown in this list?`,
      confirmText: "Delete All",
      showCancel: true,
      onConfirm: confirmDeleteAllProducts,
    });
  };

  const confirmDeleteAllProducts = async () => {
    closeProductModal();
    const productsToDelete = [...products];

    try {
      await Promise.all(productsToDelete.map((product) => deleteSellerProduct(product.id, user.id)));
      resetForm();
      setProducts([]);
      setVisibleCount(PAGE_SIZE);
      showProductModal({
        type: "success",
        title: "Products Deleted",
        message: "All products have been deleted successfully.",
      });
    } catch (error) {
      await loadProducts();
      showProductModal({
        type: "error",
        title: "Delete Failed",
        message: error.message || "Unable to delete all products.",
      });
    }
  };

  const handleToggleLive = async (product) => {
    if (togglingId) return;

    const nextLive = !getLiveValue(product);
    setTogglingId(product.id);
    try {
      const updated = await updateSellerProduct(product.id, {
        ...product,
        userId: user.id,
        isProductLive: nextLive,
      });

      setProducts((current) =>
        current
          .map((item) => (item.id === product.id ? updated : item))
          .filter((item) => {
            if (status === "live") return getLiveValue(item);
            if (status === "hidden") return !getLiveValue(item);
            return true;
          })
      );
      showProductModal({
        type: "success",
        title: "Status Updated",
        message: nextLive
          ? "Product is now live for buyers."
          : "Product is now hidden from buyers.",
      });
    } catch (error) {
      showProductModal({
        type: "error",
        title: "Product",
        message: error.message || "Unable to update product status.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.circleTop} />
          <View style={styles.circleBottom} />
          <View style={styles.circleRight} />
          <View style={styles.headerContent}>
            <Text style={styles.headerEyebrow}>Seller catalog</Text>
            <Text style={styles.headerTitle}>Products</Text>
            <Text style={styles.headerSubtitle}>Manage products buyers can see</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>{editingProductId ? "Edit Product" : "Add Product"}</Text>
              <Text style={styles.panelSubtitle}>{editingProductId ? "Update details and availability" : "Create a product with price and unit"}</Text>
            </View>
            <View style={styles.liveRow}>
              <Text style={styles.liveText}>Live</Text>
              <Switch
                value={form.isProductLive}
                onValueChange={(value) => updateForm("isProductLive", value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.PRIMARY_LIGHT }}
                thumbColor={form.isProductLive ? COLORS.PRIMARY : COLORS.WHITE}
              />
            </View>
          </View>

          <View style={styles.row}>
            <ProductInput
              label="Product Name"
              value={form.nameEnglish}
              placeholder="Rice, Sugar, Tea"
              onChangeText={handleProductNameChange}
              style={styles.rowInput}
            />
            <ProductInput
              label="Hindi Name"
              value={form.nameHindi}
              placeholder="Optional"
              onChangeText={handleHindiNameChange}
              style={styles.rowInput}
            />
          </View>
          <View style={styles.row}>
            <ProductInput
              label="Price"
              value={form.pricePerUnit}
              placeholder="45"
              keyboardType="decimal-pad"
              onChangeText={(value) => updateForm("pricePerUnit", value)}
              style={styles.rowInput}
            />
            <ProductInput
              label="Unit"
              value={form.unit}
              placeholder="kg, pcs"
              onChangeText={(value) => updateForm("unit", value)}
              style={styles.rowInput}
            />
          </View>

          <View style={styles.photoSection}>
            {form.productImage ? (
              <Image source={{ uri: form.productImage }} style={styles.formPhoto} />
            ) : (
              <View style={styles.formPhotoPlaceholder}>
                <Text style={styles.formPhotoPlaceholderText}>Photo</Text>
              </View>
            )}
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage} activeOpacity={0.85}>
                <Text style={styles.photoButtonText}>
                  {form.productImage ? "Change Photo" : "Add Photo"}
                </Text>
              </TouchableOpacity>
              {form.productImage ? (
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => updateForm("productImage", "")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.formButtonRow}>
            {editingProductId ? (
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm} activeOpacity={0.85}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.addButton,
                (!canAddProduct || saving) && styles.buttonDisabled,
              ]}
              onPress={handleSaveProduct}
              activeOpacity={0.85}
              disabled={!canAddProduct || saving}
            >
              <Text style={styles.addButtonText}>
                {saving ? "Saving..." : editingProductId ? "Update Product" : "Add Product"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterPanel}>
          <View style={styles.countRow}>
            <View>
              <Text style={styles.countTitle}>Total Products</Text>
              <Text style={styles.countValue}>{products.length} items</Text>
            </View>
            <TouchableOpacity
              style={[styles.deleteAllButton, products.length === 0 && styles.buttonDisabled]}
              onPress={handleDeleteAllProducts}
              activeOpacity={0.85}
              disabled={products.length === 0}
            >
              <Text style={styles.deleteAllButtonText}>Delete All</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products"
            placeholderTextColor={COLORS.GRAY_400}
          />
          <View style={styles.filterRow}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterButton, status === filter.key && styles.filterButtonActive]}
                onPress={() => setStatus(filter.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, status === filter.key && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Add a product or change the filter.</Text>
          </View>
        ) : (
          <>
          {visibleProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                {product.productImage ? (
                  <Image source={{ uri: product.productImage }} style={styles.productPhoto} />
                ) : (
                  <View style={styles.productPhotoPlaceholder}>
                    <Text style={styles.productPhotoPlaceholderText}>{getProductInitial(product)}</Text>
                  </View>
                )}
                <View style={styles.productNameBlock}>
                  <Text style={styles.productName}>{product.nameEnglish}</Text>
                  <Text style={styles.productHindi}>{product.nameHindi || product.nameEnglish}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.statusPill,
                    getLiveValue(product) ? styles.livePill : styles.hiddenPill,
                  ]}
                  onPress={() => handleToggleLive(product)}
                  activeOpacity={0.8}
                  disabled={togglingId === product.id}
                >
                  <Text
                    style={[
                      styles.statusText,
                      getLiveValue(product) ? styles.livePillText : styles.hiddenPillText,
                    ]}
                  >
                    {togglingId === product.id ? "Saving" : getLiveValue(product) ? "Live" : "Hidden"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.priceText}>Rs {product.pricePerUnit || 0} / {product.unit || "-"}</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditProduct(product)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduct(product)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {hasMoreProducts ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
              activeOpacity={0.85}
            >
              <Text style={styles.loadMoreText}>
                Load More ({products.length - visibleCount} left)
              </Text>
            </TouchableOpacity>
          ) : null}
          </>
        )}
      </ScrollView>

      <CommonModal
        visible={productModal.visible}
        type={productModal.type}
        title={productModal.title}
        message={productModal.message}
        confirmText={productModal.confirmText}
        cancelText="Cancel"
        showCancel={productModal.showCancel}
        showOnlyConfirm={!productModal.showCancel}
        onConfirm={productModal.onConfirm || closeProductModal}
        onCancel={closeProductModal}
      />
    </View>
  );
}

function ProductInput({ label, style, ...props }) {
  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.GRAY_400}
        autoCapitalize="words"
        {...props}
      />
    </View>
  );
}

function getLiveValue(product) {
  return product.isProductLive ?? product.productLive ?? true;
}

function getProductInitial(product) {
  return String(product?.nameEnglish || product?.nameHindi || "P")
    .trim()
    .charAt(0)
    .toUpperCase() || "P";
}

function toHindiProductName(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  return text
    .split(/(\s+|[-_/(),]+)/)
    .map((part) => transliterateEnglishWord(part))
    .join("");
}

function transliterateEnglishWord(word) {
  if (!/^[a-zA-Z]+$/.test(word) || /[\u0900-\u097F]/.test(word)) {
    return word;
  }

  const lowerWord = word.toLowerCase();

  if (lowerWord.endsWith("ange")) {
    return `${transliterateEnglishWord(lowerWord.slice(0, -4))}ेंज`;
  }

  if (lowerWord.endsWith("ice")) {
    return `${transliterateEnglishWord(lowerWord.slice(0, -3))}ाइस`;
  }

  let result = "";
  let index = 0;

  while (index < lowerWord.length) {
    const pair = lowerWord.slice(index, index + 2);

    if (consonantPairs[pair]) {
      const consumed = appendConsonantSound(lowerWord, index + 2, consonantPairs[pair]);
      result += consumed.text;
      index += 2 + consumed.vowelsUsed;
      continue;
    }

    const char = lowerWord[index];

    if (consonantSounds[char]) {
      const consumed = appendConsonantSound(lowerWord, index + 1, consonantSounds[char]);
      result += consumed.text;
      index += 1 + consumed.vowelsUsed;
      continue;
    }

    result += standaloneVowels[char] || word[index] || char;
    index += 1;
  }

  return result;
}

function appendConsonantSound(word, nextIndex, sound) {
  const vowelInfo = getFollowingVowelSound(word, nextIndex);

  if (vowelInfo.vowelsUsed > 0) {
    return {
      text: sound + vowelInfo.sign,
      vowelsUsed: vowelInfo.vowelsUsed + vowelInfo.extraLettersUsed,
    };
  }

  const nextPair = word.slice(nextIndex, nextIndex + 2);
  const nextChar = word[nextIndex];
  const needsHalant = Boolean(nextChar && (consonantPairs[nextPair] || consonantSounds[nextChar]));

  return {
    text: sound + (needsHalant ? "्" : ""),
    vowelsUsed: 0,
  };
}

function getFollowingVowelSound(word, vowelIndex) {
  const current = word[vowelIndex];
  const next = word[vowelIndex + 1];
  const afterNext = word[vowelIndex + 2];

  if (!current || !vowelSigns[current]) {
    return { sign: "", vowelsUsed: 0, extraLettersUsed: 0 };
  }

  if (`${current}${next}` === "ai") {
    return { sign: "ै", vowelsUsed: 2, extraLettersUsed: 0 };
  }

  if (`${current}${next}` === "ee" || `${current}${next}` === "ea") {
    return { sign: "ी", vowelsUsed: 2, extraLettersUsed: 0 };
  }

  if (`${current}${next}` === "oo") {
    return { sign: "ू", vowelsUsed: 2, extraLettersUsed: 0 };
  }

  if (current === "a" && next === "n" && afterNext && consonantSounds[afterNext]) {
    return { sign: "ैं", vowelsUsed: 1, extraLettersUsed: 1 };
  }

  if (current === "a" && (next === "m" || next === "n") && afterNext && consonantSounds[afterNext]) {
    return { sign: "ै", vowelsUsed: 1, extraLettersUsed: 0 };
  }

  return { sign: vowelSigns[current], vowelsUsed: 1, extraLettersUsed: 0 };
}

const consonantPairs = {
  ch: "च",
  sh: "श",
  th: "थ",
  ph: "फ",
  kh: "ख",
  gh: "घ",
};

const consonantSounds = {
  b: "ब",
  c: "क",
  d: "ड",
  f: "फ",
  g: "ग",
  h: "ह",
  j: "ज",
  k: "क",
  l: "ल",
  m: "म",
  n: "न",
  p: "प",
  q: "क",
  r: "र",
  s: "स",
  t: "ट",
  v: "व",
  w: "व",
  x: "क्स",
  y: "य",
  z: "ज",
};

const vowelSigns = {
  a: "ा",
  e: "े",
  i: "ि",
  o: "ो",
  u: "ु",
};

const standaloneVowels = {
  a: "अ",
  e: "ए",
  i: "इ",
  o: "ऑ",
  u: "उ",
};

async function readImageAsDataUri(uri) {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

async function compressProductImage(asset) {
  const mimeType = asset.mimeType || "image/jpeg";
  const originalDataUri = asset.base64
    ? `data:${mimeType};base64,${asset.base64}`
    : await readImageAsDataUri(asset.uri);

  if (getDataUriSizeBytes(originalDataUri) <= MAX_PRODUCT_IMAGE_BYTES) {
    return originalDataUri;
  }

  let smallestDataUri = originalDataUri;

  for (const step of PRODUCT_IMAGE_COMPRESSION_STEPS) {
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: step.width } }],
      {
        compress: step.compress,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    const dataUri = manipulated.base64
      ? `data:image/jpeg;base64,${manipulated.base64}`
      : await readImageAsDataUri(manipulated.uri);

    if (getDataUriSizeBytes(dataUri) < getDataUriSizeBytes(smallestDataUri)) {
      smallestDataUri = dataUri;
    }

    if (getDataUriSizeBytes(dataUri) <= MAX_PRODUCT_IMAGE_BYTES) {
      return dataUri;
    }
  }

  return smallestDataUri;
}

function getDataUriSizeBytes(dataUri) {
  const base64 = String(dataUri || "").split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
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
    paddingTop: (StatusBar.currentHeight || 0) + 24,
    paddingHorizontal: 24,
    paddingBottom: 86,
    position: "relative",
  },
  headerContent: {
    zIndex: 1,
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
  circleRight: {
    position: "absolute",
    top: "36%",
    right: -34,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerEyebrow: {
    fontSize: SIZES.FONT_SM,
    color: "rgba(255,255,255,0.82)",
    fontWeight: FONTS.SEMIBOLD,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT_SM,
    color: "rgba(255,255,255,0.82)",
    marginTop: 6,
  },
  content: {
    flex: 1,
    marginTop: -58,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  panel: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_XL,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8EEF8",
    ...SHADOWS.MEDIUM,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  panelTitle: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  panelSubtitle: {
    fontSize: SIZES.FONT_XS,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.GRAY_50,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    paddingLeft: 10,
    minHeight: 38,
  },
  liveText: {
    fontSize: SIZES.FONT_XS,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
  },
  inputGroup: {
    marginBottom: 7,
  },
  inputLabel: {
    fontSize: SIZES.FONT_XS,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.GRAY_50,
    paddingHorizontal: 10,
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_PRIMARY,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  rowInput: {
    flex: 1,
  },
  addButton: {
    flex: 1,
    height: 44,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: FONTS.BOLD,
    fontSize: SIZES.FONT_SM,
  },
  formButtonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.GRAY_100,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: FONTS.BOLD,
    fontSize: SIZES.FONT_SM,
  },
  buttonDisabled: {
    backgroundColor: COLORS.GRAY_300,
  },
  photoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
    marginBottom: 10,
    backgroundColor: COLORS.GRAY_50,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    padding: 8,
  },
  formPhoto: {
    width: 58,
    height: 58,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.GRAY_100,
  },
  formPhotoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.GRAY_100,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  formPhotoPlaceholderText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
  },
  photoActions: {
    flex: 1,
    gap: 6,
  },
  photoButton: {
    height: 34,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  photoButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: FONTS.BOLD,
    fontSize: SIZES.FONT_SM,
  },
  removePhotoButton: {
    height: 32,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoText: {
    color: COLORS.ERROR,
    fontWeight: FONTS.BOLD,
    fontSize: SIZES.FONT_SM,
  },
  filterPanel: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_XL,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8EEF8",
    ...SHADOWS.SMALL,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    paddingHorizontal: 12,
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  countTitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
  },
  countValue: {
    marginTop: 4,
    color: COLORS.PRIMARY,
    fontSize: SIZES.FONT_XL,
    fontWeight: FONTS.BOLD,
  },
  deleteAllButton: {
    height: 32,
    borderRadius: SIZES.RADIUS_BASE,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.WHITE,
  },
  deleteAllButtonText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    height: 40,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.GRAY_100,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
  },
  filterTextActive: {
    color: COLORS.WHITE,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 10,
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: SIZES.FONT_SM,
  },
  emptyBox: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_XL,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EEF8",
  },
  emptyTitle: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  productCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8EEF8",
    ...SHADOWS.SMALL,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  productNameBlock: {
    flex: 1,
  },
  productPhoto: {
    width: 54,
    height: 54,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.GRAY_100,
  },
  productPhotoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  productPhotoPlaceholderText: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
  },
  productName: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  productHindi: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 3,
  },
  statusPill: {
    minWidth: 70,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  livePill: {
    backgroundColor: "#E8F5E9",
  },
  hiddenPill: {
    backgroundColor: "#FFF3E0",
  },
  statusText: {
    fontSize: SIZES.FONT_XS,
    fontWeight: FONTS.BOLD,
  },
  livePillText: {
    color: "#2E7D32",
  },
  hiddenPillText: {
    color: "#E65100",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_100,
  },
  priceText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    flex: 1,
    height: 38,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
  },
  deleteButton: {
    flex: 1,
    height: 38,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
  },
  loadMoreButton: {
    height: 44,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  loadMoreText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
  },
});
