// src/services/apiWizard.ts
// Servicio para el wizard de solicitud de agenda gratis
// VERSIÓN CON FUNCIONES PARA PASO 2:
// - Profesionales, Especialidades, Actividad-Especialidad, Profesional-Especialidad
// - Nueva función para crear relaciones profesional-centro

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

export interface ProfesionalCentro {
  id: number;
  profesionalId: number;
  especialidadId: number;
  centroId: number;
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

export interface CreateProfesionalCentroDto {
  profesionalId: number;
  especialidadId: number;
  centroId: number;
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
  const response = await fetch(`${API_URL}/actividad-especialidad/por-actividad/${actividadId}`);
  if (!response.ok) {
    throw new Error(`Error al obtener especialidades: ${response.statusText}`);
  }
  const data = await response.json();
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
// 🆕 FUNCIONES PARA PROFESIONAL-CENTRO
// ============================================================

// Crear una relación profesional-centro
export async function createProfesionalCentro(data: CreateProfesionalCentroDto): Promise<ProfesionalCentro> {
  const response = await fetch(`${API_URL}/profesional-centro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Si es error de duplicado (400), lo manejamos con un mensaje específico
    if (response.status === 400 && error.message?.includes('ya tiene asignada')) {
      throw new Error('DUPLICADO');
    }
    throw new Error(error.message || `Error al asignar profesional al centro: ${response.statusText}`);
  }
  
  return response.json();
}

// Obtener centros activos de un negocio
export async function getCentrosPorNegocio(negocioId: number): Promise<Centro[]> {
  const response = await fetch(`${API_URL}/centros/negocio/${negocioId}`);
  if (!response.ok) {
    throw new Error(`Error al obtener centros: ${response.statusText}`);
  }
  const centros = await response.json();
  // Ya vienen filtrados por fecha_baja = null desde el backend
  return centros;
}

// Crear todas las relaciones profesional-centro para un negocio
export async function crearRelacionesProfesionalCentro(
  profesionalId: number,
  especialidadId: number,
  negocioId: number
): Promise<number[]> {
  // 1. Obtener los centros activos del negocio
  const centros = await getCentrosPorNegocio(negocioId);
  
  if (centros.length === 0) {
    console.warn('⚠️ El negocio no tiene centros activos');
    return [];
  }
  
  // 2. Crear relación para cada centro
  const idsCreados: number[] = [];
  
  for (const centro of centros) {
    try {
      const resultado = await createProfesionalCentro({
        profesionalId,
        especialidadId,
        centroId: centro.id,
      });
      idsCreados.push(resultado.id);
      console.log(`✅ Relación Profesional-Centro creada: ID ${resultado.id} (centro: ${centro.nombre})`);
    } catch (error: any) {
      if (error.message === 'DUPLICADO') {
        console.log(`ℹ️ Relación ya existente para centro ${centro.nombre}`);
        // No interrumpimos el flujo, solo registramos
      } else {
        console.error(`❌ Error al crear relación para centro ${centro.id}:`, error);
        // No interrumpimos el flujo
      }
    }
  }
  
  console.log(`📊 Relaciones creadas: ${idsCreados.length}`);
  return idsCreados;
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
// FUNCIÓN PRINCIPAL DEL PASO 2 (ACTUALIZADA)
// ============================================================

export interface Paso2Result {
  profesional: Profesional;
  especialidad: Especialidad;
  profesionalEspecialidad: ProfesionalEspecialidad;
  actividadEspecialidad?: ActividadEspecialidad;
  profesionalCentroIds: number[];
  esProfesionalExistente?: boolean; // 👈 NUEVO: indica si el profesional ya existía
}

export async function registrarPaso2Profesional(params: {
  negocioId: number;
  actividadId: number;
  profesionalData: CreateProfesionalDto;
  especialidadNombre: string;
  especialidadDescripcion?: string;
  profesionalExistenteId?: number; // 👈 NUEVO: si el profesional ya existe, pasamos su ID
}): Promise<Paso2Result> {
  
  let profesional: Profesional;
  let esProfesionalExistente = false;
  
  // 1. Crear profesional o usar el existente
  if (params.profesionalExistenteId) {
    // Si el profesional ya existe, lo buscamos (no lo creamos)
    const profesionales = await fetch(`${API_URL}/profesionales`).then(res => res.json());
    profesional = profesionales.find((p: Profesional) => p.id === params.profesionalExistenteId && !p.fecha_baja);
    if (!profesional) {
      throw new Error('El profesional existente no se encontró o está inactivo');
    }
    esProfesionalExistente = true;
    console.log(`✅ Usando profesional existente: ID ${profesional.id}`);
  } else {
    // Si el profesional es nuevo, lo creamos
    profesional = await createProfesional(params.profesionalData);
    console.log(`✅ Profesional creado: ID ${profesional.id}`);
  }
  
  // 2. Buscar si la especialidad ya existe
  let especialidad = await buscarEspecialidadPorNombre(params.especialidadNombre);
  let actividadEspecialidad: ActividadEspecialidad | undefined = undefined;
  
  // 3. Si no existe, crearla
  if (!especialidad) {
    especialidad = await createEspecialidad({
      nombre: params.especialidadNombre.toUpperCase(),
      descripcion: params.especialidadDescripcion,
    });
    
    actividadEspecialidad = await createActividadEspecialidad({
      actividadId: params.actividadId,
      especialidadId: especialidad.id,
    });
    console.log(`✅ Especialidad creada: ID ${especialidad.id}`);
  } else {
    console.log(`✅ Especialidad existente: ID ${especialidad.id}`);
  }
  
  // 4. Crear relación profesional-especialidad (si no existe)
  let profesionalEspecialidad: ProfesionalEspecialidad;
  try {
    profesionalEspecialidad = await createProfesionalEspecialidad({
      profesionalId: profesional.id,
      especialidadId: especialidad.id,
      descripcion: params.especialidadDescripcion || null,
    });
    console.log(`✅ Relación Profesional-Especialidad creada: ID ${profesionalEspecialidad.id}`);
  } catch (error: any) {
    // Si la relación ya existe, la buscamos
    if (error.message?.includes('duplicate') || error.message?.includes('ya existe')) {
      console.log(`ℹ️ La relación Profesional-Especialidad ya existe, se reutilizará`);
      const relaciones = await fetch(`${API_URL}/profesional-especialidad/por-profesional/${profesional.id}`).then(res => res.json());
      profesionalEspecialidad = relaciones.find((pe: ProfesionalEspecialidad) => pe.especialidadId === especialidad.id && !pe.fecha_baja);
      if (!profesionalEspecialidad) {
        throw new Error('No se pudo obtener la relación existente');
      }
    } else {
      throw error;
    }
  }
  
  // 5. Crear relaciones profesional-centro para cada centro del negocio
  const profesionalCentroIds = await crearRelacionesProfesionalCentro(
    profesional.id,
    especialidad.id,
    params.negocioId
  );
  
  return {
    profesional,
    especialidad,
    profesionalEspecialidad,
    actividadEspecialidad,
    profesionalCentroIds,
    esProfesionalExistente,
  };
}
