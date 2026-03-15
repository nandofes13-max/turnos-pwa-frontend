import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';
import '../styles/NegociosUsuariosRoles.module.css';

interface Relacion {
  id: number;
  negocioId: number;
  negocio?: { id: number; nombre: string; url: string };
  usuarioId: number;
  usuario?: { id: number; email: string; nombre: string; apellido: string };
  rolId: number;
  rol?: { id: number; nombre: string };
  activo: boolean;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

interface Negocio {
  id: number;
  nombre: string;
  url: string;
}

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
}

interface Rol {
  id: number;
  nombre: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RELACIONES_URL = `${API_BASE_URL}/negocios-usuarios-roles`;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;
const USUARIOS_URL = `${API_BASE_URL}/usuarios`;
const ROLES_URL = `${API_BASE_URL}/roles`;

export default function NegociosUsuariosRoles() {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRelacion, setSelectedRelacion] = useState<Relacion | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    negocioId: '',
    usuarioId: '',
    rolId: '',
    activo: true
  });
  const [confirmDelete, setConfirmDelete] = useState<Relacion | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Relacion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNegocio, setFiltroNegocio] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
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

  // Cargar datos iniciales
  useEffect(() => {
    fetchRelaciones();
    fetchNegocios();
    fetchUsuarios();
    fetchRoles();
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
  const fetchNegocios = async () => {
    try {
      const res = await fetch(NEGOCIOS_URL);
      const data = await res.json();
      setNegocios(data);
    } catch (err) {
      console.error('Error al cargar negocios:', err);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(USUARIOS_URL);
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(ROLES_URL);
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  };

  const obtenerTipoMovimiento = (r: Relacion): string => {
    if (r.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarRelaciones = (relaciones: Relacion[]): Relacion[] => {
    return relaciones.filter(r => {
      // Filtros
      if (filtroNegocio) {
        const negocioNombre = r.negocio?.nombre.toLowerCase() || '';
        if (!negocioNombre.includes(filtroNegocio.toLowerCase())) return false;
      }
      
      if (filtroUsuario) {
        const usuarioEmail = r.usuario?.email.toLowerCase() || '';
        const usuarioNombre = `${r.usuario?.apellido} ${r.usuario?.nombre}`.toLowerCase();
        if (!usuarioEmail.includes(filtroUsuario.toLowerCase()) && 
            !usuarioNombre.includes(filtroUsuario.toLowerCase())) return false;
      }
      
      if (filtroRol) {
        const rolNombre = r.rol?.nombre.toLowerCase() || '';
        if (!rolNombre.includes(filtroRol.toLowerCase())) return false;
      }
      
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

  const relacionesFiltradas = filtrarRelaciones(relaciones);
  
  const totalPaginas = Math.ceil(relacionesFiltradas.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const relacionesPaginadas = relacionesFiltradas
    .sort((a, b) => (a.id || 0) - (b.id || 0))
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
    setFormData({ 
      negocioId: '',
      usuarioId: '',
      rolId: '',
      activo: true
    });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (relacion: Relacion) => {
    setFormData({ 
      negocioId: relacion.negocioId.toString(),
      usuarioId: relacion.usuarioId.toString(),
      rolId: relacion.rolId.toString(),
      activo: relacion.activo
    });
    setSelectedRelacion(relacion);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (relacion: Relacion) => {
    setSelectedRelacion(relacion);
    setModalMode('view');
  };

  const handleEliminar = (relacion: Relacion) => {
    setConfirmDelete(relacion);
  };

  const handleReactivar = (relacion: Relacion) => {
    if (relacion.fecha_baja) {
      setConfirmReactivar(relacion);
    }
  };

  const validarFormulario = (): boolean => {
    if (!formData.negocioId) {
      setErrorMessage('Debe seleccionar un negocio');
      return false;
    }
    if (!formData.usuarioId) {
      setErrorMessage('Debe seleccionar un usuario');
      return false;
    }
    if (!formData.rolId) {
      setErrorMessage('Debe seleccionar un rol');
      return false;
    }
    return true;
  };

  const guardarRelacion = async () => {
    if (!validarFormulario()) return;

    try {
      let res;
      if (modalMode === 'add') {
        res = await fetch(RELACIONES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            negocioId: parseInt(formData.negocioId),
            usuarioId: parseInt(formData.usuarioId),
            rolId: parseInt(formData.rolId),
            activo: formData.activo,
          }),
        });
      } else if (modalMode === 'edit' && selectedRelacion) {
        res = await fetch(`${RELACIONES_URL}/${selectedRelacion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rolId: parseInt(formData.rolId),
            activo: formData.activo,
          }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar relación');
      }

      setModalMode(null);
      setSelectedRelacion(null);
      setFormData({ negocioId: '', usuarioId: '', rolId: '', activo: true });
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
          ...confirmReactivar,
          fecha_baja: null,
          usuario_baja: null,
          activo: true
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
    setFiltroNegocio('');
    setFiltroUsuario('');
    setFiltroRol('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Accesos (Negocio - Usuario - Rol)</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          
          {/* NEGOCIO */}
          <div className="tm-filtro-campo tm-filtro-negocio">
            <label className="tm-filtro-label">Negocio</label>
            <input
              type="text"
              value={filtroNegocio}
              onChange={(e) => {
                setFiltroNegocio(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar negocio..."
              className="tm-filtro-input"
            />
          </div>

          {/* USUARIO */}
          <div className="tm-filtro-campo tm-filtro-usuario">
            <label className="tm-filtro-label">Usuario</label>
            <input
              type="text"
              value={filtroUsuario}
              onChange={(e) => {
                setFiltroUsuario(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar usuario..."
              className="tm-filtro-input"
            />
          </div>

          {/* ROL */}
          <div className="tm-filtro-campo tm-filtro-rol">
            <label className="tm-filtro-label">Rol</label>
            <input
              type="text"
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar rol..."
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
            <button onClick={limpiarFiltros} className="tm-btn-limpiar">
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
       {/* 👇 ACÁ VA EL MANEJO DE ERRORES */}
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
          {/* Botón Agregar */}
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner">
              <button onClick={handleAgregar} className="tm-btn-agregar">
                Asignar Nuevo Acceso
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
                  <th>NEGOCIO</th>
                  <th>USUARIO</th>
                  <th>ROL</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {relacionesPaginadas.map((r) => (
                  <tr key={r.id} className={r.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td>
                      {r.negocio?.nombre || `ID: ${r.negocioId}`}
                      <br />
                      <span className="text-xs text-gray-500">{r.negocio?.url}</span>
                    </td>
                    <td>
                      {r.usuario ? (
                        <>
                          {r.usuario.email}<br />
                          <span className="text-xs text-gray-500">
                            {r.usuario.apellido} {r.usuario.nombre}
                          </span>
                        </>
                      ) : `ID: ${r.usuarioId}`}
                    </td>
                    <td>{r.rol?.nombre || `ID: ${r.rolId}`}</td>
                    <td>
                      {r.activo ? (
                        <span className="text-green-600">Activo</span>
                      ) : (
                        <span className="text-red-600">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <ActionIcons
                        onAdd={() => r.fecha_baja ? handleReactivar(r) : null}
                        onEdit={() => !r.fecha_baja && handleEditar(r)}
                        onDelete={() => !r.fecha_baja && handleEliminar(r)}
                        onView={() => handleVerDetalle(r)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        showView={true}
                        disabledAdd={!r.fecha_baja}
                        disabledEdit={!!r.fecha_baja}
                        disabledDelete={!!r.fecha_baja}
                        disabledView={false}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {relacionesPaginadas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="tm-fila-vacia">
                      No hay relaciones que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS MÓVIL */}
          <div className="tm-cards">
            {relacionesPaginadas.map((r) => (
              <div key={`card-${r.id}`} className={`tm-card-item ${r.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-negocio">
                  <strong>{r.negocio?.nombre || `Negocio ${r.negocioId}`}</strong>
                  <br />
                  <span className="text-xs text-gray-500">{r.negocio?.url}</span>
                </div>
                <div className="tm-card-usuario">
                  {r.usuario?.email || `Usuario ${r.usuarioId}`}
                </div>
                <div className="tm-card-rol">
                  Rol: <strong>{r.rol?.nombre || `ID ${r.rolId}`}</strong>
                </div>
                <div className="tm-card-estado">
                  Estado: {r.activo ? 'Activo' : 'Inactivo'}
                </div>
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => r.fecha_baja ? handleReactivar(r) : null}
                    onEdit={() => !r.fecha_baja && handleEditar(r)}
                    onDelete={() => !r.fecha_baja && handleEliminar(r)}
                    onView={() => handleVerDetalle(r)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    showView={true}
                    disabledAdd={!r.fecha_baja}
                    disabledEdit={!!r.fecha_baja}
                    disabledDelete={!!r.fecha_baja}
                    disabledView={false}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* PAGINACIÓN */}
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
            Mostrando {relacionesPaginados.length} de {relacionesFiltradas.length} relaciones
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Asignar Acceso</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Negocio *</label>
              <select
                value={formData.negocioId}
                onChange={(e) => setFormData({ ...formData, negocioId: e.target.value })}
                className="tm-modal-input"
                required
              >
                <option value="">Seleccionar negocio...</option>
                {negocios.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.nombre} ({n.url})
                  </option>
                ))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Usuario *</label>
              <select
                value={formData.usuarioId}
                onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                className="tm-modal-input"
                required
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.email} - {u.apellido} {u.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Rol *</label>
              <select
                value={formData.rolId}
                onChange={(e) => setFormData({ ...formData, rolId: e.target.value })}
                className="tm-modal-input"
                required
              >
                <option value="">Seleccionar rol...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />{' '}
                Activo
              </label>
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarRelacion} className="tm-btn-primario">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedRelacion && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Acceso</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Negocio</label>
              <input
                type="text"
                value={selectedRelacion.negocio?.nombre || `ID: ${selectedRelacion.negocioId}`}
                className="tm-modal-input"
                disabled
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Usuario</label>
              <input
                type="text"
                value={selectedRelacion.usuario?.email || `ID: ${selectedRelacion.usuarioId}`}
                className="tm-modal-input"
                disabled
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Rol *</label>
              <select
                value={formData.rolId}
                onChange={(e) => setFormData({ ...formData, rolId: e.target.value })}
                className="tm-modal-input"
                required
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />{' '}
                Activo
              </label>
            </div>

            {selectedRelacion.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">{selectedRelacion.ultimoMovimiento.replace('demo', 'DEMO')}</p>
              </div>
            )}
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
            <h3 className="tm-modal-titulo">Detalle de Acceso</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedRelacion.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Negocio</span>
              <p className="tm-modal-detalle-valor">
                {selectedRelacion.negocio?.nombre} ({selectedRelacion.negocio?.url})
              </p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Usuario</span>
              <p className="tm-modal-detalle-valor">
                {selectedRelacion.usuario?.email}<br />
                {selectedRelacion.usuario?.apellido} {selectedRelacion.usuario?.nombre}
              </p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Rol</span>
              <p className="tm-modal-detalle-valor">{selectedRelacion.rol?.nombre}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Estado</span>
              <p className="tm-modal-detalle-valor">
                {selectedRelacion.activo ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <div className={`tm-modal-detalle-movimiento ${selectedRelacion.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedRelacion.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
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
              ¿Desactivar el acceso de <strong>{confirmDelete.usuario?.email}</strong> 
              {' '}al negocio <strong>{confirmDelete.negocio?.nombre}</strong>?
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
              ¿Reactivar el acceso de <strong>{confirmReactivar.usuario?.email}</strong> 
              {' '}al negocio <strong>{confirmReactivar.negocio?.nombre}</strong>?
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
