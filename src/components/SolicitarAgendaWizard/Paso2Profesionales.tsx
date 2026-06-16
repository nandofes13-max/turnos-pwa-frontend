// src/components/SolicitarAgendaWizard/Paso2Profesionales.tsx
// Paso 2 del Wizard: Cargar Profesional + Especialidad
// VERSIÓN CON AJUSTES:
// - Foco automático en campo documento al cargar
// - Sin mensaje de éxito al auto-completar
// - Limpieza de errores al modificar campos
// - Resumen de profesional cargado con botón eliminar
// - Cartel de límite alcanzado

import React, { useState, useEffect, useRef } from 'react';
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
  buscarProfesionalPorDocumento,
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
  documento: string;
  nombre: string;
  email: string;
  whatsapp: string;
  genero: string;
  matricula: string;
  foto: string;
  especialidadSeleccionada: string;
  especialidadDescripcion: string;
  especialidadDescripcionProfesional: string;
}

interface ValidationErrors {
  documento?: string;
  nombre?: string;
  email?: string;
  whatsapp?: string;
  genero?: string;
  especialidad?: string;
  foto?: string;
}

// Datos guardados después de crear el profesional
interface ProfesionalGuardado {
  id: number;
  documento: string;
  nombre: string;
  email: string;
  whatsapp: string;
  especialidadNombre: string;
  especialidadDescripcionProfesional: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const UPLOAD_URL = `${API_BASE_URL}/upload`;

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
  const [uploading, setUploading] = useState(false);
  const [buscandoProfesional, setBuscandoProfesional] = useState(false);
  const [profesionalGuardado, setProfesionalGuardado] = useState<ProfesionalGuardado | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const documentoInputRef = useRef<HTMLInputElement>(null);
  
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
    especialidadDescripcionProfesional: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const OPCION_AGREGAR_ESPECIALIDAD = '__AGREGAR_NUEVA_ESPECIALIDAD__';
  const maxProfesionales = 1; // Límite de 1 profesional

  // Foco en el campo documento al montar el componente
  useEffect(() => {
    if (documentoInputRef.current) {
      documentoInputRef.current.focus();
    }
  }, []);

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

  // Auto-completado por documento - SIN mensaje de éxito
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const documento = formData.documento;
    
    if (!documento || documento.length < 6) {
      setFormData(prev => ({
        ...prev,
        nombre: '',
        email: '',
        genero: '',
        matricula: '',
        foto: '',
        whatsapp: '',
      }));
      setBuscandoProfesional(false);
      return;
    }
    
