import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { useVerHistorialFallas } from '../../navigation/useVerHistorialFallas';
import { useReportarIncidencia } from '../../navigation/useReportarIncidencia';

function Accion({ icono, titulo, detalle, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.fila, pressed && s.presionada]}
    >
      <View style={s.icono}>
        <Ionicons name={icono} size={23} color={colors.brandDark} />
      </View>
      <View style={s.contenido}>
        <Text style={s.titulo}>{titulo}</Text>
        <Text style={s.detalle}>{detalle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={colors.text2} />
    </Pressable>
  );
}

export default function PanelTecnico({ activo, volver }) {
  const navigation = useNavigation();
  const historial = useVerHistorialFallas();
  const reportar = useReportarIncidencia();
  const ubicacion = [
    activo?.ubicacion?.edificio?.nombre_edificio,
    activo?.ubicacion?.nombre_espacio,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <ScrollView style={s.pagina} contentContainerStyle={s.margen}>
      <View style={s.cabecera}>
        <Ionicons
          name={activo ? 'hardware-chip-outline' : 'construct-outline'}
          color="white"
          size={32}
        />
        <Text accessibilityRole="header" style={s.encabezado}>
          {activo ? activo.nombre || activo.codigo_qr : 'Panel técnico'}
        </Text>
        {activo && (
          <Text selectable style={s.codigo}>
            {activo.codigo_qr}
          </Text>
        )}
        {ubicacion ? <Text style={s.codigo}>{ubicacion}</Text> : null}
      </View>
      {activo && (
        <View style={s.datos}>
          {[
            ['Estado', activo.estado?.nombre_estado],
            ['Categoría', activo.categoria?.nombre_categoria],
            ['Marca y modelo', [activo.marca, activo.modelo].filter(Boolean).join(' ')],
            ['Serie', activo.numero_serie],
          ]
            .filter(([, valor]) => valor)
            .map(([campo, valor]) => (
              <View key={campo} style={s.dato}>
                <Text style={s.detalle}>{campo}</Text>
                <Text selectable style={s.titulo}>
                  {valor}
                </Text>
              </View>
            ))}
        </View>
      )}
      {activo && (
        <Accion
          icono="time-outline"
          titulo="Historial de fallas"
          detalle="Consultar incidencias de este equipo"
          onPress={() => historial(activo)}
        />
      )}
      {activo && (
        <Accion
          icono="create-outline"
          titulo="Reportar incidencia"
          detalle="Registrar una falla de este equipo"
          onPress={() => reportar(activo)}
        />
      )}
      <Accion
        icono="qr-code-outline"
        titulo={activo ? 'Escanear otro equipo' : 'Escanear equipo'}
        detalle="Consultar la ficha mediante su código QR"
        onPress={volver ?? (() => navigation.navigate('Escanear'))}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: colors.bg },
  margen: { padding: 18, gap: 12, paddingBottom: 32 },
  cabecera: { padding: 24, borderRadius: 20, backgroundColor: colors.brandDark, gap: 8 },
  encabezado: { fontSize: 29, fontWeight: '700', color: colors.white },
  codigo: { fontSize: 15, color: colors.white },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icono: { padding: 10, borderRadius: 12, backgroundColor: colors.brandBg },
  contenido: { flex: 1, gap: 4 },
  titulo: { fontSize: 16, fontWeight: '600', color: colors.text1 },
  detalle: { fontSize: 14, color: colors.text2 },
  presionada: { backgroundColor: colors.brandBg },
  datos: { backgroundColor: colors.white, padding: 16, borderRadius: 14, gap: 12 },
  dato: { gap: 2 },
});
