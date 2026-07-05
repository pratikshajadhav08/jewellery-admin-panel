import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { GestureResponderEvent, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, makeShadow, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';
import { Product } from '../lib/firestore/types';
import Badge from './Badge';

export function stockLabel(stock: number) {
  if (stock === 0) return 'Out of Stock';
  if (stock <= 3) return 'Low Stock';
  return 'In Stock';
}

export default function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [viewerVisible, setViewerVisible] = useState(false);

  const openViewer = (event: GestureResponderEvent) => {
    // Stop the tap from also triggering the card's own onPress (navigate to
    // detail) - we only want the image tap to open the full-screen preview.
    event.stopPropagation();
    setViewerVisible(true);
  };

  return (
    <>
      <Pressable style={({ pressed }) => [styles.card, makeShadow(colors), pressed && styles.pressed]} onPress={onPress}>
        <Pressable onPress={openViewer}>
          <Image source={{ uri: product.image }} style={styles.image} />
        </Pressable>
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

      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerVisible(false)}>
          <Image source={{ uri: product.image }} style={styles.viewerImage} resizeMode="contain" />
          <Pressable style={styles.viewerClose} onPress={() => setViewerVisible(false)} hitSlop={10}>
            <Feather name="x" size={22} color={colors.ivory} />
          </Pressable>
          <Text style={styles.viewerCaption} numberOfLines={1}>{product.name}</Text>
        </Pressable>
      </Modal>
    </>
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
  viewerBackdrop: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCaption: {
    position: 'absolute',
    bottom: 40,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ivory,
  },
});