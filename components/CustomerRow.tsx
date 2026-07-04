import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';
import { Customer } from '../lib/firestore/types';

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

export default function CustomerRow({ customer, onPress }: { customer: Customer; onPress?: () => void }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(customer.name)}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{customer.name}</Text>
          {customer.vip && (
            <View style={styles.vipTag}>
              <Feather name="star" size={9} color={colors.gold} />
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>{customer.email}</Text>
        <Text style={styles.meta}>{customer.orders} orders / Joined {customer.joined}</Text>
      </View>
      <Text style={styles.spent}>Rs. {customer.totalSpent.toLocaleString('en-IN')}</Text>
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
    gap: spacing.md,
  },
  pressed: { opacity: 0.85 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 14, color: colors.goldSoft },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ivory },
  vipTag: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.vipBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  vipText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.gold },
  meta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ivoryFaint },
  spent: { fontFamily: fonts.displaySemi, fontSize: 13.5, color: colors.ivory },
});
