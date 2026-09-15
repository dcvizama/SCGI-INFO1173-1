import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Button from './Button';

export default function EmptyState({
  icon,        // opcional: cualquier componente/ícono que quieras poner arriba
  title,
  description,
  actionLabel, // opcional: texto del botón de acción
  onAction,    // opcional: función al presionar el botón
}) {
  return (
    <View style={styles.wrapper}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
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