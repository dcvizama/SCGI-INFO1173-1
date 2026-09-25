// Respuestas de inicio de sesion de prueba, con la forma del esquema
// SesionIniciada. Cada token lleva en su contenido sub, rol y exp, para que
// AuthContext pueda leer el rol igual que con el servidor real.
// La firma no es valida: son tokens de prueba, nunca de produccion.

import {
  usuarioAdministrador,
  usuarioReportante,
  usuarioSupervisor,
  usuarioTecnico,
} from './usuarios';

export const contrasenaValida = 'Secreta123';

export const sesionReportante = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjE0ZTQ1Zi1jZTlhLTRhMWItOWIxZi0yZDdiNWE5YzBlMTEiLCJyb2wiOiJSRVBPUlRBTlRFIiwiZXhwIjo0MTAyNDQ0ODAwfQ.firma-de-prueba',
  usuario: usuarioReportante,
};

export const sesionSupervisor = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjZjMmExZS04YjRkLTRjMmEtOWYxZS0yZDdiNWE5YzBlMTIiLCJyb2wiOiJTVVBFUlZJU09SIiwiZXhwIjo0MTAyNDQ0ODAwfQ.firma-de-prueba',
  usuario: usuarioSupervisor,
};

export const sesionTecnico = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YTJkOWM3Ny0xYjNlLTRmNmEtOGMyZC0yZDdiNWE5YzBlMTMiLCJyb2wiOiJURUNOSUNPIiwiZXhwIjo0MTAyNDQ0ODAwfQ.firma-de-prueba',
  usuario: usuarioTecnico,
};

export const sesionAdministrador = {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjN2IxZTBkNC02YTJmLTRiOGUtOWQzYy0yZDdiNWE5YzBlMTQiLCJyb2wiOiJBRE1JTklTVFJBRE9SIiwiZXhwIjo0MTAyNDQ0ODAwfQ.firma-de-prueba',
  usuario: usuarioAdministrador,
};

export const sesiones = [sesionReportante, sesionSupervisor, sesionTecnico, sesionAdministrador];
