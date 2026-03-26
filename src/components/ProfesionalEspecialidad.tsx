import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';

interface Profesional {
  id: number;
  nombre: string;
  documento: string;
  fecha_baja?: string | null;
}

interface Especialidad {
  id: number;
  nombre: string;
  fecha_baja?: string | null;
}

interface Relacion {
  id: number;
  profesionalId: number;
  especialidadId: number;
  descripcion?: string;
  profesional?: Profesional;
  especialidad?: Especialidad;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RELACIONES_URL = `${API_BASE_URL}/profesional-especialidad`;
const PROFESIONALES_URL = `${API_BASE_URL}/profesionales`;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;

export default function ProfesionalEspecialidad() {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRelacion, setSelectedRelacion] = useState<Relacion | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    profesionalId: '', 
    especialidadId: '',
    descripcion: ''
  });
  const [confirmDelete, setConfirmDelete] = useState<Relacion | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Relacion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroProfesional, setFiltroProfesional] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
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

  const obtenerTipoMovimiento = (r: Relacion): string => {
    if (r.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarRelaciones = () => {
    return relaciones.filter(r => {
      if (filtroProfesional && !r.profesional?.nombre.toLowerCase().includes(filtroProfesional.toLowerCase())) return false;
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

  const handleAgregar = () => {
    setFormData({ profesionalId: '', especialidadId: '', descripcion: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (relacion: Relacion) => {
    setFormData({ 
      profesionalId: relacion.profesionalId.toString(),
      especialidadId: relacion.especialidadId.toString(),
      descripcion: relacion.descripcion || ''
    });
    setSelectedRelacion(relacion);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (relacion: Relacion) => {
    setSelectedRelacion(relacion);
    setModalMode('view');
  };

  const handleEliminar = (relacion: Relacion) => setConfirmDelete(relacion);
  const handleReactivar = (relacion: Relacion) => relacion.fecha_baja && setConfirmReactivar(relacion);

  const validarFormulario = (): boolean => {
    if (!formData.profesionalId) {
      setErrorMessage('Debe seleccionar un profesional');
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

    const datosParaEnviar = {
      profesionalId: parseInt(formData.profesionalId),
      especialidadId: parseInt(formData.especialidadId),
      descripcion: formData.descripcion || null
    };

    try {
      let res;
      if (modalMode === 'add') {
        res = await fetch(RELACIONES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
        });
      } else if (modalMode === 'edit' && selectedRelacion) {
        res = await fetch(`${RELACIONES_URL}/${selectedRelacion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
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
      setFormData({ profesionalId: '', especialidadId: '', descripcion: '' });
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
          descripcion: confirmReactivar.descripcion,
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
    setFiltroEspecialidad('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Profesional ↔ Especialidad</h1>

      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Profesional</label>
            <input type="text" value={filtroProfesional} onChange={(e) => { setFiltroProfesional(e.target.value); setPaginaActual(1); }} placeholder="Buscar profesional..." className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Especialidad</label>
            <input type="text" value={filtroEspecialidad} onChange={(e) => { setFiltroEspecialidad(e.target.value); setPaginaActual(1); }} placeholder="Buscar especialidad..." className="tm-filtro-input" />
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
          <div className="tm-tabla-header-contenedor"><div className="tm-tabla-header-inner"><button onClick={handleAgregar} className="tm-btn-agregar">Asignar Especialidad a Profesional<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></button></div></div>

          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th>PROFESIONAL</th>
                  <th>ESPECIALIDAD</th>
                  <th>DESCRIPCIÓN</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </thead>
              <tbody>
                {relacionesPaginadas.map(r => (
                  <tr key={r.id} className={r.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td className="tm-celda-nombre">{r.profesional?.nombre || `ID: ${r.profesionalId}`} </td>
                    <td>{r.especialidad?.nombre || `ID: ${r.especialidadId}`}</td>
                    <td>{r.descripcion || '-'}</td>
                    <td>{r.fecha_baja ? <span className="text-red-600">Inactivo</span> : <span className="text-green-600">Activo</span>}</td>
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
                    <td colSpan={5} className="tm-fila-vacia">No hay relaciones que coincidan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tm-cards">
            {relacionesPaginadas.map(r => (
              <div key={`card-${r.id}`} className={`tm-card-item ${r.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-profesional"><strong>{r.profesional?.nombre || `Profesional ${r.profesionalId}`}</strong></div>
                <div className="tm-card-especialidad">Especialidad: <strong>{r.especialidad?.nombre || `ID ${r.especialidadId}`}</strong></div>
                {r.descripcion && <div className="tm-card-descripcion text-sm text-gray-600">📝 {r.descripcion}</div>}
                <div className="tm-card-estado">Estado: {r.fecha_baja ? 'Inactivo' : 'Activo'}</div>
                <div className="tm-card-acciones mt-2">
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
            <h3 className="tm-modal-titulo">Asignar Especialidad a Profesional</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Profesional *</label>
              <select 
                value={formData.profesionalId} 
                onChange={(e) => setFormData({ ...formData, profesionalId: e.target.value })} 
                className="tm-modal-input" 
                required
              >
                <option value="">Seleccionar profesional...</option>
                {profesionales.map(p => (<option key={p.id} value={p.id}>{p.nombre} ({p.documento})</option>))}
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
                {especialidades.map(e => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Ej: Especialista en cardiología clínica"
                className="tm-modal-input tm-input-descripcion"
                rows={3}
              />
              <small className="tm-ayuda-texto">Descripción de la especialidad para este profesional (opcional)</small>
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
            <h3 className="tm-modal-titulo">Editar Relación</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Profesional *</label>
              <select 
                value={formData.profesionalId} 
                onChange={(e) => setFormData({ ...formData, profesionalId: e.target.value })} 
                className="tm-modal-input" 
                required
              >
                <option value="">Seleccionar profesional...</option>
                {profesionales.map(p => (<option key={p.id} value={p.id}>{p.nombre} ({p.documento})</option>))}
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
                {especialidades.map(e => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="tm-modal-input tm-input-descripcion"
                rows={3}
              />
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
            <h3 className="tm-modal-titulo">Detalle de Relación</h3>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">ID</span><p className="tm-modal-detalle-valor">{selectedRelacion.id}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Profesional</span><p className="tm-modal-detalle-valor">{selectedRelacion.profesional?.nombre} ({selectedRelacion.profesional?.documento})</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Especialidad</span><p className="tm-modal-detalle-valor">{selectedRelacion.especialidad?.nombre}</p></div>
            {selectedRelacion.descripcion && (
              <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Descripción</span><p className="tm-modal-detalle-valor">{selectedRelacion.descripcion}</p></div>
            )}
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
            <p className="text-gray-700 mb-2 text-sm">¿Desactivar la asignación de <strong>{confirmDelete.especialidad?.nombre}</strong> al profesional <strong>{confirmDelete.profesional?.nombre}</strong>?</p>
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
            <p className="text-gray-700 mb-2 text-sm">¿Reactivar la asignación de <strong>{confirmReactivar.especialidad?.nombre}</strong> al profesional <strong>{confirmReactivar.profesional?.nombre}</strong>?</p>
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
