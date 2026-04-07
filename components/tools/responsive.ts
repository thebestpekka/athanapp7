// services/responsive.ts
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: window_height } = Dimensions.get('window');

// 🕵️ THE REAL TRUTH: Bypass Dimensions and ask the hardware!
// This gets the exact height of the bottom buttons directly from the Android OS.
const bottomInset = initialWindowMetrics?.insets.bottom || 0;

// If the inset is larger than ~24 pixels, they definitely have the big 3 buttosns.
const hasNav = Platform.OS === 'android' && bottomInset > 28;

// 🔥 THE SHRINK RAY: If they have the buttons, steal 80 pixels 
// to force the app to shrink and fit beautifully.
const SCREEN_HEIGHT = hasNav ? window_height - 20 : window_height;


const PERFECT_WIDTH = 412; 
const PERFECT_HEIGHT = 891; 

const widthRatio = SCREEN_WIDTH / PERFECT_WIDTH;
const heightRatio = SCREEN_HEIGHT / PERFECT_HEIGHT;

const safeRatio = hasNav ? heightRatio : widthRatio;

const logs = `\n📱 --- HARDWARE SCREEN MATH --- \n`+
              `screen height: ${SCREEN_HEIGHT}\n`+
              `screen width: ${SCREEN_WIDTH}\n`+
              `Bottom Inset (Buttons): ${bottomInset}\n`+
              `Has 3-Buttons?: ${hasNav}\n`+
              `Safe Ratio: ${safeRatio}\n`+
              `width Ratio: ${widthRatio}\n`+
              `height Ratio: ${heightRatio}\n`;



export const hp = (pixels: number): number => {
  const newSize = pixels * safeRatio;
  return PixelRatio.roundToNearestPixel(newSize); 
};

export const wp = hp;

export const txt = logs;