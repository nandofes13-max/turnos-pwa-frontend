// src/services/apiWizard.ts
// Servicio para el wizard de solicitud de agenda gratis
// VERSIÓN CON FUNCIONES PARA PASO 2:
// - Profesionales, Especialidades, Actividad-Especialidad, Profesional-Especialidad

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

export interface Especialidad {
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

export interface Profesional {
  id: number;
  documento: string;
  nombre: string;
  email: string;
  country_code: number;
  national_number: string;
  whatsapp_e164: string;
  genero: string | null;
  matricula: string | null;
  foto: string | null;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

export interface ActividadEspecialidad {
  id: number;
  actividadId: number;
  especialidadId: number;
  fecha_alta: string;
  usuario_alta: string;
  fecha_modificacion: string | null;
  usuario_modificacion: string | null;
  fecha_baja: string | null;
  usuario_baja: string | null;
  ultimoMovimiento?: string;
}

export interface ProfesionalEspecialidad {
  id: number;
  profesionalId: number;
  especialidadId: number;
  descripcion: string | null;
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
// DTOs PARA PASO 2
// ============================================================

export interface CreateProfesionalDto {
  documento: string;
  nombre: string;
  email: string;
  country_code: number;
  national_number: string;
  genero?: string;
  matricula?: string;
  foto?: string;
}

export interface CreateEspecialidadDto {
  nombre: string;
  descripcion?: string;
}

export interface CreateActividadEspecialidadDto {
  actividadId: number;
  especialidadId: number;
}

export interface CreateProfesionalEspecialidadDto {
  profesionalId: number;
  especialidadId: number;
  descripcion?: string;
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
    if (error.message && error.message.includes('El usuario ya tiene este rol activo en el negocio')) {
      throw new Error('RELACION_DUPLICADA');
    }
    throw new Error(error.message || `Error al asignar rol: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================
// FUNCIONES PARA PASO 2 (Profesionales y Especialidades)
// ============================================================

// Obtener especialidades filtradas por actividad (usando el endpoint optimizado)
export async function getEspecialidadesPorActividad(actividadId: number): Promise<Especialidad[]> {
  // Este endpoint devuelve especialidades que tienen relación con la actividad
  const response = await fetch(`${API_URL}/actividad-especialidad/por-actividad/${actividadId}`);
  if (!response.ok) {
    throw new Error(`Error al obtener especialidades: ${response.statusText}`);
  }
  const data = await response.json();
  // Extraer las especialidades de las relaciones
  return data.map((rel: any) => rel.especialidad);
}

// Buscar especialidad por nombre (para verificar si existe)
export async function buscarEspecialidadPorNombre(nombre: string): Promise<Especialidad | null> {
  const response = await fetch(`${API_URL}/especialidades`);
  if (!response.ok) {
    throw new Error(`Error al buscar especialidades: ${response.statusText}`);
  }
  const especialidades: Especialidad[] = await response.json();
  const encontrada = especialidades.find(
    e => e.nombre.toUpperCase() === nombre.toUpperCase() && !e.fecha_baja
  );
  return encontrada || null;
}

// 👈 AGREGAR AQUÍ LA NUEVA FUNCIÓN
// Buscar profesional por documento (para auto-completado)
export async function buscarProfesionalPorDocumento(documento: string): Promise<Profesional | null> {
  const response = await fetch(`${API_URL}/profesionales`);
  if (!response.ok) {
    throw new Error(`Error al buscar profesionales: ${response.statusText}`);
  }
  const profesionales: Profesional[] = await response.json();
  const encontrado = profesionales.find(
    p => p.documento === documento && !p.fecha_baja
  );
  return encontrado || null;
}

// Crear nueva especialidad
export async function createEspecialidad(data: CreateEspecialidadDto): Promise<Especialidad> {
  const response = await fetch(`${API_URL}/especialidades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear especialidad: ${response.statusText}`);
  }
  
  return response.json();
}

// Crear relación actividad-especialidad
export async function createActividadEspecialidad(data: CreateActividadEspecialidadDto): Promise<ActividadEspecialidad> {
  const response = await fetch(`${API_URL}/actividad-especialidad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al vincular actividad con especialidad: ${response.statusText}`);
  }
  
  return response.json();
}

// Crear profesional
export async function createProfesional(data: CreateProfesionalDto): Promise<Profesional> {
  const response = await fetch(`${API_URL}/profesionales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al crear profesional: ${response.statusText}`);
  }
  
  return response.json();
}

// Crear relación profesional-especialidad
export async function createProfesionalEspecialidad(data: CreateProfesionalEspecialidadDto): Promise<ProfesionalEspecialidad> {
  const response = await fetch(`${API_URL}/profesional-especialidad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error al vincular profesional con especialidad: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================
// FUNCIONES DE EMAIL
// ============================================================

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
  
  const negocio = await createNegocio({
    nombre: params.negocioNombre,
    country_code,
    national_number,
    domicilio: primerCentroFisico.domicilio,
  });
  
  const usuario = await upsertUsuario({
    email: params.usuarioEmail,
    apellido: params.usuarioApellido,
    nombre: params.usuarioNombre,
    telefono: params.usuarioTelefono,
  });
  
  const negocioActividad = await createNegocioActividad({
    negocioId: negocio.id,
    actividadId: params.actividadId,
  });
  
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

// ============================================================
// FUNCIÓN PRINCIPAL DEL PASO 2
// ============================================================

export interface Paso2Result {
  profesional: Profesional;
  especialidad: Especialidad;
  profesionalEspecialidad: ProfesionalEspecialidad;
  actividadEspecialidad?: ActividadEspecialidad; // Solo si se creó especialidad nueva
  profesionalCentroIds: number[]; // 👈 NUEVO: IDs de las relaciones profesional-centro creadas
}

export async function registrarPaso2Profesional(params: {
  negocioId: number;
  actividadId: number;
  profesionalData: CreateProfesionalDto;
  especialidadNombre: string;
  especialidadDescripcion?: string;
}): Promise<Paso2Result> {
  
  // 1. Crear profesional
  const profesional = await createProfesional(params.profesionalData);
  
  // 2. Buscar si la especialidad ya existe
  let especialidad = await buscarEspecialidadPorNombre(params.especialidadNombre);
  let actividadEspecialidad: ActividadEspecialidad | undefined = undefined;
  
  // 3. Si no existe, crearla
  if (!especialidad) {
    especialidad = await createEspecialidad({
      nombre: params.especialidadNombre.toUpperCase(),
      descripcion: params.especialidadDescripcion,
    });
    
    // 4. Crear relación actividad-especialidad
    actividadEspecialidad = await createActividadEspecialidad({
      actividadId: params.actividadId,
      especialidadId: especialidad.id,
    });
  }
  
  // 5. Crear relación profesional-especialidad
  const profesionalEspecialidad = await createProfesionalEspecialidad({
    profesionalId: profesional.id,
    especialidadId: especialidad.id,
    descripcion: null,
  });
  
  return {
    profesional,
    especialidad,
    profesionalEspecialidad,
    actividadEspecialidad,
  };
}
