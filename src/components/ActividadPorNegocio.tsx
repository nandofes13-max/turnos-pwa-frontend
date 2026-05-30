import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles/Actividad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Actividad {
  id: number;
  nombre: string;
}

export default function ActividadPorNegocio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { url } = useParams<{ url: string }>();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [negocioId, setNegocioId] = useState<number | null>(null);
  const [negocioNombre, setNegocioNombre] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarActividades = async () => {
      // Intentar obtener del state primero
      if (location.state?.actividades) {
        setActividades(location.state.actividades);
        setNegocioId(location.state.negocioId);
        setNegocioNombre(location.state.negocioNombre);
        setLoading(false);
        return;
      }

      // Si no hay state, obtener del backend
      try {
        // Primero obtener el negocio por URL
        const negocioRes = await fetch(`${API_BASE_URL}/negocios/url/${url}`);
        const negocioData = await negocioRes.json();
        
        if (negocioData.id) {
          setNegocioId(negocioData.id);
          setNegocioNombre(negocioData.nombre);
          
          // Luego obtener sus actividades
          const actividadesRes = await fetch(`${API_BASE_URL}/negocio-actividades/negocio/${negocioData.id}`);
          const actividadesData = await actividadesRes.json();
          
          const actividadesList = actividadesData.map((item: any) => ({
            id: item.actividadId,
            nombre: item.actividad?.nombre || 'Actividad'
          }));
          
          setActividades(actividadesList);
        }
      } catch (error) {
        console.error('Error al cargar actividades:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarActividades();
  }, [url, location.state]);

  const handleActividadSeleccionada = (actividad: Actividad) => {
    // Mantener el negocioId en la URL
    navigate(`/actividad/${actividad.id}/especialidad?negocioId=${negocioId}&negocioNombre=${encodeURIComponent(negocioNombre)}`, {
      state: {
        negocioId: negocioId,
        negocioNombre: negocioNombre,
        actividadNombre: actividad.nombre,
      },
    });
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

  if (actividades.length === 0) {
    return (
      <div className={inicioStyles['inicio-container']}>
        <div className={inicioStyles['inicio-left']}>
          <div className={inicioStyles['inicio-left-content']}>
            <div className={inicioStyles['inicio-card']}>
              <h1 className={inicioStyles['inicio-titulo']}>No hay actividades disponibles</h1>
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
          <div className={inicioStyles['inicio-card']}>
            <h1 className={inicioStyles['inicio-titulo']}>Selecciona una actividad</h1>
            <div className={styles['actividad-grid']}>
              {actividades.map((actividad) => (
                <button
                  key={actividad.id}
                  onClick={() => handleActividadSeleccionada(actividad)}
                  className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
                >
                  {actividad.nombre}
                </button>
              ))}
            </div>
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
    </div>
  );
}
