// src/components/SolicitarAgendaWizard/Paso1DatosBasicos.tsx
// Paso 1 del Wizard: Datos del Negocio + Usuario + Centro + Actividad
// CON AJUSTES:
// - Excluye actividad ID=10
// - Muestra checkbox de centro virtual SOLO si la actividad lo permite (virtual === true)
// - centroEsVirtual = false por defecto
// - Dirección obligatoria cuando el centro es físico

import React, { useState, useEffect } from 'react';
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
  negocioCountryCode: number;
  negocioNationalNumber: string;
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
  actividadSeleccionada: Actividad | null;
  // Domicilio (completo, como viene del MapaSelector)
  domicilio: DomicilioDto | null;
  // Dirección simplificada para mostrar en pantalla
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

// Función para generar dirección simplificada (formato: "Calle Número, Ciudad, País")
const formatearDireccionSimplificada = (domicilio: DomicilioDto): string => {
  const calleCompleta = `${domicilio.street} ${domicilio.street_number}`.trim();
  return `${calleCompleta}, ${domicilio.city}, ${domicilio.country}`;
};

const Paso1DatosBasicos: React.FC<Paso1DatosBasicosProps> = ({ onSuccess, onError }) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargandoActividades, setCargandoActividades] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [urlDisponible, setUrlDisponible] = useState<boolean | null>(null);
  const [verificandoUrl, setVerificandoUrl] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    negocioNombre: '',
    negocioCountryCode: 54,
    negocioNationalNumber: '',
    usuarioEmail: '',
    usuarioApellido: '',
    usuarioNombre: '',
    usuarioTelefono: '',
    centroNombre: '',
    centroEsVirtual: false, // Por defecto: centro físico
    actividadId: 0,
    actividadSeleccionada: null,
    domicilio: null,
    direccionSimplificada: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Cargar actividades al montar el componente (excluyendo ID=10)
  useEffect(() => {
    const cargarActividades = async () => {
      try {
        const data = await getActividades();
        // Filtrar: solo activas y excluir ID=10 ("SOLICITAR OTRAS ACTIVIDADES")
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

  // Cuando cambia la actividad, actualizar el objeto actividadSeleccionada
  useEffect(() => {
    const actividad = actividades.find(a => a.id === formData.actividadId);
    setFormData(prev => ({ ...prev, actividadSeleccionada: actividad || null }));
    
    // Si la actividad NO permite virtual, forzar centroEsVirtual = false
    if (actividad && !actividad.virtual) {
      setFormData(prev => ({ ...prev, centroEsVirtual: false }));
    }
  }, [formData.actividadId, actividades]);

  // Verificar disponibilidad de URL cuando cambia el nombre del negocio
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

  const validarWhatsapp = (number: string): boolean => {
    const soloNumeros = number.replace(/\D/g, '');
    return soloNumeros.length >= 10 && soloNumeros.length <= 15;
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

  // Manejar selección de dirección desde el MapaSelector
  const handleDireccionSeleccionada = (direccionCompleta: Direccion) => {
    // Convertir la dirección del MapaSelector al formato DomicilioDto que espera el backend
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
    
    // Generar versión simplificada para mostrar en pantalla
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

  // Determinar si el centro requiere dirección (físico)
  const requiereDireccion = (): boolean => {
    // Si la actividad no permite virtual, siempre requiere dirección
    if (formData.actividadSeleccionada && !formData.actividadSeleccionada.virtual) {
      return true;
    }
    // Si la actividad permite virtual, requiere dirección solo si NO es virtual
    return !formData.centroEsVirtual;
  };

  // Determinar si se debe mostrar el checkbox de centro virtual
  const mostrarCheckboxVirtual = (): boolean => {
    return formData.actividadSeleccionada?.virtual === true;
  };

  const validarFormulario = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Validar negocio
    if (!formData.negocioNombre.trim()) {
      newErrors.negocioNombre = 'El nombre del negocio es obligatorio';
    } else if (formData.negocioNombre.length < 3) {
      newErrors.negocioNombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (urlDisponible === false) {
      newErrors.negocioUrl = 'Esta URL ya está en uso. Elige otro nombre de negocio';
    }
    
    if (!formData.negocioNationalNumber.trim()) {
      newErrors.negocioWhatsapp = 'El número de WhatsApp es obligatorio';
    } else if (!validarWhatsapp(formData.negocioNationalNumber)) {
      newErrors.negocioWhatsapp = 'Número inválido (mínimo 10 dígitos)';
    }
    
    // Validar usuario
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
    
    // Validar centro
    if (!formData.centroNombre.trim()) {
      newErrors.centroNombre = 'El nombre del centro es obligatorio';
    }
    
    // Validar actividad
    if (!formData.actividadId || formData.actividadId === 0) {
      newErrors.actividadId = 'Seleccioná una actividad';
    }
    
    // Validar domicilio (si requiere dirección)
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
    
    // Verificar que si requiere dirección, esté presente
    if (requiereDireccion() && !formData.domicilio) {
      setErrors({ domicilio: 'Seleccioná una dirección en el mapa' });
      return;
    }
    
    setEnviando(true);
    
    try {
      const resultado = await registrarPaso1DatosBasicos({
        negocioNombre: formData.negocioNombre,
        negocioCountryCode: formData.negocioCountryCode,
        negocioNationalNumber: formData.negocioNationalNumber,
        domicilio: formData.domicilio!, // Se envía la dirección COMPLETA al backend
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
      
      {/* ===== SECCIÓN NEGOCIO ===== */}
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
              URL generada: {generarSlug(formData.negocioNombre)}
              {verificandoUrl && <span className={styles.spinnerSmall}> 🔄</span>}
              {urlDisponible === true && !verificandoUrl && (
                <span className={styles.successText}> ✅ Disponible</span>
              )}
              {urlDisponible === false && !verificandoUrl && (
                <span className={styles.errorText}> ❌ No disponible</span>
              )}
            </span>
          )}
          {errors.negocioUrl && (
            <span className={styles.errorText}>{errors.negocioUrl}</span>
          )}
        </div>
        
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="negocioCountryCode" className={styles.label}>
              Código país *
            </label>
            <select
              id="negocioCountryCode"
              name="negocioCountryCode"
              value={formData.negocioCountryCode}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="54">Argentina (+54)</option>
              <option value="598">Uruguay (+598)</option>
              <option value="56">Chile (+56)</option>
              <option value="591">Bolivia (+591)</option>
              <option value="595">Paraguay (+595)</option>
              <option value="55">Brasil (+55)</option>
              <option value="57">Colombia (+57)</option>
              <option value="51">Perú (+51)</option>
              <option value="58">Venezuela (+58)</option>
              <option value="52">México (+52)</option>
              <option value="1">EE.UU./Canadá (+1)</option>
              <option value="34">España (+34)</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="negocioNationalNumber" className={styles.label}>
              WhatsApp *
            </label>
            <input
              type="tel"
              id="negocioNationalNumber"
              name="negocioNationalNumber"
              value={formData.negocioNationalNumber}
              onChange={handleChange}
              className={`${styles.input} ${errors.negocioWhatsapp ? styles.inputError : ''}`}
              placeholder="Ej: 91123456789"
            />
            {errors.negocioWhatsapp && (
              <span className={styles.errorText}>{errors.negocioWhatsapp}</span>
            )}
            <span className={styles.helperText}>Sin espacios ni símbolos. Código de área incluido.</span>
          </div>
        </div>
      </fieldset>
      
      {/* ===== SECCIÓN USUARIO (DUEÑO) ===== */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Datos del Dueño</legend>
        
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
          {errors.usuarioEmail && (
            <span className={styles.errorText}>{errors.usuarioEmail}</span>
          )}
          <span className={styles.helperText}>Recibirás los links de acceso y gestión</span>
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
      
      {/* ===== SECCIÓN ACTIVIDAD ===== */}
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
                {act.nombre} {act.virtual ? '(Permite virtual)' : '(Solo presencial)'}
              </option>
            ))}
          </select>
          {cargandoActividades && (
            <span className={styles.helperText}>Cargando actividades...</span>
          )}
          {errors.actividadId && (
            <span className={styles.errorText}>{errors.actividadId}</span>
          )}
          {formData.actividadSeleccionada && !formData.actividadSeleccionada.virtual && (
            <span className={styles.helperText} style={{ color: '#d97706' }}>
              ⚠️ Esta actividad solo permite centros presenciales (con dirección física)
            </span>
          )}
        </div>
      </fieldset>
      
      {/* ===== SECCIÓN CENTRO ===== */}
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
        
        {/* Checkbox de centro virtual - SOLO si la actividad lo permite */}
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
        
        {/* MapaSelector - solo si requiere dirección */}
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
        
        {/* Mensaje informativo cuando NO requiere dirección (centro virtual) */}
        {!requiereDireccion() && mostrarCheckboxVirtual() && formData.centroEsVirtual && (
          <div className={styles.direccionConfirmada} style={{ backgroundColor: '#e0f2fe', borderColor: '#7dd3fc', color: '#0369a1' }}>
            💻 Centro virtual - No requiere dirección física
          </div>
        )}
      </fieldset>
      
      {/* ===== BOTONES ===== */}
      <div className={styles.buttonsContainer}>
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
