// File: app/index.tsx
import React, { useEffect, useState, useRef } from 'react'; // <-- 1. Added useRef here
import { View, ActivityIndicator, Text, Alert, AppState } from 'react-native';
import * as Updates from 'expo-updates';
import { initServerLogger, uploadCurrentSessionLog } from '../components/services/logs';

import HomePageView from '../components/screens/HomePage/main/index';
import { initDB, debugDatabase } from '../components/services/sql';
import {  syncMosqueList } from '../components/services/database';
import { setupNotifications } from '@/components/services/notifications';
import notifee, { EventType } from '@notifee/react-native';
import { scheduleNextSync } from "../components/services/backgroundTasks"










export default function Index() {
  const [isReady, setReady] = useState(false);

  // 2. Added the appState reference needed for the background check
  const appState = useRef(AppState.currentState);

  // --- FIRST USE-EFFECT: App Startup & Updates ---
  useEffect(() => {
    const setup = async () => {
      try {
        // Initialize logger first so it catches the rest of the startup logs
        await initServerLogger();
        console.log("main:  🛠️ Logger Initialized. App starting...");

        setupNotifications();
        console.log("main:  🛠️ Initializing Database...");
        

        // Initialize DB and sync
        initDB();
        await syncMosqueList();

        const scheduleFirstBackground = async () => {
          const pendingTriggers = await notifee.getTriggerNotificationIds();
          console.log("main:  🔍 Currently pending alarms:", pendingTriggers);
          if (!pendingTriggers.includes('sync_trigger')) {

            console.log("main:  ⚙️ First time setup: Kickstarting the background sync loop...");
            await scheduleNextSync();

          } else {
            console.log("main:  ⏳ Background sync is already safely scheduled.");
          }
        }
        scheduleFirstBackground();
        console.log("main:  ✅ Database initialized and Data Synced!");

      } catch (e) {
        console.error("main:  ❌ Database failed to load:", e);
      } finally {
        setReady(true);
      }
    };

    async function checkForUpdates() {
      try {
        if (__DEV__) return;
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          try {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
            console.log("main:  downloaded ota update");
            Alert.alert("updated app");
          } catch (e) {
            Alert.alert("Error", "Failed to download  update.");

          }
        }
      } catch (error) {
        console.log("main:  Error checking for updates:", error);
      }
    }



    // Call the functions safely INSIDE the useEffect
    setup();
    checkForUpdates();
  }, []);

  // --- SECOND USE-EFFECT: Background Log Uploader ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // If the app was open, and the user just minimized it...
      if (appState.current.match(/inactive|active/) && nextAppState === 'background') {
        console.log("main:  App minimized! Uploading logs to Supabase...");
        uploadCurrentSessionLog(); // Send the text file to the server!
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // If NOT ready, show a loading spinner
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#004d4a' }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: 'white', marginTop: 10 }}>Starting App...</Text>
      </View>
    );
  }

  return (
    <>
      <HomePageView />
    </>
  );
}