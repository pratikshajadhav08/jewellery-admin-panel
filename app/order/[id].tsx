import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Badge from '../../components/Badge';
import ScreenHeader from '../../components/ScreenHeader';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { useOrder, updateOrderStatus } from '../../lib/firestore/orders';
import { OrderStatus } from '../../lib/firestore/types';
import { useAppTheme } from '../../hooks/use-app-theme';

const STAGES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];

export default function OrderDetail() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, loading } = useOrder(id);
  const [updating, setUpdating] = useState(false);

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
      Alert.alert('Could not update order', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = () => {
    Alert.alert('Cancel Order', `Cancel order ${order.id}?`, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateOrderStatus(order.id, 'Cancelled');
          } catch (err) {
            Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={order.id} subtitle={order.date} back right={<Badge label={order.status} />} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          {!cancelled && (
            <View style={styles.timeline}>
              {STAGES.map((stage, index) => (
                <View key={stage} style={styles.timelineStep}>
                  <View style={styles.timelineDotCol}>
                    <View style={[styles.dot, index <= currentStageIndex && styles.dotActive]}>
                      {index <= currentStageIndex && <Feather name="check" size={10} color={colors.bg} />}
                    </View>
                    {index < STAGES.length - 1 && (
                      <View style={[styles.line, index < currentStageIndex && styles.lineActive]} />
                    )}
                  </View>
                  <Text style={[styles.stageLabel, index <= currentStageIndex && styles.stageLabelActive]}>{stage}</Text>
                </View>
              ))}
            </View>
          )}

          {cancelled && (
            <View style={styles.cancelledBanner}>
              <Feather name="x-circle" size={16} color={colors.danger} />
              <Text style={styles.cancelledText}>This order was cancelled</Text>
            </View>
          )}

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
  timeline: { flexDirection: 'row', marginBottom: spacing.xl, paddingHorizontal: spacing.xs },
  timelineStep: { flex: 1, alignItems: 'center' },
  timelineDotCol: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  dot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  dotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  line: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: -2 },
  lineActive: { backgroundColor: colors.gold },
  stageLabel: { fontFamily: fonts.body, fontSize: 9.5, color: colors.ivoryFaint, marginTop: 6, textAlign: 'center' },
  stageLabelActive: { color: colors.ivory, fontFamily: fonts.bodySemi },
  cancelledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerBg,
    borderWidth: 1, borderColor: colors.logoutBorder, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  cancelledText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.danger },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  advanceBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  advanceText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.bg },
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
});