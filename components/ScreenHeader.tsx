import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors, fonts, layout, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
};

export default function ScreenHeader({ title, subtitle, back, right }: Props) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.shell}>
      <View style={styles.wrap}>
        <View style={styles.left}>
          {back && (
            <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
              <Feather name="arrow-left" size={18} color={colors.ivory} />
            </Pressable>
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {right}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  shell: { paddingHorizontal: spacing.lg },
  wrap: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ivory },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryMuted, marginTop: 2 },
});
