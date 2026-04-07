import notifee, { 
  TimestampTrigger, 
  TriggerType, 
  AndroidImportance, 
  AndroidVisibility 
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { getAllPrayers } from './database';

// ---------------------------------------------------------
// 1. SETUP & PERMISSIONS
// ---------------------------------------------------------

export const setupNotifications = async () => {
  // A. Request base notification permission
  await notifee.requestPermission();

  // B. Create the High Priority Android Channel
 if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'prayer-channel', 
      name: 'Prayer Alerts',
      importance: AndroidImportance.HIGH, 
      visibility: AndroidVisibility.PUBLIC, 
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
    });
  }
  return true;
};

// ---------------------------------------------------------
// 2. SCHEDULING LOGIC
// ---------------------------------------------------------

export const prayerNotifications = async (mosque:any) =>{

   if(!mosque || mosque==="null") return;
  const Newprayers = getAllPrayers(mosque);
  if (!Newprayers || Newprayers.length === 0) return;

  await schedulePrayerNotifications(Newprayers);
};
export const schedulePrayerNotifications = async (Newprayers: any) => {
 
  await notifee.cancelAllNotifications();
  console.log('SEVERCES: notifications:  🔔 Scheduling exact Notifee prayer alerts...');


  
 for (const day of Newprayers) {
        await scheduleSinglePrayer(day.date, 'Fajr', day.fajr);
        await scheduleSinglePrayer(day.date, 'Dhuhr', day.dhuhr);
        await scheduleSinglePrayer(day.date, 'Asr', day.asr);
        await scheduleSinglePrayer(day.date, 'Maghrib', day.maghrib);
        await scheduleSinglePrayer(day.date, 'Isha', day.isha);
    }
 
};

// ---------------------------------------------------------
// 3. HELPER FUNCTIONS
// ---------------------------------------------------------

const scheduleSinglePrayer = async (dateStr: string, prayerName: string, timeStr: string) => {
   if (!timeStr || timeStr === "0:00" || timeStr === "null") return;
   
   try {
       // 1. Generate the exact Unix Timestamp using your new function
       const triggerTimestamp = createPrayerTimestamp(dateStr, timeStr);
       
       // 2. Safety Check 1: Did the parser fail?
       if (isNaN(triggerTimestamp)) {
           console.log(`SEVERCES: notifications:  ❌ Parse Error: Date[${dateStr}] Time[${timeStr}]`);
           return;
       }
       console.log(`SEVERCES: notifications:  scheduled ${prayerName} at ${triggerTimestamp} =  ${timeStr}`);
       
       // 3. Safety Check 2: Has this prayer already happened?
       if (triggerTimestamp < Date.now()) return;

       // 4. Schedule the Exact Alarm
       const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTimestamp,
          alarmManager: {
            allowWhileIdle: true, 
          },
       };

       await notifee.createTriggerNotification(
          {
            title: `🕌 Time for ${prayerName}`,
            body: `It is time for ${prayerName} prayer.`,

            android: { 
                channelId: 'prayer-channel', 
                pressAction: { id: 'default' }
            } 
          },
          trigger
       );
       
   } catch (error) {
       console.error(`SEVERCES: notifications:  ❌ Failed to schedule ${prayerName}:`, error);
   }
};

const parseTimeTo24Hour = (timeStr: string) => {
  // This Regex specifically hunts for the hour, minute, and an optional AM/PM
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
  
  if (!timeMatch) return null;

  let hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  const modifier = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

  // If there is an AM/PM modifier, do the math!
  if (modifier === 'PM' && hour < 12) {
    hour += 12; // 6 PM becomes 18
  } else if (modifier === 'AM' && hour === 12) {
    hour = 0; // 12 AM midnight becomes 0
  }
  // If there is NO modifier, we assume your DB already saved it in 24-hour format.

  return { hour, minute };
};

// Helper 2: Merges the Date and the 24-hour time into a Unix Millisecond Timestamp
const createPrayerTimestamp = (dateStr: string, timeStr: string) => {
  const parsedTime = parseTimeTo24Hour(timeStr);
  if (!parsedTime) return NaN;

  // Handle both YYYY-MM-DD and DD-MM-YYYY date formats
  const dateParts = dateStr.split(/[-/]/); 
  let year, month, day;
   
  if (dateParts[0].length === 4) {
      year = Number(dateParts[0]);
      month = Number(dateParts[1]);
      day = Number(dateParts[2]);
  } else {
      day = Number(dateParts[0]);
      month = Number(dateParts[1]);
      year = Number(dateParts[2]);
  }

  // Create the exact Date object (Months are 0-indexed in JS, so we subtract 1)
  return new Date(year, month - 1, day, parsedTime.hour, parsedTime.minute).getTime();
};