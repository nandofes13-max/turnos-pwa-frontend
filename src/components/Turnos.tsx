// src/components/Turnos.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/tablas-maestras.css';
import turnosStyles from '../styles/Turnos.module.css';
import { useNegocioContext } from '../context/NegocioContext';

interface Turno {
  id: number;
  fechaTurno: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  estado: string;
  estadoColor?: string;
  estadoTurnoId?: number;
  pagoEstado: string;
  precioReserva: number | string;
  moneda: string;
  timezone?: string;
  emailEnviado?: boolean;
  videollamadaUrl?: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  profesionalCentro: {
    id: number;
    profesional: { id: number; nombre: string; documento: string };
    especialidad: { id: number; nombre: string };
    centro: { id: number; nombre: string; codigo: string };
  };
  negocio: { id: number; nombre: string };
  centro?: { id: number; nombre: string; codigo: string };
  canalOrigen?: string;
  asistio?: boolean;
  fecha_baja?: string | null;
  ultimoMovimiento?: string;
}

interface Filtros {
  desde: string;
  hasta: string;
  profesionalId: string;
  especialidadId: string;
  actividadId: string;
  negocioId: string;
  centroId: string;
  canalOrigen: string;
  asistio: string;
  estadoTurnoId: string;
  estadoPago: string;
  pacienteSearch: string;
}

interface Actividad {
  id: number;
  nombre: string;
}

