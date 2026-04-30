import styles from '../styles/Agenda.module.css';

interface DiaDisponible {
  fecha: string;
  diaSemana: number;
  disponible: boolean;
}

interface CarruselDiasProps {
  dias: DiaDisponible[];
  selectedFecha: string | null;
  onDiaSeleccionado: (fecha: string) => void;
}

// Nombres de días en español (corto)
const nombresDias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// Formatear fecha para mostrar: "JUE 30 ABR"
const formatearFecha = (fechaStr: string): string => {
  const fecha = new Date(fechaStr);
  const diaSemana = nombresDias[fecha.getDay()];
  const dia = fecha.getDate();
  const mes = fecha.toLocaleString('es-AR', { month: 'short' }).toUpperCase();
  return `${diaSemana} ${dia} ${mes}`;
};

export default function CarruselDias({ dias, selectedFecha, onDiaSeleccionado }: CarruselDiasProps) {
  return (
    <div className={styles['carrusel-container']}>
      <div className={styles['carrusel']}>
        {dias.map((dia) => {
          const fechaFormateada = formatearFecha(dia.fecha);
          const isSelected = selectedFecha === dia.fecha;
          const isDisabled = !dia.disponible;
          
          return (
            <button
              key={dia.fecha}
              onClick={() => !isDisabled && onDiaSeleccionado(dia.fecha)}
              className={`${styles['dia-boton']} 
                ${isDisabled ? styles['dia-deshabilitado'] : styles['dia-habilitado']}
                ${isSelected ? styles['dia-seleccionado'] : ''}
              `}
              disabled={isDisabled}
              title={isDisabled ? 'No hay turnos disponibles' : `Ver turnos para ${fechaFormateada}`}
            >
              {fechaFormateada}
            </button>
          );
        })}
      </div>
    </div>
  );
}
