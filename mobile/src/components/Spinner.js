import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function Spinner({ label, size = 'large', fullScreen = false }) {
  return (
    <View style={[styles.wrapper, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.brand} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  label: {
    marginTop: 12,
    fontSize: typography.size.sm,
    color: colors.text2,
  },
});