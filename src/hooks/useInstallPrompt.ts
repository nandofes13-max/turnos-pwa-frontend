// src/hooks/useInstallPrompt.ts
import { useState, useEffect, useCallback } from 'react';

// Interfaz para el evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Manejar el evento beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que el navegador muestre el prompt automáticamente
      e.preventDefault();
      // Guardar el evento para usarlo después
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('🔔 PWA instalable detectada');
    };

    // Manejar cuando la app ya está instalada
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
      console.log('✅ PWA instalada correctamente');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verificar si ya está instalada (solo funciona en modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Función para mostrar el prompt de instalación
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ No hay prompt de instalación disponible');
      return false;
    }

    try {
      // Mostrar el prompt de instalación del navegador
      await deferredPrompt.prompt();
      // Esperar la decisión del usuario
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('✅ Usuario aceptó la instalación');
        setIsInstallable(false);
        return true;
      } else {
        console.log('❌ Usuario rechazó la instalación');
        return false;
      }
    } catch (error) {
      console.error('❌ Error al mostrar el prompt de instalación:', error);
      return false;
    } finally {
      // Limpiar el deferredPrompt después de usarlo
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Función para cerrar/ocultar el banner
  const dismissBanner = useCallback(() => {
    setIsInstallable(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    installApp,
    dismissBanner,
  };
}
