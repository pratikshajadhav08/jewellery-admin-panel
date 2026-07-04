import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';
import { Order } from '../lib/firestore/types';
import Badge from './Badge';

export default function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.idRow}>
          <Text style={styles.id}>{order.id}</Text>
          <Text style={styles.date}>{order.date}</Text>
        </View>
        <Text style={styles.customer}>{order.customer}</Text>
        <Text style={styles.items} numberOfLines={1}>
          {order.items.map((item) => `${item.name} x${item.qty}`).join(', ')}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.total}>Rs. {order.total.toLocaleString('en-IN')}</Text>
        <Badge label={order.status} />
      </View>
      <Feather name="chevron-right" size={16} color={colors.ivoryFaint} />
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  left: { flex: 1, gap: 3 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  id: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.gold },
  date: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint },
  customer: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ivory, marginTop: 2 },
  items: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ivoryMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  total: { fontFamily: fonts.displaySemi, fontSize: 14, color: colors.ivory },
});
