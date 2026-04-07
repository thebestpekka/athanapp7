import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';

// You might need to import COLORS from your constants file
import { COLORS } from './SortFilterView'; 

interface MosqueMenuAnimatorProps {
  startY: number;
  onClose: () => void;
  /** * Render function that passes the animation triggers to the child 
   * (closeMenu, selectItem) so the child can control the exit.
   */
  children: (props: { 
    closeMenu: () => void; 
    animateAndSelect: (callback: () => void) => void; 
  }) => React.ReactNode;
}

export default function MosqueMenuAnimator({ startY, onClose, children }: MosqueMenuAnimatorProps) {
    const anim = useSharedValue(0);

    // 1. Enter Animation on Mount
    useEffect(() => {
        anim.value = withTiming(1, { duration: 400 });
    }, []);

    // 2. Exit Animation Helper
    const runExitAnimation = (callback?: () => void) => {
        anim.value = withTiming(0, { duration: 250 }, (finished) => {
            if (finished && callback) {
                runOnJS(callback)();
            }
        });
    };

    // 3. Handlers exposed to Children
    const handleClose = () => {
        runExitAnimation(onClose);
    };

    const handleSelect = (callback: () => void) => {
        runExitAnimation(callback);
    };

    // 4. Interpolations
    const MENU_TOP_POS = 60;
    const MENU_HEIGHT = 650;

    const boxStyle = useAnimatedStyle(() => ({
        top: interpolate(anim.value, [0, 1], [startY, MENU_TOP_POS], Extrapolation.CLAMP),
        width: interpolate(anim.value, [0, 1], [60, 95], Extrapolation.CLAMP) + '%',
        height: interpolate(anim.value, [0, 1], [55, MENU_HEIGHT], Extrapolation.CLAMP),
        borderRadius: interpolate(anim.value, [0, 1], [30, 25]),
        opacity: interpolate(anim.value, [0, 0.1], [0, 1]),
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(anim.value, [0.5, 1], [0, 1]),
        transform: [{ translateY: interpolate(anim.value, [0.5, 1], [20, 0]) }]
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(anim.value, [0, 1], [0, 1])
    }));

    return (
        <View style={styles.overlayContainer}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} activeOpacity={1} />
            </Animated.View>

            <Animated.View style={[styles.menuBox, boxStyle]}>
                <Animated.View style={[styles.menuContent, contentStyle]}>
                    {/* Render the logic component, passing down the animation triggers */}
                    {children({ 
                        closeMenu: handleClose, 
                        animateAndSelect: handleSelect 
                    })}
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.backdrop },
  menuBox: { 
    position: 'absolute', 
    alignSelf: 'center', 
    backgroundColor: COLORS.primary, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 10, 
    elevation: 20, 
    overflow: 'hidden' 
  },
  menuContent: { flex: 1, padding: 15 },
});