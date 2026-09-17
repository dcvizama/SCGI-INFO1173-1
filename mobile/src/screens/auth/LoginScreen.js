import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { signIn } = useAuth();

  function validate() {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un correo válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(email, password);
      // No hace falta navegar a mano: AppNavigator cambia solo a
      // PrivateRoutes apenas el token se actualiza en el contexto.
    } catch (err) {
      setServerError(
        err?.status === 401
          ? 'Credenciales incorrectas. Verifica tu correo y contraseña e intenta nuevamente.'
          : 'No se pudo iniciar sesión. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>SCGI</Text>
          <Text style={styles.brandSub}>UCTemuco · Gestión de Infraestructura</Text>
        </View>

        <Text style={styles.title}>Iniciar sesión</Text>

        <TextField
          label="CORREO INSTITUCIONAL"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          placeholder="j.morales@uct.cl"
          keyboardType="email-address"
          error={errors.email}
        />

        <TextField
          label="CONTRASEÑA"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
        />

        <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>

        <Button
          label="Iniciar sesión"
          onPress={handleSubmit}
          loading={loading}
        />

        {serverError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Credenciales incorrectas</Text>
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.white,
    padding: 28,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brand: {
    fontSize: 30,
    fontWeight: typography.weight.bold,
    color: colors.brand,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: typography.size.sm,
    color: colors.text3,
    marginTop: 4,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text1,
    marginBottom: 24,
  },
  forgot: {
    textAlign: 'right',
    color: colors.brand,
    fontSize: typography.size.sm,
    marginBottom: 24,
  },
  errorBox: {
    marginTop: 16,
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    padding: 14,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
    marginBottom: 2,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
});