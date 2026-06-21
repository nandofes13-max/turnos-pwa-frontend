// src/components/SolicitarAgendaWizard/Paso2Profesionales.tsx
// Paso 2 del Wizard: Cargar Profesional + Especialidad
// VERSIÓN COMPLETA Y CORREGIDA:
// - Manejo de errores contextuales con botón de cerrar
// - Flujo de profesional existente: autocompleta en modo solo lectura
// - Si el profesional ya existe, no se crea duplicado, solo se usan sus datos
// - Usa las funciones centralizadas de apiWizard.ts
// - Todos los errores tienen botón "✕" para cerrar

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  createEspecialidad,
  createActividadEspecialidad,
  createProfesionalEspecialidad,
  getEspecialidadesPorActividad,
  buscarEspecialidadPorNombre,
  buscarProfesionalPorDocumento,
  registrarPaso2Profesional,
  crearRelacionesProfesionalCentro,
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

interface ProfesionalPendiente {
  documento: string;
  nombre: string;
  email: string;
  whatsapp: string;
  genero: string;
  matricula: string;
  foto: string;
  especialidadNombre: string;
  especialidadDescripcionProfesional: string;
  profesionalId?: number;
  esExistente?: boolean;
}

interface ErrorContextual {
  campo: string;
  mensaje: string;
  id: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const UPLOAD_URL = `${API_BASE_URL}/upload`;
const AVATAR_DEFAULT = 'https://via.placeholder.com/96?text=Sin+foto';

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
  const [profesionalPendiente, setProfesionalPendiente] = useState<ProfesionalPendiente | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const documentoInputRef = useRef<HTMLInputElement>(null);
  
  const [erroresContextuales, setErroresContextuales] = useState<ErrorContextual[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    documento: '',
    nombre: '',
    email: '',
    whatsapp: '',
    genero: '',
    matricula: '',
    foto: '',
    especialidadSeleccionada: '',
    especialidadDescripcionProfesional: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const OPCION_AGREGAR_ESPECIALIDAD = '__AGREGAR_NUEVA_ESPECIALIDAD__';

  const agregarErrorContextual = (campo: string, mensaje: string) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setErroresContextuales(prev => [...prev, { campo, mensaje, id }]);
  };

  const eliminarErrorContextual = (id: string) => {
    setErroresContextuales(prev => prev.filter(e => e.id !== id));
  };

  const limpiarErroresDelCampo = (campo: string) => {
    setErroresContextuales(prev => prev.filter(e => e.campo !== campo));
  };

