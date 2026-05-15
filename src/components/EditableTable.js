import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useState, useEffect, useRef } from "react";
import { Share } from "react-native";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { saveTableHistory } from '../services/historyApi';
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

export default function EditableTable({ data, userId, storeName }) {

  const [items, setItems] = useState([{ name: "", quantity: "", price: "", total: 0, matched: false }]);
  const tableRef = useRef(null);

  const getShareFileName = () => {
    const safeStoreName = (storeName || 'store')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `${safeStoreName || 'store'}-item-list.png`;
  };

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Normalize items - ensure all required fields have defaults
      const normalizedItems = data.map(item => ({
        name: item.name || '',
        quantity: item.quantity || '',
        price: item.price || item.total || 0,
        total: item.total || (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)),
        matched: item.matched || false,
      }));
      setItems(normalizedItems);
    }
  }, [data]);

  // Update logic
  const updateItem = (index, field, value) => {
    const updated = [...items];

    updated[index][field] = value;

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].price) || 0;

    updated[index].total = qty * price;

    setItems(updated);
  };

  // ➕ Add row
  const addRow = () => {
    setItems([
      ...items,
      { name: "", quantity: "", price: "", total: 0, matched: false }
    ]);
  };

  // ❌ Delete row
  const deleteRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    
    // If no items left after deletion, add a default row
    if (newItems.length === 0) {
      setItems([{ name: "", quantity: "", price: "", total: 0, matched: false }]);
    } else {
      setItems(newItems);
    }
  };

  // Grand total
  const grandTotal = items.reduce((sum, item) => {
    return sum + (item.total || 0);
  }, 0);

  // Save to history only (without sharing)
  const saveToHistory = async () => {
    try {
      console.log('saveToHistory called with userId:', userId);
      console.log('Current items:', items);

      if (!userId) {
        Alert.alert('Error', 'Please login to save history');
        return;
      }

      // Filter out empty items and normalize
      const validItems = items
        .filter(item => item.name && item.name.trim() !== '')
        .map(item => ({
          name: String(item.name || ''),
          quantity: String(item.quantity || ''),
          price: String(parseFloat(item.price) || 0),
          total: parseFloat(item.total) || 0,
          matched: item.matched || false,
        }));

      if (validItems.length === 0) {
        Alert.alert('Error', 'Please add at least one item before saving');
        return;
      }

      console.log('Valid items to save:', validItems);
      console.log('Attempting to save history with:', {
        userId: userId,
        itemCount: validItems.length,
        action: 'save'
      });

      await saveTableHistory(userId, JSON.stringify(validItems), 'save');
      console.log('History saved successfully');

      Alert.alert('Success!', 'Your item list has been saved to history!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Save history error:', error);

      if (error.message.includes('session has expired')) {
        Alert.alert('Session Expired', 'Your session has expired. Please logout and login again to save history.');
      } else {
        Alert.alert('Error', 'Failed to save history. Please try again.');
      }
    }
  };

  // Share table as image (without saving to history)
  const shareImage = async () => {
    // Validate - check if there are items with names
    const validItems = items.filter(item => item.name && item.name.trim() !== '');
    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item before sharing');
      return;
    }

    try {
      // Check if running on web
      if (Platform.OS === 'web') {
        // Web platform - use html2canvas
        const { default: html2canvas } = await import('html2canvas');
        const tableElement = tableRef.current;
        if (!tableElement) {
          Alert.alert('Error', 'Table reference not found');
          return;
        }

        // Find the DOM element
        const domElement = tableElement._root || tableElement;
        if (!domElement) {
          Alert.alert('Error', 'Could not find table DOM element');
          return;
        }

        // Use html2canvas to capture the table
        const canvas = await html2canvas(domElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        });

        // Convert canvas to blob, download it, then open the browser share sheet when available.
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Could not create image file'));
            }
          }, 'image/png');
        });

        const fileName = getShareFileName();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (navigator.share && typeof File !== 'undefined') {
          const file = new File([blob], fileName, { type: 'image/png' });
          const shareData = {
            title: `${storeName || 'Store'} Item List`,
            text: `${storeName || 'Store'} item list`,
            files: [file],
          };

          if (!navigator.canShare || navigator.canShare(shareData)) {
            try {
              await navigator.share(shareData);
              Alert.alert('Success', 'Image downloaded and share option opened successfully!');
            } catch (shareError) {
              if (shareError?.name === 'AbortError') {
                Alert.alert('Downloaded', 'Image downloaded. Share was cancelled.');
              } else {
                Alert.alert('Downloaded', 'Image downloaded, but this browser could not share it directly.');
              }
            }
          } else {
            Alert.alert('Downloaded', 'Image downloaded. This browser does not support direct image sharing.');
          }
        } else {
          Alert.alert('Downloaded', 'Image downloaded. Direct sharing is not supported in this browser.');
        }
      } else {
        // Mobile platform - use react-native-view-shot
        const uri = await captureRef(tableRef, {
          format: 'png',
          quality: 0.9,
        });

        console.log('Captured image URI:', uri);

        // Request permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to save photos');
          return;
        }

        // Save to media library for persistence
        const asset = await MediaLibrary.createAssetAsync(uri);

        // Build the message
        const today = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).replace(/\//g, '-');

        const shareMessage = `${today} Items List\nFrom: ${storeName || 'User'}\nTotal: ₹${grandTotal}`;

        // For Android, need to ensure proper URI format
        const shareUri = uri.startsWith('file://') ? uri : `file://${uri}`;

        // Try sharing with both image and message
        try {
          // First attempt: image + message
          await Share.share({
            title: 'Item List',
            message: shareMessage,
            url: shareUri,
          });
        } catch (e) {
          console.log('Share with message failed, trying image only:', e);
          // Fallback: just the image
          await Share.share({
            title: `${storeName || 'Store'} Item List`,
            url: shareUri,
          });
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share table image');
    }
  };

  return (
    <View style={styles.container} ref={tableRef}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>📋 Item List</Text>
        <Text style={styles.headerSubtext}>{items.length} items</Text>
      </View>

      {/* TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.tableHeaderLeft, { flex: 2 }]}>Item</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Qty</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Price</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Total</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Action</Text>
      </View>

      {/* ROWS */}
      <View style={styles.tableBody}>
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            {/* NAME */}
            <TextInput
              style={[styles.tableInput, styles.tableInputLeft, { flex: 2 }]}
              value={item.name}
              placeholder="Item name"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              onChangeText={(val) => updateItem(index, "name", val)}
            />

            {/* QTY */}
            <TextInput
              style={[styles.tableInput, styles.tableInputCenter, { flex: 1 }]}
              value={item.quantity}
              placeholder="Qty"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="numeric"
              onChangeText={(val) => updateItem(index, "quantity", val)}
            />

            {/* PRICE */}
            <TextInput
              style={[styles.tableInput, styles.tableInputCenter, { flex: 1 }]}
              value={String(item.price)}
              placeholder="0"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="numeric"
              onChangeText={(val) => updateItem(index, "price", val)}
            />

            {/* TOTAL */}
            <Text style={[styles.totalText, { flex: 1 }]}>
              ₹{item.total || 0}
            </Text>

            {/* DELETE */}
            <TouchableOpacity
              style={[styles.deleteButton, { flex: 1 }]}
              onPress={() => deleteRow(index)}
              activeOpacity={0.7}
            >
              <View style={styles.deleteIconContainer}>
                <Text style={styles.deleteButtonText}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* ➕ ADD BUTTON */}
      <TouchableOpacity
        onPress={addRow}
        style={styles.addButton}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>➕ Add Row</Text>
      </TouchableOpacity>

      {/* 💰 GRAND TOTAL */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Grand Total</Text>
        <Text style={styles.totalAmount}>₹{grandTotal}</Text>
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={saveToHistory}
          style={[styles.actionButton, styles.saveButton]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>💾 Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={shareImage}
          style={[styles.actionButton, styles.shareButton]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>📸 Share</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = {
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_BASE,
    marginTop: SIZES.MARGIN_SM,
    borderWidth: 1,
    borderColor: '#E8EEF8',
    ...SHADOWS.MEDIUM,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_SM,
  },
  headerText: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtext: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
  },
  tableHeaderText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  tableHeaderLeft: {
    textAlign: 'left',
    paddingLeft: SIZES.PADDING_SM,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY + '12',
    paddingHorizontal: SIZES.PADDING_SM,
    paddingVertical: SIZES.PADDING_XS,
    borderRadius: SIZES.RADIUS_LG,
    marginBottom: SIZES.PADDING_XS,
  },
  tableBody: {
    marginBottom: SIZES.MARGIN_SM,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SIZES.PADDING_XS,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
  },
  tableInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.GRAY_50,
    paddingVertical: SIZES.PADDING_XS,
    paddingHorizontal: 2,
    borderRadius: SIZES.RADIUS_BASE,
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: 2,
  },
  tableInputCenter: {
    textAlign: 'center',
  },
  tableInputLeft: {
    textAlign: 'left',
    paddingLeft: SIZES.PADDING_SM,
  },
  totalText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    minWidth: 50,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  deleteIconContainer: {
    backgroundColor: COLORS.ERROR,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#F59E0B',
    height: 48,
    borderRadius: SIZES.RADIUS_LG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_SM,
    ...SHADOWS.SMALL,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    height: 48,
    paddingHorizontal: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_LG,
    marginBottom: SIZES.MARGIN_SM,
    ...SHADOWS.SMALL,
  },
  totalLabel: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  totalAmount: {
    fontSize: SIZES.FONT_XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SIZES.MARGIN_BASE,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: SIZES.RADIUS_LG,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  shareButton: {
    backgroundColor: '#6366F1',
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
};
