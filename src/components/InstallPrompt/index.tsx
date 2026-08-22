// src/components/InstallPrompt/index.tsx
import { useState, useEffect } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import ModalInstall from './ModalInstall';
import BannerInstall from './BannerInstall';

export default function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = useInstallPrompt();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Mostrar el modal automáticamente
  useEffect(() => {
    console.log('📊 Estado en InstallPrompt:', { isInstallable, isInstalled, hasShownModal });
    
    if (isInstallable && !isInstalled && !hasShownModal) {
      const timer = setTimeout(() => {
        console.log('⏰ Mostrando modal...');
        setIsModalOpen(true);
        setHasShownModal(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, hasShownModal]);

  // Si ya está instalado o no es instalable, no mostrar nada
  if (isInstalled || !isInstallable) {
    console.log('🚫 Ocultando InstallPrompt (instalado o no instalable)');
    return null;
  }

  const handleCloseModal = () => {
    console.log('🔚 Cerrando modal');
    setIsModalOpen(false);
  };

  const handleInstall = async (): Promise<boolean> => {
    console.log('🔄 Instalando...');
    const success = await installApp();
    if (success) {
      setIsModalOpen(false);
      setBannerDismissed(true);
    }
    return success;
  };

  const showBanner = isInstallable && !isInstalled && !bannerDismissed && !isModalOpen;

  console.log('🎨 Renderizando InstallPrompt:', { isModalOpen, showBanner });

  return (
    <>
      <ModalInstall
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onInstall={handleInstall}
        isInstalled={isInstalled}
      />
      <BannerInstall
        isVisible={showBanner}
        onInstall={handleInstall}
        isInstalled={isInstalled}
      />
    </>
  );
}
