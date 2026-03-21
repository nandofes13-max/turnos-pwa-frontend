import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;

export default function Especialidades() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<Especialidad | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [confirmDelete, setConfirmDelete] = useState<Especialidad | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Especialidad | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
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

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(ESPECIALIDADES_URL);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const data = await res.json();
      setEspecialidades(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
      setFetchError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (e: Especialidad): string => {
    if (e.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarEspecialidades = () => {
    return especialidades.filter(e => {
      if (filtroNombre && !e.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      
      const tipo = obtenerTipoMovimiento(e);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;

      if (fechaDesde && e.fecha_alta) {
        const fechaAlta = new Date(e.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && e.fecha_alta) {
        const fechaAlta = new Date(e.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }

      return true;
    });
  };

  const especialidadesFiltradas = filtrarEspecialidades();
  
  const totalPaginas = Math.ceil(especialidadesFiltradas.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const especialidadesPaginadas = especialidadesFiltradas
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
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

  const handleAgregar = () => {
    setFormData({ nombre: '', descripcion: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (especialidad: Especialidad) => {
    setFormData({ 
      nombre: especialidad.nombre, 
      descripcion: especialidad.descripcion || '' 
    });
    setSelectedEspecialidad(especialidad);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (especialidad: Especialidad) => {
    setSelectedEspecialidad(especialidad);
    setModalMode('view');
  };

  const handleEliminar = (especialidad: Especialidad) => {
    setConfirmDelete(especialidad);
  };

  const handleReactivar = (especialidad: Especialidad) => {
    if (especialidad.fecha_baja) {
      setConfirmReactivar(especialidad);
    }
  };

  const verificarExistente = async (nombre: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(ESPECIALIDADES_URL);
      const data: Especialidad[] = await res.json();
      
      const activos = data.filter(e => 
        !e.fecha_baja && 
        (id ? e.id !== id : true)
      );
      
      const nombreExistente = activos.some(e => 
        e.nombre.toUpperCase() === nombre.toUpperCase()
      );
      
      if (nombreExistente) {
        setErrorMessage('Ya existe una especialidad activa con ese nombre');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarEspecialidad = async () => {
    if (!formData.nombre) {
      setErrorMessage('El nombre es obligatorio');
      return;
    }

    const nombreUpper = formData.nombre.toUpperCase();

    try {
      if (modalMode === 'add') {
        const esValido = await verificarExistente(nombreUpper);
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(ESPECIALIDADES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nombre: nombreUpper,
            descripcion: formData.descripcion
          }),
        });
      } else if (modalMode === 'edit' && selectedEspecialidad) {
        res = await fetch(`${ESPECIALIDADES_URL}/${selectedEspecialidad.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nombre: nombreUpper,
            descripcion: formData.descripcion
          }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar especialidad');
      }

      setModalMode(null);
      setSelectedEspecialidad(null);
      setFormData({ nombre: '', descripcion: '' });
      setErrorMessage(null);
      fetchEspecialidades();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar la especialidad');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${ESPECIALIDADES_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Error al eliminar especialidad');
      setConfirmDelete(null);
      fetchEspecialidades();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la especialidad');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;
    try {
      const res = await fetch(`${ESPECIALIDADES_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: confirmReactivar.nombre,
          descripcion: confirmReactivar.descripcion,
          fecha_baja: null,
          usuario_baja: null
        }),
      });
      if (!res.ok) throw new Error('Error al reactivar especialidad');
      setConfirmReactivar(null);
      fetchEspecialidades();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar la especialidad');
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroNombre('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Especialidades</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Nombre</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => {
                setFiltroNombre(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar..."
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
          <button onClick={fetchEspecialidades} className="tm-btn-secundario">
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de Especialidades */}
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
                Agregar Especialidad
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
                   <th>NOMBRE</th>
                   <th>DESCRIPCIÓN</th>
                   <th>ACCIONES</th>
                 </tr>
              </thead>
              <tbody>
                {especialidadesPaginadas.map((e) => (
                  <tr key={e.id} className={e.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td>{e.nombre}</td>
                    <td>{e.descripcion || '-'}</td>
                    <td>
                      <ActionIcons
                        onAdd={() => e.fecha_baja ? handleReactivar(e) : null}
                        onEdit={() => !e.fecha_baja && handleEditar(e)}
                        onDelete={() => !e.fecha_baja && handleEliminar(e)}
                        onView={() => handleVerDetalle(e)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        showView={true}
                        disabledAdd={!e.fecha_baja}
                        disabledEdit={!!e.fecha_baja}
                        disabledDelete={!!e.fecha_baja}
                        disabledView={false}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {especialidadesPaginadas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="tm-fila-vacia">
                      No hay especialidades que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tm-cards">
            {especialidadesPaginadas.map((e) => (
              <div key={`card-${e.id}`} className={`tm-card-item ${e.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-nombre">{e.nombre}</div>
                {e.descripcion && <div className="tm-card-descripcion">{e.descripcion}</div>}
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => e.fecha_baja ? handleReactivar(e) : null}
                    onEdit={() => !e.fecha_baja && handleEditar(e)}
                    onDelete={() => !e.fecha_baja && handleEliminar(e)}
                    onView={() => handleVerDetalle(e)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    showView={true}
                    disabledAdd={!e.fecha_baja}
                    disabledEdit={!!e.fecha_baja}
                    disabledDelete={!!e.fecha_baja}
                    disabledView={false}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {especialidadesFiltradas.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">
                Página {paginaActual} de {totalPaginas} ({especialidadesFiltradas.length} registros)
              </span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">
            Mostrando {especialidadesPaginadas.length} de {especialidadesFiltradas.length} especialidades
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Especialidad</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ej: ALERGIA E INMUNOLOGÍA"
                className="tm-modal-input"
                autoFocus
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional"
                className="tm-modal-input"
                rows={3}
              />
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarEspecialidad} className="tm-btn-primario">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedEspecialidad && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Especialidad</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="tm-modal-input"
                rows={3}
              />
            </div>

            {selectedEspecialidad.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">{selectedEspecialidad.ultimoMovimiento.replace('demo', 'DEMO')}</p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarEspecialidad} className="tm-btn-primario">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedEspecialidad && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Especialidad</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedEspecialidad.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Nombre</span>
              <p className="tm-modal-detalle-valor">{selectedEspecialidad.nombre}</p>
            </div>
            {selectedEspecialidad.descripcion && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">Descripción</span>
                <p className="tm-modal-detalle-valor">{selectedEspecialidad.descripcion}</p>
              </div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedEspecialidad.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedEspecialidad.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
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

      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">
              ¿Dar de BAJA <strong>{confirmDelete.nombre}</strong>?
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

      {confirmReactivar && (
        <div className="tm-modal-overlay" onClick={() => setConfirmReactivar(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">
              ¿Reactivar <strong>{confirmReactivar.nombre}</strong>?
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
