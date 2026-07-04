import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrderRow from '../../components/OrderRow';
import StateMessage from '../../components/StateMessage';
import StatCard from '../../components/StatCard';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { useProducts } from '../../lib/firestore/products';
import { useOrders } from '../../lib/firestore/orders';
import { useDashboardStats, useAdmin } from '../../lib/firestore/meta';
import { useAppTheme } from '../../hooks/use-app-theme';

export default function Dashboard() {
  const { colors, mode, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors);
  const isWide = width >= 820;

  const { data: products, loading: productsLoading, error: productsError } = useProducts();
  const { data: orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { stats: dashboardStats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { admin, loading: adminLoading, error: adminError } = useAdmin();

  const loading = productsLoading || ordersLoading || statsLoading || adminLoading;
  const error = productsError ?? ordersError ?? statsError ?? adminError;
  const lowStockItems = products.filter((product) => product.stock <= 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !dashboardStats || !admin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <StateMessage
            title="Firestore is not ready"
            message={error?.message ?? 'Seed the meta/admin and meta/dashboardStats documents.'}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.name}>{admin.name.split(' ')[0]}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.themeButton} onPress={toggleTheme}>
                <Feather name={mode === 'dark' ? 'sun' : 'moon'} size={18} color={colors.gold} />
              </Pressable>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{admin.avatarInitials}</Text>
              </View>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>Aurelia Fine Jewellery</Text>
              <Text style={styles.heroTitle}>Store pulse for today: appointments, orders, and stock.</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>Rs. {(dashboardStats.totalSales / 100000).toFixed(1)}L</Text>
              <Text style={styles.heroMetricLabel}>monthly sales</Text>
            </View>
          </View>

          <View style={[styles.statsWrap, isWide && styles.statsWrapWide]}>
            <StatCard label="Total Sales" value={`Rs. ${(dashboardStats.totalSales / 100000).toFixed(1)}L`} change={dashboardStats.salesChange} icon="trending-up" />
            <StatCard label="Orders Today" value={String(dashboardStats.ordersToday)} change={dashboardStats.ordersChange} icon="shopping-bag" />
            <StatCard label="Total Products" value={String(products.length)} icon="package" />
            <StatCard label="Low Stock" value={String(lowStockItems.length)} icon="alert-triangle" />
          </View>

          {lowStockItems.length > 0 && (
            <View style={styles.alertBanner}>
              <Feather name="alert-triangle" size={16} color={colors.warning} />
              <Text style={styles.alertText}>
                {lowStockItems.length} pieces are running low. Restock soon.
              </Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <Pressable onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
          <View style={styles.orderList}>
            {orders.slice(0, 4).map((order) => (
              <OrderRow key={order.id} order={order} onPress={() => router.push(`/order/${order.id}`)} />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction} onPress={() => router.push('/product/new')}>
              <Feather name="plus-circle" size={18} color={colors.gold} />
              <Text style={styles.quickActionText}>Add Product</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/customers')}>
              <Feather name="users" size={18} color={colors.gold} />
              <Text style={styles.quickActionText}>Customers</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  inner: { width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.lg },
  greeting: { fontFamily: fonts.body, fontSize: 13, color: colors.ivoryMuted },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.ivory, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.goldDim, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 15, color: colors.goldSoft },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  heroCopy: { flex: 1 },
  heroKicker: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.gold },
  heroTitle: { fontFamily: fonts.displaySemi, fontSize: 24, lineHeight: 31, color: colors.ivory, marginTop: spacing.xs },
  heroMetric: { alignItems: 'flex-end' },
  heroMetricValue: { fontFamily: fonts.display, fontSize: 24, color: colors.ivory },
  heroMetricLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.ivoryMuted, marginTop: 2 },
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  statsWrapWide: { flexWrap: 'nowrap' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.warningBg,
    borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  alertText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.warning, flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.sm },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.ivory },
  viewAll: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.gold },
  orderList: { gap: spacing.sm },
  quickActions: { flexDirection: 'row', gap: spacing.md },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  quickActionText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ivory },
});
