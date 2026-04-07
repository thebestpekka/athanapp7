import HomePageView from '../../components/screens/notifications/index'; 
import notifee, { TriggerType, TimestampTrigger } from '@notifee/react-native';
import {  Alert, Button } from 'react-native';

export default function notification(){
     const checkScheduledAlarms = async () => {
      const triggers = await notifee.getTriggerNotifications();
      
      console.log(`🔔 Found ${triggers.length} scheduled alarms:`);
      
      if (triggers.length === 0) {
        Alert.alert("Scheduled Prayers", "No alarms scheduled yet.");
        return;
      }
    
      let message = `You have ${triggers.length} alarms scheduled:\n\n`;
    
      triggers.forEach((t) => {
        // 🛡️ Type Guard: Check if it's a Timestamp trigger before accessing .timestamp
        if (t.trigger.type === TriggerType.TIMESTAMP) {
          const timestamp = (t.trigger as TimestampTrigger).timestamp;
          const timeString = new Date(timestamp).toLocaleString(); // Use localestring to see date + time
          
          console.log(`- ${t.notification.title} at ${timeString}`);
          message += `• ${t.notification.title} at ${timeString}\n`;
        }
      });
    
      Alert.alert("Scheduled Prayers", message);
    };

    return (
        <>
         <Button title="Check Alarms" onPress={checkScheduledAlarms} color="#ff0000" />
          <HomePageView />
        </>
      );
}