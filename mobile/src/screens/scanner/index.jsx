import { Ionicons } from '@expo/vector-icons';
import PanelTecnico from '../technician/PanelTecnico';
import { normalizarRol } from '../../navigation/permissions';
import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { orquestarEscaneo } from '../../features/qr/scanController';
import { obtenerHistorialEscaneos } from '../../features/qr/scanHistory';
import { useAuth } from '../../context/AuthContext';
import NuevaIncidenciaScreen from '../incident/NuevaIncidenciaScreen'; // CAMBIO: import

// Android libera la cámara al salir de la pestaña y, si la vista se reutiliza,
// queda en negro y no lee. Por eso se monta solo con la pestaña en foco y no lee
// códigos hasta que la cámara avisa que está lista. Si no abre, muestra el motivo.
function CamaraQR({ activa, onLeer }) {
  const [lista, setLista] = useState(false);
  const [falla, setFalla] = useState(null);

  if (falla) {
    return <Text style={styles.camaraError}>No se pudo abrir la cámara: {falla}</Text>;
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFillObject}
      facing="back"
      onCameraReady={() => setLista(true)}
      onMountError={({ message }) => setFalla(message)}
      onBarcodeScanned={activa && lista ? ({ data }) => onLeer(data) : undefined}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
    />
  );
}

function Aviso({ aviso, style }) {
  if (!aviso) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.aviso, style]}>
      <Ionicons name="alert-circle-outline" size={22} color="#9A3412" />
      <View style={styles.avisoCuerpo}>
        <Text style={styles.avisoTitulo}>{aviso.titulo}</Text>
        <Text style={styles.avisoTexto}>{aviso.mensaje}</Text>
      </View>
    </View>
  );
}

