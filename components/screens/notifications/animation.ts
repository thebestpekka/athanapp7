import { Platform, UIManager } from 'react-native';
import { 
  FadeIn, 
  FadeOut, 
  LinearTransition, 
  SlideInDown, 
  SlideOutDown 
} from 'react-native-reanimated';

// 🔥 MOVED FROM UI FILE: Enable smooth animations for Android globally
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Common durations and damping values for a consistent feel
 */
const DURATIONS = {
  entering: 400,
  exiting: 200,
  modalIn: 500,
  modalOut: 300,
};

export const AppAnimations = {
  accordionLayout: LinearTransition.springify().damping(60),
  contentFadeIn: FadeIn.duration(DURATIONS.entering),
  contentFadeOut: FadeOut.duration(DURATIONS.exiting),
  backdropFadeIn: FadeIn.duration(200),
  backdropFadeOut: FadeOut.duration(DURATIONS.modalOut),
  modalSlideUp: SlideInDown.springify().damping(55).stiffness(300),
  modalSlideDown: SlideOutDown.duration(DURATIONS.modalOut),
};