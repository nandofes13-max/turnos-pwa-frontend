import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/Actividad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

interface Actividad {
  id: number;
  nombre: string;
}

export default function ActividadPorNegocio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actividades, negocioId, negocioNombre } = location.state || { 
    actividades: [], 
    negocioId: null, 
    negocioNombre: '' 
  };

  const handleActividadSeleccionada = (actividad: Actividad) => {
    // Redirigir a la pantalla de especialidades para esta actividad
    navigate(`/actividad/${actividad.id}/especialidad?negocioId=${negocioId}&negocioNombre=${encodeURIComponent(negocioNombre)}`, {
      state: {
        negocioId: negocioId,
        negocioNombre: negocioNombre,
        actividadNombre: actividad.nombre,
      },
    });
  };

  if (!actividades || actividades.length === 0) {
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
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          <div className={inicioStyles['inicio-card']}>
            <h1 className={inicioStyles['inicio-titulo']}>Selecciona una actividad</h1>
            <div className={styles['actividad-grid']}>
              {actividades.map((actividad: Actividad) => (
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