interface TurnosProps {
  negocioIdFijo?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const TURNOS_URL = `${API_BASE_URL}/turnos`;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;
const ESTADOS_TURNO_URL = `${API_BASE_URL}/negocios-estados-turno`;
const ESTADOS_PAGO_URL = `${API_BASE_URL}/negocios-estados-pago`;
const ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const NEGOCIO_ACTIVIDADES_URL = `${API_BASE_URL}/negocio-actividades`;
const ACTIVIDAD_ESPECIALIDAD_URL = `${API_BASE_URL}/actividad-especialidad`;
const PROFESIONAL_CENTRO_URL = `${API_BASE_URL}/profesional-centro`;
const WHATSAPP_URL = `${API_BASE_URL}/whatsapp`;

const DIAS_SEMANA = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const formatearTimezone = (tz: string | undefined): string => {
  if (!tz) return '';
  const parts = tz.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const region = parts.length > 1 ? parts[parts.length - 2] : '';
  if (region && region !== city) {
    return `${city} (${region})`;
  }
  return `${city}`;
};

const formatearFechaHora = (fechaTurno: string, horaInicio: string): string => {
  if (!fechaTurno || !horaInicio) return '-';
  const [year, month, day] = fechaTurno.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const diaSemana = DIAS_SEMANA[fecha.getDay()];
  const dia = day.toString().padStart(2, '0');
  const mes = month.toString().padStart(2, '0');
  const anio = year.toString().slice(-2);
  const hora = horaInicio.substring(0, 5);
  return `${diaSemana} ${dia}/${mes}/${anio} ${hora}`;
};

const formatearFecha = (fechaTurno: string): string => {
  if (!fechaTurno) return '-';
  const [year, month, day] = fechaTurno.split('-').map(Number);
  const dia = day.toString().padStart(2, '0');
  const mes = month.toString().padStart(2, '0');
  const anio = year.toString().slice(-2);
  return `${dia}/${mes}/${anio}`;
};

const formatearHora = (hora: string): string => {
  if (!hora) return '-';
  return hora.substring(0, 5);
};

const formatearImporte = (moneda: string, precio: number | string): string => {
  const precioNum = typeof precio === 'string' ? parseFloat(precio) : precio;
  const precioFormateado = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(precioNum);
  
  switch (moneda) {
    case 'ARS': return `ARS $ ${precioFormateado}`;
    case 'USD': return `USD US$ ${precioFormateado}`;
    case 'EUR': return `EUR € ${precioFormateado}`;
    default: return `${moneda} ${precioFormateado}`;
  }
};

export default function Turnos({ negocioIdFijo: negocioIdFijoProp }: TurnosProps = {}) {
  let negocioIdFromContext: number | null = null;
  let slug: string | null = null;
  let contextError = false;

  try {
    const context = useNegocioContext();
    negocioIdFromContext = context.negocioId;
    slug = context.slug;
  } catch (error) {
    contextError = true;
  }

  const esModoAdmin = negocioIdFijoProp === null;
  const negocioIdParaFiltro = negocioIdFijoProp !== undefined && negocioIdFijoProp !== null
    ? negocioIdFijoProp
    : negocioIdFromContext?.toString() || '';

  const [negocioIdFijo, setNegocioIdFijo] = useState<string>(negocioIdParaFiltro);

  // 👈 ESTADO PARA WHATSAPP
  const [estadoWhatsApp, setEstadoWhatsApp] = useState<{
    activo: boolean;
    estado: string | null;
    accesoWhatsapp: boolean;
    phoneNumber: string | null;
  } | null>(null);
  const [cargandoEstadoWhatsApp, setCargandoEstadoWhatsApp] = useState(false);
  const [modalWhatsAppAbierto, setModalWhatsAppAbierto] = useState(false);

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [modalMode, setModalMode] = useState<'view' | null>(null);
  const [confirmCancelar, setConfirmCancelar] = useState<Turno | null>(null);
  const [cargandoFiltros, setCargandoFiltros] = useState(false);
  
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<{ id: number; nombre: string }[]>([]);
  const [especialidades, setEspecialidades] = useState<{ id: number; nombre: string }[]>([]);
  const [especialidadesFiltradas, setEspecialidadesFiltradas] = useState<{ id: number; nombre: string }[]>([]);
  const [negocios, setNegocios] = useState<{ id: number; nombre: string }[]>([]);
  const [centrosFiltrados, setCentrosFiltrados] = useState<{ id: number; nombre: string; codigo: string; negocioId: number }[]>([]);
  const [estadosTurno, setEstadosTurno] = useState<{ id: number; nombre: string; codigoColor: string }[]>([]);
  const [estadosPago, setEstadosPago] = useState<{ id: number; nombre: string; codigoColor: string }[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState<Actividad[]>([]);
  
  const obtenerFechaActual = (): string => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [filtros, setFiltros] = useState<Filtros>({
    desde: obtenerFechaActual(),
    hasta: obtenerFechaActual(),
    profesionalId: '',
    especialidadId: '',
    actividadId: '',
    negocioId: negocioIdParaFiltro,
    centroId: '',
    canalOrigen: '',
    asistio: '',
    estadoTurnoId: '',
    estadoPago: '',
    pacienteSearch: '',
  });
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  // 👈 FUNCIÓN PARA OBTENER EL ESTADO DE WHATSAPP
  const obtenerEstadoWhatsApp = async () => {
    if (!slug || esModoAdmin) return;
    
    setCargandoEstadoWhatsApp(true);
    try {
      const negocioId = negocioIdFromContext || parseInt(negocioIdParaFiltro);
      if (!negocioId) return;
      
      const response = await fetch(`${WHATSAPP_URL}/${negocioId}/estado`);
      if (response.ok) {
        const data = await response.json();
        setEstadoWhatsApp(data);
      }
    } catch (error) {
      console.error('Error obteniendo estado de WhatsApp:', error);
    } finally {
      setCargandoEstadoWhatsApp(false);
    }
  };

  // 👈 FUNCIÓN PARA ACTIVAR/DESACTIVAR WHATSAPP
  const handleToggleWhatsApp = async () => {
    if (!slug || !negocioIdFromContext) return;

    if (estadoWhatsApp?.activo) {
      // Desactivar
      if (!window.confirm('¿Estás seguro de que quieres desactivar las notificaciones por WhatsApp?')) {
        return;
      }
      
      try {
        const response = await fetch(`${WHATSAPP_URL}/${negocioIdFromContext}/config`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          await obtenerEstadoWhatsApp(); // Recargar estado
          alert('✅ Notificaciones por WhatsApp desactivadas correctamente.');
        } else {
          const error = await response.json();
          alert(`❌ Error al desactivar: ${error.message || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('Error desactivando WhatsApp:', error);
        alert('❌ Error al desactivar WhatsApp. Intentá nuevamente.');
      }
    } else {
      // Activar - redirigir a la pantalla de configuración
      window.location.href = `/gestion/turnos/${slug}/whatsapp`;
    }
  };

  // 👈 MANEJAR CLIC EN "Solicitar Notificaciones"
  const handleSolicitarNotificaciones = () => {
    setModalWhatsAppAbierto(true);
  };

  // 👈 VERIFICAR ACCESO Y ESTADO AL CARGAR
  useEffect(() => {
    obtenerEstadoWhatsApp();
  }, [slug, negocioIdFromContext]);

  // Efecto para cargar datos iniciales cuando hay negocioId fijo
  useEffect(() => {
    if (negocioIdFijo && !esModoAdmin) {
      cargarActividadesPorNegocio(parseInt(negocioIdFijo));
      fetchEstadosTurno();
      fetchEstadosPago();
    } else if (esModoAdmin) {
      setActividadesFiltradas(actividades);
      fetchEstadosTurno();
      fetchEstadosPago();
    }
  }, [negocioIdFijo, esModoAdmin]);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'modal-compact-styles';
    style.textContent = `
      .tm-modal .tm-modal-detalle-campo {
        display: flex !important;
        align-items: baseline !important;
        gap: 8px !important;
        padding: 1px 0 !important;
        margin-bottom: 4px !important;
      }
      .tm-modal .tm-modal-detalle-label {
        font-size: 0.7rem !important;
        line-height: 1.1 !important;
        margin: 0 !important;
      }
      .tm-modal .tm-modal-detalle-valor {
        font-size: 0.75rem !important;
        line-height: 1.1 !important;
        margin: 0 !important;
      }
      .tm-modal .tm-modal-detalle-movimiento {
        margin-top: 4px !important;
        padding-top: 4px !important;
      }
    `;
    if (!document.getElementById('modal-compact-styles')) {
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setCargandoFiltros(true);
      try {
        await Promise.all([
          fetchEspecialidades(),
          fetchNegocios(),
          fetchActividades(),
        ]);
        if (negocioIdFijo && !esModoAdmin) {
          await cargarActividadesPorNegocio(parseInt(negocioIdFijo));
        } else if (esModoAdmin) {
          setActividadesFiltradas(actividades);
        }
        await fetchEstadosTurno();
        await fetchEstadosPago();
      } finally {
        setCargandoFiltros(false);
      }
    };
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    fetchTurnos();
  }, [filtros]);

  useEffect(() => {
    if (filtros.negocioId && !esModoAdmin) {
      cargarActividadesPorNegocio(parseInt(filtros.negocioId));
      setFiltros(prev => ({ ...prev, actividadId: '', especialidadId: '', centroId: '', profesionalId: '' }));
      setEspecialidadesFiltradas([]);
      setCentrosFiltrados([]);
      setProfesionalesFiltrados([]);
    } else if (esModoAdmin) {
      setActividadesFiltradas(actividades);
    } else {
      setActividadesFiltradas([]);
      setEspecialidadesFiltradas([]);
      setCentrosFiltrados([]);
      setProfesionalesFiltrados([]);
    }
  }, [filtros.negocioId, esModoAdmin]);

  useEffect(() => {
    if (filtros.actividadId) {
      cargarEspecialidadesPorActividad(parseInt(filtros.actividadId));
      setFiltros(prev => ({ ...prev, especialidadId: '', centroId: '', profesionalId: '' }));
      setCentrosFiltrados([]);
      setProfesionalesFiltrados([]);
    } else {
      setEspecialidadesFiltradas([]);
    }
  }, [filtros.actividadId]);

  useEffect(() => {
    if (filtros.negocioId && filtros.especialidadId) {
      cargarCentrosPorEspecialidad(parseInt(filtros.negocioId), parseInt(filtros.especialidadId));
      setFiltros(prev => ({ ...prev, centroId: '', profesionalId: '' }));
      setProfesionalesFiltrados([]);
    } else {
      setCentrosFiltrados([]);
    }
  }, [filtros.negocioId, filtros.especialidadId]);

  useEffect(() => {
    if (filtros.centroId && filtros.especialidadId) {
      cargarProfesionalesPorCentro(parseInt(filtros.centroId), parseInt(filtros.especialidadId));
      setFiltros(prev => ({ ...prev, profesionalId: '' }));
    } else {
      setProfesionalesFiltrados([]);
    }
  }, [filtros.centroId, filtros.especialidadId]);

  useEffect(() => {
    if (filtros.negocioId) {
      fetchEstadosTurno();
      fetchEstadosPago();
    }
  }, [filtros.negocioId]);

  const fetchTurnos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.profesionalId) params.append('profesionalId', filtros.profesionalId);
      if (filtros.especialidadId) params.append('especialidadId', filtros.especialidadId);
      if (filtros.actividadId && filtros.actividadId !== '') {
        params.append('actividadId', filtros.actividadId);
      }
      if (filtros.negocioId && filtros.negocioId !== '') {
        params.append('negocioId', filtros.negocioId);
      }
      if (filtros.centroId) params.append('centroId', filtros.centroId);
      if (filtros.asistio) params.append('asistio', filtros.asistio);
      if (filtros.estadoTurnoId) params.append('estadoTurnoId', filtros.estadoTurnoId);
      if (filtros.estadoPago) params.append('estadoPago', filtros.estadoPago);
      if (filtros.pacienteSearch) params.append('pacienteSearch', filtros.pacienteSearch);
      
      const url = `${TURNOS_URL}?${params.toString()}`;
      console.log('Fetching turnos URL:', url);
      const res = await fetch(url);
      const data = await res.json();
      setTurnos(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar turnos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const res = await fetch(ESPECIALIDADES_URL);
      const data = await res.json();
      setEspecialidades(data.filter((e: any) => !e.fecha_baja));
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  };

  const fetchNegocios = async () => {
    try {
      const res = await fetch(NEGOCIOS_URL);
      const data = await res.json();
      setNegocios(data.filter((n: any) => !n.fecha_baja));
    } catch (err) {
      console.error('Error al cargar negocios:', err);
    }
  };

  const fetchActividades = async () => {
    try {
      const res = await fetch(ACTIVIDADES_URL);
      const data = await res.json();
      setActividades(data.filter((a: any) => !a.fecha_baja));
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    }
  };

  const fetchEstadosTurno = async () => {
    try {
      const negocioId = filtros.negocioId || negocioIdFijo || '6';
      const res = await fetch(`${ESTADOS_TURNO_URL}/negocio/${negocioId}`);
      const data = await res.json();
      setEstadosTurno(data.filter((e: any) => !e.fecha_baja));
    } catch (err) {
      console.error('Error al cargar estados de turno:', err);
    }
  };

  const fetchEstadosPago = async () => {
    try {
      const negocioId = filtros.negocioId || negocioIdFijo || '6';
      const res = await fetch(`${ESTADOS_PAGO_URL}/negocio/${negocioId}`);
      const data = await res.json();
      setEstadosPago(data.filter((e: any) => !e.fecha_baja));
    } catch (err) {
      console.error('Error al cargar estados de pago:', err);
    }
  };

  const cargarActividadesPorNegocio = async (negocioId: number) => {
    setCargandoFiltros(true);
    try {
      const res = await fetch(`${NEGOCIO_ACTIVIDADES_URL}/negocio/${negocioId}`);
      const relaciones = await res.json();
      const actividadIds = relaciones.map((r: any) => r.actividadId);
      const actividadesFiltro = actividades.filter(a => actividadIds.includes(a.id));
      setActividadesFiltradas(actividadesFiltro);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    } finally {
      setCargandoFiltros(false);
    }
  };

  const cargarEspecialidadesPorActividad = async (actividadId: number) => {
    setCargandoFiltros(true);
    try {
      const res = await fetch(`${ACTIVIDAD_ESPECIALIDAD_URL}/por-actividad/${actividadId}`);
      const relaciones = await res.json();
      const especialidadIds = relaciones.map((r: any) => r.especialidadId);
      const especialidadesFiltro = especialidades.filter(e => especialidadIds.includes(e.id));
      setEspecialidadesFiltradas(especialidadesFiltro);
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    } finally {
      setCargandoFiltros(false);
    }
  };

  const cargarCentrosPorEspecialidad = async (negocioId: number, especialidadId: number) => {
    setCargandoFiltros(true);
    try {
      const res = await fetch(`${PROFESIONAL_CENTRO_URL}/centros-por-especialidad/${negocioId}/${especialidadId}`);
      const data = await res.json();
      setCentrosFiltrados(data);
    } catch (err) {
      console.error('Error al cargar centros:', err);
      setCentrosFiltrados([]);
    } finally {
      setCargandoFiltros(false);
    }
  };

  const cargarProfesionalesPorCentro = async (centroId: number, especialidadId: number) => {
    setCargandoFiltros(true);
    try {
      const res = await fetch(`${TURNOS_URL}/profesionales-por-centro-especialidad?centroId=${centroId}&especialidadId=${especialidadId}`);
      const data = await res.json();
      setProfesionalesFiltrados(data);
    } catch (err) {
      console.error('Error al cargar profesionales:', err);
      setProfesionalesFiltrados([]);
    } finally {
      setCargandoFiltros(false);
    }
  };

  const handleFiltroChange = (campo: keyof Filtros, valor: string) => {
    setFiltros({ ...filtros, [campo]: valor });
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      desde: obtenerFechaActual(),
      hasta: obtenerFechaActual(),
      profesionalId: '',
      especialidadId: '',
      actividadId: '',
      negocioId: esModoAdmin ? '' : negocioIdFijo || '',
      centroId: '',
      canalOrigen: '',
      asistio: '',
      estadoTurnoId: '',
      estadoPago: '',
      pacienteSearch: '',
    });
    setPaginaActual(1);
  };

  const handleVerDetalle = (turno: Turno) => {
    setSelectedTurno(turno);
    setModalMode('view');
  };

  const handleCambiarEstado = async (turno: Turno, nuevoEstadoId: number) => {
    const nuevoEstadoNombre = nuevoEstadoId === 1 ? 'RESERVADO' : 'CANCELADO';
    console.log('🔵 handleCambiarEstado - INICIO');
    console.log('   Turno ID:', turno.id);
    console.log('   Nuevo Estado ID:', nuevoEstadoId);
    console.log('   Nuevo Estado Nombre:', nuevoEstadoNombre);
    
    if (!window.confirm(`¿Cambiar estado del turno #${turno.id} a "${nuevoEstadoNombre}"?`)) {
      console.log('❌ Usuario canceló');
      return;
    }
    
    console.log('✅ Confirmado, enviando PUT...');
    
    try {
      const url = `${TURNOS_URL}/${turno.id}?usuario=admin`;
      console.log('   URL:', url);
      
      const body: any = { estadoTurnoId: nuevoEstadoId };
      
      if (nuevoEstadoId === 1 && turno.estadoTurnoId === 2) {
        body.fecha_baja = null;
      }
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      console.log('   Response status:', res.status);
      
      const data = await res.json();
      console.log('   Respuesta completa del backend:', data);
      
      if (!res.ok) throw new Error('Error al cambiar estado');
      
      console.log('✅ PUT exitoso, refrescando turnos...');
      fetchTurnos();
      alert(`Estado cambiado a ${nuevoEstadoNombre}`);
    } catch (err) {
      console.error('❌ Error en handleCambiarEstado:', err);
      alert('No se pudo cambiar el estado');
    }
  };

  const handleCambiarAsistencia = async (turno: Turno) => {
    if (turno.estadoTurnoId === 2) {
      alert('No se puede cambiar la asistencia de un turno cancelado');
      return;
    }
    
    const nuevoAsistio = !turno.asistio;
    const body: any = { asistio: nuevoAsistio };
    
    if (nuevoAsistio === true) {
      body.llegadaAt = new Date().toISOString();
    } else {
      body.llegadaAt = null;
    }
    
    try {
      const res = await fetch(`${TURNOS_URL}/${turno.id}?usuario=admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al cambiar asistencia');
      fetchTurnos();
      alert(`Asistencia cambiada a ${nuevoAsistio ? 'Sí' : 'No'}`);
    } catch (err) {
      console.error(err);
      alert('No se pudo cambiar la asistencia');
    }
  };

  const obtenerColorEstado = (estado: string): string => {
    const found = estadosTurno.find(e => e.nombre === estado);
    return found?.codigoColor || '#000000';
  };

  const turnosFiltrados = turnos;
  const totalPaginas = Math.ceil(turnosFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const turnosPaginados = turnosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  const irAPagina = (pagina: number) => setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));

  // 👈 DETERMINAR QUÉ MOSTRAR EN EL BOTÓN DE WHATSAPP
  const mostrarBotonWhatsApp = !esModoAdmin && slug;
  const tieneAcceso = estadoWhatsApp?.accesoWhatsapp || false;
  const estaActivo = estadoWhatsApp?.activo || false;
  const estadoDefinido = estadoWhatsApp !== null;

  return (
    <div className="tm-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 className="tm-titulo" style={{ marginBottom: 0 }}>
          {esModoAdmin ? '📊 Todos los Turnos' : 'Gestión de Turnos'}
        </h1>
        {/* 👈 BOTÓN DE WHATSAPP DINÁMICO */}
        {mostrarBotonWhatsApp && (
          estadoDefinido ? (
            tieneAcceso ? (
              estaActivo ? (
                <button
                  onClick={handleToggleWhatsApp}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    width="20" 
                    height="20" 
                    fill="white"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Desactivar Notificaciones
                </button>
              ) : (
                <button
                  onClick={handleToggleWhatsApp}
                  style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    width="20" 
                    height="20" 
                    fill="white"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Activar Notificaciones
                </button>
              )
            ) : (
              <button
                onClick={handleSolicitarNotificaciones}
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  width="20" 
                  height="20" 
                  fill="white"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Solicitar Notificaciones
              </button>
            )
          ) : (
            <div style={{ 
              backgroundColor: '#e5e7eb', 
              color: '#6b7280',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⏳</span> Cargando...
            </div>
          )
        )}
      </div>

      {cargandoFiltros && (
        <div className="tm-loading-filtros" style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '8px', marginBottom: '12px' }}>
          <span>Cargando opciones...</span>
        </div>
      )}

      <div className={turnosStyles.filtrosDesktop}>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🏢 Negocio</label>
          <select 
            value={filtros.negocioId} 
            onChange={(e) => handleFiltroChange('negocioId', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={!!negocioIdFijo && !esModoAdmin}
          >
            <option value="">{esModoAdmin ? 'Todos los negocios' : 'Seleccionar...'}</option>
            {negocios.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🎯 Actividad</label>
          <select value={filtros.actividadId} onChange={(e) => handleFiltroChange('actividadId', e.target.value)} className={turnosStyles.filtroInput} disabled={!filtros.negocioId && !esModoAdmin}>
            <option value="">Seleccionar...</option>
            {actividadesFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>📋 Especialidad</label>
          <select value={filtros.especialidadId} onChange={(e) => handleFiltroChange('especialidadId', e.target.value)} className={turnosStyles.filtroInput} disabled={!filtros.actividadId}>
            <option value="">Seleccionar...</option>
            {especialidadesFiltradas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🏥 Centro</label>
          <select value={filtros.centroId} onChange={(e) => handleFiltroChange('centroId', e.target.value)} className={turnosStyles.filtroInput} disabled={!filtros.especialidadId}>
            <option value="">Todos</option>
            {centrosFiltrados.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>👨‍⚕️ Profesional</label>
          <select value={filtros.profesionalId} onChange={(e) => handleFiltroChange('profesionalId', e.target.value)} className={turnosStyles.filtroInput} disabled={!filtros.centroId}>
            <option value="">Todos</option>
            {profesionalesFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>✅ Asistencia</label>
          <select value={filtros.asistio} onChange={(e) => handleFiltroChange('asistio', e.target.value)} className={turnosStyles.filtroInput}>
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className={turnosStyles.accionRow}>
          <button onClick={limpiarFiltros} className={turnosStyles.btnLimpiar}>Limpiar Filtros</button>
        </div>

        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>📅 Desde</label>
          <input type="date" value={filtros.desde} onChange={(e) => handleFiltroChange('desde', e.target.value)} className={`${turnosStyles.filtroInput} ${turnosStyles.filtroFecha}`} />
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>📅 Hasta</label>
          <input type="date" value={filtros.hasta} onChange={(e) => handleFiltroChange('hasta', e.target.value)} className={`${turnosStyles.filtroInput} ${turnosStyles.filtroFecha}`} />
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🔍 Paciente</label>
          <input type="text" value={filtros.pacienteSearch} onChange={(e) => handleFiltroChange('pacienteSearch', e.target.value)} placeholder="Nombre, apellido, email..." className={`${turnosStyles.filtroInput} ${turnosStyles.filtroPaciente}`} />
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🔵 Estado Turno</label>
          <select value={filtros.estadoTurnoId} onChange={(e) => handleFiltroChange('estadoTurnoId', e.target.value)} className={turnosStyles.filtroInput}>
            <option value="">Todos</option>
            {estadosTurno.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>💰 Estado Pago</label>
          <select value={filtros.estadoPago} onChange={(e) => handleFiltroChange('estadoPago', e.target.value)} className={turnosStyles.filtroInput}>
            <option value="">Todos</option>
            {estadosPago.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className={turnosStyles.filtrosMobile}>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>📅 Fecha</label>
            <input 
              id="fechaMovil"
              type="date" 
              value={filtros.desde} 
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                console.log('📅 Fecha seleccionada en móvil:', nuevaFecha);
                setFiltros(prev => ({
                  ...prev,
                  desde: nuevaFecha,
                  hasta: nuevaFecha
                }));
                setPaginaActual(1);
              }} 
              className={turnosStyles.filtroInput} 
            />
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>🔍 Buscar paciente</label>
            <input 
              type="text" 
              value={filtros.pacienteSearch} 
              onChange={(e) => {
                setFiltros(prev => ({ ...prev, pacienteSearch: e.target.value }));
                setPaginaActual(1);
              }} 
              placeholder="Nombre, apellido, email..." 
              className={turnosStyles.filtroInput} 
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="tm-loading"><div className="tm-loading-spinner"></div><p className="tm-loading-texto">Cargando turnos...</p></div>
      ) : (
        <div className="tm-tabla-wrapper">
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner"></div>
          </div>

          <div className={turnosStyles.tmTablaTurnos}>
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PACIENTE</th>
                  <th>FECHA/HORA</th>
                  <th>PROFESIONAL</th>
                  <th>ESPECIALIDAD</th>
                  <th>CENTRO</th>
                  <th>ESTADO</th>
                  <th>ASISTIÓ</th>
                  <th>IMPORTE</th>
                  <th>PAGO</th>
                </tr>
              </thead>
              <tbody>
                {turnosPaginados.map((turno) => {
                  const inactivo = !!turno.fecha_baja;
                  const importeFormateado = formatearImporte(turno.moneda, turno.precioReserva);
                  const fechaHoraFormateada = formatearFechaHora(turno.fechaTurno, turno.horaInicio);
                  
                  return (
                    <tr key={turno.id} className={inactivo ? 'tm-fila-inactiva' : ''}>
                      <td>{turno.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                          <span>{`${turno.usuario.apellido}, ${turno.usuario.nombre}`}</span>
                          <button
                            onClick={() => handleVerDetalle(turno)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginLeft: '4px' }}
                            title="Ver detalle"
                          >
                            🔍
                          </button>
                        </div>
                      </td>
                      <td>{fechaHoraFormateada}</td>
                      <td>{turno.profesionalCentro?.profesional?.nombre || '-'}</td>
                      <td>{turno.profesionalCentro?.especialidad?.nombre || '-'}</td>
                      <td>{turno.profesionalCentro?.centro?.nombre || turno.centro?.nombre || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                          {turno.estadoTurnoId === 1 && (
                            <button
                              onClick={() => turno.asistio === false && handleCambiarEstado(turno, 2)}
                              className={turnosStyles['btn-ocupado']}
                              disabled={turno.asistio === true}
                              style={{
                                opacity: turno.asistio === true ? 0.5 : 1,
                                cursor: turno.asistio === true ? 'not-allowed' : 'pointer'
                              }}
                            >
                              RESERVADO
                            </button>
                          )}
                          {turno.estadoTurnoId === 2 && (
                            <button
                              onClick={() => handleCambiarEstado(turno, 1)}
                              className={turnosStyles['btn-cancelado']}
                            >
                              CANCELADO
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleCambiarAsistencia(turno)}
                          className={turno.asistio ? turnosStyles['btn-asistio-si'] : turnosStyles['btn-asistio-no']}
                          disabled={turno.estadoTurnoId === 2}
                          style={{ 
                            opacity: turno.estadoTurnoId === 2 ? 0.5 : 1,
                            cursor: turno.estadoTurnoId === 2 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {turno.asistio ? 'SÍ' : 'NO'}
                        </button>
                      </td>
                      <td>{importeFormateado}</td>
                      <td>{turno.pagoEstado || 'SIN PAGO'}</td>
                    </tr>
                  );
                })}
                {turnosPaginados.length === 0 && (
                  <tr>
                    <td colSpan={10} className="tm-fila-vacia">
                      No hay turnos que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tm-cards">
            {turnosPaginados.map((turno) => {
              const inactivo = !!turno.fecha_baja;
              const importeFormateado = formatearImporte(turno.moneda, turno.precioReserva);
              const fechaFormateada = formatearFecha(turno.fechaTurno);
              const horaFormateada = formatearHora(turno.horaInicio);
              
              return (
                <div key={turno.id} className={`tm-card-item ${inactivo ? 'inactiva' : ''}`}>
                  <div className="tm-card-nombre">
                    <strong>👤 {`${turno.usuario.apellido}, ${turno.usuario.nombre}`}</strong>
                    <button
                      onClick={() => handleVerDetalle(turno)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', fontSize: '0.9rem' }}
                      title="Ver detalle"
                    >
                      🔍
                    </button>
                  </div>
                  <div className="tm-card-fecha-hora">
                    {fechaFormateada} {horaFormateada}
                  </div>
                  <div className="tm-card-profesional">👨‍⚕️ {turno.profesionalCentro?.profesional?.nombre || '-'}</div>
                  <div className="tm-card-especialidad">📋 {turno.profesionalCentro?.especialidad?.nombre || '-'}</div>
                  <div className="tm-card-centro">🏥 {turno.profesionalCentro?.centro?.nombre || turno.centro?.nombre || '-'}</div>
                  <div className="tm-card-asistencia" style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => handleCambiarAsistencia(turno)}
                      style={{
                        backgroundColor: turno.asistio ? '#00AA00' : '#888888',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        minWidth: '70px',
                        opacity: turno.estadoTurnoId === 2 ? 0.5 : 1,
                        cursor: turno.estadoTurnoId === 2 ? 'not-allowed' : 'pointer'
                      }}
                      disabled={turno.estadoTurnoId === 2}
                    >
                      {turno.asistio ? 'ASISTIÓ' : 'NO ASISTIÓ'}
                    </button>
                  </div>
                </div>
              );
            })}
            {turnosPaginados.length === 0 && (
              <div className="tm-card-item">
                <div className="tm-card-nombre">No hay turnos que coincidan</div>
              </div>
            )}
          </div>
          
          {turnosFiltrados.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">Página {paginaActual} de {totalPaginas} ({turnosFiltrados.length} registros)</span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">Mostrando {turnosPaginados.length} de {turnosFiltrados.length} turnos</div>
        </div>
      )}

      {/* 👈 MODAL PARA SOLICITAR NOTIFICACIONES */}
      {modalWhatsAppAbierto && (
        <div className="tm-modal-overlay" onClick={() => setModalWhatsAppAbierto(false)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">📞 Solicitar Notificaciones por WhatsApp</h3>
            <div className="tm-modal-campo" style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
                Para activar las notificaciones por WhatsApp en tu negocio, 
                comunicate con el equipo de Desarrollo de PWA-Turnos.
              </p>
              <div style={{ 
                marginTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    const mensaje = encodeURIComponent(
                      `Hola, solicito activación de notificaciones por WhatsApp para mi negocio: ${document.querySelector('.tm-titulo')?.textContent || 'Mi Negocio'}`
                    );
                    window.open(`https://wa.me/5491170602543?text=${mensaje}`, '_blank');
                    setModalWhatsAppAbierto(false);
                  }}
                  style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    width="20" 
                    height="20" 
                    fill="white"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contactar por WhatsApp
                </button>
                <button
                  onClick={() => setModalWhatsAppAbierto(false)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {modalMode === 'view' && selectedTurno && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className={`tm-modal ${turnosStyles['tm-modal-turnos']}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Turno #{selectedTurno.id}</h3>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Paciente</span><p className="tm-modal-detalle-valor">{selectedTurno.usuario.apellido}, {selectedTurno.usuario.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Email</span><p className="tm-modal-detalle-valor">{selectedTurno.usuario.email}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Teléfono</span><p className="tm-modal-detalle-valor">{selectedTurno.usuario.telefono || '-'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Fecha/Hora</span><p className="tm-modal-detalle-valor">{formatearFechaHora(selectedTurno.fechaTurno, selectedTurno.horaInicio)}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Duración</span><p className="tm-modal-detalle-valor">{selectedTurno.duracionMinutos} minutos</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Profesional</span><p className="tm-modal-detalle-valor">{selectedTurno.profesionalCentro?.profesional?.nombre || '-'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Especialidad</span><p className="tm-modal-detalle-valor">{selectedTurno.profesionalCentro?.especialidad?.nombre || '-'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Centro</span><p className="tm-modal-detalle-valor">{selectedTurno.profesionalCentro?.centro?.nombre || '-'}</p></div>
            
            {selectedTurno.videollamadaUrl && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">🔗 Videollamada</span>
                <p className="tm-modal-detalle-valor">
                  <a href={selectedTurno.videollamadaUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50', wordBreak: 'break-all' }}>
                    {selectedTurno.videollamadaUrl}
                  </a>
                </p>
              </div>
            )}

            {selectedTurno.timezone && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">🕒 Zona Horaria</span>
                <p className="tm-modal-detalle-valor">{formatearTimezone(selectedTurno.timezone)}</p>
              </div>
            )}
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Importe</span><p className="tm-modal-detalle-valor">{formatearImporte(selectedTurno.moneda, selectedTurno.precioReserva)}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Estado</span><p className="tm-modal-detalle-valor" style={{ color: obtenerColorEstado(selectedTurno.estado) }}>{selectedTurno.estado}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Estado Pago</span><p className="tm-modal-detalle-valor">{selectedTurno.pagoEstado || 'SIN PAGO'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Asistencia</span><p className="tm-modal-detalle-valor">{selectedTurno.asistio ? 'Sí' : 'No'}</p></div>
            {selectedTurno.canalOrigen && <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Canal Origen</span><p className="tm-modal-detalle-valor">{selectedTurno.canalOrigen}</p></div>}
            
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">📧 Email enviado</span>
              <p className="tm-modal-detalle-valor">
                {selectedTurno.emailEnviado ? (
                  <span style={{ color: '#4CAF50' }}>✅ Sí</span>
                ) : (
                  <span style={{ color: '#f44336' }}>❌ No</span>
                )}
              </p>
            </div>
            
            {selectedTurno.ultimoMovimiento && <div className={`tm-modal-detalle-movimiento ${selectedTurno.fecha_baja ? 'inactivo' : 'activo'}`}><span className="tm-modal-detalle-label">Último Movimiento</span><p className="tm-modal-detalle-valor">{selectedTurno.ultimoMovimiento}</p></div>}
            <div className="tm-modal-acciones"><button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cerrar</button></div>
          </div>
        </div>
      )}

      {confirmCancelar && (
        <div className="tm-modal-overlay" onClick={() => setConfirmCancelar(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Cancelar el turno de <strong>{confirmCancelar.usuario.apellido}, {confirmCancelar.usuario.nombre}</strong>?</p>
            <p className="tm-modal-input-hint mb-4">El turno pasará a estado CANCELADO.</p>
            <div className="tm-modal-acciones">
              <button onClick={() => setConfirmCancelar(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={() => handleCambiarEstado(confirmCancelar, 2)} className="tm-btn-danger">Confirmar CANCELACIÓN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
