import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { useProduct, updateProduct, deleteProduct } from '../../lib/firestore/products';
import { useAppTheme } from '../../hooks/use-app-theme';

export default function ProductDetail() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading } = useProduct(id);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');

  // Sync local edit fields whenever the live product doc changes (and isn't
  // mid-edit), so external updates don't get clobbered by stale state.
  useEffect(() => {
    if (product && !editMode) {
      setName(product.name);
      setPrice(String(product.price));
      setStock(String(product.stock));
      setDescription(product.description);
    }
  }, [product, editMode]);

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProduct(product.id, {
        name,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        description,
      });
      setEditMode(false);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Product', `Remove ${product.name} from catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product.id);
            router.back();
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={editMode ? 'Edit Product' : 'Product'}
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
          <Image source={{ uri: product.image }} style={styles.image} />

          <View style={styles.tagRow}>
            <Text style={styles.tag}>{product.category.toUpperCase()}</Text>
            <Text style={styles.dot}>/</Text>
            <Text style={styles.tag}>{product.sku}</Text>
          </View>

          {editMode ? (
            <TextInput value={name} onChangeText={setName} style={styles.nameInput} multiline />
          ) : (
            <Text style={styles.name}>{name}</Text>
          )}

          <View style={styles.priceRow}>
            {editMode ? (
              <View style={styles.inlineInputWrap}>
                <Text style={styles.currency}>Rs.</Text>
                <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.priceInput} />
              </View>
            ) : (
              <Text style={styles.price}>Rs. {Number(price).toLocaleString('en-IN')}</Text>
            )}
          </View>

          <View style={styles.specGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Material</Text>
              <Text style={styles.specValue}>{product.material}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Weight</Text>
              <Text style={styles.specValue}>{product.weight}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Stock</Text>
              {editMode ? (
                <TextInput value={stock} onChangeText={setStock} keyboardType="numeric" style={styles.specInput} />
              ) : (
                <Text style={styles.specValue}>{stock} units</Text>
              )}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          {editMode ? (
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={styles.descInput}
            />
          ) : (
            <Text style={styles.desc}>{description}</Text>
          )}

          {!editMode && (
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Feather name="trash-2" size={15} color={colors.danger} />
              <Text style={styles.deleteText}>Delete Product</Text>
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
  image: { width: '100%', height: 260, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, marginBottom: spacing.lg },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  tag: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.gold },
  dot: { color: colors.ivoryFaint },
  name: { fontFamily: fonts.display, fontSize: 25, color: colors.ivory, lineHeight: 32 },
  nameInput: {
    fontFamily: fonts.display, fontSize: 21, color: colors.ivory, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, padding: spacing.sm, backgroundColor: colors.surface,
  },
  priceRow: { marginTop: spacing.md, marginBottom: spacing.lg },
  price: { fontFamily: fonts.displaySemi, fontSize: 26, color: colors.gold },
  inlineInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currency: { fontFamily: fonts.displaySemi, fontSize: 22, color: colors.gold },
  priceInput: {
    fontFamily: fonts.displaySemi, fontSize: 22, color: colors.gold, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, backgroundColor: colors.surface, minWidth: 120,
  },
  specGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  specBox: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
  },
  specLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.ivoryFaint, marginBottom: 4 },
  specValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ivory },
  specInput: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ivory, padding: 0 },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.ivory, marginBottom: spacing.sm },
  desc: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ivoryMuted, lineHeight: 21, marginBottom: spacing.xl },
  descInput: {
    fontFamily: fonts.body, fontSize: 13.5, color: colors.ivory, lineHeight: 21, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface, minHeight: 90, textAlignVertical: 'top', marginBottom: spacing.xl,
  },
  editToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.gold,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, minWidth: 64, justifyContent: 'center',
  },
  editToggleText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.bg },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.logoutBorder, backgroundColor: colors.dangerBg,
    borderRadius: radius.md, paddingVertical: spacing.md,
  },
  deleteText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.danger },
});