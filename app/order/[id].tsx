import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Badge from '../../components/Badge';
import ScreenHeader from '../../components/ScreenHeader';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { useOrder, updateOrderStatus, recordPayment, computeNetPayable } from '../../lib/firestore/orders';
import { OrderStatus } from '../../lib/firestore/types';
import { generateAndShareInvoice } from '../../lib/invoice';
import { useAppTheme } from '../../hooks/use-app-theme';

const STAGES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];

function alertMessage(title: string, message: string) {
  console.error(`${title}: ${message}`);
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function OrderDetail() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, loading } = useOrder(id);
  const [updating, setUpdating] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentInput, setPaymentInput] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const cancelled = order.status === 'Cancelled';
  const currentStageIndex = STAGES.indexOf(order.status);
  const nextStage = STAGES[currentStageIndex + 1];

  const advanceStatus = async () => {
    if (!nextStage) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, nextStage);
    } catch (err) {
      alertMessage('Could not update order', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = () => {
    const doCancel = async () => {
      try {
        await updateOrderStatus(order.id, 'Cancelled');
      } catch (err) {
        alertMessage('Could not cancel', err instanceof Error ? err.message : 'Something went wrong.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Cancel order ${order.id}?`)) {
        doCancel();
      }
      return;
    }

    Alert.alert('Cancel Order', `Cancel order ${order.id}?`, [
      { text: 'Keep order', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: doCancel },
    ]);
  };

  const amountPaid = order.amountPaid ?? 0;
  const netPayable = computeNetPayable(order.total, order.exchangeValue);
  const balanceDue = Math.max(netPayable - amountPaid, 0);
  const paymentStatus = order.paymentStatus ?? (amountPaid <= 0 ? 'Unpaid' : amountPaid >= netPayable ? 'Paid' : 'Partially Paid');

  const openPaymentModal = () => {
    setPaymentInput('');
    setPaymentModalVisible(true);
  };

  const submitPayment = async () => {
    const additional = Number(paymentInput);
    if (!additional || additional <= 0) {
      alertMessage('Invalid amount', 'Enter a payment amount greater than 0.');
      return;
    }
    setRecordingPayment(true);
    try {
      await recordPayment(order.id, amountPaid + additional, netPayable);
      setPaymentModalVisible(false);
    } catch (err) {
      alertMessage('Could not record payment', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      await generateAndShareInvoice(order);
    } catch (err) {
      alertMessage('Could not generate invoice', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={order.customer}
        subtitle={`${order.date} · Order ${order.id}`}
        back
        right={<Badge label={order.status} />}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          {!cancelled && (() => {
            const edgeInsetPercent = 100 / (2 * STAGES.length);
            const trackSpanPercent = 100 - edgeInsetPercent * 2;
            const progressPercent = (currentStageIndex / (STAGES.length - 1)) * trackSpanPercent;
            return (
              <View style={styles.timeline}>
                <View style={styles.timelineTrack} />
                <View style={[styles.timelineProgress, { width: `${progressPercent}%` }]} />
                <View style={styles.timelineDotsRow}>
                  {STAGES.map((stage, index) => (
                    <View key={stage} style={styles.timelineStep}>
                      <View style={[styles.dot, index <= currentStageIndex && styles.dotActive]}>
                        {index <= currentStageIndex && <Feather name="check" size={10} color={colors.bg} />}
                    </View>
                    <Text style={[styles.stageLabel, index <= currentStageIndex && styles.stageLabelActive]}>{stage}</Text>
                  </View>
                ))}
              </View>
            </View>
            );
          })()}

          {cancelled && (
            <View style={styles.cancelledBanner}>
              <Feather name="x-circle" size={16} color={colors.danger} />
              <Text style={styles.cancelledText}>This order was cancelled</Text>
            </View>
          )}

          <Pressable style={styles.invoiceBtn} onPress={handleGenerateInvoice} disabled={generatingInvoice}>
            {generatingInvoice ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <>
                <Feather name="file-text" size={15} color={colors.bg} />
                <Text style={styles.invoiceText}>Generate Invoice</Text>
              </>
            )}
          </Pressable>

          {!cancelled && (
            <View style={styles.actionsRow}>
              {nextStage && (
                <Pressable style={styles.advanceBtn} onPress={advanceStatus} disabled={updating}>
                  {updating ? (
                    <ActivityIndicator size="small" color={colors.bg} />
                  ) : (
                    <>
                      <Feather name="arrow-right-circle" size={15} color={colors.bg} />
                      <Text style={styles.advanceText}>Mark as {nextStage}</Text>
                    </>
                  )}
                </Pressable>
              )}
              <Pressable style={styles.cancelBtn} onPress={cancelOrder}>
                <Feather name="x" size={15} color={colors.danger} />
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.card}>
            {order.exchangeValue ? (
              <>
                <View style={[styles.paymentRow, styles.itemBorder]}>
                  <Text style={styles.infoLabel}>Items Total</Text>
                  <Text style={styles.paymentValue}>Rs. {order.total.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.paymentRow, styles.itemBorder]}>
                  <Text style={styles.infoLabel}>
                    Old Gold Exchange{order.exchangeDescription ? ` (${order.exchangeDescription})` : ''}
                  </Text>
                  <Text style={[styles.paymentValue, styles.paymentValueDue]}>
                    - Rs. {order.exchangeValue.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.paymentRow, styles.itemBorder]}>
                  <Text style={styles.infoLabel}>Net Payable</Text>
                  <Text style={styles.paymentValue}>Rs. {netPayable.toLocaleString('en-IN')}</Text>
                </View>
              </>
            ) : null}
            <View style={[styles.paymentRow, styles.itemBorder]}>
              <Text style={styles.infoLabel}>Status</Text>
              <Badge label={paymentStatus} />
            </View>
            <View style={[styles.paymentRow, styles.itemBorder]}>
              <Text style={styles.infoLabel}>Amount Paid</Text>
              <Text style={styles.paymentValue}>Rs. {amountPaid.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.infoLabel}>Balance Due</Text>
              <Text style={[styles.paymentValue, balanceDue > 0 && styles.paymentValueDue]}>
                Rs. {balanceDue.toLocaleString('en-IN')}
              </Text>
            </View>
            {balanceDue > 0 && !cancelled && (
              <Pressable style={styles.recordPaymentBtn} onPress={openPaymentModal}>
                <Feather name="plus-circle" size={14} color={colors.gold} />
                <Text style={styles.recordPaymentText}>Record Payment</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.card}>
            {order.items.map((item, index) => (
              <View key={item.name} style={[styles.itemRow, index !== order.items.length - 1 && styles.itemBorder]}>
                <View style={styles.itemThumb}>
                  <Feather name="box" size={16} color={colors.gold} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>Qty {item.qty}</Text>
                </View>
                <Text style={styles.itemPrice}>Rs. {item.price.toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {order.total.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <InfoRow icon="user" label="Name" value={order.customer} colors={colors} styles={styles} />
            <InfoRow icon="map-pin" label="Delivery Address" value={order.address} colors={colors} styles={styles} />
            <InfoRow icon="credit-card" label="Payment Method" value={order.payment} last colors={colors} styles={styles} />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.paymentModalBackdrop}>
          <View style={styles.paymentModalCard}>
            <Text style={styles.paymentModalTitle}>Record Payment</Text>
            <Text style={styles.paymentModalSubtitle}>
              Balance due: Rs. {balanceDue.toLocaleString('en-IN')}
            </Text>
            <TextInput
              value={paymentInput}
              onChangeText={setPaymentInput}
              keyboardType="numeric"
              placeholder="Amount received"
              placeholderTextColor={colors.ivoryFaint}
              style={styles.paymentModalInput}
              autoFocus
            />
            <View style={styles.paymentModalActions}>
              <Pressable
                style={styles.paymentModalCancel}
                onPress={() => setPaymentModalVisible(false)}
                disabled={recordingPayment}
              >
                <Text style={styles.paymentModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.paymentModalSubmit} onPress={submitPayment} disabled={recordingPayment}>
                {recordingPayment ? (
                  <ActivityIndicator size="small" color={colors.bg} />
                ) : (
                  <Text style={styles.paymentModalSubmitText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
  colors,
  styles,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  last?: boolean;
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.itemBorder]}>
      <Feather name={icon} size={15} color={colors.ivoryFaint} style={styles.infoIcon} />
      <View style={styles.itemInfo}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  inner: { width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center' },
  timeline: { position: 'relative', marginBottom: spacing.xl, paddingHorizontal: spacing.xs, paddingTop: 11 },
  timelineTrack: {
    position: 'absolute',
    top: 22,
    left: `${100 / (2 * STAGES.length)}%`,
    right: `${100 / (2 * STAGES.length)}%`,
    height: 2,
    backgroundColor: colors.border,
  },
  timelineProgress: {
    position: 'absolute',
    top: 22,
    left: `${100 / (2 * STAGES.length)}%`,
    height: 2,
    backgroundColor: colors.gold,
  },
  timelineDotsRow: { flexDirection: 'row' },
  timelineStep: { flex: 1, alignItems: 'center' },
  dot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  dotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  stageLabel: { fontFamily: fonts.body, fontSize: 9.5, color: colors.ivoryFaint, marginTop: 6, textAlign: 'center' },
  stageLabelActive: { color: colors.ivory, fontFamily: fonts.bodySemi },
  cancelledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerBg,
    borderWidth: 1, borderColor: colors.logoutBorder, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  cancelledText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.danger },
  invoiceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.md,
  },
  invoiceText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.bg },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  advanceBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  advanceText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.logoutBorder, backgroundColor: colors.dangerBg,
    borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  cancelText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.danger },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 17, color: colors.ivory, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.xl, overflow: 'hidden',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemThumb: {
    width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.accentBg,
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory },
  itemQty: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ivoryFaint, marginTop: 2 },
  itemPrice: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ivory },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.surfaceAlt },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivoryMuted },
  totalValue: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.gold },
  infoRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  infoIcon: { marginTop: 2 },
  infoLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint },
  infoValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory, marginTop: 2 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  paymentValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory },
  paymentValueDue: { color: colors.warning },
  recordPaymentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
  },
  recordPaymentText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.gold },
  paymentModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  paymentModalCard: {
    width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md,
  },
  paymentModalTitle: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.ivory },
  paymentModalSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryMuted, marginTop: -8 },
  paymentModalInput: {
    fontFamily: fonts.body, fontSize: 15, color: colors.ivory, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  paymentModalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  paymentModalCancel: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  paymentModalCancelText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ivoryMuted },
  paymentModalSubmit: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md,
    backgroundColor: colors.gold, borderRadius: radius.md,
  },
  paymentModalSubmitText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.bg },
});