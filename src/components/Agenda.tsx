import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';
import CarruselDias from './CarruselDias';
import TarjetaProfesional from './TarjetaProfesional';
import ConfirmarTurnoModal from './ConfirmarTurnoModal';
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

export default function Agenda() {
  const navigate = useNavigate();
  const { actividadId, especialidadId, centroId, negocioUrl: negocioUrlParam } = useParams<{ 
    actividadId: string; 
    especialidadId: string; 
    centroId: string;
    negocioUrl: string;
  }>();
  const location = useLocation();
  
  // Leer query params
  const queryParams = new URLSearchParams(location.search);
  const negocioIdFromQuery = queryParams.get('negocioId');
  const negocioNombreFromQuery = queryParams.get('negocioNombre');
  const negocioUrlFromQuery = queryParams.get('negocioUrl');
  
  // Prioridad: state > query params > parámetros de ruta > valores por defecto
  const { 
    actividadNombre, 
    especialidadNombre, 
    centroNombre,
    negocioId: negocioIdFromState, 
    negocioNombre: negocioNombreFromState,
    negocioUrl: negocioUrlFromState 
  } = location.state || {
    actividadNombre: 'Actividad',
    especialidadNombre: 'Especialidad',
    centroNombre: 'Centro',
    negocioId: null,
    negocioNombre: null,
    negocioUrl: null
  };

  const negocioId = negocioIdFromState || negocioIdFromQuery || 6;
  const negocioNombre = negocioNombreFromState || negocioNombreFromQuery || 'DEMO';
  // Prioridad: query params > parámetro de ruta > state
  const negocioUrl = negocioUrlFromQuery || negocioUrlParam || negocioUrlFromState || null;
  const actividadNombreFinal = actividadNombre || 'Actividad';
  const especialidadNombreFinal = especialidadNombre || 'Especialidad';
  const centroNombreFinal = centroNombre || 'Centro';
  const esNegocioReal = !!negocioUrl && negocioUrl !== '';

  const [dias, setDias] = useState<DiaDisponible[]>([]);
  const [profesionales, setProfesionales] = useState<ProfesionalSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  const [cargandoProfesionales, setCargandoProfesionales] = useState(false);
  const [centroTimezone, setCentroTimezone] = useState<string>('');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{
    profesional: ProfesionalSlots;
    hora: string;
  } | null>(null);

  useEffect(() => {
    const cargarCentro = async () => {
      if (!centroId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/centros/${centroId}`);
        if (response.ok) {
          const centro = await response.json();
          setCentroTimezone(centro.timezone || '');
          console.log('Timezone del centro cargado:', centro.timezone);
        }
      } catch (error) {
        console.error('Error cargando centro:', error);
      }
    };
    cargarCentro();
  }, [centroId]);

  const obtenerFechaActualStr = (): string => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generarRangoFechas = () => {
    const hoyStr = obtenerFechaActualStr();
    const hoy = new Date(hoyStr);
    const desde = hoyStr;
    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + 30);
    return { desde, hasta: hasta.toISOString().split('T')[0] };
  };

  const formatearFechaCorta = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(Date.UTC(year, month - 1, day));
    const diaSemana = fecha.toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '');
    const dia = day.toString().padStart(2, '0');
    const mes = month.toString().padStart(2, '0');
    const anio = year.toString().slice(-2);
    return `${diaSemana} ${dia}/${mes}/${anio}`;
  };

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

        const hoyStr = obtenerFechaActualStr();
        const primerDiaDisponible = data.find((d: DiaDisponible) => {
          const esDisponible = d.disponible === true;
          const esPosterior = d.fecha >= hoyStr;
          return esDisponible && esPosterior;
        });

        if (primerDiaDisponible) {
          console.log('✅ Seleccionando fecha:', primerDiaDisponible.fecha);
          setSelectedFecha(primerDiaDisponible.fecha);
        } else {
          console.log('❌ No hay días disponibles');
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
    setSlotSeleccionado({ profesional, hora });
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setSlotSeleccionado(null);
  };

  // Definir breadcrumb según si hay negocio o no
  const breadcrumbItems = [];
  
  if (esNegocioReal && negocioUrl) {
    breadcrumbItems.push({ label: negocioNombre, path: `/negocio/${negocioUrl}` });
    breadcrumbItems.push({ label: 'Actividad', path: `/negocio/${negocioUrl}/actividad` });
    breadcrumbItems.push({ label: 'Especialidad', path: `/negocio/${negocioUrl}/actividad/${actividadId}/especialidad?negocioId=${negocioId}&negocioNombre=${encodeURIComponent(negocioNombre)}&negocioUrl=${negocioUrl}` });
    breadcrumbItems.push({ label: 'Centro', path: `/negocio/${negocioUrl}/actividad/${actividadId}/especialidad/${especialidadId}/centro?negocioId=${negocioId}&negocioNombre=${encodeURIComponent(negocioNombre)}&negocioUrl=${negocioUrl}` });
    breadcrumbItems.push({ label: 'Agenda' });
  } else {
    breadcrumbItems.push({ label: 'Actividad', path: '/actividad' });
    breadcrumbItems.push({ label: 'Especialidad', path: `/actividad/${actividadId}/especialidad` });
    breadcrumbItems.push({ label: 'Centro', path: `/actividad/${actividadId}/especialidad/${especialidadId}/centro` });
    breadcrumbItems.push({ label: 'Agenda' });
  }

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
          
          <div className={inicioStyles['inicio-logo-mobile']}>
            <a href={esNegocioReal && negocioUrl ? `/negocio/${negocioUrl}` : '/'}>
              <img 
                src="/1000133565.png" 
                alt="PWA Turnos" 
                className={inicioStyles['inicio-logo-mobile-img']}
              />
            </a>
          </div>

          <div className={inicioStyles['inicio-card']}>
            <Breadcrumb items={breadcrumbItems} />

            <div className={styles['seleccion-info']}>
              Has seleccionado: 
              {esNegocioReal && <strong> {negocioNombre} &gt; </strong>}
              <strong>{actividadNombreFinal} &gt; {especialidadNombreFinal} &gt; {centroNombreFinal}</strong>
            </div>

            <h1 className={inicioStyles['inicio-titulo']}>Elige horario y profesional</h1>
            
            <CarruselDias 
              dias={dias}
              selectedFecha={selectedFecha}
              onDiaSeleccionado={handleDiaSeleccionado}
            />

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
                    especialidadNombre={especialidadNombreFinal}
                    centroNombre={centroNombreFinal}
                    centroTimezone={centroTimezone}
                  />
                ))}
              </div>
            )}

            {slotSeleccionado && selectedFecha && (
              <ConfirmarTurnoModal
                isOpen={modalAbierto}
                onClose={handleCerrarModal}
                datosSlot={{
                  profesionalNombre: slotSeleccionado.profesional.nombre,
                  especialidadNombre: especialidadNombreFinal,
                  centroNombre: centroNombreFinal,
                  zonaHoraria: centroTimezone ? formatearTimezone(centroTimezone) : 'Buenos Aires (Argentina)',
                  fecha: selectedFecha,
                  hora: slotSeleccionado.hora,
                  centroId: Number(centroId),
                  profesionalCentroId: slotSeleccionado.profesional.profesionalCentroId,
                  especialidadId: slotSeleccionado.profesional.especialidadId,
                }}
              />
            )}

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
          <a href={esNegocioReal && negocioUrl ? `/negocio/${negocioUrl}` : '/'}>
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
