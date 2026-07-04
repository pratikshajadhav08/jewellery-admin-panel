import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { useCustomer, updateCustomer, deleteCustomer } from '../../lib/firestore/customers';
import { useAppTheme } from '../../hooks/use-app-theme';

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

export default function CustomerDetail() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customer, loading } = useCustomer(id);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vip, setVip] = useState(false);

  // Sync local edit fields whenever the live customer doc changes (and isn't
  // mid-edit), so external updates don't get clobbered by stale state.
  useEffect(() => {
    if (customer && !editMode) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setVip(customer.vip);
    }
  }, [customer, editMode]);

  if (loading || !customer) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert('Missing info', 'Name and email cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateCustomer(customer.id, { name, email, phone, vip });
      setEditMode(false);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await deleteCustomer(customer.id);
        router.back();
      } catch (err) {
        console.error('Delete customer failed:', err);
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        if (Platform.OS === 'web') {
          window.alert(`Could not delete: ${message}`);
        } else {
          Alert.alert('Could not delete', message);
        }
      }
    };

    // Alert.alert has no effect on web (react-native-web doesn't implement
    // it), so use window.confirm there instead, and the native Alert on
    // iOS/Android.
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${customer.name} from your customer list?`)) {
        doDelete();
      }
      return;
    }

    Alert.alert('Delete Customer', `Remove ${customer.name} from your customer list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={editMode ? 'Edit Customer' : 'Customer'}
        back
        right={
          <Pressable style={styles.editToggle} onPress={() => (editMode ? handleSave() : setEditMode(true))} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <>
                <Feather name={editMode ? 'check' : 'edit-2'} size={14} color={colors.bg} />
                <Text style={styles.editToggleText}>{editMode ? 'Save' : 'Edit'}</Text>
              </>
            )}
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(name || customer.name)}</Text>
            </View>

            {editMode ? (
              <TextInput value={name} onChangeText={setName} style={styles.nameInput} placeholder="Full name" placeholderTextColor={colors.ivoryFaint} />
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.name}>{customer.name}</Text>
                {customer.vip && (
                  <View style={styles.vipTag}>
                    <Feather name="star" size={10} color={colors.gold} />
                    <Text style={styles.vipText}>VIP</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.meta}>
              {customer.orders} orders / Joined {customer.joined}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>Rs. {customer.totalSpent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>{customer.orders}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.card}>
            <View style={[styles.infoRow, styles.infoBorder]}>
              <Feather name="mail" size={15} color={colors.ivoryFaint} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                {editMode ? (
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.inlineInput}
                  />
                ) : (
                  <Text style={styles.infoValue}>{customer.email}</Text>
                )}
              </View>
            </View>
            <View style={styles.infoRow}>
              <Feather name="phone" size={15} color={colors.ivoryFaint} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                {editMode ? (
                  <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.inlineInput} />
                ) : (
                  <Text style={styles.infoValue}>{customer.phone || '—'}</Text>
                )}
              </View>
            </View>
          </View>

          {editMode && (
            <View style={styles.vipRow}>
              <View>
                <Text style={styles.fieldLabel}>VIP Customer</Text>
                <Text style={styles.vipHint}>Flag for priority outreach</Text>
              </View>
              <Switch
                value={vip}
                onValueChange={setVip}
                trackColor={{ false: colors.surfaceAlt, true: colors.goldDim }}
                thumbColor={vip ? colors.gold : colors.ivoryFaint}
              />
            </View>
          )}

          {!editMode && (
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Feather name="trash-2" size={15} color={colors.danger} />
              <Text style={styles.deleteText}>Delete Customer</Text>
            </Pressable>
          )}
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
  profileCard: {
    alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg, gap: 4,
  },
  avatar: {
    width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.accentBg,
    borderWidth: 1, borderColor: colors.goldDim, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  avatarText: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.goldSoft },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.display, fontSize: 22, color: colors.ivory },
  nameInput: {
    fontFamily: fonts.display, fontSize: 19, color: colors.ivory, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, padding: spacing.sm, backgroundColor: colors.bgElevated, minWidth: 200, textAlign: 'center',
  },
  vipTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.vipBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  vipText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.gold },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.ivoryMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
  },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.ivoryFaint, marginBottom: 4 },
  statValue: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.ivory },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.ivory, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.lg, overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'center' },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoIcon: { marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint },
  infoValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory, marginTop: 2 },
  inlineInput: {
    fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, marginTop: 4, backgroundColor: colors.bgElevated,
  },
  vipRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl,
  },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ivoryMuted },
  vipHint: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint, marginTop: 2 },
  editToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.gold,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, minWidth: 64, justifyContent: 'center',
  },
  editToggleText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.bg },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.logoutBorder, backgroundColor: colors.dangerBg,
    borderRadius: radius.md, paddingVertical: spacing.md, marginTop: spacing.sm,
  },
  deleteText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.danger },
});