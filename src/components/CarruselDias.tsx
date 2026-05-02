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
  // Extraer año, mes, día directamente del string "YYYY-MM-DD"
  const [year, month, day] = fechaStr.split('-').map(Number);
  
  // Crear fecha en UTC para evitar problemas de zona horaria
  const fecha = new Date(Date.UTC(year, month - 1, day));
  
  const diaSemana = nombresDias[fecha.getUTCDay()];
  const dia = day;
  const mes = nombresMeses[month - 1];
  
  return { diaSemana, dia, mes };
};

export default function CarruselDias({ dias, selectedFecha, onDiaSeleccionado }: CarruselDiasProps) {
  // Log para depurar los valores de disponibilidad
  console.log('=== CarruselDias - días disponibles ===');
  dias.forEach(dia => {
    console.log(`Fecha: ${dia.fecha}, disponible: ${dia.disponible}, diaSemana: ${dia.diaSemana}`);
  });
  
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
