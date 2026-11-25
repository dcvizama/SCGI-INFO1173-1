import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Button from './Button';

const PRESETS = {
  tickets: {
    title: 'Sin tickets pendientes',
    description: 'No hay incidencias registradas o pendientes de revisión en este momento.',
  },
  notifications: {
    title: 'Sin notificaciones',
    description: 'Aún no has recibido alertas sobre cambios de estado o asignaciones.',
  },
  historial: {
    title: 'Sin fallas registradas',
    description: 'Este activo no presenta incidencias previas en su historial.',
  },
};

export default function EmptyState({
  variant, // opcional: 'tickets' | 'notifications' | 'historial'
  icon, // opcional: cualquier componente/ícono que quieras poner arriba
  title,
  description,
  actionLabel, // opcional: texto del botón de acción
  onAction, // opcional: función al presionar el botón
}) {
  const preset = variant ? PRESETS[variant] : null;
  const finalTitle = title ?? preset?.title ?? 'Sin resultados';
  const finalDescription = description ?? preset?.description;

  return (
    <View style={styles.wrapper}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={styles.title}>{finalTitle}</Text>
      {finalDescription && <Text style={styles.description}>{finalDescription}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text1,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionWrapper: {
    width: '100%',
    maxWidth: 280,
  },
});