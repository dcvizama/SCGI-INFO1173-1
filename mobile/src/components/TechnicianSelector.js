import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

// Respaldo de prueba si aún no se pasan técnicos por props desde el contexto/servicio
const TECNICOS_DEFAULT = [
  {
    id_usuario: 'c3d4e5f6-3333-4c4d-9e5f-2d7b5a9c0e23',
    nombre: 'Marta',
    apellido: 'Silva',
    correo: 'marta.silva@uct.cl',
  },
];

export default function TechnicianSelector({
  tecnicos = TECNICOS_DEFAULT,
  selectedId = null,
  onSelect,
  cargando = false,
  disabled = false,
  error = null,
}) {
  if (cargando) {
    return (
      <View style={styles.estadoBox}>
        <ActivityIndicator size="small" color={colors.primary ?? '#1D4ED8'} />
        <Text style={styles.estadoTexto}>Cargando técnicos disponibles...</Text>
      </View>
    );
  }

  if (!tecnicos || tecnicos.length === 0) {
    return (
      <View style={styles.estadoBox}>
        <Text style={styles.estadoTexto}>No hay técnicos disponibles para asignar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ASIGNAR TÉCNICO RESPONSABLE</Text>

      <View style={styles.lista}>
        {tecnicos.map((tec) => {
          const id = tec.id_usuario ?? tec.id;
          const seleccionado = selectedId === id;
          const nombreCompleto = `${tec.nombre ?? ''} ${tec.apellido ?? ''}`.trim();
          const iniciales =
            `${tec.nombre?.[0] ?? ''}${tec.apellido?.[0] ?? ''}`.toUpperCase() || 'T';

          return (
            <Pressable
              key={id}
              onPress={() => !disabled && onSelect?.(tec)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected: seleccionado, disabled }}
              style={({ pressed }) => [
                styles.opcion,
                seleccionado && styles.opcionSeleccionada,
                pressed && !disabled && styles.opcionPresionada,
                disabled && styles.opcionDeshabilitada,
              ]}
            >
              <View style={[styles.avatar, seleccionado && styles.avatarSeleccionado]}>
                <Text style={[styles.avatarTexto, seleccionado && styles.avatarTextoSeleccionado]}>
                  {iniciales}
                </Text>
              </View>

              <View style={styles.info}>
                <Text style={[styles.nombre, seleccionado && styles.nombreSeleccionado]}>
                  {nombreCompleto || tec.correo}
                </Text>
                {tec.correo ? <Text style={styles.correo}>{tec.correo}</Text> : null}
              </View>

              <View style={[styles.radio, seleccionado && styles.radioSeleccionado]}>
                {seleccionado ? <View style={styles.radioPunto} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text2,
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  lista: {
    gap: 10,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56, // Área táctil cómoda para operar con una sola mano (RNF5)
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  opcionSeleccionada: {
    borderColor: colors.primary ?? '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  opcionPresionada: {
    opacity: 0.85,
  },
  opcionDeshabilitada: {
    opacity: 0.5,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarSeleccionado: {
    backgroundColor: colors.primary ?? '#1D4ED8',
  },
  avatarTexto: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text2,
  },
  avatarTextoSeleccionado: {
    color: colors.white,
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text1,
  },
  nombreSeleccionado: {
    color: colors.primary ?? '#1D4ED8',
  },
  correo: {
    fontSize: typography.size.xs,
    color: colors.text3,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioSeleccionado: {
    borderColor: colors.primary ?? '#1D4ED8',
  },
  radioPunto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary ?? '#1D4ED8',
  },
  estadoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: 16,
  },
  estadoTexto: {
    fontSize: typography.size.sm,
    color: colors.text3,
  },
  error: {
    fontSize: typography.size.xs,
    color: colors.danger,
    marginTop: 6,
  },
});
