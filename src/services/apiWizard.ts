// src/services/apiWizard.ts
// Servicio para el wizard de solicitud de agenda gratis
// VERSIÓN MODIFICADA:
// - Usa upsertUsuario en lugar de createUsuario
// - Envía usuario_alta (email del dueño) a todas las tablas
// - Nombre de centros físicos = dirección simplificada

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
// DTOs PARA ENVIAR AL BACKEND
// ============================================================

// DTO para domicilio
export interface DomicilioDto {
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

// POST /negocios (con usuario_alta)
export interface CreateNegocioDto {
  nombre: string;
  country_code: number;
  national_number: string;
  domicilio: DomicilioDto;
  usuario_alta?: string;
}

// POST /usuarios/upsert
export interface UpsertUsuarioDto {
  email: string;
  apellido: string;
  nombre: string;
  telefono?: string;
  usuario_alta?: string;
}

// POST /centros (con usuario_alta)
export interface CreateCentroDto {
  negocioId: number;
  nombre: string;
  country_code: number;
  national_number: string;
  es_virtual?: boolean;
  domicilio?: DomicilioDto;
  timezone?: string;
  usuario_alta?: string;
}

// POST /negocio-actividades (con usuario_alta)
export interface CreateNegocioActividadDto {
  negocioId: number;
  actividadId: number;
  usuario_alta?: string;
}

// POST /negocios-usuarios-roles (con usuario_alta)
export interface CreateNegocioUsuarioRolDto {
  negocioId: number;
  usuarioId: number;
  rolId: number;
  usuario_alta?: string;
}

// Datos para crear un centro desde el wizard
export interface CentroData {
  nombre: string;
  es_virtual: boolean;
  domicilio?: DomicilioDto;
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
  const response = await fetch(`${API_URL}/roles/nombre/DUEÑO`);
  if (!response.ok) {
    throw new Error(`Error al obtener rol DUEÑO: ${response.statusText}`);
  }
  return response.json();
}

// 3. Verificar si una URL única ya existe
export async function verificarUrlUnica(url: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/negocios/url/${url}`);
  
  if (response.status === 200) {
    const data = await response.json();
    if (data.message === 'Negocio no encontrado') {
      return true;
    }
    return false;
  }
  
  return false;
}

// 4. Crear negocio (con usuario_alta)
export async function createNegocio(data: CreateNegocioDto, usuarioAlta?: string): Promise<Negocio> {
  const body = {
    ...data,
    usuario_alta: usuarioAlta || data.nombre,
  };
  
  const response = await fetch(`${API_URL}/negocios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear negocio: ${response.statusText}`);
  }
  
  return response.json();
}

// 5. Crear o actualizar usuario (upsert) con usuario_alta
export async function upsertUsuario(data: UpsertUsuarioDto, usuarioAlta?: string): Promise<Usuario> {
  const body = {
    ...data,
    usuario_alta: usuarioAlta || data.email,
  };
  
  const response = await fetch(`${API_URL}/usuarios/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear/actualizar usuario: ${response.statusText}`);
  }
  
  return response.json();
}

// 6. Crear centro (con usuario_alta)
export async function createCentro(data: CreateCentroDto, usuarioAlta?: string): Promise<Centro> {
  const body = {
    ...data,
    usuario_alta: usuarioAlta || 'demo',
  };
  
  const response = await fetch(`${API_URL}/centros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear centro: ${response.statusText}`);
  }
  
  return response.json();
}

// 7. Asignar actividad al negocio (con usuario_alta)
export async function createNegocioActividad(data: CreateNegocioActividadDto, usuarioAlta?: string): Promise<NegocioActividad> {
  const body = {
    ...data,
    usuario_alta: usuarioAlta || 'demo',
  };
  
  const response = await fetch(`${API_URL}/negocio-actividades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al asignar actividad: ${response.statusText}`);
  }
  
  return response.json();
}

// 8. Asignar rol DUEÑO al usuario en el negocio (con usuario_alta)
export async function createNegocioUsuarioRol(data: CreateNegocioUsuarioRolDto, usuarioAlta?: string): Promise<NegocioUsuarioRol> {
  const body = {
    ...data,
    usuario_alta: usuarioAlta || 'demo',
  };
  
  const response = await fetch(`${API_URL}/negocios-usuarios-roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al asignar rol: ${response.statusText}`);
  }
  
  return response.json();
}

// 9. Enviar email de bienvenida
export async function enviarEmailBienvenida(data: {
  email: string;
  nombreNegocio: string;
  urlPublica: string;
  urlGestion: string;
}): Promise<void> {
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
// FUNCIÓN PRINCIPAL DEL PASO 1 (MULTI-CENTRO CON USUARIO_ALTA)
// ============================================================

export interface Paso1Result {
  negocio: Negocio;
  usuario: Usuario;
  centros: Centro[];
  negocioActividad: NegocioActividad;
  negocioUsuarioRol: NegocioUsuarioRol;
}

export async function registrarPaso1DatosBasicos(params: {
  negocioNombre: string;
  negocioCountryCode: number;
  negocioNationalNumber: string;
  usuarioEmail: string;
  usuarioApellido: string;
  usuarioNombre: string;
  usuarioTelefono?: string;
  actividadId: number;
  centros: CentroData[];
  usuarioAlta?: string;  // Email del dueño para auditoría
}): Promise<Paso1Result> {
  
  const usuarioAlta = params.usuarioAlta || params.usuarioEmail;
  
  // 1. Crear negocio
  const primerCentroFisico = params.centros.find(c => !c.es_virtual);
  if (!primerCentroFisico || !primerCentroFisico.domicilio) {
    throw new Error('Se requiere al menos un centro físico con domicilio');
  }
  
  const negocio = await createNegocio({
    nombre: params.negocioNombre,
    country_code: params.negocioCountryCode,
    national_number: params.negocioNationalNumber,
    domicilio: primerCentroFisico.domicilio,
  }, usuarioAlta);
  
  // 2. Crear o actualizar usuario (upsert)
  const usuario = await upsertUsuario({
    email: params.usuarioEmail,
    apellido: params.usuarioApellido,
    nombre: params.usuarioNombre,
    telefono: params.usuarioTelefono,
  }, usuarioAlta);
  
  // 3. Crear todos los centros
  const centrosCreados: Centro[] = [];
  for (const centroData of params.centros) {
    const centro = await createCentro({
      negocioId: negocio.id,
      nombre: centroData.nombre,
      country_code: params.negocioCountryCode,
      national_number: params.negocioNationalNumber,
      es_virtual: centroData.es_virtual,
      domicilio: centroData.domicilio,
    }, usuarioAlta);
    centrosCreados.push(centro);
  }
  
  // 4. Asignar actividad al negocio
  const negocioActividad = await createNegocioActividad({
    negocioId: negocio.id,
    actividadId: params.actividadId,
  }, usuarioAlta);
  
  // 5. Asignar rol DUEÑO al usuario en el negocio
  const negocioUsuarioRol = await createNegocioUsuarioRol({
    negocioId: negocio.id,
    usuarioId: usuario.id,
    rolId: 7,
  }, usuarioAlta);
  
  return {
    negocio,
    usuario,
    centros: centrosCreados,
    negocioActividad,
    negocioUsuarioRol,
  };
}
