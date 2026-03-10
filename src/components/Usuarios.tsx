import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

interface Usuario {
  id: number;
  email: string;
  apellido: string;
  nombre: string;
  telefono?: string;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const USUARIOS_URL = `${API_BASE_URL}/usuarios`;

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    email: '', 
    apellido: '', 
    nombre: '', 
    telefono: '' 
  });
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Usuario | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroEmail, setFiltroEmail] = useState('');
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
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch(USUARIOS_URL);
      const data = await res.json();
      setUsuarios(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (u: Usuario): string => {
    if (u.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarUsuarios = (usuarios: Usuario[]): Usuario[] => {
    return usuarios.filter(u => {
      // Filtro por email
      if (filtroEmail && !u.email.toLowerCase().includes(filtroEmail.toLowerCase())) return false;
      
      // Filtro por nombre completo
      if (filtroNombre) {
        const nombreCompleto = `${u.apellido} ${u.nombre}`.toLowerCase();
        if (!nombreCompleto.includes(filtroNombre.toLowerCase())) return false;
      }
      
      const tipo = obtenerTipoMovimiento(u);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;

      if (fechaDesde && u.fecha_alta) {
        const fechaAlta = new Date(u.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && u.fecha_alta) {
        const fechaAlta = new Date(u.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }

      return true;
    });
  };

  const usuariosFiltrados = filtrarUsuarios(usuarios);
  
  // Lógica de paginación
  const totalPaginas = Math.ceil(usuariosFiltrados.length / itemsPorPagina);
  
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  
  const usuariosPaginados = usuariosFiltrados
    .sort((a, b) => a.apellido.localeCompare(b.apellido))
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
    setFormData({ email: '', apellido: '', nombre: '', telefono: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (usuario: Usuario) => {
    setFormData({ 
      email: usuario.email, 
      apellido: usuario.apellido, 
      nombre: usuario.nombre, 
      telefono: usuario.telefono || '' 
    });
    setSelectedUsuario(usuario);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setModalMode('view');
  };

  const handleEliminar = (usuario: Usuario) => {
    setConfirmDelete(usuario);
  };

  const handleReactivar = (usuario: Usuario) => {
    if (usuario.fecha_baja) {
      setConfirmReactivar(usuario);
    }
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const verificarExistente = async (email: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(USUARIOS_URL);
      const data: Usuario[] = await res.json();
      
      const activos = data.filter(u => 
        !u.fecha_baja && 
        (id ? u.id !== id : true)
      );
      
      const emailExistente = activos.some(u => 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (emailExistente) {
        setErrorMessage('Ya existe un usuario activo con ese email');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarUsuario = async () => {
    if (!formData.email || !formData.apellido || !formData.nombre) {
      setErrorMessage('Email, apellido y nombre son obligatorios');
      return;
    }

    // Validar formato de email
    if (!validarEmail(formData.email)) {
      setErrorMessage('El email ingresado no tiene un formato válido');
      return;
    }

    try {
      if (modalMode === 'add') {
        const esValido = await verificarExistente(formData.email);
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(USUARIOS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email,
            apellido: formData.apellido.toUpperCase(),
            nombre: formData.nombre.toUpperCase(),
            telefono: formData.telefono || null
          }),
        });
      } else if (modalMode === 'edit' && selectedUsuario) {
        res = await fetch(`${USUARIOS_URL}/${selectedUsuario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email,
            apellido: formData.apellido.toUpperCase(),
            nombre: formData.nombre.toUpperCase(),
            telefono: formData.telefono || null
          }),
        });
      } else {
        return;
      }

      if (!res.ok) {
        // Si el backend devuelve error de validación
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar usuario');
      }

      setModalMode(null);
      setSelectedUsuario(null);
      setFormData({ email: '', apellido: '', nombre: '', telefono: '' });
      setErrorMessage(null);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar el usuario');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${USUARIOS_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Error al eliminar usuario');

      setConfirmDelete(null);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el usuario');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;

    try {
      const res = await fetch(`${USUARIOS_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: confirmReactivar.email,
          apellido: confirmReactivar.apellido,
          nombre: confirmReactivar.nombre,
          telefono: confirmReactivar.telefono,
          fecha_baja: null,
          usuario_baja: null
        }),
      });

      if (!res.ok) throw new Error('Error al reactivar usuario');

      setConfirmReactivar(null);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar el usuario');
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroEmail('');
    setFiltroNombre('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Usuarios</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          
          {/* EMAIL */}
          <div className="tm-filtro-campo tm-filtro-email">
            <label className="tm-filtro-label">Email</label>
            <input
              type="text"
              value={filtroEmail}
              onChange={(e) => {
                setFiltroEmail(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar..."
              className="tm-filtro-input"
            />
          </div>

          {/* NOMBRE */}
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Apellido y Nombre</label>
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

      {/* Tabla de Usuarios */}
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
                Agregar Usuario
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
                  <th className="tm-col-email">EMAIL</th>
                  <th>APELLIDO Y NOMBRE</th>
                  <th>TELÉFONO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {usuariosPaginados.map((u) => (
                  <tr 
                    key={u.id} 
                    className={u.fecha_baja ? 'tm-fila-inactiva' : ''}
                  >
                    <td>{u.email}</td>
                    <td>{u.apellido} {u.nombre}</td>
                    <td>{u.telefono || '-'}</td>
                    <td>
                      <ActionIcons
                        onAdd={() => u.fecha_baja ? handleReactivar(u) : null}
                        onEdit={() => !u.fecha_baja && handleEditar(u)}
                        onDelete={() => !u.fecha_baja && handleEliminar(u)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        disabledAdd={!u.fecha_baja}
                        disabledEdit={!!u.fecha_baja}
                        disabledDelete={!!u.fecha_baja}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {usuariosPaginados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="tm-fila-vacia">
                      No hay usuarios que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS PARA MÓVIL */}
          <div className="tm-cards">
            {usuariosPaginados.map((u) => (
              <div 
                key={`card-${u.id}`}
                className={`tm-card-item ${u.fecha_baja ? 'inactiva' : ''}`}
              >
                <div className="tm-card-email">{u.email}</div>
                <div className="tm-card-nombre">{u.apellido} {u.nombre}</div>
                {u.telefono && <div className="tm-card-telefono">{u.telefono}</div>}
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => u.fecha_baja ? handleReactivar(u) : null}
                    onEdit={() => !u.fecha_baja && handleEditar(u)}
                    onDelete={() => !u.fecha_baja && handleEliminar(u)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    disabledAdd={!u.fecha_baja}
                    disabledEdit={!!u.fecha_baja}
                    disabledDelete={!!u.fecha_baja}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* PAGINACIÓN */}
          {usuariosFiltrados.length > 0 && (
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
                ({usuariosFiltrados.length} registros)
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
            Mostrando {usuariosPaginados.length} de {usuariosFiltrados.length} usuarios
          </div>
        </div>
      )}

      {/* MODALES */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Usuario</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="tm-modal-input"
                autoFocus
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Apellido *</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value.toUpperCase() })}
                placeholder="Apellido"
                className="tm-modal-input"
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Nombre"
                className="tm-modal-input"
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Opcional"
                className="tm-modal-input"
              />
            </div>
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarUsuario} className="tm-btn-primario">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'edit' && selectedUsuario && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Usuario</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="tm-modal-input"
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Apellido *</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value.toUpperCase() })}
                className="tm-modal-input"
              />
            </div>
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
              <label className="tm-modal-label">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="tm-modal-input"
              />
            </div>
            {selectedUsuario.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">
                  {selectedUsuario.ultimoMovimiento.replace('demo', 'DEMO')}
                </p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarUsuario} className="tm-btn-primario">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'view' && selectedUsuario && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Usuario</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedUsuario.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Email</span>
              <p className="tm-modal-detalle-valor">{selectedUsuario.email}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Apellido</span>
              <p className="tm-modal-detalle-valor">{selectedUsuario.apellido}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Nombre</span>
              <p className="tm-modal-detalle-valor">{selectedUsuario.nombre}</p>
            </div>
            {selectedUsuario.telefono && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">Teléfono</span>
                <p className="tm-modal-detalle-valor">{selectedUsuario.telefono}</p>
              </div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedUsuario.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedUsuario.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
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
              ¿Dar de BAJA a <strong>{confirmDelete.email}</strong>?
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
              ¿Reactivar a <strong>{confirmReactivar.email}</strong>?
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
