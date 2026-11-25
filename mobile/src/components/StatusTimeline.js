import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StatusBadge from './StatusBadge';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const MAPA_ESTADO_BADGE = {
  1: 'pendiente',
  2: 'clasificada',
  3: 'asignada',
  4: 'diagnostico',
  5: 'reparacion',
  6: 'resuelta',
  7: 'verificada',
  8: 'cerrada',
};

function resolverClaveEstado(estado) {
  if (!estado) return 'pendiente';
  if (estado.id_estado && MAPA_ESTADO_BADGE[estado.id_estado]) {
    return MAPA_ESTADO_BADGE[estado.id_estado];
  }
  const nombre = (estado.nombre_estado ?? String(estado)).toLowerCase();
  if (nombre.includes('pendiente')) return 'pendiente';
  if (nombre.includes('clasificada')) return 'clasificada';
  if (nombre.includes('asignada')) return 'asignada';
  if (nombre.includes('diagn')) return 'diagnostico';
  if (nombre.includes('reparaci')) return 'reparacion';
  if (nombre.includes('resuelta')) return 'resuelta';
  if (nombre.includes('verificada')) return 'verificada';
  if (nombre.includes('cerrada')) return 'cerrada';
  if (nombre.includes('rechazada')) return 'rechazada';
  return nombre;
}

function formatearFecha(isoString) {
  if (!isoString) return '';
  const fecha = new Date(isoString);
  if (Number.isNaN(fecha.getTime())) return isoString;

  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');

  return `${dia}/${mes}/${anio} · ${horas}:${minutos}`;
}

export default function StatusTimeline({ historial = [] }) {
  if (!historial || historial.length === 0) {
    return (
      <Text style={styles.vacio}>Aún no existen movimientos registrados para este ticket.</Text>
    );
  }

  return (
    <View style={styles.container}>
      {historial.map((item, index) => {
        const esUltimo = index === historial.length - 1;
        const claveBadge = resolverClaveEstado(item.estado);
        const autor = item.usuario_cambio
          ? `${item.usuario_cambio.nombre ?? ''} ${item.usuario_cambio.apellido ?? ''}`.trim()
          : null;

        return (
          <View key={item.id_historial ?? String(index)} style={styles.fila}>
            <View style={styles.columnaIndicador}>
              <View style={[styles.punto, esUltimo && styles.puntoActivo]} />
              {!esUltimo && <View style={styles.linea} />}
            </View>

            <View style={[styles.contenido, !esUltimo && styles.contenidoConMargen]}>
              <View style={styles.encabezado}>
                <StatusBadge status={claveBadge} small />
                <Text style={styles.fecha}>{formatearFecha(item.fecha_creacion)}</Text>
              </View>

              {autor ? <Text style={styles.autor}>Por {autor}</Text> : null}

              {item.comentario ? (
                <View style={styles.comentarioBox}>
                  <Text style={styles.comentarioTexto}>{item.comentario}</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  vacio: {
    fontSize: typography.size.sm,
    color: colors.text3,
    fontStyle: 'italic',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  columnaIndicador: {
    width: 24,
    alignItems: 'center',
  },
  punto: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: colors.white,
    marginTop: 4,
  },
  puntoActivo: {
    backgroundColor: colors.primary ?? '#1D4ED8',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
  },
  linea: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  contenido: {
    flex: 1,
    paddingLeft: 10,
  },
  contenidoConMargen: {
    paddingBottom: 18,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  fecha: {
    fontSize: typography.size.xs,
    color: colors.text3,
  },
  autor: {
    fontSize: typography.size.xs,
    color: colors.text2,
    marginTop: 4,
  },
  comentarioBox: {
    marginTop: 6,
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comentarioTexto: {
    fontSize: typography.size.sm,
    color: colors.text1,
    lineHeight: 18,
  },
});