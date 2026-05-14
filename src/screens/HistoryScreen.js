import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, StatusBar } from 'react-native';
import { getUserHistory, getHistoryById } from '../services/historyApi';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HistoryScreen({ user }) {
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  //hello

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

  const formatFilterDate = (date) => {
    if (!date) return 'Select date';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getDateKey = (date) => {
    const parsedDate = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredHistoryList = useMemo(() => {
    if (!selectedDate) return historyList;

    const selectedDateKey = getDateKey(selectedDate);
    return historyList.filter((historyItem) => getDateKey(historyItem.timestamp) === selectedDateKey);
  }, [historyList, selectedDate]);

  const openCalendar = () => {
    setCalendarMonth(selectedDate || new Date());
    setCalendarVisible(true);
  };

  const changeCalendarMonth = (amount) => {
    setCalendarMonth((currentMonth) => (
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1)
    ));
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];

    for (let index = 0; index < firstDayOfMonth; index += 1) {
      calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      calendarDays.push(day);
    }

    while (calendarDays.length % 7 !== 0) {
      calendarDays.push(null);
    }

    return calendarDays;
  };

  const handleDateSelect = (day) => {
    if (!day) return;

    setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    setCalendarVisible(false);
  };

  const calculateGrandTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const renderDateFilter = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterSummary}>
        <Text style={styles.filterLabel}>Filter by date</Text>
        <Text style={styles.filterCount}>
          Showing {filteredHistoryList.length} of {historyList.length} records
        </Text>
      </View>

      <View style={styles.filterActions}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={openCalendar}
          activeOpacity={0.8}
        >
          <Text style={styles.dateButtonText}>{formatFilterDate(selectedDate)}</Text>
        </TouchableOpacity>

        {selectedDate ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSelectedDate(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderCalendarModal = () => {
    const calendarDays = getCalendarDays();
    const selectedDateKey = selectedDate ? getDateKey(selectedDate) : '';
    const todayKey = getDateKey(new Date());

    return (
      <Modal
        visible={calendarVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => changeCalendarMonth(-1)}
                activeOpacity={0.8}
              >
                <Text style={styles.monthButtonText}>{'<'}</Text>
              </TouchableOpacity>

              <Text style={styles.calendarTitle}>
                {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>

              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => changeCalendarMonth(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.monthButtonText}>{'>'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map((weekDay) => (
                <Text key={weekDay} style={styles.weekDayText}>{weekDay}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const dayDate = day
                  ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
                  : null;
                const dayKey = dayDate ? getDateKey(dayDate) : '';
                const isSelected = dayKey === selectedDateKey;
                const isToday = dayKey === todayKey;

                return (
                  <TouchableOpacity
                    key={`${day || 'blank'}-${index}`}
                    style={[
                      styles.dayButton,
                      isToday && styles.todayButton,
                      isSelected && styles.selectedDayButton,
                    ]}
                    onPress={() => handleDateSelect(day)}
                    disabled={!day}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        isToday && styles.todayButtonText,
                        isSelected && styles.selectedDayButtonText,
                      ]}
                    >
                      {day || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity
                style={styles.calendarCancelButton}
                onPress={() => setCalendarVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.calendarCancelText}>Cancel</Text>
              </TouchableOpacity>

              {selectedDate ? (
                <TouchableOpacity
                  style={styles.calendarClearButton}
                  onPress={() => {
                    setSelectedDate(null);
                    setCalendarVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarClearText}>Clear filter</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    );
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      <View style={styles.header}>
        <Text style={styles.title}>📊 My History</Text>
        <Text style={styles.subtitle}>Your saved and shared records</Text>
      </View>

      {historyList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No history found</Text>
          <Text style={styles.emptySubtext}>Start saving or sharing tables to see them here</Text>
        </View>
      ) : filteredHistoryList.length === 0 ? (
        <>
          {renderDateFilter()}
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No records for this date</Text>
            <Text style={styles.emptySubtext}>Choose another date or clear the filter</Text>
          </View>
        </>
      ) : (
        <>
          {renderDateFilter()}
          <FlatList
            data={filteredHistoryList}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}

      {renderCalendarModal()}

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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZES.PADDING_BASE,
    paddingVertical: SIZES.PADDING_SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  filterSummary: {
    flex: 1,
    marginRight: SIZES.MARGIN_SM,
  },
  filterLabel: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  filterCount: {
    fontSize: SIZES.FONT_XS,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  dateButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_FOCUS,
    borderRadius: SIZES.RADIUS_BASE,
    paddingHorizontal: SIZES.PADDING_SM,
    backgroundColor: COLORS.PRIMARY + '08',
  },
  dateButtonText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.PRIMARY,
  },
  clearButton: {
    minHeight: 40,
    justifyContent: 'center',
    marginLeft: SIZES.MARGIN_SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS_BASE,
    paddingHorizontal: SIZES.PADDING_SM,
    backgroundColor: COLORS.WHITE,
  },
  clearButtonText: {
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
  },
  listContainer: {
    padding: SIZES.PADDING_BASE,
    paddingBottom: 100,
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
  calendarOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    padding: SIZES.PADDING_LG,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_2XL,
    padding: SIZES.PADDING_LG,
    ...SHADOWS.LARGE,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING_BASE,
    paddingHorizontal: SIZES.PADDING_XS,
  },
  calendarTitle: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  monthButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.RADIUS_FULL,
    backgroundColor: COLORS.PRIMARY + '15',
  },
  monthButtonText: {
    fontSize: SIZES.FONT_LG,
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: SIZES.MARGIN_SM,
    paddingHorizontal: SIZES.PADDING_XS,
  },
  weekDayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: SIZES.FONT_SM,
    fontWeight: FONTS.BOLD,
    color: COLORS.TEXT_SECONDARY,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.PADDING_XS,
  },
  dayButton: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.RADIUS_FULL,
  },
  todayButton: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  selectedDayButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  dayButtonText: {
    fontSize: SIZES.FONT_BASE,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: FONTS.MEDIUM,
  },
  todayButtonText: {
    fontWeight: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  selectedDayButtonText: {
    fontWeight: FONTS.BOLD,
    color: COLORS.WHITE,
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SIZES.MARGIN_BASE,
  },
  calendarCancelButton: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: SIZES.PADDING_LG,
    borderRadius: SIZES.RADIUS_LG,
    backgroundColor: COLORS.GRAY_100,
  },
  calendarCancelText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  calendarClearButton: {
    height: 44,
    justifyContent: 'center',
    marginLeft: SIZES.MARGIN_BASE,
    paddingHorizontal: SIZES.PADDING_LG,
    borderRadius: SIZES.RADIUS_LG,
    backgroundColor: COLORS.ERROR + '15',
  },
  calendarClearText: {
    fontSize: SIZES.FONT_BASE,
    fontWeight: FONTS.SEMIBOLD,
    color: COLORS.ERROR,
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
