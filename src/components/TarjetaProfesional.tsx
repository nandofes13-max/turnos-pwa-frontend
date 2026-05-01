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
}

export default function TarjetaProfesional({ 
  profesional, 
  onSlotSeleccionado, 
  fechaSeleccionada,
  formatearFechaCorta 
}: TarjetaProfesionalProps) {
  const [verTodos, setVerTodos] = useState(false);
  const slotsMostrar = verTodos ? profesional.slots : profesional.slots.slice(0, 6);
  const hayMas = profesional.slots.length > 6;

  const fotoUrl = profesional.foto || 'https://via.placeholder.com/80?text=Sin+foto';

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
          {profesional.descripcion && (
            <div className={styles['profesional-descripcion']}>{profesional.descripcion}</div>
          )}
        </div>
      </div>

      {/* Título de fecha debajo de la foto y descripción */}
      {fechaSeleccionada && formatearFechaCorta && (
        <div className={styles['fecha-dentro-tarjeta']}>
          📅 {formatearFechaCorta(fechaSeleccionada)} - Horarios Disponibles
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
  );  );
}
