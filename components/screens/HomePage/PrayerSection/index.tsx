// prayers.tsx
import React from 'react';
import { View,  StyleSheet } from 'react-native';
import { hp } from '../../../tools/responsive'; 
import { AppText } from '../../../tools/appText';

function PrayerCard({ name, time, jamah, isActive = false }: { name: string, time: string, jamah: string, isActive?: boolean }) {
  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      {/* Top Row */}
      <View style={styles.cardRow}>
        <AppText style={[styles.cardText, isActive && styles.activeText]}>{name}</AppText>
        <AppText style={[styles.cardText, isActive && styles.activeText]}>{time}</AppText>
      </View>
      
      {/* Bottom Row */}
      <View style={styles.cardRow}>
        <AppText  style={styles.subText}>Jama'ah</AppText>
        <AppText  style={styles.subText}>{jamah}</AppText>
      </View>
    </View>
  );
}

export default function PrayerList({ prayers }: { prayers: any }) {
  return (
    <View style={styles.container}>
      {/* --- MORNING BLOCK --- */}
      <View style={styles.morningBlock}>
        <PrayerCard name="Fajr" time={prayers.fajr} jamah={prayers.fajrJammah} />
        <View style={styles.sunriseRow}>
          <AppText style={styles.sunriseText}>Sunrise</AppText>
          <AppText style={styles.sunriseText}>{prayers.sunrise}</AppText>
        </View>
      </View>

      {/* --- MAIN PRAYER LIST --- */}
      <View style={styles.prayerList}>
        <PrayerCard name="Dhuhr" time={prayers.dhuhr} jamah={prayers.dhuhrJammah} />
        <PrayerCard name="Asr" time={prayers.asr} jamah={prayers.asrJammah} />
        <PrayerCard name="Maghrib" time={prayers.maghrib} jamah={prayers.maghribJammah} />
        <PrayerCard name="Isha" time={prayers.isha} jamah={prayers.ishaJammah} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: hp(10) },
  morningBlock: { gap: hp(5), marginBottom: hp(5) },
  sunriseRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    paddingVertical: hp(2), marginHorizontal: hp(45),
  },
  sunriseText: { color: '#80cbc4', fontSize: hp(14), fontWeight: '600' },
  prayerList: { gap: hp(8) },
  card: {
    backgroundColor: 'rgba(20, 90, 85, 0.4)', borderRadius: hp(15),
    paddingVertical: hp(6), marginHorizontal: hp(5),
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCard: { backgroundColor: 'rgba(77, 182, 172, 0.15)', borderColor: 'rgba(77, 182, 172, 0.4)' },
  cardRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    marginBottom: hp(2), marginHorizontal: hp(30), 
  },
  cardText: { color: 'white', fontSize: hp(20), fontWeight: '600' },
  activeText: { color: '#4db6ac' },
  subText: { color: 'rgba(255,255,255,0.6)', fontSize: hp(14) },
});