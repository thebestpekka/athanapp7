import{fetchPrayerTimes,fetchMosques}from './supabase';

import { 
    getFavouriteMosques,
    getAllMosques,
    updateMosqueFavorite,
    saveMosquesLocally,
    getLocalPrayerCount, 
    savePrayersLocally,
     updatePrayerConfig, 
    getLocalPrayerForDate,
    updateSettings,
    deleteOldPrayers,
    getSettings,db } from './sql';

import { schedulePrayerNotifications } from './notifications';


const getTodayDate = () => new Date().toISOString().split('T')[0];

export const Settings = () => getSettings();

export const UpdateSettings =  (currentData: any) =>{
    updateSettings(currentData);
}
export const UpdateNotiConfig=(prayer: string, config: 'sound' | 'vibrate' | 'mute')=>{
    updatePrayerConfig(prayer,config);
};
export const syncMosqueList = async () => {
    try {
        const mosques = await fetchMosques();
        
        if (mosques && mosques.length > 0) {
            saveMosquesLocally(mosques);
            console.log(`database: syncMosqueList: ✅ Updated ${mosques.length} mosques locally.`);
        }
    } catch (error) {
        console.error("database: syncMosqueList:  ❌ Error syncing mosques:", error);
    }

    
};
export const getMosqueList =  () => {
  // 1. (Optional) Sync with cloud to ensure we have the latest mosques
  // await syncMosqueList(); 

  // 2. Get raw data from SQL
  const rawMosques = getAllMosques();

  // 3. Map SQL columns to your Component's expected format
  // Note: Your SQL table is missing 'sect', 'origin', 'capacity', etc.
  // We will provide default values for now so the UI doesn't crash.
  
  return rawMosques.map(m => ({
    id: m.mosque,            // SQL Primary Key
    name: m.mosque,          // Mosque Name
    city: m.city || 'Unknown',
    country: m.country || 'UK',
    
    // Boolean mapping (Your getAllMosques already handles 1 -> true conversion)
    isFav: m.isFav,

    // --- DEFAULTS FOR MISSING DB COLUMNS ---
    sect: "Sunni",           // Placeholder
    origin: "Mixed",         // Placeholder
    lang: "English",         // Placeholder
    distance: 0,             // Distance calc requires User Location logic
    capacity: 0,             // Placeholder
  }));
};
export const updateMosqueFavs = (name: string ,status:boolean)=>{
 
    updateMosqueFavorite(name , status);
};
export const checkMosques = async (): Promise<boolean> =>{
    const today = getTodayDate();
    const settings = getSettings();
    const mosquesToSync = new Set<string>();

    if (settings.activeMosque) mosquesToSync.add(settings.activeMosque);

    const favourites = getFavouriteMosques();     
    favourites.forEach((fav: any) => {
        if (fav.mosque) mosquesToSync.add(fav.mosque);
    });
    
     const syncTasks = Array.from(mosquesToSync).map(async (mosqueName) => {
        try {
            // Check local DB count for this specific mosque
            const localCount = getLocalPrayerCount(mosqueName, today);

            // Only fetch if we are running low on data
            if (localCount < 11) {
                // send a warning saying mosques need to update
                return true;   
            } 
            else{
                
                // mosques dont need to update so ignore
                return false;
            }
        } catch (error) {
            console.error(`database:  checkMosques: ❌ Error syncing ${mosqueName}:`, error);
            // We catch error here so one failure doesn't stop the other mosques
        }
    });

    const results = await Promise.all(syncTasks);

    return results.includes(true);
};
export const getTodaysPrayer = () => {
    const today = getTodayDate();
    const formatedDate = formatDate(today);
    const emptyPrayers = {

      date: formatedDate,
      fajr: "0:00", sunrise: "0:00", dhuhr: "0:00", asr: "0:00",
      maghrib: "0:00", isha: "0:00", fajrJammah: "0:00", dhuhrJammah: "0:00",
      asrJammah: "0:00", maghribJammah: "0:00", ishaJammah: "0:00",
      mithl: "0:00", jumuah1: "0:00", jumuah2: "0:00"
    };
    const settings = getSettings();
    if(!settings.activeMosque || settings.activeMosque =="null") return emptyPrayers;


    const data = getLocalPrayerForDate(settings.activeMosque, today);


    
    if (data) {
        // 🔥 THIS IS THE KEY PART
        // We spread the data, but then we immediately OVERWRITE the 'date' key.
       
        return { 
            ...data, 
            date: formatDate(data.date) // This replaces "2026-02-06" with "Friday..."
        };
    } else {
        return emptyPrayers;
    }
};
export const getNewPrayers =async () => {

    
    const today = getTodayDate();
    const settings = getSettings();
    const daysToLoad = settings.daysToLoad||7;
    deleteOldPrayers(today);

    

    const mosquesToSync = new Set<string>();
    

    // Add Active Mosque
    if (settings.activeMosque) {
        mosquesToSync.add(settings.activeMosque);
    }

    const favourites = getFavouriteMosques(); 
    favourites.forEach((fav: any) => {
        if (fav.mosque) mosquesToSync.add(fav.mosque);
    });


    console.log("database:  getNewPrayers: MOSQUES TO SYNC:", Array.from(mosquesToSync));
    const syncTasks = Array.from(mosquesToSync).map(async (mosqueName) => {
        try {
            // Check local DB count for this specific mosque
            const localCount = getLocalPrayerCount(mosqueName, today);

            // Only fetch if we are running low on data
            const threshold = Math.min(11, daysToLoad); 

            if (localCount < threshold) {
                
                const newPrayers = await fetchPrayerTimes(mosqueName, daysToLoad);
                
                if (newPrayers && newPrayers.length > 0) {
                    savePrayersLocally(newPrayers);
                    
                    if(mosqueName===settings.activeMosque){ 
                        const prayers = getAllPrayers(settings.activeMosque);
                        schedulePrayerNotifications(prayers);
                    }
                    console.log(`database:  getNewPrayers: ✅ Saved ${mosqueName}`);
                    return mosqueName;
                }

                return null;
            } else {
                console.log(`database: getNewPrayers: 👍 ${mosqueName} is up to date.`);
                return mosqueName;
            }
        } catch (error) {
            console.error(`database: getNewPrayers: ❌ Error syncing ${mosqueName}:`, error);
            // We catch error here so one failure doesn't stop the other mosques
            return null;
        }
    });

    // 4. Wait for all syncs to finish
    const results = await Promise.all(syncTasks);
    const processedMosquesArray = results.filter(mosque => mosque !== null);
    const successCount = processedMosquesArray.length;
    const totalCount = Array.from(mosquesToSync).length;

    // Log the fraction
  console.log(`database: getNewPrayers: Successfully processed mosques: ${successCount} / ${totalCount}`);
};
export const getAllPrayers = (mosqueName: string) => {
  try {
    // We use ORDER BY date ASC so the days are sorted chronologically!
    const today = getTodayDate();

    const result = db.getAllSync(
      `SELECT * FROM prayers WHERE mosque = ? AND date >= ? ORDER BY date ASC`,
      [mosqueName,today]
    );
    
    return result;
  } catch (error) {
    console.error(`database: getAllPrayers: ❌ Error fetching all prayers for ${mosqueName}:`, error);
    return [];
  }
};
export const formatDate = (dateStr: string)=>{
    const date = new Date(dateStr);
  
  // Get Day Name (Monday) and Month (January)
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-GB', { month: 'long' });
  const day = date.getDate();

  // Add suffix (st, nd, rd, th)
  const getSuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  return `${dayName}, ${day}${getSuffix(day)} ${monthName}`;
}

