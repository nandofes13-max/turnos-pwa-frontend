// src/services/apiWizard.ts
// Servicio para el wizard de solicitud de agenda gratis

const API_URL = import.meta.env.VITE_API_URL || 'https://turnos-api-backend.onrender.com';

// ============================================================
// INTERFACES (exactamente como las devuelve el backend)
// ============================================================

// Negocio
export interface Negocio {
  id: number;
  nombre: string;
  url: string;
  country_code: number;
  national_number: string;
  whatsapp_e164: string;
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  country_code_iso: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
  timezone: string;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

// Usuario
export interface Usuario {
  id: number;
  email: string;
  apellido: string;
  nombre: string;
  telefono: string | null;
  password_hash: string | null;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

// Centro
export interface Centro {
  id: number;
  negocioId: number;
  nombre: string;
  codigo: string;
  es_virtual: boolean;
  country_code: number;
  national_number: string;
  whatsapp_e164: string;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  country_code_iso: string | null;
  latitude: number | null;
  longitude: number | null;
  formatted_address: string | null;
  timezone: string;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

// Actividad
export interface Actividad {
  id: number;
  nombre: string;
  virtual: boolean;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

// Rol
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

// Relación Negocio-Usuario-Rol
export interface NegocioUsuarioRol {
  id: number;
  negocioId: number;
  usuarioId: number;
  rolId: number;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

// Relación Negocio-Actividad
export interface NegocioActividad {
  id: number;
  negocioId: number;
  actividadId: number;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

// ============================================================
// DTOs PARA ENVIAR AL BACKEND (exactamente como los espera)
// ============================================================

// DTO para domicilio (dentro de CreateNegocioDto y CreateCentroDto)
export interface DomicilioDto {
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  country_code: string;  // ISO 3166-1 alpha-2, ej: "AR"
  latitude: number;
  longitude: number;
  formatted_address: string;
}

// POST /negocios
export interface CreateNegocioDto {
  nombre: string;
  country_code: number;
  national_number: string;
  domicilio: DomicilioDto;
}

// POST /usuarios
export interface CreateUsuarioDto {
  email: string;
  apellido: string;
  nombre: string;
  telefono?: string;
}

// POST /centros
export interface CreateCentroDto {
  negocioId: number;
  nombre: string;
  country_code: number;
  national_number: string;
  es_virtual?: boolean;
  domicilio?: DomicilioDto;  // Obligatorio si es_virtual = false
  timezone?: string;
}

// POST /negocio-actividades
export interface CreateNegocioActividadDto {
  negocioId: number;
  actividadId: number;
}

// POST /negocios-usuarios-roles
export interface CreateNegocioUsuarioRolDto {
  negocioId: number;
  usuarioId: number;
  rolId: number;
}

// ============================================================
// RESPUESTAS DEL BACKEND (para creación)
// ============================================================

export interface ApiResponse<T> {
  status?: number;
  message?: string;
  data?: T;
}

// ============================================================
// FUNCIONES DE API
// ============================================================

// 1. Obtener todas las actividades (catálogo)
export async function getActividades(): Promise<Actividad[]> {
  const response = await fetch(`${API_URL}/actividades`);
  if (!response.ok) {
    throw new Error(`Error al obtener actividades: ${response.statusText}`);
  }
  return response.json();
}

// 2. Obtener el rol DUEÑO (ID = 7 según la BD)
export async function getRolDueno(): Promise<Rol> {
  // Como ya sabemos que ID = 7, podemos usarlo directamente
  // Pero por si acaso, consultamos por nombre
  const response = await fetch(`${API_URL}/roles/nombre/DUEÑO`);
  if (!response.ok) {
    throw new Error(`Error al obtener rol DUEÑO: ${response.statusText}`);
  }
  return response.json();
}

// 3. Verificar si una URL única ya existe (para validación en tiempo real)
export async function verificarUrlUnica(url: string): Promise<boolean> {
  // Intentamos obtener el negocio por URL
  const response = await fetch(`${API_URL}/negocios/url/${url}`);
  if (response.status === 404) {
    return true; // URL disponible
  }
  if (response.ok) {
    return false; // URL ya existe
  }
  // Si hay otro error, asumimos que no está disponible por seguridad
  return false;
}

// 4. Crear negocio
export async function createNegocio(data: CreateNegocioDto): Promise<Negocio> {
  const response = await fetch(`${API_URL}/negocios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear negocio: ${response.statusText}`);
  }
  
