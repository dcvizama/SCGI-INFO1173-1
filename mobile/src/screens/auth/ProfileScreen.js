import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function getInitials(nombre, apellido) {
  const a = nombre?.[0] ?? '';
  const b = apellido?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás segura de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getInitials(user?.nombre, user?.apellido)}
        </Text>
      </View>

      <Text style={styles.name}>
        {user?.nombre} {user?.apellido}
      </Text>

      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>Rol: {user?.rol}</Text>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Correo</Text>
          <Text style={styles.infoValue}>{user?.correo}</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          label="Cerrar sesión"
          variant="danger"
          onPress={handleSignOut}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    padding: 28,
    paddingTop: 48,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brandBg,
    borderWidth: 2,
    borderColor: colors.brand + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: typography.weight.bold,
    color: colors.brand,
  },
  name: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text1,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.brandBg,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  roleText: {
    color: colors.brand,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
  },
  infoCard: {
    width: '100%',
    marginBottom: 32,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: typography.size.xs,
    color: colors.text3,
    fontWeight: typography.weight.semibold,
  },
  infoValue: {
    fontSize: typography.size.md,
    color: colors.text1,
  },
  actions: {
    width: '100%',
  },
});