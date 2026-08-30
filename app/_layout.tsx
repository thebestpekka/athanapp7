// File: app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import React, { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { TouchableOpacity, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { update } from '../components/services/supabase';
import ForceUpdateScreen from '../components/screens/other/forceUpdater';

export default function Layout() {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(true);

useEffect(() => {
    async function checkVersion() {
      try {
        // Grab the integer version code depending on the platform (default to 1 if unavailable)
        const currentVersionCode = 
          Constants.expoConfig?.android?.versionCode ?? 
          Number(Constants.expoConfig?.ios?.buildNumber) ?? 
          1;

        const data = await update();
        
        if (data) {
          // Assuming your database/update() function now returns the required version code.
          // We wrap it in Number() just in case it comes back as a string like "7".
          const requiredVersionCode = Number(data.version);

          if (currentVersionCode < requiredVersionCode) {
            setUpdateUrl(data.link);
          }
        }
      } catch (e) {
        console.log("Version check failed", e);
      } finally {
        setCheckingVersion(false);
      }
    }
    checkVersion();
  }, []);

  if (checkingVersion) return null;
  if (updateUrl) return <ForceUpdateScreen updateUrl={updateUrl} />;

  // Custom left side — hamburger + settings side by side
  const HeaderLeft = () => {
    const navigation = useNavigation();
    const router = useRouter();

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
        {/* Hamburger — opens the drawer */}
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={{ padding: 8 }}
        >
          <Ionicons name="menu" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Settings — right next to it */}
        <TouchableOpacity
          onPress={() => router.push('/screens/settings')}
          style={{ padding: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer screenOptions={{
        headerStyle: { backgroundColor: '#00383C' },
        headerTintColor: '#fff',
        headerTitle: "My Athan",
        drawerStyle: { width: '65%', backgroundColor: '#fff' },
        // Replace the default hamburger with our custom left side
        headerLeft: () => <HeaderLeft />,
      }}>

        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Home",
            title: "Athan",
          }}
        />

        <Drawer.Screen
          name="screens/settings"
          options={{
            drawerLabel: "Hidden",
            title: "Hidden",
            drawerItemStyle: { display: 'none' },
          }}
        />

        <Drawer.Screen
          name="screens/notifications"
          options={{
            drawerLabel: "Notifications",
            title: "Settings",
            // Hide settings icon when already on settings
            headerLeft: () => {
              const navigation = useNavigation();
              return (
                <TouchableOpacity
                  onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                  style={{ padding: 8, marginLeft: 8 }}
                >
                  <Ionicons name="menu" size={26} color="#fff" />
                </TouchableOpacity>
              );
            },
          }}
        />

      </Drawer>
    </GestureHandlerRootView>
  );
}