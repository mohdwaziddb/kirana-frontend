import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, StatusBar, Dimensions, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getUserHistory, getHistoryById, deleteHistoryById, updateHistoryById } from '../services/historyApi';
import CommonModal from '../components/CommonModal';
import { COLORS, SIZES } from '../constants/theme';
import { formatAwsDateTime, getAwsDateKey } from '../utils/awsTime';

const { width } = Dimensions.get("window");

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HistoryScreen({ user }) {
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAction, setSelectedAction] = useState('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingHistory, setEditingHistory] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const getCurrentUserId = async () => {
    if (user?.id) return user.id;

    const storedUser = await AsyncStorage.getItem('user');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser)?.id || null;
    } catch {
      return null;
    }
  };

  const parseTableData = (tableData) => {
    if (Array.isArray(tableData)) return tableData;

    try {
      const parsed = JSON.parse(tableData || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const normalizeEditableItems = (items) => {
    const normalized = (Array.isArray(items) ? items : []).map((item) => {
      const quantity = item.quantity == null ? '' : String(item.quantity);
      const price = item.price == null ? '' : String(item.price);
      return {
        name: item.name || '',
        quantity,
        price,
        total: (parseFloat(quantity) || 0) * (parseFloat(price) || 0),
        matched: item.matched || false,
      };
    });

    return normalized.length > 0
      ? normalized
      : [{ name: '', quantity: '', price: '', total: 0, matched: false }];
  };

  const fetchUserHistory = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();

      if (!userId) {
        throw new Error('Please login again to view history.');
      }

      const history = await getUserHistory(userId);
      setHistoryList(history);
    } catch (error) {
      console.error('History fetch error:', error);
      Alert.alert('Error', error.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserHistory();
    }, [user?.id])
  );

  const handleHistoryPress = async (historyItem) => {
    try {
      const detailedHistory = await getHistoryById(historyItem.id);
      const mergedHistory = {
        ...historyItem,
        ...detailedHistory,
        customerName: detailedHistory.customerName || historyItem.customerName || '',
      };
      setSelectedHistory(mergedHistory);
      setEditItems(normalizeEditableItems(parseTableData(mergedHistory.tableData)));
      setEditCustomerName(mergedHistory.customerName || '');
      setEditingHistory(false);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch details');
    }
  };

  const deleteHistoryRecord = async (historyItem) => {
    try {
      setDeletingId(historyItem.id);
      await deleteHistoryById(historyItem.id);
      setHistoryList(prev => prev.filter(item => item.id !== historyItem.id));

      if (selectedHistory?.id === historyItem.id) {
        setModalVisible(false);
        setSelectedHistory(null);
      }

      setShowDeleteSuccess(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete history');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteHistory = (historyItem) => {
    setDeleteCandidate(historyItem);
    setShowDeleteConfirm(true);
  };

  const updateEditItem = (index, field, value) => {
    setEditItems((currentItems) => {
      const nextItems = [...currentItems];
      nextItems[index] = { ...nextItems[index], [field]: value };

      const quantity = parseFloat(nextItems[index].quantity) || 0;
      const price = parseFloat(nextItems[index].price) || 0;
      nextItems[index].total = quantity * price;

      return nextItems;
    });
  };

  const addEditRow = () => {
    setEditItems((currentItems) => [
      ...currentItems,
      { name: '', quantity: '', price: '', total: 0, matched: false },
    ]);
  };

  const deleteEditRow = (index) => {
    setEditItems((currentItems) => {
      const nextItems = currentItems.filter((_, itemIndex) => itemIndex !== index);
      return nextItems.length > 0
        ? nextItems
        : [{ name: '', quantity: '', price: '', total: 0, matched: false }];
    });
  };

  const handleSaveEditedHistory = async () => {
    try {
      const validItems = editItems
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

      setSavingEdit(true);
      const updatedHistory = await updateHistoryById(selectedHistory.id, JSON.stringify(validItems), editCustomerName.trim());
      setSelectedHistory(updatedHistory);
      setHistoryList(prev => prev.map(item => item.id === updatedHistory.id ? updatedHistory : item));
      setEditItems(normalizeEditableItems(validItems));
      setEditCustomerName(updatedHistory.customerName || '');
      setEditingHistory(false);
      Alert.alert('Saved', 'History record updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update history record');
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDate = (timestamp) => {
    return formatAwsDateTime(timestamp);
  };

  const formatFilterDate = (date) => {
    if (!date) return 'All Dates';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateKey = (date) => {
    return getAwsDateKey(date);
  };

  const filteredHistoryList = useMemo(() => {
    const selectedDateKey = selectedDate ? getDateKey(selectedDate) : null;

    return historyList.filter((item) => {
      const matchesDate = !selectedDateKey || getDateKey(item.timestamp) === selectedDateKey;
      const matchesAction = selectedAction === 'all' || item.action === selectedAction;
      return matchesDate && matchesAction;
    });
  }, [historyList, selectedDate, selectedAction]);

  const openCalendar = () => {
    setCalendarMonth(selectedDate || new Date());
    setCalendarVisible(true);
  };

  const changeCalendarMonth = (amount) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    while (days.length % 7 !== 0) days.push(null);

    return days;
  };

  const handleDateSelect = (day) => {
    if (!day) return;
    setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    setCalendarVisible(false);
  };

  const calculateGrandTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const getTodayKey = () => getDateKey(new Date());
  const hasActiveFilter = selectedDate || selectedAction !== 'all';

  const clearFilters = () => {
    setSelectedDate(null);
    setSelectedAction('all');
  };

  // Stats
  const totalShared = filteredHistoryList.filter(h => h.action === 'share').length;
  const totalSaved = filteredHistoryList.filter(h => h.action === 'save').length;
  const totalAmount = filteredHistoryList.reduce((sum, h) => sum + calculateGrandTotal(parseTableData(h.tableData)), 0);

  const renderCalendarModal = () => {
    const days = getCalendarDays();
    const selectedKey = selectedDate ? getDateKey(selectedDate) : '';
    const todayKey = getTodayKey();

    return (
      <Modal visible={calendarVisible} animationType="fade" transparent onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.navButton} onPress={() => changeCalendarMonth(-1)}>
                <Text style={styles.navButtonText}>❮</Text>
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity style={styles.navButton} onPress={() => changeCalendarMonth(1)}>
                <Text style={styles.navButtonText}>❯</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((day, idx) => {
                if (!day) return <View key={`blank-${idx}`} style={styles.dayCell} />;
                const dateKey = getDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                const isSelected = dateKey === selectedKey;
                const isToday = dateKey === todayKey;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCell, isToday && styles.todayCell, isSelected && styles.selectedCell]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedText]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setCalendarVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              {selectedDate && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => { setSelectedDate(null); setCalendarVisible(false); }}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHistoryItem = ({ item }) => {
    const tableData = parseTableData(item.tableData);
    return (
      <TouchableOpacity style={styles.historyCard} onPress={() => handleHistoryPress(item)} activeOpacity={0.8}>
        <View style={styles.cardTop}>
          <View style={[styles.actionBadge, item.action === 'share' ? styles.shareBadge : styles.saveBadge]}>
            <Text style={styles.actionIcon}>{item.action === 'share' ? '📤' : '💾'}</Text>
            <Text style={[styles.actionLabel, item.action === 'share' ? styles.shareText : styles.saveText]}>
              {item.action === 'share' ? 'Shared' : 'Saved'}
            </Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.dateLabel}>{formatDate(item.timestamp)}</Text>
            <TouchableOpacity
              style={[styles.cardDeleteBtn, deletingId === item.id && styles.disabledBtn]}
              onPress={(event) => {
                event?.stopPropagation?.();
                handleDeleteHistory(item);
              }}
              disabled={deletingId === item.id}
              activeOpacity={0.8}
            >
              <Text style={styles.cardDeleteText}>{deletingId === item.id ? 'Deleting...' : 'Delete'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tableData.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Rs {calculateGrandTotal(tableData)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
        <Text style={styles.customerCardText}>Customer: {item.customerName || '-'}</Text>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedHistory) return null;
    const tableData = parseTableData(selectedHistory.tableData);
    const displayedTableData = editingHistory ? editItems : tableData;
    const grandTotal = calculateGrandTotal(displayedTableData);
    const canEditRecord = selectedHistory.action === 'share' || selectedHistory.action === 'save';

    return (
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleRow}>
              <View style={[styles.detailIconBox, selectedHistory.action === 'share' ? styles.shareBg : styles.saveBg]}>
                <Text style={styles.detailIcon}>{selectedHistory.action === 'share' ? '📤' : '💾'}</Text>
              </View>
              <View>
                <Text style={styles.detailTitle}>
                  {selectedHistory.action === 'share' ? 'Shared Record' : 'Saved Record'}
                </Text>
                <Text style={styles.detailDate}>{formatDate(selectedHistory.timestamp)}</Text>
                <Text style={styles.detailCustomer}>Customer: {selectedHistory.customerName || '-'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setEditingHistory(false); setModalVisible(false); }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.detailBody}
            contentContainerStyle={styles.detailBodyContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{displayedTableData.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Grand Total</Text>
                <Text style={styles.summaryAmount}>Rs {grandTotal}</Text>
              </View>
            </View>

            {editingHistory && (
              <View style={styles.customerEditCard}>
                <Text style={styles.customerEditLabel}>Customer Name</Text>
                <TextInput
                  style={styles.customerEditInput}
                  value={editCustomerName}
                  placeholder="Customer name"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                  onChangeText={setEditCustomerName}
                />
              </View>
            )}

            {editingHistory ? (
              <View style={styles.tableCard}>
                <View style={styles.tableHead}>
                  <Text style={[styles.th, { flex: 2 }]}>Item</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Qty</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Price</Text>
                  <Text style={[styles.th, { flex: 1.4 }]}>Total</Text>
                </View>
                {editItems.map((item, idx) => (
                  <View key={idx} style={styles.tr}>
                    <TextInput
                      style={[styles.editInput, styles.editInputLeft, { flex: 2 }]}
                      value={String(item.name || '')}
                      placeholder="Item"
                      onChangeText={(value) => updateEditItem(idx, 'name', value)}
                    />
                    <TextInput
                      style={[styles.editInput, { flex: 1 }]}
                      value={String(item.quantity || '')}
                      placeholder="Qty"
                      keyboardType="numeric"
                      onChangeText={(value) => updateEditItem(idx, 'quantity', value)}
                    />
                    <TextInput
                      style={[styles.editInput, { flex: 1 }]}
                      value={String(item.price || '')}
                      placeholder="Price"
                      keyboardType="numeric"
                      onChangeText={(value) => updateEditItem(idx, 'price', value)}
                    />
                    <View style={styles.editTotalCell}>
                      <Text style={styles.editTotalText}>Rs {item.total || 0}</Text>
                      <TouchableOpacity style={styles.editDeleteRowBtn} onPress={() => deleteEditRow(idx)}>
                        <Text style={styles.editDeleteRowText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.addEditRowBtn} onPress={addEditRow} activeOpacity={0.8}>
                  <Text style={styles.addEditRowText}>+ Add Row</Text>
                </TouchableOpacity>
                <View style={styles.tableTotal}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>Rs {grandTotal}</Text>
                </View>
              </View>
            ) : (
            <View style={styles.tableCard}>
              <View style={styles.tableHead}>
                <Text style={[styles.th, { flex: 2 }]}>Item</Text>
                <Text style={[styles.th, { flex: 1 }]}>Qty</Text>
                <Text style={[styles.th, { flex: 1 }]}>Price</Text>
                <Text style={[styles.th, { flex: 1 }]}>Total</Text>
              </View>
              {tableData.map((item, idx) => (
                <View key={idx} style={styles.tr}>
                  <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{item.quantity}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>Rs {item.price}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>Rs {item.total}</Text>
                </View>
              ))}
              <View style={styles.tableTotal}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>Rs {grandTotal}</Text>
              </View>
            </View>
            )}
            {canEditRecord && (
              <View style={styles.detailActionRow}>
                {editingHistory ? (
                  <>
                    <TouchableOpacity
                      style={[styles.detailSecondaryBtn, savingEdit && styles.disabledBtn]}
                      onPress={() => {
                        setEditItems(normalizeEditableItems(tableData));
                        setEditCustomerName(selectedHistory.customerName || '');
                        setEditingHistory(false);
                      }}
                      disabled={savingEdit}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.detailSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.detailSaveEditBtn, savingEdit && styles.disabledBtn]}
                      onPress={handleSaveEditedHistory}
                      disabled={savingEdit}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.detailSaveEditText}>
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.detailEditBtn}
                    onPress={() => {
                      setEditItems(normalizeEditableItems(tableData));
                      setEditCustomerName(selectedHistory.customerName || '');
                      setEditingHistory(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.detailEditText}>Edit Record</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <TouchableOpacity
              style={[styles.detailDeleteBtn, deletingId === selectedHistory.id && styles.disabledBtn]}
              onPress={() => handleDeleteHistory(selectedHistory)}
              disabled={deletingId === selectedHistory.id}
              activeOpacity={0.85}
            >
              <Text style={styles.detailDeleteText}>
                {deletingId === selectedHistory.id ? 'Deleting...' : 'Delete History'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeRecordBtn}
              onPress={() => {
                setEditingHistory(false);
                setModalVisible(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.closeRecordText}>Close Record</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📊 History</Text>
            <Text style={styles.headerSubtitle}>Your saved & shared records</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{filteredHistoryList.length}</Text>
                <Text style={styles.statText}>Records</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>Rs {totalAmount}</Text>
                <Text style={styles.statText}>Total Amount</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterInfo}>
          <Text style={styles.filterTitle}>Filter History</Text>
          <Text style={styles.filterSubtitle}>
            {`${filteredHistoryList.length} records`}
          </Text>
        </View>
        <TouchableOpacity style={styles.dateBtn} onPress={openCalendar} activeOpacity={0.8}>
          <Text style={styles.dateBtnIcon}>📅</Text>
          <Text style={styles.dateBtnText}>{formatFilterDate(selectedDate)}</Text>
        </TouchableOpacity>
        {hasActiveFilter && (
          <TouchableOpacity style={styles.clearBtnSmall} onPress={clearFilters}>
            <Text style={styles.clearBtnSmallText}>✕</Text>
          </TouchableOpacity>
        )}
        <View style={styles.actionFilterRow}>
          {[
            { label: 'All', value: 'all' },
            { label: 'Shared', value: 'share' },
            { label: 'Saved', value: 'save' },
          ].map((filter) => {
            const active = selectedAction === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.actionFilterBtn, active && styles.actionFilterBtnActive]}
                onPress={() => setSelectedAction(filter.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionFilterText, active && styles.actionFilterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {historyList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptyText}>Start saving or sharing tables to see them here</Text>
        </View>
      ) : filteredHistoryList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No Records Found</Text>
          <Text style={styles.emptyText}>Try a different date or action filter</Text>
          <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredHistoryList}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {renderCalendarModal()}
      {renderDetailModal()}

      <CommonModal
        visible={showDeleteConfirm}
        type="confirm"
        image="?"
        title="Delete History"
        message="Do you want to delete this record?"
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteCandidate(null);
        }}
        onConfirm={() => {
          const itemToDelete = deleteCandidate;
          setShowDeleteConfirm(false);
          setDeleteCandidate(null);
          if (itemToDelete) {
            deleteHistoryRecord(itemToDelete);
          }
        }}
      />

      <CommonModal
        visible={showDeleteSuccess}
        type="success"
        image="✅"
        title="Successfully Deleted"
        message="History record deleted."
        confirmText="OK"
        showOnlyConfirm={true}
        autoCloseTime={800}
        onConfirm={() => setShowDeleteSuccess(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },

  // Header
  headerContainer: {
    overflow: 'hidden',
  },
  headerGradient: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 90,
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
    top: '40%',
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  statText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginTop: -20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  filterInfo: {
    flex: 1,
    minWidth: 120,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  filterSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  dateBtnIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dateBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  clearBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearBtnSmallText: {
    fontSize: 14,
    color: '#E53935',
  },
  actionFilterRow: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 4,
    marginTop: 14,
  },
  actionFilterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionFilterBtnActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  actionFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_SECONDARY,
  },
  actionFilterTextActive: {
    color: COLORS.WHITE,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 150,
  },

  // History Card
  historyCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  shareBadge: {
    backgroundColor: '#E3F2FD',
  },
  saveBadge: {
    backgroundColor: '#FFF3E0',
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  shareText: {
    color: '#1565C0',
  },
  saveText: {
    color: '#E65100',
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  cardMeta: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  cardDeleteBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
  },
  cardDeleteText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  dividerLine: {
    width: 1,
    height: 40,
    backgroundColor: '#E8EAED',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  customerCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginTop: 10,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingBottom: 150,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearFilterText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },

  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 18,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderRadius: 22,
  },
  todayText: {
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  selectedCell: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 22,
  },
  selectedText: {
    color: COLORS.WHITE,
    fontWeight: '700',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  clearBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53935',
  },

  // Detail Modal
  detailContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  shareBg: {
    backgroundColor: '#E3F2FD',
  },
  saveBg: {
    backgroundColor: '#FFF3E0',
  },
  detailIcon: {
    fontSize: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  detailDate: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  detailCustomer: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  detailBody: {
    flex: 1,
    padding: 16,
  },
  detailBodyContent: {
    paddingBottom: 36,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E8EAED',
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  customerEditCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  customerEditLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  customerEditInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 10,
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  tableCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  detailEditBtn: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  detailEditText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
  detailSaveEditBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  detailSaveEditText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
  detailSecondaryBtn: {
    flex: 1,
    backgroundColor: '#EEF2F7',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  detailSecondaryText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
  detailDeleteBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  detailDeleteText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
  closeRecordBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  closeRecordText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '700',
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    alignItems: 'center',
    gap: 6,
  },
  td: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  tableTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  editInputLeft: {
    textAlign: 'left',
  },
  editTotalCell: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  editTotalText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  editDeleteRowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editDeleteRowText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '700',
  },
  addEditRowBtn: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
  },
  addEditRowText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
});
