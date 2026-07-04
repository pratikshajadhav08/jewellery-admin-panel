import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, fonts, layout, makeShadow, radius, spacing } from '../../constants/theme';
import { useAdmin, updateAdmin } from '../../lib/firestore/meta';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useAuthUser, signOutAdmin } from '../../lib/auth';

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
  const { user } = useAuthUser();
  const { admin, loading } = useAdmin();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [store, setStore] = useState('');

  // Sync local edit fields whenever the live profile changes (and isn't
  // mid-edit), so external updates don't get clobbered by stale state.
  useEffect(() => {
    if (admin && !editMode) {
      setName(admin.name);
      setRole(admin.role);
      setStore(admin.store);
    }
  }, [admin, editMode]);

  const handleLogout = async () => {
    try {
      await signOutAdmin();
    } catch (error) {
      Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
      return;
    }
    router.replace('/login');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Missing info', 'Username cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const initials = name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      await updateAdmin(user.uid, {
        name: name.trim(),
        role: role.trim() || 'Administrator',
        store: store.trim() || 'Aurelia Fine Jewellery',
        avatarInitials: initials || 'A',
        email: admin?.email ?? user.email ?? '',
      });
      setEditMode(false);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !admin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <Text style={styles.title}>Profile</Text>

          <View style={[styles.card, makeShadow(colors)]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{admin.avatarInitials}</Text>
            </View>

            {editMode ? (
              <>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Username"
                  placeholderTextColor={colors.ivoryFaint}
                  style={styles.nameInput}
                />
                <TextInput
                  value={role}
                  onChangeText={setRole}
                  placeholder="Role (e.g. Store Manager)"
                  placeholderTextColor={colors.ivoryFaint}
                  style={styles.roleInput}
                />
                <TextInput
                  value={store}
                  onChangeText={setStore}
                  placeholder="Store name"
                  placeholderTextColor={colors.ivoryFaint}
                  style={styles.roleInput}
                />
              </>
            ) : (
              <>
                <Text style={styles.name}>{admin.name}</Text>
                <Text style={styles.role}>{admin.role}</Text>
              </>
            )}

            {/* Email is tied to the sign-in account, so it's shown small and
                separate from the username rather than as the main identity. */}
            <Text style={styles.email}>{admin.email}</Text>

            <Pressable
              style={styles.editBtn}
              onPress={() => (editMode ? handleSave() : setEditMode(true))}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <>
                  <Feather name={editMode ? 'check' : 'edit-2'} size={13} color={colors.gold} />
                  <Text style={styles.editText}>{editMode ? 'Save' : 'Edit Profile'}</Text>
                </>
              )}
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

          <Pressable style={styles.logout} onPress={handleLogout}>
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
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  nameInput: {
    fontFamily: fonts.displaySemi, fontSize: 17, color: colors.ivory, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, padding: spacing.sm, backgroundColor: colors.bgElevated, minWidth: 220, textAlign: 'center', marginBottom: 6,
  },
  role: { fontFamily: fonts.body, fontSize: 12.5, color: colors.gold, marginTop: 3 },
  roleInput: {
    fontFamily: fonts.body, fontSize: 12.5, color: colors.gold, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, padding: 8, backgroundColor: colors.bgElevated, minWidth: 220, textAlign: 'center', marginBottom: 6,
  },
  email: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ivoryFaint, marginTop: 4 },
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