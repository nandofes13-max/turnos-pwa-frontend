// src/components/SolicitarAgendaWizard/Paso1DatosBasicos.tsx
// Paso 1 del Wizard: Datos del Negocio + Usuario + Centro + Actividad
// VERSIÓN CON CORRECCIÓN:
// - Centro virtual aparece INMEDIATAMENTE al seleccionar actividad con virtual: true
// - Usa estado separado `permiteVirtual` para evitar problemas de async

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { 
  getActividades, 
  verificarUrlUnica, 
  registrarPaso1DatosBasicos,
  Actividad,
  DomicilioDto,
  CentroData,
  Paso1Result
} from '../../services/apiWizard';
import MapaSelector from '../MapaSelector';
import { Direccion } from '../../hooks/useDireccion';
import styles from './wizard.module.css';

interface Paso1DatosBasicosProps {
  onSuccess: (data: Paso1Result) => void;
  onError?: (error: string) => void;
}

interface CentroFisicoForm {
  id: string;
  nombre: string;
  domicilio: DomicilioDto | null;
  direccionSimplificada: string;
}

interface FormData {
  negocioNombre: string;
  negocioWhatsapp: string;
  usuarioEmail: string;
  usuarioApellido: string;
  usuarioNombre: string;
  usuarioTelefono: string;
  centroVirtualNombre: string;
  centrosFisicos: CentroFisicoForm[];
  actividadId: number;
}

