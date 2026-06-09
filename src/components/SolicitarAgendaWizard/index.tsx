// src/components/SolicitarAgendaWizard/index.tsx
// Wizard principal - Sin overlay, layout consistente con Inicio

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paso1DatosBasicos from './Paso1DatosBasicos';
import { Paso1Result } from '../../services/apiWizard';
import styles from './wizard.module.css';

type WizardStep = 1 | 2 | 3;

export default function SolicitarAgendaWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [paso1Data, setPaso1Data] = useState<Paso1Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePaso1Success = (data: Paso1Result) => {
    setPaso1Data(data);
    setStep(2);
    setError(null);
  };

  const handlePaso1Error = (err: string) => {
    setError(err);
  };

  const handleVolver = () => {
    setStep(1);
    setError(null);
  };

  const handleVolverInicio = () => {
    navigate('/');
  };

  // Renderizar paso actual
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Paso1DatosBasicos
            onSuccess={handlePaso1Success}
            onError={handlePaso1Error}
          />
        );
      case 2:
        // Placeholder para Paso 2 (se implementará después)
        return (
          <div className={styles['wizard-container-page']}>
            <div className={styles['wizard-left']}>
              <div className={styles['wizard-left-content']}>
                <div className={styles['wizard-logo-mobile']}>
                  <img 
                    src="/logo-pwa-turnos.svg" 
                    alt="PWA Turnos" 
                    className={styles['wizard-logo-mobile-img']}
                  />
                </div>
                <div className={styles['wizard-card']}>
                  <h2 className={styles.title}>Paso 2: Próximamente</h2>
                  <p className={styles['texto-ayuda']}>
                    El paso 2 (Profesionales) y paso 3 (Agenda) estarán disponibles en la próxima actualización.
                  </p>
                  <div className={styles.buttonsContainer}>
                    <button className={styles.buttonSecondary} onClick={handleVolver}>
                      Volver al Paso 1
                    </button>
                    <button className={styles.buttonPrimary} onClick={handleVolverInicio}>
                      Volver al inicio
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles['wizard-right']}>
              <div className={styles['wizard-right-content']}>
                <img 
                  src="/1000133565.png" 
                  alt="PWA Turnos" 
                  className={styles['wizard-logo-desktop']}
                  onClick={() => navigate('/')}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderStep()}
      {error && (
        <div className={styles['mensaje-error']} style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          {error}
        </div>
      )}
    </>
  );
}
