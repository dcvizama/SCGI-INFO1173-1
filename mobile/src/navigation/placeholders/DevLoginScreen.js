import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const CUENTAS = [
  { correo: 'reportante@uct.cl', rol: 'Reportante' },
  { correo: 'supervisor@uct.cl', rol: 'Supervisor' },
  { correo: 'tecnico@uct.cl', rol: 'Técnico' },
  { correo: 'admin@uct.cl', rol: 'Administrador' },
];

export default function DevLoginScreen() {
  const { signIn } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function entrar(correo, password = 'test1234') {
    setError(null);
    setEnviando(true);
    try {
      await signIn(correo, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login de pruebas</Text>
      <Text style={styles.subtitle}>Temporal: se elimina cuando Dev 2 entregue LoginScreen</Text>

      {CUENTAS.map((cuenta) => (
        <Pressable
          key={cuenta.correo}
          style={styles.boton}
          disabled={enviando}
          onPress={() => entrar(cuenta.correo)}
        >
          <Text style={styles.botonTexto}>Entrar como {cuenta.rol}</Text>
        </Pressable>
      ))}

      <Pressable
        style={[styles.boton, styles.botonSecundario]}
        disabled={enviando}
        onPress={() => entrar('admin@uct.cl', 'clave-mala')}
      >
        <Text style={styles.botonTexto}>Probar credenciales inválidas</Text>
      </Pressable>

      {enviando ? <ActivityIndicator style={styles.estado} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#666', marginBottom: 12 },
  boton: { backgroundColor: '#1f6feb', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  botonSecundario: { backgroundColor: '#8b949e', marginTop: 8 },
  botonTexto: { color: '#fff', fontWeight: '600' },
  estado: { marginTop: 12 },
  error: { color: '#d1242f', marginTop: 12, textAlign: 'center' },
});
