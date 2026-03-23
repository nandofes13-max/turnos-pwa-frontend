import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

// ===== INTERFACES =====
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

interface ActividadEspecialidad {
  id: number;
  actividad_id: number;
  especialidad_id: number;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

// Para mostrar en la tabla con nombres
interface ActividadEspecialidadConNombres extends ActividadEspecialidad {
  actividad_nombre: string;
  especialidad_nombre: string;
}

// ===== CONSTANTES =====
const API_BASE_URL = import.meta.env.VITE_API_URL;
const ACTIVIDAD_ESPECIALIDAD_URL = `${API_BASE_URL}/actividad-especialidad`;
const ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;

export default function ActividadEspecialidad() {
  // Estados principales
  const [relaciones, setRelaciones] = useState<ActividadEspecialidadConNombres[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedRelacion, setSelectedRelacion] = useState<ActividadEspecialidad | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ actividad_id: 0, especialidad_id: 0 });
  const [confirmDelete, setConfirmDelete] = useState<ActividadEspecialidadConNombres | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<ActividadEspecialidadConNombres | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroActividad, setFiltroActividad] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Estados para filtros expandidos
  const [filtroExpandido, setFiltroExpandido] = useState({
    movimiento: false
  });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  const tiposMovimiento = ['Altas', 'Bajas'];

  // ===== CARGA INICIAL =====
  useEffect(() => {
    fetchRelaciones();
    fetchActividades();
    fetchEspecialidades();
  }, []);

  // ===== FUNCIONES DE CARGA =====
  const fetchRelaciones = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(ACTIVIDAD_ESPECIALIDAD_URL);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const data: ActividadEspecialidad[] = await res.json();
      
      // Enriquecer con nombres
      const relacionesConNombres = data.map((rel) => {
        const actividad = actividades.find(a => a.id === rel.actividad_id);
        const especialidad = especialidades.find(e => e.id === rel.especialidad_id);
        return {
          ...rel,
          actividad_nombre: actividad?.nombre || `ID ${rel.actividad_id}`,
          especialidad_nombre: especialidad?.nombre || `ID ${rel.especialidad_id}`,
        };
      });
      setRelaciones(relacionesConNombres);
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
      if (!res.ok) throw new Error('Error al cargar actividades');
      const data = await res.json();
      // Solo actividades activas (sin fecha_baja)
      const activas = data.filter((a: Actividad) => !a.fecha_baja);
      setActividades(activas);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const res = await fetch(ESPECIALIDADES_URL);
      if (!res.ok) throw new Error('Error al cargar especialidades');
      const data = await res.json();
      // Solo especialidades activas (sin fecha_baja)
      const activas = data.filter((e: Especialidad) => !e.fecha_baja);
      setEspecialidades(activas);
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  };

  // ===== FUNCIONES AUXILIARES =====
  const obtenerTipoMovimiento = (rel: ActividadEspecialidadConNombres): string => {
    if (rel.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  // Validación de unicidad absoluta (activos e inactivos)
  const verificarCombinacionUnica = async (actividadId: number, especialidadId: number, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(ACTIVIDAD_ESPECIALIDAD_URL);
      const data: ActividadEspecialidad[] = await res.json();
      
      const existeCombinacion = data.some(rel => 
        rel.actividad_id === actividadId && 
        rel.especialidad_id === especialidadId &&
        (id ? rel.id !== id : true)
      );
      
      if (existeCombinacion) {
        setErrorMessage('Ya existe un registro (activo o inactivo) con esta combinación de Actividad y Especialidad');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error al validar combinación:', err);
      return false;
    }
  };

  // ===== FILTRADO =====
  const filtrarRelaciones = () => {
    return relaciones.filter(rel => {
      if (filtroActividad && !rel.actividad_nombre.toLowerCase().includes(filtroActividad.toLowerCase())) return false;
      if (filtroEspecialidad && !rel.especialidad_nombre.toLowerCase().includes(filtroEspecialidad.toLowerCase())) return false;
      
      const tipo = obtenerTipoMovimiento(rel);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;

      if (fechaDesde && rel.fecha_alta) {
        const fechaAlta = new Date(rel.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && rel.fecha_alta) {
        const fechaAlta = new Date(rel.fecha_alta).toISOString().split('T')[0];
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
    .sort((a, b) => a.actividad_nombre.localeCompare(b.actividad_nombre))
    .slice(indicePrimerItem, indiceUltimoItem);

  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
  };

  const toggleMovimiento = (mov: string) => {
    setFiltroTipoMovimiento(prev => 
      prev.includes(mov) ? prev.filter(m => m !== mov) : [...prev, mov]
    );
    setPaginaActual(1);
  };

  const toggleTodosMovimientos = () => {
    if (filtroTipoMovimiento.length === tiposMovimiento.length) {
      setFiltroTipoMovimiento([]);
    } else {
      setFiltroTipoMovimiento([...tiposMovimiento]);
    }
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroActividad('');
    setFiltroEspecialidad('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  // ===== CRUD =====
  const handleAgregar = () => {
    setFormData({ actividad_id: 0, especialidad_id: 0 });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (relacion: ActividadEspecialidadConNombres) => {
    setFormData({ 
      actividad_id: relacion.actividad_id, 
      especialidad_id: relacion.especialidad_id 
    });
    setSelectedRelacion(relacion);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (relacion: ActividadEspecialidadConNombres) => {
    setSelectedRelacion(relacion);
    setModalMode('view');
  };

  const handleEliminar = (relacion: ActividadEspecialidadConNombres) => {
    setConfirmDelete(relacion);
  };

  const handleReactivar = (relacion: ActividadEspecialidadConNombres) => {
    if (relacion.fecha_baja) {
      setConfirmReactivar(relacion);
    }
  };

  const guardarRelacion = async () => {
    if (!formData.actividad_id || !formData.especialidad_id) {
      setErrorMessage('Debe seleccionar una Actividad y una Especialidad');
      return;
    }

    try {
      if (modalMode === 'add') {
        const esValido = await verificarCombinacionUnica(formData.actividad_id, formData.especialidad_id);
        if (!esValido) return;
      } else if (modalMode === 'edit' && selectedRelacion) {
        const esValido = await verificarCombinacionUnica(formData.actividad_id, formData.especialidad_id, selectedRelacion.id);
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(ACTIVIDAD_ESPECIALIDAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            actividadId: formData.actividad_id, 
            especialidadId: formData.especialidad_id 
          }),
        });
      } else if (modalMode === 'edit' && selectedRelacion) {
        res = await fetch(`${ACTIVIDAD_ESPECIALIDAD_URL}/${selectedRelacion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            actividadId: formData.actividad_id, 
            especialidadId: formData.especialidad_id 
          }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar la relación');
      }

      setModalMode(null);
      setSelectedRelacion(null);
      setFormData({ actividad_id: 0, especialidad_id: 0 });
      setErrorMessage(null);
      await fetchRelaciones();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar la relación');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${ACTIVIDAD_ESPECIALIDAD_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Error al eliminar relación');
      setConfirmDelete(null);
      await fetchRelaciones();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la relación');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;
    try {
      const res = await fetch(`${ACTIVIDAD_ESPECIALIDAD_URL}/${confirmReactivar.id}`, {
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
      await fetchRelaciones();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar la relación');
    }
  };

  // ===== RENDER =====
  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Actividad ↔ Especialidad</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Actividad</label>
            <input
              type="text"
              value={filtroActividad}
              onChange={(e) => {
                setFiltroActividad(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por actividad..."
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Especialidad</label>
            <input
              type="text"
              value={filtroEspecialidad}
              onChange={(e) => {
                setFiltroEspecialidad(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por especialidad..."
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-fecha">
            <label className="tm-filtro-label">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setPaginaActual(1);
              }}
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-fecha">
            <label className="tm-filtro-label">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setPaginaActual(1);
              }}
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-movimiento">
            <label className="tm-filtro-label">Movimiento</label>
            <div className="tm-filtro-dropdown">
              <button
                onClick={() => setFiltroExpandido(prev => ({ ...prev, movimiento: !prev.movimiento }))}
                className="tm-filtro-dropdown-btn"
              >
                <span>
                  {filtroTipoMovimiento.length === 0 ? 'Todos' : `${filtroTipoMovimiento.length} selec`}
                </span>
                <span>▼</span>
              </button>
              {filtroExpandido.movimiento && (
                <div className="tm-filtro-dropdown-menu">
                  <label className="tm-filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filtroTipoMovimiento.length === tiposMovimiento.length}
                      onChange={toggleTodosMovimientos}
                    />
                    <span>Todos</span>
                  </label>
                  <div className="tm-filtro-dropdown-lista">
                    {tiposMovimiento.map(mov => (
                      <label key={mov} className="tm-filtro-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filtroTipoMovimiento.includes(mov)}
                          onChange={() => toggleMovimiento(mov)}
                        />
                        <span className={mov === 'Altas' ? 'text-green-600' : 'text-red-600'}>{mov}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="tm-filtro-accion">
            <button onClick={limpiarFiltros} className="tm-btn-limpiar">
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Manejo de errores */}
      {fetchError && (
        <div className="tm-error">
          <p>Error al cargar datos: {fetchError}</p>
          <button onClick={fetchRelaciones} className="tm-btn-secundario">
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de Relaciones */}
      {loading ? (
        <div className="tm-loading">
          <div className="tm-loading-spinner"></div>
          <p className="tm-loading-texto">Cargando...</p>
        </div>
      ) : (
        <div className="tm-tabla-wrapper">
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner">
              <button onClick={handleAgregar} className="tm-btn-agregar">
                Agregar Relación
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th>ACTIVIDAD</th>
                  <th>ESPECIALIDAD</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {relacionesPaginadas.map((rel) => (
                  <tr key={rel.id} className={rel.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td>{rel.actividad_nombre}</td>
                    <td>{rel.especialidad_nombre}</td>
                    <td>
                      <ActionIcons
                        onAdd={() => rel.fecha_baja ? handleReactivar(rel) : null}
                        onEdit={() => !rel.fecha_baja && handleEditar(rel)}
                        onDelete={() => !rel.fecha_baja && handleEliminar(rel)}
                        onView={() => handleVerDetalle(rel)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        showView={true}
                        disabledAdd={!rel.fecha_baja}
                        disabledEdit={!!rel.fecha_baja}
                        disabledDelete={!!rel.fecha_baja}
                        disabledView={false}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {relacionesPaginadas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="tm-fila-vacia">
                      No hay relaciones que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tm-cards">
            {relacionesPaginadas.map((rel) => (
              <div key={`card-${rel.id}`} className={`tm-card-item ${rel.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-nombre">{rel.actividad_nombre}</div>
                <div className="tm-card-descripcion">{rel.especialidad_nombre}</div>
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => rel.fecha_baja ? handleReactivar(rel) : null}
                    onEdit={() => !rel.fecha_baja && handleEditar(rel)}
                    onDelete={() => !rel.fecha_baja && handleEliminar(rel)}
                    onView={() => handleVerDetalle(rel)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    showView={true}
                    disabledAdd={!rel.fecha_baja}
                    disabledEdit={!!rel.fecha_baja}
                    disabledDelete={!!rel.fecha_baja}
                    disabledView={false}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {relacionesFiltradas.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">
                Página {paginaActual} de {totalPaginas} ({relacionesFiltradas.length} registros)
              </span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">
            Mostrando {relacionesPaginadas.length} de {relacionesFiltradas.length} relaciones
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Relación</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Actividad *</label>
              <select
                value={formData.actividad_id}
                onChange={(e) => setFormData({ ...formData, actividad_id: parseInt(e.target.value) })}
                className="tm-modal-input"
                autoFocus
              >
                <option value={0}>Seleccione una actividad...</option>
                {actividades.map(act => (
                  <option key={act.id} value={act.id}>{act.nombre}</option>
                ))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Especialidad *</label>
              <select
                value={formData.especialidad_id}
                onChange={(e) => setFormData({ ...formData, especialidad_id: parseInt(e.target.value) })}
                className="tm-modal-input"
              >
                <option value={0}>Seleccione una especialidad...</option>
                {especialidades.map(esp => (
                  <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                ))}
              </select>
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarRelacion} className="tm-btn-primario">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedRelacion && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Relación</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Actividad *</label>
              <select
                value={formData.actividad_id}
                onChange={(e) => setFormData({ ...formData, actividad_id: parseInt(e.target.value) })}
                className="tm-modal-input"
              >
                <option value={0}>Seleccione una actividad...</option>
                {actividades.map(act => (
                  <option key={act.id} value={act.id}>{act.nombre}</option>
                ))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Especialidad *</label>
              <select
                value={formData.especialidad_id}
                onChange={(e) => setFormData({ ...formData, especialidad_id: parseInt(e.target.value) })}
                className="tm-modal-input"
              >
                <option value={0}>Seleccione una especialidad...</option>
                {especialidades.map(esp => (
                  <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                ))}
              </select>
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
            <h3 className="tm-modal-titulo">Detalle de Relación</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedRelacion.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Actividad ID</span>
              <p className="tm-modal-detalle-valor">{selectedRelacion.actividad_id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Especialidad ID</span>
              <p className="tm-modal-detalle-valor">{selectedRelacion.especialidad_id}</p>
            </div>
            {selectedRelacion.fecha_alta && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">Fecha de Alta</span>
                <p className="tm-modal-detalle-valor">{new Date(selectedRelacion.fecha_alta).toLocaleString()}</p>
              </div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedRelacion.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Estado</span>
              <p className="tm-modal-detalle-valor">
                {selectedRelacion.fecha_baja ? 'Inactivo' : 'Activo'}
              </p>
            </div>
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR ELIMINAR (BAJA) */}
      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">
              ¿Dar de BAJA la relación <strong>{confirmDelete.actividad_nombre} ↔ {confirmDelete.especialidad_nombre}</strong>?
            </p>
            <p className="tm-modal-input-hint mb-4">
              El registro pasará a estado inactivo.
            </p>
            <div className="tm-modal-acciones">
              <button onClick={() => setConfirmDelete(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={confirmarEliminar} className="tm-btn-danger">
                Confirmar BAJA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR REACTIVAR */}
      {confirmReactivar && (
        <div className="tm-modal-overlay" onClick={() => setConfirmReactivar(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">
              ¿Reactivar la relación <strong>{confirmReactivar.actividad_nombre} ↔ {confirmReactivar.especialidad_nombre}</strong>?
            </p>
            <p className="tm-modal-input-hint mb-4">
              El registro volverá a estado activo.
            </p>
            <div className="tm-modal-acciones">
              <button onClick={() => setConfirmReactivar(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={confirmarReactivar} className="tm-btn-success">
                Confirmar ALTA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
