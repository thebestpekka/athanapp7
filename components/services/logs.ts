// services/logger.ts
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { sendlogs } from './supabase';
import { txt } from '../tools/responsive';

const logFolder = `${RNFS.DocumentDirectoryPath}/SessionLogs`;
let currentLogFilePath = '';
let currentLogFileName = '';
let deviceId = '';
let isInitialized = false;


let isFileReady = false;
let logBuffer: string[] = []; // Stores logs while the file is being created

// 1. Hijack console.log SYNCHRONOUSLY right here!
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args); // Still print to the VS Code terminal

  const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  const logLine = `[${new Date().toLocaleTimeString()}] ${message}\n`;

  if (!isFileReady) {
    // File isn't ready yet? Trap it in memory!
    logBuffer.push(logLine);
  } else {
    // File is ready? Write it straight to the disk!
    RNFS.appendFile(currentLogFilePath, logLine, 'utf8').catch(() => { });
  }
};

// --- 1. Sync & Sweep Function ---
// This finds all old log files, uploads them, and deletes them upon success.
const syncPendingLogs = async () => {
  try {
    const files = await RNFS.readDir(logFolder);

    for (const file of files) {
      // Skip the current session's file if it's already running, 
      // though ideally this runs before the new file is created.
      if (file.path === currentLogFilePath) continue;

      if (file.isFile() && file.name.endsWith('.txt')) {
        const logContent = await RNFS.readFile(file.path, 'utf8');

        try {
          // Attempt to upload to Supabase
          await sendlogs(`${deviceId}/${file.name}`, logContent);

          // ✨ ONLY delete the file locally IF the upload succeeds
          await RNFS.unlink(file.path);
          console.log(`logger: 🗑️ Successfully synced and deleted local file: ${file.name}`);
        } catch (uploadError) {
          // If upload fails (e.g., no internet), it skips deletion.
          // The file remains locally and will be retried next time the app opens!
          console.log(`logger: ⚠️ Failed to upload ${file.name}, will retry next session.`);
        }
      }
    }
  } catch (error) {
    console.log("logger: ❌ Error reading log directory during sync:", error);
  }
};

// --- 2. Main Initialization ---


export const initServerLogger = async () => {
  // ✨ If it's already running, don't start it again!
  if (isInitialized) return;
  isInitialized = true;
  try {
    // A. Gather Device Info
    const uniqueHardwareId = await DeviceInfo.getUniqueId();
    const phoneModel = DeviceInfo.getModel();
    const customDeviceName = await DeviceInfo.getDeviceName();

    deviceId = `${customDeviceName}_${phoneModel}_${uniqueHardwareId}`.replace(/[^a-zA-Z0-9-_]/g, '_');

    // B. Ensure Folder Exists
    const folderExists = await RNFS.exists(logFolder);
    if (!folderExists) {
      await RNFS.mkdir(logFolder);
    }

    // C. ✨ FIRST INSTALLATION CHECK ✨
    const hasSentFirstInstall = await AsyncStorage.getItem('FIRST_INSTALL_LOG_SENT');
    if (!hasSentFirstInstall) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const firstInstallFileName = `First_Installation_${timestamp}.txt`;

      const firstInstallContent = `--- FIRST INSTALLATION ---\nDate: ${new Date().toLocaleString()}\nDevice Name: ${customDeviceName}\nModel: ${phoneModel}\nHardware ID: ${uniqueHardwareId}\nApp Version: ${DeviceInfo.getVersion()}\n${txt}`;

      try {
        await sendlogs(`${deviceId}/${firstInstallFileName}`, firstInstallContent);
        // Only mark as sent if the upload actually succeeds
        await AsyncStorage.setItem('FIRST_INSTALL_LOG_SENT', 'true');
        console.log("logger: 🎉 First installation log sent!");
      } catch (e) {
        console.log("logger: ⚠️ First install log failed to send, will retry next boot.");
        // We do NOT set the AsyncStorage flag here, so it retries next time.
      }
    }

    // D. ✨ CATCH UP & SYNC PREVIOUS SESSIONS ✨
    // Run this BEFORE we create the new file so we upload everything left behind
    await syncPendingLogs();

    // E. Start Tracking the NEW Session
    const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    currentLogFileName = `Session_${sessionTimestamp}.txt`;
    currentLogFilePath = `${logFolder}/${currentLogFileName}`;

    await RNFS.writeFile(currentLogFilePath, `--- Session Started: ${new Date().toLocaleString()} ---\n`, 'utf8');

    // F. Override console.log
    isFileReady = true;

    if (logBuffer.length > 0) {
      await RNFS.appendFile(currentLogFilePath, logBuffer.join(''), 'utf8');
      logBuffer = [];
    }

  } catch (error) {
    console.error("logger: ❌ Logger initialization failed:", error);
  }
};

// --- 3. Optional: Manual Flush ---
// You can call this if you want a "Send Feedback Now" button in your app settings
export const uploadCurrentSessionLog = async () => {
  if (!currentLogFilePath || !deviceId) return;
  await syncPendingLogs(); // Just run the sync sweep again!
};