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

  // Generar rango de 30 días desde hoy (sin incluir días pasados)
  const generarRangoFechas = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = hoy.toISOString().split('T')[0];
    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + 30);
    return { desde, hasta: hasta.toISOString().split('T')[0] };
  };

  // Formatear fecha para mostrar en el título
  const formatearFechaCompleta = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
        
        // Seleccionar automáticamente el primer día disponible (desde hoy hacia adelante)
        const hoyStr = new Date().toISOString().split('T')[0];
        const primerDiaDisponible = data.find((d: DiaDisponible) => 
          d.disponible && d.fecha >= hoyStr
        );
        if (primerDiaDisponible) {
          setSelectedFecha(primerDiaDisponible.fecha);
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

            {/* Título con la fecha seleccionada */}
            {selectedFecha && (
              <h2 className={styles['fecha-seleccionada-titulo']}>
                Día {formatearFechaCompleta(selectedFecha)} - Horarios Disponibles
              </h2>
            )}

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