interface ValidationErrors {
  negocioNombre?: string;
  negocioUrl?: string;
  negocioWhatsapp?: string;
  usuarioEmail?: string;
  usuarioApellido?: string;
  usuarioNombre?: string;
  centroVirtualNombre?: string;
  centrosFisicos?: { [key: string]: { nombre?: string; domicilio?: string } };
  actividadId?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://turnos-api-backend.onrender.com';

const formatearDireccionSimplificada = (domicilio: DomicilioDto): string => {
  const calleCompleta = `${domicilio.street} ${domicilio.street_number}`.trim();
  return `${calleCompleta}, ${domicilio.city}, ${domicilio.country}`;
};

const Paso1DatosBasicos: React.FC<Paso1DatosBasicosProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargandoActividades, setCargandoActividades] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [urlDisponible, setUrlDisponible] = useState<boolean | null>(null);
  const [verificandoUrl, setVerificandoUrl] = useState(false);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [mostrarPreguntaSegundoCentro, setMostrarPreguntaSegundoCentro] = useState(false);
  const [permiteVirtual, setPermiteVirtual] = useState(false); // 👈 NUEVO ESTADO
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    negocioNombre: '',
    negocioWhatsapp: '',
    usuarioEmail: '',
    usuarioApellido: '',
    usuarioNombre: '',
    usuarioTelefono: '',
    centroVirtualNombre: '',
    centrosFisicos: [
      {
        id: crypto.randomUUID(),
        nombre: '',
        domicilio: null,
        direccionSimplificada: '',
      }
    ],
    actividadId: 0,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const maxCentrosFisicos = 2;

  // 👈 ACTUALIZAR permiteVirtual cuando cambia la actividad o se cargan actividades
  useEffect(() => {
    if (formData.actividadId && actividades.length > 0) {
      const actividad = actividades.find(a => a.id === formData.actividadId);
      setPermiteVirtual(actividad?.virtual === true);
    } else if (formData.actividadId === 0) {
      setPermiteVirtual(false);
    }
  }, [formData.actividadId, actividades]);

  const buscarUsuarioPorEmail = async (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;
    
    setBuscandoUsuario(true);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/email/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.id && !data.fecha_baja) {
        setFormData(prev => ({
          ...prev,
          usuarioApellido: data.apellido || '',
          usuarioNombre: data.nombre || '',
          usuarioTelefono: data.telefono || ''
        }));
      }
    } catch (err) {
      console.error('Error al buscar usuario:', err);
    } finally {
      setBuscandoUsuario(false);
    }
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (formData.usuarioEmail && formData.usuarioEmail.length > 5) {
      timeoutRef.current = setTimeout(() => buscarUsuarioPorEmail(formData.usuarioEmail), 500);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [formData.usuarioEmail]);

  useEffect(() => {
    const cargarActividades = async () => {
      try {
        const data = await getActividades();
        const activas = data.filter(a => !a.fecha_baja && a.id !== 10);
        setActividades(activas);
      } catch (error) {
        console.error('Error cargando actividades:', error);
        onError?.('No se pudieron cargar las actividades');
      } finally {
        setCargandoActividades(false);
      }
    };
    cargarActividades();
  }, [onError]);

  useEffect(() => {
    const verificarUrl = async () => {
      if (!formData.negocioNombre || formData.negocioNombre.length < 3) {
        setUrlDisponible(null);
        return;
      }
      setVerificandoUrl(true);
      try {
        const urlGenerada = generarSlug(formData.negocioNombre);
        const disponible = await verificarUrlUnica(urlGenerada);
        setUrlDisponible(disponible);
      } catch (error) {
        console.error('Error verificando URL:', error);
        setUrlDisponible(null);
      } finally {
        setVerificandoUrl(false);
      }
    };
    const timeoutId = setTimeout(verificarUrl, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.negocioNombre]);

  const generarSlug = (nombre: string): string => {
    return nombre
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleWhatsappChange = (value: string) => {
    setFormData(prev => ({ ...prev, negocioWhatsapp: value || '' }));
    if (errors.negocioWhatsapp) setErrors(prev => ({ ...prev, negocioWhatsapp: undefined }));
  };

  const handleCentroFisicoChange = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      centrosFisicos: prev.centrosFisicos.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const handleDireccionFisicaSeleccionada = (id: string, direccionCompleta: Direccion) => {
    const domicilioDto: DomicilioDto = {
      street: direccionCompleta.street || '',
      street_number: direccionCompleta.street_number || '',
      postal_code: direccionCompleta.postal_code || '',
      city: direccionCompleta.city || '',
      state: direccionCompleta.state || '',
      country: direccionCompleta.country || '',
      country_code: direccionCompleta.country_code || 'AR',
      latitude: direccionCompleta.latitude || 0,
      longitude: direccionCompleta.longitude || 0,
      formatted_address: direccionCompleta.formatted_address || '',
    };
    const direccionSimplificada = formatearDireccionSimplificada(domicilioDto);
    setFormData(prev => ({
      ...prev,
      centrosFisicos: prev.centrosFisicos.map(c =>
        c.id === id ? { ...c, domicilio: domicilioDto, direccionSimplificada } : c
      )
    }));
  };

  const agregarCentroFisico = () => {
    if (formData.centrosFisicos.length >= maxCentrosFisicos) {
      alert('Por favor comuníquese con la ayuda para que en caso de corresponder sea agregado');
      return;
    }
    setFormData(prev => ({
      ...prev,
      centrosFisicos: [...prev.centrosFisicos, { id: crypto.randomUUID(), nombre: '', domicilio: null, direccionSimplificada: '' }]
    }));
    setMostrarPreguntaSegundoCentro(false);
  };

  const handleCancelar = () => navigate('/');

  const validarFormulario = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.negocioNombre.trim()) {
      newErrors.negocioNombre = 'El nombre del negocio es obligatorio';
    } else if (formData.negocioNombre.length < 3) {
      newErrors.negocioNombre = 'El nombre debe tener al menos 3 caracteres';
    }
    if (urlDisponible === false) {
      newErrors.negocioUrl = 'Esta URL ya está en uso. Cambiá el nombre del negocio';
    }
    if (!formData.negocioWhatsapp) {
      newErrors.negocioWhatsapp = 'El número de WhatsApp es obligatorio';
    } else if (!isValidPhoneNumber(formData.negocioWhatsapp)) {
      newErrors.negocioWhatsapp = 'Número de WhatsApp inválido';
    }
    if (!formData.usuarioEmail.trim()) {
      newErrors.usuarioEmail = 'El email es obligatorio';
    } else if (!validarEmail(formData.usuarioEmail)) {
      newErrors.usuarioEmail = 'Email inválido';
    }
    if (!formData.usuarioApellido.trim()) newErrors.usuarioApellido = 'El apellido es obligatorio';
    if (!formData.usuarioNombre.trim()) newErrors.usuarioNombre = 'El nombre es obligatorio';
    if (!formData.actividadId || formData.actividadId === 0) newErrors.actividadId = 'Seleccioná una actividad';
    
    if (permiteVirtual && !formData.centroVirtualNombre.trim()) {
      newErrors.centroVirtualNombre = 'El nombre del centro virtual es obligatorio';
    }
    
    const centrosFisicosErrors: { [key: string]: { nombre?: string; domicilio?: string } } = {};
    let tieneCentroFisicoValido = false;
    for (const centro of formData.centrosFisicos) {
      if (centro.nombre.trim() || centro.domicilio) {
        tieneCentroFisicoValido = true;
        if (!centro.nombre.trim()) centrosFisicosErrors[centro.id] = { ...centrosFisicosErrors[centro.id], nombre: 'El nombre del centro es obligatorio' };
        if (!centro.domicilio) centrosFisicosErrors[centro.id] = { ...centrosFisicosErrors[centro.id], domicilio: 'Seleccioná una dirección en el mapa' };
      }
    }
    if (!tieneCentroFisicoValido) {
      newErrors.centrosFisicos = { general: 'Debe agregar al menos un centro físico' };
    } else if (Object.keys(centrosFisicosErrors).length > 0) {
      newErrors.centrosFisicos = centrosFisicosErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setEnviando(true);
    
    try {
      let countryCode = 54, nationalNumber = '';
      if (formData.negocioWhatsapp) {
        const match = formData.negocioWhatsapp.match(/^\+(\d+)(.+)$/);
        if (match) {
          countryCode = parseInt(match[1], 10);
          nationalNumber = match[2].replace(/\D/g, '');
        }
      }
      
      const centrosData: CentroData[] = [];
      if (permiteVirtual && formData.centroVirtualNombre.trim()) {
        centrosData.push({ nombre: formData.centroVirtualNombre, es_virtual: true, domicilio: undefined });
      }
      for (const centro of formData.centrosFisicos) {
        if (centro.nombre.trim() && centro.domicilio) {
          centrosData.push({ nombre: centro.nombre, es_virtual: false, domicilio: centro.domicilio });
        }
      }
      
      const resultado = await registrarPaso1DatosBasicos({
        negocioNombre: formData.negocioNombre,
        negocioCountryCode: countryCode,
        negocioNationalNumber: nationalNumber,
        usuarioEmail: formData.usuarioEmail,
        usuarioApellido: formData.usuarioApellido,
        usuarioNombre: formData.usuarioNombre,
        usuarioTelefono: formData.usuarioTelefono || undefined,
        actividadId: formData.actividadId,
        centros: centrosData,
      });
      onSuccess(resultado);
    } catch (error) {
      console.error('Error al registrar:', error);
      onError?.(error instanceof Error ? error.message : 'Error al procesar el formulario');
    } finally {
      setEnviando(false);
    }
  };

  const renderCentroFisico = (centro: CentroFisicoForm, index: number) => {
    const centroErrors = errors.centrosFisicos && typeof errors.centrosFisicos === 'object' && !Array.isArray(errors.centrosFisicos)
      ? (errors.centrosFisicos as any)[centro.id] || {}
      : {};

    return (
      <div key={centro.id} className={styles.centroFisicoCard}>
        <h4 className={styles.subtitle}>Centro Físico {index + 1}</h4>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Nombre del centro *</label>
          <input
            type="text"
            value={centro.nombre}
            onChange={(e) => handleCentroFisicoChange(centro.id, 'nombre', e.target.value)}
            className={`${styles.input} ${centroErrors.nombre ? styles.inputError : ''}`}
            placeholder="Ej: Sucursal Centro"
          />
          {centroErrors.nombre && <span className={styles.errorText}>{centroErrors.nombre}</span>}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Dirección del centro *</label>
          {centro.direccionSimplificada && (
            <div className={styles.direccionConfirmada}>
              <strong>Dirección seleccionada:</strong> {centro.direccionSimplificada}
            </div>
          )}
          <MapaSelector 
            onChange={(direccion) => handleDireccionFisicaSeleccionada(centro.id, direccion)}
            autoLocate={true}
          />
          {centroErrors.domicilio && <span className={styles.errorText}>{centroErrors.domicilio}</span>}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Paso 1: Datos del Negocio</h2>
      
      {/* SECCIÓN NEGOCIO */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Información del Negocio</legend>
        <div className={styles.formGroup}>
          <label htmlFor="negocioNombre" className={styles.label}>Nombre del negocio *</label>
          <input type="text" id="negocioNombre" name="negocioNombre" value={formData.negocioNombre} onChange={handleChange} className={`${styles.input} ${errors.negocioNombre ? styles.inputError : ''}`} placeholder="Ej: Galicia Salud" />
          {errors.negocioNombre && <span className={styles.errorText}>{errors.negocioNombre}</span>}
          {formData.negocioNombre && (
            <span className={styles.helperText}>
              URL generada: {window.location.origin}/negocio/{generarSlug(formData.negocioNombre)}
              {verificandoUrl && <span className={styles.spinnerSmall}> 🔄</span>}
              {urlDisponible === true && !verificandoUrl && <span className={styles.successText}> ✅ Disponible</span>}
              {urlDisponible === false && !verificandoUrl && <span className={styles.errorText}> ❌ No disponible</span>}
            </span>
          )}
          {errors.negocioUrl && <span className={styles.errorText}>{errors.negocioUrl}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>WhatsApp *</label>
          <PhoneInput international defaultCountry="AR" value={formData.negocioWhatsapp} onChange={handleWhatsappChange} className={`${styles.phoneInput} ${errors.negocioWhatsapp ? styles.inputError : ''}`} limitMaxLength={true} />
          {errors.negocioWhatsapp && <span className={styles.errorText}>{errors.negocioWhatsapp}</span>}
          <span className={styles.helperText}>Con código de país. Ej: +54 9 11 1234 5678</span>
        </div>
      </fieldset>
      
      {/* SECCIÓN USUARIO */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Datos del Dueño</legend>
        <div className={styles.formGroup}>
          <label htmlFor="usuarioEmail" className={styles.label}>Email *</label>
          <input type="email" id="usuarioEmail" name="usuarioEmail" value={formData.usuarioEmail} onChange={handleChange} className={`${styles.input} ${errors.usuarioEmail ? styles.inputError : ''}`} placeholder="Ej: carlos@ejemplo.com" />
          {buscandoUsuario && <span className={styles.helperText}>Buscando usuario...</span>}
          {errors.usuarioEmail && <span className={styles.errorText}>{errors.usuarioEmail}</span>}
          <span className={styles.helperText}>Recibirás los links de acceso y gestión</span>
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="usuarioApellido" className={styles.label}>Apellido *</label>
            <input type="text" id="usuarioApellido" name="usuarioApellido" value={formData.usuarioApellido} onChange={handleChange} className={`${styles.input} ${errors.usuarioApellido ? styles.inputError : ''}`} placeholder="Ej: García" />
            {errors.usuarioApellido && <span className={styles.errorText}>{errors.usuarioApellido}</span>}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="usuarioNombre" className={styles.label}>Nombre *</label>
            <input type="text" id="usuarioNombre" name="usuarioNombre" value={formData.usuarioNombre} onChange={handleChange} className={`${styles.input} ${errors.usuarioNombre ? styles.inputError : ''}`} placeholder="Ej: Carlos" />
            {errors.usuarioNombre && <span className={styles.errorText}>{errors.usuarioNombre}</span>}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="usuarioTelefono" className={styles.label}>Teléfono (opcional)</label>
          <input type="tel" id="usuarioTelefono" name="usuarioTelefono" value={formData.usuarioTelefono} onChange={handleChange} className={styles.input} placeholder="Ej: 5491112345678" />
        </div>
      </fieldset>
      
      {/* SECCIÓN ACTIVIDAD */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Actividad del Negocio</legend>
        <div className={styles.formGroup}>
          <label htmlFor="actividadId" className={styles.label}>Seleccioná tu actividad principal *</label>
          <select id="actividadId" name="actividadId" value={formData.actividadId} onChange={handleChange} className={`${styles.select} ${errors.actividadId ? styles.inputError : ''}`} disabled={cargandoActividades}>
            <option value="0">Seleccionar...</option>
            {actividades.map(act => <option key={act.id} value={act.id}>{act.nombre}</option>)}
          </select>
          {cargandoActividades && <span className={styles.helperText}>Cargando actividades...</span>}
          {errors.actividadId && <span className={styles.errorText}>{errors.actividadId}</span>}
          {!permiteVirtual && formData.actividadId !== 0 && (
            <span className={styles.helperText} style={{ color: '#d97706' }}>⚠️ Esta actividad solo permite centros presenciales</span>
          )}
        </div>
      </fieldset>
      
      {/* SECCIÓN CENTROS */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Centros / Sucursales</legend>
        
        {/* Centro Virtual - se muestra según el estado permiteVirtual */}
        {permiteVirtual && (
          <div className={styles.centroVirtualSection}>
            <h4 className={styles.subtitle}>Centro Virtual</h4>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre del centro virtual *</label>
              <input type="text" name="centroVirtualNombre" value={formData.centroVirtualNombre} onChange={handleChange} className={`${styles.input} ${errors.centroVirtualNombre ? styles.inputError : ''}`} placeholder="Ej: Atención Virtual" />
              {errors.centroVirtualNombre && <span className={styles.errorText}>{errors.centroVirtualNombre}</span>}
            </div>
            <div className={styles.direccionConfirmada} style={{ backgroundColor: '#e0f2fe', borderColor: '#7dd3fc', color: '#0369a1' }}>
              💻 Centro virtual - No requiere dirección física
            </div>
          </div>
        )}
        
        {/* Centros Físicos */}
        <div className={styles.centrosFisicosSection}>
          <h4 className={styles.subtitle}>Centros Físicos</h4>
          {formData.centrosFisicos.map((centro, idx) => renderCentroFisico(centro, idx))}
          
          {errors.centrosFisicos && typeof errors.centrosFisicos === 'object' && 'general' in errors.centrosFisicos && (
            <span className={styles.errorText}>{(errors.centrosFisicos as any).general}</span>
          )}
          
          {formData.centrosFisicos.length === 1 && formData.centrosFisicos[0].domicilio && !mostrarPreguntaSegundoCentro && (
            <div className={styles.preguntaSegundoCentro}>
              <p>¿Desea cargar otro centro físico?</p>
              <div className={styles.buttonsContainerInline}>
                <button type="button" onClick={agregarCentroFisico} className={styles.buttonSmall}>Sí</button>
                <button type="button" onClick={() => setMostrarPreguntaSegundoCentro(true)} className={styles.buttonSmall}>No</button>
              </div>
            </div>
          )}
        </div>
      </fieldset>
      
      {/* BOTONES */}
      <div className={styles.buttonsContainer}>
        <button type="button" onClick={handleCancelar} className={styles.buttonSecondary} disabled={enviando}>Cancelar</button>
        <button type="submit" disabled={enviando || (urlDisponible === false)} className={styles.buttonPrimary}>
          {enviando ? 'Procesando...' : 'Continuar al Paso 2'}
        </button>
      </div>
    </form>
  );
};

export default Paso1DatosBasicos;
