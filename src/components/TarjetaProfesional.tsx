import { useState } from 'react';
import styles from '../styles/Agenda.module.css';

interface ProfesionalSlots {
  profesionalId: number;
  nombre: string;
  documento: string;
  foto?: string;
  especialidadId: number;
  centroId: number;
  profesionalCentroId: number;
  descripcion?: string;
  slots: string[];
}

interface TarjetaProfesionalProps {
  profesional: ProfesionalSlots;
  onSlotSeleccionado: (hora: string) => void;
  fechaSeleccionada?: string;
  formatearFechaCorta?: (fecha: string) => string;
  especialidadNombre?: string;
  centroNombre?: string;
  centroTimezone?: string;  // 🔹 NUEVO: zona horaria del centro
}

// 🔹 Función para formatear timezone de forma amigable
const formatearTimezone = (tz: string | undefined): string => {
  if (!tz) return '';
  const parts = tz.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const region = parts.length > 1 ? parts[parts.length - 2] : '';
  if (region && region !== city) {
    return `${city} (${region})`;
  }
  return `${city}`;
};

export default function TarjetaProfesional({ 
  profesional, 
  onSlotSeleccionado, 
  fechaSeleccionada,
  formatearFechaCorta,
  especialidadNombre,
  centroNombre,
  centroTimezone  // 🔹 NUEVO
}: TarjetaProfesionalProps) {
  const [verTodos, setVerTodos] = useState(false);
  const slotsMostrar = verTodos ? profesional.slots : profesional.slots.slice(0, 7);
  const hayMas = profesional.slots.length > 7;

  const fotoUrl = profesional.foto || 'https://via.placeholder.com/80?text=Sin+foto';

  // 🔹 Texto de zona horaria para mostrar
  const timezoneText = centroTimezone ? formatearTimezone(centroTimezone) : '';

  return (
    <div className={styles['tarjeta-profesional']}>
      <div className={styles['profesional-info']}>
        <img 
          src={fotoUrl} 
          alt={profesional.nombre}
          className={styles['profesional-foto']}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Sin+foto'; }}
        />
        <div className={styles['profesional-datos']}>
  <div className={styles['profesional-nombre']}>{profesional.nombre}</div>
  
  {centroNombre && (
    <div className={styles['profesional-centro']} style={{ fontSize: '14px', color: '#555', marginTop: '4px' }}>
      Centro: {centroNombre}
    </div>
  )}
  
  {centroNombre && timezoneText && (
    <div className={styles['profesional-timezone']} style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
      🕒 Zona horaria: {timezoneText}
    </div>
  )}
  
  {especialidadNombre && (
    <div className={styles['profesional-especialidad']} style={{ fontSize: '13px', color: '#444', marginTop: '8px' }}>
      Especialidad: {especialidadNombre}
    </div>
  )}
  
  {profesional.descripcion && (
    <div className={styles['profesional-descripcion']} style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
      {profesional.descripcion}
    </div>
  )}
</div>
      </div>

      {/* Título de fecha debajo de la foto y descripción */}
      {fechaSeleccionada && formatearFechaCorta && (
        <div className={styles['fecha-dentro-tarjeta']}>
          {formatearFechaCorta(fechaSeleccionada)} - Horarios Disponibles
        </div>
      )}

      <div className={styles['slots-container']}>
        <div className={styles['slots-grid']}>
          {slotsMostrar.map((hora) => (
            <button
              key={hora}
              onClick={() => onSlotSeleccionado(hora)}
              className={styles['slot-boton']}
            >
              {hora}
            </button>
          ))}
        </div>
        {hayMas && (
          <button 
            onClick={() => setVerTodos(!verTodos)}
            className={styles['ver-mas-btn']}
          >
            {verTodos ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>
    </div>
  );
}
