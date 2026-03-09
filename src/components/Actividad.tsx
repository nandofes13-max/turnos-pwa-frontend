import { Link } from 'react-router-dom';
import { FaHeartbeat, FaDog, FaCut, FaBriefcase } from 'react-icons/fa';
import styles from '../styles/Actividad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

export default function Actividad() {
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
            
            {/* Botones en grilla 2 columnas */}
            <div className={styles['actividad-grid']}>
              
              {/* Fila 1 */}
              <button 
                onClick={() => handleActividadSeleccionada('Salud')}
                className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
              >
                <FaHeartbeat className={inicioStyles['inicio-btn-icon']} /> Salud
              </button>
              
              <button 
                onClick={() => handleActividadSeleccionada('Veterinarias')}
                className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
              >
                <FaDog className={inicioStyles['inicio-btn-icon']} /> Veterinarias
              </button>

              {/* Fila 2 */}
              <button 
                onClick={() => handleActividadSeleccionada('Peluquerías')}
                className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
              >
                <FaCut className={inicioStyles['inicio-btn-icon']} /> Peluquerías
              </button>
              
              <button 
                onClick={() => handleActividadSeleccionada('Barberías')}
                className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
              >
                <FaCut className={inicioStyles['inicio-btn-icon']} /> Barberías
              </button>
            </div>

            {/* Botón Otros Servicios centrado */}
            <div className={styles['actividad-otros-container']}>
              <button 
                onClick={() => handleActividadSeleccionada('Otros Servicios')}
                className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']} ${styles['actividad-btn-otros']}`}
              >
                <FaBriefcase className={inicioStyles['inicio-btn-icon']} /> Otros Servicios
              </button>
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
