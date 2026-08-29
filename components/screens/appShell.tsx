// screens/AppShell.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import  {
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { hp } from '../tools/responsive';
import { BottomMenu } from '../widgets/nav';
import MosqueMenu from './HomePage/mosqueMenue';
import { useHomePageLogic } from './HomePage/main/logic';

import HomePageView     from './HomePage/main';
import QuranPageview    from './quranPage';
import TrackingPageview from './trackingPage';
import SettingsPageview from './settingsPage';

type Tab = 'Home' | 'Quran' | 'Learning' |'Tracking' ;

const bottomInset = initialWindowMetrics?.insets.bottom || 0;
const hasNav = Platform.OS === 'android' && bottomInset > 28;
const TAB_ORDER: Tab[] = ['Home', 'Quran', 'Tracking', ];
//'Learning',

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab]             = useState<Tab>('Home');
  const [mosqueMenuOpen, setMosqueMenuOpen]   = useState(false);
  const [menuStartY, setMenuStartY]           = useState(0);
  const tabProgress                           = useSharedValue(0);

  const homepageLogic = useHomePageLogic();

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <HomePageView
            selectedMosque={homepageLogic.selectedMosque}
            onOpenMosqueMenu={(startY: number) => {
              setMenuStartY(startY);
              setMosqueMenuOpen(true);
            }}
            // PASSING THE ENTIRE HOOK RESULT HERE:
            logic={homepageLogic} 
          />
        );
      case 'Quran':    return <QuranPageview />;
       //case 'Learning': return <SettingsPageview />;
      case 'Tracking': return <TrackingPageview />;
     
    }
  };

  const changeTab = (newTab: Tab, currentTab: Tab) => {
    if (newTab === currentTab) return;
    const newIndex = TAB_ORDER.indexOf(newTab);
    setActiveTab(newTab);
    tabProgress.value = withSpring(newIndex, { damping: 20, stiffness: 120 });
  };

  const handleTabPress = (newTab: Tab) => {
    changeTab(newTab, activeTab);
  };

  // Swipe disabled when mosque menu is open
  const swipe = Gesture.Pan()
    .enabled(!mosqueMenuOpen)
    .runOnJS(false)
    .minDistance(10)
    .onUpdate((event) => {
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      const dragRatio = event.translationX / 412;
      const newProgress = currentIndex - dragRatio * 2;
      tabProgress.value = Math.max(0, Math.min(TAB_ORDER.length - 1, newProgress));
    })
    .onEnd((event) => {
      const currentIndex = TAB_ORDER.indexOf(activeTab);

      if (event.translationX < -40 && currentIndex < TAB_ORDER.length - 1) {
        const nextTab = TAB_ORDER[currentIndex + 1];
        runOnJS(changeTab)(nextTab, activeTab);

      } else if (event.translationX > 40 && currentIndex > 0) {
        const prevTab = TAB_ORDER[currentIndex - 1];
        runOnJS(changeTab)(prevTab, activeTab);

      } else {
        tabProgress.value = withSpring(currentIndex, { damping: 20, stiffness: 120 });
      }
    });

  return (
    <GestureHandlerRootView style={styles.shell}>

      <GestureDetector gesture={swipe}>
        <View style={styles.contentBox}>
          {renderScreen()}
        </View>
      </GestureDetector>

      <BottomMenu
        activeTab={activeTab}
        onTabPress={handleTabPress}
        tabProgress={tabProgress}
      />

      {/* Mosque menu — renders on top of everything including the nav */}
      {mosqueMenuOpen && (
        <MosqueMenu
          selectedMosque={homepageLogic.selectedMosque}
          startY={menuStartY}
          onClose={() => setMosqueMenuOpen(false)}
          onSelect={async (mosque: string) => {
            setMosqueMenuOpen(false);
            await homepageLogic.handleSelect(mosque);
          }}
        />
      )}

    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#00383C',
  },
  contentBox: {
    flex: 1,
    overflow: 'hidden',
    paddingBottom: hasNav ? bottomInset + hp(80) : hp(88),
  },
});