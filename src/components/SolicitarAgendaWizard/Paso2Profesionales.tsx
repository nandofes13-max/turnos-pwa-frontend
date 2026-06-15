// src/components/SolicitarAgendaWizard/Paso2Profesionales.tsx
// Paso 2 del Wizard: Cargar Profesional + Especialidad
// - Solo 1 profesional por wizard (límite = 1)
// - Solo 1 especialidad por profesional
// - Especialidades filtradas por actividad del negocio
// - Permite crear nueva especialidad si no existe

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  createProfesional,
  createEspecialidad,
  createActividadEspecialidad,
  createProfesionalEspecialidad,
  getEspecialidadesPorActividad,
  buscarEspecialidadPorNombre,
  Especialidad,
  Paso2Result,
} from '../../services/apiWizard';
import styles from './wizard.module.css';

interface Paso2ProfesionalesProps {
  negocioId: number;
  actividadId: number;
  onSuccess: (data: Paso2Result) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
}

interface FormData {
  // Datos del profesional
  documento: string;
  nombre: string;
  email: string;
  whatsapp: string;
  genero: string;
  matricula: string;
  foto: string;
  // Especialidad
  especialidadSeleccionada: string;
  especialidadDescripcion: string;
}

interface ValidationErrors {
  documento?: string;
  nombre?: string;
  email?: string;
  whatsapp?: string;
  genero?: string;
  especialidad?: string;
}

