import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHeartbeat, 
  FaCut, 
  FaFutbol, 
  FaDog, 
  FaTableTennis, 
  FaPaintBrush, 
  FaBriefcase 
} from 'react-icons/fa';
import styles from '../styles/Actividad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ORDEN MANUAL DE ACTIVIDADES (por nombre exacto)
const ORDEN_ACTIVIDADES = [
  'Salud',
  'Barberías',
  'Fútbol',
  'Veterinarias',
  'Paddle',
  'Peluquerías',
  'Otros Servicios'
];

// MAPEO DE ÍCONOS POR NOMBRE EXACTO
const getIconForActividad = (nombre: string) => {
  switch (nombre) {
    case 'Salud':
      return <FaHeartbeat className={inicioStyles['inicio-btn-icon']} />;
    case 'Barberías':
      return <FaCut className={inicioStyles['inicio-btn-icon']} />;
    case 'Fútbol':
      return <FaFutbol className={inicioStyles['inicio-btn-icon']} />;
    case 'Veterinarias':
      return <FaDog className={inicioStyles['inicio-btn-icon']} />;
    case 'Paddle':
      return <FaTableTennis className={inicioStyles['inicio-btn-icon']} />;
    case 'Peluquerías':
      return <FaPaintBrush className={inicioStyles['inicio-btn-icon']} />;
    default:
      return <FaBriefcase className={inicioStyles['inicio-btn-icon']} />;
  }
};

interface ActividadType {
  id: number;
  nombre: string;
  descripcion?: string;
}

export default function Actividad() {
  const [actividades, setActividades] = useState<ActividadType[]>([]);
  const [loading, setLoading] = useState(true);

  const NEGOCIO_DEMO_ID = 6;

  useEffect(() => {
    const cargarActividades = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/negocio-actividades/negocio/${NEGOCIO_DEMO_ID}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar las actividades');
        }
        
        const relaciones = await response.json();
        const actividadesData = relaciones.map((rel: any) => rel.actividad);
        
        // ORDENAR SEGÚN LA LISTA MANUAL
        const actividadesOrdenadas = [...actividadesData].sort((a, b) => {
          const indexA = ORDEN_ACTIVIDADES.indexOf(a.nombre);
          const indexB = ORDEN_ACTIVIDADES.indexOf(b.nombre);
          
          // Si no está en la lista, va al final
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        
        setActividades(actividadesOrdenadas);
      } catch (err: any) {
        console.error('Error:', err);
        // Fallback con datos por defecto
        setActividades([
          { id: 1, nombre: 'Salud' },
          { id: 2, nombre: 'Veterinarias' },
          { id: 3, nombre: 'Peluquerías' },
          { id: 4, nombre: 'Barberías' },
          { id: 5, nombre: 'Otros Servicios' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    cargarActividades();
  }, []);

  // ... resto del componente (handleAyuda, etc.)

  if (loading) {
    return (
      <div className={inicioStyles['inicio-container']}>
        <div className={inicioStyles['inicio-left']}>
          <div className={inicioStyles['inicio-left-content']}>
            <div className={inicioStyles['inicio-card']}>
              <h1 className={inicioStyles['inicio-titulo']}>Cargando actividades...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={inicioStyles['inicio-container']}>
      {/* Columna izquierda */}
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          
          <div className={inicioStyles['inicio-logo-mobile']}>
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={inicioStyles['inicio-logo-mobile-img']}
            />
          </div>

          <div className={inicioStyles['inicio-card']}>
            <h1 className={inicioStyles['inicio-titulo']}>¿Cuál es tu Actividad?</h1>
            
            <div className={styles['actividad-grid']}>
              {actividades.map((actividad) => (
                <button 
                  key={actividad.id}
                  onClick={() => alert(`Has seleccionado: ${actividad.nombre} - (Demo)`)}
                  className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
                >
                  {getIconForActividad(actividad.nombre)} {actividad.nombre}
                </button>
              ))}
            </div>

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
              <div className={inicioStyles['inicio-version']}>
                v.0.10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha */}
      <div className={inicioStyles['inicio-right']}>
        <div className={inicioStyles['inicio-right-content']}>
          <Link to="/">
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={inicioStyles['inicio-logo-desktop']}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
