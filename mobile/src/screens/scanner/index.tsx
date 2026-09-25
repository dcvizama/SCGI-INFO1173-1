import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { orquestarEscaneo } from '../../features/qr/scanController';
import { obtenerHistorialEscaneos } from '../../features/qr/scanHistory';
import { useAuth } from '../../context/AuthContext';

export default function AppFlow() {
  const { user } = useAuth();
  const rolGlobal = user?.rol || 'Invitado';

  const [pantallaActiva, setPantallaActiva] = useState<'escaner' | 'incidencia' | 'ficha_equipo' | 'busqueda'>('escaner');
  const [historialUI, setHistorialUI] = useState<string[]>([]);
  const [activoActual, setActivoActual] = useState<string>('');
  const [scaneando, setScaneando] = useState<boolean>(true);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [busquedaManual, setBusquedaManual] = useState('');

  useEffect(() => {
    obtenerHistorialEscaneos().then(setHistorialUI);
  }, []);

  // Bloqueo arquitectónico: Administradores y Supervisores no tienen por qué estar aquí
  if (rolGlobal === 'Administrador' || rolGlobal === 'Supervisor') {
    return (
      <View style={styles.containerCentro}>
        <Text style={styles.titulo}>Acceso Innecesario</Text>
        <Text style={styles.texto}>Tu rol de {rolGlobal} no requiere el uso de lectura QR en terreno. Gestiona tus tareas desde la pestaña de Inicio.</Text>
      </View>
    );
  }

  const simularPeticion = (endpoint: string, accion: string) => {
    Alert.alert("Petición Simulada", `POST a /api/${endpoint}\nAcción: ${accion}`);
  };

  const manejarEscaneo = async (codigo: string) => {
    if (!scaneando) return;
    setScaneando(false);

    const resultado = await orquestarEscaneo(codigo, rolGlobal);
    if (resultado.historial) setHistorialUI(resultado.historial);

    switch (resultado.accion) {
      case 'alerta':
        Alert.alert(resultado.titulo, resultado.mensaje, [{ text: 'OK', onPress: () => setScaneando(true) }]);
        break;
      case 'ir_a_incidencia':
        setActivoActual(resultado.codigoValido);
        setPantallaActiva('incidencia');
        break;
      case 'ir_a_ficha_equipo':
        setActivoActual(resultado.codigoValido);
        setPantallaActiva('ficha_equipo');
        break;
      case 'ir_a_busqueda':
        Alert.alert(resultado.titulo, resultado.mensaje, [{ text: 'OK', onPress: () => setPantallaActiva('busqueda') }]);
        break;
    }
  };

  // --- VISTA: GESTIÓN DE INCIDENCIAS (REPORTANTE) ---
  if (pantallaActiva === 'incidencia') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Gestión de Incidencias</Text>
        <Text style={styles.subtitulo}>Equipo: {activoActual}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#d84315' }]} onPress={() => simularPeticion('incidencias', 'Levantar Incidencia')}>
             <Text style={styles.botonTexto}>LEVANTAR INCIDENCIA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#ff7043' }]} onPress={() => simularPeticion('incidencias/foto', 'Adjuntar Foto')}>
             <Text style={styles.botonTexto}>+ ADJUNTAR FOTOGRAFÍA DEL DAÑO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#2e7d32' }]} onPress={() => simularPeticion('reparaciones/confirmar', 'Confirmar')}>
             <Text style={styles.botonTexto}>CONFIRMAR REPARACIÓN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#81c784' }]} onPress={() => simularPeticion('reparaciones/reabrir', 'Reabrir')}>
             <Text style={styles.botonTexto}>+ REABRIR POR FALLA PERSISTENTE</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.boton, { backgroundColor: '#757575', marginTop: 20 }]} onPress={() => { setPantallaActiva('escaner'); setScaneando(true); }}>
           <Text style={styles.botonTexto}>VOLVER AL ESCÁNER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- VISTA: FICHA DE EQUIPO (TÉCNICO) ---
  if (pantallaActiva === 'ficha_equipo') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Consultar Ficha de Equipo</Text>
        <Text style={styles.subtitulo}>Equipo: {activoActual}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#0288d1' }]} onPress={() => simularPeticion('equipos/fallas', 'Revisar Historial')}>
             <Text style={styles.botonTexto}>REVISAR HISTORIAL DE FALLAS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#1565c0' }]} onPress={() => simularPeticion('diagnosticos', 'Registrar Diagnóstico')}>
             <Text style={styles.botonTexto}>REGISTRAR DIAGNÓSTICO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#2e7d32' }]} onPress={() => simularPeticion('reparaciones', 'Ejecutar Reparación')}>
             <Text style={styles.botonTexto}>EJECUTAR REPARACIÓN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#558b2f' }]} onPress={() => simularPeticion('repuestos', 'Solicitar Pieza')}>
             <Text style={styles.botonTexto}>+ SOLICITAR PIEZA DE REPUESTO</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.boton, { backgroundColor: '#757575', marginTop: 20 }]} onPress={() => { setPantallaActiva('escaner'); setScaneando(true); }}>
           <Text style={styles.botonTexto}>VOLVER AL ESCÁNER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- VISTA: BÚSQUEDA MANUAL ---
  if (pantallaActiva === 'busqueda') {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Buscar Equipo</Text>
        <TextInput 
          style={styles.input} 
          placeholder="UCT-INF-1024" 
          value={busquedaManual}
          onChangeText={setBusquedaManual}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={[styles.boton, { backgroundColor: '#1976d2' }]} onPress={() => simularPeticion(`equipos/${busquedaManual}`, 'Búsqueda Manual')}>
           <Text style={styles.botonTexto}>BUSCAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.boton, { backgroundColor: '#757575', marginTop: 10 }]} onPress={() => { setPantallaActiva('escaner'); setScaneando(true); }}>
           <Text style={styles.botonTexto}>VOLVER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- VISTA: ESCÁNER QR ---
  if (!permisoCamara) return <View />;
  if (!permisoCamara.granted) {
    return (
      <View style={styles.containerCentro}>
        <Text style={styles.texto}>Permiso requerido para usar la cámara</Text>
        <TouchableOpacity style={[styles.boton, { backgroundColor: '#1976d2' }]} onPress={pedirPermisoCamara}>
           <Text style={styles.botonTexto}>OTORGAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.usuario}>{rolGlobal}</Text>
      </View>
      <Text style={styles.titulo}>Escanear Código QR de Equipo</Text>
      <View style={styles.contenedorCamara}>
        <CameraView 
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scaneando ? ({ data }) => manejarEscaneo(data) : undefined}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View style={styles.overlayBotones}>
           <TouchableOpacity style={[styles.boton, { backgroundColor: 'rgba(46, 125, 50, 0.9)' }]} onPress={() => manejarEscaneo("UCT-INF-1024")}>
              <Text style={styles.botonTexto}>SIMULAR LECTURA VÁLIDA</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.boton, { backgroundColor: 'rgba(245, 124, 0, 0.9)', marginTop: 5 }]} onPress={() => manejarEscaneo("UCT-ABC-9999")}>
              <Text style={styles.botonTexto}>SIMULAR LECTURA INVÁLIDA</Text>
           </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.historial}>
        {historialUI.map((item, index) => <Text key={index} style={styles.itemHistorial}>{item}</Text>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50 },
  containerCentro: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'flex-start', width: '100%', marginBottom: 15 },
  usuario: { fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#000' },
  subtitulo: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center', color: '#444' },
  texto: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 15 },
  card: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  boton: { paddingVertical: 14, paddingHorizontal: 15, borderRadius: 6, alignItems: 'center', width: '100%' },
  botonTexto: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  contenedorCamara: { width: '100%', height: 350, borderRadius: 12, overflow: 'hidden', marginBottom: 20, backgroundColor: '#000', position: 'relative' },
  overlayBotones: { position: 'absolute', bottom: 10, width: '100%', paddingHorizontal: 20 },
  historial: { width: '100%', maxHeight: 120, backgroundColor: '#e0e0e0', padding: 10, borderRadius: 8 },
  itemHistorial: { fontSize: 14, color: '#333', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 4 }
});