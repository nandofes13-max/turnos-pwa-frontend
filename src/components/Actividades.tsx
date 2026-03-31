import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

interface Actividad {
  id: number;
  nombre: string;
  virtual: boolean;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;

export default function Actividades() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ nombre: '', virtual: false });
  const [confirmDelete, setConfirmDelete] = useState<Actividad | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Actividad | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroVirtual, setFiltroVirtual] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Estados para filtros expandidos
  const [filtroExpandido, setFiltroExpandido] = useState({
    movimiento: false,
    virtual: false
  });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  const tiposMovimiento = ['Altas', 'Bajas'];
  const opcionesVirtual = ['Todos', 'Sí', 'No'];

  useEffect(() => {
    fetchActividades();
  }, []);

  const fetchActividades = async () => {
    setLoading(true);
    try {
      const res = await fetch(ACTIVIDADES_URL);
      const data = await res.json();
      setActividades(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (a: Actividad): string => {
    if (a.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarActividades = (actividades: Actividad[]): Actividad[] => {
    return actividades.filter(a => {
      if (filtroNombre && !a.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      
      if (filtroVirtual === 'Sí' && !a.virtual) return false;
      if (filtroVirtual === 'No' && a.virtual) return false;
      
      const tipo = obtenerTipoMovimiento(a);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;

      if (fechaDesde && a.fecha_alta) {
        const fechaAlta = new Date(a.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && a.fecha_alta) {
        const fechaAlta = new Date(a.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }

      return true;
    });
  };

  const actividadesFiltradas = filtrarActividades(actividades);
  
  const totalPaginas = Math.ceil(actividadesFiltradas.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const actividadesPaginadas = actividadesFiltradas
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

  // ===== FUNCIONES CRUD =====
  const handleAgregar = () => {
    setFormData({ nombre: '', virtual: false });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (actividad: Actividad) => {
    setFormData({ nombre: actividad.nombre, virtual: actividad.virtual });
    setSelectedActividad(actividad);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (actividad: Actividad) => {
    setSelectedActividad(actividad);
    setModalMode('view');
  };

  const handleEliminar = (actividad: Actividad) => {
    setConfirmDelete(actividad);
  };

  const handleReactivar = (actividad: Actividad) => {
    if (actividad.fecha_baja) {
      setConfirmReactivar(actividad);
    }
  };

  const verificarExistente = async (nombre: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(ACTIVIDADES_URL);
      const data: Actividad[] = await res.json();
      
      const activos = data.filter(a => 
        !a.fecha_baja && 
        (id ? a.id !== id : true)
      );
      
      const nombreExistente = activos.some(a => 
        a.nombre.toUpperCase() === nombre.toUpperCase()
      );
      
      if (nombreExistente) {
        setErrorMessage('Ya existe una actividad activa con ese nombre');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarActividad = async () => {
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
        res = await fetch(ACTIVIDADES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nombre: nombreUpper,
            virtual: formData.virtual
          }),
        });
      } else if (modalMode === 'edit' && selectedActividad) {
        res = await fetch(`${ACTIVIDADES_URL}/${selectedActividad.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nombre: nombreUpper,
            virtual: formData.virtual
          }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar actividad');
      }

      setModalMode(null);
      setSelectedActividad(null);
      setFormData({ nombre: '', virtual: false });
      setErrorMessage(null);
      fetchActividades();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar la actividad');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${ACTIVIDADES_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Error al eliminar actividad');

      setConfirmDelete(null);
      fetchActividades();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la actividad');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;

    try {
      const res = await fetch(`${ACTIVIDADES_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: confirmReactivar.nombre,
          virtual: confirmReactivar.virtual,
          fecha_baja: null,
          usuario_baja: null
        }),
      });

      if (!res.ok) throw new Error('Error al reactivar actividad');

      setConfirmReactivar(null);
      fetchActividades();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar la actividad');
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroNombre('');
    setFiltroVirtual('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Actividades</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          
          {/* NOMBRE */}
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

          {/* VIRTUAL */}
          <div className="tm-filtro-campo tm-filtro-virtual">
            <label className="tm-filtro-label">Virtual</label>
            <div className="tm-filtro-dropdown">
              <button
                onClick={() => setFiltroExpandido(prev => ({ ...prev, virtual: !prev.virtual }))}
                className="tm-filtro-dropdown-btn"
              >
                <span>{filtroVirtual || 'Todos'}</span>
                <span>▼</span>
              </button>
              {filtroExpandido.virtual && (
                <div className="tm-filtro-dropdown-menu">
                  {opcionesVirtual.map(op => (
                    <label key={op} className="tm-filtro-checkbox-label">
                      <input
                        type="radio"
                        name="filtroVirtual"
                        checked={filtroVirtual === op}
                        onChange={() => {
                          setFiltroVirtual(op === 'Todos' ? '' : op);
                          setPaginaActual(1);
                          setFiltroExpandido(prev => ({ ...prev, virtual: false }));
                        }}
                      />
                      <span>{op}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FECHA DESDE */}
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

          {/* FECHA HASTA */}
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

          {/* MOVIMIENTO */}
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

          {/* Botón Limpiar Filtros */}
          <div className="tm-filtro-accion">
            <button
              onClick={limpiarFiltros}
              className="tm-btn-limpiar"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Actividades */}
      {loading ? (
        <div className="tm-loading">
          <div className="tm-loading-spinner"></div>
          <p className="tm-loading-texto">Cargando...</p>
        </div>
      ) : (
        <div className="tm-tabla-wrapper">
          {/* Botón Agregar */}
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner">
              <button
                onClick={handleAgregar}
                className="tm-btn-agregar"
              >
                Agregar Actividad
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* TABLA */}
          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th className="tm-col-nombre">NOMBRE</th>
                  <th>VIRTUAL</th>
                  <th>ACCIONES</th>
                </thead>
              <tbody>
                {actividadesPaginadas.map((a) => (
                  <tr 
                    key={a.id} 
                    className={a.fecha_baja ? 'tm-fila-inactiva' : ''}
                  >
                    <td className="tm-celda-nombre">{a.nombre} </td>
                    <td>{a.virtual ? 'Sí' : 'No'}</td>
                    <td>
                      <ActionIcons
                        onAdd={() => a.fecha_baja ? handleReactivar(a) : null}
                        onEdit={() => !a.fecha_baja && handleEditar(a)}
                        onDelete={() => !a.fecha_baja && handleEliminar(a)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        disabledAdd={!a.fecha_baja}
                        disabledEdit={!!a.fecha_baja}
                        disabledDelete={!!a.fecha_baja}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {actividadesPaginadas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="tm-fila-vacia">
                      No hay actividades que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS MÓVIL */}
          <div className="tm-cards">
            {actividadesPaginadas.map((a) => (
              <div 
                key={`card-${a.id}`}
                className={`tm-card-item ${a.fecha_baja ? 'inactiva' : ''}`}
              >
                <div className="tm-card-nombre">{a.nombre}</div>
                <div className="tm-card-virtual">Virtual: {a.virtual ? 'Sí' : 'No'}</div>
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => a.fecha_baja ? handleReactivar(a) : null}
                    onEdit={() => !a.fecha_baja && handleEditar(a)}
                    onDelete={() => !a.fecha_baja && handleEliminar(a)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    disabledAdd={!a.fecha_baja}
                    disabledEdit={!!a.fecha_baja}
                    disabledDelete={!!a.fecha_baja}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* PAGINACIÓN */}
          {actividadesFiltradas.length > 0 && (
            <div className="tm-paginacion">
              <button
                onClick={() => irAPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="tm-paginacion-btn"
              >
                ←
              </button>
              
              <span className="tm-paginacion-info">
                Página {paginaActual} de {totalPaginas} &nbsp;
                ({actividadesFiltradas.length} registros)
              </span>
              
              <button
                onClick={() => irAPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="tm-paginacion-btn"
              >
                →
              </button>
            </div>
          )}

          <div className="tm-tabla-footer">
            Mostrando {actividadesPaginadas.length} de {actividadesFiltradas.length} actividades
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Actividad</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ nombre: e.target.value.toUpperCase() })}
                placeholder="Ingrese nombre"
                className="tm-modal-input"
                autoFocus
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Virtual</label>
              <label className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={formData.virtual}
                  onChange={(e) => setFormData({ ...formData, virtual: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Permite servicios virtuales (telemedicina, etc.)</span>
              </label>
            </div>
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarActividad} className="tm-btn-primario">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedActividad && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Actividad</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ nombre: e.target.value.toUpperCase() })}
                placeholder="Ingrese nombre"
                className="tm-modal-input"
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Virtual</label>
              <label className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={formData.virtual}
                  onChange={(e) => setFormData({ ...formData, virtual: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Permite servicios virtuales (telemedicina, etc.)</span>
              </label>
            </div>
            {selectedActividad.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">
                  {selectedActividad.ultimoMovimiento.replace('demo', 'DEMO')}
                </p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarActividad} className="tm-btn-primario">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedActividad && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Actividad</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedActividad.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Nombre</span>
              <p className="tm-modal-detalle-valor">{selectedActividad.nombre}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Virtual</span>
              <p className="tm-modal-detalle-valor">{selectedActividad.virtual ? 'Sí' : 'No'}</p>
            </div>
            <div className={`tm-modal-detalle-movimiento ${selectedActividad.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedActividad.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
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

      {/* MODAL CONFIRMAR BAJA */}
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

      {/* MODAL CONFIRMAR REACTIVAR */}
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
