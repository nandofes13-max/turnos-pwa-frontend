// src/components/SolicitarAgendaWizard/index.tsx
// Wizard principal - Versión Paso 1 completo

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
  const [cargando, setCargando] = useState(false);

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
          <div className={styles['modal-content']}>
            <h2 className={styles['modal-titulo']}>Paso 2: Próximamente</h2>
            <p className={styles['texto-ayuda']}>
              El paso 2 (Profesionales) y paso 3 (Agenda) estarán disponibles en la próxima actualización.
            </p>
            <div className={styles['modal-botones']}>
              <button className={styles['btn-volver']} onClick={handleVolver}>
                Volver al Paso 1
              </button>
              <button className={styles['btn-inicio']} onClick={handleVolverInicio}>
                Volver al inicio
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles['wizard-overlay']}>
      <div className={styles['wizard-container']}>
        {/* Indicador de pasos */}
        <div className={styles['steps-indicator']}>
          <div className={`${styles['step']} ${step >= 1 ? styles['step-active'] : ''}`}>
            <span className={styles['step-number']}>1</span>
            <span className={styles['step-label']}>Negocio</span>
          </div>
          <div className={`${styles['step-line']} ${step >= 2 ? styles['step-line-active'] : ''}`} />
          <div className={`${styles['step']} ${step >= 2 ? styles['step-active'] : ''}`}>
            <span className={styles['step-number']}>2</span>
            <span className={styles['step-label']}>Profesionales</span>
          </div>
          <div className={`${styles['step-line']} ${step >= 3 ? styles['step-line-active'] : ''}`} />
          <div className={`${styles['step']} ${step >= 3 ? styles['step-active'] : ''}`}>
            <span className={styles['step-number']}>3</span>
            <span className={styles['step-label']}>Agenda</span>
          </div>
        </div>

        {/* Contenido del paso actual */}
        <div className={styles['wizard-content']}>
          {renderStep()}
        </div>

        {/* Mensaje de error global */}
        {error && (
          <div className={styles['mensaje-error']}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
