import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import TablaMaestra from './TablaMaestra';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/tablas-maestras.css';

interface Profesional {
  id: number;
  documento: string;
  nombre: string;
  foto?: string;
  fecha_baja?: string | null;
}

interface Especialidad {
  id: number;
  nombre: string;
  fecha_baja?: string | null;
}

interface Negocio {
  id: number;
  nombre: string;
  url: string;
  fecha_baja?: string | null;
}

interface Centro {
  id: number;
  negocioId: number;
  negocio?: Negocio;
  nombre: string;
  codigo: string;
  es_virtual: boolean;
  whatsapp_e164?: string;
  formatted_address?: string;
  fecha_baja?: string | null;
}

interface Relacion {
  id: number;
  profesionalId: number;
  especialidadId: number;
  centroId: number;
  profesional?: Profesional;
  especialidad?: Especialidad;
  centro?: Centro;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RELACIONES_URL = `${API_BASE_URL}/profesional-centro`;
const PROFESIONALES_URL = `${API_BASE_URL}/profesionales`;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;
const CENTROS_URL = `${API_BASE_URL}/centros`;
const PROFESIONAL_ESPECIALIDAD_URL = `${API_BASE_URL}/profesional-especialidad`;
const ACTIVIDAD_ESPECIALIDAD_URL = `${API_BASE_URL}/actividad-especialidad`;
const NEGOCIO_ACTIVIDADES_URL = `${API_BASE_URL}/negocio-actividades`;

// Avatar por defecto
const AVATAR_VACIO = 'https://via.placeholder.com/96?text=Sin+foto';

export default function ProfesionalCentro() {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negociosFiltrados, setNegociosFiltrados] = useState<Negocio[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [centrosFiltrados, setCentrosFiltrados] = useState<Centro[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRelacion, setSelectedRelacion] = useState<Relacion | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'reactivate' | null>(null);
  
  // Estados para el flujo de creación
  const [documentoBusqueda, setDocumentoBusqueda] = useState('');
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<Profesional | null>(null);
  const [especialidadesDisponibles, setEspecialidadesDisponibles] = useState<Especialidad[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState('');
  const [centroSeleccionado, setCentroSeleccionado] = useState('');
  const [busquedaError, setBusquedaError] = useState('');
  
  // Modal de creación de profesional
  const [showCrearProfesional, setShowCrearProfesional] = useState(false);
  const [nuevoProfesional, setNuevoProfesional] = useState({
    documento: '',
    nombre: '',
    email: '',
    genero: '',
    matricula: '',
    foto: ''
  });
  const [nuevoPhoneValue, setNuevoPhoneValue] = useState<string>();
  const [creandoProfesional, setCreandoProfesional] = useState(false);
  
  // Modal de asignación de especialidad
  const [showAsignarEspecialidad, setShowAsignarEspecialidad] = useState(false);
  const [especialidadAsignar, setEspecialidadAsignar] = useState('');
  const [descripcionAsignar, setDescripcionAsignar] = useState('');
  
  const [confirmDelete, setConfirmDelete] = useState<Relacion | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Relacion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroProfesional, setFiltroProfesional] = useState('');
  const [filtroCentro, setFiltroCentro] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroExpandido, setFiltroExpandido] = useState({ movimiento: false });
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  const tiposMovimiento = ['Altas', 'Bajas'];

  useEffect(() => {
    fetchRelaciones();
    fetchProfesionales();
    fetchEspecialidades();
    fetchNegocios();
    fetchCentros();
  }, []);

