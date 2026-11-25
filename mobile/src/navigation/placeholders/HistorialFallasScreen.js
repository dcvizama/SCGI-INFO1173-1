import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { obtenerHistorialFallas } from '../../services/assetService';
import { puedeVerBandeja } from '../permissions';
import { useAbrirSeguimiento } from '../useAbrirSeguimiento';

// TEMPORAL: se reemplaza por la pantalla real del historial de fallas cuando
// exista. Solo sirve para probar en el teléfono la navegación desde la ficha
// del activo; el diseño y los estados vacíos van en la pantalla real.

export default function HistorialFallasScreen({ route }) {
  const { idActivo, activo } = route.params ?? {};
  const { user } = useAuth();
  const abrirSeguimiento = useAbrirSeguimiento();
  const puedeAbrir = puedeVerBandeja(user?.rol?.nombre_rol ?? user?.rol);

  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // Sube en cada reintento para volver a pedir el historial.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    obtenerHistorialFallas(idActivo)
      .then((respuesta) => vigente && setHistorial(respuesta))
      .catch(
        (e) =>
          vigente && setError(e?.mensaje ?? 'No pudimos cargar el historial. Intenta de nuevo.')
      )
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [idActivo, intento]);

  const reintentar = () => {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>{activo?.nombre}</Text>
      <Text style={styles.detalle}>{activo?.codigo_qr}</Text>

      {cargando && <ActivityIndicator style={styles.espacio} />}

      {error && (
        <View style={styles.espacio}>
          <Text style={styles.error}>{error}</Text>
          <Button title="Reintentar" onPress={reintentar} />
        </View>
      )}

      {historial && (
        <Text style={styles.espacio}>
          {historial.total_fallas} fallas · {historial.fallas_abiertas} abiertas
        </Text>
      )}

      {historial?.fallas.map((falla) => (
        <Pressable
          key={falla.id_incidencia}
          style={styles.fila}
          disabled={!puedeAbrir}
          onPress={() => abrirSeguimiento(falla.id_incidencia)}
        >
          <Text style={styles.falla}>{falla.titulo}</Text>
          <Text style={styles.detalle}>{falla.estado?.nombre_estado}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  titulo: { fontSize: 18, fontWeight: '700' },
  detalle: { color: '#555', marginTop: 2 },
  espacio: { marginTop: 16 },
  error: { color: '#b91c1c', marginBottom: 8 },
  fila: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  falla: { fontSize: 16, fontWeight: '600' },
});
