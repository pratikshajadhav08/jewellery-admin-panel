import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { createProduct } from '../../lib/firestore/products';
import { uploadImageAsync } from '../../lib/storage';
import { useAppTheme } from '../../hooks/use-app-theme';

const CATEGORIES = ['Necklace', 'Ring', 'Earrings', 'Bracelet'];
const MATERIALS = ['18K Gold', 'Yellow Gold', 'Rose Gold', 'White Gold', 'Platinum'];

// Used only as a last-resort fallback if no photo is picked at all.
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400';

function makeSku(category: string) {
  const prefix = category.slice(0, 2).toUpperCase();
  const num = Math.floor(100 + Math.random() * 900);
  return `AUR-${prefix}-${num}`;
}

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
  const [submitting, setSubmitting] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add a product photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name || !price) {
      Alert.alert('Missing info', 'Please add at least a name and price.');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = PLACEHOLDER_IMAGE;
      if (imageUri) {
        setUploadingImage(true);
        const fileName = `${Date.now()}-${name.trim().replace(/\s+/g, '-').toLowerCase()}.jpg`;
        imageUrl = await uploadImageAsync(imageUri, `products/${fileName}`);
        setUploadingImage(false);
      }

      await createProduct({
        name,
        category,
        material,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        weight: weight || '—',
        sku: makeSku(category),
        image: imageUrl,
        description,
      });
      Alert.alert('Product Added', `${name} has been added to your catalog.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Could not add product', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
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
          <Pressable style={styles.imageUpload} onPress={pickImage}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <View style={styles.imageEditBadge}>
                  <Feather name="edit-2" size={12} color={colors.bg} />
                  <Text style={styles.imageEditBadgeText}>Change</Text>
                </View>
              </>
            ) : (
              <>
                <Feather name="camera" size={22} color={colors.ivoryFaint} />
                <Text style={styles.imageUploadText}>Add product photo</Text>
              </>
            )}
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

          <Pressable style={styles.submit} onPress={handleCreate} disabled={submitting}>
            {submitting ? (
              <>
                <ActivityIndicator color={colors.bg} />
                {uploadingImage && <Text style={styles.submitText}>Uploading photo...</Text>}
              </>
            ) : (
              <>
                <Feather name="check" size={16} color={colors.bg} />
                <Text style={styles.submitText}>Add to Catalog</Text>
              </>
            )}
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
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imageEditBadge: {
    position: 'absolute', bottom: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
  },
  imageEditBadgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.bg },
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