import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false, // true para campos de contraseña
  error,                   // string con mensaje de error, o undefined
  keyboardType = 'default',
  autoCapitalize = 'none',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const borderColor = error
    ? colors.danger
    : isFocused
    ? colors.brand
    : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          { borderColor },
          isFocused && !error && { backgroundColor: colors.brandBg },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Text style={styles.toggle}>{hidden ? 'Mostrar' : 'Ocultar'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text2,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  inputRow: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text1,
  },
  toggle: {
    fontSize: typography.size.sm,
    color: colors.brand,
    fontWeight: typography.weight.medium,
  },
  error: {
    fontSize: typography.size.xs,
    color: colors.danger,
    marginTop: 6,
  },
});