export default function AppFlow() {
  const { user } = useAuth();
  const rolGlobal = normalizarRol(user?.rol?.nombre_rol ?? user?.rol)?.toUpperCase() || 'Invitado';

  const [pantallaActiva, setPantallaActiva] = useState('escaner');
  const [historialUI, setHistorialUI] = useState([]);
  const [ficha, setFicha] = useState(null);
  const [activoActual, setActivoActual] = useState('');
  const [idActivoActual, setIdActivoActual] = useState(null); // CAMBIO: UUID del activo
  const [scaneando, setScaneando] = useState(true);
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [busquedaManual, setBusquedaManual] = useState('');
  const [aviso, setAviso] = useState(null);
  const enFoco = useIsFocused();
  // Lector de códigos del sistema: en Android, el de Google (Play Services); en iOS,
  // el de VisionKit. Abre su propia cámara, así que no depende de la vista en vivo,
  // que en algunos teléfonos con Expo Go queda sin imagen. Si no está, se usa la
  // cámara en vivo.
  const lectorNativo = CameraView.isModernBarcodeScannerAvailable;
  const suscripcionLector = useRef(null);

  useEffect(() => {
    obtenerHistorialEscaneos().then(setHistorialUI);
  }, []);

  useEffect(() => () => suscripcionLector.current?.remove(), []);

  // Bloqueo arquitectónico: Administradores y Supervisores no tienen por qué estar aquí
  if (rolGlobal === 'ADMINISTRADOR' || rolGlobal === 'SUPERVISOR') {
    return (
      <View style={styles.containerCentro}>
        <Text style={styles.titulo}>Acceso Innecesario</Text>
        <Text style={styles.texto}>
          Tu rol de {rolGlobal} no requiere el uso de lectura QR en terreno. Gestiona tus tareas
          desde la pestaña de Inicio.
        </Text>
      </View>
    );
  }

  const manejarEscaneo = async (codigo) => {
    if (!scaneando) return;
    setScaneando(false);
    setAviso(null);

    let resultado;
    try {
      resultado = await orquestarEscaneo(codigo, rolGlobal);
    } catch (_error) {
      resultado = {
        accion: 'alerta',
        titulo: 'No se pudo consultar el equipo',
        mensaje: 'Intenta de nuevo.',
      };
    }
    if (resultado.historial) setHistorialUI(resultado.historial);

    // Los avisos se muestran en la misma pantalla y el escáner queda libre de
    // inmediato. Con un Alert, el escáner solo se liberaba al tocar OK, y en
    // Android el Alert se pierde si se pide mientras se vuelve del lector del
    // sistema: la pantalla quedaba en "Consultando equipo…".
    switch (resultado.accion) {
      case 'alerta':
        setAviso({ titulo: resultado.titulo, mensaje: resultado.mensaje });
        setScaneando(true);
        break;
      case 'ir_a_incidencia':
        setActivoActual(resultado.codigoValido);
        setIdActivoActual(resultado.idActivo); // CAMBIO
        setPantallaActiva('incidencia');
        break;
      case 'ir_a_ficha_equipo':
        setFicha(resultado.activo);
        setActivoActual(resultado.codigoValido);
        setIdActivoActual(resultado.idActivo); // CAMBIO
        setPantallaActiva('ficha_equipo');
        break;
      case 'ir_a_busqueda':
        setAviso({
          titulo: 'Equipo no encontrado',
          mensaje: `No hay un equipo registrado con el código ${codigo}. Revisa la etiqueta o ingresa el código manualmente.`,
        });
        setScaneando(true);
        break;
    }
  };

  const escanearConLector = async () => {
    setAviso(null);
    suscripcionLector.current?.remove();
    suscripcionLector.current = CameraView.onModernBarcodeScanned(({ data }) => {
      suscripcionLector.current?.remove();
      suscripcionLector.current = null;
      if (Platform.OS === 'ios') CameraView.dismissScanner();
      manejarEscaneo(data);
    });

    try {
      await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    } catch (e) {
      suscripcionLector.current?.remove();
      suscripcionLector.current = null;
      // Cerrar el lector sin leer nada no es un error.
      const cancelado =
        e?.code === 'ERR_BARCODE_SCANNING_CANCELLED' || /cancel/i.test(e?.message ?? '');
      if (!cancelado) {
        setAviso({
          titulo: 'No se pudo leer el código',
          mensaje: e?.message ?? 'Intenta de nuevo.',
        });
      }
    }
  };

  // --- VISTA: NUEVA INCIDENCIA (REPORTANTE) ---
  // CAMBIO: reemplaza los botones simulados por el formulario con evidencias.
  if (pantallaActiva === 'incidencia') {
    return (
      <NuevaIncidenciaScreen
        idActivo={idActivoActual}
        codigoActivo={activoActual}
        onVolver={() => {
          setPantallaActiva('escaner');
          setScaneando(true);
        }}
        onEnviada={() => {
          setPantallaActiva('escaner');
          setScaneando(true);
          Alert.alert('Incidencia enviada', 'Tu reporte fue registrado.');
        }}
      />
    );
  }

  // --- VISTA: FICHA DE EQUIPO (TÉCNICO) ---
  if (pantallaActiva === 'ficha_equipo') {
    return (
      <PanelTecnico
        activo={ficha}
        volver={() => {
          setPantallaActiva('escaner');
          setScaneando(true);
        }}
      />
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
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: '#1976d2' }]}
          disabled={!busquedaManual.trim() || !scaneando}
          onPress={() => manejarEscaneo(busquedaManual.trim().toUpperCase())}
        >
          <Text style={styles.botonTexto}>BUSCAR</Text>
        </TouchableOpacity>
        <Aviso aviso={aviso} style={{ marginTop: 12 }} />
        <TouchableOpacity
          style={[styles.boton, { backgroundColor: '#757575', marginTop: 10 }]}
          onPress={() => {
            setAviso(null);
            setPantallaActiva('escaner');
            setScaneando(true);
          }}
        >
          <Text style={styles.botonTexto}>VOLVER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- VISTA: ESCÁNER QR ---
  // El permiso de cámara solo hace falta para la cámara en vivo: el lector del
  // sistema pide lo suyo.
  if (!lectorNativo) {
    if (!permisoCamara) return <View />;
    if (!permisoCamara.granted) {
      return (
        <View style={styles.containerCentro}>
          <Text style={styles.texto}>Permiso requerido para usar la cámara</Text>
          <TouchableOpacity
            style={[styles.boton, { backgroundColor: '#1976d2' }]}
            onPress={pedirPermisoCamara}
          >
            <Text style={styles.botonTexto}>OTORGAR</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.body}>
      <Text accessibilityRole="header" style={styles.heading}>
        Escanear equipo
      </Text>
      {lectorNativo ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.lector}
          onPress={escanearConLector}
          disabled={!scaneando}
        >
          <Ionicons name="scan-outline" size={48} color="#76E8DA" />
          <Text style={styles.lectorTitulo}>
            {scaneando ? 'Escanear código QR' : 'Consultando equipo…'}
          </Text>
          <Text style={styles.lectorTexto}>Abre la cámara y apunta al código del equipo</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.camera}>
          {enFoco && <CamaraQR activa={scaneando} onLeer={manejarEscaneo} />}
          <View pointerEvents="none" style={styles.frame} />
          <Text pointerEvents="none" style={styles.hint}>
            {scaneando ? 'Centra el QR dentro del marco' : 'Consultando equipo…'}
          </Text>
        </View>
      )}
      <Aviso aviso={aviso} />
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.manual}
        onPress={() => {
          setAviso(null);
          setPantallaActiva('busqueda');
        }}
      >
        <Ionicons name="keypad-outline" size={21} color="#174A73" />
        <Text style={styles.actionLabel}>Ingresar código manualmente</Text>
      </TouchableOpacity>
      {__DEV__ && (
        <View style={styles.samples}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => manejarEscaneo('UCT-INF-1024')}
            style={styles.sample}
          >
            <Text style={styles.link}>Simular lectura válida</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => manejarEscaneo('UCT-ABC-9999')}
            style={styles.sample}
          >
            <Text style={styles.link}>Simular lectura inválida</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.section}>Escaneos recientes</Text>
      {historialUI.length === 0 && <Text style={styles.empty}>Aún no hay escaneos.</Text>}
      {historialUI.map((codigo) => (
        <View key={codigo} style={styles.historyRow}>
          <Ionicons name="qr-code-outline" color="#486077" size={18} />
          <Text style={styles.actionLabel}>{codigo}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50 },
  containerCentro: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: { flexDirection: 'row', justifyContent: 'flex-start', width: '100%', marginBottom: 15 },
  usuario: { fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#444',
  },
  texto: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  boton: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
  },
  botonTexto: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  page: { flex: 1, backgroundColor: '#EFF3F7' },
  body: { padding: 18, gap: 14, paddingBottom: 30 },
  heading: { fontSize: 28, fontWeight: '700', color: '#173754' },
  camera: {
    aspectRatio: 1.15,
    width: '100%',
    maxHeight: 370,
    backgroundColor: '#112535',
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camaraError: { color: 'white', textAlign: 'center', padding: 16 },
  lector: {
    backgroundColor: '#112535',
    borderRadius: 22,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  lectorTitulo: { color: 'white', fontSize: 22, fontWeight: '700' },
  lectorTexto: { color: '#B8C7D6', fontSize: 15, textAlign: 'center' },
  aviso: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#FFF4E5',
    borderWidth: 1,
    borderColor: '#F5C27A',
    borderRadius: 12,
  },
  avisoCuerpo: { flex: 1, gap: 2 },
  avisoTitulo: { fontSize: 15, fontWeight: '700', color: '#7C2D12' },
  avisoTexto: { fontSize: 14, color: '#5B3410' },
  frame: { width: '51%', aspectRatio: 1, borderWidth: 3, borderColor: '#76E8DA', borderRadius: 18 },
  hint: {
    position: 'absolute',
    bottom: 12,
    color: 'white',
    backgroundColor: '#142738',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manual: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#CEDCE8',
  },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#183952', flexShrink: 1 },
  samples: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sample: { justifyContent: 'center', minHeight: 44 },
  link: { color: '#18539B', fontWeight: '600' },
  section: { fontSize: 19, fontWeight: '700', color: '#173754' },
  empty: { color: '#516777' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});
