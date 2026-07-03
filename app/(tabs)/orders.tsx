import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrderRow from '../../components/OrderRow';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { orders } from '../../data/dummyData';
import { useAppTheme } from '../../hooks/use-app-theme';

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(
    () => (filter === 'All' ? orders : orders.filter((order) => order.status === filter)),
    [filter]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Orders</Text>
            <Text style={styles.subtitle}>Track fulfilment and payments</Text>
          </View>
          <Text style={styles.count}>{filtered.length} orders</Text>
        </View>

        <FlatList
          horizontal
          style={styles.chipsList}
          data={FILTERS}
          keyExtractor={(filterName) => filterName}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <Pressable style={[styles.chip, filter === item && styles.chipActive]} onPress={() => setFilter(item)}>
              <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          )}
        />

        <FlatList
          data={filtered}
          keyExtractor={(order) => order.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <OrderRow order={item} onPress={() => router.push(`/order/${item.id}`)} />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ivory },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryMuted, marginTop: 2 },
  count: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryMuted },
  chipsList: { flexGrow: 0, flexShrink: 0 },
  chipsRow: { gap: spacing.sm, paddingVertical: spacing.md, alignItems: 'flex-start' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ivoryMuted },
  chipTextActive: { color: colors.bg },
  list: { paddingBottom: spacing.xxl },
});
