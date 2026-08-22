// src/components/InstallPrompt/index.tsx
import { useState, useEffect } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import BannerInstall from './BannerInstall';
import ModalInstall from './ModalInstall';

export default function InstallPrompt() {
  const { isInstallable, isInstalled, installApp, dismissBanner } = useInstallPrompt();
  
  // Estados para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Mostrar el modal automáticamente después de un delay
  useEffect(() => {
    if (isInstallable && !isInstalled && !hasShownModal && !bannerDismissed) {
      // Esperar 3 segundos antes de mostrar el modal
      const timer = setTimeout(() => {
        setIsModalOpen(true);
        setHasShownModal(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, hasShownModal, bannerDismissed]);

  // Mostrar el banner después de que el modal se cierre
  useEffect(() => {
    if (!isModalOpen && isInstallable && !isInstalled && hasShownModal && !bannerDismissed) {
      // Mostrar banner después de cerrar el modal
      const timer = setTimeout(() => {
        // No hacemos nada especial, el banner se muestra por el estado isInstallable
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, isInstallable, isInstalled, hasShownModal, bannerDismissed]);

  // Si ya está instalado o no es instalable, no mostrar nada
  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInstall = async (): Promise<boolean> => {
    const success = await installApp();
    if (success) {
      // Si la instalación fue exitosa, cerrar todo
      setIsModalOpen(false);
      setBannerDismissed(true);
    }
    return success;
  };

  // Determinar si el banner debe mostrarse
  const showBanner = isInstallable && !isInstalled && !bannerDismissed && !isModalOpen;

  return (
    <>
      {/* Modal de instalación (se muestra primero) */}
      <ModalInstall
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onInstall={handleInstall}
        isInstalled={isInstalled}
      />

      {/* Banner de instalación (se muestra después de cerrar el modal) */}
      <BannerInstall
        isVisible={showBanner}
        onInstall={handleInstall}
        isInstalled={isInstalled}
      />
    </>
  );
}