  return response.json();
}

// 5. Crear usuario
export async function createUsuario(data: CreateUsuarioDto): Promise<Usuario> {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear usuario: ${response.statusText}`);
  }
  
  return response.json();
}

// 6. Crear centro
export async function createCentro(data: CreateCentroDto): Promise<Centro> {
  const response = await fetch(`${API_URL}/centros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear centro: ${response.statusText}`);
  }
  
  return response.json();
}

// 7. Asignar actividad al negocio
export async function createNegocioActividad(data: CreateNegocioActividadDto): Promise<NegocioActividad> {
  const response = await fetch(`${API_URL}/negocio-actividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al asignar actividad: ${response.statusText}`);
  }
  
  return response.json();
}

// 8. Asignar rol DUEÑO al usuario en el negocio
export async function createNegocioUsuarioRol(data: CreateNegocioUsuarioRolDto): Promise<NegocioUsuarioRol> {
  const response = await fetch(`${API_URL}/negocios-usuarios-roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al asignar rol: ${response.statusText}`);
  }
  
  return response.json();
}

// 9. Enviar email de bienvenida (endpoint pendiente de confirmar estructura)
export async function enviarEmailBienvenida(data: {
  email: string;
  nombreNegocio: string;
  urlPublica: string;
  urlGestion: string;
}): Promise<void> {
  // Este endpoint aún no lo tenemos, lo ajustaremos cuando me pases los archivos de email
  const response = await fetch(`${API_URL}/enviar-bienvenida`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al enviar email: ${response.statusText}`);
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL DEL PASO 1 (crea todo)
// ============================================================

export interface Paso1Result {
  negocio: Negocio;
  usuario: Usuario;
  centro: Centro;
  negocioActividad: NegocioActividad;
  negocioUsuarioRol: NegocioUsuarioRol;
}

export async function registrarPaso1DatosBasicos(params: {
  // Datos del negocio
  negocioNombre: string;
  negocioCountryCode: number;
  negocioNationalNumber: string;
  domicilio: DomicilioDto;
  // Datos del usuario
  usuarioEmail: string;
  usuarioApellido: string;
  usuarioNombre: string;
  usuarioTelefono?: string;
  // Datos del centro
  centroNombre: string;
  centroEsVirtual?: boolean;
  // Actividad seleccionada
  actividadId: number;
}): Promise<Paso1Result> {
  
  // 1. Crear negocio
  const negocio = await createNegocio({
    nombre: params.negocioNombre,
    country_code: params.negocioCountryCode,
    national_number: params.negocioNationalNumber,
    domicilio: params.domicilio,
  });
  
  // 2. Crear usuario
  const usuario = await createUsuario({
    email: params.usuarioEmail,
    apellido: params.usuarioApellido,
    nombre: params.usuarioNombre,
    telefono: params.usuarioTelefono,
  });
  
  // 3. Crear centro
  const centro = await createCentro({
    negocioId: negocio.id,
    nombre: params.centroNombre,
    country_code: params.negocioCountryCode,  // mismo WhatsApp que el negocio
    national_number: params.negocioNationalNumber,
    es_virtual: params.centroEsVirtual ?? true,  // Por defecto virtual
    domicilio: params.centroEsVirtual ? undefined : params.domicilio,
  });
  
  // 4. Asignar actividad al negocio
  const negocioActividad = await createNegocioActividad({
    negocioId: negocio.id,
    actividadId: params.actividadId,
  });
  
  // 5. Asignar rol DUEÑO al usuario en el negocio
  const negocioUsuarioRol = await createNegocioUsuarioRol({
    negocioId: negocio.id,
    usuarioId: usuario.id,
    rolId: 7, // DUEÑO
  });
  
  return {
    negocio,
    usuario,
    centro,
    negocioActividad,
    negocioUsuarioRol,
  };
}
