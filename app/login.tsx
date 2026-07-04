import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppColors, fonts, layout, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/use-app-theme';
import { firebaseConfigError } from '../lib/firebase';
import { sendAdminPasswordReset, signInAdmin } from '../lib/auth';

export default function Login() {
  const { colors, mode, toggleTheme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const styles = createStyles(colors, isWide);
  const [email, setEmail] = useState('ishita@aurelia-jewels.com');
  const [password, setPassword] = useState('');
  const [hide, setHide] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (firebaseConfigError) {
      Alert.alert('Firebase is not configured', firebaseConfigError);
      return;
    }
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInAdmin(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Email required', 'Enter your email first, then request a password reset.');
      return;
    }

    try {
      await sendAdminPasswordReset(email);
      Alert.alert('Password reset sent', 'Check your email for a reset link.');
    } catch (error) {
      Alert.alert('Could not send reset', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.inner}>
          <View style={styles.brandPanel}>
            <Pressable style={styles.themeButton} onPress={toggleTheme}>
              <Feather name={mode === 'dark' ? 'sun' : 'moon'} size={18} color={colors.gold} />
            </Pressable>
            <View style={styles.crest}>
              <Feather name="hexagon" size={isWide ? 24 : 20} color={colors.gold} />
            </View>
            <Text style={styles.brand}>AURELIA</Text>
            <Text style={styles.brandSub}>FINE JEWELLERY ADMIN</Text>
            {isWide && (
              <View style={styles.panelMetric}>
                <Text style={styles.panelMetricValue}>24K</Text>
                <Text style={styles.panelMetricLabel}>catalogue control for premium inventory</Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.helper}>Sign in to manage your store</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={15} color={colors.ivoryFaint} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@store.com"
                  placeholderTextColor={colors.ivoryFaint}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Feather name="lock" size={15} color={colors.ivoryFaint} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={colors.ivoryFaint}
                  style={styles.input}
                  secureTextEntry={hide}
                />
                <Pressable onPress={() => setHide(!hide)} hitSlop={10}>
                  <Feather name={hide ? 'eye' : 'eye-off'} size={15} color={colors.ivoryFaint} />
                </Pressable>
              </View>
            </View>

            {firebaseConfigError && <Text style={styles.errorText}>{firebaseConfigError}</Text>}

            <Pressable style={styles.forgot} onPress={handlePasswordReset}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable style={styles.submit} onPress={handleSignIn} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <>
                  <Text style={styles.submitText}>Sign In</Text>
                  <Feather name="arrow-right" size={16} color={colors.bg} />
                </>
              )}
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>Aurelia Fine Jewellery / Est. 1998</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: AppColors, isWide: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    flexDirection: isWide ? 'row' : 'column',
    alignItems: 'stretch',
    gap: isWide ? spacing.xl : spacing.lg,
  },
  brandPanel: {
    flex: isWide ? 1 : undefined,
    minHeight: isWide ? 430 : undefined,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    padding: isWide ? spacing.xl : spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crest: {
    width: isWide ? 64 : 48,
    height: isWide ? 64 : 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isWide ? spacing.lg : spacing.sm,
    backgroundColor: colors.accentBg,
  },
  brand: { fontFamily: fonts.display, fontSize: isWide ? 31 : 24, color: colors.ivory },
  brandSub: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.gold, marginTop: 6 },
  panelMetric: {
    marginTop: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    alignItems: 'center',
    maxWidth: 260,
  },
  panelMetricValue: { fontFamily: fonts.display, fontSize: 36, color: colors.ivory },
  panelMetricLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.ivoryMuted, textAlign: 'center', marginTop: 4 },
  form: {
    flex: isWide ? 1 : undefined,
    gap: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: isWide ? spacing.xl : spacing.lg,
  },
  welcome: { fontFamily: fonts.displaySemi, fontSize: isWide ? 26 : 22, color: colors.ivory },
  helper: { fontFamily: fonts.body, fontSize: 13, color: colors.ivoryMuted, marginBottom: spacing.sm },
  inputGroup: { gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ivoryMuted },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ivory },
  forgot: { alignSelf: 'flex-end' },
  errorText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.danger, lineHeight: 18 },
  forgotText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.gold },
  submit: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, height: 52, borderRadius: radius.md, marginTop: spacing.sm,
  },
  submitText: { fontFamily: fonts.bodyExtra, fontSize: 14.5, color: colors.bg },
  footer: {
    fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint, textAlign: 'center', marginTop: spacing.xl,
  },
});