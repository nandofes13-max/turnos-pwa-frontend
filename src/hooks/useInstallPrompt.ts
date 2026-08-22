// src/hooks/useInstallPrompt.ts
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 👈 VERIFICAR SI YA ESTÁ INSTALADA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 PWA ya instalada');
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    // 👈 MANEJAR EL EVENTO beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🔔 beforeinstallprompt capturado en el hook');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('✅ isInstallable = true');
    };

    // 👈 MANEJAR LA INSTALACIÓN
    const handleAppInstalled = () => {
      console.log('✅ PWA instalada correctamente');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    // 👈 AGREGAR LISTENERS
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 👈 VERIFICAR SI EL EVENTO YA OCURRIÓ
    // Forzar la verificación de instalabilidad
    console.log('🔍 Escuchando evento beforeinstallprompt...');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    console.log('🔄 installApp llamado, deferredPrompt:', deferredPrompt);
    
    if (!deferredPrompt) {
      console.warn('⚠️ No hay prompt de instalación disponible');
      return false;
    }

    try {
      console.log('📤 Mostrando prompt de instalación...');
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      console.log('📊 Resultado de la instalación:', result);
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
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    console.log('🔄 Banner descartado');
    setIsInstallable(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    installApp,
    dismissBanner,
  };
}
