import { useRef, useState } from "react";
import { Keyboard, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";
import { getSellerProducts } from "../services/productApi";

export default function TextInputCard({ input, setInput, onProcess, userId, onSuggestionsVisible, isProcessing = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const requestRef = useRef(0);

  const clearSuggestions = () => {
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getCurrentFragment = (value) => {
    const match = String(value || "").match(/([^,\n\r]*)$/);
    return (match?.[1] || "").trim();
  };

  const handleChangeText = async (value) => {
    setInput(value);

    const fragment = getCurrentFragment(value);
    if (!userId || fragment.length < 1) {
      clearSuggestions();
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    try {
      const products = await getSellerProducts(userId, { status: "live", query: fragment });
      if (requestId !== requestRef.current) return;

      const normalizedFragment = normalizeText(fragment);
      const matches = Array.isArray(products)
        ? products.filter((product) => {
            const english = normalizeText(product.nameEnglish);
            const hindi = normalizeText(product.nameHindi);
            return english.includes(normalizedFragment) || hindi.includes(normalizedFragment);
          })
        : [];

      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);

      if (!showSuggestions && matches.length > 0) {
        onSuggestionsVisible?.();
      }
    } catch (error) {
      console.log("Enter item suggestion error:", error?.message || error);
      clearSuggestions();
    }
  };

  const applySuggestion = (product) => {
    const productName = product.nameEnglish || product.nameHindi || "";
    const nextInput = String(input || "").replace(/([^,\n\r]*)$/, (fragment) => {
      const leadingSpace = fragment.match(/^\s*/)?.[0] || "";
      return `${leadingSpace}${productName}`;
    });

    setInput(nextInput);
    clearSuggestions();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter Items</Text>
        <Text style={styles.subtitle}>Write items in natural language</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={handleChangeText}
          multiline
          placeholder="Enter items here..."
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          style={styles.textInput}
          onBlur={() => {
            setTimeout(clearSuggestions, 150);
          }}
        />
        {input.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setInput("");
              clearSuggestions();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>x</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 ? (
        <View style={styles.suggestionBox}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {suggestions.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.suggestionItem}
                onPress={() => applySuggestion(product)}
                activeOpacity={0.85}
              >
                <View style={styles.suggestionTextBox}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {product.nameEnglish || product.nameHindi}
                  </Text>
                  <Text style={styles.suggestionMeta} numberOfLines={1}>
                    {product.nameHindi || product.nameEnglish}
                  </Text>
                </View>
                <Text style={styles.suggestionPrice}>
                  Rs {product.pricePerUnit || 0}/{product.unit || "-"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => {
          if (isProcessing) return;
          Keyboard.dismiss();
          clearSuggestions();
          onProcess();
        }}
        style={[styles.button, isProcessing && styles.buttonDisabled]}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>{isProcessing ? "PROCESSING..." : "PROCESS"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const styles = {
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_BASE,
    marginBottom: SIZES.MARGIN_BASE,
    borderWidth: 1,
    borderColor: "#E8EEF8",
    ...SHADOWS.SMALL,
  },
  header: {
    marginBottom: SIZES.MARGIN_SM,
  },
  title: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: SIZES.FONT_XS,
    color: COLORS.TEXT_SECONDARY,
  },
  inputContainer: {
    marginBottom: SIZES.MARGIN_SM,
    position: "relative",
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.GRAY_50,
    padding: SIZES.PADDING_BASE,
    paddingRight: 40,
    borderRadius: SIZES.RADIUS_LG,
    height: 100,
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_PRIMARY,
    textAlignVertical: "top",
  },
  clearButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#0EA5A4",
    height: 48,
    borderRadius: SIZES.RADIUS_LG,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.SMALL,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
  suggestionBox: {
    maxHeight: 132,
    marginBottom: SIZES.MARGIN_SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    backgroundColor: COLORS.WHITE,
    overflow: "hidden",
    ...SHADOWS.SMALL,
  },
  suggestionItem: {
    minHeight: 42,
    paddingHorizontal: SIZES.PADDING_SM,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SIZES.MARGIN_SM,
  },
  suggestionTextBox: {
    flex: 1,
  },
  suggestionName: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  suggestionMeta: {
    fontSize: SIZES.FONT_XS,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  suggestionPrice: {
    fontSize: SIZES.FONT_XS,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
};
