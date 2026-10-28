import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

// Prioridades del contrato OpenAPI (RF3). Mismo orden y valores que
// PRIORIDADES en state/incidentReducer, para que no se desincronicen.
const PRIORIDADES = ['baja', 'media', 'alta'];
const ETIQUETAS_PRIORIDAD = { baja: 'Baja', media: 'Media', alta: 'Alta' };

// Un color por prioridad (estilo semáforo), según el diseño de Figma:
// Baja = verde, Media = naranja, Alta = rojo.
const COLOR_PRIORIDAD = {
  baja: { borde: colors.success, fondo: colors.successBg, texto: colors.success },
  media: { borde: colors.warning, fondo: colors.warningBg, texto: colors.warning },
  alta: { borde: colors.danger, fondo: colors.dangerBg, texto: colors.danger },
};


export default function PrioritySelector({
  value,
  onChange,
  label = 'PRIORIDAD',
  error,
  disabled = false,
}) {
  return (
    <View style={styles.contenedor}>
      {label ? <Text style={styles.etiqueta}>{label}</Text> : null}

      <View style={styles.fila} accessibilityRole="radiogroup">
        {PRIORIDADES.map((prioridad) => {
          const elegida = value === prioridad;
          const color = COLOR_PRIORIDAD[prioridad];
          return (
            <Pressable
              key={prioridad}
              onPress={() => onChange?.(prioridad)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.chip,
                elegida && { borderColor: color.borde, backgroundColor: color.fondo },
                disabled && styles.chipDeshabilitado,
                pressed && !disabled && styles.chipPresionado,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegida, disabled }}
              accessibilityLabel={`Prioridad ${ETIQUETAS_PRIORIDAD[prioridad]}`}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.chipTexto,
                  elegida && { color: color.texto, fontWeight: typography.weight.semibold },
                  disabled && styles.chipTextoDeshabilitado,
                ]}
              >
                {ETIQUETAS_PRIORIDAD[prioridad]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 20 },
  etiqueta: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text2,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  fila: { flexDirection: 'row', gap: 8 },
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
  chipPresionado: {
    opacity: 0.7,
  },
  chipDeshabilitado: {
    opacity: 0.5,
  },
  chipTexto: {
    fontSize: typography.size.sm,
    color: colors.text2,
  },
  chipTextoDeshabilitado: {
    color: colors.text3,
  },
  error: {
    fontSize: typography.size.xs,
    color: colors.danger,
    marginTop: 6,
  },
});