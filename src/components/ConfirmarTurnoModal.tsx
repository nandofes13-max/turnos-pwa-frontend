// src/components/ConfirmarTurnoModal.tsx
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styles from '../styles/ConfirmarTurnoModal.module.css';

// ============================================================
// INTERFACES
// ============================================================

interface DatosSlot {
  profesionalNombre: string;
  fecha: string;           // YYYY-MM-DD
  hora: string;            // HH:MM
  centroNombre: string;
  especialidadNombre: string;
  centroId: number;
  profesionalCentroId: number;
  especialidadId: number;
  negocioId?: number;      // Se obtiene del centro
}

interface DatosUsuario {
  email: string;
  nombre: string;
  apellido: string;
  whatsapp: string;
}

interface ConfirmarTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  datosSlot: DatosSlot;
  onReservaExitosa?: () => void;  // Callback opcional después de reservar
}

// URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ConfirmarTurnoModal({ 
  isOpen, 
  onClose, 
  datosSlot,
  onReservaExitosa 
}: ConfirmarTurnoModalProps) {
  // Estados para las vistas
  const [vista, setVista] = useState<'confirmacion' | 'datos' | 'exito'>('confirmacion');
  
  // Estados para datos del usuario
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario>({
    email: '',
    nombre: '',
    apellido: '',
    whatsapp: ''
  });
  
  // Estados para carga y errores
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnoCreado, setTurnoCreado] = useState<{ id: number; fecha: string; hora: string } | null>(null);
  
  // Estado para negocioId (obtenido del centro)
  const [negocioId, setNegocioId] = useState<number | null>(null);

  // Formatear fecha para mostrar (ej: "Lun 19/05/2026")
  const formatearFechaMostrar = (fechaStr: string): string => {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const diasSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const diaSemana = diasSemana[fecha.getDay()];
    return `${diaSemana} ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  };

  // Obtener negocioId desde el centro al abrir el modal
  useEffect(() => {
    if (isOpen && datosSlot.centroId && !negocioId) {
      const obtenerNegocioId = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/centros/${datosSlot.centroId}`);
          if (response.ok) {
            const centro = await response.json();
            setNegocioId(centro.negocioId);
          } else {
            console.error('Error al obtener el centro');
          }
        } catch (error) {
          console.error('Error fetching centro:', error);
        }
      };
      obtenerNegocioId();
    }
  }, [isOpen, datosSlot.centroId, negocioId]);

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Pequeño timeout para evitar que se vea el reset
      setTimeout(() => {
        setVista('confirmacion');
        setDatosUsuario({ email: '', nombre: '', apellido: '', whatsapp: '' });
        setError(null);
        setTurnoCreado(null);
        setCargando(false);
      }, 300);
    }
  }, [isOpen]);

  // ============================================================
  // VISTA 1: Confirmar turno (resumen)
  // ============================================================
  const handleConfirmarVista1 = () => {
    setVista('datos');
  };

  // ============================================================
  // VISTA 2: Enviar datos al backend
  // ============================================================
  const handleConfirmarVista2 = async () => {
    // Validar campos
    if (!datosUsuario.email || !datosUsuario.email.includes('@')) {
      setError('Ingresá un email válido');
      return;
    }
    if (!datosUsuario.nombre.trim()) {
      setError('Ingresá tu nombre');
      return;
    }
    if (!datosUsuario.apellido.trim()) {
      setError('Ingresá tu apellido');
      return;
    }
    if (!datosUsuario.whatsapp.trim()) {
      setError('Ingresá tu número de WhatsApp');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      // Calcular horaFin (horaInicio + duración del turno)
      // Por ahora usamos duración fija de 30 minutos
      const duracionMinutos = 30;
      const [hora, minuto] = datosSlot.hora.split(':').map(Number);
      let minutosTotales = hora * 60 + minuto + duracionMinutos;
      let horaFinHora = Math.floor(minutosTotales / 60);
      let horaFinMinuto = minutosTotales % 60;
      const horaFin = `${horaFinHora.toString().padStart(2, '0')}:${horaFinMinuto.toString().padStart(2, '0')}`;

      const body = {
        negocioId: negocioId,
        centroId: datosSlot.centroId,
        profesionalCentroId: datosSlot.profesionalCentroId,
        especialidadId: datosSlot.especialidadId,
        fechaTurno: datosSlot.fecha,
        horaInicio: datosSlot.hora,
        horaFin: horaFin,
        duracionMinutos: duracionMinutos,
        email: datosUsuario.email,
        nombre: datosUsuario.nombre,
        apellido: datosUsuario.apellido,
        telefono: datosUsuario.whatsapp,
        // Precio opcional (no se usa por ahora)
        precioReserva: null,
        moneda: null
      };

      console.log('Enviando turno:', body);

      const response = await fetch(`${API_BASE_URL}/turnos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al reservar el turno');
      }

      // Reserva exitosa
      setTurnoCreado({
        id: data.turno.id,
        fecha: datosSlot.fecha,
        hora: datosSlot.hora
      });
      
      setVista('exito');
      
      if (onReservaExitosa) {
        onReservaExitosa();
      }
      
    } catch (err: any) {
      console.error('Error al reservar:', err);
      setError(err.message || 'Ocurrió un error. Por favor, intentá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // ============================================================
  // VISTA 3: Éxito - Volver al inicio
  // ============================================================
  const handleVolverInicio = () => {
    window.location.href = '/';
  };

  // ============================================================
  // RENDERIZADO DE VISTAS
  // ============================================================

  // VISTA 1: Confirmación inicial
  const renderVistaConfirmacion = () => (
    <div className={styles['modal-content']}>
      <button className={styles['modal-close']} onClick={onClose}>✕</button>
      
      <h2 className={styles['modal-titulo']}>Turno seleccionado</h2>
      
      <div className={styles['detalle-turno']}>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Profesional:</span>
          <span className={styles['detalle-valor']}>{datosSlot.profesionalNombre}</span>
        </div>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Fecha y hora:</span>
          <span className={styles['detalle-valor']}>
            {formatearFechaMostrar(datosSlot.fecha)} {datosSlot.hora}
          </span>
        </div>
      </div>

      <div className={styles['modal-botones']}>
        <button className={styles['btn-volver']} onClick={onClose}>
          Volver
        </button>
        <button className={styles['btn-confirmar']} onClick={handleConfirmarVista1}>
          Confirmar
        </button>
      </div>
    </div>
  );

  // VISTA 2: Datos del usuario
  const renderVistaDatos = () => (
    <div className={styles['modal-content']}>
      <button className={styles['modal-close']} onClick={onClose}>✕</button>
      
      <h2 className={styles['modal-titulo']}>Detalles de la consulta</h2>
      
      <div className={styles['detalle-turno']}>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Profesional</span>
          <span className={styles['detalle-valor']}>{datosSlot.profesionalNombre}</span>
        </div>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Fecha</span>
          <span className={styles['detalle-valor']}>{formatearFechaMostrar(datosSlot.fecha)}</span>
        </div>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Hora</span>
          <span className={styles['detalle-valor']}>{datosSlot.hora}hs</span>
        </div>
      </div>

      <div className={styles['formulario-datos']}>
        <div className={styles['campo-formulario']}>
          <label className={styles['campo-label']}>Email *</label>
          <input
            type="email"
            className={styles['campo-input']}
            value={datosUsuario.email}
            onChange={(e) => setDatosUsuario({ ...datosUsuario, email: e.target.value })}
            placeholder="tuemail@ejemplo.com"
            disabled={cargando}
          />
        </div>
        
        <div className={styles['campo-formulario']}>
          <label className={styles['campo-label']}>Nombre *</label>
          <input
            type="text"
            className={styles['campo-input']}
            value={datosUsuario.nombre}
            onChange={(e) => setDatosUsuario({ ...datosUsuario, nombre: e.target.value })}
            placeholder="Tu nombre"
            disabled={cargando}
          />
        </div>
        
        <div className={styles['campo-formulario']}>
          <label className={styles['campo-label']}>Apellido *</label>
          <input
            type="text"
            className={styles['campo-input']}
            value={datosUsuario.apellido}
            onChange={(e) => setDatosUsuario({ ...datosUsuario, apellido: e.target.value })}
            placeholder="Tu apellido"
            disabled={cargando}
          />
        </div>
        
        <div className={styles['campo-formulario']}>
          <label className={styles['campo-label']}>WhatsApp *</label>
          <input
            type="tel"
            className={styles['campo-input']}
            value={datosUsuario.whatsapp}
            onChange={(e) => setDatosUsuario({ ...datosUsuario, whatsapp: e.target.value })}
            placeholder="+5491112345678"
            disabled={cargando}
          />
        </div>
      </div>

      {error && (
        <div className={styles['mensaje-error']}>
          {error}
        </div>
      )}

      <div className={styles['modal-botones']}>
        <button 
          className={styles['btn-volver']} 
          onClick={() => setVista('confirmacion')}
          disabled={cargando}
        >
          Volver
        </button>
        <button 
          className={styles['btn-confirmar']} 
          onClick={handleConfirmarVista2}
          disabled={cargando}
        >
          {cargando ? 'Reservando...' : 'Agendar turno'}
        </button>
      </div>
    </div>
  );

  // VISTA 3: Éxito
  const renderVistaExito = () => (
    <div className={styles['modal-content']}>
      <h2 className={styles['modal-titulo-exito']}>✅ ¡Turno reservado!</h2>
      
      <div className={styles['detalle-turno']}>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Profesional</span>
          <span className={styles['detalle-valor']}>{datosSlot.profesionalNombre}</span>
        </div>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Fecha</span>
          <span className={styles['detalle-valor']}>{formatearFechaMostrar(datosSlot.fecha)}</span>
        </div>
        <div className={styles['detalle-linea']}>
          <span className={styles['detalle-label']}>Hora</span>
          <span className={styles['detalle-valor']}>{datosSlot.hora}hs</span>
        </div>
      </div>

      <div className={styles['mensaje-exito']}>
        📧 Te enviamos la confirmación a tu email
      </div>

      <div className={styles['modal-botones']}>
        <button className={styles['btn-inicio']} onClick={handleVolverInicio}>
          Volver al inicio
        </button>
      </div>
    </div>
  );

  // Seleccionar vista según estado
  const renderVista = () => {
    switch (vista) {
      case 'confirmacion':
        return renderVistaConfirmacion();
      case 'datos':
        return renderVistaDatos();
      case 'exito':
        return renderVistaExito();
      default:
        return renderVistaConfirmacion();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles['modal']}
      overlayClassName={styles['modal-overlay']}
      ariaHideApp={false}
    >
      {renderVista()}
    </Modal>
  );
}
