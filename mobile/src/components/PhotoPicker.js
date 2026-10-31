import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import EmptyState from './EmptyState';

const COLUMNAS = 3;
const ESPACIO = 8;

/**
 * Selector visual de fotos de evidencia (RF4).
 *
 * Solo maneja la presentación: recibe URIs ya capturadas (por cámara o
 * galería, lógica de Enzo) y permite previsualizarlas en grid y quitarlas.
 * No tiene lógica propia de cámara ni de selección desde galería.
 *
 * Props:
 * - fotos: string[] — URIs de las fotos ya agregadas
 * - onAdd: () => void — se llama al tocar el cuadro de "agregar".
 *     Quien use este componente decide qué pasa al tocar (abrir cámara,
 *     galería, o — como en el placeholder de prueba — generar una URI simulada).
 * - onRemove: (uri: string) => void — se llama al tocar la X de una miniatura
 * - maxFotos: number — límite de fotos (default 5, según el contrato)
 * - disabled: boolean — deshabilita agregar/quitar (ej. mientras se envía el formulario)
 * - label: string — etiqueta mostrada arriba (default 'FOTOS')
 */
export default function PhotoPicker({
  fotos = [],
  onAdd,
  onRemove,
  maxFotos = 5,
  disabled = false,
  label = 'FOTOS',
}) {
  const quedanCupos = fotos.length < maxFotos;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>
        {label} ({fotos.length}/{maxFotos})
      </Text>

      {fotos.length === 0 ? (
        <View style={styles.vacioContenedor}>
          <EmptyState
            icon={
              <View style={styles.icono}>
                <Text style={styles.iconoTexto}>+</Text>
              </View>
            }
            title="Sin fotos agregadas"
            description="Agrega al menos una foto como evidencia de la incidencia"
            actionLabel={disabled ? undefined : 'Agregar foto'}
            onAction={disabled ? undefined : onAdd}
          />
        </View>
      ) : (
        <View style={styles.grid}>
          {fotos.map((uri) => (
            <View key={uri} style={styles.celda}>
              <Image source={{ uri }} style={styles.miniatura} />
              {!disabled && (
                <Pressable
                  onPress={() => onRemove?.(uri)}
                  style={styles.botonQuitar}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar foto"
                >
                  <Text style={styles.botonQuitarTexto}>×</Text>
                </Pressable>
              )}
            </View>
          ))}

          {quedanCupos && (
            <Pressable
              onPress={onAdd}
              disabled={disabled}
              style={({ pressed }) => [
                styles.celda,
                styles.celdaAgregar,
                pressed && !disabled && styles.presionado,
                disabled && styles.deshabilitado,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Agregar foto de evidencia"
            >
              <Text style={styles.masTexto}>+</Text>
            </Pressable>
          )}
        </View>
      )}

      {!quedanCupos && (
        <Text style={styles.limiteTexto}>Alcanzaste el máximo de {maxFotos} fotos</Text>
      )}
    </View>
  );
}

const TAMANO_CELDA = `${100 / COLUMNAS}%`;

const styles = StyleSheet.create({
  contenedor: { marginBottom: 20 },
  etiqueta: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text2,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -ESPACIO / 2,
  },
  celda: {
    width: TAMANO_CELDA,
    aspectRatio: 1,
    padding: ESPACIO / 2,
  },
  miniatura: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  botonQuitar: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonQuitarTexto: {
    color: colors.white,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    lineHeight: typography.size.md,
    marginTop: -1,
  },
  celdaAgregar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  masTexto: {
    fontSize: typography.size.lg,
    color: colors.brand,
    fontWeight: typography.weight.bold,
  },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.5 },
  limiteTexto: {
    fontSize: typography.size.xs,
    color: colors.text3,
    marginTop: 6,
  },
  vacioContenedor: {
    minHeight: 180,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: {
    fontSize: typography.size.lg,
    color: colors.brand,
    fontWeight: typography.weight.bold,
  },
});