import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../styles/Actividad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Actividad {
  id: number;
  nombre: string;
}

export default function ActividadPorNegocio() {
  const navigate = useNavigate();
  const { url } = useParams<{ url: string }>();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [negocioId, setNegocioId] = useState<number | null>(null);
  const [negocioNombre, setNegocioNombre] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!url) return;

      try {
        // 1. Obtener el negocio por URL
        const negocioRes = await fetch(`${API_BASE_URL}/negocios/url/${url}`);
        const negocioData = await negocioRes.json();

        if (negocioData.id) {
          setNegocioId(negocioData.id);
          setNegocioNombre(negocioData.nombre);

          // 2. Obtener las actividades del negocio
          const actividadesRes = await fetch(`${API_BASE_URL}/negocio-actividades/negocio/${negocioData.id}`);
          const relaciones = await actividadesRes.json();

          const actividadesList = relaciones.map((rel: any) => ({
            id: rel.actividadId,
            nombre: rel.actividad?.nombre || 'Sin nombre',
          }));

          setActividades(actividadesList);
        }
      } catch (error) {
        console.error('Error cargando datos del negocio:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [url]);

  const handleActividadClick = (actividad: Actividad) => {
    navigate(`/actividad/${actividad.id}/especialidad?negocioId=${negocioId}&negocioNombre=${encodeURIComponent(negocioNombre)}`, {
      state: {
        negocioId: negocioId,
        negocioNombre: negocioNombre,
        negocioUrl: url,
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
      {/* Columna izquierda - Actividades */}
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          
          {/* Logo móvil - redirige al home del negocio */}
          <div className={inicioStyles['inicio-logo-mobile']}>
            <a href={`/negocio/${url}`}>
              <img 
                src="/1000133565.png" 
                alt="PWA Turnos" 
                className={inicioStyles['inicio-logo-mobile-img']}
              />
            </a>
          </div>

          <div className={inicioStyles['inicio-card']}>
            {/* Breadcrumb con negocio */}
            <div className={styles['breadcrumb-wrapper']}>
              <span className={styles['breadcrumb-item']}>
                <a href={`/negocio/${url}`} className={styles['breadcrumb-link']}>{negocioNombre}</a>
              </span>
              <span className={styles['breadcrumb-separator']}> &gt; </span>
              <span className={styles['breadcrumb-item']}>Actividad</span>
            </div>

            <div className={styles['seleccion-info']}>
              Has seleccionado: <strong>{negocioNombre}</strong>
            </div>

            <h1 className={inicioStyles['inicio-titulo']}>Selecciona una actividad</h1>
            <div className={styles['actividad-grid']}>
              {actividades.map((actividad) => (
                <button
                  key={actividad.id}
                  onClick={() => handleActividadClick(actividad)}
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

      {/* Columna derecha - Logo (solo desktop) - redirige al home del negocio */}
      <div className={inicioStyles['inicio-right']}>
        <div className={inicioStyles['inicio-right-content']}>
          <a href={`/negocio/${url}`}>
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
