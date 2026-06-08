// src/components/SolicitarAgendaWizard/Paso1DatosBasicos.tsx
// Paso 1 del Wizard: Datos del Negocio + Usuario + Centro + Actividad
// VERSIÓN FINAL CON TODOS LOS AJUSTES:
// - Excluye actividad ID=10
// - Muestra checkbox de centro virtual SOLO si la actividad lo permite (virtual === true)
// - centroEsVirtual = false por defecto
// - Dirección obligatoria cuando el centro es físico
// - Corrección de validación URL
// - WhatsApp con PhoneInput (bandera y validación)
// - Botón Cancelar para volver al inicio
// - Selector de actividades sin texto entre paréntesis
// - AUTO-COMPLETADO de datos del dueño al escribir el email

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
  Paso1Result
} from '../../services/apiWizard';
import MapaSelector from '../MapaSelector';
import { Direccion } from '../../hooks/useDireccion';
import styles from './wizard.module.css';

interface Paso1DatosBasicosProps {
  onSuccess: (data: Paso1Result) => void;
  onError?: (error: string) => void;
}

interface FormData {
  // Negocio
  negocioNombre: string;
  negocioWhatsapp: string;
  // Usuario
  usuarioEmail: string;
  usuarioApellido: string;
  usuarioNombre: string;
  usuarioTelefono: string;
  // Centro
  centroNombre: string;
  centroEsVirtual: boolean;
  // Actividad
  actividadId: number;
  // Domicilio
  domicilio: DomicilioDto | null;
  direccionSimplificada: string;
}

interface ValidationErrors {
  negocioNombre?: string;
  negocioUrl?: string;
  negocioWhatsapp?: string;
  usuarioEmail?: string;
  usuarioApellido?: string;
  usuarioNombre?: string;
  centroNombre?: string;
  actividadId?: string;
  domicilio?: string;
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    negocioNombre: '',
    negocioWhatsapp: '',
    usuarioEmail: '',
    usuarioApellido: '',
    usuarioNombre: '',
    usuarioTelefono: '',
    centroNombre: '',
    centroEsVirtual: false,
    actividadId: 0,
    domicilio: null,
    direccionSimplificada: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Obtener la actividad seleccionada
  const actividadSeleccionada = actividades.find(a => a.id === formData.actividadId);

  // Función para buscar usuario por email (auto-completado)
  const buscarUsuarioPorEmail = async (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;
    
    setBuscandoUsuario(true);
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/email/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.id && !data.fecha_baja) {
        // Auto-completar campos si el usuario existe
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

  // Debounce para búsqueda de usuario por email
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (formData.usuarioEmail && formData.usuarioEmail.length > 5) {
      timeoutRef.current = setTimeout(() => {
        buscarUsuarioPorEmail(formData.usuarioEmail);
      }, 500);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData.usuarioEmail]);

  // Cargar actividades (excluyendo ID=10)
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

  // Cuando cambia la actividad, forzar centroEsVirtual = false si no permite virtual
  useEffect(() => {
    if (actividadSeleccionada && !actividadSeleccionada.virtual) {
      setFormData(prev => ({ ...prev, centroEsVirtual: false }));
    }
  }, [formData.actividadId, actividadSeleccionada]);

  // Verificar disponibilidad de URL
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
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleWhatsappChange = (value: string) => {
    setFormData(prev => ({ ...prev, negocioWhatsapp: value || '' }));
    if (errors.negocioWhatsapp) {
      setErrors(prev => ({ ...prev, negocioWhatsapp: undefined }));
    }
  };

