import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import MapaSelector from './MapaSelector';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/tablas-maestras.css';
import styles from '../styles/Centros.module.css';

// 🔹 NUEVO: Componente de selector de timezone con búsqueda
function TimezoneSelector({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Lista completa de timezones comunes
  const timezones = [
    'America/Argentina/Buenos_Aires',
    'America/Argentina/Cordoba',
    'America/Argentina/Salta',
    'America/Argentina/Jujuy',
    'America/Argentina/Tucuman',
    'America/Argentina/Catamarca',
    'America/Argentina/La_Rioja',
    'America/Argentina/San_Juan',
    'America/Argentina/Mendoza',
    'America/Argentina/San_Luis',
    'America/Argentina/Rio_Gallegos',
    'America/Argentina/Ushuaia',
    'America/Santiago',
    'America/Sao_Paulo',
    'America/Mexico_City',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'America/Toronto',
    'America/Vancouver',
    'America/Bogota',
    'America/Lima',
    'America/Caracas',
    'Europe/Madrid',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Lisbon',
    'Europe/Athens',
    'Africa/Casablanca',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
    'Pacific/Auckland',
    'UTC'
  ];

  const filtered = search 
    ? timezones.filter(tz => tz.toLowerCase().includes(search.toLowerCase()))
    : timezones;

  const getDisplayName = (tz: string) => {
    const parts = tz.split('/');
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    const region = parts.length > 1 ? parts[parts.length - 2] : '';
    return `${city}${region ? `, ${region}` : ''} (${tz})`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={search || (value ? getDisplayName(value) : '')}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar zona horaria (ej: Madrid, New York)..."
        className="tm-modal-input"
        style={{ cursor: 'pointer' }}
      />
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {filtered.map(tz => (
            <div
              key={tz}
              onClick={() => {
                onChange(tz);
                setSearch('');
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                backgroundColor: tz === value ? '#e3f2fd' : 'transparent'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = tz === value ? '#e3f2fd' : 'transparent')}
            >
              {getDisplayName(tz)}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '8px 12px', color: '#999' }}>
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Negocio {
  id: number;
  nombre: string;
  url: string;
  timezone?: string;  // 🔹 AGREGADO
  fecha_baja?: string | null;
}

interface Centro {
  id: number;
  negocioId: number;
  negocio?: Negocio;
  nombre: string;
  codigo: string;
  es_virtual: boolean;
  timezone?: string;  // 🔹 AGREGADO
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

interface Actividad {
  id: number;
  virtual: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const CENTROS_URL = `${API_BASE_URL}/centros`;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;
const NEGOCIO_ACTIVIDADES_URL = `${API_BASE_URL}/negocio-actividades`;
const ACTIVIDADES_URL = `${API_BASE_URL}/actividades`;

export default function Centros() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCentro, setSelectedCentro] = useState<Centro | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    negocioId: '',
    nombre: '',
    es_virtual: false,
    domicilio: null as any,
    timezone: '',  // 🔹 NUEVO
  });
  const [phoneValue, setPhoneValue] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState<Centro | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Centro | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [puedeSerVirtual, setPuedeSerVirtual] = useState(false);
  const [yaTieneVirtual, setYaTieneVirtual] = useState(false);
  const [tieneActividades, setTieneActividades] = useState(false);
  const [negocioTimezone, setNegocioTimezone] = useState<string>('');  // 🔹 NUEVO: timezone del negocio seleccionado
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroUrl, setFiltroUrl] = useState('');
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

  const obtenerTimezoneDelNegocio = async (negocioId: number): Promise<string> => {
    try {
      const res = await fetch(`${NEGOCIOS_URL}/${negocioId}`);
      const negocio = await res.json();
      return negocio.timezone || 'America/Argentina/Buenos_Aires';
    } catch (err) {
      console.error('Error obteniendo timezone del negocio:', err);
      return 'America/Argentina/Buenos_Aires';
    }
  };

  const verificarActividadesDelNegocio = async (negocioId: number) => {
    try {
      const res = await fetch(`${NEGOCIO_ACTIVIDADES_URL}/negocio/${negocioId}`);
      const negocioActividades = await res.json();
      const tieneAct = negocioActividades.length > 0;
      setTieneActividades(tieneAct);
      
      if (!tieneAct) {
        setPuedeSerVirtual(false);
        return;
      }
      
      const resActividades = await fetch(ACTIVIDADES_URL);
      const todasActividades = await resActividades.json();
      
      const tieneVirtual = negocioActividades.some((na: any) => {
        const actividad = todasActividades.find((a: Actividad) => a.id === na.actividadId);
        return actividad && actividad.virtual === true;
      });
      
      setPuedeSerVirtual(tieneVirtual);
      
      // 🔹 Obtener timezone del negocio para precargar en centros virtuales
      const tzNegocio = await obtenerTimezoneDelNegocio(negocioId);
      setNegocioTimezone(tzNegocio);
      if (formData.es_virtual) {
        setFormData(prev => ({ ...prev, timezone: tzNegocio }));
      }
    } catch (err) {
      console.error('Error verificando actividades del negocio:', err);
      setTieneActividades(false);
      setPuedeSerVirtual(false);
    }
  };

  const verificarYaTieneVirtual = async (negocioId: number) => {
    try {
      const res = await fetch(CENTROS_URL);
      const data: Centro[] = await res.json();
      const tieneVirtual = data.some(c => 
        c.negocioId === negocioId && 
        c.es_virtual === true && 
        !c.fecha_baja
      );
      setYaTieneVirtual(tieneVirtual);
    } catch (err) {
      console.error('Error verificando centro virtual existente:', err);
      setYaTieneVirtual(false);
    }
  };

  const obtenerTipoMovimiento = (c: Centro): string => {
    if (c.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarCentros = () => {
    return centros.filter(c => {
      if (filtroUrl && !c.negocio?.url.toLowerCase().includes(filtroUrl.toLowerCase())) return false;
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
    .sort((a, b) => {
      const urlCompare = (a.negocio?.url || '').localeCompare(b.negocio?.url || '');
      if (urlCompare !== 0) return urlCompare;
      return a.codigo.localeCompare(b.codigo);
    })
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
    setFormData({ negocioId: '', nombre: '', es_virtual: false, domicilio: null, timezone: '' });
    setPhoneValue(undefined);
    setErrorMessage(null);
    setPuedeSerVirtual(false);
    setYaTieneVirtual(false);
    setTieneActividades(false);
    setNegocioTimezone('');
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
      es_virtual: centro.es_virtual || false,
      domicilio: domicilioObj,
      timezone: centro.timezone || '',
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
  
  const handleReactivar = (centro: Centro) => {
    if (centro.fecha_baja) {
      setConfirmReactivar(centro);
    }
  };

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
    if (!tieneActividades) {
      setErrorMessage('Este negocio no tiene actividades asignadas. Debe asignar al menos una actividad antes de crear un centro.');
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
    
    if (!formData.es_virtual) {
      if (!formData.domicilio || !formData.domicilio.formatted_address) {
        setErrorMessage('Debés seleccionar una dirección válida en el mapa');
        return false;
      }
    } else {
      // 🔹 Para centros virtuales, validar que tenga timezone
      if (!formData.timezone) {
        setErrorMessage('Debe seleccionar una zona horaria');
        return false;
      }
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

    const datosParaEnviar: any = {
      negocioId: parseInt(formData.negocioId),
      nombre: formData.nombre.toUpperCase(),
      country_code,
      national_number,
      es_virtual: formData.es_virtual,
    };
    
    // 🔹 Agregar timezone si es virtual
    if (formData.es_virtual) {
      datosParaEnviar.timezone = formData.timezone;
    }
    
    if (!formData.es_virtual && formData.domicilio) {
      datosParaEnviar.domicilio = formData.domicilio;
    }

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
      setFormData({ negocioId: '', nombre: '', es_virtual: false, domicilio: null, timezone: '' });
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
          es_virtual: confirmReactivar.es_virtual,
          timezone: confirmReactivar.timezone,  // 🔹 AGREGADO
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
    setFiltroUrl('');
    setFiltroNombre('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  const UrlCell = ({ negocio }: { negocio?: Negocio }) => {
    if (!negocio) return <span>-</span>;
    const fullUrl = `${window.location.origin}/negocio/${negocio.url}`;
    return (
      <div className={styles.urlContainer}>
        <a 
          href={fullUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.urlLink}
        >
          {negocio.url}
        </a>
        <span className={styles.urlTooltip}>{fullUrl}</span>
      </div>
    );
  };

  const mostrarCheckboxVirtual = puedeSerVirtual && !yaTieneVirtual && modalMode === 'add' && tieneActividades;

  // 🔹 Función para obtener display de timezone
  const getTimezoneDisplay = (tz: string) => {
    if (!tz) return 'No definido';
    const parts = tz.split('/');
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    return `${city} (${tz})`;
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Centros</h1>

      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">URL Negocio</label>
            <input type="text" value={filtroUrl} onChange={(e) => { setFiltroUrl(e.target.value); setPaginaActual(1); }} placeholder="Buscar por URL..." className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label className="tm-filtro-label">Nombre Centro</label>
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

          {/* TABLA PARA DESKTOP */}
          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>URL NEGOCIO</th>
                  <th>NOMBRE</th>
                  <th>WHATSAPP</th>
                  <th>DOMICILIO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {centrosPaginados.map((c) => (
                  <tr key={c.id} className={c.fecha_baja ? 'tm-fila-inactiva' : ''}>
                    <td>{c.codigo}</td>
                    <td><UrlCell negocio={c.negocio} /></td>
                    <td>{c.nombre} </td>
                    <td>{c.whatsapp_e164 || '-'} </td>
                    <td>{c.es_virtual ? 'Virtual' : (formatearDireccion(c).substring(0, 40) || '-')} </td>
                    <td>{c.fecha_baja ? 'Inactivo' : 'Activo'} </td>
                    <td>
                      <ActionIcons
                        onAdd={() => c.fecha_baja && handleReactivar(c)}
                        onEdit={() => !c.fecha_baja && handleEditar(c)}
                        onDelete={() => !c.fecha_baja && handleEliminar(c)}
                        onView={() => handleVerDetalle(c)}
                        showAdd={true}
                        showEdit={true}
                        showDelete={true}
                        showView={true}
                        disabledAdd={!c.fecha_baja}
                        disabledEdit={!!c.fecha_baja}
                        disabledDelete={!!c.fecha_baja}
                        disabledView={false}
                        size="md"
                      />
                     </td>
                    </tr>
                ))}
                {centrosPaginados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="tm-fila-vacia">No hay centros que coincidan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARDS PARA MÓVIL */}
          <div className="tm-cards">
            {centrosPaginados.map((c) => (
              <div key={`card-${c.id}`} className={`tm-card-item ${c.fecha_baja ? 'inactiva' : ''}`}>
                <div className="tm-card-codigo">Código: {c.codigo}</div>
                <div className="tm-card-url">Negocio: {c.negocio?.url || '-'}</div>
                <div className="tm-card-nombre"><strong>{c.nombre}</strong></div>
                <div className="tm-card-whatsapp">WhatsApp: {c.whatsapp_e164 || '-'}</div>
                <div className="tm-card-domicilio">Domicilio: {c.es_virtual ? 'Virtual' : (formatearDireccion(c).substring(0, 40) || '-')}</div>
                <div className="tm-card-estado">Estado: {c.fecha_baja ? 'Inactivo' : 'Activo'}</div>
                <div className="tm-card-acciones mt-2">
                  <ActionIcons
                    onAdd={() => c.fecha_baja && handleReactivar(c)}
                    onEdit={() => !c.fecha_baja && handleEditar(c)}
                    onDelete={() => !c.fecha_baja && handleEliminar(c)}
                    onView={() => handleVerDetalle(c)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    showView={true}
                    disabledAdd={!c.fecha_baja}
                    disabledEdit={!!c.fecha_baja}
                    disabledDelete={!!c.fecha_baja}
                    disabledView={false}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
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
                onChange={async (e) => {
                  const nuevoNegocioId = e.target.value;
                  setFormData({ ...formData, negocioId: nuevoNegocioId, es_virtual: false, domicilio: null, timezone: '' });
                  if (nuevoNegocioId) {
                    await verificarActividadesDelNegocio(parseInt(nuevoNegocioId));
                    await verificarYaTieneVirtual(parseInt(nuevoNegocioId));
                  } else {
                    setTieneActividades(false);
                    setPuedeSerVirtual(false);
                    setYaTieneVirtual(false);
                    setNegocioTimezone('');
                  }
                }} 
                className="tm-modal-input" 
                required
              >
                <option value="">Seleccionar negocio...</option>
                {negocios.map(n => (<option key={n.id} value={n.id}>{n.nombre} ({n.url})</option>))}
              </select>
              
              {formData.negocioId && !tieneActividades && (
                <div className="text-red-600 text-sm mt-1">
                  ⚠️ Este negocio no tiene actividades asignadas. Debe asignar al menos una actividad antes de crear un centro.
                </div>
              )}
            </div>

            {tieneActividades && mostrarCheckboxVirtual && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Centro Virtual</label>
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={formData.es_virtual}
                    onChange={(e) => {
                      const esVirtual = e.target.checked;
                      setFormData({ 
                        ...formData, 
                        es_virtual: esVirtual, 
                        nombre: esVirtual ? 'VIRTUAL' : '',
                        domicilio: esVirtual ? null : formData.domicilio,
                        timezone: esVirtual ? negocioTimezone : ''
                      });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Centro sin domicilio físico (telemedicina, etc.)</span>
                </label>
              </div>
            )}

            {tieneActividades && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  placeholder={formData.es_virtual ? "Se asignará automáticamente 'VIRTUAL'" : "Ej: SUCURSAL LANÚS"}
                  className="tm-modal-input"
                  autoFocus
                  disabled={formData.es_virtual}
                />
                {formData.es_virtual && (
                  <small className="tm-ayuda-texto">El nombre se asigna automáticamente como "VIRTUAL"</small>
                )}
              </div>
            )}

            {/* WhatsApp - siempre visible */}
            {tieneActividades && (
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
            )}

            {/* Zona Horaria - solo para centros virtuales */}
            {tieneActividades && formData.es_virtual && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Zona Horaria *</label>
                <TimezoneSelector
                  value={formData.timezone || negocioTimezone}
                  onChange={(tz) => setFormData({ ...formData, timezone: tz })}
                />
                <small className="tm-ayuda-texto">
                  Zona horaria donde opera este centro virtual. Por defecto: {negocioTimezone || 'la del negocio'}
                </small>
              </div>
            )}

            {/* Mapa - solo para centros físicos */}
            {tieneActividades && !formData.es_virtual && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Domicilio *</label>
                <MapaSelector
                  value={formData.domicilio}
                  onChange={(nuevaDireccion) => setFormData({ ...formData, domicilio: nuevaDireccion })}
                  defaultCountry="AR"
                  autoLocate={true}
                />
              </div>
            )}

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
              <input
                type="text"
                value={selectedCentro.negocio?.nombre || `ID: ${selectedCentro.negocioId}`}
                className="tm-modal-input"
                disabled
              />
              <small className="tm-ayuda-texto">El negocio no puede modificarse</small>
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                className="tm-modal-input"
                disabled={selectedCentro.es_virtual}
              />
              {selectedCentro.es_virtual && (
                <small className="tm-ayuda-texto">Los centros virtuales mantienen el nombre "VIRTUAL"</small>
              )}
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

            {/* 🔹 Zona Horaria - para centros virtuales (editable) o físicos (solo lectura) */}
            {selectedCentro.es_virtual ? (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Zona Horaria *</label>
                <TimezoneSelector
                  value={formData.timezone || selectedCentro.timezone || ''}
                  onChange={(tz) => setFormData({ ...formData, timezone: tz })}
                />
                <small className="tm-ayuda-texto">Zona horaria donde opera este centro virtual</small>
              </div>
            ) : (
              selectedCentro.timezone && (
                <div className="tm-modal-campo">
                  <label className="tm-modal-label">Zona Horaria</label>
                  <input
                    type="text"
                    value={getTimezoneDisplay(selectedCentro.timezone)}
                    className="tm-modal-input bg-gray-100"
                    disabled
                  />
                  <small className="tm-ayuda-texto">Determinada automáticamente por la dirección del centro</small>
                </div>
              )
            )}

            {!selectedCentro.es_virtual && selectedCentro.street && (
              <>
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

                <div className="tm-modal-campo">
                  <label className="tm-modal-label">Buscar nueva dirección</label>
                  <MapaSelector
                    value={formData.domicilio}
                    onChange={(nuevaDireccion) => setFormData({ ...formData, domicilio: nuevaDireccion })}
                    defaultCountry="AR"
                    autoLocate={false}
                  />
                </div>
              </>
            )}

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
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Negocio</span><p className="tm-modal-detalle-valor">{selectedCentro.negocio?.nombre} ({selectedCentro.negocio?.url})</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Nombre</span><p className="tm-modal-detalle-valor">{selectedCentro.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Tipo</span><p className="tm-modal-detalle-valor">{selectedCentro.es_virtual ? 'Virtual' : 'Físico'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">WhatsApp</span><p className="tm-modal-detalle-valor">{selectedCentro.whatsapp_e164}</p></div>
            {/* 🔹 Mostrar timezone en detalle */}
            <div className="tm-modal-detalle-campo">
              <span className="tm-modal-detalle-label">Zona Horaria</span>
              <p className="tm-modal-detalle-valor">{getTimezoneDisplay(selectedCentro.timezone || '')}</p>
            </div>
            {!selectedCentro.es_virtual && selectedCentro.street && (
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

