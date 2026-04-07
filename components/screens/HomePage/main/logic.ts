import { useState, useRef, useEffect } from 'react'; // Added useEffect
import { View } from 'react-native';
import { getTodaysPrayer, UpdateSettings, Settings, prayerNotifications, getNewPrayers } from './../../../services/database'; // Import DB function




export const useHomePageLogic = () => {

  // --- UI State ---
  const [selectedMosque, setSelectedMosque] = useState("Select a Mosque"); // 🔥 Dynamic starting state!
  const [isOpen, setIsOpen] = useState(false);
  const [menuStartY, setMenuStartY] = useState(0);
  const [isDateMenuOpen, setDateMenuOpen] = useState(false);

  // --- Data State ---
  // getTodaysPrayer already reads from getSettings() under the hood, so it will match!
  const [prayers, setPrayers] = useState(getTodaysPrayer());

  const buttonRef = useRef<View>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------
  // 2. EFFECTS
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSavedMosque = async () => {
      const savedSettings = Settings();
      if (savedSettings && savedSettings.activeMosque && savedSettings.activeMosque !== "null") {
        const loadedMosque = savedSettings.activeMosque;
        setSelectedMosque(loadedMosque); // This updates the UI!

        // Since we found a saved mosque, let's load its prayers too
        await getNewPrayers();
        const data = getTodaysPrayer();
        setPrayers(data);

      }
    };
    loadSavedMosque();
  }, []);


  // We don't need 'refreshTrigger' anymore!

  // --- Actions ---
  const openMenu = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setMenuStartY(pageY);
      setIsOpen(true);
    });
  };

  const closeMenu = () => {
    setIsOpen(false);
    // No need to manually trigger refresh, the useEffect above handles it
    // when 'selectedMosque' updates.
  };

  const handleSelect = async (mosque: string) => {
    setSelectedMosque(mosque);
    UpdateSettings({ mosque: mosque, isJammah: 1 });
    await getNewPrayers();
    const data = getTodaysPrayer();
    closeMenu();

    setPrayers(data);



    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);

    }

    // 3. START THE 2-SECOND SETTLE TIMER
    debounceTimer.current = setTimeout(async () => {
      await prayerNotifications(mosque);

    }, 2000); // 2000 milliseconds = 2 seconds

  };

  return {
    selectedMosque,
    isOpen,
    menuStartY,
    isDateMenuOpen,
    buttonRef,
    prayers,

    setSelectedMosque,
    setDateMenuOpen,
    openMenu,
    closeMenu,
    handleSelect,
  };
};