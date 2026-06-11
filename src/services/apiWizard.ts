// src/services/apiWizard.ts
// Servicio para el wizard de solicitud de agenda gratis
// VERSIÓN MODIFICADA:
// - Usa upsertUsuario (crea o actualiza usuario)
// - Manejo de errores específicos para WhatsApp duplicado y relación DUEÑO duplicada

const API_URL = import.meta.env.VITE_API_URL || 'https://turnos-api-backend.onrender.com';

// ============================================================
// INTERFACES
// ============================================================

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
// DTOs
// ============================================================

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

export interface CreateNegocioDto {
  nombre: string;
  country_code: number;
  national_number: string;
  domicilio: DomicilioDto;
}

export interface CreateUsuarioDto {
  email: string;
  apellido: string;
  nombre: string;
  telefono?: string;
}

export interface UpsertUsuarioDto {
  email: string;
  apellido: string;
  nombre: string;
  telefono?: string;
}

export interface CreateCentroDto {
  negocioId: number;
  nombre: string;
  country_code: number;
  national_number: string;
  es_virtual?: boolean;
  domicilio?: DomicilioDto;
  timezone?: string;
}

export interface CreateNegocioActividadDto {
  negocioId: number;
  actividadId: number;
}

export interface CreateNegocioUsuarioRolDto {
  negocioId: number;
  usuarioId: number;
  rolId: number;
}

export interface CentroData {
  nombre: string;
  es_virtual: boolean;
  domicilio?: DomicilioDto;
}

// ============================================================
// FUNCIONES DE API
// ============================================================

export async function getActividades(): Promise<Actividad[]> {
  const response = await fetch(`${API_URL}/actividades`);
  if (!response.ok) {
    throw new Error(`Error al obtener actividades: ${response.statusText}`);
  }
  return response.json();
}

export async function getRolDueno(): Promise<Rol> {
  const response = await fetch(`${API_URL}/roles/nombre/DUEÑO`);
  if (!response.ok) {
    throw new Error(`Error al obtener rol DUEÑO: ${response.statusText}`);
  }
  return response.json();
}

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

const parsePhoneE164 = (phone: string | undefined): { country_code: number | null; national_number: string } => {
  if (!phone) return { country_code: null, national_number: '' };
  const match = phone.match(/^\+(\d{1,3})(\d+)$/);
  if (match) {
    return {
      country_code: parseInt(match[1], 10),
      national_number: match[2]
    };
  }
  return { country_code: null, national_number: '' };
};

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

// 👈 NUEVA FUNCIÓN: upsertUsuario (crea o actualiza)
export async function upsertUsuario(data: UpsertUsuarioDto): Promise<Usuario> {
  const response = await fetch(`${API_URL}/usuarios/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear/actualizar usuario: ${response.statusText}`);
  }
  
  return response.json();
}

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

export async function createNegocioUsuarioRol(data: CreateNegocioUsuarioRolDto): Promise<NegocioUsuarioRol> {
  const response = await fetch(`${API_URL}/negocios-usuarios-roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Verificar si es error de relación duplicada (usuario ya es dueño)
    if (error.message && error.message.includes('El usuario ya tiene este rol activo en el negocio')) {
      throw new Error('RELACION_DUPLICADA');
    }
    throw new Error(error.message || `Error al asignar rol: ${response.statusText}`);
  }
  
  return response.json();
}

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
// FUNCIÓN PRINCIPAL DEL PASO 1
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
  negocioWhatsapp: string;
  usuarioEmail: string;
  usuarioApellido: string;
  usuarioNombre: string;
  usuarioTelefono?: string;
  actividadId: number;
  centros: CentroData[];
}): Promise<Paso1Result> {
  
  const { country_code, national_number } = parsePhoneE164(params.negocioWhatsapp);
  if (!country_code || !national_number) {
    throw new Error('El número de WhatsApp no es válido');
  }
  
  const primerCentroFisico = params.centros.find(c => !c.es_virtual);
  if (!primerCentroFisico || !primerCentroFisico.domicilio) {
    throw new Error('Se requiere al menos un centro físico con domicilio');
  }
  
  // 1. Crear negocio
  const negocio = await createNegocio({
    nombre: params.negocioNombre,
    country_code,
    national_number,
    domicilio: primerCentroFisico.domicilio,
  });
  
  // 2. Crear o actualizar usuario (upsert)
  const usuario = await upsertUsuario({
    email: params.usuarioEmail,
    apellido: params.usuarioApellido,
    nombre: params.usuarioNombre,
    telefono: params.usuarioTelefono,
  });
  
  // 3. Crear todos los centros
  const centrosCreados: Centro[] = [];
  for (const centroData of params.centros) {
    const centro = await createCentro({
      negocioId: negocio.id,
      nombre: centroData.nombre,
      country_code,
      national_number,
      es_virtual: centroData.es_virtual,
      domicilio: centroData.domicilio,
    });
    centrosCreados.push(centro);
  }
  
  // 4. Asignar actividad al negocio
  const negocioActividad = await createNegocioActividad({
    negocioId: negocio.id,
    actividadId: params.actividadId,
  });
  
  // 5. Asignar rol DUEÑO al usuario en el negocio (puede fallar si ya existe)
  let negocioUsuarioRol: NegocioUsuarioRol | null = null;
  try {
    negocioUsuarioRol = await createNegocioUsuarioRol({
      negocioId: negocio.id,
      usuarioId: usuario.id,
      rolId: 7,
    });
  } catch (error: any) {
    if (error.message === 'RELACION_DUPLICADA') {
      throw new Error('Ya eres dueño de este negocio. Si necesitas modificarlo, por favor contactate con nuestro equipo de ayuda.');
    }
    throw error;
  }
  
  return {
    negocio,
    usuario,
    centros: centrosCreados,
    negocioActividad,
    negocioUsuarioRol: negocioUsuarioRol!,
  };
}
