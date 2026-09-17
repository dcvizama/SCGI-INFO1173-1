import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../theme/colors';

function LockIcon() {
  return (
    <View style={styles.iconCircle}>
      <Text style={styles.iconText}>🔒</Text>
    </View>
  );
}

export default function AccessDeniedScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.wrapper}>
      <EmptyState
        icon={<LockIcon />}
        title="Acceso denegado"
        description="No tienes permisos para acceder a esta sección. Si crees que esto es un error, contacta al administrador del sistema."
        actionLabel="Volver al inicio"
        onAction={() => navigation.navigate('Home')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 32,
  },
});