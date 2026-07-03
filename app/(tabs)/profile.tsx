import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, fonts, layout, makeShadow, radius, spacing } from '../../constants/theme';
import { admin } from '../../data/dummyData';
import { useAppTheme } from '../../hooks/use-app-theme';

const MENU: { icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { icon: 'shopping-bag', label: 'Store Settings' },
  { icon: 'credit-card', label: 'Payment Methods' },
  { icon: 'truck', label: 'Shipping & Delivery' },
  { icon: 'shield', label: 'Security' },
  { icon: 'help-circle', label: 'Help & Support' },
];

export default function Profile() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = createStyles(colors);
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <Text style={styles.title}>Profile</Text>

          <View style={[styles.card, makeShadow(colors)]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{admin.avatarInitials}</Text>
            </View>
            <Text style={styles.name}>{admin.name}</Text>
            <Text style={styles.role}>{admin.role}</Text>
            <Text style={styles.email}>{admin.email}</Text>
            <Pressable style={styles.editBtn}>
              <Feather name="edit-2" size={13} color={colors.gold} />
              <Text style={styles.editText}>Edit Profile</Text>
            </Pressable>
          </View>

          <View style={styles.storeCard}>
            <Feather name="award" size={16} color={colors.gold} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{admin.store}</Text>
              <Text style={styles.storeMeta}>Store administrator access</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.menuGroup}>
            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuLeft}>
                <Feather name={isDark ? 'moon' : 'sun'} size={16} color={colors.ivoryMuted} />
                <Text style={styles.menuLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.surfaceAlt, true: colors.goldDim }}
                thumbColor={isDark ? colors.gold : colors.ivoryFaint}
              />
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Feather name="bell" size={16} color={colors.ivoryMuted} />
                <Text style={styles.menuLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.surfaceAlt, true: colors.goldDim }}
                thumbColor={notifications ? colors.gold : colors.ivoryFaint}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>GENERAL</Text>
          <View style={styles.menuGroup}>
            {MENU.map((item, index) => (
              <Pressable key={item.label} style={[styles.menuItem, index !== MENU.length - 1 && styles.menuItemBorder]}>
                <View style={styles.menuLeft}>
                  <Feather name={item.icon} size={16} color={colors.ivoryMuted} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.ivoryFaint} />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logout} onPress={() => router.replace('/login')}>
            <Feather name="log-out" size={16} color={colors.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <Text style={styles.version}>Aurelia Admin v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  inner: { width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center' },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ivory, paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg,
  },
  avatar: {
    width: 68, height: 68, borderRadius: radius.pill, backgroundColor: colors.accentBg,
    borderWidth: 1, borderColor: colors.goldDim, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  avatarText: { fontFamily: fonts.display, fontSize: 22, color: colors.goldSoft },
  name: { fontFamily: fonts.displaySemi, fontSize: 19, color: colors.ivory },
  role: { fontFamily: fonts.body, fontSize: 12.5, color: colors.gold, marginTop: 3 },
  email: { fontFamily: fonts.body, fontSize: 12, color: colors.ivoryMuted, marginTop: 6 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg,
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8,
  },
  editText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.gold },
  storeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  storeInfo: { flex: 1 },
  storeName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory },
  storeMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryMuted, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.ivoryFaint, marginBottom: spacing.sm },
  menuGroup: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.xl, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ivory },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.logoutBorder, borderRadius: radius.md, paddingVertical: spacing.md, backgroundColor: colors.dangerBg,
  },
  logoutText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.danger },
  version: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint, textAlign: 'center', marginTop: spacing.xl },
});
