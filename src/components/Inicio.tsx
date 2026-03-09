import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 👈 AGREGADO Link
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa'; // 👈 SACAMOS FaMicrosoft
import { MdPhoneIphone, MdEmail } from 'react-icons/md';
import styles from '../styles/Inicio.module.css';

export default function Inicio() {
  const navigate = useNavigate();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detectar si es dispositivo táctil
    setIsTouchDevice(
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  const handleDemo = () => {
    navigate('/actividad');
  };

  const handleAyuda = () => {
    alert('Funcionalidad demo: Ayuda');
  };

  const handleTerminos = () => {
    alert('Funcionalidad demo: Términos y Condiciones');
  };

  const handlePoliticas = () => {
    alert('Funcionalidad demo: Políticas de Privacidad');
  };

  return (
    <div className={styles['inicio-container']}>
      
      {/* Columna izquierda - LOGIN */}
      <div className={styles['inicio-left']}>
        <div className={styles['inicio-left-content']}>
          
          {/* Logo solo visible en móvil */}
          <div className={styles['inicio-logo-mobile']}>
            <img 
              src="/logo-pwa-turnos.svg" 
              alt="PWA Turnos" 
              className={styles['inicio-logo-mobile-img']}
            />
          </div>

          <div className={styles['inicio-card']}>
            <h1 className={styles['inicio-titulo']}>Te damos la bienvenida</h1>
            <p className={styles['inicio-subtitulo']}>Inicia sesión o suscríbete</p>

            {/* Botones */}
            <div className={styles['inicio-botones']}>
              {/* 1. Demo */}
              <button 
                onClick={handleDemo}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-demo']}`}
              >
                Demo
              </button>

              {/* 2. Dirección Correo Electrónico */}
              <button className={styles['inicio-btn']}>
                <MdEmail className={styles['inicio-btn-icon']} />
                Dirección Correo Electrónico
              </button>

              {/* 3. Continuar con Google */}
              <button className={styles['inicio-btn']}>
                <FcGoogle className={styles['inicio-btn-icon']} />
                Continuar con Google
              </button>

              {/* 4. Continuar con Apple - Solo en dispositivos táctiles/móviles */}
              {isTouchDevice && (
                <button className={styles['inicio-btn']}>
                  <FaApple className={styles['inicio-btn-icon']} />
                  Continuar con Apple
                </button>
              )}

              {/* 5. Continuar con el teléfono - Solo en dispositivos táctiles/móviles */}
              {isTouchDevice && (
                <button className={`${styles['inicio-btn']} ${styles['inicio-btn-phone']}`}>
                  <MdPhoneIphone className={styles['inicio-btn-icon']} />
                  Continuar con el teléfono
                </button>
              )}
            </div>

            {/* Footer */}
            <div className={styles['inicio-footer']}>
              <a onClick={handleAyuda} className={styles['inicio-footer-link']}>
                ¿Necesitas Ayuda?
              </a>
              <a onClick={handleTerminos} className={styles['inicio-footer-link']}>
                Términos y Condiciones
              </a>
              <a onClick={handlePoliticas} className={styles['inicio-footer-link']}>
                Políticas de Privacidad
              </a>
              <div className={styles['inicio-version']}>
                v.0.10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha - LOGO (solo desktop) */}
      <div className={styles['inicio-right']}>
        <div className={styles['inicio-right-content']}>
          {/* 👇 AGREGAMOS Link alrededor de la imagen */}
          <Link to="/">
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={styles['inicio-logo-desktop']}
            />
          </Link>
        </div>
      </div>

    </div>
  );
}
