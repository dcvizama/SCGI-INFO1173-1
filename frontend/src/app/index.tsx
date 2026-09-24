import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { orquestarEscaneo } from '../controllers/scanController';
import { obtenerHistorialEscaneos } from '../store/scanHistory';

export default function AppFlow() {
  const [pantallaActiva, setPantallaActiva] = useState<'login' | 'escaner' | 'incidencia' | 'historial_tecnico' | 'panel_admin' | 'panel_supervisor' | 'busqueda'>('login');
  const [rolUsuario, setRolUsuario] = useState<string | null>(null);
  const [historialUI, setHistorialUI] = useState<string[]>([]);
  const [activoActual, setActivoActual] = useState<string>('');
  const [scaneando, setScaneando] = useState<boolean>(true);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [busquedaManual, setBusquedaManual] = useState('');

  useEffect(() => {
    obtenerHistorialEscaneos().then(data => setHistorialUI(data));
  }, []);

  const iniciarSesion = (rol: string) => {
    setRolUsuario(rol);
    if (rol === 'Administrador') setPantallaActiva('panel_admin');
    else if (rol === 'Supervisor') setPantallaActiva('panel_supervisor');
    else {
      setPantallaActiva('escaner');
      setScaneando(true);
    }
  };

  const manejarEscaneo = async (codigo: string) => {
    if (!scaneando) return;
    setScaneando(false);

    const resultado = await orquestarEscaneo(codigo, rolUsuario);
    if (resultado.historial) setHistorialUI(resultado.historial);

    switch (resultado.accion) {
      case 'alerta':
        Alert.alert(resultado.titulo, resultado.mensaje, [{ text: 'OK', onPress: () => setScaneando(true) }]);
        break;
      case 'ir_a_incidencia':
        setActivoActual(resultado.codigoValido);
        setPantallaActiva('incidencia');
        break;
      case 'ir_a_historial_tecnico':
        setActivoActual(resultado.codigoValido);
        setPantallaActiva('historial_tecnico');
        break;
      case 'ir_a_busqueda':
        Alert.alert(resultado.titulo, resultado.mensaje, [{ text: 'OK', onPress: () => setPantallaActiva('busqueda') }]);
        break;
    }
  };

  // --- 1. LOGIN ---
  if (pantallaActiva === 'login') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Acceso SCGI</Text>
        <View style={styles.botones}>
          <Button title="Acceder como Administrador" onPress={() => iniciarSesion('Administrador')} color="#1565c0" />
          <View style={styles.separador} />
          <Button title="Acceder como Supervisor" onPress={() => iniciarSesion('Supervisor')} color="#0277bd" />
          <View style={styles.separador} />
          <Button title="Acceder como Técnico" onPress={() => iniciarSesion('Técnico')} color="#2e7d32" />
          <View style={styles.separador} />
          <Button title="Acceder como Reportante" onPress={() => iniciarSesion('Reportante')} color="#ef6c00" />
        </View>
      </View>
    );
  }

  // --- 2. PANELES INTERACTIVOS ---
  if (pantallaActiva === 'panel_admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Panel de Administrador</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>👥 Gestión de Usuarios y Roles</Text>
          <Text style={styles.texto}>Usuario seleccionado: Ignacio Martín (Reportante)</Text>
          <Button 
            title="Cambiar Rol de Usuario" 
            onPress={() => Alert.alert('Modificar Rol', 'Selecciona el nuevo nivel de acceso para Ignacio:', [
              { text: 'Ascender a Técnico', onPress: () => Alert.alert('Éxito', 'Rol actualizado en la base de datos.') },
              { text: 'Ascender a Supervisor', onPress: () => Alert.alert('Éxito', 'Rol actualizado en la base de datos.') },
              { text: 'Cancelar', style: 'cancel' }
            ])} 
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>💻 Inventario e Infraestructura</Text>
          <Text style={styles.texto}>Activo reciente: UCT-INF-1024</Text>
          <Button 
            title="Auditar Estado de Activo" 
            color="#2e7d32"
            onPress={() => Alert.alert('Auditoría', 'Estado actual: OPERATIVO. ¿Qué acción desea aplicar?', [
              { text: 'Dar de baja', style: 'destructive', onPress: () => Alert.alert('Registrado', 'Activo dado de baja.') },
              { text: 'Bloquear por extravío', onPress: () => Alert.alert('Registrado', 'Activo bloqueado en el sistema.') },
              { text: 'Cancelar', style: 'cancel' }
            ])} 
          />
        </View>

        <View style={styles.separadorLargo} />
        <Button title="CERRAR SESIÓN" color="#d32f2f" onPress={() => setPantallaActiva('login')} />
      </View>
    );
  }

  if (pantallaActiva === 'panel_supervisor') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Panel de Supervisor</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>⚠️ Incidencia Pendiente: Ticket #402</Text>
          <Text style={styles.texto}>Falla de hardware reportada en laboratorio.</Text>
          
          <TouchableOpacity 
            style={styles.botonAccion}
            onPress={() => Alert.alert('Clasificar', 'Establecer nivel de urgencia del ticket:', [
              { text: '🔴 Alta (Crítica)', onPress: () => Alert.alert('Guardado', 'Prioridad Alta asignada.') },
              { text: '🟡 Media', onPress: () => Alert.alert('Guardado', 'Prioridad Media asignada.') },
              { text: 'Cancelar', style: 'cancel' }
            ])}
          >
            <Text style={styles.botonTexto}>Clasificar y priorizar incidencia</Text>
          </TouchableOpacity>

          <View style={styles.separador} />

          <TouchableOpacity 
            style={[styles.botonAccion, { backgroundColor: '#0277bd' }]}
            onPress={() => Alert.alert('Asignación', 'Selecciona al técnico disponible para resolver el Ticket #402:', [
              { text: 'Asignar a Patricio Valdés', onPress: () => Alert.alert('Asignado', 'Notificación enviada al técnico.') },
              { text: 'Asignar a Víctor Sepúlveda', onPress: () => Alert.alert('Asignado', 'Notificación enviada al técnico.') },
              { text: 'Cancelar', style: 'cancel' }
            ])}
          >
            <Text style={styles.botonTexto}>Asignar técnico responsable</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>🔧 Programación Preventiva</Text>
          <TouchableOpacity 
            style={[styles.botonAccion, { backgroundColor: '#ef6c00' }]}
            onPress={() => Alert.alert('Mantenimiento', 'Generar orden automática para los equipos de la sala INF-201 el próximo viernes.', [
              { text: 'Programar', onPress: () => Alert.alert('Éxito', 'Mantenimiento agendado y KPIs actualizados.') },
              { text: 'Cancelar', style: 'cancel' }
            ])}
          >
            <Text style={styles.botonTexto}>Programar mantenimiento preventivo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.separadorLargo} />
        <Button title="CERRAR SESIÓN" color="#d32f2f" onPress={() => setPantallaActiva('login')} />
      </View>
    );
  }

  // --- 3. VISTAS POST-ESCANEO (Técnico y Reportante) ---
  if (pantallaActiva === 'incidencia') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>📝 Registrar Incidencia</Text>
        <Text style={styles.subtitulo}>Activo Identificado: {activoActual}</Text>
        <Button title="Cancelar y Volver al Escáner" onPress={() => { setPantallaActiva('escaner'); setScaneando(true); }} />
      </View>
    );
  }

  if (pantallaActiva === 'historial_tecnico') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>🔧 Historial Técnico del Activo</Text>
        <Text style={styles.subtitulo}>Código: {activoActual}</Text>
        <Button title="Volver al Escáner" onPress={() => { setPantallaActiva('escaner'); setScaneando(true); }} />
      </View>
    );
  }

  if (pantallaActiva === 'busqueda') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>🔍 Búsqueda Manual</Text>
        <Text style={styles.texto}>El código escaneado no existe. Ingrese el ID manualmente:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej. UCT-INF-1024" 
          value={busquedaManual}
          onChangeText={setBusquedaManual}
          autoCapitalize="characters"
        />
        <Button title="Buscar" onPress={() => Alert.alert('Búsqueda', `Buscando ${busquedaManual}...`)} />
        <View style={styles.separador} />
        <Button title="Volver al Escáner" onPress={() => { setPantallaActiva('escaner'); setScaneando(true); }} color="#757575" />
      </View>
    );
  }

  // --- 4. VISTA PRINCIPAL (Cámara para Técnico/Reportante) ---
  if (!permisoCamara) return <View />;
  if (!permisoCamara.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.texto}>Se necesita permiso para usar la cámara</Text>
        <Button onPress={pedirPermisoCamara} title="Otorgar Permiso" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.usuario}>Rol: {rolUsuario}</Text>
        <Button title="Salir" color="#d32f2f" onPress={() => setPantallaActiva('login')} />
      </View>

      <Text style={styles.titulo}>Escanear Código QR</Text>
      
      <View style={styles.contenedorCamara}>
        <CameraView 
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scaneando ? ({ data }) => manejarEscaneo(data) : undefined}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View style={styles.overlayBotones}>
           <Button title="✅ Simular UCT-INF-1024 (Válido)" onPress={() => manejarEscaneo("UCT-INF-1024")} color="rgba(46, 125, 50, 0.85)" />
           <View style={{height: 5}} />
           <Button title="⚠️ Simular UCT-ABC-9999 (No Registrado)" onPress={() => manejarEscaneo("UCT-ABC-9999")} color="rgba(245, 124, 0, 0.85)" />
        </View>
      </View>

      <Text style={styles.tituloHistorial}>Historial de Escaneos</Text>
      <ScrollView style={styles.historial}>
        {historialUI.map((item, index) => <Text key={index} style={styles.itemHistorial}>🕒 {item}</Text>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  usuario: { fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitulo: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center', color: '#444' },
  texto: { fontSize: 14, color: '#666', marginBottom: 10 },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 15 },
  botones: { width: '100%', maxWidth: 300, alignSelf: 'center', marginTop: '10%' },
  separador: { height: 10 },
  separadorLargo: { height: 30 },
  
  // Nuevos estilos para los paneles interactivos
  card: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2 },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  botonAccion: { backgroundColor: '#1976d2', padding: 12, borderRadius: 6, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  contenedorCamara: { width: '100%', height: 350, borderRadius: 12, overflow: 'hidden', marginBottom: 20, backgroundColor: '#000', position: 'relative' },
  overlayBotones: { position: 'absolute', bottom: 10, width: '100%', paddingHorizontal: 20 },
  tituloHistorial: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  historial: { width: '100%', maxHeight: 120, backgroundColor: '#e0e0e0', padding: 10, borderRadius: 8 },
  itemHistorial: { fontSize: 14, color: '#333', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 4 }
});