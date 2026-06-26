// src/components/Footer.tsx
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  const navigate = useNavigate();

  const handleAyuda = () => {
    // TODO: Implementar modal de ayuda
    alert('Funcionalidad en desarrollo: Ayuda');
  };

  const handleTerminos = () => {
    navigate('/terminos');
  };

  const handlePoliticas = () => {
    navigate('/privacidad');
  };

  return (
    <footer className={styles['footer']}>
      <div className={styles['footer-content']}>
        <button 
          onClick={handleAyuda} 
          className={styles['footer-link']}
        >
          ¿Necesitas Ayuda?
        </button>
        <button 
          onClick={handleTerminos} 
          className={styles['footer-link']}
        >
          Términos y Condiciones
        </button>
        <button 
          onClick={handlePoliticas} 
          className={styles['footer-link']}
        >
          Políticas de Privacidad
        </button>
        <span className={styles['footer-version']}>
          v.0.10
        </span>
      </div>
    </footer>
  );
}
