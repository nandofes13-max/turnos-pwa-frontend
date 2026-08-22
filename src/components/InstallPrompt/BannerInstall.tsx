// src/components/InstallPrompt/BannerInstall.tsx
import styles from '../../styles/InstallPrompt.module.css';

interface BannerInstallProps {
  isVisible: boolean;
  onInstall: () => Promise<boolean>;
  isInstalled?: boolean;
}

export default function BannerInstall({ 
  isVisible, 
  onInstall, 
  isInstalled = false 
}: BannerInstallProps) {
  if (!isVisible || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    await onInstall();
  };

  return (
    <div className={styles['banner-wrapper']}>
      <div className={styles['banner-container']}>
        <div className={styles['banner-content']}>
          <div className={styles['banner-icon']}>⚡</div>
          <div className={styles['banner-text']}>
            <p className={styles['banner-title']}>PWA-Turnos en tu pantalla de inicio</p>
            <p className={styles['banner-description']}>
              Recibí recordatorios de tus turnos y notificaciones al instante. 
              Gestioná tu agenda con un solo toque desde la pantalla de inicio.
            </p>
            <ul className={styles['banner-benefits']}>
              <li>✅ Sin descargas pesadas</li>
              <li>✅ Siempre a mano</li>
              <li>✅ Recordatorios y alertas en tiempo real</li>
            </ul>
          </div>
          <button 
            className={styles['banner-install-btn']} 
            onClick={handleInstall}
          >
            📲 Instalar PWA-Turnos
          </button>
        </div>
      </div>
    </div>
  );
}
