// Mock temporal. En la tarea 8 el cuerpo de signInRequest pasa a llamar
// POST /api/auth/login a través de client.js, manteniendo esta misma firma.

const TOKENS_MOCK = {
  'reportante@uct.cl':
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NGIzN2NmNS1lMTQ5LTU0NjgtOTE4OS0xYWMyYmNjZWNmYzMiLCJub21icmUiOiJBbmEiLCJhcGVsbGlkbyI6IlJlcG9ydGFudGUiLCJjb3JyZW8iOiJyZXBvcnRhbnRlQHVjdC5jbCIsInJvbCI6IlJlcG9ydGFudGUiLCJleHAiOjE4OTM0NTYwMDB9.mock-signature-no-verificada',
  'supervisor@uct.cl':
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MDBhNDc1OC1kNTE1LTVjNTMtOTQzYy01ODEyNDkxYmI1ODgiLCJub21icmUiOiJCcnVubyIsImFwZWxsaWRvIjoiU290byIsImNvcnJlbyI6InN1cGVydmlzb3JAdWN0LmNsIiwicm9sIjoiU3VwZXJ2aXNvciIsImV4cCI6MTg5MzQ1NjAwMH0.mock-signature-no-verificada',
  'tecnico@uct.cl':
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNThlNjgyNC1jYmFmLTVlZjktYTk2Mi03ZWQyOGEwZjM0MTciLCJub21icmUiOiJDYXJsYSIsImFwZWxsaWRvIjoiTXVcdTAwZjFveiIsImNvcnJlbyI6InRlY25pY29AdWN0LmNsIiwicm9sIjoiVGVjbmljbyIsImV4cCI6MTg5MzQ1NjAwMH0.mock-signature-no-verificada',
  'admin@uct.cl':
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjODI3ZTkxNC1lYTAyLTVjZjEtOTljMC01ZGU5YzhkMzliYmYiLCJub21icmUiOiJEaWVnbyIsImFwZWxsaWRvIjoiVmVyYSIsImNvcnJlbyI6ImFkbWluQHVjdC5jbCIsInJvbCI6IkFkbWluaXN0cmFkb3IiLCJleHAiOjE4OTM0NTYwMDB9.mock-signature-no-verificada',
};

const PASSWORD_MOCK = 'test1234';

export async function signInRequest(correo, password) {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const token = TOKENS_MOCK[String(correo).trim().toLowerCase()];

  if (!token || password !== PASSWORD_MOCK) {
    const error = new Error('Correo o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  return { token };
}
