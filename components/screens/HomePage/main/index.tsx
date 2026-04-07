// main.tsx
import React from 'react';
import { StyleSheet,  View, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hp } from '../../../tools/responsive';
import { useHomePageLogic } from './logic'; 
import MosqueMenu from '../mosqueMenue';
import PrayerList from '../PrayerSection'; 
import MosqueBottomSheet from '../swipeUp';
import DateModal from '../tap';
import NextPrayerInfo from '../header'; 
import { AppText } from '../../../tools/appText';

export default function HomePageView() {
  const logic = useHomePageLogic();
  const { width, height } = Dimensions.get('window');

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView} contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} bounces={false} 
        >
          <NextPrayerInfo prayers={logic.prayers}/>
            
          <TouchableOpacity onPress={() => logic.setDateMenuOpen(true)}>
             <AppText  style={styles.dateText}>{logic.prayers.date}</AppText>
             <View style={styles.underline} /> 
          </TouchableOpacity>

          <AppText style={styles.hijriText}>14 Rajab 1446</AppText>

          <View style={styles.buttonPlaceholder}>
              <View ref={logic.buttonRef} style={{ opacity: logic.isOpen ? 0 : 1 }}> 
                  <TouchableOpacity 
                    style={[styles.staticButton, { width: width > 500 ? 400 : width * 0.75 }]} 
                    onPress={logic.openMenu}
                  >
                      <AppText style={styles.staticButtonText}>{logic.selectedMosque}</AppText>
                  </TouchableOpacity>
              </View>
          </View>

          <PrayerList prayers={logic.prayers} />

           
        </ScrollView >

        {/* <MosqueBottomSheet selectedMosque={logic.selectedMosque} onSelect={logic.setSelectedMosque} /> */}
        <DateModal visible={logic.isDateMenuOpen} onClose={() => logic.setDateMenuOpen(false)} />

        {logic.isOpen && (
          <MosqueMenu
            selectedMosque={logic.selectedMosque}
            startY={logic.menuStartY} onClose={logic.closeMenu} onSelect={logic.handleSelect}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#00383C', overflow: 'hidden' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: hp(10), flexGrow: 1 },
  dateText: { fontSize: hp(30), fontWeight: 'bold', textAlign: 'center', marginTop: hp(10), color: 'white' },
  hijriText: { fontSize: hp(18), color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: hp(10), fontWeight: '500' },
  underline: { height: 0 }, 
  buttonPlaceholder: { alignItems: 'center', marginVertical: hp(25), zIndex: 10 },
  staticButton: {
    backgroundColor: 'rgba(20, 90, 85, 0.4)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',      
    height: hp(55), borderRadius: hp(30), flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }), 
  },
  staticButtonText: { color: 'white', fontSize: hp(18), fontWeight: '600', letterSpacing: 0.5 },
});