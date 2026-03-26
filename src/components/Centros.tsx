import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import MapaSelector from './MapaSelector';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import TablaMaestra from './TablaMaestra';
import '../styles/tablas-maestras.css';

interface Negocio {
  id: number;
  nombre: string;
  url: string;
  fecha_baja?: string | null;
}

interface Centro {
  id: number;
  negocioId: number;
  negocio?: Negocio;
  nombre: string;
  codigo: string;
  whatsapp_e164?: string;
  country_code?: number;
  national_number?: string;
  street?: string;
  street_number?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code_iso?: string;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const CENTROS_URL = `${API_BASE_URL}/centros`;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;

export default function Centros() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCentro, setSelectedCentro] = useState<Centro | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    negocioId: '',
    nombre: '',
    domicilio: null as any,
  });
  const [phoneValue, setPhoneValue] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState<Centro | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Centro | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNegocio, setFiltroNegocio] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroExpandido, setFiltroExpandido] = useState({ movimiento: false });
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  const tiposMovimiento = ['Altas', 'Bajas'];

  useEffect(() => {
    fetchCentros();
    fetchNegocios();
  }, []);

  const fetchCentros = async () => {
    setLoading(true);
    try {
      const res = await fetch(CENTROS_URL);
      const data = await res.json();
      setCentros(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar centros:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNegocios = async () => {
    try {
      const res = await fetch(NEGOCIOS_URL);
      const data = await res.json();
      setNegocios(data.filter((n: Negocio) => !n.fecha_baja));
    } catch (err) {
      console.error('Error al cargar negocios:', err);
    }
  };

  const obtenerTipoMovimiento = (c: Centro): string => {
    if (c.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarCentros = () => {
    return centros.filter(c => {
      if (filtroNegocio && !c.negocio?.nombre.toLowerCase().includes(filtroNegocio.toLowerCase())) return false;
      if (filtroNombre && !c.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      const tipo = obtenerTipoMovimiento(c);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;
      if (fechaDesde && c.fecha_alta) {
        const fechaAlta = new Date(c.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && c.fecha_alta) {
        const fechaAlta = new Date(c.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }
      return true;
    });
  };

  const centrosFiltrados = filtrarCentros();
  const totalPaginas = Math.ceil(centrosFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const centrosPaginados = centrosFiltrados
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
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
    setFormData({ negocioId: '', nombre: '', domicilio: null });
    setPhoneValue(undefined);
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (centro: Centro) => {
    const domicilioObj = centro.street ? {
      street: centro.street,
      street_number: centro.street_number,
      postal_code: centro.postal_code,
      city: centro.city,
      state: centro.state,
      country: centro.country,
      country_code: centro.country_code_iso,
      latitude: centro.latitude,
      longitude: centro.longitude,
      formatted_address: centro.formatted_address,
    } : null;

    setFormData({ 
      negocioId: centro.negocioId.toString(),
      nombre: centro.nombre,
      domicilio: domicilioObj,
    });
    setPhoneValue(centro.whatsapp_e164);
    setSelectedCentro(centro);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (centro: Centro) => {
    setSelectedCentro(centro);
    setModalMode('view');
  };

  const handleEliminar = (centro: Centro) => setConfirmDelete(centro);
  const handleReactivar = (centro: Centro) => centro.fecha_baja && setConfirmReactivar(centro);

  const parsePhoneE164 = (phone: string | undefined) => {
    if (!phone) return { country_code: null, national_number: '' };
    const match = phone.match(/^\+(\d{1,3})(\d+)$/);
    if (match) {
      return { country_code: parseInt(match[1], 10), national_number: match[2] };
    }
    return { country_code: null, national_number: '' };
  };

  const formatearDireccion = (c: Centro): string => {
    const partes = [
      c.street,
      c.street_number,
      c.city,
      c.postal_code,
      c.state,
      c.country
    ].filter(Boolean);
    return partes.join(' ') || c.formatted_address || '';
  };

  const validarFormulario = (): boolean => {
    if (!formData.negocioId) {
      setErrorMessage('Debe seleccionar un negocio');
      return false;
    }
    if (!formData.nombre.trim()) {
      setErrorMessage('El nombre del centro es obligatorio');
      return false;
    }
    if (!phoneValue) {
      setErrorMessage('El WhatsApp es obligatorio');
      return false;
    }
    if (!formData.domicilio || !formData.domicilio.formatted_address) {
      setErrorMessage('Debés seleccionar una dirección válida en el mapa');
      return false;
    }
    return true;
  };

  const verificarExistente = async (nombre: string, negocioId: number, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(CENTROS_URL);
      const data: Centro[] = await res.json();
      const activos = data.filter(c => 
        !c.fecha_baja && 
        c.negocioId === negocioId &&
        (id ? c.id !== id : true)
      );
      const nombreExistente = activos.some(c => 
        c.nombre.toLowerCase() === nombre.toLowerCase()
      );
      if (nombreExistente) {
        setErrorMessage('Ya existe un centro activo con ese nombre en este negocio');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarCentro = async () => {
    if (!validarFormulario()) return;

    const { country_code, national_number } = parsePhoneE164(phoneValue);
    if (!country_code || !national_number) {
      setErrorMessage('El número de WhatsApp no es válido');
      return;
    }

    const datosParaEnviar = {
      negocioId: parseInt(formData.negocioId),
      nombre: formData.nombre.toUpperCase(),
      country_code,
      national_number,
      domicilio: formData.domicilio,
    };

    try {
      if (modalMode === 'add') {
        const esValido = await verificarExistente(datosParaEnviar.nombre, datosParaEnviar.negocioId);
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(CENTROS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
        });
      } else if (modalMode === 'edit' && selectedCentro) {
        res = await fetch(`${CENTROS_URL}/${selectedCentro.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar centro');
      }

      setModalMode(null);
      setSelectedCentro(null);
      setFormData({ negocioId: '', nombre: '', domicilio: null });
      setPhoneValue(undefined);
      setErrorMessage(null);
      fetchCentros();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar el centro');
    }
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${CENTROS_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Error al eliminar centro');
      setConfirmDelete(null);
      fetchCentros();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el centro');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;
    try {
      const res = await fetch(`${CENTROS_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          negocioId: confirmReactivar.negocioId,
          nombre: confirmReactivar.nombre,
          country_code: confirmReactivar.country_code,
          national_number: confirmReactivar.national_number,
          street: confirmReactivar.street,
          street_number: confirmReactivar.street_number,
          postal_code: confirmReactivar.postal_code,
          city: confirmReactivar.city,
          state: confirmReactivar.state,
          country: confirmReactivar.country,
          country_code_iso: confirmReactivar.country_code_iso,
          latitude: confirmReactivar.latitude,
          longitude: confirmReactivar.longitude,
          formatted_address: confirmReactivar.formatted_address,
          fecha_baja: null,
          usuario_baja: null
        }),
      });
      if (!res.ok) throw new Error('Error al reactivar centro');
      setConfirmReactivar(null);
      fetchCentros();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar el centro');
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroNegocio('');
    setFiltroNombre('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  // Preparar datos para TablaMaestra
  const datosTabla = centrosPaginados.map(c => ({
    ...c,
    negocioNombre: c.negocio?.nombre || `ID: ${c.negocioId}`,
    direccion: formatearDireccion(c).substring(0, 40),
    estado: c.fecha_baja ? 'Inactivo' : 'Activo'
  }));

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Centros</h1>

      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Negocio</label>
            <input type="text" value={filtroNegocio} onChange={(e) => { setFiltroNegocio(e.target.value); setPaginaActual(1); }} placeholder="Buscar negocio..." className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Nombre</label>
            <input type="text" value={filtroNombre} onChange={(e) => { setFiltroNombre(e.target.value); setPaginaActual(1); }} placeholder="Buscar centro..." className="tm-filtro-input" />
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
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner">
              <button onClick={handleAgregar} className="tm-btn-agregar">
                Agregar Centro
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          <TablaMaestra
            columnas={[
              { key: 'codigo', label: 'CÓDIGO' },
              { key: 'negocioNombre', label: 'NEGOCIO' },
              { key: 'nombre', label: 'NOMBRE' },
              { key: 'whatsapp_e164', label: 'WHATSAPP' },
              { key: 'direccion', label: 'DOMICILIO' },
              { key: 'estado', label: 'ESTADO' }
            ]}
            datos={datosTabla}
            onAdd={(item) => item.fecha_baja && handleReactivar(item)}
            onEdit={(item) => !item.fecha_baja && handleEditar(item)}
            onDelete={(item) => !item.fecha_baja && handleEliminar(item)}
            onView={(item) => handleVerDetalle(item)}
            esInactivo={(item) => item.fecha_baja}
          />
          
          {centrosFiltrados.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">Página {paginaActual} de {totalPaginas} ({centrosFiltrados.length} registros)</span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">Mostrando {centrosPaginados.length} de {centrosFiltrados.length} centros</div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Centro</h3>
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
                {negocios.map(n => (<option key={n.id} value={n.id}>{n.nombre}</option>))}
              </select>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ej: SUCURSAL LANÚS"
                className="tm-modal-input"
                autoFocus
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">WhatsApp *</label>
              <PhoneInput
                international
                defaultCountry="AR"
                value={phoneValue}
                onChange={setPhoneValue}
                className="tm-phone-input"
                limitMaxLength={true}
              />
              <small className="tm-ayuda-texto">Seleccioná país e ingresá tu número</small>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Domicilio *</label>
              <MapaSelector
                value={formData.domicilio}
                onChange={(nuevaDireccion) => setFormData({ ...formData, domicilio: nuevaDireccion })}
                defaultCountry="AR"
                autoLocate={true}
              />
            </div>

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarCentro} className="tm-btn-primario">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedCentro && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Centro</h3>
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
                {negocios.map(n => (<option key={n.id} value={n.id}>{n.nombre}</option>))}
              </select>
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
              <label className="tm-modal-label">Código</label>
              <input
                type="text"
                value={selectedCentro.codigo}
                className="tm-modal-input"
                disabled
              />
              <small className="tm-ayuda-texto">Código generado automáticamente</small>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">WhatsApp *</label>
              <PhoneInput
                international
                defaultCountry="AR"
                value={phoneValue}
                onChange={setPhoneValue}
                className="tm-phone-input"
                limitMaxLength={true}
              />
            </div>

            {selectedCentro.street && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Domicilio actual</label>
                <div className="tm-direccion-actual">
                  <p className="tm-direccion-texto">{formatearDireccion(selectedCentro)}</p>
                  <p className="tm-coordenadas-texto">
                    Lat: {Number(selectedCentro.latitude).toFixed(6)}, 
                    Lng: {Number(selectedCentro.longitude).toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Buscar nueva dirección</label>
              <MapaSelector
                value={formData.domicilio}
                onChange={(nuevaDireccion) => setFormData({ ...formData, domicilio: nuevaDireccion })}
                defaultCountry="AR"
                autoLocate={false}
              />
            </div>

            {selectedCentro.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">{selectedCentro.ultimoMovimiento.replace('demo', 'DEMO')}</p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarCentro} className="tm-btn-primario">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedCentro && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Centro</h3>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">ID</span><p className="tm-modal-detalle-valor">{selectedCentro.id}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Código</span><p className="tm-modal-detalle-valor">{selectedCentro.codigo}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Negocio</span><p className="tm-modal-detalle-valor">{selectedCentro.negocio?.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Nombre</span><p className="tm-modal-detalle-valor">{selectedCentro.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">WhatsApp</span><p className="tm-modal-detalle-valor">{selectedCentro.whatsapp_e164}</p></div>
            {selectedCentro.street && (
              <div className="tm-modal-detalle-campo">
                <span className="tm-modal-detalle-label">Domicilio</span>
                <p className="tm-modal-detalle-valor">{formatearDireccion(selectedCentro)}</p>
                <p className="tm-modal-detalle-valor text-xs text-gray-500">
                  Lat: {Number(selectedCentro.latitude).toFixed(6)}, 
                  Lng: {Number(selectedCentro.longitude).toFixed(6)}
                </p>
              </div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedCentro.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">{selectedCentro.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}</p>
            </div>
            <div className="tm-modal-acciones"><button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cerrar</button></div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR BAJA */}
      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Dar de BAJA al centro <strong>{confirmDelete.nombre}</strong>?</p>
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
            <p className="text-gray-700 mb-2 text-sm">¿Reactivar el centro <strong>{confirmReactivar.nombre}</strong>?</p>
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
