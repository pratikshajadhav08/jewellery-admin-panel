import { Feather } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, makeShadow, radius, spacing } from '../constants/theme';
import { Product } from '../data/dummyData';
import { useAppTheme } from '../hooks/use-app-theme';
import Badge from './Badge';

function stockLabel(stock: number) {
  if (stock === 0) return 'Out of Stock';
  if (stock <= 3) return 'Low Stock';
  return 'In Stock';
}

export default function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Pressable style={({ pressed }) => [styles.card, makeShadow(colors), pressed && styles.pressed]} onPress={onPress}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.category}>{product.category.toUpperCase()} / {product.material}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>Rs. {product.price.toLocaleString('en-IN')}</Text>
        <View style={styles.footerRow}>
          <Badge label={stockLabel(product.stock)} />
          <View style={styles.stockCount}>
            <Feather name="box" size={11} color={colors.ivoryFaint} />
            <Text style={styles.stockCountText}>{product.stock} in stock</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flex: 1,
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', height: 150, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.md, gap: 4 },
  category: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.gold },
  name: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory, lineHeight: 18, minHeight: 36 },
  price: { fontFamily: fonts.display, fontSize: 16, color: colors.ivory, marginTop: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.sm },
  stockCount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stockCountText: { fontFamily: fonts.body, fontSize: 10, color: colors.ivoryFaint },
});
