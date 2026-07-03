import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-app-theme';

const CATEGORIES = ['Necklace', 'Ring', 'Earrings', 'Bracelet'];
const MATERIALS = ['18K Gold', 'Yellow Gold', 'Rose Gold', 'White Gold', 'Platinum'];

export default function NewProduct() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name || !price) {
      Alert.alert('Missing info', 'Please add at least a name and price.');
      return;
    }
    Alert.alert('Product Added', `${name} has been added to your catalog (dummy data only).`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>New Product</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={colors.ivoryMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <Pressable style={styles.imageUpload}>
            <Feather name="camera" size={22} color={colors.ivoryFaint} />
            <Text style={styles.imageUploadText}>Add product photo</Text>
          </Pressable>

          <Field label="Product Name" styles={styles}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Antoinette Diamond Necklace"
              placeholderTextColor={colors.ivoryFaint}
              style={styles.input}
            />
          </Field>

          <Field label="Category" styles={styles}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((item) => (
                <Pressable key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
                  <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Material" styles={styles}>
            <View style={styles.chipRow}>
              {MATERIALS.map((item) => (
                <Pressable key={item} style={[styles.chip, material === item && styles.chipActive]} onPress={() => setMaterial(item)}>
                  <Text style={[styles.chipText, material === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <View style={styles.row}>
            <Field label="Price (Rs.)" style={styles.rowField} styles={styles}>
              <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.ivoryFaint} style={styles.input} />
            </Field>
            <Field label="Stock" style={styles.rowField} styles={styles}>
              <TextInput value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.ivoryFaint} style={styles.input} />
            </Field>
          </View>

          <Field label="Weight" styles={styles}>
            <TextInput value={weight} onChangeText={setWeight} placeholder="e.g. 8.4g" placeholderTextColor={colors.ivoryFaint} style={styles.input} />
          </Field>

          <Field label="Description" styles={styles}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the piece..."
              placeholderTextColor={colors.ivoryFaint}
              multiline
              style={[styles.input, styles.textarea]}
            />
          </Field>

          <Pressable style={styles.submit} onPress={handleCreate}>
            <Feather name="check" size={16} color={colors.bg} />
            <Text style={styles.submitText}>Add to Catalog</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children, style, styles }: { label: string; children: React.ReactNode; style?: any; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={[styles.field, style]}>
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
  imageUpload: {
    height: 150, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  imageUploadText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryFaint },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ivoryMuted },
  input: {
    fontFamily: fonts.body, fontSize: 14, color: colors.ivory, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48,
  },
  textarea: { height: 100, paddingTop: spacing.sm, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  rowField: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ivoryMuted },
  chipTextActive: { color: colors.bg },
  submit: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, height: 52, borderRadius: radius.md, marginTop: spacing.sm,
  },
  submitText: { fontFamily: fonts.bodyExtra, fontSize: 14.5, color: colors.bg },
});
