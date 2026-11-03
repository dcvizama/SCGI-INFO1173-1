// src/screens/incident/NuevaIncidenciaScreen.jsx
// Pantalla "Nueva incidencia": título, descripción y evidencia fotográfica.
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { colors } from '../../theme/colors';
import { useIncidentCamera } from './camera/useIncidentCamera';
import { seleccionarFotosGaleria } from '../../features/incident/photoGalleryService';
import {
  CLOUDINARY,
  crearEstadoEnvio,
  enviarIncidencia,
} from '../../features/incident/incidentUploadService';

const MAX_FOTOS = 5;

export default function NuevaIncidenciaScreen({ idActivo, codigoActivo, onVolver, onEnviada }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState([]);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [incidenciaCreada, setIncidenciaCreada] = useState(false);

  // Guarda lo ya enviado para que un reintento no duplique nada.
  const estadoRef = useRef(crearEstadoEnvio());
  const camara = useIncidentCamera();

  const agregarFotos = (uris) => {
    setFotos((actuales) => [...actuales, ...uris].slice(0, MAX_FOTOS));
  };

  const quitarFoto = (uri) => {
    setFotos((actuales) => actuales.filter((foto) => foto !== uri));
  };

  const capturar = async () => {
    try {
      const uri = await camara.tomarFoto();
      if (uri) agregarFotos([uri]);
      setCamaraAbierta(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const abrirGaleria = async () => {
    try {
      const uris = await seleccionarFotosGaleria({ limite: MAX_FOTOS - fotos.length });
      agregarFotos(uris);
    } catch (e) {
      setError(e.message);
    }
  };

  const elegirOrigen = () => {
    if (fotos.length >= MAX_FOTOS) return;
    Alert.alert('Adjuntar fotografía', 'Elige el origen de la imagen', [
      { text: 'Tomar foto', onPress: () => setCamaraAbierta(true) },
      { text: 'Elegir de galería', onPress: abrirGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const enviar = async () => {
    if (enviando) return;

    if (!titulo.trim() || !descripcion.trim()) {
      setError('Completa el título y la descripción.');
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await enviarIncidencia({
        idActivo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fotosUris: fotos,
        cloudinary: CLOUDINARY,
        estado: estadoRef.current,
      });
      onEnviada?.();
    } catch (e) {
      setError(e.mensaje ?? e.message ?? 'No se pudo enviar la incidencia.');
      // Si la incidencia ya existe, bloqueamos los campos: el reintento solo envía lo pendiente.
      setIncidenciaCreada(Boolean(estadoRef.current.idIncidencia));
    } finally {
      setEnviando(false);
    }
  };

  // --- Modo cámara a pantalla completa ---
  if (camaraAbierta) {
    if (!camara.permisoConcedido) {
      return (
        <View style={styles.centro}>
          <Text style={styles.texto}>Necesitamos permiso para usar la cámara.</Text>
          <Boton texto="Otorgar permiso" onPress={camara.pedirPermiso} />
          <Boton texto="Cancelar" secundario onPress={() => setCamaraAbierta(false)} />
        </View>
      );
    }

    return (
      <View style={styles.contenedorCamara}>
        <CameraView ref={camara.cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
        <View style={styles.barraCamara}>
          <Boton
            texto={camara.capturando ? 'Capturando…' : 'Capturar'}
            onPress={capturar}
            deshabilitado={camara.capturando}
          />
          <Boton texto="Cancelar" secundario onPress={() => setCamaraAbierta(false)} />
        </View>
      </View>
    );
  }

  // --- Formulario ---
  const textoBoton = enviando ? 'Enviando…' : error ? 'Reintentar envío' : 'Enviar incidencia';

  return (
    <View style={styles.pantalla}>
      <View style={styles.cabecera}>
        <TouchableOpacity onPress={onVolver} style={styles.volver}>
          <Text style={styles.volverTexto}>‹</Text>
        </TouchableOpacity>
        <View style={styles.cabeceraTexto}>
          <Text style={styles.titulo}>Nueva incidencia</Text>
          <Text style={styles.subtitulo}>Activo: {codigoActivo}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Campo etiqueta="TÍTULO DE LA INCIDENCIA">
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            editable={!incidenciaCreada && !enviando}
            placeholder="Ej. Luminaria exterior apagada"
            placeholderTextColor={colors.text2}
          />
        </Campo>

        <Campo etiqueta="DESCRIPCIÓN">
          <TextInput
            style={[styles.input, styles.areaTexto]}
            value={descripcion}
            onChangeText={setDescripcion}
            editable={!incidenciaCreada && !enviando}
            multiline
            placeholder="Describe el problema"
            placeholderTextColor={colors.text2}
          />
        </Campo>

        <Campo etiqueta="EVIDENCIA FOTOGRÁFICA">
          <TouchableOpacity
            style={[styles.zonaAdjuntar, fotos.length >= MAX_FOTOS && styles.botonDeshabilitado]}
            onPress={elegirOrigen}
            disabled={fotos.length >= MAX_FOTOS || enviando}
          >
            <Text style={styles.zonaTexto}>+ Adjuntar fotografía del daño</Text>
          </TouchableOpacity>

          <View style={styles.filaFotos}>
            {fotos.map((uri) => (
              <View key={uri} style={styles.miniaturaWrap}>
                <Image source={{ uri }} style={styles.miniatura} />
                {!incidenciaCreada && !enviando && (
                  <TouchableOpacity style={styles.quitar} onPress={() => quitarFoto(uri)}>
                    <Text style={styles.quitarTexto}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <Text style={styles.contador}>
            {fotos.length} de {MAX_FOTOS} fotos
          </Text>
        </Campo>

        {error && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitulo}>No se pudo enviar</Text>
            <Text style={styles.bannerTexto}>{error}</Text>
          </View>
        )}

        <Boton texto={textoBoton} onPress={enviar} deshabilitado={enviando} />
      </ScrollView>
    </View>
  );
}

function Campo({ etiqueta, children }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      {children}
    </View>
  );
}

function Boton({ texto, onPress, deshabilitado, secundario }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={deshabilitado}
      style={[
        styles.boton,
        secundario && styles.botonSecundario,
        deshabilitado && styles.botonDeshabilitado,
      ]}
    >
      <Text style={[styles.botonTexto, secundario && styles.botonTextoSecundario]}>{texto}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
  },
  volver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volverTexto: { fontSize: 22, color: colors.text2, marginTop: -2 },
  cabeceraTexto: { flex: 1 },
  titulo: { fontSize: 20, fontWeight: '700', color: colors.text1 },
  subtitulo: { fontSize: 12, color: colors.text2, marginTop: 2 },
  contenido: { padding: 20, paddingBottom: 40 },
  campo: { marginBottom: 16 },
  etiqueta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text2,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text1,
  },
  areaTexto: { minHeight: 100, paddingTop: 13, textAlignVertical: 'top' },
  zonaAdjuntar: {
    height: 60,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderDark,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonaTexto: { fontSize: 13, color: colors.text2 },
  filaFotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  miniaturaWrap: { position: 'relative' },
  miniatura: { width: 72, height: 72, borderRadius: 8 },
  quitar: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitarTexto: { color: colors.white, fontSize: 14, fontWeight: '700', marginTop: -1 },
  contador: { fontSize: 12, color: colors.text2, marginTop: 6 },
  banner: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  bannerTitulo: { fontSize: 13, fontWeight: '600', color: colors.dangerText, marginBottom: 2 },
  bannerTexto: { fontSize: 12, color: colors.danger, lineHeight: 18 },
  boton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botonSecundario: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.brand,
    marginTop: 10,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: colors.white, fontSize: 15, fontWeight: '600' },
  botonTextoSecundario: { color: colors.brand },
  contenedorCamara: { flex: 1, backgroundColor: '#000' },
  barraCamara: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  texto: { fontSize: 15, color: colors.text2, textAlign: 'center', marginBottom: 16 },
});