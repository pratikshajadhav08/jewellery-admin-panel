import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomerRow from '../../components/CustomerRow';
import { AppColors, fonts, layout, radius, spacing } from '../../constants/theme';
import { customers } from '../../data/dummyData';
import { useAppTheme } from '../../hooks/use-app-theme';

export default function Customers() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => customers.filter((customer) => customer.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.subtitle}>VIPs, repeat buyers, and outreach</Text>
          </View>
          <Text style={styles.count}>{customers.length} total</Text>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.ivoryFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search customers..."
            placeholderTextColor={colors.ivoryFaint}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(customer) => customer.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <CustomerRow customer={item} />}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ivory },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryMuted, marginTop: 2 },
  count: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ivoryMuted },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.ivory },
  list: { paddingBottom: spacing.xxl },
});
