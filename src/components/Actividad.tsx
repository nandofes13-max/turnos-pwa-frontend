import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaDog, FaCut, FaCrown, FaBriefcase } from 'react-icons/fa';
import styles from '../styles/Actividad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Mapeo de iconos por nombre de actividad (opcional)
const getIconForActividad = (nombre: string) => {
  const nombreLower = nombre.toLowerCase();
  if (nombreLower.includes('salud')) return <FaHeartbeat className={inicioStyles['inicio-btn-icon']} />;
  if (nombreLower.includes('veterinaria')) return <FaDog className={inicioStyles['inicio-btn-icon']} />;
  if (nombreLower.includes('peluquer')) return <FaCut className={inicioStyles['inicio-btn-icon']} />;
  if (nombreLower.includes('barber')) return <FaCrown className={inicioStyles['inicio-btn-icon']} />;
  return <FaBriefcase className={inicioStyles['inicio-btn-icon']} />;
};

interface ActividadType {
  id: number;
  nombre: string;
  descripcion?: string;
  virtual?: boolean;
}

export default function Actividad() {
  const [actividades, setActividades] = useState<ActividadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ID del negocio DEMO (debería venir del contexto o props)
  // Por ahora usamos un ID fijo. Después se puede pasar por parámetro.
  const NEGOCIO_DEMO_ID = 6; // 🔁 CAMBIAR POR EL ID REAL DEL NEGOCIO DEMO

  useEffect(() => {
    const cargarActividades = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/negocio-actividades/negocio/${NEGOCIO_DEMO_ID}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar las actividades');
        }
        
        const relaciones = await response.json();
        // Extraer las actividades de las relaciones
        const actividadesData = relaciones.map((rel: any) => rel.actividad);
        setActividades(actividadesData);
        setError(null);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Error al cargar actividades');
        // Fallback: mostrar actividades por defecto si falla la API
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

  const handleAyuda = () => {
    alert('Funcionalidad demo: Ayuda');
  };

  const handleTerminos = () => {
    alert('Funcionalidad demo: Términos y Condiciones');
  };

  const handlePoliticas = () => {
    alert('Funcionalidad demo: Políticas de Privacidad');
  };

  const handleActividadSeleccionada = (actividad: string) => {
    alert(`Has seleccionado: ${actividad} - (Demo)`);
  };

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
      
      {/* Columna izquierda - BOTONES */}
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          
          {/* Logo solo visible en móvil */}
          <div className={inicioStyles['inicio-logo-mobile']}>
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={inicioStyles['inicio-logo-mobile-img']}
            />
          </div>

          <div className={inicioStyles['inicio-card']}>
            <h1 className={inicioStyles['inicio-titulo']}>¿Cuál es tu Actividad?</h1>
            
            {/* Grilla de actividades dinámica */}
            <div className={styles['actividad-grid']}>
              {actividades.map((actividad, index) => (
                <button 
                  key={actividad.id}
                  onClick={() => handleActividadSeleccionada(actividad.nombre)}
                  className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
                >
                  {getIconForActividad(actividad.nombre)} {actividad.nombre}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className={inicioStyles['inicio-footer']}>
              <a onClick={handleAyuda} className={inicioStyles['inicio-footer-link']}>
                ¿Necesitas Ayuda?
              </a>
              <a onClick={handleTerminos} className={inicioStyles['inicio-footer-link']}>
                Términos y Condiciones
              </a>
              <a onClick={handlePoliticas} className={inicioStyles['inicio-footer-link']}>
                Políticas de Privacidad
              </a>
              <div className={inicioStyles['inicio-version']}>
                v.0.10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha - LOGO (solo desktop) */}
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
