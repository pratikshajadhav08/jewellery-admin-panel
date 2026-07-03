import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, makeShadow, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  label: string;
  value: string;
  change?: number;
  icon: keyof typeof Feather.glyphMap;
};

export default function StatCard({ label, value, change, icon }: Props) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const positive = (change ?? 0) >= 0;
  return (
    <View style={[styles.card, makeShadow(colors)]}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={16} color={colors.gold} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {change !== undefined && (
        <View style={styles.changeRow}>
          <Feather
            name={positive ? 'trending-up' : 'trending-down'}
            size={12}
            color={positive ? colors.success : colors.danger}
          />
          <Text style={[styles.changeText, { color: positive ? colors.success : colors.danger }]}>
            {positive ? '+' : ''}{change}%
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flex: 1,
    minWidth: 150,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  value: { fontFamily: fonts.display, fontSize: 22, color: colors.ivory },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.ivoryMuted, marginTop: 4 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  changeText: { fontFamily: fonts.bodyBold, fontSize: 11 },
});
