import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { fonts } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-app-theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 8,
          paddingBottom: 22,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.ivoryFaint,
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 10.5, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Feather name="grid" color={color} size={size - 3} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Products', tabBarIcon: ({ color, size }) => <Feather name="package" color={color} size={size - 3} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" color={color} size={size - 3} /> }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: 'Customers', tabBarIcon: ({ color, size }) => <Feather name="users" color={color} size={size - 3} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size - 3} /> }}
      />
    </Tabs>
  );
}
