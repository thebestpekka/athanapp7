import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';

export const db = SQLite.openDatabaseSync('datas1.db');





export const initDB = () => {
  db.execSync(`
    -- MOSQUES TABLE
    CREATE TABLE IF NOT EXISTS mosques (
      mosque TEXT PRIMARY KEY,
      country TEXT,
      city TEXT,
      link TEXT,
      longitude REAL,
      latitude REAL,
      isFav INTEGER DEFAULT 1
    );

    -- PRAYERS TABLE
    CREATE TABLE IF NOT EXISTS prayers (
      id TEXT PRIMARY KEY, -- Composite key recommended: mosque + date
      mosque TEXT,
      date TEXT,
      fajr TEXT,
      sunrise TEXT,
      dhuhr TEXT,
      asr TEXT,
      maghrib TEXT,
      isha TEXT,
      fajrJammah TEXT,
      dhuhrJammah TEXT,
      asrJammah TEXT,
      maghribJammah TEXT,
      ishaJammah TEXT,
      mithl TEXT,
      jumuah1 TEXT,
      jumuah2 TEXT,
      FOREIGN KEY(mosque) REFERENCES mosques(mosque)
    );

    -- SETTINGS TABLE (Stores current active state)
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1, -- Single row table
      activeMosque TEXT,
      isJammah INTEGER DEFAULT 1, -- Boolean (0 or 1)
      daysToLoad INTEGER DEFAULT 7, -- Default load 7 days

      -- New Notification Preference Columns
      fajrConfig TEXT DEFAULT 'sound',
      sunriseConfig TEXT DEFAULT 'mute',
      dhuhrConfig TEXT DEFAULT 'sound',
      asrConfig TEXT DEFAULT 'sound',
      maghribConfig TEXT DEFAULT 'sound',
      ishaConfig TEXT DEFAULT 'sound'
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite will auto-number these 1, 2, 3...
      prayer TEXT NOT NULL,                 -- 'Fajr', 'Dhuhr', etc.
      isBefore INTEGER DEFAULT 1,           -- 1 = Before, 0 = After
      minutes INTEGER NOT NULL,             -- e.g., 15
      isJammah INTEGER DEFAULT 0,           -- 1 = Jammah time, 0 = Normal time
      fraction REAL DEFAULT 0          --  Stores the percentage (e.g., 0.5 for 50%)
    );
  `);
 
};

// 2. Save Mosques
export const saveMosquesLocally = (mosques: any[]) => {
  db.withTransactionSync(() => {
    mosques.forEach(m => {
      // Check if mosque exists locally to preserve 'isFav' status
      const existing = db.getFirstSync<{ isFav: number }>(
        'SELECT isFav FROM mosques WHERE mosque = ?', 
        [m.mosque]
      );

      // Use local fav status if exists, otherwise use what is passed (or 0)
      const isFavorite = existing ? existing.isFav : (m.isFav ? 1 : 0);

      db.runSync(
        `INSERT OR REPLACE INTO mosques 
        (mosque, country, city, link, longitude, latitude,  isFav) 
        VALUES (?, ?, ?, ?, ?, ?, ? )`,
        [
          m.mosque, 
          m.country, 
          m.city, 
          m.link, 
          m.longitude, 
          m.latitude, 
          isFavorite
        ]
      );
    });
  });
};

