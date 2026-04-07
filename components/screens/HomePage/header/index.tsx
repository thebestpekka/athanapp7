// header.tsx
import React from 'react';
import { StyleSheet,  View, Image, ImageStyle } from 'react-native';
import { useNextPrayerLogic } from './logic'; 
import { hp } from '../../../tools/responsive';
import { AppText } from '../../../tools/appText';

type NextPrayerInfoProps = { prayers: any; };

export default function NextPrayerInfo({ prayers }: NextPrayerInfoProps) {
  const { nextPrayerName, timeLeft, isPrayerTime, showNightDetails, midnightTimeStr, akhirTimeStr } = useNextPrayerLogic(prayers);

  return (
    <View style={styles.headerCard}>
      <View style={styles.headerLeft}>
       <View style={styles.mainTextRow}>
          <AppText  style={styles.headerTitle}>{nextPrayerName}</AppText>
          <AppText  style={styles.headerTime}>
            {timeLeft ? (isPrayerTime ? timeLeft : `in ${timeLeft}`) : "Loading..."}
          </AppText>
        </View>

        {showNightDetails && (
          <View style={styles.nightDetailsContainer}>
            <View style={styles.nightColumnLeft}>
              <AppText  style={styles.nightLabelText}>Midnight</AppText>
              <AppText style={styles.nightTimeText}>{midnightTimeStr}</AppText>
            </View>
            <View style={styles.nightColumnRight}>
              <AppText style={styles.nightLabelText}>Akhir al-Layl</AppText>
              <AppText style={styles.nightTimeText}>{akhirTimeStr}</AppText>
            </View>
          </View>
        )}
      </View>

      <View style={styles.headerImageContainer}>
        <Image 
          source={require('../../../../assets/mine/tom3.webp')} 
          style={styles.headerImage as ImageStyle} resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: 'rgba(20, 90, 85, 0.4)', borderRadius: hp(20),
    borderWidth: 1, borderColor:'rgba(255, 255, 255, 0.1)',
    height: hp(170), flexDirection: 'row', marginBottom: hp(10), overflow: 'hidden', 
  },
  headerLeft: { 
      flex: 1, padding: hp(15), flexDirection: 'column', 
      alignItems: 'flex-start', justifyContent: 'center', zIndex: 2, 
  }, 
  mainTextRow: {
      flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: hp(5),
  },
  headerTitle: { color: 'white', fontSize: hp(26), fontWeight: 'bold' }, 
  headerTime: { color: 'white', fontSize: hp(24), opacity: 0.9, fontWeight: '500', marginLeft: hp(8) },
  nightDetailsContainer: {
      position: 'absolute', bottom: hp(4), left: hp(15), right: hp(15), paddingTop: hp(10),
      flexDirection: 'row', justifyContent: 'space-between', 
  },
  nightColumnLeft: { alignItems: 'flex-start' },
  nightColumnRight: { alignItems: 'flex-end' },
  nightLabelText: { color: 'rgba(255,255,255,0.6)', fontSize: hp(11), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  nightTimeText: { color: 'white', fontSize: hp(13), fontWeight: 'bold', marginTop: hp(2) },
  headerImageContainer: { flex: 1.2, height: '100%', position: 'relative' },
  headerImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
});