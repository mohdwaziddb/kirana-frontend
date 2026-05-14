import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useState, useEffect, useRef } from "react";
import { Share } from "react-native";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { saveTableHistory } from '../services/historyApi';
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";

export default function EditableTable({ data, userId, storeName }) {

  const [items, setItems] = useState([{ name: "", quantity: "1", price: "0", total: 0, matched: false }]);
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
      setItems(data);
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
      { name: "", quantity: "1", price: "0", total: 0, matched: false }
    ]);
  };

  // ❌ Delete row
  const deleteRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    
    // If no items left after deletion, add a default row
    if (newItems.length === 0) {
      setItems([{ name: "", quantity: "1", price: "0", total: 0, matched: false }]);
    } else {
      setItems(newItems);
    }
  };

  // Grand total
  const grandTotal = items.reduce((sum, item) => {
    return sum + (item.total || 0);
  }, 0);

  // Save table history
  const saveHistory = async (action) => {
    try {
      console.log('saveHistory called with userId:', userId);
      console.log('Current items:', items);
      
      if (!userId) {
        console.log('No user ID provided, skipping history save');
        return;
      }

      // Filter out empty items
      const validItems = items.filter(item => item.name && item.name.trim() !== '');
      
      if (validItems.length === 0) {
        console.log('No valid items to save in history');
        return;
      }

      console.log('Attempting to save history with:', {
        userId: userId,
        itemCount: validItems.length,
        action: action
      });

      await saveTableHistory(userId, JSON.stringify(validItems), action);
      console.log(`History saved with action: ${action}`);
      
      // Show success alert
      Alert.alert(
        'Success!', 
        `Your table has been ${action === 'save' ? 'saved' : 'shared'} to history successfully!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Save history error:', error);
      
      // Show user-friendly message for expired token
      if (error.message.includes('session has expired')) {
        Alert.alert('Session Expired', 'Your session has expired. Please logout and login again to save history.');
      }
    }
  };

  // Share table as image
  const shareTable = async () => {
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
          quality: 1,
        });

        // Request permissions and share
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to save photos');
          return;
        }

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        
        // Share the image
        const options = {
          title: `${storeName || 'Store'} Item List`,
          url: uri,
          type: 'image/png',
        };
        
        await Share.share(options);
        Alert.alert('Success', 'Image saved and shared successfully');
      }

      // Save to history after successful share
      await saveHistory('share');
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
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
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
              style={[styles.tableInput, { flex: 2 }]}
              value={item.name}
              placeholder="Item name"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              onChangeText={(val) => updateItem(index, "name", val)}
            />

            {/* QTY */}
            <TextInput
              style={[styles.tableInput, { flex: 1 }]}
              value={item.quantity}
              placeholder="1"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="numeric"
              onChangeText={(val) => updateItem(index, "quantity", val)}
            />

            {/* PRICE */}
            <TextInput
              style={[styles.tableInput, { flex: 1 }]}
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
              <Text style={styles.deleteButtonText}>🗑️</Text>
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

      {/* BUTTON */}
      <TouchableOpacity
        onPress={shareTable}
        style={[styles.actionButton, styles.shareButton]}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>📸 Share and Save</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = {
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_XL,
    marginTop: SIZES.MARGIN_BASE,
    borderWidth: 1,
    borderColor: '#E8EEF8',
    ...SHADOWS.MEDIUM,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_BASE,
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY + '12',
    padding: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_LG,
    marginBottom: SIZES.MARGIN_SM,
  },
  tableHeaderText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  tableBody: {
    marginBottom: SIZES.MARGIN_BASE,
  },
  tableRow: {
    flexDirection: 'row',
    padding: SIZES.PADDING_SM,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
  },
  tableInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.GRAY_50,
    padding: SIZES.PADDING_SM,
    borderRadius: SIZES.RADIUS_BASE,
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: SIZES.MARGIN_XS,
  },
  totalText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    padding: SIZES.PADDING_SM,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT_BASE,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY_DARK,
    padding: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_LG,
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_BASE,
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
    backgroundColor: COLORS.PRIMARY_DARK,
    padding: SIZES.PADDING_LG,
    borderRadius: SIZES.RADIUS_LG,
    marginBottom: SIZES.MARGIN_BASE,
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
  actionButton: {
    padding: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_LG,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  shareButton: {
    backgroundColor: COLORS.SECONDARY,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
  },
};
