import { View, Text, TouchableOpacity, Image, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

export default function ImageUploadCard({ image, setImage, onUpload }) {

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Please allow photo access to select an image.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled === false && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        // Auto trigger scan after selecting image
        setTimeout(() => {
          if (onUpload) {
            onUpload();
          }
        }, 500);
      }
    } catch (error) {
      console.log('Gallery picker error:', error);
      Alert.alert('Error', 'Unable to open gallery. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled === false && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        // Auto trigger scan after capturing image
        setTimeout(() => {
          if (onUpload) {
            onUpload();
          }
        }, 500);
      }
    } catch (error) {
      console.log('Camera picker error:', error);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📷 Upload Image</Text>
        <Text style={styles.subtitle}>Capture a bill or item list</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={pickImage} 
          style={[styles.button, styles.galleryButton]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>📷 Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={takePhoto} 
          style={[styles.button, styles.cameraButton]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>📸 Camera</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.imageContainer}>
          <View style={styles.previewWrapper}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.imageText}>Image selected</Text>
        </View>
      )}

      <TouchableOpacity 
        onPress={onUpload} 
        style={[styles.uploadButton, !image && styles.uploadButtonDisabled]}
        disabled={!image}
        activeOpacity={0.8}
      >
        <Text style={styles.uploadButtonText}>🔍 Scan Image</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = {
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_XL,
    marginBottom: SIZES.MARGIN_LG,
    borderWidth: 1,
    borderColor: '#E8EEF8',
    ...SHADOWS.MEDIUM,
  },
  header: {
    marginBottom: SIZES.MARGIN_BASE,
  },
  title: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_XS,
  },
  subtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SIZES.MARGIN_BASE,
    marginBottom: SIZES.MARGIN_BASE,
  },
  button: {
    flex: 1,
    padding: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_LG,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  galleryButton: {
    backgroundColor: COLORS.SECONDARY_DARK,
  },
  cameraButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
  },
  imageContainer: {
    marginBottom: SIZES.MARGIN_BASE,
    alignItems: 'flex-start',
  },
  previewWrapper: {
    position: 'relative',
  },
  image: {
    width: 180,
    height: 120,
    borderRadius: SIZES.RADIUS_LG,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: SIZES.RADIUS_FULL,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  removeImageText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    lineHeight: 22,
  },
  imageText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SIZES.MARGIN_XS,
  },
  uploadButton: {
    backgroundColor: COLORS.ACCENT,
    padding: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_LG,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.GRAY_300,
    opacity: 0.6,
  },
  uploadButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
};
