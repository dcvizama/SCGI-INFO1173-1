import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useIncident } from '../../context/IncidentContext';
import { useAbrirSeguimiento } from '../../navigation/useAbrirSeguimiento';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'proceso', label: 'En proceso' },
  { id: 'resueltos', label: 'Resueltos' },
];

const ETIQUETAS_PRIORIDAD = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
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
  if (!isoString) return '';
  const fecha = new Date(isoString);
  if (Number.isNaN(fecha.getTime())) return isoString;
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export default function SupervisorInboxScreen() {
  const { tickets, cargandoTickets, errorTickets, loadTickets, refreshTickets } = useIncident();
  const abrirSeguimiento = useAbrirSeguimiento();
  const [filtroActivo, setFiltroActivo] = useState('todos');

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  const ticketsFiltrados = useMemo(() => {
    const lista = tickets ?? [];
    if (filtroActivo === 'todos') return lista;

    return lista.filter((ticket) => {
      const clave = resolverClaveEstado(ticket.estado);
      if (filtroActivo === 'pendientes') {
        return clave === 'pendiente' || clave === 'clasificada';
      }
      if (filtroActivo === 'proceso') {
        return clave === 'asignada' || clave === 'diagnostico' || clave === 'reparacion';
      }
      if (filtroActivo === 'resueltos') {
        return clave === 'resuelta' || clave === 'verificada' || clave === 'cerrada';
      }
      return true;
    });
  }, [tickets, filtroActivo]);

  const renderTicket = ({ item }) => {
    const claveEstado = resolverClaveEstado(item.estado);
    const prioridadLabel = ETIQUETAS_PRIORIDAD[item.prioridad] ?? item.prioridad ?? '—';

    return (
      <Pressable
        onPress={() => abrirSeguimiento(item)}
        accessibilityRole="button"
        style={({ pressed }) => [pressed && styles.cardPresionada]}
      >
        <Card style={styles.ticketCard}>
          <View style={styles.cardTop}>
            <StatusBadge status={claveEstado} small />
            <Text
              style={[
                styles.prioridad,
                (item.prioridad === 'alta' || item.prioridad === 'critica') && styles.prioridadAlta,
              ]}
            >
              Prioridad {prioridadLabel}
            </Text>
          </View>

          <Text style={styles.titulo} numberOfLines={2}>
            {item.titulo}
          </Text>

          {item.descripcion ? (
            <Text style={styles.descripcion} numberOfLines={2}>
              {item.descripcion}
            </Text>
          ) : null}

          <View style={styles.cardBottom}>
            <Text style={styles.fecha}>{formatearFecha(item.fecha_creacion)}</Text>
            <Text style={styles.accionTexto}>Gestionar →</Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bandeja de Incidencias</Text>
        <Text style={styles.headerSubtitle}>{ticketsFiltrados.length} ticket(s) en vista</Text>
      </View>

      <View style={styles.filtrosWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosScroll}
        >
          {FILTROS.map((filtro) => {
            const activo = filtroActivo === filtro.id;
            return (
              <Pressable
                key={filtro.id}
                onPress={() => setFiltroActivo(filtro.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                style={[styles.chip, activo && styles.chipActivo]}
              >
                <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                  {filtro.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {errorTickets ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTexto}>{errorTickets.mensaje}</Text>
          <Button label="Reintentar" variant="outline" onPress={refreshTickets} />
        </Card>
      ) : null}

      {cargandoTickets && (!tickets || tickets.length === 0) ? (
        <View style={styles.centro}>
          <Spinner />
          <Text style={styles.cargandoTexto}>Cargando tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={ticketsFiltrados}
          keyExtractor={(ticket) => ticket.id_incidencia}
          renderItem={renderTicket}
          refreshing={cargandoTickets}
          onRefresh={refreshTickets}
          contentContainerStyle={styles.listaContent}
          ListEmptyComponent={
            !cargandoTickets ? (
              <EmptyState
                variant="tickets"
                actionLabel={filtroActivo !== 'todos' ? 'Ver todos los tickets' : undefined}
                onAction={filtroActivo !== 'todos' ? () => setFiltroActivo('todos') : undefined}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text1,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.text3,
    marginTop: 2,
  },
  filtrosWrapper: {
    marginBottom: 8,
  },
  filtrosScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  chipActivo: {
    backgroundColor: colors.primary ?? '#1D4ED8',
    borderColor: colors.primary ?? '#1D4ED8',
  },
  chipTexto: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text2,
  },
  chipTextoActivo: {
    color: colors.white,
  },
  errorCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
    gap: 10,
  },
  errorTexto: {
    fontSize: typography.size.sm,
    color: colors.danger,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cargandoTexto: {
    fontSize: typography.size.sm,
    color: colors.text3,
  },
  listaContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 12,
  },
  ticketCard: {
    gap: 8,
  },
  cardPresionada: {
    opacity: 0.85,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prioridad: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text2,
  },
  prioridadAlta: {
    color: colors.danger,
    fontWeight: typography.weight.semibold,
  },
  titulo: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text1,
  },
  descripcion: {
    fontSize: typography.size.sm,
    color: colors.text2,
    lineHeight: 18,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fecha: {
    fontSize: typography.size.xs,
    color: colors.text3,
  },
  accionTexto: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary ?? '#1D4ED8',
  },
});
