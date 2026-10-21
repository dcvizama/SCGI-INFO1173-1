import {
  Alert,
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
import TextField from '../../components/TextField';
import { useIncident } from '../../context/IncidentContext';
import { PRIORIDADES } from '../../state/incidentReducer';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// TEMPORAL: se reemplaza por screens/incident/IncidentFormScreen cuando Débora lo entregue.
// Solo sirve para probar en el teléfono el estado de IncidentContext; el diseño,
// las validaciones y el selector de prioridad definitivos son tareas de Débora.

const ETIQUETAS_PRIORIDAD = { baja: 'Baja', media: 'Media', alta: 'Alta' };

export default function IncidentFormScreen() {
  const { borrador, setField, createIncident, incidenciaCreada, puedeEnviar } = useIncident();
  const { activo } = borrador;

  async function enviar() {
    try {
      await createIncident();
    } catch (error) {
      Alert.alert('No se pudo crear la incidencia', error.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.aviso}>Placeholder · pantalla definitiva a cargo de Débora</Text>

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

        {incidenciaCreada ? (
          <Text style={styles.creada}>
            Incidencia creada: {incidenciaCreada.id_incidencia} (
            {incidenciaCreada.estado.nombre_estado})
          </Text>
        ) : null}

        <View style={styles.acciones}>
          <Button label="Enviar reporte" onPress={enviar} disabled={!puedeEnviar} />
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
  creada: { fontSize: typography.size.sm, color: colors.success, marginBottom: 12 },
  acciones: { marginTop: 'auto', gap: 12 },
});