export  const prayerNotifications = async (mosque: string)=>{

    if(!mosque || mosque==="null") return;
  const Newprayers = getAllPrayers(mosque);
  if (!Newprayers || Newprayers.length === 0) return;

  await schedulePrayerNotifications(Newprayers);
};



export const addReminderDB = (
    prayer: string, isBefore: boolean, minutes: number, isJammah: boolean, fraction: number) => {
  db.runSync(
    `INSERT INTO reminders (prayer, isBefore, minutes, isJammah, fraction) VALUES (?, ?, ?, ?, ?)`,
    [prayer, isBefore ? 1 : 0, minutes, isJammah ? 1 : 0, fraction]
  );
};

export const updateReminderDB = (id: number, prayer: string, isBefore: boolean, minutes: number, isJammah: boolean, fraction: number) => {
  db.runSync(
    `UPDATE reminders SET prayer = ?, isBefore = ?, minutes = ?, isJammah = ?, fraction = ? WHERE id = ?`,
    [prayer, isBefore ? 1 : 0, minutes, isJammah ? 1 : 0, fraction, id]
  );
};

// 3. READ: Get all reminders for a specific prayer section (e.g., just "Fajr")
export const getRemindersForPrayer = (prayerName: string) => {
  try {
    const result = db.getAllSync<{
      id: number;
      prayer: string;
      isBefore: number;
      minutes: number;
      isJammah: number;
    }>(`SELECT * FROM reminders WHERE prayer = ?`, [prayerName]);

    // Convert SQLite 1/0 integers back into true/false booleans for your UI
    return result.map(r => ({
      id: r.id,
      prayer: r.prayer,
      isBefore: r.isBefore === 1,
      minutes: r.minutes,
      isJammah: r.isJammah === 1
    }));
  } catch (error) {
    console.error(`database: getRemindersForPrayer: ❌ Error fetching reminders for ${prayerName}:`, error);
    return [];
  }
};

// 4. READ ALL: Get absolutely every reminder (Needed for Notifee scheduling)
export const getAllReminders = () => {
  try {
    const result = db.getAllSync<{
      id: number;
      prayer: string;
      isBefore: number;
      minutes: number;
      isJammah: number;
    }>(`SELECT * FROM reminders`);

    return result.map(r => ({
      id: r.id,
      prayer: r.prayer,
      isBefore: r.isBefore === 1,
      minutes: r.minutes,
      isJammah: r.isJammah === 1
    }));
  } catch (error) {
    console.error("database: getAllReminders: ❌ Error fetching all reminders:", error);
    return [];
  }
};

// 5. DELETE: Remove a reminder permanently (Requires ID)
export const deleteReminderDB = (id: number) => {
  try {
    db.runSync(`DELETE FROM reminders WHERE id = ?`, [id]);
    console.log(`database:  deleteReminderDB: 🗑️ Deleted reminder #${id}`);
  } catch (error) {
    console.error("database: deleteReminderDB:  ❌ Error deleting reminder:", error);
  }
};
const debugg = async () => {
    let tableName ="prayers";
  try {
    
    const allRows = db.getAllSync(`SELECT * FROM ${tableName}`);
    
    // Log it nicely to the console for debugging
    console.log(`=== DATA FOR TABLE: ${tableName} ===`);
    console.log(JSON.stringify(allRows, null, 2));
    console.log('====================================');

    return allRows; 
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return [];
  }

};