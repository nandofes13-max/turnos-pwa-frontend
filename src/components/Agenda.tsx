import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import CarruselDias from './CarruselDias';
import TarjetaProfesional from './TarjetaProfesional';
import styles from '../styles/Agenda.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface DiaDisponible {
  fecha: string;
  diaSemana: number;
  disponible: boolean;
}

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

export default function Agenda() {
  const navigate = useNavigate();
  const { actividadId, especialidadId, centroId } = useParams();
  const location = useLocation();
  const { actividadNombre, especialidadNombre, centroNombre } = location.state || {
    actividadNombre: 'Actividad',
    especialidadNombre: 'Especialidad',
    centroNombre: 'Centro'
  };

  const [dias, setDias] = useState<DiaDisponible[]>([]);
  const [profesionales, setProfesionales] = useState<ProfesionalSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  const [cargandoProfesionales, setCargandoProfesionales] = useState(false);

  // Generar rango de 30 días desde hoy
  const generarRangoFechas = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = hoy.toISOString().split('T')[0];
    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + 30);
    return { desde, hasta: hasta.toISOString().split('T')[0] };
  };

  // Formatear fecha como "Dom 03/05/26"
  const formatearFechaCorta = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const diaSemana = fecha.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase().replace('.', '');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear().toString().slice(-2);
    return `${diaSemana} ${dia}/${mes}/${anio}`;
  };

  // Cargar días disponibles al montar el componente
  useEffect(() => {
    const cargarDias = async () => {
      try {
        setLoading(true);
        const { desde, hasta } = generarRangoFechas();
        const response = await fetch(
          `${API_BASE_URL}/agenda-publica/dias-disponibles?centroId=${centroId}&especialidadId=${especialidadId}&desde=${desde}&hasta=${hasta}`
        );
        
        if (!response.ok) {
          throw new Error('Error al cargar los días');
        }
        
        const data = await response.json();
        setDias(data);
        
        // Seleccionar el primer día disponible (desde hoy hacia adelante)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const primerDiaDisponible = data.find((d: DiaDisponible) => {
          const fechaDia = new Date(d.fecha);
          return d.disponible === true && fechaDia >= hoy;
        });
        
        if (primerDiaDisponible) {
          setSelectedFecha(primerDiaDisponible.fecha);
        } else {
          setSelectedFecha(null);
        }
      } catch (error) {
        console.error('Error cargando días:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDias();
  }, [centroId, especialidadId]);

  // Cargar profesionales y slots cuando cambia la fecha seleccionada
  useEffect(() => {
    const cargarProfesionales = async () => {
      if (!selectedFecha) return;
      
      try {
        setCargandoProfesionales(true);
        const response = await fetch(
          `${API_BASE_URL}/agenda-publica/profesionales-slots?centroId=${centroId}&especialidadId=${especialidadId}&fecha=${selectedFecha}`
        );
        
        if (!response.ok) {
          throw new Error('Error al cargar profesionales');
        }
        
        const data = await response.json();
        setProfesionales(data);
      } catch (error) {
        console.error('Error cargando profesionales:', error);
        setProfesionales([]);
      } finally {
        setCargandoProfesionales(false);
      }
    };

    cargarProfesionales();
  }, [selectedFecha, centroId, especialidadId]);

  const handleDiaSeleccionado = (fecha: string) => {
    setSelectedFecha(fecha);
  };

  const handleSlotSeleccionado = (profesional: ProfesionalSlots, hora: string) => {
    alert(`Turno seleccionado: ${profesional.nombre} - ${selectedFecha} a las ${hora}`);
    // Aquí después navegará a la pantalla de confirmación
  };

  if (loading) {
    return (
      <div className={inicioStyles['inicio-container']}>
        <div className={inicioStyles['inicio-left']}>
          <div className={inicioStyles['inicio-left-content']}>
            <div className={inicioStyles['inicio-card']}>
              <h1 className={inicioStyles['inicio-titulo']}>Cargando agenda...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={inicioStyles['inicio-container']}>
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          
          {/* Logo móvil */}
          <div className={inicioStyles['inicio-logo-mobile']}>
            <a href="/">
              <img 
                src="/1000133565.png" 
                alt="PWA Turnos" 
                className={inicioStyles['inicio-logo-mobile-img']}
              />
            </a>
          </div>

          <div className={inicioStyles['inicio-card']}>
            {/* Breadcrumb */}
            <Breadcrumb items={[
              { label: 'Actividad', path: '/actividad' },
              { label: 'Especialidad', path: `/actividad/${actividadId}/especialidad` },
              { label: 'Centro', path: `/actividad/${actividadId}/especialidad/${especialidadId}/centro` },
              { label: 'Agenda' }
            ]} />

            <div className={styles['seleccion-info']}>
              Has seleccionado: <strong>{actividadNombre}</strong> &gt; <strong>{especialidadNombre}</strong> &gt; <strong>{centroNombre}</strong>
            </div>

            <h1 className={inicioStyles['inicio-titulo']}>Elige horario y profesional</h1>
            
            {/* Carrusel vertical de días */}
            <CarruselDias 
              dias={dias}
              selectedFecha={selectedFecha}
              onDiaSeleccionado={handleDiaSeleccionado}
            />

            {/* Lista de profesionales y slots */}
            {cargandoProfesionales ? (
              <div className={styles['cargando']}>Cargando profesionales...</div>
            ) : profesionales.length === 0 ? (
              <div className={styles['sin-resultados']}>
                No hay profesionales disponibles para esta fecha.
              </div>
            ) : (
              <div className={styles['profesionales-container']}>
                {profesionales.map((profesional) => (
                  <TarjetaProfesional
                    key={profesional.profesionalId}
                    profesional={profesional}
                    onSlotSeleccionado={(hora) => handleSlotSeleccionado(profesional, hora)}
                    fechaSeleccionada={selectedFecha || undefined}
                    formatearFechaCorta={formatearFechaCorta}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            <div className={inicioStyles['inicio-footer']}>
              <a onClick={() => alert('Ayuda')} className={inicioStyles['inicio-footer-link']}>
                ¿Necesitas Ayuda?
              </a>
              <a onClick={() => alert('Términos')} className={inicioStyles['inicio-footer-link']}>
                Términos y Condiciones
              </a>
              <a onClick={() => alert('Políticas')} className={inicioStyles['inicio-footer-link']}>
                Políticas de Privacidad
              </a>
              <div className={inicioStyles['inicio-version']}>v.0.10</div>
            </div>
          </div>
        </div>
      </div>

      <div className={inicioStyles['inicio-right']}>
        <div className={inicioStyles['inicio-right-content']}>
          <a href="/">
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={inicioStyles['inicio-logo-desktop']}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
