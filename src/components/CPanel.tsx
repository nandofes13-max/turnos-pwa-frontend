import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

interface Filial {
  id: number;
  codigo: string;
  nombre: string;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string;
  usuario_baja?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const FILIALES_URL = `${API_BASE_URL}/filiales`;

export default function CPanel() {
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ codigo: '', nombre: '' });
  const [confirmDelete, setConfirmDelete] = useState<Filial | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Filial | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroCodigo, setFiltroCodigo] = useState<string[]>([]);
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Estados para filtros expandidos
  const [filtroExpandido, setFiltroExpandido] = useState({
    codigo: false,
    movimiento: false
  });

  // ===== NUEVOS ESTADOS PARA PAGINACIÓN =====
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  const codigosUnicos = [...new Set(filiales.map(f => f.codigo))].sort();
  const tiposMovimiento = ['Altas', 'Bajas'];

  useEffect(() => {
    fetchFiliales();
  }, []);

  const fetchFiliales = async () => {
    setLoading(true);
    try {
      const res = await fetch(FILIALES_URL);
      const data = await res.json();
      setFiliales(data);
      setPaginaActual(1); // Reset a primera página al cargar nuevos datos
    } catch (err) {
      console.error('Error al cargar filiales:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (f: Filial): string => {
    if (f.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarFiliales = (filiales: Filial[]): Filial[] => {
    return filiales.filter(f => {
      if (filtroCodigo.length > 0 && !filtroCodigo.includes(f.codigo)) return false;
      if (filtroNombre && !f.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      
      const tipo = obtenerTipoMovimiento(f);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;

      if (fechaDesde && f.fecha_alta) {
        const fechaAlta = new Date(f.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && f.fecha_alta) {
        const fechaAlta = new Date(f.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }

      return true;
    });
  };

  const filialesFiltradas = filtrarFiliales(filiales);
  
  // ===== LÓGICA DE PAGINACIÓN =====
  const totalPaginas = Math.ceil(filialesFiltradas.length / itemsPorPagina);
  
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  
  const filialesPaginadas = filialesFiltradas
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .slice(indicePrimerItem, indiceUltimoItem);

  // Cambiar de página
  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
  };

  const toggleCodigo = (cod: string) => {
    setFiltroCodigo(prev => 
      prev.includes(cod) ? prev.filter(c => c !== cod) : [...prev, cod]
    );
    setPaginaActual(1); // Reset a primera página al filtrar
  };

  const toggleMovimiento = (mov: string) => {
    setFiltroTipoMovimiento(prev => 
      prev.includes(mov) ? prev.filter(m => m !== mov) : [...prev, mov]
    );
    setPaginaActual(1); // Reset a primera página al filtrar
  };

  const toggleTodosCodigos = () => {
    if (filtroCodigo.length === codigosUnicos.length) {
      setFiltroCodigo([]);
    } else {
      setFiltroCodigo([...codigosUnicos]);
    }
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
    setFormData({ codigo: '', nombre: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (filial: Filial) => {
    setFormData({ codigo: filial.codigo, nombre: filial.nombre });
    setSelectedFilial(filial);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (filial: Filial) => {
    setSelectedFilial(filial);
    setModalMode('view');
  };

  const handleEliminar = (filial: Filial) => {
    setConfirmDelete(filial);
  };

  const handleReactivar = (filial: Filial) => {
    setConfirmReactivar(filial);
  };

  const validarCodigo = (codigo: string): boolean => {
    const soloLetras = /^[A-Za-z]{1,2}$/.test(codigo);
    return soloLetras;
  };

  const verificarExistente = async (codigo: string, nombre: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(FILIALES_URL);
      const data: Filial[] = await res.json();
      
      const activos = data.filter(f => 
        !f.fecha_baja && 
        (id ? f.id !== id : true)
      );
      
      const codigoExistente = activos.some(f => 
        f.codigo.toUpperCase() === codigo.toUpperCase()
      );
      
      const nombreExistente = activos.some(f => 
        f.nombre.toUpperCase() === nombre.toUpperCase()
      );
      
      if (codigoExistente) {
        setErrorMessage('Ya existe un registro activo con ese código');
        return false;
      }
      
      if (nombreExistente) {
        setErrorMessage('Ya existe un registro activo con ese nombre');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarFilial = async () => {
    if (!formData.codigo || !formData.nombre) {
      setErrorMessage('Completar código y nombre');
      return;
    }

    if (modalMode === 'add' && !validarCodigo(formData.codigo)) {
      setErrorMessage('El código debe contener solo letras y no más de 2 caracteres');
      return;
    }

    const codigoUpper = formData.codigo.toUpperCase();
    const nombreUpper = formData.nombre.toUpperCase();

    try {
      if (modalMode === 'add') {
        const esValido = await verificarExistente(codigoUpper, nombreUpper);
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(FILIALES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            codigo: codigoUpper, 
            nombre: nombreUpper,
            usuario_alta: 'DEMO'
          }),
        });
      } else if (modalMode === 'edit' && selectedFilial) {
        res = await fetch(`${FILIALES_URL}/${selectedFilial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            codigo: selectedFilial.codigo,
            nombre: nombreUpper,
            usuario_modificacion: 'DEMO'
          }),
        });
      } else {
        return;
      }

      if (!res.ok) throw new Error('Error al guardar filial');

      setModalMode(null);
      setSelectedFilial(null);
      setFormData({ codigo: '', nombre: '' });
      setErrorMessage(null);
      fetchFiliales();
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo guardar la filial');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${FILIALES_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Error al eliminar filial');

      setConfirmDelete(null);
      fetchFiliales();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la filial');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;

    try {
      const res = await fetch(`${FILIALES_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          codigo: confirmReactivar.codigo,
          nombre: confirmReactivar.nombre,
          usuario_modificacion: 'DEMO',
          fecha_baja: null,
          usuario_baja: null
        }),
      });

      if (!res.ok) throw new Error('Error al reactivar filial');

      setConfirmReactivar(null);
      fetchFiliales();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar la filial');
    }
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroCodigo([]);
    setFiltroTipoMovimiento([]);
    setFiltroNombre('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Filiales</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          
          {/* CÓDIGO */}
          <div className="tm-filtro-campo tm-filtro-codigo">
            <label className="tm-filtro-label">Código</label>
            <div className="tm-filtro-dropdown">
              <button
                onClick={() => setFiltroExpandido(prev => ({ ...prev, codigo: !prev.codigo }))}
                className="tm-filtro-dropdown-btn"
              >
                <span>
                  {filtroCodigo.length === 0 ? 'Todos' : `${filtroCodigo.length} selec`}
                </span>
                <span>▼</span>
              </button>
              
              {filtroExpandido.codigo && (
                <div className="tm-filtro-dropdown-menu">
                  <label className="tm-filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filtroCodigo.length === codigosUnicos.length}
                      onChange={toggleTodosCodigos}
                    />
                    <span>Todos</span>
                  </label>
                  <div className="tm-filtro-dropdown-lista">
                    {codigosUnicos.map(cod => (
                      <label key={cod} className="tm-filtro-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filtroCodigo.includes(cod)}
                          onChange={() => toggleCodigo(cod)}
                        />
                        <span>{cod}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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

      {/* Tabla de Filiales */}
      {loading ? (
        <div className="tm-loading">
          <div className="tm-loading-spinner"></div>
          <p className="tm-loading-texto">Cargando...</p>
        </div>
      ) : (
        <div className="tm-tabla-wrapper">
          {/* Botón Agregar */}
          <div className="tm-tabla-header-contenedor">
            <button
              onClick={handleAgregar}
              className="tm-btn-agregar"
            >
              Agregar Filial
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
          </div>

          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th className="tm-col-codigo">CÓDIGO</th>
                  <th className="tm-col-nombre">NOMBRE</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filialesPaginadas.map((f) => (
                  <tr 
                    key={f.id} 
                    className={f.fecha_baja ? 'tm-fila-inactiva' : ''}
                  >
                    <td className="tm-celda-codigo">{f.codigo}</td>
                    <td className="tm-celda-nombre">{f.nombre}</td>
                    <td>
                      <div className="tm-acciones">
                        {/* Alta */}
                        <button
                          onClick={() => f.fecha_baja ? handleReactivar(f) : null}
                          className="tm-accion-btn tm-accion-alta"
                          title={f.fecha_baja ? "Alta" : "Ya está activo"}
                          disabled={!f.fecha_baja}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                        </button>

                        {/* Modificación */}
                        <button
                          onClick={() => !f.fecha_baja && handleEditar(f)}
                          className="tm-accion-btn tm-accion-editar"
                          title={!f.fecha_baja ? "Modificación" : "Registro inactivo"}
                          disabled={!!f.fecha_baja}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                          </svg>
                        </button>

                        {/* Baja */}
                        <button
                          onClick={() => !f.fecha_baja && handleEliminar(f)}
                          className="tm-accion-btn tm-accion-baja"
                          title={!f.fecha_baja ? "Baja" : "Registro inactivo"}
                          disabled={!!f.fecha_baja}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filialesPaginadas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="tm-fila-vacia">
                      No hay filiales que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* ===== NUEVA PAGINACIÓN ===== */}
          {filialesFiltradas.length > 0 && (
            <div className="tm-paginacion">
              <button
                onClick={() => irAPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="tm-paginacion-btn"
              >
                ←
              </button>
              
              <span className="tm-paginacion-info">
                Página {paginaActual} de {totalPaginas} 
                ({filialesFiltradas.length} registros)
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
            Mostrando {filialesPaginadas.length} de {filialesFiltradas.length} filiales
          </div>
        </div>
      )}

      {/* MODALES (sin cambios) - los mismos que tenías antes */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Filial</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Código (máx 2 letras)</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: CF"
                maxLength={2}
                className="tm-modal-input"
                autoFocus
              />
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ingrese nombre"
                className="tm-modal-input"
              />
            </div>
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarFilial} className="tm-btn-primario">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'edit' && selectedFilial && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Filial</h3>
            {errorMessage && (
              <div className="tm-modal-error">{errorMessage}</div>
            )}
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Código</label>
              <input
                type="text"
                value={selectedFilial.codigo}
                disabled
                className="tm-modal-input"
              />
              <p className="tm-modal-input-hint">El código no puede modificarse</p>
            </div>
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ingrese nombre"
                className="tm-modal-input"
              />
            </div>
            {selectedFilial.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">
                  {selectedFilial.ultimoMovimiento.replace('demo', 'DEMO')}
                </p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">
                Cancelar
              </button>
              <button onClick={guardarFilial} className="tm-btn-primario">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode === 'view' && selectedFilial && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Filial</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedFilial.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Código</span>
              <p className="tm-modal-detalle-valor">{selectedFilial.codigo}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Nombre</span>
              <p className="tm-modal-detalle-valor">{selectedFilial.nombre}</p>
            </div>
            <div className={`tm-modal-detalle-movimiento ${selectedFilial.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedFilial.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
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
