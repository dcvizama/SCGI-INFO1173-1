import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../../components/StatusBadge';
import { colors } from '../../theme/colors';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useIncident } from '../../context/IncidentContext';
import { useAbrirSeguimiento } from '../useAbrirSeguimiento';

const estados = [
  null,
  'pendiente',
  'clasificada',
  'asignada',
  'diagnostico',
  'reparacion',
  'resuelta',
  'verificada',
  'cerrada',
];

export default function BandejaScreen() {
  const { tickets, cargandoTickets, errorTickets, loadTickets, refreshTickets } = useIncident();
  const abrirSeguimiento = useAbrirSeguimiento();

  // Recarga cada vez que se vuelve al tab, para ver los cambios de estado.
  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );

  return (
    <View style={styles.container}>
      {errorTickets && <Text style={styles.error}>{errorTickets.mensaje}</Text>}
      <FlatList
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <View style={styles.header}>
            <Ionicons name="file-tray-full-outline" size={28} color="#A5DBFF" />
            <Text accessibilityRole="header" style={styles.h1}>
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </Text>
          </View>
        }
        data={tickets}
        keyExtractor={(ticket) => ticket.id_incidencia}
        refreshing={cargandoTickets}
        onRefresh={refreshTickets}
        ListEmptyComponent={
          !cargandoTickets && <Text style={styles.vacio}>No hay incidencias.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.fila, pressed && { backgroundColor: colors.brandBg }]}
            onPress={() => abrirSeguimiento(item)}
            accessibilityRole="button"
          >
            <View style={styles.info}>
              <StatusBadge
                status={
                  estados[item.estado?.id_estado] ?? item.estado?.nombre_estado ?? 'Sin estado'
                }
              />
              <Text style={styles.titulo}>{item.titulo}</Text>
              {item.prioridad && <Text style={styles.detalle}>Prioridad {item.prioridad}</Text>}
            </View>
            <Ionicons name="chevron-forward" color={colors.brandDark} size={20} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF3F7' },
  lista: { padding: 16, gap: 12, paddingBottom: 30 },
  header: { backgroundColor: '#173754', borderRadius: 20, padding: 22, gap: 10 },
  h1: { fontSize: 30, fontWeight: '700', color: 'white' },
  fila: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: { flex: 1, gap: 8 },
  titulo: { fontSize: 18, fontWeight: '700', color: colors.text1 },
  detalle: { color: colors.text2, fontSize: 14 },
  error: { color: colors.dangerText, padding: 14, backgroundColor: colors.dangerBg },
  vacio: { color: colors.text2, textAlign: 'center', padding: 28 },
});
