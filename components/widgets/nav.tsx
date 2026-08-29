// widgets/nav.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, SharedValue, interpolate } from 'react-native-reanimated';
import { hp, wp } from '../tools/responsive';

const bottomInset = initialWindowMetrics?.insets.bottom || 0;
const hasNav = Platform.OS === 'android' && bottomInset > 28;

type Tab = 'Home' | 'Quran' | 'Learning'|'Tracking'  ;

interface BottomMenuProps {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
  tabProgress: SharedValue<number>; // 0=Home, 1=Quran, 2=Tracking, 3=Settings
}

const tabs: { name: Tab; icon: string; label: string }[] = [
  { name: 'Home',     icon: '🕌', label: 'Home'     },
  { name: 'Quran',    icon: '📖', label: 'Quran'    },
  //{ name: 'Learning', icon: '🧩', label: 'Learning' },
  { name: 'Tracking', icon: '📊', label: 'Tracking' },
  
];

export const BottomMenu: React.FC<BottomMenuProps> = ({ activeTab, onTabPress, tabProgress }) => {
  const [pillWidth, setPillWidth] = useState(0);
  const tabWidth = pillWidth / tabs.length;

  // Highlight slides directly from tabProgress shared value
  // No useState, no useEffect — pure UI thread animation
  const highlightStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      tabProgress.value,
      [0, 1, 2, 3],
      [0, tabWidth, tabWidth * 2, tabWidth * 3],
    );
    return { transform: [{ translateX }] };
  });

  return (
    <View style={[
      styles.wrapper,
      { bottom: hasNav ? bottomInset + hp(4) : hp(20) }
    ]}>
      <View
        style={styles.pill}
        onLayout={(e) => setPillWidth(e.nativeEvent.layout.width)}
      >
        {/* Highlight slides with the finger in real time */}
        {pillWidth > 0 && (
          <Animated.View
            style={[styles.highlight, { width: tabWidth }, highlightStyle]}
          />
        )}

        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabPress(tab.name)}
              activeOpacity={0.8}
            >
              <Text style={styles.icon}>{tab.icon}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: wp(20),
    right: wp(20),
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 90, 85, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: hp(40),
    paddingVertical: hp(10),
    paddingHorizontal: wp(8),
    width: '100%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: hp(8),
    position: 'relative',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: hp(6),
    bottom: hp(6),
    borderRadius: hp(30),
    backgroundColor: '#00383C',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: hp(2),
    paddingVertical: hp(2),
    borderRadius: hp(30),
    zIndex: 1,
  },
  icon: {
    fontSize: hp(20),
  },
  label: {
    fontSize: hp(10),
    color: '#6aada0',
    fontWeight: '500',
  },
  labelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});