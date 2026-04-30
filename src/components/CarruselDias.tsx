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
const nombresMeses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const formatearDiaVertical = (fechaStr: string) => {
  const fecha = new Date(fechaStr);
  const diaSemana = nombresDias[fecha.getDay()];
  const dia = fecha.getDate();
  const mes = nombresMeses[fecha.getMonth()];
  return { diaSemana, dia, mes };
};

export default function CarruselDias({ dias, selectedFecha, onDiaSeleccionado }: CarruselDiasProps) {
  return (
    <div className={styles['carrusel-vertical-container']}>
      <div className={styles['carrusel-vertical']}>
        {dias.map((dia) => {
          const { diaSemana, dia: diaNum, mes } = formatearDiaVertical(dia.fecha);
          const isSelected = selectedFecha === dia.fecha;
          const isDisabled = !dia.disponible;
          
          return (
            <button
              key={dia.fecha}
              onClick={() => !isDisabled && onDiaSeleccionado(dia.fecha)}
              className={`${styles['dia-vertical-boton']} 
                ${isDisabled ? styles['dia-vertical-deshabilitado'] : styles['dia-vertical-habilitado']}
                ${isSelected ? styles['dia-vertical-seleccionado'] : ''}
              `}
              disabled={isDisabled}
              title={isDisabled ? 'No hay turnos disponibles' : `Ver turnos para ${dia.fecha}`}
            >
              <span className={styles['dia-vertical-semana']}>{diaSemana}</span>
              <span className={styles['dia-vertical-numero']}>{diaNum}</span>
              <span className={styles['dia-vertical-mes']}>{mes}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
