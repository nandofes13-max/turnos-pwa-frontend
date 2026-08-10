// src/components/InstanciasWhatsApp.tsx
import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';
import '../styles/InstanciasWhatsApp.module.css';

interface Instancia {
  id: number;
  instanceId: string;
  apiToken: string;
  numeroWhatsapp: string | null;
  negociosActivos: number;
  estado: string; // 'disponible' | 'no disponible'
  fechaLlena: string | null;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const INSTANCIAS_URL = `${API_BASE_URL}/instancias-whatsapp`;

export default function InstanciasWhatsApp() {
  const [instancias, setInstancias] = useState<Instancia[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstancia, setSelectedInstancia] = useState<Instancia | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({
    instanceId: '',
    apiToken: '',
  });
  const [confirmDelete, setConfirmDelete] = useState<Instancia | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Instancia | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroExpandido, setFiltroExpandido] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);

  useEffect(() => {
    fetchInstancias();
  }, []);

  const fetchInstancias = async () => {
    setLoading(true);
    try {
      const res = await fetch(INSTANCIAS_URL);
      const data = await res.json();
      setInstancias(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar instancias:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtrarInstancias = (instancias: Instancia[]): Instancia[] => {
    return instancias.filter(i => {
      // Filtro por estado
      if (filtroEstado !== 'todos') {
        if (filtroEstado === 'activas' && i.fecha_baja) return false;
        if (filtroEstado === 'inactivas' && !i.fecha_baja) return false;
        if (filtroEstado === 'disponible' && i.estado !== 'disponible') return false;
        if (filtroEstado === 'no disponible' && i.estado !== 'no disponible') return false;
      }
      // Filtro por número de WhatsApp
      if (filtroNumero && i.numeroWhatsapp && !i.numeroWhatsapp.includes(filtroNumero)) return false;
      return true;
    });
  };

  const instanciasFiltradas = filtrarInstancias(instancias);

  const totalPaginas = Math.ceil(instanciasFiltradas.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const instanciasPaginadas = instanciasFiltradas
    .sort((a, b) => a.id - b.id)
    .slice(indicePrimerItem, indiceUltimoItem);

  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
  };

  const handleAgregar = () => {
    setFormData({ instanceId: '', apiToken: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (instancia: Instancia) => {
    setFormData({
      instanceId: instancia.instanceId,
      apiToken: instancia.apiToken,
    });
    setSelectedInstancia(instancia);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (instancia: Instancia) => {
    setSelectedInstancia(instancia);
    setModalMode('view');
  };

  const handleEliminar = (instancia: Instancia) => {
    if (!instancia.fecha_baja) {
      setConfirmDelete(instancia);
    }
  };

  const handleReactivar = (instancia: Instancia) => {
    if (instancia.fecha_baja) {
      setConfirmReactivar(instancia);
    }
  };

  const validarFormulario = (): boolean => {
    if (!formData.instanceId.trim()) {
      setErrorMessage('El ID de instancia es obligatorio');
      return false;
    }
    if (!formData.apiToken.trim()) {
      setErrorMessage('El token de API es obligatorio');
      return false;
    }
    return true;
  };

  const guardarInstancia = async () => {
    if (!validarFormulario()) return;

    try {
      let res;
      if (modalMode === 'add') {
        res = await fetch(INSTANCIAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === 'edit' && selectedInstancia) {
        res = await fetch(`${INSTANCIAS_URL}/${selectedInstancia.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar la instancia');
      }

      setModalMode(null);
      setSelectedInstancia(null);
      setFormData({ instanceId: '', apiToken: '' });
      setErrorMessage(null);
      fetchInstancias();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar la instancia');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${INSTANCIAS_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Error al eliminar instancia');
      setConfirmDelete(null);
      fetchInstancias();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la instancia');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;
    try {
      const res = await fetch(`${INSTANCIAS_URL}/${confirmReactivar.id}/reactivar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Error al reactivar instancia');
      setConfirmReactivar(null);
      fetchInstancias();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar la instancia');
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroNumero('');
    setPaginaActual(1);
  };

  const obtenerEstadoLabel = (estado: string, fechaBaja: string | null): string => {
    if (fechaBaja) return 'Inactiva';
    switch (estado) {
      case 'disponible': return '🟢 Disponible';
      case 'no disponible': return '🔴 No disponible';
      default: return estado;
    }
  };

  const obtenerEstadoColor = (estado: string, fechaBaja: string | null): string => {
    if (fechaBaja) return '#9ca3af';
    switch (estado) {
      case 'disponible': return '#22c55e';
      case 'no disponible': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Instancias WhatsApp</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
              className="tm-filtro-input"
            >
              <option value="todos">Todos</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
              <option value="disponible">🟢 Disponibles</option>
              <option value="no disponible">🔴 No disponibles</option>
            </select>
          </div>
          <div className="tm-filtro-campo tm-filtro-url">
            <label className="tm-filtro-label">Número WhatsApp</label>
            <input
              type="text"
              value={filtroNumero}
              onChange={(e) => {
                setFiltroNumero(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Buscar por número..."
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-accion">
            <button onClick={limpiarFiltros} className="tm-btn-limpiar">
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

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
                Agregar Instancia
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th className="tm-col-id">ID</th>
                  <th>INSTANCIA</th>
                  <th>NÚMERO WHATSAPP</th>
                  <th>NEGOCIOS ACTIVOS</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {instanciasPaginadas.map((i) => (
                  <tr key={i.id} className={i.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td>{i.id}</td>
                    <td>
                      <span className="font-mono text-sm">{i.instanceId}</span>
                    </td>
                    <td>{i.numeroWhatsapp || '-'}</td>
                    <td>
                      <span className={`font-medium ${i.negociosActivos >= 3 ? 'text-red-600' : 'text-green-600'}`}>
                        {i.negociosActivos}/3
                      </span>
                    </td>
                    <td>
                      <span
                        style={{ color: obtenerEstadoColor(i.estado, i.fecha_baja || null) }}
                        className="font-medium"
                      >
                        {obtenerEstadoLabel(i.estado, i.fecha_baja || null)}
                      </span>
                    </td>
                    <td>
                      <ActionIcons
                        onAdd={() => i.fecha_baja ? handleReactivar(i) : null}
                        onEdit={() => !i.fecha_baja && handleEditar(i)}
                        onDelete={() => !i.fecha_baja && handleEliminar(i)}
                        onView={() => handleVerDetalle(i)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        showView={true}
                        disabledAdd={!i.fecha_baja}
                        disabledEdit={!!i.fecha_baja}
                        disabledDelete={!!i.fecha_baja}
                        disabledView={false}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {instanciasPaginadas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="tm-fila-vacia">
                      No hay instancias que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Vista mobile en cards */}
          <div className="tm-cards">
            {instanciasPaginadas.map((i) => (
              <div key={`card-${i.id}`} className={`tm-card-item ${i.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-nombre">ID: {i.id}</div>
                <div className="tm-card-instancia font-mono text-sm">{i.instanceId}</div>
                <div className="tm-card-whatsapp">📱 {i.numeroWhatsapp || '-'}</div>
                <div className="tm-card-negocios">
                  Negocios: {i.negociosActivos}/3
                </div>
                <div className="tm-card-estado">
                  <span style={{ color: obtenerEstadoColor(i.estado, i.fecha_baja || null) }}>
                    {obtenerEstadoLabel(i.estado, i.fecha_baja || null)}
                  </span>
                </div>
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => i.fecha_baja ? handleReactivar(i) : null}
                    onEdit={() => !i.fecha_baja && handleEditar(i)}
                    onDelete={() => !i.fecha_baja && handleEliminar(i)}
                    onView={() => handleVerDetalle(i)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    showView={true}
                    disabledAdd={!i.fecha_baja}
                    disabledEdit={!!i.fecha_baja}
                    disabledDelete={!!i.fecha_baja}
                    disabledView={false}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>

          {instanciasFiltradas.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">
                Página {paginaActual} de {totalPaginas} ({instanciasFiltradas.length} registros)
              </span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">
            Mostrando {instanciasPaginadas.length} de {instanciasFiltradas.length} instancias
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Instancia GREEN API</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}

            <div className="tm-modal-campo">
              <label className="tm-modal-label">ID de Instancia *</label>
              <input
                type="text"
                value={formData.instanceId}
                onChange={(e) => setFormData({ ...formData, instanceId: e.target.value })}
                placeholder="Ej: 710722705481"
                className="tm-modal-input"
                required
                autoFocus
              />
              <small className="tm-ayuda-texto">Obtenido de GREEN API</small>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Token de API *</label>
              <input
                type="text"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                placeholder="Token generado por GREEN API"
                className="tm-modal-input"
                required
              />
              <small className="tm-ayuda-texto">Obtenido de GREEN API</small>
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarInstancia} className="tm-btn-primario">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedInstancia && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Instancia</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}

            <div className="tm-modal-campo">
              <label className="tm-modal-label">ID de Instancia *</label>
              <input
                type="text"
                value={formData.instanceId}
                onChange={(e) => setFormData({ ...formData, instanceId: e.target.value })}
                className="tm-modal-input"
                required
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Token de API *</label>
              <input
                type="text"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                className="tm-modal-input"
                required
              />
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarInstancia} className="tm-btn-primario">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedInstancia && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Instancia</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedInstancia.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID de Instancia</span>
              <p className="tm-modal-detalle-valor font-mono">{selectedInstancia.instanceId}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Token de API</span>
              <p className="tm-modal-detalle-valor font-mono">{selectedInstancia.apiToken}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Número WhatsApp</span>
              <p className="tm-modal-detalle-valor">{selectedInstancia.numeroWhatsapp || '-'}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Negocios Activos</span>
              <p className="tm-modal-detalle-valor">{selectedInstancia.negociosActivos}/3</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Estado</span>
              <p className="tm-modal-detalle-valor" style={{ color: obtenerEstadoColor(selectedInstancia.estado, selectedInstancia.fecha_baja || null) }}>
                {obtenerEstadoLabel(selectedInstancia.estado, selectedInstancia.fecha_baja || null)}
              </p>
            </div>
            {selectedInstancia.fechaLlena && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">Fecha Llena</span>
                <p className="tm-modal-detalle-valor">
                  {new Date(selectedInstancia.fechaLlena).toLocaleString('es-AR')}
                </p>
              </div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedInstancia.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedInstancia.fecha_baja
                  ? `${selectedInstancia.usuario_baja || 'admin'} - BAJA - ${new Date(selectedInstancia.fecha_baja).toLocaleString('es-AR')}`
                  : `${selectedInstancia.usuario_alta || 'admin'} - ALTA - ${new Date(selectedInstancia.fecha_alta || '').toLocaleString('es-AR')}`
                }
              </p>
            </div>
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR ELIMINAR */}
      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">
              ¿Dar de BAJA a la instancia <strong>{confirmDelete.instanceId}</strong>?
            </p>
            <p className="tm-modal-input-hint mb-4">
              Solo se puede eliminar si no tiene negocios activos.
            </p>
            <div className="tm-modal-acciones">
              <button onClick={() => setConfirmDelete(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={confirmarEliminar} className="tm-btn-danger">Confirmar BAJA</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR REACTIVAR */}
      {confirmReactivar && (
        <div className="tm-modal-overlay" onClick={() => setConfirmReactivar(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">
              ¿Reactivar la instancia <strong>{confirmReactivar.instanceId}</strong>?
            </p>
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
