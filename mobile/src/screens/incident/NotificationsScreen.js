import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useAbrirSeguimiento } from '../../navigation/useAbrirSeguimiento';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const ETIQUETAS_TIPO = {
  nueva_incidencia: 'Nueva incidencia',
  incidencia_asignada: 'Incidencia asignada',
  cambio_estado: 'Cambio de estado',
};

function formatearFecha(isoString) {
  if (!isoString) return '';
  const fecha = new Date(isoString);
  if (Number.isNaN(fecha.getTime())) return isoString;
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${anio} · ${horas}:${minutos}`;
}

// Pantalla controlada: la lista y el estado de lectura vienen del
// NotificationContext (navigation/NotificacionesTab.js), que marca como leída
// en el backend y actualiza la lista al instante.
export default function NotificationsScreen({
  notificaciones = [],
  onMarcarLeida,
  onMarcarTodasLeidas,
  onRefresh,
  refrescando = false,
}) {
  const abrirSeguimiento = useAbrirSeguimiento();
  const noLeidasCount = notificaciones.filter((n) => !n.leida).length;

  const manejarPresionarNotificacion = (item) => {
    const id = item.id_notificacion ?? item.id;

    if (!item.leida) {
      onMarcarLeida?.(id);
    }

    if (item.id_incidencia) {
      abrirSeguimiento(item.id_incidencia);
    }
  };

  const manejarMarcarTodas = () => {
    onMarcarTodasLeidas?.();
  };

  const renderNotificacion = ({ item }) => {
    const leida = Boolean(item.leida);
    const tipoLabel = ETIQUETAS_TIPO[item.tipo] ?? 'Actualización';

    return (
      <Pressable
        onPress={() => manejarPresionarNotificacion(item)}
        accessibilityRole="button"
        style={({ pressed }) => [pressed && styles.cardPresionada]}
      >
        <Card style={[styles.notifCard, !leida && styles.notifNoLeida]}>
          <View style={styles.topRow}>
            <View style={styles.tipoRow}>
              {!leida ? <View style={styles.puntoNoLeido} /> : null}
              <Text style={[styles.tipo, !leida && styles.tipoNoLeido]}>{tipoLabel}</Text>
            </View>
            <Text style={styles.fecha}>{formatearFecha(item.fecha_creacion)}</Text>
          </View>

          <Text style={[styles.titulo, !leida && styles.tituloNoLeido]}>
            {item.titulo ?? 'Notificación de incidencia'}
          </Text>

          {item.mensaje ? (
            <Text style={styles.mensaje} numberOfLines={3}>
              {item.mensaje}
            </Text>
          ) : null}

          {item.id_incidencia ? <Text style={styles.verTicket}>Ver ticket asociado →</Text> : null}
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <Text style={styles.headerSubtitle}>
            {noLeidasCount > 0 ? `${noLeidasCount} sin leer` : 'Estás al día con tus alertas'}
          </Text>
        </View>

        {noLeidasCount > 0 ? (
          <Pressable
            onPress={manejarMarcarTodas}
            accessibilityRole="button"
            style={styles.marcarTodasBtn}
          >
            <Text style={styles.marcarTodasTexto}>Marcar todas</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={notificaciones}
        keyExtractor={(item, idx) => String(item.id_notificacion ?? item.id ?? idx)}
        renderItem={renderNotificacion}
        refreshing={refrescando}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listaContent}
        ListEmptyComponent={<EmptyState variant="notifications" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  marcarTodasBtn: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
  },
  marcarTodasTexto: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary ?? '#1D4ED8',
  },
  listaContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  notifCard: {
    gap: 6,
  },
  notifNoLeida: {
    borderColor: colors.primary ?? '#1D4ED8',
    backgroundColor: '#F8FAFC',
  },
  cardPresionada: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  puntoNoLeido: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary ?? '#1D4ED8',
  },
  tipo: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.text3,
  },
  tipoNoLeido: {
    color: colors.primary ?? '#1D4ED8',
    fontWeight: typography.weight.semibold,
  },
  fecha: {
    fontSize: typography.size.xs,
    color: colors.text3,
  },
  titulo: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text1,
  },
  tituloNoLeido: {
    fontWeight: typography.weight.bold,
  },
  mensaje: {
    fontSize: typography.size.sm,
    color: colors.text2,
    lineHeight: 18,
  },
  verTicket: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary ?? '#1D4ED8',
    marginTop: 4,
  },
});