    timeoutRef.current = setTimeout(async () => {
      setBuscandoProfesional(true);
      try {
        const profesional = await buscarProfesionalPorDocumento(documento);
        if (profesional) {
          setFormData(prev => ({
            ...prev,
            nombre: profesional.nombre || '',
            email: profesional.email || '',
            genero: profesional.genero || '',
            matricula: profesional.matricula || '',
            foto: profesional.foto || '',
            whatsapp: profesional.whatsapp_e164 || '',
          }));
          // No mostrar mensaje de éxito
        } else {
          setFormData(prev => ({
            ...prev,
            nombre: '',
            email: '',
            genero: '',
            matricula: '',
            foto: '',
            whatsapp: '',
          }));
        }
      } catch (error) {
        console.error('Error buscando profesional:', error);
      } finally {
        setBuscandoProfesional(false);
      }
    }, 500);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData.documento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Limpiar error global cuando el usuario modifica cualquier campo
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    if (name === 'especialidadSeleccionada') {
      if (value === OPCION_AGREGAR_ESPECIALIDAD) {
        setFormData(prev => ({ ...prev, especialidadSeleccionada: '' }));
        setMostrarModalNuevaEspecialidad(true);
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsappChange = (value: string) => {
    setFormData(prev => ({ ...prev, whatsapp: value || '' }));
    if (errors.whatsapp) {
      setErrors(prev => ({ ...prev, whatsapp: undefined }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          if (!res.ok) throw new Error('Error al subir imagen');
          const data = await res.json();
          resolve(data.url);
        } catch (err) {
          reject(err);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploading(false);
        reject(new Error('Error al leer el archivo'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, foto: 'Solo se permiten imágenes' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, foto: 'La imagen no debe superar los 2MB' }));
      return;
    }

    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, foto: url }));
      setErrors(prev => ({ ...prev, foto: undefined }));
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, foto: 'Error al subir la imagen' }));
    }
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const [mostrarModalNuevaEspecialidad, setMostrarModalNuevaEspecialidad] = useState(false);
  const [nuevaEspecialidadNombre, setNuevaEspecialidadNombre] = useState('');
  const [nuevaEspecialidadDescripcion, setNuevaEspecialidadDescripcion] = useState('');

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
    
    const existente = await buscarEspecialidadPorNombre(nuevaEspecialidadNombre);
    if (existente) {
      onError?.('Ya existe una especialidad con ese nombre');
      return;
    }
    
    setMostrarModalNuevaEspecialidad(false);
    setFormData(prev => ({
      ...prev,
      especialidadSeleccionada: nuevaEspecialidadNombre,
      especialidadDescripcion: nuevaEspecialidadDescripcion,
    }));
    
    setNuevaEspecialidadNombre('');
    setNuevaEspecialidadDescripcion('');
    
    if (errors.especialidad) {
      setErrors(prev => ({ ...prev, especialidad: undefined }));
    }
  };

  const handleEliminarProfesional = () => {
    setProfesionalGuardado(null);
    setFormData({
      documento: '',
      nombre: '',
      email: '',
      whatsapp: '',
      genero: '',
      matricula: '',
      foto: '',
      especialidadSeleccionada: '',
      especialidadDescripcion: '',
      especialidadDescripcionProfesional: '',
    });
    setErrors({});
    // Re-enfocar el campo documento
    setTimeout(() => {
      if (documentoInputRef.current) {
        documentoInputRef.current.focus();
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si ya hay un profesional guardado, no permitir crear otro
    if (profesionalGuardado) {
      onError?.('Solo se permite un profesional por negocio. Si necesita más, comuníquese con la ayuda.');
      return;
    }
    
    if (!validarFormulario()) {
      return;
    }
    
    setEnviando(true);
    
    try {
      const phoneData = parsePhoneE164(formData.whatsapp);
      if (!phoneData) {
        throw new Error('El número de WhatsApp no es válido');
      }
      
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
      
      let especialidadId: number;
      let especialidadNombre = formData.especialidadSeleccionada;
      
      let especialidadExistente = await buscarEspecialidadPorNombre(especialidadNombre);
      
      if (especialidadExistente) {
        especialidadId = especialidadExistente.id;
      } else {
        const nuevaEspecialidad = await createEspecialidad({
          nombre: especialidadNombre.toUpperCase(),
          descripcion: formData.especialidadDescripcion,
        });
        especialidadId = nuevaEspecialidad.id;
        
        await createActividadEspecialidad({
          actividadId: actividadId,
          especialidadId: especialidadId,
        });
      }
      
      const profesional = await createProfesional(profesionalData);
      
      const profesionalEspecialidad = await createProfesionalEspecialidad({
        profesionalId: profesional.id,
        especialidadId: especialidadId,
        descripcion: formData.especialidadDescripcionProfesional || null,
      });
      
      const especialidadFinal = especialidadExistente || await buscarEspecialidadPorNombre(especialidadNombre);
      
      // Guardar en el resumen
      setProfesionalGuardado({
        id: profesional.id,
        documento: profesional.documento,
        nombre: profesional.nombre,
        email: profesional.email,
        whatsapp: profesional.whatsapp_e164,
        especialidadNombre: especialidadFinal!.nombre,
        especialidadDescripcionProfesional: formData.especialidadDescripcionProfesional,
      });
      
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

  const opcionesEspecialidades = () => {
    const opciones = [
      <option key="agregar" value={OPCION_AGREGAR_ESPECIALIDAD}>
        + Agregar nueva especialidad
      </option>,
      ...especialidades.map(esp => (
        <option key={esp.id} value={esp.nombre}>
          {esp.nombre}
        </option>
      )),
    ];
    return opciones;
  };

  const limiteAlcanzado = profesionalGuardado !== null;

  return (
    <div className={styles['wizard-container-page']}>
      <div className={styles['wizard-left']}>
        <div className={styles['wizard-left-content']}>
          <div className={styles['wizard-card']}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <h2 className={styles.title}>Paso 2: Datos del Profesional</h2>
              <p className={styles.subtitle}>Cargá el profesional que atenderá en tu negocio</p>
              
              {/* Resumen de profesional cargado */}
              {profesionalGuardado && (
                <div className={styles.centrosLista}>
                  <h4 className={styles.subtitle}>📋 Profesional cargado:</h4>
                  <div className={styles.centroCargado}>
                    <div>
                      <strong>{profesionalGuardado.nombre}</strong>
                      <br />
                      <span className={styles.centroDireccion}>
                        Documento: {profesionalGuardado.documento} | Email: {profesionalGuardado.email}
                        <br />
                        Especialidad: {profesionalGuardado.especialidadNombre}
                        {profesionalGuardado.especialidadDescripcionProfesional && (
                          <> - {profesionalGuardado.especialidadDescripcionProfesional}</>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleEliminarProfesional}
                      className={styles.buttonEliminar}
                    >
                      ❌
                    </button>
                  </div>
                </div>
              )}
              
              {/* Cartel de límite alcanzado */}
              {limiteAlcanzado && (
                <div className={styles.direccionConfirmada} style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b', color: '#92400e', marginBottom: '16px' }}>
                  ⚠️ Límite de profesionales alcanzado. Solo se permite un profesional por negocio. Si necesita más, comuníquese con la ayuda.
                </div>
              )}
              
              {/* Formulario de carga - solo si no se alcanzó el límite */}
              {!limiteAlcanzado && (
                <>
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
                        ref={documentoInputRef}
                        value={formData.documento}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.documento ? styles.inputError : ''}`}
                        placeholder="Ej: 12345678"
                      />
                      {buscandoProfesional && (
                        <span className={styles.helperText}>Buscando profesional...</span>
                      )}
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
                    
                    {/* Campo Foto */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Foto</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.input}
                        disabled={uploading}
                      />
                      {uploading && <span className={styles.helperText}>Subiendo imagen...</span>}
                      {errors.foto && (
                        <span className={styles.errorText}>{errors.foto}</span>
                      )}
                      {formData.foto && (
                        <div className={styles.fotoPreview}>
                          <img 
                            src={formData.foto} 
                            alt="Vista previa" 
                            className={styles.fotoPreviewImg}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, foto: '' }))}
                            className={styles.buttonEliminar}
                            style={{ marginTop: '8px' }}
                          >
                            🗑️ Quitar foto
                          </button>
                        </div>
                      )}
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
                                {opcionesEspecialidades()}
                              </select>
                              {errors.especialidad && (
                                <span className={styles.errorText}>{errors.especialidad}</span>
                              )}
                            </div>
                            
                            <div className={styles.formGroup}>
                              <label htmlFor="especialidadDescripcionProfesional" className={styles.label}>
                                Descripción de la especialidad (opcional)
                              </label>
                              <textarea
                                id="especialidadDescripcionProfesional"
                                name="especialidadDescripcionProfesional"
                                value={formData.especialidadDescripcionProfesional}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Ej: Especialista en psicología infantil"
                                rows={3}
                              />
                              <span className={styles.helperText}>
                                Esta descripción se mostrará al cliente al momento de reservar el turno.
                              </span>
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
                </>
              )}
              
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
                {onBack && !limiteAlcanzado && (
                  <button
                    type="button"
                    onClick={onBack}
                    className={styles.buttonSecondary}
                    disabled={enviando}
                  >
                    Volver
                  </button>
                )}
                {!limiteAlcanzado && (
                  <button
                    type="submit"
                    disabled={enviando}
                    className={styles.buttonPrimary}
                  >
                    {enviando ? 'Guardando...' : 'Guardar Profesional'}
                  </button>
                )}
                {limiteAlcanzado && (
                  <button
                    type="button"
                    onClick={() => onSuccess({
                      profesional: {} as any,
                      especialidad: {} as any,
                      profesionalEspecialidad: {} as any,
                    })}
                    className={styles.buttonPrimary}
                  >
                    Continuar al Paso 3
                  </button>
                )}
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
