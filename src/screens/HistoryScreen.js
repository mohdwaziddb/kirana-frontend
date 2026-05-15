import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, StatusBar, Dimensions } from 'react-native';
import { getUserHistory, getHistoryById } from '../services/historyApi';
import { COLORS, SIZES } from '../constants/theme';

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
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserHistory();
  }, []);

  const fetchUserHistory = async () => {
    try {
      setLoading(true);
      const history = await getUserHistory(user.id);
      setHistoryList(history);
    } catch (error) {
      console.error('History fetch error:', error);
      Alert.alert('Error', 'Failed to fetch history');
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
      Alert.alert('Error', 'Failed to fetch details');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const filteredHistoryList = useMemo(() => {
    if (!selectedDate) return historyList;
    const selectedDateKey = getDateKey(selectedDate);
    return historyList.filter((item) => getDateKey(item.timestamp) === selectedDateKey);
  }, [historyList, selectedDate]);

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

  // Stats
  const totalShared = filteredHistoryList.filter(h => h.action === 'share').length;
  const totalSaved = filteredHistoryList.filter(h => h.action === 'save').length;
  const totalAmount = filteredHistoryList.reduce((sum, h) => sum + calculateGrandTotal(JSON.parse(h.tableData)), 0);

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
    const tableData = JSON.parse(item.tableData);
    return (
      <TouchableOpacity style={styles.historyCard} onPress={() => handleHistoryPress(item)} activeOpacity={0.8}>
        <View style={styles.cardTop}>
          <View style={[styles.actionBadge, item.action === 'share' ? styles.shareBadge : styles.saveBadge]}>
            <Text style={styles.actionIcon}>{item.action === 'share' ? '📤' : '💾'}</Text>
            <Text style={[styles.actionLabel, item.action === 'share' ? styles.shareText : styles.saveText]}>
              {item.action === 'share' ? 'Shared' : 'Saved'}
            </Text>
          </View>
          <Text style={styles.dateLabel}>{formatDate(item.timestamp)}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tableData.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{calculateGrandTotal(tableData)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedHistory) return null;
    const tableData = JSON.parse(selectedHistory.tableData);
    const grandTotal = calculateGrandTotal(tableData);

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
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailBody}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{tableData.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Grand Total</Text>
                <Text style={styles.summaryAmount}>₹{grandTotal}</Text>
              </View>
            </View>

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
                  <Text style={[styles.td, { flex: 1 }]}>₹{item.price}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>₹{item.total}</Text>
                </View>
              ))}
              <View style={styles.tableTotal}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{grandTotal}</Text>
              </View>
            </View>
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
                <Text style={styles.statNumber}>₹{totalAmount}</Text>
                <Text style={styles.statText}>Total Amount</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterInfo}>
          <Text style={styles.filterTitle}>Filter by Date</Text>
          <Text style={styles.filterSubtitle}>
            {`${filteredHistoryList.length} records`}
          </Text>
        </View>
        <TouchableOpacity style={styles.dateBtn} onPress={openCalendar} activeOpacity={0.8}>
          <Text style={styles.dateBtnIcon}>📅</Text>
          <Text style={styles.dateBtnText}>{formatFilterDate(selectedDate)}</Text>
        </TouchableOpacity>
        {selectedDate && (
          <TouchableOpacity style={styles.clearBtnSmall} onPress={() => setSelectedDate(null)}>
            <Text style={styles.clearBtnSmallText}>✕</Text>
          </TouchableOpacity>
        )}
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
          <Text style={styles.emptyText}>Try a different date or clear filter</Text>
          <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSelectedDate(null)}>
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
    paddingTop: StatusBar.currentHeight + 20,
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

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
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

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  tableCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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