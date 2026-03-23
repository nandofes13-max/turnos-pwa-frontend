import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

interface Relacion {
  id: number;
  actividad_id: number;
  especialidad_id: number;
  actividad?: { id: number; nombre: string };
  especialidad?: { id: number; nombre: string };
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

interface Actividad {
  id: number;
  nombre: string;
  fecha_baja?: string | null;
}

interface Especialidad {
  id: number;
  nombre: string;
  fecha_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RELACIONES_URL = `${API_BASE_URL}/actividad-especialidad`;
const ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;

export default function ActividadEspecialidad() {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedRelacion, setSelectedRelacion] = useState<Relacion | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ actividadId: '', especialidadId: '' });
  const [confirmDelete, setConfirmDelete] = useState<Relacion | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Relacion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroActividad, setFiltroActividad] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroExpandido, setFiltroExpandido] = useState({ movimiento: false });
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  const tiposMovimiento = ['Altas', 'Bajas'];

  useEffect(() => {
    fetchRelaciones();
    fetchActividades();
    fetchEspecialidades();
  }, []);

  const fetchRelaciones = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(RELACIONES_URL);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const data = await res.json();
      setRelaciones(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar relaciones:', err);
      setFetchError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchActividades = async () => {
    try {
      const res = await fetch(ACTIVIDADES_URL);
      const data = await res.json();
      setActividades(data.filter((a: Actividad) => !a.fecha_baja));
    } catch (err) {
      console.error('Error al cargar actividades:', err);
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

  const especialidadYaAsignada = (especialidadId: number): boolean => {
    if (!formData.actividadId) return false;
    const actividadIdNum = parseInt(formData.actividadId);
    return relaciones.some(r => 
      r.actividad_id === actividadIdNum && 
      r.especialidad_id === especialidadId
    );
  };

  const obtenerTipoMovimiento = (r: Relacion): string => r.fecha_baja ? 'Bajas' : 'Altas';

  const filtrarRelaciones = () => {
    return relaciones.filter(r => {
      if (filtroActividad && !r.actividad?.nombre.toLowerCase().includes(filtroActividad.toLowerCase())) return false;
      if (filtroEspecialidad && !r.especialidad?.nombre.toLowerCase().includes(filtroEspecialidad.toLowerCase())) return false;
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

  const handleAgregar = async () => {
    // Recargar relaciones antes de abrir el modal
    setLoading(true);
    try {
      const res = await fetch(RELACIONES_URL);
      if (res.ok) {
        const data = await res.json();
        setRelaciones(data);
      }
    } catch (err) {
      console.error('Error recargando relaciones:', err);
    } finally {
      setLoading(false);
    }
    setFormData({ actividadId: '', especialidadId: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleVerDetalle = (relacion: Relacion) => {
    setSelectedRelacion(relacion);
    setModalMode('view');
  };

  const handleEliminar = (relacion: Relacion) => setConfirmDelete(relacion);
  const handleReactivar = (relacion: Relacion) => relacion.fecha_baja && setConfirmReactivar(relacion);

  const validarFormulario = (): boolean => {
    if (!formData.actividadId) {
      setErrorMessage('Debe seleccionar una actividad');
      return false;
    }
    if (!formData.especialidadId) {
      setErrorMessage('Debe seleccionar una especialidad');
      return false;
    }
    return true;
  };

  const guardarRelacion = async () => {
    if (!validarFormulario()) return;
    
    const actividadIdNum = parseInt(formData.actividadId);
    const especialidadIdNum = parseInt(formData.especialidadId);
    
    const yaExiste = relaciones.some(r => 
      r.actividad_id === actividadIdNum && 
      r.especialidad_id === especialidadIdNum
    );
    
    if (yaExiste) {
      setErrorMessage('Esta especialidad ya está vinculada a esta actividad');
      return;
    }
    
    try {
      const res = await fetch(RELACIONES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actividadId: actividadIdNum,
          especialidadId: especialidadIdNum
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar relación');
      }
      setModalMode(null);
      setSelectedRelacion(null);
      setFormData({ actividadId: '', especialidadId: '' });
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
          actividadId: confirmReactivar.actividad_id,
          especialidadId: confirmReactivar.especialidad_id,
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
    setFiltroActividad('');
    setFiltroEspecialidad('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Actividad ↔ Especialidad</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo tm-filtro-actividad">
            <label className="tm-filtro-label">Actividad</label>
            <input type="text" value={filtroActividad} onChange={(e) => { setFiltroActividad(e.target.value); setPaginaActual(1); }} placeholder="Buscar actividad..." className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo tm-filtro-especialidad">
            <label className="tm-filtro-label">Especialidad</label>
            <input type="text" value={filtroEspecialidad} onChange={(e) => { setFiltroEspecialidad(e.target.value); setPaginaActual(1); }} placeholder="Buscar especialidad..." className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo tm-filtro-fecha">
            <label className="tm-filtro-label">Fecha Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPaginaActual(1); }} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo tm-filtro-fecha">
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
                  <label className="tm-filtro-checkbox-label"><input type="checkbox" checked={filtroTipoMovimiento.length === tiposMovimiento.length} onChange={toggleTodosMovimientos} /><span>Todos</span></label>
                  <div className="tm-filtro-dropdown-lista">
                    {tiposMovimiento.map(mov => (
                      <label key={mov} className="tm-filtro-checkbox-label"><input type="checkbox" checked={filtroTipoMovimiento.includes(mov)} onChange={() => toggleMovimiento(mov)} /><span className={mov === 'Altas' ? 'text-green-600' : 'text-red-600'}>{mov}</span></label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="tm-filtro-accion"><button onClick={limpiarFiltros} className="tm-btn-limpiar">Limpiar Filtros</button></div>
        </div>
      </div>

      {fetchError && (<div className="tm-error"><p>Error al cargar datos: {fetchError}</p><button onClick={fetchRelaciones} className="tm-btn-secundario">Reintentar</button></div>)}

      {loading ? (
        <div className="tm-loading"><div className="tm-loading-spinner"></div><p className="tm-loading-texto">Cargando...</p></div>
      ) : (
        <div className="tm-tabla-wrapper">
          <div className="tm-tabla-header-contenedor"><div className="tm-tabla-header-inner"><button onClick={handleAgregar} className="tm-btn-agregar">Asignar Especialidad a Actividad<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></button></div></div>

          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>前后<th>ACTIVIDAD</th><th>ESPECIALIDAD</th><th>ESTADO</th><th>ACCIONES</th></thead>
              <tbody>
                {relacionesPaginadas.map(r => (
                  <tr key={r.id} className={r.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td>{r.actividad?.nombre || `ID: ${r.actividad_id}`}</td>
                    <td>{r.especialidad?.nombre || `ID: ${r.especialidad_id}`}</td>
                    <td>{r.fecha_baja ? <span className="text-red-600">Inactivo</span> : <span className="text-green-600">Activo</span>}</td>
                    <td><ActionIcons onAdd={() => r.fecha_baja ? handleReactivar(r) : null} onEdit={null} onDelete={() => !r.fecha_baja && handleEliminar(r)} onView={() => handleVerDetalle(r)} showAdd={true} showEdit={false} showDelete={true} showView={true} disabledAdd={!r.fecha_baja} disabledEdit={true} disabledDelete={!!r.fecha_baja} disabledView={false} size="md" /></td>
                  </tr>
                ))}
                {relacionesPaginadas.length === 0 && (<tr><td colSpan={4} className="tm-fila-vacia">No hay relaciones que coincidan</td></tr>)}
              </tbody>
            </table>
          </div>

          <div className="tm-cards">
            {relacionesPaginadas.map(r => (
              <div key={`card-${r.id}`} className={`tm-card-item ${r.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-actividad"><strong>{r.actividad?.nombre || `Actividad ${r.actividad_id}`}</strong></div>
                <div className="tm-card-especialidad">Especialidad: <strong>{r.especialidad?.nombre || `ID ${r.especialidad_id}`}</strong></div>
                <div className="tm-card-estado">Estado: {r.fecha_baja ? 'Inactivo' : 'Activo'}</div>
                <div className="tm-card-acciones"><ActionIcons onAdd={() => r.fecha_baja ? handleReactivar(r) : null} onEdit={null} onDelete={() => !r.fecha_baja && handleEliminar(r)} onView={() => handleVerDetalle(r)} showAdd={true} showEdit={false} showDelete={true} showView={true} disabledAdd={!r.fecha_baja} disabledEdit={true} disabledDelete={!!r.fecha_baja} disabledView={false} size="lg" /></div>
              </div>
            ))}
          </div>
          
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
            <h3 className="tm-modal-titulo">Asignar Especialidad a Actividad</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Actividad *</label>
              <select 
                value={formData.actividadId} 
                onChange={(e) => {
                  setFormData({ actividadId: e.target.value, especialidadId: '' });
                  setErrorMessage(null);
                }} 
                className="tm-modal-input" 
                required
              >
                <option value="">Seleccionar actividad...</option>
                {actividades.map(a => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Especialidad *</label>
              <select
                value={formData.especialidadId}
                onChange={(e) => setFormData({ ...formData, especialidadId: e.target.value })}
                className="tm-modal-input"
                required
              >
                <option value="">Seleccionar especialidad...</option>
                {especialidades
                  .filter(e => !especialidadYaAsignada(e.id))
                  .map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
              </select>
              {especialidades.filter(e => !especialidadYaAsignada(e.id)).length === 0 && formData.actividadId && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ No hay especialidades disponibles. Todas las especialidades ya están asignadas a esta actividad.
                </p>
              )}
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarRelacion} className="tm-btn-primario">Guardar</button>
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
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Actividad</span><p className="tm-modal-detalle-valor">{selectedRelacion.actividad?.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Especialidad</span><p className="tm-modal-detalle-valor">{selectedRelacion.especialidad?.nombre}</p></div>
            <div className={`tm-modal-detalle-movimiento ${selectedRelacion.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">{selectedRelacion.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}</p>
            </div>
            <div className="tm-modal-acciones"><button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cerrar</button></div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR BAJA */}
      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Desactivar la asignación de <strong>{confirmDelete.especialidad?.nombre}</strong> a la actividad <strong>{confirmDelete.actividad?.nombre}</strong>?</p>
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
            <p className="text-gray-700 mb-2 text-sm">¿Reactivar la asignación de <strong>{confirmReactivar.especialidad?.nombre}</strong> a la actividad <strong>{confirmReactivar.actividad?.nombre}</strong>?</p>
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
