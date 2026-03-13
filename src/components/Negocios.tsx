import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';
import '../styles/Negocios.module.css';

interface Negocio {
  id: number;
  nombre: string;
  url: string;
  domicilio?: {
    calle: string;
    numero: string;
    codigo_postal: string;
    localidad: string;
    provincia: string;
    pais: string;
    latitud?: number;
    longitud?: number;
  };
  whatsapp?: string;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;

export default function Negocios() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState<Negocio | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    nombre: '',
    whatsapp: '',
    domicilio: {
      calle: '',
      numero: '',
      codigo_postal: '',
      localidad: '',
      provincia: '',
      pais: '',
    }
  });
  const [confirmDelete, setConfirmDelete] = useState<Negocio | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Negocio | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroUrl, setFiltroUrl] = useState('');
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
    fetchNegocios();
  }, []);

  const fetchNegocios = async () => {
    setLoading(true);
    try {
      const res = await fetch(NEGOCIOS_URL);
      const data = await res.json();
      setNegocios(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar negocios:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (n: Negocio): string => {
    if (n.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarNegocios = (negocios: Negocio[]): Negocio[] => {
    return negocios.filter(n => {
      if (filtroNombre && !n.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      if (filtroUrl && !n.url.toLowerCase().includes(filtroUrl.toLowerCase())) return false;
      const tipo = obtenerTipoMovimiento(n);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;
      if (fechaDesde && n.fecha_alta) {
        const fechaAlta = new Date(n.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && n.fecha_alta) {
        const fechaAlta = new Date(n.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }
      return true;
    });
  };

  const negociosFiltrados = filtrarNegocios(negocios);
  
  const totalPaginas = Math.ceil(negociosFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const negociosPaginados = negociosFiltrados
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
    setFormData({ 
      nombre: '', 
      whatsapp: '',
      domicilio: {
        calle: '',
        numero: '',
        codigo_postal: '',
        localidad: '',
        provincia: '',
        pais: '',
      }
    });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (negocio: Negocio) => {
    setFormData({ 
      nombre: negocio.nombre,
      whatsapp: negocio.whatsapp || '',
      domicilio: negocio.domicilio || {
        calle: '',
        numero: '',
        codigo_postal: '',
        localidad: '',
        provincia: '',
        pais: '',
      }
    });
    setSelectedNegocio(negocio);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (negocio: Negocio) => {
    setSelectedNegocio(negocio);
    setModalMode('view');
  };

  const handleEliminar = (negocio: Negocio) => {
    setConfirmDelete(negocio);
  };

  const handleReactivar = (negocio: Negocio) => {
    if (negocio.fecha_baja) {
      setConfirmReactivar(negocio);
    }
  };

  const validarFormulario = (): boolean => {
    if (!formData.nombre.trim()) {
      setErrorMessage('El nombre del negocio es obligatorio');
      return false;
    }
    
    const whatsappRegex = /^\+[1-9]{1}[0-9]{1,14}$/;
    if (!formData.whatsapp.trim()) {
      setErrorMessage('El WhatsApp es obligatorio');
      return false;
    }
    if (!whatsappRegex.test(formData.whatsapp)) {
      setErrorMessage('El WhatsApp debe tener formato internacional válido (ej: +5491112345678)');
      return false;
    }
    
    if (!formData.domicilio.calle.trim()) {
      setErrorMessage('La calle es obligatoria');
      return false;
    }
    if (!formData.domicilio.numero.trim()) {
      setErrorMessage('El número es obligatorio');
      return false;
    }
    if (!formData.domicilio.codigo_postal.trim()) {
      setErrorMessage('El código postal es obligatorio');
      return false;
    }
    if (!formData.domicilio.localidad.trim()) {
      setErrorMessage('La localidad es obligatoria');
      return false;
    }
    if (!formData.domicilio.provincia.trim()) {
      setErrorMessage('La provincia es obligatoria');
      return false;
    }
    if (!formData.domicilio.pais.trim()) {
      setErrorMessage('El país es obligatorio');
      return false;
    }
    return true;
  };

  const verificarExistente = async (nombre: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(NEGOCIOS_URL);
      const data: Negocio[] = await res.json();
      const activos = data.filter(n => 
        !n.fecha_baja && 
        (id ? n.id !== id : true)
      );
      const nombreExistente = activos.some(n => 
        n.nombre.toLowerCase() === nombre.toLowerCase()
      );
      if (nombreExistente) {
        setErrorMessage('Ya existe un negocio activo con ese nombre');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarNegocio = async () => {
    if (!validarFormulario()) return;

    const datosParaEnviar = {
      nombre: formData.nombre.toUpperCase(),
      whatsapp: formData.whatsapp,
      domicilio: {
        calle: formData.domicilio.calle.toUpperCase(),
        numero: formData.domicilio.numero,
        codigo_postal: formData.domicilio.codigo_postal,
        localidad: formData.domicilio.localidad.toUpperCase(),
        provincia: formData.domicilio.provincia.toUpperCase(),
        pais: formData.domicilio.pais.toUpperCase(),
      }
    };

    try {
      if (modalMode === 'add') {
        const esValido = await verificarExistente(datosParaEnviar.nombre);
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(NEGOCIOS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
        });
      } else if (modalMode === 'edit' && selectedNegocio) {
        res = await fetch(`${NEGOCIOS_URL}/${selectedNegocio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar negocio');
      }

      setModalMode(null);
      setSelectedNegocio(null);
      setFormData({ 
        nombre: '', 
        whatsapp: '',
        domicilio: {
          calle: '',
          numero: '',
          codigo_postal: '',
          localidad: '',
          provincia: '',
          pais: '',
        }
      });
      setErrorMessage(null);
      fetchNegocios();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar el negocio');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${NEGOCIOS_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Error al eliminar negocio');
      setConfirmDelete(null);
      fetchNegocios();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el negocio');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;
    try {
      const res = await fetch(`${NEGOCIOS_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: confirmReactivar.nombre,
          whatsapp: confirmReactivar.whatsapp,
          domicilio: confirmReactivar.domicilio,
          fecha_baja: null,
          usuario_baja: null
        }),
      });
      if (!res.ok) throw new Error('Error al reactivar negocio');
      setConfirmReactivar(null);
      fetchNegocios();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar el negocio');
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroNombre('');
    setFiltroUrl('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Negocios</h1>

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
          <div className="tm-filtro-campo tm-filtro-url">
            <label className="tm-filtro-label">URL</label>
            <input
              type="text"
              value={filtroUrl}
              onChange={(e) => {
                setFiltroUrl(e.target.value);
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

      {/* Tabla de Negocios */}
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
                Agregar Negocio
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
                  <th className="tm-col-url">URL</th>
                  <th className="tm-col-whatsapp">WHATSAPP</th>
                  <th className="tm-col-domicilio">DOMICILIO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {negociosPaginados.map((n) => (
                  <tr key={n.id} className={n.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td>{n.nombre}</td>
                    <td>
                      <span className="text-xs text-gray-500">
                        https://turnos-pwa-frontend.onrender.com/
                      </span>
                      <a 
                        href={`/negocio/${n.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tm-url-link font-medium"
                      >
                        {n.url}
                      </a>
                    </td>
                    <td>{n.whatsapp || '-'}</td>
                    <td>
                      {n.domicilio ? (
                        <span className="text-xs">
                          {n.domicilio.calle} {n.domicilio.numero}, {n.domicilio.localidad}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <ActionIcons
                        onAdd={() => n.fecha_baja ? handleReactivar(n) : null}
                        onEdit={() => !n.fecha_baja && handleEditar(n)}
                        onDelete={() => !n.fecha_baja && handleEliminar(n)}
                        onView={() => handleVerDetalle(n)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        showView={true}
                        disabledAdd={!n.fecha_baja}
                        disabledEdit={!!n.fecha_baja}
                        disabledDelete={!!n.fecha_baja}
                        disabledView={false}
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
                {negociosPaginados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="tm-fila-vacia">
                      No hay negocios que coincidan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS MÓVIL */}
          <div className="tm-cards">
            {negociosPaginados.map((n) => (
              <div key={`card-${n.id}`} className={`tm-card-item ${n.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-nombre">{n.nombre}</div>
                <div className="tm-card-url">
                  <span className="text-xs text-gray-500">
                    https://turnos-pwa-frontend.onrender.com/
                  </span>
                  <a 
                    href={`/negocio/${n.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="tm-url-link"
                  >
                    {n.url}
                  </a>
                </div>
                {n.whatsapp && <div className="tm-card-whatsapp">{n.whatsapp}</div>}
                {n.domicilio && (
                  <div className="tm-card-domicilio text-xs">
                    {n.domicilio.calle} {n.domicilio.numero}, {n.domicilio.localidad}
                  </div>
                )}
                <div className="tm-card-acciones">
                  <ActionIcons
                    onAdd={() => n.fecha_baja ? handleReactivar(n) : null}
                    onEdit={() => !n.fecha_baja && handleEditar(n)}
                    onDelete={() => !n.fecha_baja && handleEliminar(n)}
                    onView={() => handleVerDetalle(n)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    showView={true}
                    disabledAdd={!n.fecha_baja}
                    disabledEdit={!!n.fecha_baja}
                    disabledDelete={!!n.fecha_baja}
                    disabledView={false}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* PAGINACIÓN */}
          {negociosFiltrados.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">
                Página {paginaActual} de {totalPaginas} ({negociosFiltrados.length} registros)
              </span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">
            Mostrando {negociosPaginados.length} de {negociosFiltrados.length} negocios
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Negocio</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ej: PELUQUERÍA CANINA"
                className="tm-modal-input"
                required
                autoFocus
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">WhatsApp *</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (/^[+0-9]*$/.test(valor)) {
                    setFormData({ ...formData, whatsapp: valor });
                  }
                }}
                onBlur={() => {
                  const whatsappRegex = /^\+[1-9]{1}[0-9]{1,14}$/;
                  if (formData.whatsapp && !whatsappRegex.test(formData.whatsapp)) {
                    setErrorMessage('El WhatsApp debe tener formato internacional válido (ej: +5491112345678)');
                  } else {
                    setErrorMessage(null);
                  }
                }}
                placeholder="+5491112345678"
                className={`tm-modal-input ${formData.whatsapp && !/^\+[1-9]{1}[0-9]{1,14}$/.test(formData.whatsapp) ? 'tm-input-error' : ''}`}
                required
              />
              {formData.whatsapp && !/^\+[1-9]{1}[0-9]{1,14}$/.test(formData.whatsapp) && (
                <small className="tm-error-text">Formato: +5491112345678</small>
              )}
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Domicilio *</label>
              <div className="tm-buscador-direccion">
                <input
                  type="text"
                  placeholder="Buscar dirección (ej: Av Corrientes 1234, CABA)"
                  className="tm-modal-input tm-buscador-input"
                  id="buscador-direccion"
                />
                <div className="tm-sugerencias"></div>
              </div>

              <div className="tm-grid-2">
                <div>
                  <label className="tm-label-chico">Calle</label>
                  <input
                    type="text"
                    value={formData.domicilio.calle}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, calle: e.target.value.toUpperCase() } })}
                    placeholder="CALLE"
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Número</label>
                  <input
                    type="text"
                    value={formData.domicilio.numero}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, numero: e.target.value } })}
                    placeholder="NÚMERO"
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Código Postal</label>
                  <input
                    type="text"
                    value={formData.domicilio.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, codigo_postal: e.target.value } })}
                    placeholder="CP"
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Localidad</label>
                  <input
                    type="text"
                    value={formData.domicilio.localidad}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, localidad: e.target.value.toUpperCase() } })}
                    placeholder="LOCALIDAD"
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Provincia</label>
                  <input
                    type="text"
                    value={formData.domicilio.provincia}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, provincia: e.target.value.toUpperCase() } })}
                    placeholder="PROVINCIA"
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">País</label>
                  <input
                    type="text"
                    value={formData.domicilio.pais}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, pais: e.target.value.toUpperCase() } })}
                    placeholder="PAÍS"
                    className="tm-modal-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarNegocio} className="tm-btn-primario">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedNegocio && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Negocio</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                className="tm-modal-input"
                required
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">WhatsApp *</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => {
                  const valor = e.target.value;
                  if (/^[+0-9]*$/.test(valor)) {
                    setFormData({ ...formData, whatsapp: valor });
                  }
                }}
                className={`tm-modal-input ${formData.whatsapp && !/^\+[1-9]{1}[0-9]{1,14}$/.test(formData.whatsapp) ? 'tm-input-error' : ''}`}
                required
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Domicilio *</label>
              <div className="tm-grid-2">
                <div>
                  <label className="tm-label-chico">Calle</label>
                  <input
                    type="text"
                    value={formData.domicilio.calle}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, calle: e.target.value.toUpperCase() } })}
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Número</label>
                  <input
                    type="text"
                    value={formData.domicilio.numero}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, numero: e.target.value } })}
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Código Postal</label>
                  <input
                    type="text"
                    value={formData.domicilio.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, codigo_postal: e.target.value } })}
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Localidad</label>
                  <input
                    type="text"
                    value={formData.domicilio.localidad}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, localidad: e.target.value.toUpperCase() } })}
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">Provincia</label>
                  <input
                    type="text"
                    value={formData.domicilio.provincia}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, provincia: e.target.value.toUpperCase() } })}
                    className="tm-modal-input"
                    required
                  />
                </div>
                <div>
                  <label className="tm-label-chico">País</label>
                  <input
                    type="text"
                    value={formData.domicilio.pais}
                    onChange={(e) => setFormData({ ...formData, domicilio: { ...formData.domicilio, pais: e.target.value.toUpperCase() } })}
                    className="tm-modal-input"
                    required
                  />
                </div>
              </div>
            </div>

            {selectedNegocio.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">{selectedNegocio.ultimoMovimiento.replace('demo', 'DEMO')}</p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarNegocio} className="tm-btn-primario">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedNegocio && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Negocio</h3>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">ID</span>
              <p className="tm-modal-detalle-valor">{selectedNegocio.id}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Nombre</span>
              <p className="tm-modal-detalle-valor">{selectedNegocio.nombre}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">URL</span>
              <p className="tm-modal-detalle-valor">{selectedNegocio.url}</p>
            </div>
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">WhatsApp</span>
              <p className="tm-modal-detalle-valor">{selectedNegocio.whatsapp}</p>
            </div>
            {selectedNegocio.domicilio && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">Domicilio</span>
                <p className="tm-modal-detalle-valor">
                  {selectedNegocio.domicilio.calle} {selectedNegocio.domicilio.numero}<br />
                  {selectedNegocio.domicilio.codigo_postal} - {selectedNegocio.domicilio.localidad}<br />
                  {selectedNegocio.domicilio.provincia}, {selectedNegocio.domicilio.pais}
                </p>
              </div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedNegocio.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">
                {selectedNegocio.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
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
              ¿Dar de BAJA al negocio <strong>{confirmDelete.nombre}</strong>?
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
              ¿Reactivar el negocio <strong>{confirmReactivar.nombre}</strong>?
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
