import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { 
  FaHeartbeat, 
  FaCrown, 
  FaFutbol, 
  FaDog, 
  FaTableTennis, 
  FaCut, 
  FaBriefcase 
} from 'react-icons/fa';

import styles from '../styles/Actividad.module.css';
import inicioStyles from '../styles/Inicio.module.css';


const API_BASE_URL = import.meta.env.VITE_API_URL;

// ORDEN MANUAL POR ID
const ORDEN_ACTIVIDADES_IDS = [6, 9, 11, 7, 12, 8, 10];

// MAPEO DE ÍCONOS POR ID
const getIconForActividadId = (id: number) => {
  switch (id) {
    case 6:  // SALUD
      return <FaHeartbeat className={inicioStyles['inicio-btn-icon']} />;
    case 9:  // BARBERIAS
      return <FaCrown className={inicioStyles['inicio-btn-icon']} />;
    case 11: // FUTBOL
      return <FaFutbol className={inicioStyles['inicio-btn-icon']} />;
    case 7:  // VETERINARIAS
      return <FaDog className={inicioStyles['inicio-btn-icon']} />;
    case 12: // PADDLE
      return <FaTableTennis className={inicioStyles['inicio-btn-icon']} />;
    case 8:  // PELUQUERIAS
      return <FaCut className={inicioStyles['inicio-btn-icon']} />;
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
  const navigate = useNavigate();  // 👈 AGREGAR ESTA LÍNEA
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
        
        const actividadesOrdenadas = [...actividadesData].sort((a, b) => {
          const indexA = ORDEN_ACTIVIDADES_IDS.indexOf(a.id);
          const indexB = ORDEN_ACTIVIDADES_IDS.indexOf(b.id);
          
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        
        setActividades(actividadesOrdenadas);
      } catch (err: any) {
        console.error('Error:', err);
        setActividades([
          { id: 6, nombre: 'Salud' },
          { id: 7, nombre: 'Veterinarias' },
          { id: 8, nombre: 'Peluquerías' },
          { id: 9, nombre: 'Barberías' },
          { id: 10, nombre: 'Otros Servicios' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    cargarActividades();
  }, []);

  const handleAyuda = () => alert('Funcionalidad demo: Ayuda');
  const handleTerminos = () => alert('Funcionalidad demo: Términos y Condiciones');
  const handlePoliticas = () => alert('Funcionalidad demo: Políticas de Privacidad');

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
                  onClick={() => navigate('/especialidad', { state: { actividadId: actividad.id, actividadNombre: actividad.nombre } })}
                >
                  {getIconForActividadId(actividad.id)} {actividad.nombre}
                </button>
              ))}
            </div>

            <div className={inicioStyles['inicio-footer']}>
              <a onClick={handleAyuda} className={inicioStyles['inicio-footer-link']}>¿Necesitas Ayuda?</a>
              <a onClick={handleTerminos} className={inicioStyles['inicio-footer-link']}>Términos y Condiciones</a>
              <a onClick={handlePoliticas} className={inicioStyles['inicio-footer-link']}>Políticas de Privacidad</a>
              <div className={inicioStyles['inicio-version']}>v.0.10</div>
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