  const fetchRelaciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(RELACIONES_URL);
      const data = await res.json();
      setRelaciones(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar relaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesionales = async () => {
    try {
      const res = await fetch(PROFESIONALES_URL);
      const data = await res.json();
      setProfesionales(data.filter((p: Profesional) => !p.fecha_baja));
    } catch (err) {
      console.error('Error al cargar profesionales:', err);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const res = await fetch(ESPECIALIDADES_URL);
      const data = await res.json();
      setEspecialidades(data.filter((e: Especialidad) => !e.fecha_baja));
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  };

  const fetchNegocios = async () => {
    try {
      const res = await fetch(NEGOCIOS_URL);
      const data = await res.json();
      setNegocios(data.filter((n: Negocio) => !n.fecha_baja));
    } catch (err) {
      console.error('Error al cargar negocios:', err);
    }
  };

  const fetchCentros = async () => {
    try {
      const res = await fetch(CENTROS_URL);
      const data = await res.json();
      setCentros(data.filter((c: Centro) => !c.fecha_baja));
    } catch (err) {
      console.error('Error al cargar centros:', err);
    }
  };

  // Filtrar negocios por actividad de especialidad
  const filtrarNegociosPorEspecialidad = async (especialidadId: number) => {
    try {
      // 1. Obtener la actividad de la especialidad
      const actividadRes = await fetch(`${ACTIVIDAD_ESPECIALIDAD_URL}/por-especialidad/${especialidadId}`);
      const actividadesRelacion = await actividadRes.json();
      
      if (!actividadesRelacion || actividadesRelacion.length === 0) {
        setNegociosFiltrados([]);
        setErrorMessage('La especialidad no tiene una actividad asociada');
        return;
      }
      
      const actividadId = actividadesRelacion[0].actividadId;
      
      // 2. Obtener los negocios que tienen esa actividad
      const negocioActividadRes = await fetch(`${NEGOCIO_ACTIVIDADES_URL}/actividad/${actividadId}`);
      const relacionesNegocioActividad = await negocioActividadRes.json();
      
      // 3. Extraer IDs de negocio únicos
      const negocioIds = [...new Set(relacionesNegocioActividad.map((r: any) => r.negocioId))];
      
      // 4. Filtrar la lista de negocios cargada
      const negociosFiltradosLista = negocios.filter(n => negocioIds.includes(n.id));
      setNegociosFiltrados(negociosFiltradosLista);
      
      if (negociosFiltradosLista.length === 0) {
        setErrorMessage('No hay negocios que ofrezcan la actividad requerida para esta especialidad');
      } else {
        setErrorMessage(null);
      }
    } catch (err) {
      console.error('Error filtrando negocios:', err);
      setNegociosFiltrados([]);
      setErrorMessage('Error al cargar negocios disponibles');
    }
  };

  const cargarEspecialidadesDelProfesional = async (profesionalId: number) => {
    try {
      const res = await fetch(`${PROFESIONAL_ESPECIALIDAD_URL}/por-profesional/${profesionalId}`);
      const data = await res.json();
      const ids = data.map((pe: any) => pe.especialidadId);
      const espFiltradas = especialidades.filter(e => ids.includes(e.id));
      setEspecialidadesDisponibles(espFiltradas);
      return espFiltradas.length > 0;
    } catch (err) {
      console.error('Error cargando especialidades:', err);
      setEspecialidadesDisponibles([]);
      return false;
    }
  };

  const buscarProfesional = async () => {
    if (!documentoBusqueda.trim()) {
      setBusquedaError('Ingrese un documento para buscar');
      return;
    }

    try {
      const res = await fetch(PROFESIONALES_URL);
      const data = await res.json();
      const encontrado = data.find((p: Profesional) => p.documento === documentoBusqueda && !p.fecha_baja);
      
      if (encontrado) {
        setProfesionalSeleccionado(encontrado);
        setBusquedaError('');
        const tieneEspecialidades = await cargarEspecialidadesDelProfesional(encontrado.id);
        if (!tieneEspecialidades) {
          setErrorMessage('El profesional no tiene especialidades asignadas. Debe asignarle una especialidad.');
        }
      } else {
        setProfesionalSeleccionado(null);
        setBusquedaError('Profesional no encontrado. ¿Desea crearlo?');
      }
    } catch (err) {
      console.error('Error al buscar profesional:', err);
      setBusquedaError('Error al buscar profesional');
    }
  };

  const handleCrearProfesional = async () => {
    if (!nuevoProfesional.documento.trim() || !nuevoProfesional.nombre.trim() || !nuevoProfesional.email.trim() || !nuevoPhoneValue) {
      setErrorMessage('Complete todos los campos obligatorios');
      return;
    }

    setCreandoProfesional(true);
    try {
      const { country_code, national_number } = parsePhoneE164(nuevoPhoneValue);
      const res = await fetch(PROFESIONALES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento: nuevoProfesional.documento,
          nombre: nuevoProfesional.nombre.toUpperCase(),
          email: nuevoProfesional.email,
          country_code,
          national_number,
          genero: nuevoProfesional.genero || null,
          matricula: nuevoProfesional.matricula || null,
          foto: nuevoProfesional.foto || null
        }),
      });
      
      if (!res.ok) throw new Error('Error al crear profesional');
      
      const nuevo = await res.json();
      setProfesionalSeleccionado(nuevo);
      setShowCrearProfesional(false);
      setNuevoProfesional({ documento: '', nombre: '', email: '', genero: '', matricula: '', foto: '' });
      setNuevoPhoneValue(undefined);
      await fetchProfesionales();
      const tieneEspecialidades = await cargarEspecialidadesDelProfesional(nuevo.id);
      if (!tieneEspecialidades) {
        setErrorMessage('El profesional no tiene especialidades asignadas. Debe asignarle una especialidad.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al crear profesional');
    } finally {
      setCreandoProfesional(false);
    }
  };

