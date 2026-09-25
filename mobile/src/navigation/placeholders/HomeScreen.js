import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const rolGlobal = user?.rol || 'Invitado';

  // Funciones preparadas para futuras peticiones fetch/axios al backend
  const simularPeticion = (endpoint: string, accion: string) => {
    Alert.alert("Petición Simulada", `POST a /api/${endpoint}\nAcción: ${accion}`);
  };

  // --- VISTA: PANEL ADMINISTRADOR ---
  if (rolGlobal === 'Administrador') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Panel de Administrador</Text>
        
        <View style={styles.seccion}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#1976d2' }]} onPress={() => simularPeticion('sedes', 'Registrar Sede Universitaria')}>
            <Text style={styles.botonTexto}>REGISTRAR SEDE UNIVERSITARIA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#1976d2' }]} onPress={() => simularPeticion('edificios', 'Registrar Edificio')}>
            <Text style={styles.botonTexto}>REGISTRAR EDIFICIO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#0288d1' }]} onPress={() => simularPeticion('activos', 'Registrar Activo Fijo')}>
            <Text style={styles.botonTexto}>REGISTRAR ACTIVO FIJO</Text>
          </TouchableOpacity>
          {/* <<include>> de Registrar Activo Fijo */}
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#0097a7', marginTop: -5 }]} onPress={() => simularPeticion('qr', 'Generar Identificador QR')}>
            <Text style={styles.botonTexto}>↳ GENERAR IDENTIFICADOR QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seccion}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#5c6bc0' }]} onPress={() => simularPeticion('usuarios', 'Crear Cuenta de Usuario')}>
            <Text style={styles.botonTexto}>CREAR CUENTA DE USUARIO</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.boton, { backgroundColor: '#d32f2f', marginTop: 20 }]} onPress={signOut}>
          <Text style={styles.botonTexto}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // --- VISTA: PANEL SUPERVISOR ---
  if (rolGlobal === 'Supervisor') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Panel de Supervisor</Text>
        
        <View style={styles.seccion}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#2196F3' }]} onPress={() => simularPeticion('tickets', 'Evaluar Criticidad')}>
            <Text style={styles.botonTexto}>EVALUAR CRITICIDAD DE TICKET</Text>
          </TouchableOpacity>
          {/* <<extend>> de Evaluar Criticidad */}
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#5C6BC0' }]} onPress={() => simularPeticion('proveedores', 'Derivar a Externo')}>
            <Text style={styles.botonTexto}>+ DERIVAR A PROVEEDOR EXTERNO</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seccion}>
          {/* <<include>> de Asignar Técnico */}
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#0288D1' }]} onPress={() => simularPeticion('tecnicos/carga', 'Consultar Carga')}>
            <Text style={styles.botonTexto}>CONSULTAR CARGA DE TRABAJO</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.boton, { backgroundColor: '#0277BD' }]} 
            onPress={() => Alert.alert('Asignar Técnico', 'Selecciona personal disponible en terreno:', [
              { text: 'Asignar a Patricio Valdés', onPress: () => simularPeticion('tickets/asignar', 'Asignado a P. Valdés') },
              { text: 'Asignar a Víctor Sepúlveda', onPress: () => simularPeticion('tickets/asignar', 'Asignado a V. Sepúlveda') },
              { text: 'Cancelar', style: 'cancel' }
            ])}
          >
            <Text style={styles.botonTexto}>ASIGNAR TÉCNICO A TERRENO</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seccion}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#EF6C00' }]} onPress={() => simularPeticion('mantenimiento', 'Planificar Preventivo')}>
            <Text style={styles.botonTexto}>PLANIFICAR MANT. PREVENTIVO</Text>
          </TouchableOpacity>
          {/* <<include>> de Planificar Mantenimiento */}
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#F57C00', marginTop: -5 }]} onPress={() => simularPeticion('notificaciones', 'Notificar Cese')}>
            <Text style={styles.botonTexto}>↳ NOTIFICAR CESE OPERACIONAL</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.boton, { backgroundColor: '#D32F2F', marginTop: 20 }]} onPress={signOut}>
          <Text style={styles.botonTexto}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // --- VISTA: TÉCNICOS Y REPORTANTES ---
  return (
    <View style={styles.containerCentro}>
      <Text style={styles.titulo}>Bienvenido, {rolGlobal}</Text>
      <Text style={styles.texto}>Dirígete a la pestaña "Escanear" en el menú inferior para operar sobre los equipos.</Text>
      <TouchableOpacity style={[styles.boton, { backgroundColor: '#d32f2f', marginTop: 20, width: '100%' }]} onPress={signOut}>
        <Text style={styles.botonTexto}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50, alignItems: 'center' },
  containerCentro: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, color: '#000' },
  texto: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  seccion: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  boton: { paddingVertical: 14, paddingHorizontal: 15, borderRadius: 6, marginBottom: 10, alignItems: 'center' },
  botonTexto: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' }
});