import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionIcons from './ActionIcons';
import TablaMaestra from './TablaMaestra';
import '../styles/tablas-maestras.css';
import turnosStyles from '../styles/Turnos.module.css';

interface Turno {
  id: number;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  estado: string;
  estadoColor?: string;
  estadoTurnoId?: number;
  pagoEstado: string;
  pagoColor?: string;
  precioReserva: number;
  moneda: string;
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

const API_BASE_URL = import.meta.env.VITE_API_URL;
const TURNOS_URL = `${API_BASE_URL}/turnos`;
const PROFESIONALES_URL = `${API_BASE_URL}/profesionales`;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;
const CENTROS_URL = `${API_BASE_URL}/centros`;
const ESTADOS_TURNO_URL = `${API_BASE_URL}/negocios-estados-turno`;
const ESTADOS_PAGO_URL = `${API_BASE_URL}/negocios-estados-pago`;
const ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const NEGOCIO_ACTIVIDADES_URL = `${API_BASE_URL}/negocio-actividades`;
const ACTIVIDAD_ESPECIALIDAD_URL = `${API_BASE_URL}/actividad-especialidad`;
const PROFESIONAL_CENTRO_URL = `${API_BASE_URL}/profesional-centro`;

const TIPOS_CANAL = ['WEB', 'API', 'RECEPCION', 'APP'];

// Días de la semana en español
const DIAS_SEMANA = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// Formatear fecha con día de semana: "LUN 18/05/26 09:00"
const formatearFechaConDia = (fechaStr: string): string => {
  if (!fechaStr) return '-';
  const fecha = new Date(fechaStr);
  const diaSemana = DIAS_SEMANA[fecha.getDay()];
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear().toString().slice(-2);
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${diaSemana} ${dia}/${mes}/${anio} ${horas}:${minutos}`;
};

// Formatear importe: "ARS $ 1.000,00"
const formatearImporte = (moneda: string, precio: number): string => {
  const precioFormateado = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(precio);
  
  switch (moneda) {
    case 'ARS': return `$ ${precioFormateado}`;
    case 'USD': return `US$ ${precioFormateado}`;
    case 'EUR': return `€ ${precioFormateado}`;
    default: return `${moneda} ${precioFormateado}`;
  }
};

const formatearFechaCorta = (fechaStr: string): string => {
  if (!fechaStr) return '-';
  if (fechaStr.includes('T')) {
    const [fecha] = fechaStr.split('T');
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }
  const [fecha] = fechaStr.split(' ');
  if (!fecha) return fechaStr;
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
};

const formatearHora = (fechaStr: string): string => {
  if (!fechaStr) return '-';
  if (fechaStr.includes('T')) {
    const [, horaPart] = fechaStr.split('T');
    return horaPart.replace('Z', '').substring(0, 5);
  }
  const [, hora] = fechaStr.split(' ');
  return hora || '-';
};

export default function Turnos() {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [modalMode, setModalMode] = useState<'view' | null>(null);
  const [confirmCancelar, setConfirmCancelar] = useState<Turno | null>(null);
  const [cargandoFiltros, setCargandoFiltros] = useState(false);
  
  // Datos para filtros en cascada
  const [profesionalesFiltrados, setProfesionalesFiltrados] = useState<{ id: number; nombre: string }[]>([]);
  const [especialidades, setEspecialidades] = useState<{ id: number; nombre: string }[]>([]);
  const [especialidadesFiltradas, setEspecialidadesFiltradas] = useState<{ id: number; nombre: string }[]>([]);
  const [negocios, setNegocios] = useState<{ id: number; nombre: string }[]>([]);
  const [centrosFiltrados, setCentrosFiltrados] = useState<{ id: number; nombre: string; codigo: string; negocioId: number }[]>([]);
  const [estadosTurno, setEstadosTurno] = useState<{ id: number; nombre: string; codigoColor: string }[]>([]);
  const [estadosPago, setEstadosPago] = useState<{ id: number; nombre: string; codigoColor: string }[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [actividadesFiltradas, setActividadesFiltradas] = useState<Actividad[]>([]);
  
  const [filtros, setFiltros] = useState<Filtros>({
    desde: '',
    hasta: '',
    profesionalId: '',
    especialidadId: '2',  // PSICOLOGIA por defecto
    actividadId: '6',     // SALUD por defecto
    negocioId: '6',       // DEMO por defecto
    centroId: '',
    canalOrigen: '',
    asistio: '',
    estadoTurnoId: '',
    estadoPago: '',
    pacienteSearch: '',
  });
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  // Indica si los filtros de búsqueda están habilitados (solo cuando hay especialidad seleccionada)
  const filtrosBusquedaHabilitados = !!filtros.especialidadId;

  // Cargar datos iniciales y luego cargar turnos automáticamente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setCargandoFiltros(true);
      try {
        await Promise.all([
          fetchEspecialidades(),
          fetchNegocios(),
          fetchActividades(),
          fetchEstadosTurno(),
          fetchEstadosPago(),
        ]);
        // Después de cargar datos básicos, cargar actividades del negocio DEMO
        await cargarActividadesPorNegocio(6);
        // Después de actividades, cargar especialidades de SALUD (actividadId=6)
        await cargarEspecialidadesPorActividad(6);
        // Después de especialidades, cargar centros por especialidad
        await cargarCentrosPorEspecialidad(6, 2);
      } finally {
        setCargandoFiltros(false);
      }
    };
    cargarDatosIniciales();
  }, []);

  // Cargar turnos cuando los filtros de búsqueda están habilitados y hay datos
  useEffect(() => {
    if (filtrosBusquedaHabilitados) {
      fetchTurnos();
    } else {
      setTurnos([]);
    }
  }, [filtros, filtrosBusquedaHabilitados]);

  // Cargar actividades cuando cambia el negocio
  useEffect(() => {
    if (filtros.negocioId) {
      cargarActividadesPorNegocio(parseInt(filtros.negocioId));
      setFiltros(prev => ({ ...prev, actividadId: '', especialidadId: '', centroId: '', profesionalId: '' }));
      setEspecialidadesFiltradas([]);
      setCentrosFiltrados([]);
      setProfesionalesFiltrados([]);
    }
  }, [filtros.negocioId]);

  // Cargar especialidades cuando cambia la actividad
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

  // Cargar centros cuando se tiene especialidad seleccionada
  useEffect(() => {
    if (filtros.negocioId && filtros.especialidadId) {
      cargarCentrosPorEspecialidad(parseInt(filtros.negocioId), parseInt(filtros.especialidadId));
      setFiltros(prev => ({ ...prev, centroId: '', profesionalId: '' }));
      setProfesionalesFiltrados([]);
    } else {
      setCentrosFiltrados([]);
    }
  }, [filtros.negocioId, filtros.especialidadId]);

  // Cargar profesionales cuando se tiene centro seleccionado
  useEffect(() => {
    if (filtros.centroId && filtros.especialidadId) {
      cargarProfesionalesPorCentro(parseInt(filtros.centroId), parseInt(filtros.especialidadId));
      setFiltros(prev => ({ ...prev, profesionalId: '' }));
    } else {
      setProfesionalesFiltrados([]);
    }
  }, [filtros.centroId, filtros.especialidadId]);

  // Cargar estados de turno y pago cuando cambia el negocio
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
      if (filtros.actividadId) params.append('actividadId', filtros.actividadId);
      if (filtros.negocioId) params.append('negocioId', filtros.negocioId);
      if (filtros.centroId) params.append('centroId', filtros.centroId);
      if (filtros.canalOrigen) params.append('canalOrigen', filtros.canalOrigen);
      if (filtros.asistio) params.append('asistio', filtros.asistio);
      if (filtros.estadoTurnoId) params.append('estadoTurnoId', filtros.estadoTurnoId);
      if (filtros.estadoPago) params.append('estadoPago', filtros.estadoPago);
      if (filtros.pacienteSearch) params.append('pacienteSearch', filtros.pacienteSearch);
      
      const url = `${TURNOS_URL}?${params.toString()}`;
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
      const res = await fetch(`${ESTADOS_TURNO_URL}/negocio/${filtros.negocioId}`);
      const data = await res.json();
      setEstadosTurno(data.filter((e: any) => !e.fecha_baja));
    } catch (err) {
      console.error('Error al cargar estados de turno:', err);
    }
  };

  const fetchEstadosPago = async () => {
    try {
      const res = await fetch(`${ESTADOS_PAGO_URL}/negocio/${filtros.negocioId}`);
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
      console.error('Error al cargar actividades del negocio:', err);
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
      console.error('Error al cargar especialidades por actividad:', err);
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
      desde: '',
      hasta: '',
      profesionalId: '',
      especialidadId: '2',
      actividadId: '6',
      negocioId: '6',
      centroId: '',
      canalOrigen: '',
      asistio: '',
      estadoTurnoId: '',
      estadoPago: '',
      pacienteSearch: '',
    });
    setPaginaActual(1);
    setEspecialidadesFiltradas([]);
    setCentrosFiltrados([]);
    setProfesionalesFiltrados([]);
    setActividadesFiltradas([]);
    cargarActividadesPorNegocio(6);
    cargarEspecialidadesPorActividad(6);
    cargarCentrosPorEspecialidad(6, 2);
  };

  const handleVerDetalle = (turno: Turno) => {
    setSelectedTurno(turno);
    setModalMode('view');
  };

  const handleCambiarEstado = async (turno: Turno, nuevoEstadoId: number, nuevoEstadoNombre: string) => {
    if (!window.confirm(`¿Cambiar estado del turno #${turno.id} a "${nuevoEstadoNombre}"?`)) return;
    
    try {
      const res = await fetch(`${TURNOS_URL}/${turno.id}?usuario=admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoTurnoId: nuevoEstadoId }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      fetchTurnos();
      alert(`Estado cambiado a ${nuevoEstadoNombre}`);
    } catch (err) {
      console.error(err);
      alert('No se pudo cambiar el estado');
    }
  };

  const handleCambiarAsistencia = async (turno: Turno) => {
    const nuevoAsistio = !turno.asistio;
    try {
      const res = await fetch(`${TURNOS_URL}/${turno.id}?usuario=admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistio: nuevoAsistio }),
      });
      if (!res.ok) throw new Error('Error al cambiar asistencia');
      fetchTurnos();
      alert(`Asistencia cambiada a ${nuevoAsistio ? 'Sí' : 'No'}`);
    } catch (err) {
      console.error(err);
      alert('No se pudo cambiar la asistencia');
    }
  };

  const handleCambiarPago = async (turno: Turno, nuevoPagoId: number, nuevoPagoNombre: string) => {
    if (!window.confirm(`¿Cambiar estado de pago del turno #${turno.id} a "${nuevoPagoNombre}"?`)) return;
    
    try {
      const res = await fetch(`${TURNOS_URL}/${turno.id}?usuario=admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoPagoId: nuevoPagoId }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado de pago');
      fetchTurnos();
      alert(`Estado de pago cambiado a ${nuevoPagoNombre}`);
    } catch (err) {
      console.error(err);
      alert('No se pudo cambiar el estado de pago');
    }
  };

  const obtenerColorEstado = (estado: string): string => {
    const found = estadosTurno.find(e => e.nombre === estado);
    return found?.codigoColor || '#000000';
  };

  const obtenerColorPago = (pago: string): string => {
    const found = estadosPago.find(e => e.nombre === pago);
    return found?.codigoColor || '#000000';
  };

  const turnosFiltrados = turnos;
  const totalPaginas = Math.ceil(turnosFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const turnosPaginados = turnosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  const irAPagina = (pagina: number) => setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));

  const datosTabla = turnosPaginados.map(t => ({
    ...t,
    id: t.id,
    paciente: `${t.usuario.apellido}, ${t.usuario.nombre}`,
    fechaFormateada: formatearFechaConDia(t.inicio),
    profesionalNombre: t.profesionalCentro?.profesional?.nombre || '-',
    especialidadNombre: t.profesionalCentro?.especialidad?.nombre || '-',
    centroNombre: t.profesionalCentro?.centro?.nombre || t.centro?.nombre || '-',
    estado: t.estado,
    estadoColor: obtenerColorEstado(t.estado),
    estadoTurnoId: t.estadoTurnoId,
    pago: t.pagoEstado || 'SIN PAGO',
    pagoColor: obtenerColorPago(t.pagoEstado || 'SIN PAGO'),
    importe: formatearImporte(t.moneda || 'ARS', t.precioReserva || 0),
    asistio: t.asistio,
    fecha_baja: t.fecha_baja
  }));

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Turnos</h1>

      {cargandoFiltros && (
        <div className="tm-loading-filtros" style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '8px', marginBottom: '12px' }}>
          <span>Cargando opciones...</span>
        </div>
      )}

      {/* FILTROS - PC */}
      <div className={turnosStyles.filtrosDesktop}>
        {/* Primera línea */}
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🏢 Negocio</label>
          <select value={filtros.negocioId} onChange={(e) => handleFiltroChange('negocioId', e.target.value)} className={turnosStyles.filtroInput}>
            <option value="">Seleccionar...</option>
            {negocios.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🎯 Actividad</label>
          <select 
            value={filtros.actividadId} 
            onChange={(e) => handleFiltroChange('actividadId', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={cargandoFiltros || !filtros.negocioId}
          >
            <option value="">Seleccionar actividad...</option>
            {actividadesFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>📋 Especialidad</label>
          <select 
            value={filtros.especialidadId} 
            onChange={(e) => handleFiltroChange('especialidadId', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={cargandoFiltros || !filtros.actividadId}
          >
            <option value="">Seleccionar especialidad...</option>
            {especialidadesFiltradas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🏥 Centro</label>
          <select 
            value={filtros.centroId} 
            onChange={(e) => handleFiltroChange('centroId', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={cargandoFiltros || !filtros.especialidadId}
          >
            <option value="">Todos los centros</option>
            {centrosFiltrados.map(c => (
              <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
            ))}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>👨‍⚕️ Profesional</label>
          <select 
            value={filtros.profesionalId} 
            onChange={(e) => handleFiltroChange('profesionalId', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={cargandoFiltros || !filtros.centroId}
          >
            <option value="">Todos los profesionales</option>
            {profesionalesFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>✅ Asistencia</label>
          <select 
            value={filtros.asistio} 
            onChange={(e) => handleFiltroChange('asistio', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={!filtrosBusquedaHabilitados}
          >
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Segunda línea */}
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>📅 Desde</label>
          <input 
            type="date" 
            value={filtros.desde} 
            onChange={(e) => handleFiltroChange('desde', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={!filtrosBusquedaHabilitados}
          />
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>📅 Hasta</label>
          <input 
            type="date" 
            value={filtros.hasta} 
            onChange={(e) => handleFiltroChange('hasta', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={!filtrosBusquedaHabilitados}
          />
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🔍 Buscar Paciente</label>
          <input
            type="text"
            value={filtros.pacienteSearch}
            onChange={(e) => handleFiltroChange('pacienteSearch', e.target.value)}
            placeholder="Nombre, apellido, email..."
            className={turnosStyles.filtroInput}
            disabled={!filtrosBusquedaHabilitados}
          />
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>🔵 Estado Turno</label>
          <select 
            value={filtros.estadoTurnoId} 
            onChange={(e) => handleFiltroChange('estadoTurnoId', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={!filtrosBusquedaHabilitados}
          >
            <option value="">Todos</option>
            {estadosTurno.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.filtroCampo}>
          <label className={turnosStyles.filtroLabel}>💰 Estado Pago</label>
          <select 
            value={filtros.estadoPago} 
            onChange={(e) => handleFiltroChange('estadoPago', e.target.value)} 
            className={turnosStyles.filtroInput}
            disabled={!filtrosBusquedaHabilitados}
          >
            <option value="">Todos</option>
            {estadosPago.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className={turnosStyles.accionRow}>
          <button onClick={limpiarFiltros} className={turnosStyles.btnLimpiar}>Limpiar Filtros</button>
        </div>
      </div>

      {/* FILTROS - MÓVIL */}
      <div className={turnosStyles.filtrosMobile}>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>🏢 Negocio</label>
            <select value={filtros.negocioId} onChange={(e) => handleFiltroChange('negocioId', e.target.value)} className={turnosStyles.filtroInput}>
              <option value="">Seleccionar...</option>
              {negocios.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>🎯 Actividad</label>
            <select 
              value={filtros.actividadId} 
              onChange={(e) => handleFiltroChange('actividadId', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={cargandoFiltros || !filtros.negocioId}
            >
              <option value="">Seleccionar actividad...</option>
              {actividadesFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>📋 Especialidad</label>
            <select 
              value={filtros.especialidadId} 
              onChange={(e) => handleFiltroChange('especialidadId', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={cargandoFiltros || !filtros.actividadId}
            >
              <option value="">Seleccionar especialidad...</option>
              {especialidadesFiltradas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>🏥 Centro</label>
            <select 
              value={filtros.centroId} 
              onChange={(e) => handleFiltroChange('centroId', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={cargandoFiltros || !filtros.especialidadId}
            >
              <option value="">Todos los centros</option>
              {centrosFiltrados.map(c => (
                <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>👨‍⚕️ Profesional</label>
            <select 
              value={filtros.profesionalId} 
              onChange={(e) => handleFiltroChange('profesionalId', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={cargandoFiltros || !filtros.centroId}
            >
              <option value="">Todos los profesionales</option>
              {profesionalesFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>✅ Asistencia</label>
            <select 
              value={filtros.asistio} 
              onChange={(e) => handleFiltroChange('asistio', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={!filtrosBusquedaHabilitados}
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>📅 Desde</label>
            <input 
              type="date" 
              value={filtros.desde} 
              onChange={(e) => handleFiltroChange('desde', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={!filtrosBusquedaHabilitados}
            />
          </div>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>📅 Hasta</label>
            <input 
              type="date" 
              value={filtros.hasta} 
              onChange={(e) => handleFiltroChange('hasta', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={!filtrosBusquedaHabilitados}
            />
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>🔍 Paciente</label>
            <input
              type="text"
              value={filtros.pacienteSearch}
              onChange={(e) => handleFiltroChange('pacienteSearch', e.target.value)}
              placeholder="Nombre, email..."
              className={turnosStyles.filtroInput}
              disabled={!filtrosBusquedaHabilitados}
            />
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>🔵 Estado Turno</label>
            <select 
              value={filtros.estadoTurnoId} 
              onChange={(e) => handleFiltroChange('estadoTurnoId', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={!filtrosBusquedaHabilitados}
            >
              <option value="">Todos</option>
              {estadosTurno.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div className={turnosStyles.filtroCampo}>
            <label className={turnosStyles.filtroLabel}>💰 Estado Pago</label>
            <select 
              value={filtros.estadoPago} 
              onChange={(e) => handleFiltroChange('estadoPago', e.target.value)} 
              className={turnosStyles.filtroInput}
              disabled={!filtrosBusquedaHabilitados}
            >
              <option value="">Todos</option>
              {estadosPago.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className={turnosStyles.filtrosRow}>
          <div className={turnosStyles.accionRow}>
            <button onClick={limpiarFiltros} className={turnosStyles.btnLimpiar}>Limpiar Filtros</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="tm-loading"><div className="tm-loading-spinner"></div><p className="tm-loading-texto">Cargando turnos...</p></div>
      ) : (
        <div className="tm-tabla-wrapper">
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner">
              <button className="tm-btn-agregar" disabled style={{ opacity: 0.5 }}>
                Turnos
              </button>
            </div>
          </div>

          <TablaMaestra
            columnas={[
              { key: 'id', label: 'ID' },
              { key: 'paciente', label: 'PACIENTE' },
              { key: 'fechaFormateada', label: 'FECHA/HORA' },
              { key: 'profesionalNombre', label: 'PROFESIONAL' },
              { key: 'especialidadNombre', label: 'ESPECIALIDAD' },
              { key: 'centroNombre', label: 'CENTRO' },
              { key: 'estado', label: 'ESTADO', render: (valor, item) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: item.estadoColor, fontWeight: 'bold' }}>{valor}</span>
                  {item.estado === 'OCUPADO' && (
                    <button
                      onClick={() => handleCambiarEstado(item, estadosTurno.find(e => e.nombre === 'CANCELADO')?.id || 0, 'CANCELADO')}
                      className="tm-btn-estado-activo"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    >
                      Cancelar
                    </button>
                  )}
                  {item.estado === 'CANCELADO' && (
                    <button
                      onClick={() => handleCambiarEstado(item, estadosTurno.find(e => e.nombre === 'OCUPADO')?.id || 0, 'OCUPADO')}
                      className="tm-btn-estado-inactivo"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    >
                      Reactivar
                    </button>
                  )}
                </div>
              )},
              { key: 'asistio', label: 'ASISTIÓ', render: (valor, item) => (
                <button
                  onClick={() => handleCambiarAsistencia(item)}
                  style={{
                    backgroundColor: item.asistio ? '#00AA00' : '#888888',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  {item.asistio ? 'Sí' : 'No'}
                </button>
              )},
              { key: 'importe', label: 'IMPORTE' },
              { key: 'pago', label: 'PAGO', render: (valor, item) => (
                <select
                  value={item.pago}
                  onChange={(e) => {
                    const nuevoPago = e.target.value;
                    const pagoId = estadosPago.find(ep => ep.nombre === nuevoPago)?.id;
                    if (pagoId) handleCambiarPago(item, pagoId, nuevoPago);
                  }}
                  style={{ color: item.pagoColor, fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  {estadosPago.map(ep => (
                    <option key={ep.id} value={ep.nombre} style={{ color: ep.codigoColor }}>
                      {ep.nombre}
                    </option>
                  ))}
                </select>
              )},
            ]}
            datos={datosTabla}
            onView={(item) => handleVerDetalle(item)}
            onDelete={(item) => !item.fecha_baja && setConfirmCancelar(item)}
            esInactivo={(item) => !!item.fecha_baja}
            renderCard={(item) => (
              <div className={`tm-card-item ${item.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-nombre"><strong>🆔 TURNO #{item.id}</strong></div>
                <div className="tm-card-paciente">👤 {item.paciente}</div>
                <div className="tm-card-fecha">📅 {formatearFechaCorta(item.inicio)}</div>
                <div className="tm-card-hora">⏰ {formatearHora(item.inicio)}</div>
                <div className="tm-card-profesional">👨‍⚕️ {item.profesionalNombre}</div>
                <div className="tm-card-especialidad">📋 {item.especialidadNombre}</div>
                <div className="tm-card-centro">🏥 {item.centroNombre}</div>
                <div className="tm-card-importe">💰 {item.importe}</div>
                <div className="tm-card-asistencia" style={{ marginTop: '4px' }}>
                  <button
                    onClick={() => handleCambiarAsistencia(item)}
                    style={{
                      backgroundColor: item.asistio ? '#00AA00' : '#888888',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    Asistió: {item.asistio ? 'Sí' : 'No'}
                  </button>
                </div>
                <div className="tm-card-estado" style={{ color: item.estadoColor, marginTop: '4px' }}>
                  🔵 Estado: {item.estado}
                  {item.estado === 'OCUPADO' && (
                    <button
                      onClick={() => handleCambiarEstado(item, estadosTurno.find(e => e.nombre === 'CANCELADO')?.id || 0, 'CANCELADO')}
                      className="tm-btn-estado-activo"
                      style={{ padding: '2px 8px', fontSize: '0.7rem', marginLeft: '8px' }}
                    >
                      Cancelar
                    </button>
                  )}
                  {item.estado === 'CANCELADO' && (
                    <button
                      onClick={() => handleCambiarEstado(item, estadosTurno.find(e => e.nombre === 'OCUPADO')?.id || 0, 'OCUPADO')}
                      className="tm-btn-estado-inactivo"
                      style={{ padding: '2px 8px', fontSize: '0.7rem', marginLeft: '8px' }}
                    >
                      Reactivar
                    </button>
                  )}
                </div>
                <div className="tm-card-pago" style={{ color: item.pagoColor, marginTop: '4px' }}>
                  💰 Pago: {item.pago}
                </div>
                <div className="tm-card-acciones mt-2">
                  <ActionIcons
                    onView={() => handleVerDetalle(item)}
                    onDelete={() => !item.fecha_baja && setConfirmCancelar(item)}
                    showAdd={false}
                    showEdit={false}
                    showDelete={true}
                    showView={true}
                    showSchedule={false}
                    disabledAdd={false}
                    disabledEdit={false}
                    disabledDelete={!!item.fecha_baja}
                    disabledView={false}
                    disabledSchedule={false}
                    size="lg"
                  />
                </div>
              </div>
            )}
          />
          
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

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedTurno && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Turno #{selectedTurno.id}</h3>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Paciente</span><p className="tm-modal-detalle-valor">{selectedTurno.usuario.apellido}, {selectedTurno.usuario.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Email</span><p className="tm-modal-detalle-valor">{selectedTurno.usuario.email}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Teléfono</span><p className="tm-modal-detalle-valor">{selectedTurno.usuario.telefono || '-'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Fecha/Hora</span><p className="tm-modal-detalle-valor">{formatearFechaConDia(selectedTurno.inicio)}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Duración</span><p className="tm-modal-detalle-valor">{selectedTurno.duracionMinutos} minutos</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Profesional</span><p className="tm-modal-detalle-valor">{selectedTurno.profesionalCentro?.profesional?.nombre || '-'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Especialidad</span><p className="tm-modal-detalle-valor">{selectedTurno.profesionalCentro?.especialidad?.nombre || '-'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Centro</span><p className="tm-modal-detalle-valor">{selectedTurno.profesionalCentro?.centro?.nombre || '-'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Importe</span><p className="tm-modal-detalle-valor">{formatearImporte(selectedTurno.monedaselectedTurno.moneda || 'ARS', selectedTurno.precioReserva || 0)}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Estado</span><p className="tm-modal-detalle-valor" style={{ color: obtenerColorEstado(selectedTurno.estado) }}>{selectedTurno.estado}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Estado Pago</span><p className="tm-modal-detalle-valor" style={{ color: obtenerColorPago(selectedTurno.pagoEstado || 'SIN PAGO') }}>{selectedTurno.pagoEstado || 'SIN PAGO'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Asistencia</span><p className="tm-modal-detalle-valor">{selectedTurno.asistio ? 'Sí' : 'No'}</p></div>
            {selectedTurno.canalOrigen && <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Canal Origen</span><p className="tm-modal-detalle-valor">{selectedTurno.canalOrigen}</p></div>}
            {selectedTurno.ultimoMovimiento && (
              <div className={`tm-modal-detalle-movimiento ${selectedTurno.fecha_baja ? 'inactivo' : 'activo'}`}>
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">{selectedTurno.ultimoMovimiento}</p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR CANCELAR */}
      {confirmCancelar && (
        <div className="tm-modal-overlay" onClick={() => setConfirmCancelar(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Cancelar el turno de <strong>{confirmCancelar.usuario.apellido}, {confirmCancelar.usuario.nombre}</strong>?</p>
            <p className="tm-modal-input-hint mb-4">El turno pasará a estado CANCELADO.</p>
            <div className="tm-modal-acciones">
              <button onClick={() => setConfirmCancelar(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={() => handleCambiarEstado(confirmCancelar, estadosTurno.find(e => e.nombre === 'CANCELADO')?.id || 0, 'CANCELADO')} className="tm-btn-danger">Confirmar CANCELACIÓN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
