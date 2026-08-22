// src/components/InstallPrompt/index.tsx
import { useState, useEffect } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import ModalInstall from './ModalInstall';

export default function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = useInstallPrompt();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Mostrar el modal automáticamente después de un delay
  useEffect(() => {
    if (isInstallable && !isInstalled && !hasShownModal) {
      // Esperar 3 segundos antes de mostrar el modal
      const timer = setTimeout(() => {
        setIsModalOpen(true);
        setHasShownModal(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, hasShownModal]);

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
      setIsModalOpen(false);
    }
    return success;
  };

  return (
    <ModalInstall
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      onInstall={handleInstall}
      isInstalled={isInstalled}
    />
  );
}
