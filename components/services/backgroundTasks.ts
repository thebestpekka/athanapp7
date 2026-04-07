import notifee, { TriggerType, AndroidImportance, TimestampTrigger, AndroidNotificationSetting } from '@notifee/react-native';
import { Alert } from 'react-native';

export const scheduleNextSync = async () => {
  try {
    // 1. --- EXACT ALARM PERMISSION CHECK (Android 12+) ---
    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
      console.log("backgroundTasks: ⚠️ Exact Alarms are disabled by the Android OS!");
      
      // Prompt the user to turn it on (You can customize this message)
      Alert.alert(
        'Background Sync Required',
        'To ensure prayer times update automatically, please allow exact alarms in the next screen.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => await notifee.openAlarmPermissionSettings() 
          }
        ]
      );
      return; // Stop trying to schedule until they grant the permission
    }

    // 2. --- CALCULATE EXACTLY 2:00 AM ---
    const nextSync = new Date();
    nextSync.setHours(2, 0, 0, 0); // Set clock to 02:00:00 AM today
    
    // If it's already past 2:00 AM right now, push it to 2:00 AM tomorrow
    if (Date.now() >= nextSync.getTime()) {
      nextSync.setDate(nextSync.getDate() + 1);
    }
    const triggerTime = nextSync.getTime();

    // 3. --- CREATE THE GHOST CHANNEL ---
    await notifee.createChannel({
      id: 'ghost_channel',
      name: 'System Operations',
      sound: 'none',
      vibration: false,
      importance: AndroidImportance.MIN, 
    });

    // 4. --- CREATE THE TRIGGER ---
    const exactTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime,
      alarmManager: {
        allowWhileIdle: true, 
      },
    };

    await notifee.createTriggerNotification(
      {
        id: 'sync_trigger',
        title: 'Updating Data...', 
        body: 'Refreshing local background data',
        android: {
          channelId: 'ghost_channel', 
        },
      },
      exactTrigger 
    );
    
    console.log(`backgroundTasks: 🛡️ Ghost sync scheduled successfully for ${nextSync.toLocaleString()}`);

  } catch (error) {
    // ✨ If it fails again, we will FINALLY see why!
    console.error("backgroundTasks: ❌ CRITICAL ERROR scheduling sync:", error);
  }
};