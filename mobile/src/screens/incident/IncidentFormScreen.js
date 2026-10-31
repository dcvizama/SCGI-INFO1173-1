import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import TextField from '../../components/TextField';
import PrioritySelector from '../../components/PrioritySelector';
import PhotoPicker from '../../components/PhotoPicker';

import { useIncident } from '../../context/IncidentContext';
import { useSalidaDelReporte } from '../../navigation/useSalidaDelReporte';
import { ESTADOS_ENVIO } from '../../state/incidentReducer';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const ETIQUETAS_PRIORIDAD = { baja: 'Baja', media: 'Media', alta: 'Alta' };

/**
 * Pantalla real de reporte de incidencia (RF3, RF4).
 * Tarea 4 — Maquetado: título, descripción y activo asociado (prellenado).
 * Las validaciones de campos se agregan en la Tarea 5.
 */
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

  // El activo llega por params al entrar desde la ficha (T4 de Patricio);
  // se usa de respaldo mientras la pantalla se cierra después de limpiar el estado.
  const activo = borrador.activo ?? route?.params?.activo;

  // Vista de confirmación tras crear la incidencia (versión base; se detalla en Tarea 6)
  if (estadoEnvio === ESTADOS_ENVIO.EXITO && incidenciaCreada) {
    return (
      <View style={[styles.flex, styles.container, margenInferior]}>
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

        <PrioritySelector
          value={borrador.prioridad}
          onChange={(prioridad) => setField('prioridad', prioridad)}
          disabled={enviando}
        />

        <PhotoPicker
          fotos={borrador.fotos}
          onAdd={() => addPhoto(`file:///simulada/foto-${Date.now()}.jpg`)}
          onRemove={removePhoto}
          maxFotos={borrador.fotos.length + fotosRestantes}
          disabled={enviando}
        />

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
    marginBottom: 20,
  },
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