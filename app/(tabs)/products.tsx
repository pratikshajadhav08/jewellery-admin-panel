import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductCard from '../../components/ProductCard';
import StateMessage from '../../components/StateMessage';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { useProducts } from '../../lib/firestore/products'; // <-- was: import { products } from '../../data/dummyData'
import { useAppTheme } from '../../hooks/use-app-theme';

const CATEGORIES = ['All', 'Necklace', 'Ring', 'Earrings', 'Bracelet'];

export default function Products() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const columns = width >= 980 ? 4 : width >= 700 ? 3 : width < 430 ? 1 : 2;

  // Firestore replaces the static `products` array. `data` is the live list,
  // kept in sync automatically (onSnapshot) whenever Firestore changes.
  const { data: products, loading, error } = useProducts();

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Products</Text>
            <Text style={styles.subtitle}>{filtered.length} catalogue pieces</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => router.push('/product/new')}>
            <Feather name="plus" size={20} color={colors.bg} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.ivoryFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products..."
            placeholderTextColor={colors.ivoryFaint}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          horizontal
          style={styles.chipsList}
          data={CATEGORIES}
          keyExtractor={(categoryName) => categoryName}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.chip, category === item && styles.chipActive]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          )}
        />

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : error ? (
          <StateMessage title="Could not load products" message={error.message} />
        ) : (
          <FlatList
            key={columns}
            data={filtered}
            keyExtractor={(product) => product.id}
            numColumns={columns}
            columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="search" size={22} color={colors.ivoryFaint} />
                <Text style={styles.emptyText}>No products match your search</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ivory },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryMuted, marginTop: 2 },
  addBtn: {
    width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.ivory },
  chipsList: { flexGrow: 0, flexShrink: 0 },
  chipsRow: { gap: spacing.sm, paddingVertical: spacing.md, alignItems: 'flex-start' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ivoryMuted },
  chipTextActive: { color: colors.bg },
  grid: { paddingBottom: spacing.xxl, gap: spacing.md },
  columnWrapper: { gap: spacing.md },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.ivoryFaint },
});