// 3. Save Prayers
export const savePrayersLocally = (prayers: any[]) => {
  db.withTransactionSync(() => {
    prayers.forEach(p => {
      // Create a unique ID if one doesn't exist (e.g., MosqueName_Date)
      const uniqueId = p.id || `${p.mosque}_${p.date}`;
      
      db.runSync(
        `INSERT OR REPLACE INTO prayers 
        (id, mosque, date, fajr, sunrise, dhuhr, asr, maghrib, isha, 
         fajrJammah, dhuhrJammah, asrJammah, maghribJammah, ishaJammah, 
         mithl, jumuah1, jumuah2) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uniqueId, p.mosque, p.date, 
          p.fajr, p.sunrise, p.dhuhr, p.asr, p.maghrib, p.isha,
          p.fajrJammah, p.dhuhrJammah, p.asrJammah, p.maghribJammah, p.ishaJammah,
          p.mithl, p.jumuah1, p.jumuah2
        ]
      );
    });
  });
};

export const getAllMosques = () => {
  const result = db.getAllSync('SELECT * FROM mosques ORDER BY mosque ASC');
  return result.map((m: any) => ({
    ...m,
    isFav: m.isFav === 1 // Convert 1/0 to true/false
  }));
};

// Get all Mosques marked as Favourite
export const getFavouriteMosques = () => {
  const result = db.getAllSync('SELECT * FROM mosques WHERE isFav = 1');
  return result;
};

export const updateMosqueFavorite = (mosqueName: string, isFav: boolean) => {
  try {
    db.runSync(
      `UPDATE mosques SET isFav = ? WHERE mosque = ?`,
      [isFav ? 1 : 0, mosqueName]
    );
    console.log(`sql:  Updated ${mosqueName} favorite status to ${isFav}`);
  } catch (e) {
    console.error("sql:  Error updating favorite:", e);
  }
};

// 1. Count how many prayer entries exist from today onwards
export const getLocalPrayerCount = (mosqueName: string, todayDate: string): number => {
  const result = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM prayers WHERE mosque = ? AND date >= ?`,
    [mosqueName, todayDate]
  );
  return result?.count || 0;
};

// 2. Get a specific day's prayer times from local DB
export const getLocalPrayerForDate = (mosqueName: string, date: string) => {
  return db.getFirstSync(
    `SELECT * FROM prayers WHERE mosque = ? AND date = ?`,
    [mosqueName, date]
  );
};

// 3. Update Settings with the "Current" prayer times
export const updatePrayerConfig = (prayerName: string, config: 'sound' | 'vibrate' | 'mute') => {
  const column = `${prayerName.toLowerCase()}Config`;
  try {
    db.runSync(
      `UPDATE settings SET ${column} = ? WHERE id = 1`,
      [config]
    );
  } catch (e) {
    console.error(`sql:  Error updating ${prayerName} config:`, e);
  }
};

// Also update the general updateSettings to include these if needed
export const updateSettings = (currentData: any) => {
  if (!currentData) return;
  
  
  const safeMosqueName = currentData.mosque ?? currentData.activeMosque ?? null;
  
  // 2. Safely convert boolean to integer. If it's missing, default it to 1
  const safeIsJammah = currentData.isJammah !== undefined 
        ? (currentData.isJammah ? 1 : 0) 
        : 1; 
  // 3. Fallback to null (SQLite accepts null, but crashes on undefined)
  const safeDaysToLoad = currentData.daysToLoad ?? null;

  db.runSync(
    `INSERT OR REPLACE INTO settings 
    (id, activeMosque, isJammah, daysToLoad, 
     fajrConfig, sunriseConfig, dhuhrConfig, asrConfig, maghribConfig, ishaConfig) 
    VALUES (1, ?, ?, 
    COALESCE(?, (SELECT daysToLoad FROM settings WHERE id = 1), 7),
      COALESCE((SELECT fajrConfig FROM settings WHERE id = 1), 'sound'),
      COALESCE((SELECT sunriseConfig FROM settings WHERE id = 1), 'mute'),
      COALESCE((SELECT dhuhrConfig FROM settings WHERE id = 1), 'sound'),
      COALESCE((SELECT asrConfig FROM settings WHERE id = 1), 'sound'),
      COALESCE((SELECT maghribConfig FROM settings WHERE id = 1), 'sound'),
      COALESCE((SELECT ishaConfig FROM settings WHERE id = 1), 'sound')
    )`,
    [safeMosqueName, safeIsJammah, safeDaysToLoad]
  );
};

// 5. Delete prayers older than 31 days from the given date
export const deleteOldPrayers = (todayDate: string) => {
  try {
    // 1. Parse today's date
    const dateObj = new Date(todayDate);
    
    // 2. Subtract 31 days
    dateObj.setDate(dateObj.getDate() - 31);
    
    // 3. Format back to YYYY-MM-DD string
    const thirtyDaysAgo = dateObj.toISOString().split('T')[0];

    // 4. Delete everything BEFORE that calculated date
    const result = db.runSync(
      `DELETE FROM prayers WHERE date < ?`,
      [thirtyDaysAgo]
    );
    
    console.log(`sql:  Cleanup: Deleted ${result.changes} records older than ${thirtyDaysAgo}`);
  } catch (error) {
    console.error("sql:  Error deleting old prayers:", error);
  }
};


export const deleteMosquePrayers = (mosqueName: string, date?: string) => {
  try {
    if (date) {
        // Delete specific date
        db.runSync(
            `DELETE FROM prayers WHERE mosque = ? AND date = ?`, 
            [mosqueName, date]
        );
    } else {
        // Delete ALL dates for this mosque
        db.runSync(
            `DELETE FROM prayers WHERE mosque = ?`, 
            [mosqueName]
        );
    }
  } catch (error) {
    console.error("sql:  Error deleting mosque prayers:", error);
  }
};

export const getSettings = () => {
  const settings = db.getFirstSync<{
    activeMosque: string;
    daysToLoad: number;
    isJammah: number;
    fajrConfig: string;
    sunriseConfig: string;
    dhuhrConfig: string;
    asrConfig: string;
    maghribConfig: string;
    ishaConfig: string;
  }>('SELECT * FROM settings WHERE id = 1');
  
  // Return the fetched settings or the comprehensive default object
  return settings || { 
    activeMosque: null, 
    daysToLoad: 1, 
    isJammah: 1,
    fajrConfig: 'sound',
    sunriseConfig: 'mute',
    dhuhrConfig: 'sound',
    asrConfig: 'sound',
    maghribConfig: 'sound',
    ishaConfig: 'sound'
  };
};


export const debugDatabase = () => {
  try {
    // 1. Grab EVERYTHING from all three tables
    const settingsData = db.getAllSync('SELECT * FROM settings');
    const mosquesData = db.getAllSync('SELECT * FROM mosques');
    const prayersData = db.getAllSync('SELECT * FROM prayers'); 

    const fullDump = {
      settings: settingsData,
      totalMosques: mosquesData.length,
      mosques: mosquesData,
      totalPrayers: prayersData.length,
      prayers: prayersData,
    };

    // 2. Print the massive payload to your VS Code terminal
    console.log("=========================================");
    console.log("📦 FULL SQLITE DATABASE DUMP");
    console.log("=========================================");
    console.log(JSON.stringify(fullDump, null, 2));
    console.log("=========================================");

    // 3. Show a safe summary on the phone screen
    Alert.alert(
      "Database Dumped!", 
      `Settings: ${JSON.stringify(settingsData[0]?.activeMosque)}\n\n` +
      `Mosques saved: ${mosquesData.length}\n` +
      `Prayer days saved: ${prayersData.length}\n\n` +
      `Check your VS Code terminal to see the exact times and dates!`
    );

  } catch (error) {
    console.error("sql:  Failed to dump database:", error);
  }
};



