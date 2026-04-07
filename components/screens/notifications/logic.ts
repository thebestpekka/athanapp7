import { useState, useEffect } from 'react';

// Import DB functions
import { 
  Settings, 
  UpdateNotiConfig, 
  addReminderDB, 
  updateReminderDB, 
  deleteReminderDB, 
  getRemindersForPrayer,
  getTodaysPrayer
} from '../../services/database';

export type Reminder = {
  id: number;
  time: number;
  type: 'Before' | 'After';
  isJammah: boolean;
  fraction: number; 
};

// ==========================================
// MATH HELPERS FOR HYBRID ENGINE
// ==========================================
// ==========================================
// MATH HELPERS FOR HYBRID ENGINE
// ==========================================
const timeToMins = (timeStr: string) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  // Use parseInt instead of Number so it ignores things like " AM" or " PM"
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;

  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  
  if (isNaN(h) || isNaN(m)) return 0;
  return (h * 60) + m;
};

const getPrayerGap = (prayerName: string, type: 'Before' | 'After', todayPrayers: any) => {
  if (type === 'Before') return 90; 
  if (!todayPrayers || Object.keys(todayPrayers).length === 0) return 120; 

  // 🔥 SAFETY CHECK: Look for both lowercase and TitleCase keys just in case!
  const getTime = (name: string) => {
    const val = todayPrayers[name.toLowerCase()] || todayPrayers[name];
    return timeToMins(val);
  };

  let currentMins = getTime(prayerName);
  let nextMins = 0;

  switch (prayerName) {
    case 'Fajr': nextMins = getTime('sunrise'); break;
    case 'Sunrise': nextMins = getTime('dhuhr'); break;
    case 'Dhuhr': nextMins = getTime('asr'); break;
    case 'Asr': nextMins = getTime('maghrib'); break;
    case 'Maghrib': nextMins = getTime('isha'); break;
    case 'Isha':
      const maghribMins = getTime('maghrib');
      const fajrMins = getTime('fajr') + 1440; // Add 24 hours (1440 mins) to Fajr
      nextMins = maghribMins + ((fajrMins - maghribMins) / 2); // Islamic Midnight
      break;
    default: return 60;
  }
  
  const gap = nextMins - currentMins;
  
  // 🔥 THE FAILSAFE: If the gap is 0 or negative (due to a missing DB time), 
  // fallback to a safe 120 minutes so the user's UI doesn't lock up!
  return gap > 0 ? gap : 120; 
};

export const calculateMaxMinutes = (prayerName: string, type: 'Before' | 'After', todayPrayers: any) => {
  if (type === 'Before') return 90;
  
  const gap = getPrayerGap(prayerName, type, todayPrayers);
  return Math.max(10, gap - 10); // Minus 10 min buffer, absolute minimum is 10
};



// ==========================================
// 1. Hook for Global Settings 
// ==========================================
export const useNotificationSettings = () => {
  // --- UI State ---
  const [dbSettings, setDbSettings] = useState<any>(null);

  // --- Effects ---
  useEffect(() => {
    const settings = Settings();
    setDbSettings(settings);
  }, []);

  return { 
    dbSettings 
  };
};

