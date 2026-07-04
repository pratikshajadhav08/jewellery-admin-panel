import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  title: string;
  message?: string;
  icon?: keyof typeof Feather.glyphMap;
};

export default function StateMessage({ title, message, icon = 'alert-circle' }: Props) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={18} color={colors.gold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ivory, textAlign: 'center' },
  message: { fontFamily: fonts.body, fontSize: 12, color: colors.ivoryMuted, textAlign: 'center', lineHeight: 18 },
});
