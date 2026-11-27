import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import StatusTimeline from '../../components/StatusTimeline';
import AccionesTicket from '../../features/incident/AccionesTicket';
import { useAuth } from '../../context/AuthContext';
import { useIncident } from '../../context/IncidentContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const PRIORIDADES = [
  { id: 'baja', label: 'Baja' },
  { id: 'media', label: 'Media' },
  { id: 'alta', label: 'Alta' },
];

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
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${anio} · ${horas}:${minutos}`;
}

export default function IncidentTrackingScreen({ route }) {
  const { idIncidencia, incidencia: incidenciaParam } = route?.params ?? {};
  const objetivo = incidenciaParam ?? idIncidencia;
  const idObjetivo = typeof objetivo === 'string' ? objetivo : objetivo?.id_incidencia;

  const { user } = useAuth();
  const rolUsuario = (user?.rol?.nombre_rol ?? user?.rol ?? '').toUpperCase();
  const esSupervisor = rolUsuario === 'SUPERVISOR' || rolUsuario === 'ADMIN';

  const {
    ticketActual,
    historialTicket,
    cargandoTicket,
    errorTicket,
    openTicket,
    refreshTicket,
    closeTicket,
    procesandoAccion,
    classifyIncident,
  } = useIncident();

  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState('media');
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (objetivo) {
      openTicket(objetivo);
    }
    return () => {
      closeTicket();
    };
  }, [objetivo, openTicket, closeTicket]);

  const ticket = ticketActual ?? (typeof objetivo === 'object' ? objetivo : null);
  const idEstadoActual = ticket?.estado?.id_estado ?? 1;

  const manejarClasificar = async () => {
    const res = await classifyIncident({
      prioridad: prioridadSeleccionada,
      comentario: comentario.trim() || undefined,
    });
    if (res) {
      setComentario('');
    }
  };

  if (!idObjetivo) {
    return (
      <View style={styles.centro}>
        <Text style={styles.errorTexto}>No se especificó el ticket a consultar.</Text>
      </View>
    );
  }

  if (cargandoTicket && !ticket) {
    return (
      <View style={styles.centro}>
        <Spinner />
        <Text style={styles.cargandoTexto}>Cargando detalle del ticket...</Text>
      </View>
    );
  }

  if (errorTicket && !ticket) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorTexto}>{errorTicket.mensaje}</Text>
          <Button label="Reintentar" variant="outline" onPress={refreshTicket} />
        </Card>
      </View>
    );
  }

  const claveEstado = resolverClaveEstado(ticket?.estado);
  const esFinal = Boolean(ticket?.estado?.es_final);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ticket ? (
        <>
          <Card style={styles.detalleCard}>
            <View style={styles.topRow}>
              <StatusBadge status={claveEstado} />
              <Text style={styles.fecha}>{formatearFecha(ticket.fecha_creacion)}</Text>
            </View>

            <Text style={styles.titulo}>{ticket.titulo}</Text>
            <Text style={styles.descripcion}>{ticket.descripcion}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Prioridad:</Text>
              <Text style={styles.metaValor}>
                {ticket.prioridad ? ticket.prioridad.toUpperCase() : 'SIN DEFINIR'}
              </Text>
            </View>
          </Card>

          {!esFinal ? (
            <Card style={styles.accionesCard}>
              <Text style={styles.sectionTitle}>GESTIÓN DEL TICKET</Text>

              {/* Paso 1 del Supervisor: Clasificar (Pendiente -> Clasificada) */}
              {esSupervisor && idEstadoActual === 1 ? (
                <View style={styles.bloqueAccion}>
                  <Text style={styles.label}>PRIORIDAD ASIGNADA</Text>
                  <View style={styles.prioridadRow}>
                    {PRIORIDADES.map((p) => {
                      const activa = prioridadSeleccionada === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => setPrioridadSeleccionada(p.id)}
                          accessibilityRole="button"
                          style={[styles.prioBtn, activa && styles.prioBtnActiva]}
                        >
                          <Text style={[styles.prioTexto, activa && styles.prioTextoActivo]}>
                            {p.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Comentario de clasificación (opcional)"
                    placeholderTextColor={colors.text3}
                    value={comentario}
                    onChangeText={setComentario}
                    multiline
                  />

                  <Button
                    label="Clasificar incidencia"
                    onPress={manejarClasificar}
                    loading={procesandoAccion}
                  />
                </View>
              ) : null}

              {/* Asignación y cambios de estado (RF5, RF6): las transiciones permitidas
                  las entrega el backend según el estado y el rol, y todo cambio de estado
                  exige un comentario. */}
              <AccionesTicket key={ticket.id_incidencia} ticket={ticket} />
            </Card>
          ) : null}

          <Card style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>TRAZABILIDAD DE ESTADOS</Text>
            <StatusTimeline historial={historialTicket} />
          </Card>
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
    gap: 16,
  },
  centro: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  errorInline: {
    fontSize: typography.size.xs,
    color: colors.danger,
    marginBottom: 10,
  },
  detalleCard: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fecha: {
    fontSize: typography.size.xs,
    color: colors.text3,
  },
  titulo: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text1,
  },
  descripcion: {
    fontSize: typography.size.sm,
    color: colors.text2,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaLabel: {
    fontSize: typography.size.xs,
    color: colors.text3,
  },
  metaValor: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text1,
  },
  accionesCard: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text3,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bloqueAccion: {
    gap: 12,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text2,
  },
  prioridadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioBtnActiva: {
    borderColor: colors.primary ?? '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  prioTexto: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text2,
  },
  prioTextoActivo: {
    color: colors.primary ?? '#1D4ED8',
    fontWeight: typography.weight.semibold,
  },
  input: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: colors.text1,
    textAlignVertical: 'top',
  },
  botonesTransicion: {
    gap: 10,
  },
  timelineCard: {
    marginBottom: 24,
  },
});
