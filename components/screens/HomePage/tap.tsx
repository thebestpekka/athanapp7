import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function DateModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose} // Handles Android hardware back button
    >
      {/* Clicking the background backdrop closes the menu */}
      <TouchableOpacity 
         style={styles.modalOverlay} 
         activeOpacity={1} 
         onPress={onClose}
      >
         {/* The Card containing the image */}
         {/* 'activeOpacity={1}' on the content prevents clicks inside the card from closing it */}
         <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Image 
               // REPLACE THIS WITH YOUR IMAGE PATH
               source={require('../../../assets/mine/calend.jpg')} 
               style={styles.modalImage}
               resizeMode="contain"
            />
            
            {/* Optional Close Hint */}
            <Text style={styles.modalCloseText}>Tap background to close</Text>
         </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Dark dimmed background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85, // 85% of screen width
    height: height * 0.65, // 50% of screen height
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 20,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseText: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    overflow: 'hidden',
  }
});