const Paso2Profesionales: React.FC<Paso2ProfesionalesProps> = ({
  negocioId,
  actividadId,
  onSuccess,
  onError,
  onBack,
}) => {
  const navigate = useNavigate();
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [cargandoEspecialidades, setCargandoEspecialidades] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mostrarModalNuevaEspecialidad, setMostrarModalNuevaEspecialidad] = useState(false);
  const [nuevaEspecialidadNombre, setNuevaEspecialidadNombre] = useState('');
  const [nuevaEspecialidadDescripcion, setNuevaEspecialidadDescripcion] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    documento: '',
    nombre: '',
    email: '',
    whatsapp: '',
    genero: '',
    matricula: '',
    foto: '',
    especialidadSeleccionada: '',
    especialidadDescripcion: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Cargar especialidades filtradas por actividad
  useEffect(() => {
    const cargarEspecialidades = async () => {
      if (!actividadId) return;
      
      setCargandoEspecialidades(true);
      try {
        const data = await getEspecialidadesPorActividad(actividadId);
        setEspecialidades(data);
      } catch (error) {
        console.error('Error cargando especialidades:', error);
        onError?.('No se pudieron cargar las especialidades');
      } finally {
        setCargandoEspecialidades(false);
      }
    };
    
    cargarEspecialidades();
  }, [actividadId, onError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleWhatsappChange = (value: string) => {
    setFormData(prev => ({ ...prev, whatsapp: value || '' }));
    if (errors.whatsapp) {
      setErrors(prev => ({ ...prev, whatsapp: undefined }));
    }
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarFormulario = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es obligatorio';
    } else if (formData.documento.length < 6) {
      newErrors.documento = 'El documento debe tener al menos 6 caracteres';
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!validarEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.whatsapp) {
      newErrors.whatsapp = 'El número de WhatsApp es obligatorio';
    } else if (!isValidPhoneNumber(formData.whatsapp)) {
      newErrors.whatsapp = 'Número de WhatsApp inválido';
    }
    
    if (!formData.genero) {
      newErrors.genero = 'Seleccioná un género';
    }
    
    if (!formData.especialidadSeleccionada.trim() && !mostrarModalNuevaEspecialidad) {
      newErrors.especialidad = 'Seleccioná o agregá una especialidad';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parsePhoneE164 = (phone: string | undefined): { country_code: number; national_number: string } | null => {
    if (!phone) return null;
    const match = phone.match(/^\+(\d{1,3})(\d+)$/);
    if (match) {
      return {
        country_code: parseInt(match[1], 10),
        national_number: match[2],
      };
    }
    return null;
  };

  const handleAgregarEspecialidad = async () => {
    if (!nuevaEspecialidadNombre.trim()) {
      onError?.('El nombre de la especialidad es obligatorio');
      return;
    }
    
    // Verificar que no exista ya una especialidad con ese nombre
    const existente = await buscarEspecialidadPorNombre(nuevaEspecialidadNombre);
    if (existente) {
      onError?.('Ya existe una especialidad con ese nombre');
      return;
    }
    
    // Cerrar modal y seleccionar la nueva especialidad
    setMostrarModalNuevaEspecialidad(false);
    setFormData(prev => ({
      ...prev,
      especialidadSeleccionada: nuevaEspecialidadNombre,
      especialidadDescripcion: nuevaEspecialidadDescripcion,
    }));
    
    // Limpiar campos del modal
    setNuevaEspecialidadNombre('');
    setNuevaEspecialidadDescripcion('');
    
    if (errors.especialidad) {
      setErrors(prev => ({ ...prev, especialidad: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setEnviando(true);
    
    try {
      // Parsear WhatsApp
      const phoneData = parsePhoneE164(formData.whatsapp);
      if (!phoneData) {
        throw new Error('El número de WhatsApp no es válido');
      }
      
      // Datos del profesional
      const profesionalData = {
        documento: formData.documento,
        nombre: formData.nombre.toUpperCase(),
        email: formData.email.toLowerCase(),
        country_code: phoneData.country_code,
        national_number: phoneData.national_number,
        genero: formData.genero,
        matricula: formData.matricula || undefined,
        foto: formData.foto || undefined,
      };
      
      // Crear profesional y especialidad
      let especialidadId: number;
      let especialidadNombre = formData.especialidadSeleccionada;
      
      // Verificar si la especialidad ya existe
      let especialidadExistente = await buscarEspecialidadPorNombre(especialidadNombre);
      
      if (especialidadExistente) {
        especialidadId = especialidadExistente.id;
      } else {
        // Crear nueva especialidad
        const nuevaEspecialidad = await createEspecialidad({
          nombre: especialidadNombre.toUpperCase(),
          descripcion: formData.especialidadDescripcion,
        });
        especialidadId = nuevaEspecialidad.id;
        
        // Crear relación actividad-especialidad
        await createActividadEspecialidad({
          actividadId: actividadId,
          especialidadId: especialidadId,
        });
      }
      
      // Crear profesional
      const profesional = await createProfesional(profesionalData);
      
      // Crear relación profesional-especialidad
      const profesionalEspecialidad = await createProfesionalEspecialidad({
        profesionalId: profesional.id,
        especialidadId: especialidadId,
      });
      
      // Obtener la especialidad completa para el resultado
      const especialidadFinal = especialidadExistente || await buscarEspecialidadPorNombre(especialidadNombre);
      
      onSuccess({
        profesional,
        especialidad: especialidadFinal!,
        profesionalEspecialidad,
      });
    } catch (error) {
      console.error('Error al registrar profesional:', error);
      onError?.(error instanceof Error ? error.message : 'Error al procesar el formulario');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = () => {
    navigate('/');
  };

  return (
    <div className={styles['wizard-container-page']}>
      <div className={styles['wizard-left']}>
        <div className={styles['wizard-left-content']}>
          <div className={styles['wizard-card']}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <h2 className={styles.title}>Paso 2: Datos del Profesional</h2>
              <p className={styles.subtitle}>Cargá el profesional que atenderá en tu negocio</p>
              
              {/* SECCIÓN PROFESIONAL */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Datos del Profesional</legend>
                
                <div className={styles.formGroup}>
                  <label htmlFor="documento" className={styles.label}>
                    Documento *
                  </label>
                  <input
                    type="text"
                    id="documento"
                    name="documento"
                    value={formData.documento}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.documento ? styles.inputError : ''}`}
                    placeholder="Ej: 12345678"
                  />
                  {errors.documento && (
                    <span className={styles.errorText}>{errors.documento}</span>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="nombre" className={styles.label}>
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
                    placeholder="Ej: Juan Carlos Pérez"
                  />
                  {errors.nombre && (
                    <span className={styles.errorText}>{errors.nombre}</span>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    placeholder="Ej: juan@ejemplo.com"
                  />
                  {errors.email && (
                    <span className={styles.errorText}>{errors.email}</span>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>WhatsApp *</label>
                  <PhoneInput
                    international
                    defaultCountry="AR"
                    value={formData.whatsapp}
                    onChange={handleWhatsappChange}
                    className={`${styles.phoneInput} ${errors.whatsapp ? styles.inputError : ''}`}
                    limitMaxLength={true}
                  />
                  {errors.whatsapp && (
                    <span className={styles.errorText}>{errors.whatsapp}</span>
                  )}
                  <span className={styles.helperText}>Con código de país. Ej: +54 9 11 1234 5678</span>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="genero" className={styles.label}>
                    Género *
                  </label>
                  <select
                    id="genero"
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className={`${styles.select} ${errors.genero ? styles.inputError : ''}`}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="X">No binario</option>
                  </select>
                  {errors.genero && (
                    <span className={styles.errorText}>{errors.genero}</span>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="matricula" className={styles.label}>
                    Matrícula (opcional)
                  </label>
                  <input
                    type="text"
                    id="matricula"
                    name="matricula"
                    value={formData.matricula}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Ej: MP-12345"
                  />
                </div>
              </fieldset>
              
              {/* SECCIÓN ESPECIALIDAD */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Especialidad</legend>
                
                {cargandoEspecialidades ? (
                  <div className={styles.helperText}>Cargando especialidades...</div>
                ) : (
                  <>
                    {!mostrarModalNuevaEspecialidad ? (
                      <>
                        <div className={styles.formGroup}>
                          <label htmlFor="especialidadSeleccionada" className={styles.label}>
                            Seleccioná la especialidad *
                          </label>
                          <select
                            id="especialidadSeleccionada"
                            name="especialidadSeleccionada"
                            value={formData.especialidadSeleccionada}
                            onChange={handleChange}
                            className={`${styles.select} ${errors.especialidad ? styles.inputError : ''}`}
                          >
                            <option value="">Seleccionar especialidad...</option>
                            {especialidades.map(esp => (
                              <option key={esp.id} value={esp.nombre}>
                                {esp.nombre}
                              </option>
                            ))}
                          </select>
                          {errors.especialidad && (
                            <span className={styles.errorText}>{errors.especialidad}</span>
                          )}
                        </div>
                        
                        <div className={styles.buttonsContainerInline}>
                          <button
                            type="button"
                            onClick={() => setMostrarModalNuevaEspecialidad(true)}
                            className={styles.buttonSecondary}
                          >
                            + Agregar especialidad
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className={styles.modalInline}>
                        <h4 className={styles.subtitle}>Nueva Especialidad</h4>
                        
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Nombre de la especialidad *</label>
                          <input
                            type="text"
                            value={nuevaEspecialidadNombre}
                            onChange={(e) => setNuevaEspecialidadNombre(e.target.value.toUpperCase())}
                            className={styles.input}
                            placeholder="Ej: CARDIOLOGÍA"
                            autoFocus
                          />
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Descripción (opcional)</label>
                          <textarea
                            value={nuevaEspecialidadDescripcion}
                            onChange={(e) => setNuevaEspecialidadDescripcion(e.target.value)}
                            className={styles.input}
                            placeholder="Descripción de la especialidad"
                            rows={2}
                          />
                        </div>
                        
                        <div className={styles.buttonsContainerInline}>
                          <button
                            type="button"
                            onClick={() => {
                              setMostrarModalNuevaEspecialidad(false);
                              setNuevaEspecialidadNombre('');
                              setNuevaEspecialidadDescripcion('');
                            }}
                            className={styles.buttonSecondary}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAgregarEspecialidad}
                            className={styles.buttonPrimary}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className={styles.buttonSecondary}
                    disabled={enviando}
                  >
                    Volver
                  </button>
                )}
                <button
                  type="submit"
                  disabled={enviando}
                  className={styles.buttonPrimary}
                >
                  {enviando ? 'Guardando...' : 'Continuar al Paso 3'}
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

export default Paso2Profesionales;
