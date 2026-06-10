// src/components/SolicitarAgendaWizard/Paso1DatosBasicos.tsx
// Paso 1 del Wizard: Datos del Negocio + Usuario + Centro + Actividad
// VERSIÓN FINAL CORREGIDA:
// - Recuadro verde desaparece después de agregar centro
// - Mensaje de éxito con opción de agregar otro centro
// - Mensaje de límite alcanzado cuando hay 2 centros físicos
// - Estilos consistentes con el resto del sistema

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

interface CentroCargado {
  id: string;
  nombre: string;
  es_virtual: boolean;
  domicilio?: DomicilioDto;
  direccionSimplificada?: string;
}

interface FormData {
  negocioNombre: string;
  negocioWhatsapp: string;
  usuarioEmail: string;
  usuarioApellido: string;
  usuarioNombre: string;
  usuarioTelefono: string;
  actividadId: number;
}

interface ValidationErrors {
  negocioNombre?: string;
  negocioUrl?: string;
  negocioWhatsapp?: string;
  usuarioEmail?: string;
  usuarioApellido?: string;
  usuarioNombre?: string;
  actividadId?: string;
  centroFisico?: string;
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
  const [permiteVirtual, setPermiteVirtual] = useState(false);
  const [centrosCargados, setCentrosCargados] = useState<CentroCargado[]>([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<{
    domicilio: DomicilioDto | null;
    direccionSimplificada: string;
  }>({
    domicilio: null,
    direccionSimplificada: '',
  });
  const [mostrarFormularioCarga, setMostrarFormularioCarga] = useState(true);
  const [mostrarMensajeExito, setMostrarMensajeExito] = useState(false);
  const [mapaKey, setMapaKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    negocioNombre: '',
    negocioWhatsapp: '',
    usuarioEmail: '',
    usuarioApellido: '',
    usuarioNombre: '',
    usuarioTelefono: '',
    actividadId: 0,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const maxCentrosFisicos = 2;

  useEffect(() => {
    if (permiteVirtual && centrosCargados.length === 0 && !centrosCargados.some(c => c.es_virtual)) {
      setCentrosCargados([{
        id: 'virtual',
        nombre: 'Centro virtual',
        es_virtual: true,
      }]);
    }
  }, [permiteVirtual, centrosCargados]);

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
    
    if (name === 'actividadId') {
      const actividadEncontrada = actividades.find(a => a.id === Number(value));
      const nuevaPermiteVirtual = actividadEncontrada?.virtual === true;
      setPermiteVirtual(nuevaPermiteVirtual);
      if (!nuevaPermiteVirtual) {
        setCentrosCargados([]);
      }
    }
    
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleWhatsappChange = (value: string) => {
    setFormData(prev => ({ ...prev, negocioWhatsapp: value || '' }));
    if (errors.negocioWhatsapp) setErrors(prev => ({ ...prev, negocioWhatsapp: undefined }));
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
    
    setDireccionSeleccionada({
      domicilio: domicilioDto,
      direccionSimplificada,
    });
    
    if (errors.centroFisico) {
      setErrors(prev => ({ ...prev, centroFisico: undefined }));
    }
  };

  const handleAgregarCentroFisico = () => {
    if (!direccionSeleccionada.domicilio) {
      setErrors({ centroFisico: 'Seleccioná una dirección en el mapa' });
      return;
    }
    
    const fisicosActuales = centrosCargados.filter(c => !c.es_virtual).length;
    
    if (fisicosActuales >= maxCentrosFisicos) {
      alert('Por favor comuníquese con la ayuda para que en caso de corresponder sea agregado');
      return;
    }
    
    const nuevoCentro: CentroCargado = {
      id: `fisico-${Date.now()}`,
      nombre: `Centro Físico ${fisicosActuales + 1}`,
      es_virtual: false,
      domicilio: direccionSeleccionada.domicilio!,
      direccionSimplificada: direccionSeleccionada.direccionSimplificada,
    };
    
    setCentrosCargados(prev => [...prev, nuevoCentro]);
    
    // Limpiar dirección seleccionada
    setDireccionSeleccionada({
      domicilio: null,
      direccionSimplificada: '',
    });
    
    const nuevosFisicos = fisicosActuales + 1;
    
    if (nuevosFisicos === maxCentrosFisicos) {
      // Se alcanzó el límite de 2 centros → ocultar formulario y no mostrar mensaje de éxito
      setMostrarFormularioCarga(false);
      setMostrarMensajeExito(false);
    } else {
      // Aún no se alcanza el límite → ocultar formulario y mostrar mensaje para agregar otro
      setMostrarFormularioCarga(false);
      setMostrarMensajeExito(true);
    }
  };

  const handleAgregarOtroCentro = () => {
    setMostrarMensajeExito(false);
    setMostrarFormularioCarga(true);
    setMapaKey(prev => prev + 1);
    setDireccionSeleccionada({
      domicilio: null,
      direccionSimplificada: '',
    });
  };

  const handleNoAgregarMasCentros = () => {
    setMostrarMensajeExito(false);
    setMostrarFormularioCarga(false);
  };

  const handleEliminarCentroFisico = (id: string) => {
    setCentrosCargados(prev => prev.filter(c => c.id !== id));
    const nuevosFisicos = centrosCargados.filter(c => c.id !== id && !c.es_virtual).length;
    if (nuevosFisicos < maxCentrosFisicos) {
      setMostrarFormularioCarga(true);
      setMostrarMensajeExito(false);
      setMapaKey(prev => prev + 1);
      setDireccionSeleccionada({
        domicilio: null,
        direccionSimplificada: '',
      });
    }
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
    
    const centrosFisicos = centrosCargados.filter(c => !c.es_virtual);
    if (centrosFisicos.length === 0) {
      newErrors.centroFisico = 'Debe agregar al menos un centro físico';
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
      
      const centrosData: CentroData[] = centrosCargados.map(centro => ({
        nombre: centro.nombre,
        es_virtual: centro.es_virtual,
        domicilio: centro.domicilio,
      }));
      
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

  const centrosFisicosCargados = centrosCargados.filter(c => !c.es_virtual);
  const limiteAlcanzado = centrosFisicosCargados.length >= maxCentrosFisicos;

  return (
    <div className={styles['wizard-container-page']}>
      <div className={styles['wizard-left']}>
        <div className={styles['wizard-left-content']}>
          <div className={styles['wizard-card']}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <h2 className={styles.title}>Solicitar Agenda Gratis</h2>
              
              <div className={styles['steps-indicator']}>
                <div className={`${styles.step} ${styles['step-active']}`}>
                  <span className={styles['step-number']}>1</span>
                  <span className={styles['step-label']}>Negocio</span>
                </div>
                <div className={styles['step-line']} />
                <div className={styles.step}>
                  <span className={styles['step-number']}>2</span>
                  <span className={styles['step-label']}>Profesionales</span>
                </div>
                <div className={styles['step-line']} />
                <div className={styles.step}>
                  <span className={styles['step-number']}>3</span>
                  <span className={styles['step-label']}>Agenda</span>
                </div>
              </div>
              
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
                </div>
              </fieldset>
              
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Centros</legend>
                
                {/* Lista de centros cargados */}
                {centrosCargados.length > 0 && (
                  <div className={styles.centrosLista}>
                    {centrosCargados.map(centro => (
                      <div key={centro.id} className={styles.centroCargado}>
                        <div>
                          {centro.es_virtual ? '💻' : '📍'} {centro.nombre}
                          {!centro.es_virtual && centro.direccionSimplificada && (
                            <span className={styles.centroDireccion}> - {centro.direccionSimplificada}</span>
                          )}
                        </div>
                        {!centro.es_virtual && (
                          <button
                            type="button"
                            onClick={() => handleEliminarCentroFisico(centro.id)}
                            className={styles.buttonEliminar}
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Mensaje de límite alcanzado */}
                {limiteAlcanzado && !mostrarFormularioCarga && !mostrarMensajeExito && (
                  <div className={styles.direccionConfirmada} style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b', color: '#92400e', marginTop: '16px' }}>
                    ⚠️ Límite de centros físicos alcanzado. Si necesita más, comuníquese con la ayuda.
                  </div>
                )}
                
                {/* Formulario de carga */}
                {mostrarFormularioCarga && !limiteAlcanzado && (
                  <>
                    {direccionSeleccionada.direccionSimplificada && (
                      <div className={styles.direccionConfirmada}>
                        <strong>Dirección seleccionada:</strong> {direccionSeleccionada.direccionSimplificada}
                        <button 
                          type="button"
                          onClick={handleAgregarCentroFisico}
                          className={styles.buttonAgregar}
                        >
                          Agregar
                        </button>
                      </div>
                    )}
                    
                    <div className={styles.mapaContainer}>
                      <MapaSelector 
                        key={mapaKey}
                        onChange={handleDireccionSeleccionada}
                        autoLocate={true}
                      />
                    </div>
                  </>
                )}
                
                {/* Mensaje de éxito después de agregar (solo si no se alcanzó el límite) */}
                {mostrarMensajeExito && !limiteAlcanzado && (
                  <div className={styles.mensajeExito}>
                    <p>✅ Centro agregado correctamente.</p>
                    <p>¿Desea agregar otro centro físico?</p>
                    <div className={styles.buttonsContainerInline}>
                      <button 
                        type="button" 
                        onClick={handleAgregarOtroCentro} 
                        className={styles.buttonSmall}
                      >
                        Sí
                      </button>
                      <button 
                        type="button" 
                        onClick={handleNoAgregarMasCentros} 
                        className={styles.buttonSmall}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
                
                {errors.centroFisico && typeof errors.centroFisico === 'string' && (
                  <span className={styles.errorText}>{errors.centroFisico}</span>
                )}
              </fieldset>
              
              <div className={styles.buttonsContainer}>
                <button type="button" onClick={handleCancelar} className={styles.buttonSecondary} disabled={enviando}>Cancelar</button>
                <button type="submit" disabled={enviando || (urlDisponible === false) || centrosFisicosCargados.length === 0} className={styles.buttonPrimary}>
                  {enviando ? 'Procesando...' : 'Continuar al Paso 2'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div className={styles['wizard-right']}>
        <div className={styles['wizard-right-content']}>
          <img 
            src="/1000133565.png" 
            alt="PWA Turnos" 
            className={styles['wizard-logo-desktop']}
            onClick={() => navigate('/')}
          />
        </div>
      </div>
    </div>
  );
};

export default Paso1DatosBasicos;
