import { StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, radius } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';

function getVariants(colors: AppColors): Record<string, { fg: string; bg: string }> {
  return {
    Pending: { fg: colors.warning, bg: colors.warningBg },
    Processing: { fg: colors.info, bg: colors.infoBg },
    Shipped: { fg: colors.gold, bg: colors.vipBg },
    Delivered: { fg: colors.success, bg: colors.successBg },
    Cancelled: { fg: colors.danger, bg: colors.dangerBg },
    'In Stock': { fg: colors.success, bg: colors.successBg },
    'Low Stock': { fg: colors.warning, bg: colors.warningBg },
    'Out of Stock': { fg: colors.danger, bg: colors.dangerBg },
    Paid: { fg: colors.success, bg: colors.successBg },
    'Partially Paid': { fg: colors.warning, bg: colors.warningBg },
    Unpaid: { fg: colors.danger, bg: colors.dangerBg },
  };
}

export default function Badge({ label }: { label: string }) {
  const { colors } = useAppTheme();
  const variant = getVariants(colors)[label] ?? { fg: colors.ivoryMuted, bg: colors.surfaceAlt };
  return (
    <View style={[styles.wrap, { backgroundColor: variant.bg }]}>
      <View style={[styles.dot, { backgroundColor: variant.fg }]} />
      <Text style={[styles.label, { color: variant.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.3 },
});