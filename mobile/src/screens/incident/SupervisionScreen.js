import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useIncident } from '../../context/IncidentContext';
import { useAbrirSeguimiento } from '../../navigation/useAbrirSeguimiento';
import { ESTADOS } from '../../services/incidentService';

export default function SupervisionScreen() {
  const { user } = useAuth();
  const { tickets, estadoTickets, errorTickets, loadTickets } = useIncident();
  const abrir = useAbrirSeguimiento();
  const [vista, elegir] = useState('asignar');
  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [loadTickets])
  );
  const nombre = [user?.nombre, user?.apellido].filter(Boolean).join(' ');
  const iniciales = [user?.nombre?.[0], user?.apellido?.[0]].filter(Boolean).join('');
  const pendientes = tickets.filter((t) => t.estado?.id_estado === ESTADOS.PENDIENTE_REVISION);
  const asignables = tickets.filter((t) =>
    [ESTADOS.PENDIENTE_REVISION, ESTADOS.CLASIFICADA].includes(t.estado?.id_estado)
  );
  const revisar = tickets.filter((t) => t.estado?.id_estado === ESTADOS.RESUELTA);
  const listo = estadoTickets === 'listo';
  const seleccion = vista === 'asignar' ? asignables : revisar;
  return (
    <ScrollView style={s.fondo} contentContainerStyle={s.pagina}>
      <View style={s.header}>
        <View style={s.expandir}>
          <Text style={s.h1}>Supervisión</Text>
          {nombre ? <Text style={s.secundario}>{nombre}</Text> : null}
        </View>
        {iniciales ? <Text style={s.avatar}>{iniciales}</Text> : null}
      </View>
      <View style={s.resumen}>
        {[
          [pendientes, 'Sin clasificar', '#986000'],
          [asignables, 'Por asignar', '#BD3636'],
          [revisar, 'Por verificar', '#235AC3'],
        ].map(([lista, label, color]) => (
          <View key={label} style={s.metrica}>
            <Text style={[s.valor, { color }]}>{listo ? lista.length : '—'}</Text>
            <Text style={s.leyenda}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={s.seccion}>Acciones rápidas</Text>
      <View style={s.fila}>
        {[
          ['asignar', 'person-add-outline', 'Asignar técnico'],
          ['verificar', 'checkbox-outline', 'Verificar soluciones'],
        ].map(([id, icono, label]) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: vista === id }}
            onPress={() => elegir(id)}
            style={[s.accion, vista === id && s.activa]}
          >
            <Ionicons name={icono} size={23} color={vista === id ? '#194DCA' : '#486077'} />
            <Text style={s.titulo}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.seccion}>
        {vista === 'asignar' ? 'Tickets por asignar' : 'Soluciones por verificar'}
      </Text>
      {errorTickets ? (
        <Pressable accessibilityRole="button" onPress={() => loadTickets()} style={s.tarjeta}>
          <Text>{errorTickets.mensaje}</Text>
          <Text style={s.enlace}>Reintentar</Text>
        </Pressable>
      ) : !listo ? (
        <ActivityIndicator accessibilityLabel="Cargando tickets" />
      ) : seleccion.length === 0 ? (
        <Text style={s.secundario}>No hay tickets en esta lista.</Text>
      ) : (
        seleccion.map((t) => (
          <Pressable
            key={t.id_incidencia}
            accessibilityRole="button"
            onPress={() => abrir(t)}
            style={s.tarjeta}
          >
            <Text style={s.titulo}>{t.titulo}</Text>
            <View style={s.fila}>
              <Text style={s.estado}>{t.estado.nombre_estado}</Text>
              {t.prioridad && <Text style={s.secundario}>Prioridad {t.prioridad}</Text>}
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#F1F5F9' },
  pagina: { padding: 16, gap: 12, paddingBottom: 32 },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  expandir: { flex: 1 },
  h1: { fontSize: 24, fontWeight: '700', color: '#132743' },
  avatar: {
    backgroundColor: '#EDE8FF',
    color: '#6942C4',
    padding: 10,
    borderRadius: 24,
    fontWeight: '700',
  },
  resumen: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
  },
  metrica: { flex: 1, alignItems: 'center', gap: 4 },
  valor: { fontWeight: '700', fontSize: 22 },
  leyenda: { fontSize: 12, color: '#4F6074' },
  secundario: { color: '#526378', fontSize: 14 },
  seccion: { fontSize: 15, fontWeight: '700', color: '#394F68', marginTop: 8 },
  fila: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  accion: {
    flex: 1,
    minHeight: 85,
    gap: 8,
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 12,
  },
  activa: { backgroundColor: '#EFF4FF', borderColor: '#779DEC' },
  titulo: { fontWeight: '700', fontSize: 15, color: '#142C48' },
  tarjeta: {
    gap: 8,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  estado: {
    backgroundColor: '#EEF2FC',
    color: '#294776',
    padding: 5,
    borderRadius: 5,
    fontSize: 12,
  },
  enlace: { color: '#194DCA', fontWeight: '600' },
});
