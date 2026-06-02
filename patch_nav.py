import os

p = "src/navigation/AppNavigator.tsx"
with open(p, "r") as f:
    c = f.read()

# 1. Import GlassBottomTab
if "import { GlassBottomTab }" not in c:
    c = c.replace("import { theme } from '../theme/theme';", "import { theme } from '../theme/theme';\nimport { GlassBottomTab } from '../components/glass/GlassBottomTab';")

# 2. Update Tab.Navigator screenOptions to use the custom tab bar, and remove default styling
old_nav = """    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneContainerStyle: { backgroundColor: theme.colors.background },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Wallets') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >"""

new_nav = """    <Tab.Navigator
      tabBar={props => <GlassBottomTab {...props} />}
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: theme.colors.background },
      }}
    >"""

if old_nav in c:
    c = c.replace(old_nav, new_nav)

with open(p, "w") as f:
    f.write(c)

print("Navigation patched.")
