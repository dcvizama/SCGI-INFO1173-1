import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import TechnicianSelector from '../../components/TechnicianSelector';
import { useAuth } from '../../context/AuthContext';
import { useIncident } from '../../context/IncidentContext';
import { normalizarRol } from '../../navigation/permissions';
import {
  accionesDisponibles,
  COMENTARIO_MAX,
  ESTADOS,
  listarTransiciones,
} from '../../services/incidentService';

export default function AccionesTicket({ ticket }) {
  const { user } = useAuth();
  const {
    tecnicos,
    errorTecnicos,
    estadoTecnicos,
    loadTechnicians,
    assignIncident,
    updateIncidentStatus,
    procesandoAccion,
    errorAccion,
    refreshTicket,
  } = useIncident();
  const estado = ticket.estado?.id_estado;
  const rol = normalizarRol(user?.rol?.nombre_rol ?? user?.rol)?.toUpperCase();
  const [comentario, setComentario] = useState('');
  const [idTecnico, seleccionar] = useState(null);
  const [intento, reintentar] = useState(0);
  // Resultado de la última consulta de transiciones junto con la clave que la
  // pidió: si cambia el estado o el rol, o se reintenta, la anterior deja de valer.
  const clave = `${estado}|${rol}|${intento}`;
  const [consulta, setConsulta] = useState(null);
  useEffect(() => {
    let activo = true;
    listarTransiciones(estado)
      .then((lista) => {
        if (activo) {
          setConsulta({ clave, opciones: accionesDisponibles(lista, estado, rol), fallo: false });
        }
      })
      .catch(() => {
        if (activo) setConsulta({ clave, opciones: [], fallo: true });
      });
    return () => {
      activo = false;
    };
  }, [clave, estado, rol]);
  const vigente = consulta?.clave === clave ? consulta : null;
  const opciones = vigente?.opciones ?? [];
  const fallo = Boolean(vigente?.fallo);
  const cargando = !vigente;
  const destinos = opciones
    .filter((t) => t.id_estado_origen === estado)
    .map((t) => t.id_estado_destino);
  const asignable = destinos.includes(ESTADOS.ASIGNADA);
  useEffect(() => {
    if (asignable) loadTechnicians();
  }, [asignable, loadTechnicians]);
  const cambios = destinos.filter((id) => id !== ESTADOS.CLASIFICADA && id !== ESTADOS.ASIGNADA);
  async function cambiar(id) {
    const texto = comentario.trim();
    if (!texto) return;
    if (errorAccion?.tipo === 'timeout') {
      const actual = await refreshTicket();
      if (!actual || actual.incidencia?.estado?.id_estado !== estado) return;
    }
    if (await updateIncidentStatus(id, texto)) setComentario('');
  }
  return (
    <View style={styles.acciones}>
      {fallo && (
        <Button title="Reintentar carga de acciones" onPress={() => reintentar((n) => n + 1)} />
      )}
      {asignable && (
        <>
          <TechnicianSelector
            tecnicos={tecnicos ?? []}
            selectedId={idTecnico}
            cargando={estadoTecnicos === 'cargando'}
            disabled={procesandoAccion}
            onSelect={(tecnico) => seleccionar(tecnico.id_usuario ?? tecnico.id)}
          />
          {errorTecnicos && (
            <Button title="Reintentar carga de técnicos" onPress={loadTechnicians} />
          )}
          <Button
            title="Confirmar asignación"
            disabled={!idTecnico || procesandoAccion}
            onPress={() => assignIncident(idTecnico)}
          />
        </>
      )}
      {cambios.length > 0 && (
        <>
          <Text style={styles.etiqueta}>Comentario obligatorio</Text>
          <TextInput
            style={styles.campo}
            accessibilityLabel="Comentario obligatorio"
            multiline
            value={comentario}
            onChangeText={setComentario}
            maxLength={COMENTARIO_MAX}
            editable={!procesandoAccion}
          />
          {cambios.map((id) => (
            <Button
              key={id}
              title={
                'Cambiar a ' +
                (Object.keys(ESTADOS).find((k) => ESTADOS[k] === id) ?? String(id))
                  .toLowerCase()
                  .replace(/_/g, ' ')
              }
              disabled={!comentario.trim() || procesandoAccion}
              onPress={() => cambiar(id)}
            />
          ))}
        </>
      )}
      {!cargando && !fallo && !asignable && cambios.length === 0 && (
        <Text style={styles.sinAcciones}>
          No hay acciones disponibles para tu rol en este estado.
        </Text>
      )}
      {errorAccion && (
        <>
          <Text accessibilityRole="alert">{errorAccion.mensaje}</Text>
          <Button title="Actualizar ticket" onPress={refreshTicket} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  acciones: { gap: 10 },
  sinAcciones: { color: '#5B6B82' },
  etiqueta: { fontWeight: '700', color: '#182B49' },
  campo: {
    padding: 12,
    minHeight: 68,
    textAlignVertical: 'top',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCD7E6',
  },
});