// ==========================================
// 2. Hook for the Prayer Section 
// ==========================================
export const usePrayerSection = (name: string, initialValue: string, activeMosque: string) => {
  // --- UI State ---
  const [expanded, setExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // --- Data State ---
  const configToState = (val: string) => val === 'sound' ? 2 : val === 'vibrate' ? 1 : 0;
  const stateToConfig = (val: number) => val === 2 ? 'sound' : val === 1 ? 'vibrate' : 'mute';

  const [notifyState, setNotifyState] = useState(configToState(initialValue)); 
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // --- Effects ---
  useEffect(() => {
    const saved = getRemindersForPrayer(name);
    const formatted = saved.map(r => ({
      id: r.id,
      time: r.minutes,
      type: r.isBefore ? 'Before' : 'After' as 'Before' | 'After',
      isJammah: r.isJammah,
      fraction: 0 
    }));
    setReminders(formatted);
  }, [name]);

  // --- Actions ---
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const cycleState = () => {
    const newState = (notifyState + 1) % 3;
    setNotifyState(newState);
    UpdateNotiConfig(name, stateToConfig(newState) as any); 
  };

  const openAddReminder = () => {
    setEditingReminder(null);
    setModalVisible(true);
  };

  const openEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setModalVisible(true);
  };

  const saveReminder = (time: number, type: 'Before' | 'After') => {
    
    const todayPrayers = getTodaysPrayer() || {};

    let fraction = 0;
    
    if (time > 45 && type === 'After') {
      const totalGap = getPrayerGap(name, type, todayPrayers);
      fraction = time / totalGap; 
    }

    if (editingReminder) {
      updateReminderDB(editingReminder.id, name, type === 'Before', time, false, fraction);
      setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...r, time, type } : r));
    } else {
      addReminderDB(name, type === 'Before', time, false, fraction);
      setReminders([...reminders, { id: Date.now(), time, type, isJammah: false, fraction }]);
    }
    
    setModalVisible(false);
    if (!expanded) toggleExpand();
  };

  const deleteReminder = () => {
    if (editingReminder) {
      deleteReminderDB(editingReminder.id); 
      setReminders(prev => prev.filter(r => r.id !== editingReminder.id)); 
    }
    setModalVisible(false);
  };

  return {
    expanded, 
    notifyState, 
    reminders, 
    modalVisible, 
    editingReminder,
    
    toggleExpand,
    cycleState,
    openAddReminder, 
    openEditReminder,
    setModalVisible,
    saveReminder, 
    deleteReminder, 
  };
};

// ==========================================
// 3. Hook for the Modal Form 
// ==========================================
export const useReminderForm = (visible: boolean, initialData: Reminder | null, prayerName: string, activeMosque: string) => {
  // --- UI State ---
  const [minutes, setMinutes] = useState(15);
  const [type, setType] = useState<'Before'|'After'>('Before');
  const [showContent, setShowContent] = useState(false);
  const [maxLimit, setMaxLimit] = useState(90);

  // --- Effect 1: Initialize Form ---
  useEffect(() => {
    if (visible) {
      setShowContent(true);
      if (initialData) { 
        setMinutes(Math.max(10, initialData.time)); 
        setType(initialData.type); 
      } else { 
        setMinutes(15); 
        setType('Before'); 
      }
    }
  }, [visible, initialData]);

  // --- Effect 2: Calculate Max Limit ---
  useEffect(() => {
    if (visible) {
      const todayPrayers = getTodaysPrayer() || {};
      setMaxLimit(calculateMaxMinutes(prayerName, type, todayPrayers));
    }
  }, [visible, type, prayerName, activeMosque]);

  // --- Effect 3: Enforce Limits ---
  useEffect(() => {
    if (minutes > maxLimit) setMinutes(maxLimit);
  }, [maxLimit, minutes]);

  // --- Actions ---
  const decreaseMinutes = () => {
    setMinutes(Math.max(10, minutes - 5));
  };
  
  const increaseMinutes = () => {
    if (minutes + 5 <= maxLimit) {
      setMinutes(minutes + 5);
    }
  };

  const closeWithAnimation = (callback: () => void) => {
    setShowContent(false);
    setTimeout(callback, 300); 
  };

  return {
    minutes, 
    type, 
    showContent, 
    maxLimit,

    setType,
    setShowContent,
    increaseMinutes, 
    decreaseMinutes,
    closeWithAnimation,
  };
};

// ==========================================
// 4. Hook for General Toggle
// ==========================================
export const useGeneralToggle = (initialState: boolean = true) => {
  // --- UI State ---
  const [isOn, setIsOn] = useState(initialState);
  
  // --- Actions ---
  const toggle = () => {
    setIsOn(!isOn);
  };

  return { 
    isOn, 

    toggle 
  };
};