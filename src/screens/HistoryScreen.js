import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert } from 'react-native';
import { getUserHistory, getHistoryById } from '../services/historyApi';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

export default function HistoryScreen({ user }) {
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserHistory();
  }, []);

  const fetchUserHistory = async () => {
    try {
      setLoading(true);
      console.log('Fetching history for user ID:', user.id);
      const history = await getUserHistory(user.id);
      console.log('History response:', history);
      setHistoryList(history);
    } catch (error) {
      console.error('History fetch error:', error);
      Alert.alert('Error', 'Failed to fetch history: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryPress = async (historyItem) => {
    try {
      const detailedHistory = await getHistoryById(historyItem.id);
      setSelectedHistory(detailedHistory);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch history details');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const calculateGrandTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => handleHistoryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.historyHeader}>
        <Text style={styles.actionText}>
          {item.action === 'share' ? '📸 Shared' : '💾 Saved'}
        </Text>
        <Text style={styles.timestampText}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
      <Text style={styles.itemCountText}>
        {JSON.parse(item.tableData).length} items
      </Text>
      <Text style={styles.totalText}>
        Total: ₹{calculateGrandTotal(JSON.parse(item.tableData))}
      </Text>
    </TouchableOpacity>
  );

  const renderModalContent = () => {
    if (!selectedHistory) return null;

    const tableData = JSON.parse(selectedHistory.tableData);
    const grandTotal = calculateGrandTotal(tableData);

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedHistory.action === 'share' ? '📸 Shared History' : '💾 Saved History'}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time:</Text>
            <Text style={styles.infoValue}>{formatDate(selectedHistory.timestamp)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Action:</Text>
            <Text style={styles.infoValue}>
              {selectedHistory.action === 'share' ? 'Shared' : 'Saved'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Items Count:</Text>
            <Text style={styles.infoValue}>{tableData.length}</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Price</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Total</Text>
            </View>

            {tableData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCellText, { flex: 2 }]}>{item.name}</Text>
                <Text style={[styles.tableCellText, { flex: 1 }]}>{item.quantity}</Text>
                <Text style={[styles.tableCellText, { flex: 1 }]}>₹{item.price}</Text>
                <Text style={[styles.tableCellText, { flex: 1 }]}>₹{item.total}</Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total:</Text>
              <Text style={styles.totalAmount}>₹{grandTotal}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 My History</Text>
        <Text style={styles.subtitle}>Your saved and shared records</Text>
      </View>

      {historyList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No history found</Text>
          <Text style={styles.emptySubtext}>Start saving or sharing tables to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={historyList}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {renderModalContent()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    padding: SIZES.PADDING_LG,
    backgroundColor: COLORS.WHITE,
    ...SHADOWS.SMALL,
  },
  title: {
    fontSize: SIZES.FONT_XL,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SIZES.MARGIN_XS,
  },
  listContainer: {
    padding: SIZES.PADDING_BASE,
  },
  historyItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_LG,
    padding: SIZES.PADDING_LG,
    marginBottom: SIZES.MARGIN_BASE,
    ...SHADOWS.MEDIUM,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_SM,
  },
  actionText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  timestampText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
  },
  itemCountText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SIZES.MARGIN_XS,
  },
  totalText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING_XL,
  },
  emptyText: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SIZES.MARGIN_SM,
  },
  emptySubtext: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING_LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalTitle: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    fontSize: SIZES.FONT_XL,
    color: COLORS.TEXT_SECONDARY,
    padding: SIZES.PADDING_SM,
  },
  modalBody: {
    flex: 1,
    padding: SIZES.PADDING_LG,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.PADDING_SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  infoLabel: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_SECONDARY,
  },
  infoValue: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  tableContainer: {
    marginTop: SIZES.MARGIN_BASE,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY + '10',
    padding: SIZES.PADDING_SM,
    borderRadius: SIZES.RADIUS_SM,
  },
  tableHeaderText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SIZES.PADDING_SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tableCellText: {
    fontSize: SIZES.FONT_SM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    padding: SIZES.PADDING_BASE,
    borderRadius: SIZES.RADIUS_SM,
    marginTop: SIZES.MARGIN_SM,
  },
  totalLabel: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  totalAmount: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
});
