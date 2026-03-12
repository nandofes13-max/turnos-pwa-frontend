import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

interface Rol {
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
const ROLES_URL = `${API_BASE_URL}/roles`;

export default function Roles() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    descripcion: '' 
  });
  const [confirmDelete, setConfirmDelete] = useState<Rol | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Rol | null>(null);
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
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(ROLES_URL);
      const data = await res.json();
      setRoles(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (r: Rol): string => {
    if (r.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarRoles = (roles: Rol[]): Rol[] => {
    return roles.filter(r => {
      // Filtro por nombre
      if (filtroNombre && !r.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      
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

  const rolesFiltrados = filtrarRoles(roles);
  
  // Lógica de paginación
  const totalPaginas = Math.ceil(rolesFiltrados.length / itemsPorPagina);
  
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  
  const rolesPaginados = rolesFiltrados
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
    setFormData({ nombre: '', descripcion: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (rol: Rol) => {
    setFormData({ 
      nombre: rol.nombre, 
      descripcion: rol.descripcion || '' 
    });
    setSelectedRol(rol);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (rol: Rol) => {
    setSelectedRol(rol);
    setModalMode('view');
  };

  const handleEliminar = (rol: Rol) => {
    setConfirmDelete(rol);
  };

  const handleReactivar = (rol: Rol) => {
    if (rol.fecha_baja) {
      setConfirmReactivar(rol);
    }
  };

  const verificarExistente = async (nombre: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(ROLES_URL);
      const data: Rol[] = await res.json();
      
      const activos = data.filter(r => 
        !r.fecha_baja && 
        (id ? r.id !== id : true)
      );
      
      const nombreExistente = activos.some(r => 
        r.nombre.toUpperCase() === nombre.toUpperCase()
      );
      
      if (nombreExistente) {
        setErrorMessage('Ya existe un rol activo con ese nombre');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarRol = async () => {
    if (!formData.nombre) {
      setErrorMessage('El nombre del rol es obligatorio');
      return;
    }

    try {
      if (modalMode === 'add') {
        const esValido = await verificarExistente(formData.nombre);
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(ROLES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nombre: formData.nombre.toUpperCase(),
            descripcion: formData.descripcion
          }),
        });
      } else if (modalMode === 'edit' && selectedRol) {
        res = await fetch(`${ROLES_URL}/${selectedRol.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nombre: formData.nombre.toUpperCase(),
            descripcion: formData.descripcion
          }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar rol');
      }

      setModalMode(null);
      setSelectedRol(null);
      setFormData({ nombre: '', descripcion: '' });
      setErrorMessage(null);
      fetchRoles();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar el rol');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${ROLES_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Error al eliminar rol');

      setConfirmDelete(null);
      fetchRoles();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el rol');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;

    try {
      const res = await fetch(`${ROLES_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: confirmReactivar.nombre,
          descripcion: confirmReactivar.descripcion,
          fecha_baja: null,
          usuario_baja: null
        }),
      });

      if (!res.ok) throw new Error('Error al reactivar rol');

      setConfirmReactivar(null);
      fetchRoles();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar el rol');
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
      <h1 className="tm-titulo">Gestión de Roles</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          
          {/* NOMBRE */}
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Nombre del Rol</label>
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

      {/* Tabla de Roles */}
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
                Agregar Rol
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* TABLA (solo visible en desktop) */}
          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th className="tm-col-nombre">NOMBRE DEL ROL</th>
                  <th>DESCRIPCIÓN</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {rolesPaginados.map((r) => (
                  <tr 
                    key={r.id} 
                    className={r.fecha_baja ? 'tm-fila-inactiva' : ''}
                  >
                    <td className="tm-celda-nombre">{r.nombre}</td>
                    <td>{r.descripcion || '-'}</td>
                    <td>
                      <ActionIcons
                        onAdd={() => r.fecha_baja ? handleReactivar(r) : null}
                        onEdit={() => !r.fecha_baja && handleEditar(r)}
                        onDelete={() => !r.fecha_baja && handleEliminar(r)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        disabledAdd={!r.fecha_baja}
                        disabledEdit={!!r.fecha_baja}
                        disabledDelete={!!r.fecha_baja}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {rolesPaginados.length === 0 && (
                  <tr>
                    <td colSpan={3} className="tm-fila-vacia">
                      No hay roles que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS PARA MÓVIL */}
          <div className="tm-cards">
            {rolesPaginados.map((r) => (
              <div 
                key={`card-${r.id}`}
                className={`tm-card-item ${r.fecha_baja ? 'inactiva' : ''}`}
              >
                <div className="tm-card-nombre">{r.nombre}</div>
                {r.descripcion && <div className="tm-card-descripcion">{r.descripcion}</div>}
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => r.fecha_baja ? handleReactivar(r) : null}
                    onEdit={() => !r.fecha_baja && handleEditar(r)}
                    onDelete={() => !r.fecha_baja && handleEliminar(r)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    disabledAdd={!r.fecha_baja}
                    disabledEdit={!!r.fecha_baja}
                    disabledDelete={!!r.fecha_baja}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* PAGINACIÓN */}
          {rolesFiltrados.length > 0 && (
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
                ({rolesFiltrados.length} registros)
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
            Mostrando {rolesPaginados.length} de {rolesFiltrados.length} roles
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Rol</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre del Rol *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ej: ADMIN, DEMO, DUENIO"
                className="tm-modal-input"
                autoFocus
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Opcional - Descripción del rol"
                className="tm-modal-input"
                rows={3}
              />
            </div>
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarRol} className="tm-btn-primario">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedRol && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Rol</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre del Rol *</label>
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
            {selectedRol.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">
                  {selectedRol.ultimoMovimiento.replace('demo', 'DEMO')}
                </p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarRol} className="tm-btn-primario">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedRol && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Rol</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedRol.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Nombre</span>
              <p className="tm-modal-detalle-valor">{selectedRol.nombre}</p>
            </div>
            {selectedRol.descripcion && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">Descripción</span>
                <p className="tm-modal-detalle-valor">{selectedRol.descripcion}</p>
              </div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedRol.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedRol.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
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
              ¿Dar de BAJA al rol <strong>{confirmDelete.nombre}</strong>?
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
              ¿Reactivar el rol <strong>{confirmReactivar.nombre}</strong>?
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
