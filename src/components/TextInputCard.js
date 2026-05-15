import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

export default function TextInputCard({ input, setInput, onProcess }) {

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Enter Items</Text>
        <Text style={styles.subtitle}>Write items in natural language</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          multiline
          placeholder="Enter items here..."
          placeholderTextColor={COLORS.TEXT_SECONDARY}
          style={styles.textInput}
        />
      </View>

      <TouchableOpacity
        onPress={onProcess}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>🚀 PROCESS</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = {
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_BASE,
    marginBottom: SIZES.MARGIN_BASE,
    borderWidth: 1,
    borderColor: '#E8EEF8',
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
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.GRAY_50,
    padding: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_LG,
    height: 100,
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_PRIMARY,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0EA5A4',
    height: 48,
    borderRadius: SIZES.RADIUS_LG,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
};
