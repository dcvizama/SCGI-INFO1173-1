import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useIncident } from '../../context/IncidentContext';
import { useAbrirSeguimiento } from '../useAbrirSeguimiento';

// TEMPORAL: se reemplaza por la pantalla real de la bandeja cuando exista.
// Solo sirve para probar en el teléfono la bandeja de IncidentContext y la
// navegación al seguimiento; los filtros por rol y el diseño van en la real.

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
        data={tickets}
        keyExtractor={(ticket) => ticket.id_incidencia}
        refreshing={cargandoTickets}
        onRefresh={refreshTickets}
        ListEmptyComponent={
          !cargandoTickets && <Text style={styles.vacio}>No hay incidencias.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.fila}
            onPress={() => abrirSeguimiento(item)}
            accessibilityRole="button"
          >
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.detalle}>
              {item.estado?.nombre_estado} · Prioridad {item.prioridad}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  error: { color: '#b91c1c', marginBottom: 8 },
  vacio: { textAlign: 'center', color: '#666', marginTop: 24 },
  fila: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  titulo: { fontSize: 16, fontWeight: '600' },
  detalle: { color: '#555', marginTop: 2 },
});
