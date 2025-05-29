import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ErrorMessageProps {
  error: string | null;
  onDismiss: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  if (!error) return null;
  
  return (
    <ThemedView style={styles.errorContainer}>
      <ThemedText style={styles.errorText}>{error}</ThemedText>
      <TouchableOpacity onPress={onDismiss}>
        <ThemedText style={styles.dismissText}>Dismiss</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 5,
    textAlign: 'center',
  },
  dismissText: {
    color: 'red',
    fontWeight: 'bold',
  },
});
