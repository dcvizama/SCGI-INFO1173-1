import SupervisionScreen from '../../screens/incident/SupervisionScreen';
import PanelTecnico from '../../screens/technician/PanelTecnico';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { normalizarRol } from '../permissions';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const rolGlobal = normalizarRol(user?.rol?.nombre_rol ?? user?.rol) ?? 'Invitado';

  // Funciones preparadas para futuras peticiones fetch/axios al backend
  const simularPeticion = (endpoint, accion) => {
    Alert.alert('Petición Simulada', `POST a /api/${endpoint}\nAcción: ${accion}`);
  };

  if (rolGlobal === 'Tecnico') return <PanelTecnico />;

  // --- VISTA: PANEL ADMINISTRADOR ---
  if (rolGlobal === 'Administrador') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Panel de Administrador</Text>

        <View style={styles.seccion}>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#1976d2' }]}
            onPress={() => simularPeticion('sedes', 'Registrar Sede Universitaria')}
          >
            <Text style={styles.botonTexto}>REGISTRAR SEDE UNIVERSITARIA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#1976d2' }]}
            onPress={() => simularPeticion('edificios', 'Registrar Edificio')}
          >
            <Text style={styles.botonTexto}>REGISTRAR EDIFICIO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#0288d1' }]}
            onPress={() => simularPeticion('activos', 'Registrar Activo Fijo')}
          >
            <Text style={styles.botonTexto}>REGISTRAR ACTIVO FIJO</Text>
          </TouchableOpacity>
          {/* <<include>> de Registrar Activo Fijo */}
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#0097a7', marginTop: -5 }]}
            onPress={() => simularPeticion('qr', 'Generar Identificador QR')}
          >
            <Text style={styles.botonTexto}>↳ GENERAR IDENTIFICADOR QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seccion}>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#5c6bc0' }]}
            onPress={() => simularPeticion('usuarios', 'Crear Cuenta de Usuario')}
          >
            <Text style={styles.botonTexto}>CREAR CUENTA DE USUARIO</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.boton, { backgroundColor: '#d32f2f', marginTop: 20 }]}
          onPress={signOut}
        >
          <Text style={styles.botonTexto}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // --- VISTA: PANEL SUPERVISOR ---
  if (rolGlobal === 'Supervisor') return <SupervisionScreen />;

  // --- VISTA: TÉCNICOS Y REPORTANTES ---
  return (
    <View style={styles.containerCentro}>
      <Text style={styles.titulo}>Bienvenido, {rolGlobal}</Text>
      <Text style={styles.texto}>
        Dirígete a la pestaña Escanear en el menú inferior para operar sobre los equipos.
      </Text>
      <TouchableOpacity
        style={[styles.boton, { backgroundColor: '#d32f2f', marginTop: 20, width: '100%' }]}
        onPress={signOut}
      >
        <Text style={styles.botonTexto}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  containerCentro: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, color: '#000' },
  texto: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  seccion: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  boton: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  botonTexto: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
});
