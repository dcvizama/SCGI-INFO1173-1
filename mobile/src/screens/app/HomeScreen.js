import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio</Text>
      <Text style={styles.dato}>
        {user?.nombre} {user?.apellido}
      </Text>
      <Text style={styles.dato}>{user?.correo}</Text>
      <Text style={styles.rol}>Rol: {user?.rol}</Text>

      <Pressable style={styles.boton} onPress={signOut}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  dato: { color: '#333' },
  rol: { fontWeight: '700', marginTop: 8 },
  boton: {
    marginTop: 24,
    backgroundColor: '#d1242f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  botonTexto: { color: '#fff', fontWeight: '600' },
});
