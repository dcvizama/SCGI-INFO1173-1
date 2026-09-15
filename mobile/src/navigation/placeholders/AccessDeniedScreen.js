import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AccessDeniedScreen({ rol }) {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso denegado</Text>
      <Text style={styles.texto}>
        {rol
          ? `El rol "${rol}" no tiene permisos asignados en la aplicación móvil.`
          : 'Tu sesión no contiene un rol válido.'}
      </Text>
      <Text style={styles.nota}>Pantalla definitiva a cargo de Débora</Text>

      <Pressable style={styles.boton} onPress={signOut}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  title: { fontSize: 20, fontWeight: '700' },
  texto: { color: '#333', textAlign: 'center' },
  nota: { color: '#888', fontSize: 12, marginTop: 4 },
  boton: {
    marginTop: 24,
    backgroundColor: '#d1242f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  botonTexto: { color: '#fff', fontWeight: '600' },
});