  const handleDireccionSeleccionada = (direccionCompleta: Direccion) => {
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
      domicilio: domicilioDto,
      direccionSimplificada
    }));
    
    if (errors.domicilio) {
      setErrors(prev => ({ ...prev, domicilio: undefined }));
    }
  };

  const requiereDireccion = (): boolean => {
    if (actividadSeleccionada && !actividadSeleccionada.virtual) {
      return true;
    }
    return !formData.centroEsVirtual;
  };

  const mostrarCheckboxVirtual = (): boolean => {
    return actividadSeleccionada?.virtual === true;
  };

  const handleCancelar = () => {
    navigate('/');
  };

  const validarFormulario = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Negocio
    if (!formData.negocioNombre.trim()) {
      newErrors.negocioNombre = 'El nombre del negocio es obligatorio';
    } else if (formData.negocioNombre.length < 3) {
      newErrors.negocioNombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (urlDisponible === false) {
      newErrors.negocioUrl = 'Esta URL ya está en uso. Cambiá el nombre del negocio (ej: agregando tu ciudad o dirección)';
    }
    
    if (!formData.negocioWhatsapp) {
      newErrors.negocioWhatsapp = 'El número de WhatsApp es obligatorio';
    } else if (!isValidPhoneNumber(formData.negocioWhatsapp)) {
      newErrors.negocioWhatsapp = 'Número de WhatsApp inválido';
    }
    
    // Usuario
    if (!formData.usuarioEmail.trim()) {
      newErrors.usuarioEmail = 'El email es obligatorio';
    } else if (!validarEmail(formData.usuarioEmail)) {
      newErrors.usuarioEmail = 'Email inválido';
    }
    
    if (!formData.usuarioApellido.trim()) {
      newErrors.usuarioApellido = 'El apellido es obligatorio';
    }
    
    if (!formData.usuarioNombre.trim()) {
      newErrors.usuarioNombre = 'El nombre es obligatorio';
    }
    
    // Centro
    if (!formData.centroNombre.trim()) {
      newErrors.centroNombre = 'El nombre del centro es obligatorio';
    }
    
    // Actividad
    if (!formData.actividadId || formData.actividadId === 0) {
      newErrors.actividadId = 'Seleccioná una actividad';
    }
    
    // Domicilio
    if (requiereDireccion() && !formData.domicilio) {
      newErrors.domicilio = 'Seleccioná una dirección en el mapa';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    if (requiereDireccion() && !formData.domicilio) {
      setErrors({ domicilio: 'Seleccioná una dirección en el mapa' });
      return;
    }
    
    setEnviando(true);
    
    try {
      // Extraer country_code y national_number del whatsapp
      let countryCode = 54;
      let nationalNumber = '';
      
      if (formData.negocioWhatsapp) {
        const match = formData.negocioWhatsapp.match(/^\+(\d+)(.+)$/);
        if (match) {
          countryCode = parseInt(match[1], 10);
          nationalNumber = match[2].replace(/\D/g, '');
        }
      }
      
      const resultado = await registrarPaso1DatosBasicos({
        negocioNombre: formData.negocioNombre,
        negocioCountryCode: countryCode,
        negocioNationalNumber: nationalNumber,
        domicilio: formData.domicilio!,
        usuarioEmail: formData.usuarioEmail,
        usuarioApellido: formData.usuarioApellido,
        usuarioNombre: formData.usuarioNombre,
        usuarioTelefono: formData.usuarioTelefono || undefined,
        centroNombre: formData.centroNombre,
        centroEsVirtual: formData.centroEsVirtual,
        actividadId: formData.actividadId,
      });
      
      onSuccess(resultado);
    } catch (error) {
      console.error('Error al registrar:', error);
      onError?.(error instanceof Error ? error.message : 'Error al procesar el formulario');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Paso 1: Datos del Negocio</h2>
      
      {/* SECCIÓN NEGOCIO */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Información del Negocio</legend>
        
        <div className={styles.formGroup}>
          <label htmlFor="negocioNombre" className={styles.label}>
            Nombre del negocio *
          </label>
          <input
            type="text"
            id="negocioNombre"
            name="negocioNombre"
            value={formData.negocioNombre}
            onChange={handleChange}
            className={`${styles.input} ${errors.negocioNombre ? styles.inputError : ''}`}
            placeholder="Ej: Galicia Salud"
          />
          {errors.negocioNombre && (
            <span className={styles.errorText}>{errors.negocioNombre}</span>
          )}
          {formData.negocioNombre && (
            <span className={styles.helperText}>
              URL generada: {window.location.origin}/negocio/{generarSlug(formData.negocioNombre)}
              {verificandoUrl && <span className={styles.spinnerSmall}> 🔄</span>}
              {urlDisponible === true && !verificandoUrl && (
                <span className={styles.successText}> ✅ Disponible</span>
              )}
              {urlDisponible === false && !verificandoUrl && (
                <span className={styles.errorText}> ❌ No disponible. Cambiá el nombre del negocio</span>
              )}
            </span>
          )}
          {errors.negocioUrl && (
            <span className={styles.errorText}>{errors.negocioUrl}</span>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>WhatsApp *</label>
          <PhoneInput
            international
            defaultCountry="AR"
            value={formData.negocioWhatsapp}
            onChange={handleWhatsappChange}
            className={`${styles.phoneInput} ${errors.negocioWhatsapp ? styles.inputError : ''}`}
            limitMaxLength={true}
          />
          {errors.negocioWhatsapp && (
            <span className={styles.errorText}>{errors.negocioWhatsapp}</span>
          )}
          <span className={styles.helperText}>Con código de país. Ej: +54 9 11 1234 5678</span>
        </div>
      </fieldset>
      
      {/* SECCIÓN USUARIO */}
<fieldset className={styles.fieldset}>
  <legend className={styles.legend}>Datos del Dueño</legend>
  
  <div className={styles.formGroup}>
    <label htmlFor="usuarioEmail" className={styles.label}>
      Email *
    </label>
    <input
      type="email"
      id="usuarioEmail"
      name="usuarioEmail"
      value={formData.usuarioEmail}
      onChange={handleChange}
      className={`${styles.input} ${errors.usuarioEmail ? styles.inputError : ''}`}
      placeholder="Ej: carlos@ejemplo.com"
    />
    {buscandoUsuario && (
      <span className={styles.helperText}>Buscando usuario...</span>
    )}
    {errors.usuarioEmail && (
      <span className={styles.errorText}>{errors.usuarioEmail}</span>
    )}
    <span className={styles.helperText}>Recibirás los links de acceso y gestión</span>
  </div>
  
  <div className={styles.row}>
    <div className={styles.formGroup}>
      <label htmlFor="usuarioApellido" className={styles.label}>
        Apellido *
      </label>
      <input
        type="text"
        id="usuarioApellido"
        name="usuarioApellido"
        value={formData.usuarioApellido}
        onChange={handleChange}
        className={`${styles.input} ${errors.usuarioApellido ? styles.inputError : ''}`}
        placeholder="Ej: García"
      />
      {errors.usuarioApellido && (
        <span className={styles.errorText}>{errors.usuarioApellido}</span>
      )}
    </div>
    
    <div className={styles.formGroup}>
      <label htmlFor="usuarioNombre" className={styles.label}>
        Nombre *
      </label>
      <input
        type="text"
        id="usuarioNombre"
        name="usuarioNombre"
        value={formData.usuarioNombre}
        onChange={handleChange}
        className={`${styles.input} ${errors.usuarioNombre ? styles.inputError : ''}`}
        placeholder="Ej: Carlos"
      />
      {errors.usuarioNombre && (
        <span className={styles.errorText}>{errors.usuarioNombre}</span>
      )}
    </div>
  </div>
  
  <div className={styles.formGroup}>
    <label htmlFor="usuarioTelefono" className={styles.label}>
      Teléfono (opcional)
    </label>
    <input
      type="tel"
      id="usuarioTelefono"
      name="usuarioTelefono"
      value={formData.usuarioTelefono}
      onChange={handleChange}
      className={styles.input}
      placeholder="Ej: 5491112345678"
    />
  </div>
</fieldset>
      
      {/* SECCIÓN ACTIVIDAD */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Actividad del Negocio</legend>
        
        <div className={styles.formGroup}>
          <label htmlFor="actividadId" className={styles.label}>
            Seleccioná tu actividad principal *
          </label>
          <select
            id="actividadId"
            name="actividadId"
            value={formData.actividadId}
            onChange={handleChange}
            className={`${styles.select} ${errors.actividadId ? styles.inputError : ''}`}
            disabled={cargandoActividades}
          >
            <option value="0">Seleccionar...</option>
            {actividades.map(act => (
              <option key={act.id} value={act.id}>
                {act.nombre}
              </option>
            ))}
          </select>
          {cargandoActividades && (
            <span className={styles.helperText}>Cargando actividades...</span>
          )}
          {errors.actividadId && (
            <span className={styles.errorText}>{errors.actividadId}</span>
          )}
          {actividadSeleccionada && !actividadSeleccionada.virtual && (
            <span className={styles.helperText} style={{ color: '#d97706' }}>
              ⚠️ Esta actividad solo permite centros presenciales (con dirección física)
            </span>
          )}
        </div>
      </fieldset>
      
      {/* SECCIÓN CENTRO */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Centro / Sucursal</legend>
        
        <div className={styles.formGroup}>
          <label htmlFor="centroNombre" className={styles.label}>
            Nombre del centro *
          </label>
          <input
            type="text"
            id="centroNombre"
            name="centroNombre"
            value={formData.centroNombre}
            onChange={handleChange}
            className={`${styles.input} ${errors.centroNombre ? styles.inputError : ''}`}
            placeholder="Ej: Sucursal Central"
          />
          {errors.centroNombre && (
            <span className={styles.errorText}>{errors.centroNombre}</span>
          )}
        </div>
        
        {mostrarCheckboxVirtual() && (
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="centroEsVirtual"
                checked={formData.centroEsVirtual}
                onChange={handleChange}
              />
              Es un centro virtual (sin dirección física)
            </label>
          </div>
        )}
        
        {requiereDireccion() && (
          <div className={styles.mapaContainer}>
            <label className={styles.label}>
              Dirección del centro *
            </label>
            <MapaSelector 
              onChange={handleDireccionSeleccionada}
              autoLocate={true}
            />
            {formData.direccionSimplificada && (
              <div className={styles.direccionConfirmada}>
                <strong>Dirección seleccionada:</strong> {formData.direccionSimplificada}
              </div>
            )}
            {errors.domicilio && (
              <span className={styles.errorText}>{errors.domicilio}</span>
            )}
          </div>
        )}
        
        {!requiereDireccion() && mostrarCheckboxVirtual() && formData.centroEsVirtual && (
          <div className={styles.direccionConfirmada} style={{ backgroundColor: '#e0f2fe', borderColor: '#7dd3fc', color: '#0369a1' }}>
            💻 Centro virtual - No requiere dirección física
          </div>
        )}
      </fieldset>
      
      {/* BOTONES */}
      <div className={styles.buttonsContainer}>
        <button
          type="button"
          onClick={handleCancelar}
          className={styles.buttonSecondary}
          disabled={enviando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando || (urlDisponible === false)}
          className={styles.buttonPrimary}
        >
          {enviando ? 'Procesando...' : 'Continuar al Paso 2'}
        </button>
      </div>
    </form>
  );
};

export default Paso1DatosBasicos;
