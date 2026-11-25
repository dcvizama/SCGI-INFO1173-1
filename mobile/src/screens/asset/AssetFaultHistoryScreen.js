import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { obtenerHistorialFallas } from '../../services/assetService';
import { puedeVerBandeja } from '../../navigation/permissions';
import { useAbrirSeguimiento } from '../../navigation/useAbrirSeguimiento';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const ETIQUETAS_PRIORIDAD = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

function resolverClaveEstado(estado) {
  if (!estado) return 'pendiente';
  const nombre = (estado.nombre_estado ?? String(estado)).toLowerCase();
  if (nombre.includes('pendiente')) return 'pendiente';
  if (nombre.includes('clasificada')) return 'clasificada';
  if (nombre.includes('asignada')) return 'asignada';
  if (nombre.includes('diagn')) return 'diagnostico';
  if (nombre.includes('reparaci')) return 'reparacion';
  if (nombre.includes('resuelta')) return 'resuelta';
  if (nombre.includes('verificada')) return 'verificada';
  if (nombre.includes('cerrada')) return 'cerrada';
  if (nombre.includes('rechazada')) return 'rechazada';
  return nombre;
}

function formatearFecha(isoString) {
  if (!isoString) return '—';
  const fecha = new Date(isoString);
  if (Number.isNaN(fecha.getTime())) return isoString;
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export default function AssetFaultHistoryScreen({ route }) {
  const { idActivo, activo } = route?.params ?? {};
  const idConsulta = idActivo ?? activo?.id_activo;

  const { user } = useAuth();
  const abrirSeguimiento = useAbrirSeguimiento();
  const puedeAbrirDetalle = puedeVerBandeja(user?.rol?.nombre_rol ?? user?.rol);

  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    if (!idConsulta) {
      setError('No se identificó el activo para consultar su historial.');
      setCargando(false);
      return;
    }

    obtenerHistorialFallas(idConsulta)
      .then((respuesta) => {
        if (vigente) setHistorial(respuesta);
      })
      .catch((e) => {
        if (vigente) {
          setError(e?.mensaje ?? 'No pudimos cargar el historial de fallas. Intenta de nuevo.');
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [idConsulta, intento]);

  const reintentar = () => {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  };

  const fallas = historial?.fallas ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {activo ? (
        <Card style={styles.headerCard}>
          <Text style={styles.qrCode}>{activo.codigo_qr}</Text>
          <Text style={styles.titulo}>{activo.nombre}</Text>
          {activo.ubicacion ? (
            <Text style={styles.ubicacion}>
              {activo.ubicacion.edificio?.nombre_edificio} · {activo.ubicacion.nombre_espacio}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {cargando ? (
        <View style={styles.centro}>
          <Spinner />
          <Text style={styles.cargandoTexto}>Cargando historial de fallas...</Text>
        </View>
      ) : null}

      {!cargando && error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTexto}>{error}</Text>
          <Button label="Reintentar" variant="outline" onPress={reintentar} />
        </Card>
      ) : null}

      {!cargando && !error && historial ? (
        <>
          <View style={styles.resumenRow}>
            <Card style={styles.resumenBox}>
              <Text style={styles.resumenNumero}>{historial.total_fallas ?? fallas.length}</Text>
              <Text style={styles.resumenLabel}>Total fallas</Text>
            </Card>
            <Card style={styles.resumenBox}>
              <Text style={[styles.resumenNumero, styles.numeroAbiertas]}>
                {historial.fallas_abiertas ?? 0}
              </Text>
              <Text style={styles.resumenLabel}>Abiertas</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>INCIDENCIAS REPORTADAS</Text>

          {fallas.length === 0 ? (
            <EmptyState variant="historial" />
          ) : (
            <View style={styles.lista}>
              {fallas.map((falla) => (
                <Pressable
                  key={falla.id_incidencia}
                  disabled={!puedeAbrirDetalle}
                  onPress={() => abrirSeguimiento(falla.id_incidencia)}
                  accessibilityRole={puedeAbrirDetalle ? 'button' : 'text'}
                  style={({ pressed }) => [pressed && puedeAbrirDetalle && styles.cardPresionada]}
                >
                  <Card style={styles.fallaCard}>
                    <View style={styles.fallaTop}>
                      <StatusBadge status={resolverClaveEstado(falla.estado)} small />
                      <Text style={styles.prioridad}>
                        Prioridad {ETIQUETAS_PRIORIDAD[falla.prioridad] ?? falla.prioridad}
                      </Text>
                    </View>

                    <Text style={styles.fallaTitulo}>{falla.titulo}</Text>

                    <View style={styles.fechasRow}>
                      <Text style={styles.fecha}>
                        Reportada: {formatearFecha(falla.fecha_creacion)}
                      </Text>
                      {falla.fecha_cierre ? (
                        <Text style={styles.fecha}>
                          Cerrada: {formatearFecha(falla.fecha_cierre)}
                        </Text>
                      ) : null}
                    </View>

                    {puedeAbrirDetalle ? (
                      <Text style={styles.verDetalle}>Toca para ver seguimiento →</Text>
                    ) : null}
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </>
      ) : null}
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
    marginBottom: 16,
  },
  qrCode: {
    fontSize: typography.size.xs,
    color: colors.text3,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  titulo: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text1,
  },
  ubicacion: {
    fontSize: typography.size.sm,
    color: colors.text3,
    marginTop: 4,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  cargandoTexto: {
    fontSize: typography.size.sm,
    color: colors.text3,
  },
  errorCard: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
    gap: 12,
  },
  errorTexto: {
    fontSize: typography.size.sm,
    color: colors.danger,
  },
  resumenRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  resumenBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  resumenNumero: {
    fontSize: typography.size.xl ?? 22,
    fontWeight: typography.weight.bold,
    color: colors.text1,
  },
  numeroAbiertas: {
    color: colors.danger,
  },
  resumenLabel: {
    fontSize: typography.size.xs,
    color: colors.text3,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text3,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  lista: {
    gap: 12,
    paddingBottom: 24,
  },
  fallaCard: {
    gap: 8,
  },
  cardPresionada: {
    opacity: 0.85,
  },
  fallaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prioridad: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text2,
  },
  fallaTitulo: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text1,
  },
  fechasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  fecha: {
    fontSize: typography.size.xs,
    color: colors.text3,
  },
  verDetalle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary ?? '#1D4ED8',
    marginTop: 2,
  },
});