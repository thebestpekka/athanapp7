// File: app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import React, { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { update } from '../components/services/supabase'; // Adjust your path
import ForceUpdateScreen from '../components/screens/other/forceUpdater';





export default function Layout() {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [checkingVersion, setCheckingVersion] = useState(true);

  useEffect(() => {
    async function checkVersion() {
      try {
        // 1. Get current version from app.json
        const isVersionOlder = (current: string, required: string) => {
          const v1 = current.split('.').map(Number);
          const v2 = required.split('.').map(Number);
          for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            if (num1 < num2) return true;
            if (num1 > num2) return false;
          }
          return false;
        };
        // Inside your checkVersion function:
        const currentVersion = Constants.expoConfig?.version || "1.6.0";
        const data = await update();
        if (data) {
          if (isVersionOlder(currentVersion, data.version)) {
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

  if (updateUrl) {
    return <ForceUpdateScreen updateUrl={updateUrl} />;
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer screenOptions={{
        // This styles the top bar (where the hamburger is)
        headerStyle: { backgroundColor: 'black' },
        headerTintColor: '#fff', // Color of the hamburger icon and title
        headerTitle: "My Athan",
        drawerStyle: {
          width: '65%', // Reduced width (Default is usually ~280-300)
          backgroundColor: '#fff', // You can also change the menu color here
        }, // The text in the middle
      }}>


        {/*  1. Home Page  */}
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Home",
            title: "Athan",
          }}
        />

        {/* 2.  Notifications Page */}
        <Drawer.Screen
          name="screens/notifications"
          options={{
            drawerLabel: "Notifications", // What user sees in the menu
            title: "Settings",            // Title at top of screen
          }}
        />


      </Drawer>
    </GestureHandlerRootView>
  );
}