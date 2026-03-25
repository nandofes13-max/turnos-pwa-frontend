import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/tablas-maestras.css';

interface Profesional {
  id: number;
  documento: string;
  nombre: string;
  email: string;
  whatsapp_e164?: string;
  country_code?: number;
  national_number?: string;
  genero?: string;
  matricula?: string;
  foto?: string;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string | null;
  usuario_baja?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PROFESIONALES_URL = `${API_BASE_URL}/profesionales`;

const AVATAR_MASCULINO = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
const AVATAR_FEMENINO = 'https://randomuser.me/api/portraits/women/2.jpg';

export default function Profesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfesional, setSelectedProfesional] = useState<Profesional | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | 'reactivate' | null>(null);
  const [formData, setFormData] = useState({ 
    documento: '',
    nombre: '',
    email: '',
    genero: '',
    matricula: '',
    foto: ''
  });
  const [phoneValue, setPhoneValue] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState<Profesional | null>(null);
  const [confirmReactivar, setConfirmReactivar] = useState<Profesional | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados para filtros
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroDocumento, setFiltroDocumento] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroExpandido, setFiltroExpandido] = useState({ movimiento: false });
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  const tiposMovimiento = ['Altas', 'Bajas'];

  useEffect(() => {
    fetchProfesionales();
  }, []);

  const fetchProfesionales = async () => {
    setLoading(true);
    try {
      const res = await fetch(PROFESIONALES_URL);
      const data = await res.json();
      setProfesionales(data);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar profesionales:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (p: Profesional): string => {
    if (p.fecha_baja) return 'Bajas';
    return 'Altas';
  };

  const filtrarProfesionales = () => {
    return profesionales.filter(p => {
      if (filtroNombre && !p.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      if (filtroDocumento && !p.documento.toLowerCase().includes(filtroDocumento.toLowerCase())) return false;
      const tipo = obtenerTipoMovimiento(p);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;
      if (fechaDesde && p.fecha_alta) {
        const fechaAlta = new Date(p.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && p.fecha_alta) {
        const fechaAlta = new Date(p.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }
      return true;
    });
  };

  const profesionalesFiltrados = filtrarProfesionales();
  const totalPaginas = Math.ceil(profesionalesFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const profesionalesPaginados = profesionalesFiltrados
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

  const handleAgregar = () => {
    setFormData({ documento: '', nombre: '', email: '', genero: '', matricula: '', foto: '' });
    setPhoneValue(undefined);
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (profesional: Profesional) => {
    setFormData({ 
      documento: profesional.documento,
      nombre: profesional.nombre,
      email: profesional.email,
      genero: profesional.genero || '',
      matricula: profesional.matricula || '',
      foto: profesional.foto || ''
    });
    setPhoneValue(profesional.whatsapp_e164);
    setSelectedProfesional(profesional);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (profesional: Profesional) => {
    setSelectedProfesional(profesional);
    setModalMode('view');
  };

  const handleEliminar = (profesional: Profesional) => {
    setConfirmDelete(profesional);
  };

  const handleReactivar = (profesional: Profesional) => {
    if (profesional.fecha_baja) {
      setConfirmReactivar(profesional);
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

  const validarFormulario = (): boolean => {
  if (!formData.documento.trim()) {
    setErrorMessage('El documento es obligatorio');
    return false;
  }
  if (!formData.nombre.trim()) {
    setErrorMessage('El nombre es obligatorio');
    return false;
  }
  if (!formData.email.trim()) {
    setErrorMessage('El email es obligatorio');
    return false;
  }
  if (!formData.genero) {
    setErrorMessage('Debe seleccionar un género');
    return false;
  }
  if (!phoneValue) {
    setErrorMessage('El WhatsApp es obligatorio');
    return false;
  }
  return true;
};
  const verificarExistente = async (documento: string, email: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(PROFESIONALES_URL);
      const data: Profesional[] = await res.json();
      const activos = data.filter(p => 
        !p.fecha_baja && 
        (id ? p.id !== id : true)
      );
      const documentoExistente = activos.some(p => p.documento === documento);
      const emailExistente = activos.some(p => p.email === email);
      
      if (documentoExistente) {
        setErrorMessage('Ya existe un profesional activo con ese documento');
        return false;
      }
      if (emailExistente) {
        setErrorMessage('Ya existe un profesional activo con ese email');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarProfesional = async () => {
  if (!validarFormulario()) return;

  const { country_code, national_number } = parsePhoneE164(phoneValue);
  if (!country_code || !national_number) {
    setErrorMessage('El número de WhatsApp no es válido');
    return;
  }

  const datosParaEnviar = {
    documento: formData.documento,
    nombre: formData.nombre.toUpperCase(),
    email: formData.email,
    country_code: country_code,
    national_number: national_number,
    genero: formData.genero,
    matricula: formData.matricula || null,
    foto: formData.foto || null
  };

  try {
    if (modalMode === 'add') {
      const esValido = await verificarExistente(datosParaEnviar.documento, datosParaEnviar.email);
      if (!esValido) return;
    }

    let res;
    if (modalMode === 'add') {
      res = await fetch(PROFESIONALES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaEnviar),
      });
    } else if (modalMode === 'edit' && selectedProfesional) {
      res = await fetch(`${PROFESIONALES_URL}/${selectedProfesional.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaEnviar),
      });
    } else {
      return;
    }

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al guardar profesional');
    }

    setModalMode(null);
    setSelectedProfesional(null);
    setFormData({ documento: '', nombre: '', email: '', genero: '', matricula: '', foto: '' });
    setPhoneValue(undefined);
    setErrorMessage(null);
    fetchProfesionales();
  } catch (err) {
    console.error(err);
    setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar el profesional');
  }
};
  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${PROFESIONALES_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Error al eliminar profesional');
      setConfirmDelete(null);
      fetchProfesionales();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el profesional');
    }
  };

  const confirmarReactivar = async () => {
    if (!confirmReactivar) return;
    try {
      const res = await fetch(`${PROFESIONALES_URL}/${confirmReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documento: confirmReactivar.documento,
          nombre: confirmReactivar.nombre,
          email: confirmReactivar.email,
          country_code: confirmReactivar.country_code,
          national_number: confirmReactivar.national_number,
          genero: confirmReactivar.genero,
          matricula: confirmReactivar.matricula,
          foto: confirmReactivar.foto,
          fecha_baja: null,
          usuario_baja: null
        }),
      });
      if (!res.ok) throw new Error('Error al reactivar profesional');
      setConfirmReactivar(null);
      fetchProfesionales();
    } catch (err) {
      console.error(err);
      alert('No se pudo reactivar el profesional');
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipoMovimiento([]);
    setFiltroNombre('');
    setFiltroDocumento('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  const obtenerAvatar = (profesional: Profesional) => {
    if (profesional.foto) {
      return (
        <img 
          src={profesional.foto} 
          alt={profesional.nombre} 
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            if (profesional.genero === 'F') {
              (e.target as HTMLImageElement).src = AVATAR_FEMENINO;
            } else if (profesional.genero === 'M') {
              (e.target as HTMLImageElement).src = AVATAR_MASCULINO;
            } else {
              (e.target as HTMLImageElement).src = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(profesional.nombre)}.svg`;
            }
          }}
        />
      );
    }
    
    if (profesional.genero === 'F') {
      return <img src={AVATAR_FEMENINO} alt={profesional.nombre} className="w-8 h-8 rounded-full object-cover" />;
    }
    
    if (profesional.genero === 'M') {
      return <img src={AVATAR_MASCULINO} alt={profesional.nombre} className="w-8 h-8 rounded-full object-cover" />;
    }
    
    return (
      <img 
        src={`https://avatars.dicebear.com/api/initials/${encodeURIComponent(profesional.nombre)}.svg`}
        alt={profesional.nombre}
        className="w-8 h-8 rounded-full"
      />
    );
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">Gestión de Profesionales</h1>

      {/* Filtros */}
      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Nombre</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => { setFiltroNombre(e.target.value); setPaginaActual(1); }}
              placeholder="Buscar..."
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-documento">
            <label className="tm-filtro-label">Documento</label>
            <input
              type="text"
              value={filtroDocumento}
              onChange={(e) => { setFiltroDocumento(e.target.value); setPaginaActual(1); }}
              placeholder="DNI / CUIT..."
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-fecha">
            <label className="tm-filtro-label">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPaginaActual(1); }}
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-fecha">
            <label className="tm-filtro-label">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPaginaActual(1); }}
              className="tm-filtro-input"
            />
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
          <div className="tm-filtro-accion">
            <button onClick={limpiarFiltros} className="tm-btn-limpiar">Limpiar Filtros</button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="tm-loading"><div className="tm-loading-spinner"></div><p className="tm-loading-texto">Cargando...</p></div>
      ) : (
        <div className="tm-tabla-wrapper">
          <div className="tm-tabla-header-contenedor">
            <div className="tm-tabla-header-inner">
              <button onClick={handleAgregar} className="tm-btn-agregar">
                Agregar Profesional
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="tm-tabla-centrado">
  <table className="tm-tabla">
    <thead>
      <tr>
        <th>AVATAR</th>
        <th>DOCUMENTO</th>
        <th>NOMBRE</th>
        <th>EMAIL</th>
        <th>WHATSAPP</th>
        <th>MATRÍCULA</th>
        <th>ACCIONES</th>
      </tr>
    </thead>
    <tbody>
      {profesionalesPaginados.map((p) => (
        <tr key={p.id} className={p.fecha_baja ? 'tm-fila-inactiva' : ''}>
          <td className="text-center">{obtenerAvatar(p)}</td>
          <td>{p.documento}</td>
          <td>{p.nombre}</td>
          <td>{p.email}</td>
          <td>{p.whatsapp_e164 || '-'}</td>
          <td>{p.matricula || '-'}</td>
          <td>
            <ActionIcons
              onAdd={() => p.fecha_baja ? handleReactivar(p) : null}
              onEdit={() => !p.fecha_baja && handleEditar(p)}
              onDelete={() => !p.fecha_baja && handleEliminar(p)}
              onView={() => handleVerDetalle(p)}
              showAdd={true}
              showEdit={true}
              showDelete={true}
              showView={true}
              disabledAdd={!p.fecha_baja}
              disabledEdit={!!p.fecha_baja}
              disabledDelete={!!p.fecha_baja}
              disabledView={false}
              size="md"
            />
          </td>
        </tr>
      ))}
      {profesionalesPaginados.length === 0 && (
        <tr>
          <td colSpan={7} className="tm-fila-vacia">No hay profesionales que coincidan</td>
        </tr>
      )}
    </tbody>
  </table>
</div>
          {/* Cards móvil */}
          <div className="tm-cards">
            {profesionalesPaginados.map((p) => (
              <div key={`card-${p.id}`} className={`tm-card-item ${p.fecha_baja ? 'inactiva' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  {obtenerAvatar(p)}
                  <div className="tm-card-nombre"><strong>{p.nombre}</strong></div>
                </div>
                <div className="tm-card-documento">Documento: {p.documento}</div>
                <div className="tm-card-email">Email: {p.email}</div>
                <div className="tm-card-whatsapp">WhatsApp: {p.whatsapp_e164 || '-'}</div>
                {p.matricula && <div className="tm-card-matricula">Matrícula: {p.matricula}</div>}
                <div className="tm-card-acciones mt-2">
                  <ActionIcons
                    onAdd={() => p.fecha_baja ? handleReactivar(p) : null}
                    onEdit={() => !p.fecha_baja && handleEditar(p)}
                    onDelete={() => !p.fecha_baja && handleEliminar(p)}
                    onView={() => handleVerDetalle(p)}
                    showAdd={true}
                    showEdit={true}
                    showDelete={true}
                    showView={true}
                    disabledAdd={!p.fecha_baja}
                    disabledEdit={!!p.fecha_baja}
                    disabledDelete={!!p.fecha_baja}
                    disabledView={false}
                    size="lg"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {profesionalesFiltrados.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">Página {paginaActual} de {totalPaginas} ({profesionalesFiltrados.length} registros)</span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">Mostrando {profesionalesPaginados.length} de {profesionalesFiltrados.length} profesionales</div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {modalMode === 'add' && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Agregar Profesional</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Documento *</label>
              <input
                type="text"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                placeholder="DNI / CUIT / CUIL"
                className="tm-modal-input"
                autoFocus
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ej: DR. JUAN PÉREZ"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ejemplo@mail.com"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
  <label className="tm-modal-label">Género *</label>
  <select
    value={formData.genero}
    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
    className="tm-modal-input"
    required
  >
    <option value="">Seleccionar género...</option>
    <option value="M">Masculino</option>
    <option value="F">Femenino</option>
    <option value="X">No Binario</option>
  </select>
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
              <label className="tm-modal-label">Matrícula</label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                placeholder="Opcional"
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Foto (URL)</label>
              <input
                type="text"
                value={formData.foto}
                onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                placeholder="https://ejemplo.com/foto.jpg"
                className="tm-modal-input"
              />
            </div>

            {formData.foto && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Vista previa</label>
                <div className="flex justify-center mt-1">
                  <img 
                    src={formData.foto} 
                    alt="Vista previa" 
                    className="w-24 h-24 object-cover rounded-full border border-gray-300"
                    onError={(e) => {
                      if (formData.genero === 'F') (e.target as HTMLImageElement).src = AVATAR_FEMENINO;
                      else if (formData.genero === 'M') (e.target as HTMLImageElement).src = AVATAR_MASCULINO;
                      else (e.target as HTMLImageElement).src = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(formData.nombre || 'Nuevo')}.svg`;
                    }}
                  />
                </div>
              </div>
            )}

            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarProfesional} className="tm-btn-primario">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalMode === 'edit' && selectedProfesional && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Editar Profesional</h3>
            {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
            
            <div className="tm-modal-campo">
              <label className="tm-modal-label">Documento *</label>
              <input
                type="text"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
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
              <label className="tm-modal-label">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Género</label>
              <select
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                className="tm-modal-input"
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
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

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Matrícula</label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                className="tm-modal-input"
              />
            </div>

            <div className="tm-modal-campo">
              <label className="tm-modal-label">Foto (URL)</label>
              <input
                type="text"
                value={formData.foto}
                onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                className="tm-modal-input"
              />
            </div>

            {(formData.foto || selectedProfesional.nombre) && (
              <div className="tm-modal-campo">
                <label className="tm-modal-label">Vista previa</label>
                <div className="flex justify-center mt-1">
                  <img 
                    src={formData.foto || (selectedProfesional.genero === 'F' ? AVATAR_FEMENINO : selectedProfesional.genero === 'M' ? AVATAR_MASCULINO : `https://avatars.dicebear.com/api/initials/${encodeURIComponent(selectedProfesional.nombre)}.svg`)}
                    alt="Vista previa" 
                    className="w-24 h-24 object-cover rounded-full border border-gray-300"
                    onError={(e) => {
                      if (selectedProfesional.genero === 'F') (e.target as HTMLImageElement).src = AVATAR_FEMENINO;
                      else if (selectedProfesional.genero === 'M') (e.target as HTMLImageElement).src = AVATAR_MASCULINO;
                      else (e.target as HTMLImageElement).src = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(selectedProfesional.nombre)}.svg`;
                    }}
                  />
                </div>
              </div>
            )}

            {selectedProfesional.ultimoMovimiento && (
              <div className="tm-modal-detalle-movimiento activo">
                <span className="tm-modal-detalle-label">Último Movimiento</span>
                <p className="tm-modal-detalle-valor">{selectedProfesional.ultimoMovimiento.replace('demo', 'DEMO')}</p>
              </div>
            )}
            <div className="tm-modal-acciones">
              <button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cancelar</button>
              <button onClick={guardarProfesional} className="tm-btn-primario">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedProfesional && (
        <div className="tm-modal-overlay" onClick={() => setModalMode(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tm-modal-titulo">Detalle de Profesional</h3>
            <div className="tm-modal-detalle-campo flex justify-center">
              <img 
                src={selectedProfesional.foto || (selectedProfesional.genero === 'F' ? AVATAR_FEMENINO : selectedProfesional.genero === 'M' ? AVATAR_MASCULINO : `https://avatars.dicebear.com/api/initials/${encodeURIComponent(selectedProfesional.nombre)}.svg`)}
                alt={selectedProfesional.nombre}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                onError={(e) => {
                  if (selectedProfesional.genero === 'F') (e.target as HTMLImageElement).src = AVATAR_FEMENINO;
                  else if (selectedProfesional.genero === 'M') (e.target as HTMLImageElement).src = AVATAR_MASCULINO;
                  else (e.target as HTMLImageElement).src = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(selectedProfesional.nombre)}.svg`;
                }}
              />
            </div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">ID</span><p className="tm-modal-detalle-valor">{selectedProfesional.id}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Documento</span><p className="tm-modal-detalle-valor">{selectedProfesional.documento}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Nombre</span><p className="tm-modal-detalle-valor">{selectedProfesional.nombre}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Email</span><p className="tm-modal-detalle-valor">{selectedProfesional.email}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Género</span><p className="tm-modal-detalle-valor">{selectedProfesional.genero === 'M' ? 'Masculino' : selectedProfesional.genero === 'F' ? 'Femenino' : 'No especificado'}</p></div>
            <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">WhatsApp</span><p className="tm-modal-detalle-valor">{selectedProfesional.whatsapp_e164 || '-'}</p></div>
            {selectedProfesional.matricula && (
              <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Matrícula</span><p className="tm-modal-detalle-valor">{selectedProfesional.matricula}</p></div>
            )}
            {selectedProfesional.foto && (
              <div className="tm-modal-detalle-campo"><span className="tm-modal-detalle-label">Foto</span><p className="tm-modal-detalle-valor">{selectedProfesional.foto}</p></div>
            )}
            <div className={`tm-modal-detalle-movimiento ${selectedProfesional.fecha_baja ? 'inactivo' : 'activo'}`}>
              <span className="tm-modal-detalle-label">Último Movimiento</span>
              <p className="tm-modal-detalle-valor">{selectedProfesional.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}</p>
            </div>
            <div className="tm-modal-acciones"><button onClick={() => setModalMode(null)} className="tm-btn-secundario">Cerrar</button></div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR BAJA */}
      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Dar de BAJA al profesional <strong>{confirmDelete.nombre}</strong>?</p>
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
            <p className="text-gray-700 mb-2 text-sm">¿Reactivar al profesional <strong>{confirmReactivar.nombre}</strong>?</p>
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
