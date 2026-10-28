import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import TextField from '../../components/TextField';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIncident } from '../../context/IncidentContext';
import { useSalidaDelReporte } from '../useSalidaDelReporte';
import { ESTADOS_ENVIO, PRIORIDADES } from '../../state/incidentReducer';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// TEMPORAL: se reemplaza por screens/incident/IncidentFormScreen cuando exista.
// Solo sirve para probar en el teléfono el estado de IncidentContext; el diseño,
// las validaciones y el selector de prioridad definitivos van en la pantalla real.

const ETIQUETAS_PRIORIDAD = { baja: 'Baja', media: 'Media', alta: 'Alta' };

export default function IncidentFormScreen({ route }) {
  const {
    borrador,
    setField,
    addPhoto,
    removePhoto,
    fotosRestantes,
    createIncident,
    estadoEnvio,
    enviando,
    error,
    incidenciaCreada,
    puedeEnviar,
  } = useIncident();
  const navigation = useNavigation();
  const { cancelar } = useSalidaDelReporte();
  // Android dibuja la app detrás de la barra de navegación (edge-to-edge):
  // sin este margen los botones de abajo quedan tapados.
  const insets = useSafeAreaInsets();
  const margenInferior = { paddingBottom: 20 + insets.bottom };
  // El activo llega por params (T4); se usa de respaldo mientras la pantalla
  // se cierra después de limpiar el estado.
  const activo = borrador.activo ?? route?.params?.activo;

  if (estadoEnvio === ESTADOS_ENVIO.EXITO && incidenciaCreada) {
    return (
      <View style={[styles.flex, styles.container, margenInferior]}>
        <Text style={styles.aviso}>Placeholder</Text>
        <Card>
          <Text style={styles.exitoTitulo}>Incidencia registrada</Text>
          <StatusBadge status={incidenciaCreada.estado.nombre_estado.toLowerCase()} />
          <Text style={styles.exitoDato}>{incidenciaCreada.titulo}</Text>
          <Text style={styles.exitoDetalle}>
            Prioridad {ETIQUETAS_PRIORIDAD[incidenciaCreada.prioridad] ?? '—'} ·{' '}
            {incidenciaCreada.evidencias?.length ?? 0} foto(s)
          </Text>
          <Text style={styles.exitoDetalle}>N° {incidenciaCreada.id_incidencia}</Text>
        </Card>
        <View style={styles.acciones}>
          <Button label="Volver a la ficha" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, margenInferior]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.aviso}>Placeholder</Text>

        <Card style={styles.activo}>
          <Text style={styles.etiqueta}>ACTIVO</Text>
          {activo ? (
            <>
              <Text style={styles.activoNombre}>{activo.nombre}</Text>
              <Text style={styles.activoCodigo}>{activo.codigo_qr}</Text>
            </>
          ) : (
            <Text style={styles.activoVacio}>Sin activo seleccionado</Text>
          )}
        </Card>

        <TextField
          label="TÍTULO"
          value={borrador.titulo}
          onChangeText={(texto) => setField('titulo', texto)}
          placeholder="Ej: El proyector no enciende"
          autoCapitalize="sentences"
        />

        <Text style={styles.etiqueta}>DESCRIPCIÓN</Text>
        <TextInput
          value={borrador.descripcion}
          onChangeText={(texto) => setField('descripcion', texto)}
          placeholder="Describe la falla"
          placeholderTextColor={colors.text3}
          multiline
          style={styles.descripcion}
        />

        <Text style={styles.etiqueta}>PRIORIDAD</Text>
        <View style={styles.prioridades}>
          {PRIORIDADES.map((prioridad) => {
            const elegida = borrador.prioridad === prioridad;
            return (
              <Pressable
                key={prioridad}
                onPress={() => setField('prioridad', prioridad)}
                style={[styles.chip, elegida && styles.chipElegido]}
                accessibilityRole="radio"
                accessibilityState={{ selected: elegida }}
              >
                <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>
                  {ETIQUETAS_PRIORIDAD[prioridad]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiqueta}>
          FOTOS ({borrador.fotos.length}/{borrador.fotos.length + fotosRestantes})
        </Text>
        {borrador.fotos.map((uri) => (
          <View key={uri} style={styles.foto}>
            <Text style={styles.fotoNombre} numberOfLines={1}>
              {uri.split('/').pop()}
            </Text>
            <Pressable onPress={() => removePhoto(uri)} hitSlop={10}>
              <Text style={styles.fotoQuitar}>Quitar</Text>
            </Pressable>
          </View>
        ))}
        <View style={styles.agregarFoto}>
          {/* Simula la URI que entregará la cámara. */}
          <Button
            label="Agregar foto de prueba"
            variant="outline"
            disabled={fotosRestantes === 0}
            onPress={() => addPhoto(`file:///simulada/foto-${Date.now()}.jpg`)}
          />
        </View>

        {error ? (
          <Card style={styles.error}>
            <Text style={styles.errorTexto}>{error.mensaje}</Text>
          </Card>
        ) : null}

        <View style={styles.acciones}>
          <Button
            label={estadoEnvio === ESTADOS_ENVIO.ERROR ? 'Reintentar envío' : 'Enviar reporte'}
            onPress={createIncident}
            disabled={!puedeEnviar}
            loading={enviando}
          />
          <Button label="Cancelar" variant="outline" onPress={cancelar} disabled={enviando} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 20 },
  aviso: {
    fontSize: typography.size.xs,
    color: colors.warning,
    backgroundColor: colors.warningBg,
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  activo: { marginBottom: 20 },
  etiqueta: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text2,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  activoNombre: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text1,
  },
  activoCodigo: { fontSize: typography.size.xs, color: colors.text3, marginTop: 2 },
  activoVacio: { fontSize: typography.size.sm, color: colors.text3 },
  descripcion: {
    minHeight: 110,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 14,
    fontSize: typography.size.md,
    color: colors.text1,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  prioridades: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipElegido: { borderColor: colors.brand, backgroundColor: colors.brandBg },
  chipTexto: { fontSize: typography.size.sm, color: colors.text2 },
  chipTextoElegido: { color: colors.brand, fontWeight: typography.weight.semibold },
  foto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 44,
    marginBottom: 8,
  },
  fotoNombre: { flex: 1, fontSize: typography.size.sm, color: colors.text1, marginRight: 12 },
  fotoQuitar: { fontSize: typography.size.sm, color: colors.danger },
  agregarFoto: { marginBottom: 20 },
  error: { backgroundColor: colors.dangerBg, borderColor: colors.danger, marginBottom: 16 },
  errorTexto: { fontSize: typography.size.sm, color: colors.danger },
  exitoTitulo: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.success,
    marginBottom: 10,
  },
  exitoDato: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text1,
    marginTop: 12,
  },
  exitoDetalle: { fontSize: typography.size.sm, color: colors.text2, marginTop: 4 },
  acciones: { marginTop: 'auto', paddingTop: 12, gap: 12 },
});