  const handleAsignarEspecialidad = async () => {
    if (!especialidadAsignar) {
      setErrorMessage('Debe seleccionar una especialidad');
      return;
    }

    try {
      const res = await fetch(PROFESIONAL_ESPECIALIDAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profesionalId: profesionalSeleccionado?.id,
          especialidadId: parseInt(especialidadAsignar),
          descripcion: descripcionAsignar || null
        }),
      });
      
      if (!res.ok) throw new Error('Error al asignar especialidad');
      
      setShowAsignarEspecialidad(false);
      setEspecialidadAsignar('');
      setDescripcionAsignar('');
      await cargarEspecialidadesDelProfesional(profesionalSeleccionado!.id);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al asignar especialidad');
    }
  };

  const actualizarCentrosPorNegocio = (negocioId: string) => {
    if (!negocioId) {
      setCentrosFiltrados([]);
      return;
    }
    const filtrados = centros.filter(c => c.negocioId === parseInt(negocioId));
    setCentrosFiltrados(filtrados);
  };

  const obtenerAvatar = (profesional?: Profesional) => {
    if (!profesional) return <img src={AVATAR_VACIO} alt="Sin foto" className="w-8 h-8 rounded-full object-cover" />;
    if (profesional.foto) {
      return (
        <img 
          src={profesional.foto} 
          alt={profesional.nombre} 
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = AVATAR_VACIO; }}
        />
      );
    }
    return <img src={AVATAR_VACIO} alt={profesional.nombre} className="w-8 h-8 rounded-full object-cover" />;
  };

  const parsePhoneE164 = (phone: string | undefined) => {
    if (!phone) return { country_code: null, national_number: '' };
    const match = phone.match(/^\+(\d{1,3})(\d+)$/);
    if (match) {
      return { country_code: parseInt(match[1], 10), national_number: match[2] };
    }
    return { country_code: null, national_number: '' };
  };

  const obtenerTipoMovimiento = (r: Relacion): string => {
    if (r.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarRelaciones = () => {
    return relaciones.filter(r => {
      if (filtroProfesional && !r.profesional?.nombre.toLowerCase().includes(filtroProfesional.toLowerCase())) return false;
      if (filtroCentro && !r.centro?.nombre.toLowerCase().includes(filtroCentro.toLowerCase())) return false;
      const tipo = obtenerTipoMovimiento(r);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;
      if (fechaDesde && r.fecha_alta) {
        const fechaAlta = new Date(r.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && r.fecha_alta) {
        const fechaAlta = new Date(r.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }
      return true;
    });
  };

  const relacionesFiltradas = filtrarRelaciones();
  const totalPaginas = Math.ceil(relacionesFiltradas.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const relacionesPaginadas = relacionesFiltradas
    .sort((a, b) => (a.id || 0) - (b.id || 0))
    .slice(indicePrimerItem, indiceUltimoItem);

  const irAPagina = (pagina: number) => setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
  const toggleMovimiento = (mov: string) => {
    setFiltroTipoMovimiento(prev => prev.includes(mov) ? prev.filter(m => m !== mov) : [...prev, mov]);
    setPaginaActual(1);
  };
  const toggleTodosMovimientos = () => {
    setFiltroTipoMovimiento(filtroTipoMovimiento.length === tiposMovimiento.length ? [] : [...tiposMovimiento]);
    setPaginaActual(1);
  };

  const handleAgregar = () => {
    setDocumentoBusqueda('');
    setProfesionalSeleccionado(null);
    setEspecialidadSeleccionada('');
    setNegocioSeleccionado('');
    setCentroSeleccionado('');
    setEspecialidadesDisponibles([]);
    setNegociosFiltrados([]);
    setCentrosFiltrados([]);
    setBusquedaError('');
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleVerDetalle = (relacion: Relacion) => {
    setSelectedRelacion(relacion);
    setModalMode('view');
  };

  const handleEliminar = (relacion: Relacion) => setConfirmDelete(relacion);
  const handleReactivar = (relacion: Relacion) => relacion.fecha_baja && setConfirmReactivar(relacion);

  const guardarRelacion = async () => {
    if (!profesionalSeleccionado) {
      setErrorMessage('Debe seleccionar un profesional');
      return;
    }
    if (!especialidadSeleccionada) {
      setErrorMessage('Debe seleccionar una especialidad');
      return;
    }
    if (!centroSeleccionado) {
      setErrorMessage('Debe seleccionar un centro');
      return;
    }

    try {
      const res = await fetch(RELACIONES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profesionalId: profesionalSeleccionado.id,
          especialidadId: parseInt(especialidadSeleccionada),
          centroId: parseInt(centroSeleccionado)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar la relación');
      }

      setModalMode(null);
      setDocumentoBusqueda('');
      setProfesionalSeleccionado(null);
      setEspecialidadSeleccionada('');
      setNegocioSeleccionado('');
      setCentroSeleccionado('');
      setNegociosFiltrados([]);
      setErrorMessage(null);
      fetchRelaciones();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar la relación');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${RELACIONES_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Error al eliminar relación');
      setConfirmDelete(null);
      fetchRelaciones();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la relación');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;
    try {
      const res = await fetch(`${RELACIONES_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profesionalId: confirmReactivar.profesionalId,
          especialidadId: confirmReactivar.especialidadId,
          centroId: confirmReactivar.centroId,
          fecha_baja: null,
          usuario_baja: null
        }),
      });
      if (!res.ok) throw new Error('Error al reactivar relación');
      setConfirmReactivar(null);
      fetchRelaciones();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar la relación');
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroProfesional('');
    setFiltroCentro('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  // Preparar datos para TablaMaestra (INCLUYENDO profesional para el avatar)
  const datosTabla = relacionesPaginadas.map(r => ({
    ...r,
    profesional: r.profesional,  // ← CLAVE: incluir el objeto profesional
    documento: r.profesional?.documento || '-',
    profesionalNombre: r.profesional?.nombre || '-',
    especialidadNombre: r.especialidad?.nombre || '-',
    urlNegocio: r.centro?.negocio?.url || '-',
    codigoCentro: r.centro?.codigo || '-',
    centroNombre: r.centro?.nombre || '-',
    whatsapp: r.centro?.whatsapp_e164 || '-',
    domicilio: r.centro?.es_virtual ? 'Virtual' : (r.centro?.formatted_address?.substring(0, 40) || '-'),
    estado: r.fecha_baja ? 'Inactivo' : 'Activo'
  }));

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Profesional ↔ Centro</h1>

      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Profesional</label>
            <input type="text" value={filtroProfesional} onChange={(e) => { setFiltroProfesional(e.target.value); setPaginaActual(1); }} placeholder="Buscar profesional..." className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Centro</label>
            <input type="text" value={filtroCentro} onChange={(e) => { setFiltroCentro(e.target.value); setPaginaActual(1); }} placeholder="Buscar centro..." className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Fecha Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPaginaActual(1); }} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Fecha Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPaginaActual(1); }} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo tm-filtro-movimiento">
            <label className="tm-filtro-label">Movimiento</label>
            <div className="tm-filtro-dropdown">
              <button onClick={() => setFiltroExpandido(prev => ({ ...prev, movimiento: !prev.movimiento }))} className="tm-filtro-dropdown-btn">
                <span>{filtroTipoMovimiento.length === 0 ? 'Todos' : `${filtroTipoMovimiento.length} selec`}</span><span>▼</span>
              </button>
              {filtroExpandido.movimiento && (
                <div className="tm-filtro-dropdown-menu">
                  <label className="tm-filtro-checkbox-label">
                    <input type="checkbox" checked={filtroTipoMovimiento.length === tiposMovimiento.length} onChange={toggleTodosMovimientos} />
                    <span>Todos</span>
                  </label>
                  <div className="tm-filtro-dropdown-lista">
                    {tiposMovimiento.map(mov => (
                      <label key={mov} className="tm-filtro-checkbox-label">
                        <input type="checkbox" checked={filtroTipoMovimiento.includes(mov)} onChange={() => toggleMovimiento(mov)} />
                        <span className={mov === 'Altas' ? 'text-green-600' : 'text-red-600'}>{mov}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="tm-filtro-accion"><button onClick={limpiarFiltros} className="tm-btn-limpiar">Limpiar Filtros</button></div>
        </div>
      </div>

      {loading ? (
        <div className="tm-loading"><div className="tm-loading-spinner"></div><p className="tm-loading-texto">Cargando...</p></div>
      ) : (
        <div className="tm-tabla-wrapper">
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner">
              <button onClick={handleAgregar} className="tm-btn-agregar">
                Asignar Profesional a Centro
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          <TablaMaestra
            columnas={[
              { key: 'documento', label: 'DOCUMENTO' },
              { key: 'profesionalNombre', label: 'PROFESIONAL' },
              { key: 'especialidadNombre', label: 'ESPECIALIDAD' },
              { key: 'urlNegocio', label: 'URL NEGOCIO' },
              { key: 'codigoCentro', label: 'CÓDIGO' },
              { key: 'centroNombre', label: 'CENTRO' },
              { key: 'whatsapp', label: 'WHATSAPP' },
              { key: 'domicilio', label: 'DOMICILIO' },
              { key: 'estado', label: 'ESTADO' }
            ]}
            datos={datosTabla}
            avatar={(item) => obtenerAvatar(item.profesional)}
            onAdd={(item) => item.fecha_baja && handleReactivar(item)}
            onEdit={undefined}
            onDelete={(item) => !item.fecha_baja && handleEliminar(item)}
            onView={(item) => handleVerDetalle(item)}
            esInactivo={(item) => item.fecha_baja}
          />
          
          {relacionesFiltradas.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">Página {paginaActual} de {totalPaginas} ({relacionesFiltradas.length} registros)</span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">Mostrando {relacionesPaginadas.length} de {relacionesFiltradas.length} relaciones</div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Asignar Profesional a Centro</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            {/* PASO 1: Buscar profesional */}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Documento del Profesional *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={documentoBusqueda}
                  onChange={(e) => setDocumentoBusqueda(e.target.value)}
                  placeholder="DNI / CUIT / CUIL"
                  className="tm-modal-input flex-1"
                />
                <button
                  type="button"
                  onClick={buscarProfesional}
                  className="tm-btn-secundario"
                >
                  Buscar
                </button>
              </div>
              {busquedaError && (
                <div className="text-sm mt-1">
                  <span className="text-red-600">{busquedaError}</span>
                  {busquedaError.includes('¿Desea crearlo?') && (
                    <button
                      onClick={() => setShowCrearProfesional(true)}
                      className="ml-2 text-blue-600 underline"
                    >
                      Crear profesional
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profesional seleccionado */}
            {profesionalSeleccionado && (
              <div className="tm-modal-campo bg-gray-50 p-2 rounded">
                <div className="flex items-center gap-3">
                  {obtenerAvatar(profesionalSeleccionado)}
                  <div>
                    <p className="font-semibold">{profesionalSeleccionado.nombre}</p>
                    <p className="text-sm text-gray-500">Documento: {profesionalSeleccionado.documento}</p>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: Seleccionar especialidad */}
            {profesionalSeleccionado && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Especialidad *</label>
                {especialidadesDisponibles.length > 0 ? (
                  <select
                    value={especialidadSeleccionada}
                    onChange={async (e) => {
                      const espId = e.target.value;
                      setEspecialidadSeleccionada(espId);
                      setNegocioSeleccionado('');
                      setCentroSeleccionado('');
                      setCentrosFiltrados([]);
                      if (espId) {
                        await filtrarNegociosPorEspecialidad(parseInt(espId));
                      } else {
                        setNegociosFiltrados([]);
                      }
                    }}
                    className="tm-modal-input"
                    required
                  >
                    <option value="">Seleccionar especialidad...</option>
                    {especialidadesDisponibles.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-amber-600">
                    No tiene especialidades asignadas.
                    <button
                      onClick={() => setShowAsignarEspecialidad(true)}
                      className="ml-2 text-blue-600 underline"
                    >
                      Asignar especialidad
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PASO 3: Seleccionar negocio - AHORA FILTRADO */}
            {profesionalSeleccionado && especialidadesDisponibles.length > 0 && especialidadSeleccionada && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Negocio *</label>
                <select
                  value={negocioSeleccionado}
                  onChange={(e) => {
                    setNegocioSeleccionado(e.target.value);
                    setCentroSeleccionado('');
                    actualizarCentrosPorNegocio(e.target.value);
                  }}
                  className="tm-modal-input"
                  required
                >
                  <option value="">Seleccionar negocio...</option>
                  {negociosFiltrados.map(n => (
                    <option key={n.id} value={n.id}>{n.nombre} ({n.url})</option>
                  ))}
                </select>
                {negociosFiltrados.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">No hay negocios disponibles para esta especialidad</p>
                )}
              </div>
            )}

            {/* PASO 4: Seleccionar centro */}
            {negocioSeleccionado && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Centro *</label>
                <select
                  value={centroSeleccionado}
                  onChange={(e) => setCentroSeleccionado(e.target.value)}
                  className="tm-modal-input"
                  required
                >
                  <option value="">Seleccionar centro...</option>
                  {centrosFiltrados.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.nombre} {c.es_virtual ? '(Virtual)' : ''}
                    </option>
                  ))}
                </select>
                {centrosFiltrados.length === 0 && negocioSeleccionado && (
                  <p className="text-sm text-amber-600 mt-1">Este negocio no tiene centros disponibles</p>
                )}
              </div>
            )}

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button 
                onClick={guardarRelacion} 
                className="tm-btn-primario"
                disabled={!profesionalSeleccionado || !especialidadSeleccionada || !centroSeleccionado}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedRelacion && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Asignación</h3>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">ID</span><p className="tm-modal-detalle-valor">{selectedRelacion.id}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Profesional</span><p className="tm-modal-detalle-valor">{selectedRelacion.profesional?.nombre} ({selectedRelacion.profesional?.documento})</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Especialidad</span><p className="tm-modal-detalle-valor">{selectedRelacion.especialidad?.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Centro</span><p className="tm-modal-detalle-valor">{selectedRelacion.centro?.nombre} ({selectedRelacion.centro?.codigo})</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Negocio</span><p className="tm-modal-detalle-valor">{selectedRelacion.centro?.negocio?.nombre}</p></div>
            <div className={`tm-modal-detalle-movimiento ${selectedRelacion.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">{selectedRelacion.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}</p>
            </div>
            <div className="tm-modal-acciones"><button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cerrar</button></div>
          </div>
        </div>
      )}

      {/* MODAL CREAR PROFESIONAL */}
      {showCrearProfesional && (
        <div className="tm-modal-overlay" onClick={() => setShowCrearProfesional(false)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Crear Nuevo Profesional</h3>
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Documento *</label>
              <input
                type="text"
                value={nuevoProfesional.documento}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, documento: e.target.value })}
                placeholder="DNI / CUIT / CUIL"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={nuevoProfesional.nombre}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, nombre: e.target.value.toUpperCase() })}
                placeholder="Nombre completo"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Email *</label>
              <input
                type="email"
                value={nuevoProfesional.email}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, email: e.target.value })}
                placeholder="ejemplo@mail.com"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Género</label>
              <select
                value={nuevoProfesional.genero}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, genero: e.target.value })}
                className="tm-modal-input"
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="X">No Binario</option>
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">WhatsApp *</label>
              <PhoneInput
                international
                defaultCountry="AR"
                value={nuevoPhoneValue}
                onChange={setNuevoPhoneValue}
                className="tm-phone-input"
                limitMaxLength={true}
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Matrícula</label>
              <input
                type="text"
                value={nuevoProfesional.matricula}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, matricula: e.target.value })}
                placeholder="Opcional"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Foto (URL)</label>
              <input
                type="text"
                value={nuevoProfesional.foto}
                onChange={(e) => setNuevoProfesional({ ...nuevoProfesional, foto: e.target.value })}
                placeholder="https://ejemplo.com/foto.jpg"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setShowCrearProfesional(false)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={handleCrearProfesional} className="tm-btn-primario" disabled={creandoProfesional}>
                {creandoProfesional ? 'Creando...' : 'Crear Profesional'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR ESPECIALIDAD */}
      {showAsignarEspecialidad && (
        <div className="tm-modal-overlay" onClick={() => setShowAsignarEspecialidad(false)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Asignar Especialidad a {profesionalSeleccionado?.nombre}</h3>
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Especialidad *</label>
              <select
                value={especialidadAsignar}
                onChange={(e) => setEspecialidadAsignar(e.target.value)}
                className="tm-modal-input"
                required
              >
                <option value="">Seleccionar especialidad...</option>
                {especialidades.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Descripción</label>
              <textarea
                value={descripcionAsignar}
                onChange={(e) => setDescripcionAsignar(e.target.value)}
                placeholder="Descripción de la especialidad para este profesional (opcional)"
                className="tm-modal-input tm-input-descripcion"
                rows={3}
              />
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setShowAsignarEspecialidad(false)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={handleAsignarEspecialidad} className="tm-btn-primario">Asignar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR BAJA */}
      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Desactivar la asignación de <strong>{confirmDelete.profesional?.nombre}</strong> ({confirmDelete.especialidad?.nombre}) en el centro <strong>{confirmDelete.centro?.nombre}</strong>?</p>
            <p className="tm-modal-input-hint mb-4">El registro pasará a estado inactivo.</p>
            <div className="tm-modal-acciones">
              <button onClick={() => setConfirmDelete(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={confirmarEliminar} className="tm-btn-danger">Confirmar BAJA</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR REACTIVAR */}
      {confirmReactivar && (
        <div className="tm-modal-overlay" onClick={() => setConfirmReactivar(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Reactivar la asignación de <strong>{confirmReactivar.profesional?.nombre}</strong> ({confirmReactivar.especialidad?.nombre}) en el centro <strong>{confirmReactivar.centro?.nombre}</strong>?</p>
            <p className="tm-modal-input-hint mb-4">El registro volverá a estado activo.</p>
            <div className="tm-modal-acciones">
              <button onClick={() => setConfirmReactivar(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={confirmarReactivar} className="tm-btn-success">Confirmar ALTA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
