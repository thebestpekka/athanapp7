import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  PanResponder, 
  Dimensions,
  Image // <--- Added Image import
} from 'react-native';

const MENU_HEIGHT = 700; 
const TRIGGER_HEIGHT = 300; 
const SNAP_THRESHOLD = 50; 
const AUTO_OPEN_POINT = 500; // Triggers when dragged 150px up (600 - 150)

export default function MosqueBottomSheet({ onSelect, selectedMosque }) {
  const isOpen = useRef(false);
  const hasAutoSnapped = useRef(false); 
  const panY = useRef(new Animated.Value(MENU_HEIGHT)).current;

  const openMenu = () => {
    Animated.spring(panY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    isOpen.current = true;
  };

  const closeMenu = () => {
    Animated.spring(panY, { toValue: MENU_HEIGHT, useNativeDriver: true, bounciness: 4 }).start();
    isOpen.current = false;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      
      onPanResponderGrant: () => {
        hasAutoSnapped.current = false; 
        panY.stopAnimation((value) => panY.setValue(value));
      },

      onPanResponderMove: (_, gestureState) => {
        if (hasAutoSnapped.current) return;

        const startPos = isOpen.current ? 0 : MENU_HEIGHT;
        let newPos = startPos + gestureState.dy;
        
        if (newPos < 0) newPos = 0; 
        if (newPos > MENU_HEIGHT) newPos = MENU_HEIGHT;

        if (newPos < AUTO_OPEN_POINT && !isOpen.current) {
            hasAutoSnapped.current = true;
            openMenu();
            return;
        }

        panY.setValue(newPos);
      },
      
      onPanResponderRelease: (_, gestureState) => {
        if (hasAutoSnapped.current) return;

        if (gestureState.dy < -SNAP_THRESHOLD) openMenu();
        else if (gestureState.dy > SNAP_THRESHOLD) closeMenu();
        else isOpen.current ? openMenu() : closeMenu();
      },
    })
  ).current;

  return (
    <>
      {/* 1. VISUAL MENU */}
      <Animated.View 
        style={[
          styles.menuContainer, 
          { transform: [{ translateY: panY }] }
        ]}
        {...panResponder.panHandlers}
      >
          {/* Handle Bar (Still useful to show swipeability) */}
          <View style={styles.handleContainer}>
             <View style={styles.handleBar} />
             <Text style={styles.handleText}>Swipe down to close</Text>
          </View>

          {/* --- NEW IMAGE CONTENT --- */}
          <View style={styles.imageWrapper}>
            <Image 
                // REPLACE THIS WITH YOUR IMAGE PATH
                source={require('../../../assets/mine/calend.jpg')} 
                style={styles.menuImage}
                resizeMode="contain"
            />
          </View>

      </Animated.View>

      {/* 2. INVISIBLE TRIGGER */}
      {!isOpen.current && (
         <View 
            style={styles.staticTriggerZone} 
            {...panResponder.panHandlers} 
         />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MENU_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    zIndex: 100,
    elevation: 20,
    paddingTop: 10, // Padding for the handle bar
    
    // CRITICAL: Ensures the square image doesn't cut off the rounded corners
    overflow: 'hidden', 
    
    shadowColor: "#000", shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  staticTriggerZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TRIGGER_HEIGHT, 
    zIndex: 110, 
    backgroundColor: 'rgba(255,0,0,0.01)', 
  },
  
  // Handle Styles
  handleContainer: {
      alignItems: 'center',
      marginBottom: 10,
      zIndex: 2, // Ensure handle sits on top if image overlaps
      backgroundColor: 'white', // Optional: keeps handle area clean
  },
  handleBar: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, marginBottom: 5 },
  handleText: { fontSize: 10, color: '#999', textTransform: 'uppercase' },

  // Image Styles
  imageWrapper: {
      flex: 1, // Take up remaining space
      width: '100%',
      backgroundColor: '#f0f0f0',
  },
  menuImage: {
      width: '100%',
      height: '100%',
  }
});