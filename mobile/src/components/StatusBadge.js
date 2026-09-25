import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_MAP = {
  pendiente:   { color: '#92400E', bg: '#FEF3C7', label: 'Pend. revisión' },
  clasificada: { color: '#5B21B6', bg: '#EDE9FE', label: 'Clasificada' },
  asignada:    { color: '#1E40AF', bg: '#DBEAFE', label: 'Asignada' },
  diagnostico: { color: '#155E75', bg: '#CFFAFE', label: 'En diagnóstico' },
  reparacion:  { color: '#9A3412', bg: '#FED7AA', label: 'En reparación' },
  resuelta:    { color: '#065F46', bg: '#D1FAE5', label: 'Resuelta' },
  verificada:  { color: '#0F766E', bg: '#CCFBF1', label: 'Verificada' },
  cerrada:     { color: '#374151', bg: '#F3F4F6', label: 'Cerrada' },
  rechazada:   { color: '#991B1B', bg: '#FEE2E2', label: 'Rechazada' },
};

export default function StatusBadge({ status, small = false }) {
  const data = STATUS_MAP[status] ?? {
    color: '#4B5563',
    bg: '#F3F4F6',
    label: status,
  };

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: data.bg, borderColor: data.color + '30' },
        small && styles.small,
      ]}
    >
      <Text style={[styles.label, { color: data.color }, small && styles.labelSmall]}>
        {data.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 10,
  },
});