import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { hp } from '../../tools/responsive'; 
import { AppText } from '../../tools/appText';

// We pass the URL we got from Supabase into this screen
export default function ForceUpdateScreen({ updateUrl }: { updateUrl: string }) {
  
  const handleDownload = () => {
    if (updateUrl) {
      // This tells the phone's browser to instantly start downloading the APK
      console.log("ForceUpdater:  downloading new apk file");
      Linking.openURL(updateUrl).catch(() => {
        alert("Could not open the download link.");
        console.log("ForceUpdater:  couldnt download apk");
      });
    }
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>Major Update Required</AppText>
      <AppText style={styles.subtitle}>
        We added new features that require a full app update. Tap below to download the latest version.
      </AppText>
      
      <TouchableOpacity style={styles.button} onPress={handleDownload}>
        <AppText style={styles.buttonText}>Download Update</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00383C', justifyContent: 'center', alignItems: 'center', padding: hp(20) },
  title: { color: 'white', fontSize: hp(28), fontWeight: 'bold', marginBottom: hp(10) },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: hp(16), textAlign: 'center', marginBottom: hp(30) },
  button: { backgroundColor: '#4db6ac', paddingVertical: hp(15), paddingHorizontal: hp(40), borderRadius: hp(30) },
  buttonText: { color: '#00383C', fontSize: hp(18), fontWeight: 'bold' }
});