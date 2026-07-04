import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { createCustomer } from '../../lib/firestore/customers';
import { useAppTheme } from '../../hooks/use-app-theme';

function currentJoinedLabel() {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  return `${month} ${now.getFullYear()}`;
}

export default function NewCustomer() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vip, setVip] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name || !email) {
      Alert.alert('Missing info', 'Please add at least a name and email.');
      return;
    }
    setSubmitting(true);
    try {
      await createCustomer({
        name,
        email,
        phone,
        orders: 0,
        totalSpent: 0,
        joined: currentJoinedLabel(),
        vip,
      });
      router.back();
    } catch (err) {
      Alert.alert('Could not add customer', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>New Customer</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={colors.ivoryMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <Field label="Full Name" styles={styles}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Meera Kulkarni"
              placeholderTextColor={colors.ivoryFaint}
              style={styles.input}
            />
          </Field>

          <Field label="Email" styles={styles}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor={colors.ivoryFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </Field>

          <Field label="Phone" styles={styles}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 90000 00000"
              placeholderTextColor={colors.ivoryFaint}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Field>

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

          <Pressable style={styles.submit} onPress={handleCreate} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <Feather name="check" size={16} color={colors.bg} />
                <Text style={styles.submitText}>Add Customer</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children, styles }: { label: string; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ivory },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  inner: { width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', gap: spacing.lg },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ivoryMuted },
  input: {
    fontFamily: fonts.body, fontSize: 14, color: colors.ivory, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48,
  },
  vipRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
  },
  vipHint: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint, marginTop: 2 },
  submit: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, height: 52, borderRadius: radius.md, marginTop: spacing.sm,
  },
  submitText: { fontFamily: fonts.bodyExtra, fontSize: 14.5, color: colors.bg },
});