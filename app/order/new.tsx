import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { createOrder, computePaymentStatus, computeNetPayable } from '../../lib/firestore/orders';
import { syncCustomerFromOrder } from '../../lib/firestore/customers';
import { useProducts } from '../../lib/firestore/products';
import { OrderItem } from '../../lib/firestore/types';
import { useAppTheme } from '../../hooks/use-app-theme';

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'];

function alertMessage(title: string, message: string) {
  console.error(`${title}: ${message}`);
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function todayLabel() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NewOrder() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { data: products } = useProducts();

  const [customer, setCustomer] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeDescription, setExchangeDescription] = useState('');
  const [exchangeWeight, setExchangeWeight] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [exchangeValueInput, setExchangeValueInput] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [catalogVisible, setCatalogVisible] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');

  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customPrice, setCustomPrice] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [customWeight, setCustomWeight] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [customMaking, setCustomMaking] = useState('');
  const [customWastage, setCustomWastage] = useState('');

  const breakdownCalculatedPrice = useMemo(() => {
    const weight = Number(customWeight);
    const rate = Number(customRate);
    const making = Number(customMaking) || 0;
    const wastage = Number(customWastage) || 0;
    if (!weight || !rate) return null;
    const metalValue = weight * rate;
    return metalValue + metalValue * (making / 100) + metalValue * (wastage / 100);
  }, [customWeight, customRate, customMaking, customWastage]);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);

  const exchangeSuggestedValue = useMemo(() => {
    const weight = Number(exchangeWeight);
    const rate = Number(exchangeRate);
    if (!weight || !rate) return null;
    return weight * rate;
  }, [exchangeWeight, exchangeRate]);

  const exchangeValue = showExchange ? Number(exchangeValueInput) || 0 : 0;
  const netPayable = computeNetPayable(total, exchangeValue);

  const filteredProducts = useMemo(
    () => products.filter((product) => product.name.toLowerCase().includes(catalogQuery.toLowerCase())),
    [products, catalogQuery]
  );

  const addFromCatalog = (name: string, price: number) => {
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.name === name);
      if (existingIndex !== -1) {
        const next = [...current];
        next[existingIndex] = { ...next[existingIndex], qty: next[existingIndex].qty + 1 };
        return next;
      }
      return [...current, { name, qty: 1, price }];
    });
    setCatalogVisible(false);
    setCatalogQuery('');
  };

  const addCustomItem = () => {
    if (!customName.trim() || !customPrice) {
      alertMessage('Missing info', 'Enter at least an item name and price.');
      return;
    }
    const weight = Number(customWeight);
    const rate = Number(customRate);
    const hasBreakdown = showBreakdown && weight > 0 && rate > 0;

    setItems((current) => [
      ...current,
      {
        name: customName.trim(),
        qty: Number(customQty) || 1,
        price: Number(customPrice) || 0,
        ...(hasBreakdown
          ? {
              weightGrams: weight,
              ratePerGram: rate,
              makingChargePercent: Number(customMaking) || 0,
              wastagePercent: Number(customWastage) || 0,
            }
          : {}),
      },
    ]);
    setCustomName('');
    setCustomQty('1');
    setCustomPrice('');
    setCustomWeight('');
    setCustomRate('');
    setCustomMaking('');
    setCustomWastage('');
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  const updateQty = (index: number, qty: number) => {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, qty: Math.max(1, qty) } : item)));
  };

  const handleCreate = async () => {
    if (!customer.trim()) {
      alertMessage('Missing info', 'Please add a customer name.');
      return;
    }
    if (items.length === 0) {
      alertMessage('Missing info', 'Add at least one item to the order.');
      return;
    }

    setSubmitting(true);
    try {
      const paidAmount = Number(amountPaid) || 0;
      const weightNum = Number(exchangeWeight);
      const rateNum = Number(exchangeRate);
      const exchangeFields =
        showExchange && exchangeValue > 0
          ? {
              exchangeDescription: exchangeDescription.trim() || 'Old gold exchange',
              exchangeValue,
              ...(weightNum > 0 ? { exchangeWeightGrams: weightNum } : {}),
              ...(rateNum > 0 ? { exchangeRatePerGram: rateNum } : {}),
            }
          : {};

      const id = await createOrder({
        date: todayLabel(),
        customer: customer.trim(),
        address: address.trim() || '—',
        payment,
        status: 'Pending',
        items,
        total,
        amountPaid: paidAmount,
        paymentStatus: computePaymentStatus(paidAmount, netPayable),
        ...exchangeFields,
      });

      try {
        await syncCustomerFromOrder(customer.trim(), total);
      } catch (syncErr) {
        // Don't block or alarm the user over this - the order itself was
        // created successfully. Just log it for debugging.
        console.error('Could not sync customer record:', syncErr);
      }

      if (Platform.OS === 'web') {
        window.alert('Order created successfully.');
        router.replace(`/order/${id}`);
      } else {
        Alert.alert('Order Created', 'The order has been added.', [
          { text: 'OK', onPress: () => router.replace(`/order/${id}`) },
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      alertMessage('Could not create order', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>New Order</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color={colors.ivoryMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <Field label="Customer Name" styles={styles}>
            <TextInput
              value={customer}
              onChangeText={setCustomer}
              placeholder="e.g. Meera Kulkarni"
              placeholderTextColor={colors.ivoryFaint}
              style={styles.input}
            />
          </Field>

          <Field label="Delivery Address" styles={styles}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Street, city, PIN code"
              placeholderTextColor={colors.ivoryFaint}
              multiline
              style={[styles.input, styles.textarea]}
            />
          </Field>

          <Field label="Payment Method" styles={styles}>
            <View style={styles.chipRow}>
              {PAYMENT_METHODS.map((item) => (
                <Pressable key={item} style={[styles.chip, payment === item && styles.chipActive]} onPress={() => setPayment(item)}>
                  <Text style={[styles.chipText, payment === item && styles.chipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Amount Paid Now (Advance) - optional" styles={styles}>
            <TextInput
              value={amountPaid}
              onChangeText={setAmountPaid}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.ivoryFaint}
              style={styles.input}
            />
          </Field>

          <View style={styles.itemsHeader}>
            <Text style={styles.fieldLabel}>Items</Text>
            <Pressable style={styles.catalogBtn} onPress={() => setCatalogVisible(true)}>
              <Feather name="grid" size={13} color={colors.gold} />
              <Text style={styles.catalogBtnText}>Add from Catalog</Text>
            </Pressable>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>No items added yet</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>Rs. {item.price.toLocaleString('en-IN')} each</Text>
                    {item.weightGrams && item.ratePerGram && (
                      <Text style={styles.itemBreakdownHint}>
                        {item.weightGrams}g @ Rs.{item.ratePerGram}/g · Making {item.makingChargePercent}% · Wastage {item.wastagePercent}%
                      </Text>
                    )}
                  </View>
                  <View style={styles.qtyControls}>
                    <Pressable style={styles.qtyBtn} onPress={() => updateQty(index, item.qty - 1)}>
                      <Feather name="minus" size={13} color={colors.ivory} />
                    </Pressable>
                    <Text style={styles.qtyValue}>{item.qty}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => updateQty(index, item.qty + 1)}>
                      <Feather name="plus" size={13} color={colors.ivory} />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => removeItem(index)} hitSlop={8} style={styles.removeBtn}>
                    <Feather name="trash-2" size={14} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.customItemBox}>
            <Text style={styles.customItemLabel}>Add a custom item</Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Item name (e.g. Repair service)"
              placeholderTextColor={colors.ivoryFaint}
              style={styles.input}
            />
            <View style={styles.row}>
              <TextInput
                value={customQty}
                onChangeText={setCustomQty}
                keyboardType="numeric"
                placeholder="Qty"
                placeholderTextColor={colors.ivoryFaint}
                style={[styles.input, styles.rowField]}
              />
              <TextInput
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
                placeholder="Price (Rs.)"
                placeholderTextColor={colors.ivoryFaint}
                style={[styles.input, styles.rowField]}
              />
            </View>

            <Pressable style={styles.breakdownToggle} onPress={() => setShowBreakdown((v) => !v)}>
              <Feather name={showBreakdown ? 'chevron-up' : 'chevron-down'} size={13} color={colors.gold} />
              <Text style={styles.breakdownToggleText}>Calculate from weight &amp; making charges</Text>
            </Pressable>

            {showBreakdown && (
              <View style={styles.breakdownBox}>
                <View style={styles.row}>
                  <TextInput
                    value={customWeight}
                    onChangeText={setCustomWeight}
                    keyboardType="numeric"
                    placeholder="Weight (g)"
                    placeholderTextColor={colors.ivoryFaint}
                    style={[styles.input, styles.rowField]}
                  />
                  <TextInput
                    value={customRate}
                    onChangeText={setCustomRate}
                    keyboardType="numeric"
                    placeholder="Rate / gram (Rs.)"
                    placeholderTextColor={colors.ivoryFaint}
                    style={[styles.input, styles.rowField]}
                  />
                </View>
                <View style={styles.row}>
                  <TextInput
                    value={customMaking}
                    onChangeText={setCustomMaking}
                    keyboardType="numeric"
                    placeholder="Making charge %"
                    placeholderTextColor={colors.ivoryFaint}
                    style={[styles.input, styles.rowField]}
                  />
                  <TextInput
                    value={customWastage}
                    onChangeText={setCustomWastage}
                    keyboardType="numeric"
                    placeholder="Wastage %"
                    placeholderTextColor={colors.ivoryFaint}
                    style={[styles.input, styles.rowField]}
                  />
                </View>
                {breakdownCalculatedPrice !== null && (
                  <Pressable
                    style={styles.useCalculatedBtn}
                    onPress={() => setCustomPrice(String(Math.round(breakdownCalculatedPrice)))}
                  >
                    <Feather name="check-circle" size={13} color={colors.gold} />
                    <Text style={styles.useCalculatedText}>
                      Use calculated price: Rs. {Math.round(breakdownCalculatedPrice).toLocaleString('en-IN')}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
            <Pressable style={styles.addCustomBtn} onPress={addCustomItem}>
              <Feather name="plus" size={14} color={colors.gold} />
              <Text style={styles.addCustomBtnText}>Add Item</Text>
            </Pressable>
          </View>

          <Pressable style={styles.breakdownToggle} onPress={() => setShowExchange((v) => !v)}>
            <Feather name={showExchange ? 'chevron-up' : 'chevron-down'} size={13} color={colors.gold} />
            <Text style={styles.breakdownToggleText}>Old Gold Exchange (optional)</Text>
          </Pressable>

          {showExchange && (
            <View style={styles.customItemBox}>
              <TextInput
                value={exchangeDescription}
                onChangeText={setExchangeDescription}
                placeholder="Description (e.g. Old gold bangle, 22K)"
                placeholderTextColor={colors.ivoryFaint}
                style={styles.input}
              />
              <View style={styles.row}>
                <TextInput
                  value={exchangeWeight}
                  onChangeText={setExchangeWeight}
                  keyboardType="numeric"
                  placeholder="Weight (g)"
                  placeholderTextColor={colors.ivoryFaint}
                  style={[styles.input, styles.rowField]}
                />
                <TextInput
                  value={exchangeRate}
                  onChangeText={setExchangeRate}
                  keyboardType="numeric"
                  placeholder="Rate / gram (Rs.)"
                  placeholderTextColor={colors.ivoryFaint}
                  style={[styles.input, styles.rowField]}
                />
              </View>
              {exchangeSuggestedValue !== null && (
                <Pressable
                  style={styles.useCalculatedBtn}
                  onPress={() => setExchangeValueInput(String(Math.round(exchangeSuggestedValue)))}
                >
                  <Feather name="check-circle" size={13} color={colors.gold} />
                  <Text style={styles.useCalculatedText}>
                    Use calculated value: Rs. {Math.round(exchangeSuggestedValue).toLocaleString('en-IN')}
                  </Text>
                </Pressable>
              )}
              <TextInput
                value={exchangeValueInput}
                onChangeText={setExchangeValueInput}
                keyboardType="numeric"
                placeholder="Exchange value (Rs.) - deducted from total"
                placeholderTextColor={colors.ivoryFaint}
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Items Total</Text>
            <Text style={styles.totalValue}>Rs. {total.toLocaleString('en-IN')}</Text>
          </View>

          {exchangeValue > 0 && (
            <>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Less: Old Gold Exchange</Text>
                <Text style={styles.balanceValue}>- Rs. {exchangeValue.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Net Payable</Text>
                <Text style={styles.totalValue}>Rs. {netPayable.toLocaleString('en-IN')}</Text>
              </View>
            </>
          )}

          {Number(amountPaid) > 0 && (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance Due</Text>
              <Text style={styles.balanceValue}>
                Rs. {Math.max(netPayable - Number(amountPaid), 0).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <Pressable style={styles.submit} onPress={handleCreate} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <Feather name="check" size={16} color={colors.bg} />
                <Text style={styles.submitText}>Create Order</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={catalogVisible} animationType="slide" onRequestClose={() => setCatalogVisible(false)}>
        <SafeAreaView style={styles.catalogModal} edges={['top']}>
          <View style={styles.catalogHeader}>
            <Text style={styles.catalogTitle}>Add from Catalog</Text>
            <Pressable onPress={() => setCatalogVisible(false)} hitSlop={10}>
              <Feather name="x" size={22} color={colors.ivoryMuted} />
            </Pressable>
          </View>
          <View style={styles.catalogSearchWrap}>
            <Feather name="search" size={15} color={colors.ivoryFaint} />
            <TextInput
              value={catalogQuery}
              onChangeText={setCatalogQuery}
              placeholder="Search products..."
              placeholderTextColor={colors.ivoryFaint}
              style={styles.catalogSearchInput}
            />
          </View>
          <FlatList
            data={filteredProducts}
            keyExtractor={(product) => product.id}
            contentContainerStyle={styles.catalogList}
            renderItem={({ item }) => (
              <Pressable style={styles.catalogRow} onPress={() => addFromCatalog(item.name, item.price)}>
                <View style={styles.catalogRowInfo}>
                  <Text style={styles.catalogRowName}>{item.name}</Text>
                  <Text style={styles.catalogRowMeta}>{item.category} / {item.stock} in stock</Text>
                </View>
                <Text style={styles.catalogRowPrice}>Rs. {item.price.toLocaleString('en-IN')}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>No products match your search</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
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
  textarea: { height: 70, paddingTop: spacing.sm, textAlignVertical: 'top' },
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
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catalogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6,
  },
  catalogBtnText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.gold },
  emptyItems: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  emptyItemsText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryFaint },
  itemsList: { gap: spacing.sm },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
  },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory },
  itemPrice: { fontFamily: fonts.body, fontSize: 11.5, color: colors.ivoryFaint, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 26, height: 26, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ivory, minWidth: 18, textAlign: 'center' },
  removeBtn: { padding: 4 },
  customItemBox: {
    gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  customItemLabel: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.ivoryMuted },
  itemBreakdownHint: { fontFamily: fonts.body, fontSize: 10, color: colors.ivoryFaint, marginTop: 3 },
  breakdownToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  breakdownToggleText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.gold },
  breakdownBox: { gap: spacing.sm },
  useCalculatedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.sm, paddingVertical: 10,
  },
  useCalculatedText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.gold },
  addCustomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.goldDim, borderRadius: radius.sm, paddingVertical: 10,
  },
  addCustomBtnText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.gold },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md,
  },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ivoryMuted },
  totalValue: { fontFamily: fonts.displaySemi, fontSize: 20, color: colors.gold },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  balanceLabel: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryFaint },
  balanceValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.warning },
  submit: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, height: 52, borderRadius: radius.md,
  },
  submitText: { fontFamily: fonts.bodyExtra, fontSize: 14.5, color: colors.bg },
  catalogModal: { flex: 1, backgroundColor: colors.bg },
  catalogHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  catalogTitle: { fontFamily: fonts.displaySemi, fontSize: 19, color: colors.ivory },
  catalogSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46, marginBottom: spacing.md,
  },
  catalogSearchInput: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.ivory },
  catalogList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  catalogRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
  },
  catalogRowInfo: { flex: 1 },
  catalogRowName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ivory },
  catalogRowMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.ivoryFaint, marginTop: 2 },
  catalogRowPrice: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.gold },
});