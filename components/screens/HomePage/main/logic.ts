// screens/HomePage/logic.ts
import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { getTodaysPrayer, UpdateSettings, Settings, prayerNotifications, getNewPrayers } from './../../../services/database';

export const useHomePageLogic = () => {

  // --- UI State ---
  const [isDateMenuOpen, setDateMenuOpen] = useState(false);

  // --- Data State ---
  const [prayers, setPrayers] = useState(getTodaysPrayer());
  const [selectedMosque, setSelectedMosque] = useState('Select a Mosque');

  const buttonRef = useRef(null);
  const [menuStartY, setMenuStartY] = useState(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSavedPrayers = async () => {
      const savedSettings = Settings();
      if (savedSettings && savedSettings.activeMosque && savedSettings.activeMosque !== "null") {
        await getNewPrayers();
        const data = getTodaysPrayer();

        if (data.fajr === "0:00") {
          handleEmptyMosque();
        } else {
          setPrayers(data);
        }

        
        setSelectedMosque(savedSettings.activeMosque);
      }
    };
    loadSavedPrayers();
  }, []);



  const handleEmptyMosque = () => {
    Alert.alert(
      "No Prayers Available",
      "This mosque doesn't have any prayers currently. Please scream at Nour.",
      [{ text: "OK" }]
    );
    
    // Reset to default empty state
    setSelectedMosque('Select a Mosque');
    UpdateSettings({ mosque: "null", isJammah: 1 });
    setPrayers(getTodaysPrayer()); // Resets UI to 0:00
  };
  // ---------------------------------------------------------
  // ACTIONS — only prayer related, mosque menu is in AppShell
  // ---------------------------------------------------------

  // Called by AppShell when a mosque is selected
  const handleSelect = async (mosque: string) => {
    UpdateSettings({ mosque: mosque, isJammah: 1 });
    await getNewPrayers();
    const data = getTodaysPrayer();

     if (data.fajr === "0:00") {
          handleEmptyMosque();
        } else {
          setPrayers(data);
        }

    
    setSelectedMosque(mosque);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      await prayerNotifications(mosque);
    }, 2000);
  };

  return {
    isDateMenuOpen,
    buttonRef,
    menuStartY,
    prayers,
    selectedMosque,

    setDateMenuOpen,
    setMenuStartY,
    handleSelect,
  };
};