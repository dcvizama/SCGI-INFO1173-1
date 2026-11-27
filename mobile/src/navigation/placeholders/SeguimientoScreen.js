import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import AccionesTicket from '../../features/incident/AccionesTicket';
import { useIncident } from '../../context/IncidentContext';

// TEMPORAL: se reemplaza por la pantalla real de seguimiento cuando exista.
// Solo sirve para probar en el teléfono el detalle y la trazabilidad de
// IncidentContext; las acciones por rol y la línea de tiempo van en la real.

export default function SeguimientoScreen() {
  const { ticketActual, historialTicket, cargandoTicket, errorTicket, refreshTicket } =
    useIncident();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ticketActual && (
        <View style={styles.resumen}>
          <Text style={styles.titulo}>{ticketActual.titulo}</Text>
          <Text style={styles.detalle}>
            {ticketActual.estado?.nombre_estado} · Prioridad {ticketActual.prioridad}
          </Text>
        </View>
      )}

      {cargandoTicket && <ActivityIndicator style={styles.espacio} />}

      {errorTicket && (
        <View style={styles.espacio}>
          <Text style={styles.error}>{errorTicket.mensaje}</Text>
          <Button title="Reintentar" onPress={refreshTicket} />
        </View>
      )}

      {ticketActual && <AccionesTicket key={ticketActual.id_incidencia} ticket={ticketActual} />}
      <Text style={styles.seccion}>Historial</Text>
      {historialTicket.map((cambio) => (
        <View key={cambio.id_historial} style={styles.cambio}>
          <Text style={styles.estado}>{cambio.estado?.nombre_estado}</Text>
          {cambio.comentario ? <Text>{cambio.comentario}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, backgroundColor: '#F1F5F9', flexGrow: 1 },
  resumen: {
    backgroundColor: '#FFF4CF',
    borderColor: '#EDCF83',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  titulo: { fontSize: 18, fontWeight: '700' },
  detalle: { color: '#555', marginTop: 4 },
  espacio: { marginTop: 16 },
  error: { color: '#b91c1c', marginBottom: 8 },
  seccion: { marginTop: 24, marginBottom: 8, fontWeight: '700' },
  cambio: {
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#7599EE',
  },
  estado: { fontWeight: '600' },
});