  const limpiarTodosLosErrores = () => {
    setErroresContextuales([]);
  };

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
        agregarErrorContextual('especialidad', 'No se pudieron cargar las especialidades');
      } finally {
        setCargandoEspecialidades(false);
      }
    };
    
    cargarEspecialidades();
  }, [actividadId]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const documento = formData.documento;
    
    limpiarErroresDelCampo('documento');
    
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
      if (profesionalPendiente?.esExistente) {
        setProfesionalPendiente(null);
      }
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
          
          setProfesionalPendiente(prev => {
            if (prev && !prev.esExistente) {
              return null;
            }
            return prev;
          });
          
          agregarErrorContextual('documento', '✅ Profesional existente. Los datos se cargaron en modo lectura.');
          limpiarErroresDelCampo('documento');
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
          
          if (profesionalPendiente?.esExistente) {
            setProfesionalPendiente(null);
          }
          
          limpiarErroresDelCampo('documento');
        }
      } catch (error) {
        console.error('Error buscando profesional:', error);
        agregarErrorContextual('documento', 'Error al buscar el profesional');
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
    
    limpiarErroresDelCampo(name);
    
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    if (name === 'especialidadSeleccionada') {
      if (value === OPCION_AGREGAR_ESPECIALIDAD) {
        setFormData(prev => ({ ...prev, especialidadSeleccionada: '' }));
        setMostrarModalNuevaEspecialidad(true);
        setNuevaEspecialidadNombre('');
        setNuevaEspecialidadDescripcion('');
        return;
      }
    }
    
    if (profesionalPendiente?.esExistente && ['nombre', 'email', 'whatsapp', 'genero', 'matricula', 'foto'].includes(name)) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsappChange = (value: string) => {
    limpiarErroresDelCampo('whatsapp');
    
    if (profesionalPendiente?.esExistente) return;
    
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
      agregarErrorContextual('foto', 'Solo se permiten imágenes');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      agregarErrorContextual('foto', 'La imagen no debe superar los 2MB');
      return;
    }

    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, foto: url }));
      limpiarErroresDelCampo('foto');
    } catch (err) {
      console.error(err);
      agregarErrorContextual('foto', 'Error al subir la imagen');
    }
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const [mostrarModalNuevaEspecialidad, setMostrarModalNuevaEspecialidad] = useState(false);
  const [nuevaEspecialidadNombre, setNuevaEspecialidadNombre] = useState('');
  const [nuevaEspecialidadDescripcion, setNuevaEspecialidadDescripcion] = useState('');

  const isFormularioValido = (): boolean => {
    const documentoValido = formData.documento.trim().length >= 6;
    const nombreValido = formData.nombre.trim().length >= 3;
    const emailValido = validarEmail(formData.email);
    const whatsappValido = formData.whatsapp && isValidPhoneNumber(formData.whatsapp);
    const generoValido = formData.genero !== '';
    const especialidadValida = formData.especialidadSeleccionada.trim() !== '';
    
    return documentoValido && nombreValido && emailValido && whatsappValido && generoValido && especialidadValida;
  };

  const validarFormulario = (): boolean => {
    const newErrors: ValidationErrors = {};
    let esValido = true;
    
    limpiarTodosLosErrores();
    
    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es obligatorio';
      agregarErrorContextual('documento', 'El documento es obligatorio');
      esValido = false;
    } else if (formData.documento.length < 6) {
      newErrors.documento = 'El documento debe tener al menos 6 caracteres';
      agregarErrorContextual('documento', 'El documento debe tener al menos 6 caracteres');
      esValido = false;
    }
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
      agregarErrorContextual('nombre', 'El nombre es obligatorio');
      esValido = false;
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
      agregarErrorContextual('nombre', 'El nombre debe tener al menos 3 caracteres');
      esValido = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
      agregarErrorContextual('email', 'El email es obligatorio');
      esValido = false;
    } else if (!validarEmail(formData.email)) {
      newErrors.email = 'Email inválido';
      agregarErrorContextual('email', 'Email inválido');
      esValido = false;
    }
    
    if (!formData.whatsapp) {
      newErrors.whatsapp = 'El número de WhatsApp es obligatorio';
      agregarErrorContextual('whatsapp', 'El número de WhatsApp es obligatorio');
      esValido = false;
    } else if (!isValidPhoneNumber(formData.whatsapp)) {
      newErrors.whatsapp = 'Número de WhatsApp inválido';
      agregarErrorContextual('whatsapp', 'Número de WhatsApp inválido');
      esValido = false;
    }
    
    if (!formData.genero) {
      newErrors.genero = 'Seleccioná un género';
      agregarErrorContextual('genero', 'Seleccioná un género');
      esValido = false;
    }
    
    if (!formData.especialidadSeleccionada.trim() && !mostrarModalNuevaEspecialidad) {
      newErrors.especialidad = 'Seleccioná o agregá una especialidad';
      agregarErrorContextual('especialidad', 'Seleccioná o agregá una especialidad');
      esValido = false;
    }
    
    setErrors(newErrors);
    return esValido;
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
      agregarErrorContextual('especialidad', 'El nombre de la especialidad es obligatorio');
      return;
    }
    
    const existente = await buscarEspecialidadPorNombre(nuevaEspecialidadNombre);
    if (existente) {
      agregarErrorContextual('especialidad', 'Ya existe una especialidad con ese nombre');
      return;
    }
    
    setMostrarModalNuevaEspecialidad(false);
    
    setFormData(prev => ({
      ...prev,
      especialidadSeleccionada: nuevaEspecialidadNombre,
      especialidadDescripcionProfesional: nuevaEspecialidadDescripcion,
    }));
    
    setNuevaEspecialidadNombre('');
    setNuevaEspecialidadDescripcion('');
    
    limpiarErroresDelCampo('especialidad');
  };

  const handleEliminarEspecialidad = () => {
    setFormData(prev => ({
      ...prev,
      especialidadSeleccionada: '',
      especialidadDescripcionProfesional: '',
    }));
    setMostrarModalNuevaEspecialidad(false);
    limpiarErroresDelCampo('especialidad');
  };

  const handleAgregarProfesional = () => {
    limpiarTodosLosErrores();
    
    if (!validarFormulario()) {
      return;
    }
    
    if (profesionalPendiente) {
      agregarErrorContextual('general', 'Solo se permite un profesional por negocio. Si necesita más, comuníquese con la ayuda.');
      return;
    }
    
    const phoneData = parsePhoneE164(formData.whatsapp);
    if (!phoneData) {
      agregarErrorContextual('whatsapp', 'El número de WhatsApp no es válido');
      return;
    }
    
    const esExistente = formData.nombre !== '' && formData.email !== '' && formData.whatsapp !== '';
    const profesionalExistente = profesionalPendiente?.esExistente || false;
    
    if (profesionalExistente) {
      return;
    }
    
    setProfesionalPendiente({
      documento: formData.documento,
      nombre: formData.nombre.toUpperCase(),
      email: formData.email.toLowerCase(),
      whatsapp: formData.whatsapp,
      genero: formData.genero,
      matricula: formData.matricula,
      foto: formData.foto,
      especialidadNombre: formData.especialidadSeleccionada,
      especialidadDescripcionProfesional: formData.especialidadDescripcionProfesional,
      esExistente: false,
    });
    
    setFormData({
      documento: '',
      nombre: '',
      email: '',
      whatsapp: '',
      genero: '',
      matricula: '',
      foto: '',
      especialidadSeleccionada: '',
      especialidadDescripcionProfesional: '',
    });
    setErrors({});
    setErroresContextuales([]);
  };

  const handleEliminarProfesional = () => {
    setProfesionalPendiente(null);
    setErroresContextuales([]);
    setTimeout(() => {
      if (documentoInputRef.current) {
        documentoInputRef.current.focus();
      }
    }, 100);
  };

  const handleContinuar = async () => {
    if (!profesionalPendiente) {
      agregarErrorContextual('general', '⚠️ No hay profesional cargado para continuar');
      return;
    }
    
    setEnviando(true);
    setErroresContextuales([]);
    
    try {
      const phoneData = parsePhoneE164(profesionalPendiente.whatsapp);
      if (!phoneData) {
        agregarErrorContextual('general', '❌ El número de WhatsApp no es válido');
        setEnviando(false);
        return;
      }
      
      let profesionalId: number;
      let profesional: any;
      let esProfesionalExistente = false;
      
      const profesionalExistente = await buscarProfesionalPorDocumento(profesionalPendiente.documento);
      
      if (profesionalExistente) {
        profesionalId = profesionalExistente.id;
        profesional = profesionalExistente;
        esProfesionalExistente = true;
        console.log(`✅ Usando profesional existente: ID ${profesionalId}`);
      } else {
        const profesionalData = {
          documento: profesionalPendiente.documento,
          nombre: profesionalPendiente.nombre,
          email: profesionalPendiente.email,
          country_code: phoneData.country_code,
          national_number: phoneData.national_number,
          genero: profesionalPendiente.genero,
          matricula: profesionalPendiente.matricula || undefined,
          foto: profesionalPendiente.foto || undefined,
        };
        
        const resultado = await registrarPaso2Profesional({
          negocioId,
          actividadId,
          profesionalData,
          especialidadNombre: profesionalPendiente.especialidadNombre,
          especialidadDescripcion: profesionalPendiente.especialidadDescripcionProfesional,
        });
        
        onSuccess({
          ...resultado,
          esProfesionalExistente: false,
        });
        
        setEnviando(false);
        return;
      }
      
      // ============================================================
      // Caso: Profesional EXISTENTE
      // ============================================================
      
      let especialidadId: number;
      let especialidadNombre = profesionalPendiente.especialidadNombre;
      
      let especialidadExistente = await buscarEspecialidadPorNombre(especialidadNombre);
      
      if (especialidadExistente) {
        especialidadId = especialidadExistente.id;
      } else {
        const nuevaEspecialidad = await createEspecialidad({
          nombre: especialidadNombre.toUpperCase(),
        });
        especialidadId = nuevaEspecialidad.id;
        
        await createActividadEspecialidad({
          actividadId: actividadId,
          especialidadId: especialidadId,
        });
      }
      
      let profesionalEspecialidad;
      try {
        profesionalEspecialidad = await createProfesionalEspecialidad({
          profesionalId: profesionalId,
          especialidadId: especialidadId,
          descripcion: profesionalPendiente.especialidadDescripcionProfesional || null,
        });
      } catch (error: any) {
        if (error.message?.includes('duplicate') || error.message?.includes('ya existe')) {
          const relaciones = await fetch(`${API_BASE_URL}/profesional-especialidad/por-profesional/${profesionalId}`).then(res => res.json());
          profesionalEspecialidad = relaciones.find((pe: any) => pe.especialidadId === especialidadId && !pe.fecha_baja);
          if (!profesionalEspecialidad) {
            throw new Error('No se pudo obtener la relación existente');
          }
        } else {
          throw error;
        }
      }
      
      const profesionalCentroIds = await crearRelacionesProfesionalCentro(
        profesionalId,
        especialidadId,
        negocioId
      );
      
      const especialidadFinal = especialidadExistente || await buscarEspecialidadPorNombre(especialidadNombre);
      
      onSuccess({
        profesional: profesional,
        especialidad: especialidadFinal!,
        profesionalEspecialidad,
        profesionalCentroIds,
        esProfesionalExistente: true,
      });
      
    } catch (error) {
      console.error('Error al guardar profesional:', error);
      const mensaje = error instanceof Error ? error.message : 'Error al procesar el formulario';
      agregarErrorContextual('general', `❌ ${mensaje}`);
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

  const limiteAlcanzado = profesionalPendiente !== null;
  const formularioValido = isFormularioValido();
  const tieneEspecialidadSeleccionada = formData.especialidadSeleccionada.trim() !== '';
  const esProfesionalExistente = profesionalPendiente?.esExistente || false;

  const obtenerFoto = (foto: string | undefined): string => {
    return foto || AVATAR_DEFAULT;
  };

  const renderizarErroresContextuales = (campo: string) => {
    const errores = erroresContextuales.filter(e => e.campo === campo);
    if (errores.length === 0) return null;
    
    return (
      <div className={styles.erroresContextuales}>
        {errores.map(error => (
          <div key={error.id} className={styles.errorContextual}>
            <span>{error.mensaje}</span>
            <button
              type="button"
              onClick={() => eliminarErrorContextual(error.id)}
              className={styles.errorCerrar}
              aria-label="Cerrar error"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles['wizard-container-page']}>
      <div className={styles['wizard-left']}>
        <div className={styles['wizard-left-content']}>
          <div className={styles['wizard-card']}>
            <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
              <h2 className={styles.title}>Paso 2: Datos del Profesional</h2>
              <p className={styles.subtitle}>Cargá el profesional que atenderá en tu negocio</p>
              
              {renderizarErroresContextuales('general')}
              
              {profesionalPendiente && (
                <div className={styles.tarjetaProfesionalResumen}>
                  <div className={styles.tarjetaProfesionalHeader}>
                    <img 
                      src={obtenerFoto(profesionalPendiente.foto)}
                      alt={profesionalPendiente.nombre}
                      className={styles.tarjetaProfesionalFoto}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = AVATAR_DEFAULT;
                      }}
                    />
                    <div className={styles.tarjetaProfesionalDatos}>
                      <div className={styles.tarjetaProfesionalNombre}>
                        {profesionalPendiente.nombre}
                        {esProfesionalExistente && (
                          <span className={styles.badgeExistente}>✅ Existente</span>
                        )}
                      </div>
                      <div className={styles.tarjetaProfesionalInfo}>
                        📄 Documento: {profesionalPendiente.documento}
                      </div>
                      <div className={styles.tarjetaProfesionalInfo}>
                        📧 Email: {profesionalPendiente.email}
                      </div>
                      <div className={styles.tarjetaProfesionalInfo}>
                        📱 WhatsApp: {profesionalPendiente.whatsapp}
                      </div>
                      <div className={styles.tarjetaProfesionalEspecialidad}>
                        Especialidad: {profesionalPendiente.especialidadNombre}
                      </div>
                      {profesionalPendiente.especialidadDescripcionProfesional && (
                        <div className={styles.tarjetaProfesionalDescripcion}>
                          📝 {profesionalPendiente.especialidadDescripcionProfesional}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleEliminarProfesional}
                      className={styles.tarjetaProfesionalEliminar}
                      title="Eliminar profesional"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              )}
              
              {limiteAlcanzado && (
                <div className={styles.direccionConfirmada} style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b', color: '#92400e', marginBottom: '16px' }}>
                  ⚠️ Límite de profesionales alcanzado. Solo se permite un profesional por negocio. Si necesita más, comuníquese con la ayuda.
                </div>
              )}
              
              {!limiteAlcanzado && (
                <>
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
                        disabled={esProfesionalExistente}
                      />
                      {buscandoProfesional && (
                        <span className={styles.helperText}>Buscando profesional...</span>
                      )}
                      {renderizarErroresContextuales('documento')}
                      {errors.documento && (
                        <span className={styles.errorText}>{errors.documento}</span>
                      )}
                      {esProfesionalExistente && (
                        <span className={styles.helperText} style={{ color: '#10b981' }}>
                          ✅ Profesional existente - Los datos están en modo lectura
                        </span>
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
                        disabled={esProfesionalExistente}
                        readOnly={esProfesionalExistente}
                      />
                      {renderizarErroresContextuales('nombre')}
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
                        disabled={esProfesionalExistente}
                        readOnly={esProfesionalExistente}
                      />
                      {renderizarErroresContextuales('email')}
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
                        disabled={esProfesionalExistente}
                      />
                      {renderizarErroresContextuales('whatsapp')}
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
                        disabled={esProfesionalExistente}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="X">No binario</option>
                      </select>
                      {renderizarErroresContextuales('genero')}
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
                        disabled={esProfesionalExistente}
                        readOnly={esProfesionalExistente}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Foto</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.input}
                        disabled={uploading || esProfesionalExistente}
                      />
                      {uploading && <span className={styles.helperText}>Subiendo imagen...</span>}
                      {renderizarErroresContextuales('foto')}
                      {errors.foto && (
                        <span className={styles.errorText}>{errors.foto}</span>
                      )}
                      {formData.foto && !esProfesionalExistente && (
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
                      {formData.foto && esProfesionalExistente && (
                        <div className={styles.fotoPreview}>
                          <img 
                            src={formData.foto} 
                            alt="Foto del profesional" 
                            className={styles.fotoPreviewImg}
                          />
                          <span className={styles.helperText} style={{ color: '#6b7280' }}>
                            Foto existente (solo lectura)
                          </span>
                        </div>
                      )}
                    </div>
                  </fieldset>
                  
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>Especialidad</legend>
                    
                    {cargandoEspecialidades ? (
                      <div className={styles.helperText}>Cargando especialidades...</div>
                    ) : (
                      <>
                        {!tieneEspecialidadSeleccionada ? (
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
                                disabled={esProfesionalExistente}
                              >
                                <option value="">Seleccionar especialidad...</option>
                                {opcionesEspecialidades()}
                              </select>
                              {renderizarErroresContextuales('especialidad')}
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
                                disabled={esProfesionalExistente}
                              />
                              <span className={styles.helperText}>
                                Esta descripción se mostrará al cliente al momento de reservar el turno.
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className={styles.resumenEspecialidadSeleccionada}>
                            <div className={styles.resumenEspecialidadHeader}>
                              <div>
                                <strong>Especialidad seleccionada:</strong> {formData.especialidadSeleccionada}
                                {formData.especialidadDescripcionProfesional && (
                                  <div className={styles.resumenEspecialidadDescripcion}>
                                    {formData.especialidadDescripcionProfesional}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={handleEliminarEspecialidad}
                                className={styles.buttonEliminar}
                                title="Eliminar especialidad"
                                style={{ marginLeft: 'auto' }}
                                disabled={esProfesionalExistente}
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {mostrarModalNuevaEspecialidad && !esProfesionalExistente && (
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
                                placeholder="Ej: Rama de la medicina que estudia el corazón"
                                rows={2}
                              />
                              <span className={styles.helperText}>
                                Esta descripción se guardará para este profesional y se mostrará al cliente.
                              </span>
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
                      type="button"
                      onClick={handleAgregarProfesional}
                      disabled={enviando || limiteAlcanzado || !formularioValido || esProfesionalExistente}
                      className={styles.buttonPrimary}
                    >
                      Agregar
                    </button>
                  </div>
                </>
              )}
              
              {limiteAlcanzado && (
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
                    type="button"
                    onClick={handleContinuar}
                    disabled={enviando}
                    className={styles.buttonPrimary}
                  >
                    {enviando ? 'Guardando...' : 'Continuar al Paso 3'}
                  </button>
                </div>
              )}
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
