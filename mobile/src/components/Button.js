import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function Button({
  label,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'danger'
  disabled = false,
  loading = false,
}) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  const bgColor = isOutline
    ? 'transparent'
    : isDanger
    ? colors.danger
    : colors.brand;

  const textColor = isOutline ? colors.brand : colors.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: bgColor },
        isOutline && { borderWidth: 2, borderColor: colors.brand },
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52, // cumple RNF5: mínimo 44px de touch target, con margen
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});