// components/AppText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';

export function AppText(props: TextProps) {
  return (
    <Text 
      {...props} 
      allowFontScaling={false} // 🔥 The "Kill Switch" for system fonts is now permanent
    >
      {props.children}
    </Text>
  );
}