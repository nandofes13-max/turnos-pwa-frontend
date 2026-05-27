import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAutoCompletadoUsuario } from '../hooks/useAutoCompletadoUsuario';
import styles from '../styles/ConfirmarTurnoModal.module.css';

interface SolicitarServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
  nombre: string;
  apellido: string;
  whatsapp: string;
  mensaje: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validarWhatsApp = (whatsapp: string | undefined): boolean => {
  if (!whatsapp) return false;
  return isValidPhoneNumber(whatsapp);
};

export default function SolicitarServicioModal({ isOpen, onClose }: SolicitarServicioModalProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    nombre: '',
    apellido: '',
    whatsapp: '',
    mensaje: '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // ✅ Usar el hook reutilizable
  const { buscando, usuarioData, buscarPorEmail, upsertUsuario } = useAutoCompletadoUsuario();

  // ✅ Cuando se encuentran datos del usuario, precargar en el formulario
  useEffect(() => {
    if (usuarioData) {
      setFormData(prev => ({
        ...prev,
        nombre: usuarioData.nombre || '',
        apellido: usuarioData.apellido || '',
        whatsapp: usuarioData.telefono || ''
      }));
    }
  }, [usuarioData]);

  const formularioValido = () => {
    return (
      validarEmail(formData.email) &&
      formData.nombre.trim().length > 0 &&
      formData.apellido.trim().length > 0 &&
      validarWhatsApp(formData.whatsapp) &&
      formData.mensaje.trim().length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioValido()) return;

    setCargando(true);
    setError(null);

    try {
      // ✅ Si el usuario no existe (no se encontró al buscar), crearlo con upsert
      if (!usuarioData) {
        await upsertUsuario({
          email: formData.email.toLowerCase(),
          nombre: formData.nombre.toUpperCase(),
          apellido: formData.apellido.toUpperCase(),
          telefono: formData.whatsapp,
        });
      }

      // Enviar la solicitud
      const response = await fetch(`${API_BASE_URL}/solicitudes/servicio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          nombre: formData.nombre.toUpperCase(),
          apellido: formData.apellido.toUpperCase(),
          whatsapp: formData.whatsapp,
          mensaje: formData.mensaje,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar la solicitud');
      }

      setExito(true);
    } catch (err: any) {
      console.error('Error al enviar solicitud:', err);
      setError(err.message || 'Ocurrió un error. Por favor, intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const handleClose = () => {
    if (!cargando) {
      onClose();
      setTimeout(() => {
        setError(null);
        setExito(false);
        setFormData({ email: '', nombre: '', apellido: '', whatsapp: '', mensaje: '' });
      }, 300);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className={styles['modal']}
      overlayClassName={styles['modal-overlay']}
      ariaHideApp={false}
    >
      <div className={styles['modal-content']}>
        <button className={styles['modal-close']} onClick={handleClose}>✕</button>
        
        <h2 className={styles['modal-titulo']}>
          {exito ? '✅ ¡Solicitud enviada!' : 'Solicitar actividad / servicio'}
        </h2>

        {!exito ? (
          <form onSubmit={handleSubmit}>
            <div className={styles['formulario-datos']}>
              {/* ✅ Campo destacado - PRIMERO */}
              <div className={`${styles['campo-formulario']} ${styles['campo-destacado']}`}>
                <label className={styles['campo-label-destacado']}>
                  📝 ¿Qué actividad/servicio necesitas? *
                </label>
                <textarea
                  className={styles['campo-textarea-destacado']}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Ej: Clases de Pilates, Tatuajes, Centro de Estética, etc."
                  rows={4}
                  disabled={cargando}
                  required
                />
              </div>

              <div className={styles['campo-formulario']}>
                <label className={styles['campo-label']}>Email *</label>
                <input
                  type="email"
                  className={`${styles['campo-input']} ${formData.email && !validarEmail(formData.email) ? styles['campo-input-error'] : ''}`}
                  value={formData.email}
                  onChange={(e) => {
                    const nuevoEmail = e.target.value;
                    setFormData({ ...formData, email: nuevoEmail });
                    buscarPorEmail(nuevoEmail);
                  }}
                  placeholder="tuemail@ejemplo.com"
                  disabled={cargando}
                  required
                />
                {formData.email && !validarEmail(formData.email) && (
                  <small className={styles['campo-error-texto']}>Email inválido</small>
                )}
                {buscando && (
                  <small className={styles['campo-ayuda']}>Buscando usuario...</small>
                )}
              </div>

              <div className={styles['campo-formulario']}>
                <label className={styles['campo-label']}>Nombre *</label>
                <input
                  type="text"
                  className={styles['campo-input']}
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  placeholder="Tu nombre"
                  disabled={cargando}
                  required
                />
              </div>

              <div className={styles['campo-formulario']}>
                <label className={styles['campo-label']}>Apellido *</label>
                <input
                  type="text"
                  className={styles['campo-input']}
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value.toUpperCase() })}
                  placeholder="Tu apellido"
                  disabled={cargando}
                  required
                />
              </div>

              <div className={styles['campo-formulario']}>
                <label className={styles['campo-label']}>WhatsApp *</label>
                <PhoneInput
                  international
                  defaultCountry="AR"
                  value={formData.whatsapp}
                  onChange={(value) => setFormData({ ...formData, whatsapp: value || '' })}
                  className={styles['campo-phone-input']}
                  limitMaxLength={true}
                  disabled={cargando}
                />
                <small className={styles['campo-ayuda']}>Ej: +54 9 11 5833 2657</small>
                {formData.whatsapp && !validarWhatsApp(formData.whatsapp) && (
                  <small className={styles['campo-error-texto']}>Número de WhatsApp inválido</small>
                )}
              </div>
            </div>

            {error && (
              <div className={styles['mensaje-error']}>
                {error}
              </div>
            )}

            <div className={styles['modal-botones']}>
              <button 
                type="button"
                className={styles['btn-volver']} 
                onClick={handleClose}
                disabled={cargando}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className={styles['btn-confirmar']} 
                disabled={cargando || !formularioValido()}
              >
                {cargando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles['modal-botones']}>
            <button className={styles['btn-inicio']} onClick={handleClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
