import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useState, useEffect, useRef } from "react";
import { Share } from "react-native";
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { saveTableHistory } from '../services/historyApi';
import { COLORS, SIZES, FONTS, SHADOWS } from "../constants/theme";
import CommonModal from "./CommonModal";

export default function EditableTable({ data, userId, storeName }) {

  const [items, setItems] = useState([{ name: "", quantity: "", price: "", total: 0, matched: false }]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'info' });
  const [customerName, setCustomerName] = useState('');
  const tableRef = useRef(null);

  const closeAllModals = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowValidationModal(false);
  };

  const showFeedback = (type, title, message) => {
    closeAllModals();
    setModalConfig({ title, message, type });

    if (type === 'success') {
      setShowSuccessModal(true);
    } else if (type === 'validation') {
      setShowValidationModal(true);
    } else {
      setShowErrorModal(true);
    }
  };

  const getShareFileName = () => {
    const safeStoreName = (storeName || 'store')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `${safeStoreName || 'store'}-item-list.png`;
  };

  const getValidItems = () => {
    return items
      .filter(item => item.name && item.name.trim() !== '')
      .map(item => ({
        name: String(item.name || ''),
        quantity: String(item.quantity || ''),
        price: String(parseFloat(item.price) || 0),
        total: parseFloat(item.total) || 0,
        matched: item.matched || false,
      }));
  };

  const getShareMessage = (validItems) => {
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');

    const itemLines = validItems.map((item, index) => {
      return `${index + 1}. ${item.name} | Qty: ${item.quantity || '-'} | Price: Rs ${item.price} | Total: Rs ${item.total}`;
    });

    return [
      `${today} Items List`,
      `From: ${storeName || 'Store'}`,
      `Customer: ${customerName.trim() || '-'}`,
      '',
      ...itemLines,
      '',
      `Grand Total: Rs ${grandTotal}`,
    ].join('\n');
  };

  const getTableDomElement = () => {
    const tableElement = tableRef.current;
    if (!tableElement) return null;
    return tableElement._root || tableElement;
  };

  const captureTableBlob = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const domElement = getTableDomElement();

    if (!domElement) {
      throw new Error('Table reference not found');
    }

    const canvas = await html2canvas(domElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    return await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Could not create image file'));
        }
      }, 'image/png');
    });
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const captureTableUri = async () => {
    return await captureRef(tableRef, {
      format: 'png',
      quality: 0.9,
    });
  };

  const saveImageToDevice = async (uri) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Please grant permission to save photos');
    }

    return await MediaLibrary.createAssetAsync(uri);
  };

  const getNativeShare = () => {
    try {
      const shareModule = require('react-native-share');
      return shareModule.default || shareModule;
    } catch (error) {
      console.log('react-native-share is not available in this runtime:', error?.message);
      return null;
    }
  };

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Normalize items - ensure all required fields have defaults
      const normalizedItems = data.map(item => ({
        name: item.name || '',
        quantity: item.quantity == null ? '' : String(item.quantity),
        price: item.price == null ? '' : String(item.price),
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

  const getInputValue = (value) => {
    if (value == null) return '';
    return String(value);
  };

  const clearDefaultNumberOnFocus = (index, field) => {
    const currentValue = getInputValue(items[index]?.[field]).trim();
    if (currentValue === '0' || currentValue === '1') {
      updateItem(index, field, '');
    }
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
        showFeedback('error', 'Login Required', 'Please login to save history.');
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
        setModalConfig({ title: 'Validation Error', message: 'Please add at least one item before saving', type: 'error' }); setShowValidationModal(true);
        return;
      }

      console.log('Valid items to save:', validItems);
      console.log('Attempting to save history with:', {
        userId: userId,
        itemCount: validItems.length,
        action: 'save'
      });

      await saveTableHistory(userId, JSON.stringify(validItems), 'save', customerName.trim());
      console.log('History saved successfully');

      setModalConfig({ title: 'Success!', message: 'Your item list has been saved to history!', type: 'success' }); setShowSuccessModal(true);
    } catch (error) {
      console.error('Save history error:', error);

      if (error.message.includes('session has expired')) {
        setModalConfig({ title: 'Session Expired', message: 'Your session has expired. Please logout and login again to save history.', type: 'error' }); setShowErrorModal(true);
      } else {
        setModalConfig({ title: 'Error', message: 'Failed to save history. Please try again.', type: 'error' }); setShowErrorModal(true);
      }
    }
  };

  // Share table as image (without saving to history)
  const shareImage = async () => {
    // Validate - check if there are items with names
    const validItems = items.filter(item => item.name && item.name.trim() !== '');
    if (validItems.length === 0) {
      setModalConfig({ title: 'Validation Error', message: 'Please add at least one item before sharing', type: 'error' }); setShowValidationModal(true);
      return;
    }

    try {
      // Check if running on web
      if (Platform.OS === 'web') {
        // Web platform - use html2canvas
        const { default: html2canvas } = await import('html2canvas');
        const tableElement = tableRef.current;
        if (!tableElement) {
          setModalConfig({ title: 'Error', message: 'Table reference not found', type: 'error' }); setShowErrorModal(true);
          return;
        }

        // Find the DOM element
        const domElement = tableElement._root || tableElement;
        if (!domElement) {
          setModalConfig({ title: 'Error', message: 'Could not find table DOM element', type: 'error' }); setShowErrorModal(true);
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
              setModalConfig({ title: 'Success', message: 'Image downloaded and share option opened successfully!', type: 'success' }); setShowSuccessModal(true);
            } catch (shareError) {
              if (shareError?.name === 'AbortError') {
                setModalConfig({ title: 'Downloaded', message: 'Image downloaded. Share was cancelled.', type: 'success' }); setShowSuccessModal(true);
              } else {
                setModalConfig({ title: 'Downloaded', message: 'Image downloaded, but this browser could not share it directly.', type: 'success' }); setShowSuccessModal(true);
              }
            }
          } else {
            setModalConfig({ title: 'Downloaded', message: 'Image downloaded. This browser does not support direct image sharing.', type: 'success' }); setShowSuccessModal(true);
          }
        } else {
          setModalConfig({ title: 'Downloaded', message: 'Image downloaded. Direct sharing is not supported in this browser.', type: 'success' }); setShowSuccessModal(true);
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
          setModalConfig({ title: 'Permission needed', message: 'Please grant permission to save photos', type: 'error' }); setShowErrorModal(true);
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

        const shareMessage = `${today} Items List\nFrom: ${storeName || 'User'}\nCustomer: ${customerName.trim() || '-'}\nTotal: Rs ${grandTotal}`;

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
      setModalConfig({ title: 'Error', message: 'Failed to share table image', type: 'error' }); setShowErrorModal(true);
    }
  };

  const handleSavePress = async () => {
    try {
      if (!userId) {
        setModalConfig({ title: 'Error', message: 'Please login to save history', type: 'error' }); setShowErrorModal(true);
        return;
      }

      const validItems = getValidItems();
      if (validItems.length === 0) {
        showFeedback('validation', 'Add Items First', 'Please add at least one item before saving.');
        return;
      }

      if (Platform.OS === 'web') {
        const blob = await captureTableBlob();
        downloadBlob(blob, getShareFileName());
      } else {
        const uri = await captureTableUri();
        await saveImageToDevice(uri);
      }

      await saveTableHistory(userId, JSON.stringify(validItems), 'save', customerName.trim());
      showFeedback('success', 'Saved Successfully', 'Image saved and history created.');
    } catch (error) {
      console.error('Save image and history error:', error);
      if (error.message?.includes('session has expired')) {
        showFeedback('error', 'Session Expired', 'Please logout and login again to save history.');
      } else {
        showFeedback('error', 'Save Failed', error.message || 'Failed to save image and history. Please try again.');
      }
    }
  };

  const handleSharePress = async () => {
    try {
      if (!userId) {
        showFeedback('error', 'Login Required', 'Please login to share history.');
        return;
      }

      const validItems = getValidItems();
      if (validItems.length === 0) {
        showFeedback('validation', 'Add Items First', 'Please add at least one item before sharing.');
        return;
      }

      const shareMessage = getShareMessage(validItems);
      const historyPayload = JSON.stringify(validItems);
      await saveTableHistory(userId, historyPayload, 'share', customerName.trim());

      if (Platform.OS === 'web') {
        const blob = await captureTableBlob();
        const fileName = getShareFileName();
        downloadBlob(blob, fileName);

        if (!navigator.share || typeof File === 'undefined') {
          showFeedback('success', 'History Created', 'Image downloaded and history created. Direct sharing is not supported in this browser.');
          return;
        }

        const file = new File([blob], fileName, { type: 'image/png' });
        const shareData = {
          title: `${storeName || 'Store'} Item List`,
          text: shareMessage,
          files: [file],
        };

        if (navigator.canShare && !navigator.canShare(shareData)) {
          showFeedback('success', 'History Created', 'Image downloaded and history created. This browser does not support direct image sharing.');
          return;
        }

        try {
          await navigator.share(shareData);
        } catch (shareError) {
          if (shareError?.name === 'AbortError') {
            showFeedback('success', 'History Created', 'Image downloaded and history created. Share was cancelled.');
          } else {
            showFeedback('success', 'History Created', 'Image downloaded and history created, but this browser could not share it directly.');
          }
          return;
        }
      } else {
        const uri = await captureTableUri();
        await saveImageToDevice(uri);
        const shareUri = uri.startsWith('file://') ? uri : `file://${uri}`;
        const nativeShare = getNativeShare();

        if (nativeShare?.open) {
          const result = await nativeShare.open({
            title: `${storeName || 'Store'} Item List`,
            message: shareMessage,
            url: shareUri,
            type: 'image/png',
            failOnCancel: false,
          });

          if (result.dismissedAction) {
            showFeedback('success', 'History Created', 'Share was cancelled, but this record is saved in history.');
            return;
          }
        } else {
          await Share.share({
            title: `${storeName || 'Store'} Item List`,
            message: `${shareMessage}\n\nImage saved to gallery.`,
            url: shareUri,
          });
        }
      }

      showFeedback('success', 'Shared Successfully', 'Content and image shared. History created.');
    } catch (error) {
      console.error('Share content, image, and history error:', error);
      if (error.message?.includes('session has expired')) {
        showFeedback('error', 'Session Expired', 'Please logout and login again to save history.');
      } else {
        showFeedback('error', 'Share Failed', error.message || 'Failed to share content and image.');
      }
    }
  };

  return (
    <View style={styles.container} ref={tableRef}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerText}>📋 Item List</Text>
          <Text style={styles.headerSubtext}>{items.length} items</Text>
        </View>
        <View style={styles.customerField}>
          <Text style={styles.customerLabel}>Customer Name</Text>
          <TextInput
            style={styles.customerInput}
            value={customerName}
            placeholder="Name"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            onChangeText={setCustomerName}
          />
        </View>
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
          <View key={index} style={{
                flexDirection: 'row',
    paddingVertical: SIZES.PADDING_XS,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
          }}>
            {/* NAME */}
                    <View style={{flexDirection:'row',justifyContent:'space-between',}}>
            {/* <View style={{}}> */}
            <TextInput
              style={[styles.tableInput, styles.tableInputLeft, {
                width:120
              }]}
              value={item.name}
              placeholder="Item name"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              onChangeText={(val) => updateItem(index, "name", val)}
            />
             {/* </View> */}

            {/* QTY */}
            <View style={{}}>
            <TextInput
              style={[styles.tableInput, styles.tableInputCenter, styles.numberInput,]}
              value={getInputValue(item.quantity)}
              placeholder="Qty"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="numeric"
              textAlign="center"
              textAlignVertical="center"
              selectionColor={COLORS.PRIMARY}
              onFocus={() => clearDefaultNumberOnFocus(index, "quantity")}
              onChangeText={(val) => updateItem(index, "quantity", val)}
            />
            </View>
                    </View>
           

            {/* PRICE */}
            <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:'center',width:150,marginStart:2}}>
              <View style={{flexDirection:'row',alignItems:'center'}}>
            <TextInput
              style={[styles.tableInput, styles.tableInputCenter, styles.numberInput]}
              value={getInputValue(item.price)}
              placeholder="Price"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="numeric"
              textAlign="center"
              textAlignVertical="center"
              selectionColor={COLORS.PRIMARY}
              onFocus={() => clearDefaultNumberOnFocus(index, "price")}
              onChangeText={(val) => updateItem(index, "price", val)}
            />

            {/* TOTAL */}
            <Text style={[styles.totalText, ]}>
              ₹{item.total || 0}
            </Text>
            </View>

            {/* DELETE */}
            <TouchableOpacity
              style={[{
                    backgroundColor: COLORS.ERROR,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
              }]}
              onPress={() => deleteRow(index)}
              activeOpacity={0.7}
            >
              {/* <View style={styles.deleteIconContainer}> */}
                <Text style={styles.deleteButtonText}>✕</Text>
              {/* </View> */}
            </TouchableOpacity>
            </View>
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
          onPress={handleSavePress}
          style={[styles.actionButton, styles.saveButton]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>💾 Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSharePress}
          style={[styles.actionButton, styles.shareButton]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>📸 Share</Text>
        </TouchableOpacity>
      </View>

      <CommonModal
        visible={showSuccessModal}
        type={modalConfig.type || "success"}
        image={modalConfig.type === "error" ? "❌" : "✅"}
        title={modalConfig.title || "Success"}
        message={modalConfig.message || ""}
        confirmText="OK"
        showOnlyConfirm={true}
        onConfirm={() => setShowSuccessModal(false)}
      />

      <CommonModal
        visible={showErrorModal}
        type="error"
        image="❌"
        title={modalConfig.title || "Error"}
        message={modalConfig.message || ""}
        confirmText="OK"
        showOnlyConfirm={true}
        onConfirm={() => setShowErrorModal(false)}
      />

      <CommonModal
        visible={showValidationModal}
        type="error"
        image="⚠️"
        title={modalConfig.title || "Validation Error"}
        message={modalConfig.message || ""}
        confirmText="OK"
        showOnlyConfirm={true}
        onConfirm={() => setShowValidationModal(false)}
      />

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
    alignItems: 'flex-start',
    gap: SIZES.MARGIN_SM,
    marginBottom: SIZES.MARGIN_SM,
  },
  headerTitleBox: {
    flex: 1,
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
  customerField: {
    width: 155,
  },
  customerLabel: {
    fontSize: SIZES.FONT_XS || 11,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  customerInput: {
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.GRAY_50,
    borderRadius: SIZES.RADIUS_BASE,
    paddingHorizontal: SIZES.PADDING_SM,
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_PRIMARY,
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
    paddingHorizontal: 2,
    borderRadius: SIZES.RADIUS_BASE,
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginHorizontal: 2,
  

  },
  tableInputCenter: {
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberInput: {
    minWidth: 54,
    height: 38,
    paddingLeft: 2,
    paddingRight: 2,
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
    // alignItems: 'center',
    // justifyContent: 'center',
    // padding: 2,
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
    marginBottom:2,

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
