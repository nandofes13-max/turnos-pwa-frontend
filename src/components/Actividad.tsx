import { Link } from 'react-router-dom';
import styles from '../styles/Actividad.module.css';

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
    // Acá después navegaremos a la siguiente pantalla
  };

  return (
    <div className={styles['actividad-container']}>
      
      {/* Columna izquierda - BOTONES */}
      <div className={styles['actividad-left']}>
        <div className={styles['actividad-left-content']}>
          
          {/* Logo solo visible en móvil */}
          <div className={styles['actividad-logo-mobile']}>
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={styles['actividad-logo-mobile-img']}
            />
          </div>

          <div className={styles['actividad-card']}>
            <h1 className={styles['actividad-titulo']}>¿Cuál es tu Actividad?</h1>
            
            {/* Botones en grilla 2 columnas */}
            <div className={styles['actividad-grid']}>
              
              {/* Fila 1 */}
              <button 
                onClick={() => handleActividadSeleccionada('Salud')}
                className={`${styles['actividad-btn']} ${styles['actividad-btn-demo']}`}
              >
                Salud
              </button>
              
              <button 
                onClick={() => handleActividadSeleccionada('Veterinarias')}
                className={`${styles['actividad-btn']} ${styles['actividad-btn-demo']}`}
              >
                Veterinarias
              </button>

              {/* Fila 2 */}
              <button 
                onClick={() => handleActividadSeleccionada('Peluquerías')}
                className={`${styles['actividad-btn']} ${styles['actividad-btn-demo']}`}
              >
                Peluquerías
              </button>
              
              <button 
                onClick={() => handleActividadSeleccionada('Barberías')}
                className={`${styles['actividad-btn']} ${styles['actividad-btn-demo']}`}
              >
                Barberías
              </button>
            </div>

            {/* Botón Otros Servicios centrado */}
            <div className={styles['actividad-otros-container']}>
              <button 
                onClick={() => handleActividadSeleccionada('Otros Servicios')}
                className={`${styles['actividad-btn']} ${styles['actividad-btn-demo']} ${styles['actividad-btn-otros']}`}
              >
                Otros Servicios
              </button>
            </div>

            {/* Footer */}
            <div className={styles['actividad-footer']}>
              <a onClick={handleAyuda} className={styles['actividad-footer-link']}>
                ¿Necesitas Ayuda?
              </a>
              <a onClick={handleTerminos} className={styles['actividad-footer-link']}>
                Términos y Condiciones
              </a>
              <a onClick={handlePoliticas} className={styles['actividad-footer-link']}>
                Políticas de Privacidad
              </a>
              <div className={styles['actividad-version']}>
                v.0.10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha - LOGO (solo desktop) */}
      <div className={styles['actividad-right']}>
        <div className={styles['actividad-right-content']}>
          <Link to="/">
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={styles['actividad-logo-desktop']}
            />
          </Link>
        </div>
      </div>

    </div>
  );
}
