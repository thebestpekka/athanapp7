// File: index.js
/* eslint-disable import/first */
import { initServerLogger } from './components/services/logs'; initServerLogger();
import 'expo-router/entry';
import notifee, { EventType } from '@notifee/react-native';
import RNFS from 'react-native-fs';
import { getNewPrayers } from './components/services/database';
import { scheduleNextSync } from './components/services/backgroundTasks';


// 1. REGISTER BACKGROUND TASK FIRST (Before any UI loads)

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED && detail.notification?.id === 'sync_trigger') {
    
    // 🚨 FAILSAFE TRICK: Write a raw text file INSTANTLY without Supabase.
    // This proves the app woke up, even if the network crashes everything else!
    const debugFilePath = `${RNFS.DocumentDirectoryPath}/SessionLogs/WAKEUP_${Date.now()}.txt`;
    await RNFS.writeFile(debugFilePath, `[${new Date().toLocaleTimeString()}] ⏰ HEADLESS JS WOKE UP!\n`, 'utf8');

    await notifee.cancelNotification('sync_trigger');
    
    try {
      // Initialize logger (may fail if Supabase syncPendingLogs has no internet)
  
      
      // Fetch prayers (may fail if no internet)
      await getNewPrayers();
      await RNFS.appendFile(debugFilePath, `✅ Prayers synced successfully!\n`, 'utf8');
      
    } catch (error) {
      // If the network fails, write the exact error to our raw failsafe file
      await RNFS.appendFile(debugFilePath, `❌ CRASH: ${error.message || error}\n`, 'utf8');
    } finally {
      // Always guarantee we schedule the next alarm so the loop never dies
      await scheduleNextSync();
      await RNFS.appendFile(debugFilePath, `⏳ Next sync scheduled.\n`, 'utf8');
    }
  }
});



