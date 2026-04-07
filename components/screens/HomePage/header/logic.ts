 import { useState, useEffect } from 'react';

export function useNextPrayerLogic(prayers: any) {
  const [nextPrayerName, setNextPrayerName] = useState("Loading...");
  const [timeLeft, setTimeLeft] = useState("");
  const [isPrayerTime, setIsPrayerTime] = useState(false);
  
  // 🔥 NEW: State for the exact night times and when to show them
  const [midnightTimeStr, setMidnightTimeStr] = useState("");
  const [akhirTimeStr, setAkhirTimeStr] = useState("");
  const [showNightDetails, setShowNightDetails] = useState(false);

  useEffect(() => {
    const fajrTime = prayers?.fajr || prayers?.Fajr;
    if (!fajrTime) return;

    const getTime = (name: string) => prayers[name.toLowerCase()] || prayers[name] || "";

    const getPrayerDate = (timeString: string, dayOffset = 0) => {
      if (!timeString) return new Date(0);

      const parts = timeString.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (timeString.toLowerCase().includes('pm') && hours < 12) {
        hours += 12;
      } else if (timeString.toLowerCase().includes('am') && hours === 12) {
        hours = 0;
      }

      const date = new Date();
      date.setDate(date.getDate() + dayOffset); 
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const calculateNextPrayer = () => {
      const now = new Date();
      const nowMs = now.getTime();

      const maghribYesterday = getPrayerDate(getTime('maghrib'), -1);
      const fajrToday = getPrayerDate(getTime('fajr'), 0);
      const sunriseToday = getPrayerDate(getTime('sunrise'), 0);
      const dhuhrToday = getPrayerDate(getTime('dhuhr'), 0);
      const asrToday = getPrayerDate(getTime('asr'), 0);
      const maghribToday = getPrayerDate(getTime('maghrib'), 0);
      const ishaToday = getPrayerDate(getTime('isha'), 0);
      const fajrTomorrow = getPrayerDate(getTime('fajr'), 1);

      const night1DurationMs = fajrToday.getTime() - maghribYesterday.getTime();
      const midnight1Ms = maghribYesterday.getTime() + (night1DurationMs / 2);
      const lastThird1Ms = maghribYesterday.getTime() + (night1DurationMs * (2 / 3));

      const night2DurationMs = fajrTomorrow.getTime() - maghribToday.getTime();
      const midnight2Ms = maghribToday.getTime() + (night2DurationMs / 2);
      const lastThird2Ms = maghribToday.getTime() + (night2DurationMs * (2 / 3));

      // 🔥 NEW: Figure out which night we are currently in
      const isPastMidnight = nowMs < fajrToday.getTime();
      const activeMidnight = new Date(isPastMidnight ? midnight1Ms : midnight2Ms);
      const activeAkhir = new Date(isPastMidnight ? lastThird1Ms : lastThird2Ms);

      // 🔥 NEW: Format the times nicely (e.g., "11:23 PM")
      const formatTime = (date: Date) => 
        date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      setMidnightTimeStr(formatTime(activeMidnight));
      setAkhirTimeStr(formatTime(activeAkhir));

      // 🔥 NEW: Only show these details if it's currently AFTER Isha or BEFORE Fajr
      setShowNightDetails(nowMs >= ishaToday.getTime() || nowMs < fajrToday.getTime());

      const gracePeriodMs = 2 * 60 * 1000; 
      const prayersToCheck = [
        { name: 'Fajr', date: fajrToday },
        { name: 'Sunrise', date: sunriseToday },
        { name: 'Dhuhr', date: dhuhrToday },
        { name: 'Asr', date: asrToday },
        { name: 'Maghrib', date: maghribToday },
        { name: 'Isha', date: ishaToday },
        { name: 'Fajr', date: fajrTomorrow }
      ];

      const activePrayer = prayersToCheck.find(
        p => nowMs >= p.date.getTime() && nowMs < p.date.getTime() + gracePeriodMs
      );

      if (activePrayer) {
        setNextPrayerName(activePrayer.name);
        setTimeLeft("It's time!"); 
        setIsPrayerTime(true);     
        return;                    
      }

      setIsPrayerTime(false); 

      const schedule = [
        { name: 'Midnight', date: new Date(midnight1Ms) },
        { name: 'Akhir al-Layl', date: new Date(lastThird1Ms) },
        { name: 'Fajr', date: fajrToday },
        { name: 'Sunrise', date: sunriseToday },
        { name: 'Dhuhr', date: dhuhrToday },
        { name: 'Asr', date: asrToday },
        { name: 'Maghrib', date: maghribToday },
        { name: 'Isha', date: ishaToday },
        { name: 'Midnight', date: new Date(midnight2Ms) }, 
        { name: 'Akhir al-Layl', date: new Date(lastThird2Ms) }, 
        { name: 'Fajr', date: fajrTomorrow }
      ];

      const nextEvent = schedule.find(p => p.date.getTime() > nowMs);

      if (nextEvent) {
        setNextPrayerName(nextEvent.name);

        const diffMs = nextEvent.date.getTime() - nowMs;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

        const displaySecs = diffSecs < 10 ? `0${diffSecs}` : diffSecs;
        const displayMins = diffMins < 10 ? `0${diffMins}` : diffMins;

        const formattedTime = `${diffHrs > 0 ? diffHrs + ':' : ''}${displayMins}:${displaySecs}`;
        setTimeLeft(formattedTime);
      }
    };

    calculateNextPrayer();
    const timerId = setInterval(calculateNextPrayer, 1000);

    return () => clearInterval(timerId);
  }, [prayers]);

  // 🔥 Export the new variables
  return { nextPrayerName, timeLeft, isPrayerTime, showNightDetails, midnightTimeStr, akhirTimeStr }; 
}