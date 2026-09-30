import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// Datos de prueba — se reemplazan cuando Cristóbal entregue el
// endpoint GET /activos/{id} y GET /activos/qr/{codigo_qr}.
const ACTIVO_MOCK = {
  codigo_qr: 'ACT-ELEC-0142',
  nombre: 'Luminaria ext. poste 12',
  descripcion: 'Luminaria LED exterior de estacionamiento',
  marca: 'Philips',
  modelo: 'CoreLine G3',
  numero_serie: 'PH-2022-8841',
  estado: { nombre_estado: 'reparacion' },
  categoria: { nombre_categoria: 'Eléctrico' },
  ubicacion: {
    nombre_espacio: 'Estacionamiento B',
    edificio: { nombre_edificio: 'Rectoría' },
  },
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AssetDetailScreen({ route }) {
  // Cuando se conecte de verdad, el id o código QR llega por route.params
  const activo = ACTIVO_MOCK;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.qrCode}>{activo.codigo_qr}</Text>
          <StatusBadge status={activo.estado.nombre_estado} />
        </View>
        <Text style={styles.nombre}>{activo.nombre}</Text>
        <Text style={styles.categoria}>{activo.categoria.nombre_categoria}</Text>
      </Card>

      <Text style={styles.sectionTitle}>DATOS GENERALES</Text>
      <Card>
        <InfoRow label="Marca" value={activo.marca} />
        <InfoRow label="Modelo" value={activo.modelo} />
        <InfoRow label="N° de serie" value={activo.numero_serie} />
        <InfoRow label="Descripción" value={activo.descripcion} />
      </Card>

      <Text style={styles.sectionTitle}>UBICACIÓN</Text>
      <Card>
        <InfoRow label="Edificio" value={activo.ubicacion.edificio.nombre_edificio} />
        <InfoRow label="Espacio" value={activo.ubicacion.nombre_espacio} />
      </Card>

      <View style={styles.actions}>
        <Button label="Reportar incidencia" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  headerCard: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrCode: {
    fontSize: typography.size.xs,
    color: colors.text3,
    fontFamily: 'monospace',
  },
  nombre: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text1,
    marginBottom: 2,
  },
  categoria: {
    fontSize: typography.size.sm,
    color: colors.text3,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text3,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: typography.size.xs,
    color: colors.text3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.size.md,
    color: colors.text1,
  },
  actions: {
    marginTop: 12,
    marginBottom: 20,
  },
});