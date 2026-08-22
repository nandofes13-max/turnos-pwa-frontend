// src/components/InstallPrompt/ModalInstall.tsx
import { useEffect, useRef } from 'react';
import styles from '../../styles/InstallPrompt.module.css';

interface ModalInstallProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstalled?: boolean;
}

export default function ModalInstall({ 
  isOpen, 
  onClose, 
  onInstall, 
  isInstalled = false 
}: ModalInstallProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar modal al hacer clic fuera del contenido
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Si el modal está cerrado o ya instalado, no renderizar
  if (!isOpen || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-container']} ref={modalRef}>
        {/* Botón de cerrar */}
        <button 
          className={styles['modal-close-btn']} 
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className={styles['modal-content']}>
          <div className={styles['modal-icon']}>⚡</div>
          <h2 className={styles['modal-title']}>PWA-Turnos al instante</h2>
          <p className={styles['modal-description']}>
            Recibí recordatorios de tus turnos y notificaciones al instante.
          </p>
          <button 
            className={styles['modal-install-btn']} 
            onClick={handleInstall}
          >
            📲 Instalar Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
