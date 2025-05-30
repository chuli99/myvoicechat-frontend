import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ThemedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function ThemedButton({
  title,
  variant = 'primary',
  isLoading = false,
  style,
  leftIcon,
  rightIcon,
  ...restProps
}: ThemedButtonProps) {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  // Button style based on variant
  const buttonStyle = (() => {
    switch (variant) {
      case 'secondary':        return [
          styles.button,
          { backgroundColor: (colorScheme ?? 'light') === 'dark' ? '#333' : '#e0e0e0' },
        ];
      case 'outline':
        return [
          styles.button,
          { 
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: tintColor,
          },
        ];
      case 'primary':
      default:
        return [
          styles.button,
          { backgroundColor: tintColor },
        ];
    }
  })();
  
  // Text style based on variant
  const textStyle = (() => {
    switch (variant) {
      case 'secondary':        return [
          styles.buttonText,
          { color: Colors[colorScheme ?? 'dark'].text },
        ];
      case 'outline':
        return [
          styles.buttonText,
          { color: tintColor },
        ];      case 'primary':
      default:
        return [
          styles.buttonText,
          { color: '#000' },
        ];
    }
  })();
  
  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={isLoading || restProps.disabled}
      {...restProps}    >      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#fff' : tintColor}
          size="small"
        />
      ) : (
        <React.Fragment>
          {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
          <Text style={textStyle}>{title}</Text>
          {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
        </React.Fragment>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
