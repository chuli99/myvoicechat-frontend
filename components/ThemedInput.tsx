import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  rightIcon?: React.ReactNode;
}

export function ThemedInput({ 
  label,
  error,
  style,
  rightIcon,
  ...restProps 
}: ThemedInputProps) {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const placeholderColor = (colorScheme ?? 'light') === 'dark' ? '#999' : '#666';
  const backgroundColor = (colorScheme ?? 'light') === 'dark' ? '#222' : '#F5F5F5';
  const borderColor = error ? 'red' : tintColor;
  
  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { borderColor, color: textColor, backgroundColor },
            rightIcon ? styles.inputWithIcon : null,
            style,
          ]}
          placeholderTextColor={placeholderColor}
          {...restProps}
        />
        
        {rightIcon ? (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        ) : null}
      </View>
      
      {error ? (
        <ThemedText style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  iconContainer: {
    position: 'absolute',
    right: 15,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});
