// src/components/SolicitarAgendaWizard/index.tsx
// Wizard principal - Sin overlay, layout consistente con Inicio
// VERSIÓN CON PASO 3 INTEGRADO (Agenda)
// - Paso 3 reemplazado por componente Paso3Agenda
// - Botón "Finalizar" se habilita cuando la agenda está guardada

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paso1DatosBasicos from './Paso1DatosBasicos';
import Paso2Profesionales from './Paso2Profesionales';
import Paso3Agenda from './Paso3Agenda';
import { Paso1Result, Paso2Result } from '../../services/apiWizard';
import styles from './wizard.module.css';

type WizardStep = 1 | 2 | 3;

export default function SolicitarAgendaWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [paso1Data, setPaso1Data] = useState<Paso1Result | null>(null);
  const [paso2Data, setPaso2Data] = useState<Paso2Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarConfirmacionCancelar, setMostrarConfirmacionCancelar] = useState(false);
  const [agendaGuardada, setAgendaGuardada] = useState(false);

  const handlePaso1Success = (data: Paso1Result) => {
    setPaso1Data(data);
    setStep(2);
    setError(null);
  };

  const handlePaso1Error = (err: string) => {
    setError(err);
  };

  const handlePaso2Success = (data: Paso2Result) => {
    setPaso2Data(data);
    setStep(3);
    setError(null);
    console.log('✅ Relaciones profesional-centro creadas:', data.profesionalCentroIds?.length || 0);
  };

  const handlePaso2Error = (err: string) => {
    setError(err);
  };

  // 👈 NUEVO: Manejo del éxito del Paso 3 (agenda guardada)
  const handlePaso3Success = () => {
    setAgendaGuardada(true);
    setError(null);
    console.log('✅ Agenda guardada correctamente');
  };

  const handleVolver = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      // Si estamos en el Paso 3 y hay agenda guardada, no permitir volver
      if (agendaGuardada) {
        if (window.confirm('Ya has guardado la agenda. ¿Estás seguro que deseas volver? Perderás los cambios.')) {
          setStep(2);
          setAgendaGuardada(false);
        }
        return;
      }
      setStep(2);
    }
    setError(null);
  };

  const handleVolverInicio = () => {
    navigate('/');
  };

  // 👈 NUEVO: Manejo del botón CANCELAR
  const handleCancelar = () => {
    setMostrarConfirmacionCancelar(true);
  };

  const confirmarCancelar = () => {
    setMostrarConfirmacionCancelar(false);
    navigate('/');
  };

  const cancelarCancelar = () => {
    setMostrarConfirmacionCancelar(false);
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
        if (!paso1Data) {
          setStep(1);
          return null;
        }
        return (
          <Paso2Profesionales
            negocioId={paso1Data.negocio.id}
            actividadId={paso1Data.negocioActividad.actividadId}
            onSuccess={handlePaso2Success}
            onError={handlePaso2Error}
            onBack={handleVolver}
          />
        );
      case 3:
        // 👈 NUEVO: Paso 3 con el componente de Agenda
        if (!paso1Data || !paso2Data) {
          setStep(1);
          return null;
        }
        return (
          <Paso3Agenda
            paso1Data={paso1Data}
            paso2Data={paso2Data}
            onBack={handleVolver}
            onSuccess={handlePaso3Success}
          />
        );
      default:
        return null;
    }
  };

  // 👈 NUEVO: Renderizar el botón "Finalizar" en el Paso 3
  // Este botón se muestra en el Paso 3 después de guardar la agenda
  const renderFinalizar = () => {
    if (step !== 3) return null;

    return (
      <div className={styles.buttonsContainer} style={{ marginTop: '16px' }}>
        <button
          className={styles.buttonSecondary}
          onClick={handleCancelar}
        >
          CANCELAR
        </button>
        <button
          className={styles.buttonPrimary}
          onClick={handleVolverInicio}
          disabled={!agendaGuardada}
          style={{ opacity: agendaGuardada ? 1 : 0.5 }}
        >
          {agendaGuardada ? '✅ Finalizar' : '🔒 Guarda la agenda para finalizar'}
        </button>
      </div>
    );
  };

  return (
    <>
      {renderStep()}
      
      {/* 👈 NUEVO: Botones de acción para el Paso 3 */}
      {step === 3 && renderFinalizar()}
      
      {/* Modal de confirmación para CANCELAR */}
      {mostrarConfirmacionCancelar && (
        <div className={styles.modalConfirmacionOverlay} onClick={cancelarCancelar}>
          <div className={styles.modalConfirmacion} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalConfirmacionTitulo}>¿Está seguro que desea cancelar?</h3>
            <p className={styles.modalConfirmacionMensaje}>
              Perderá toda la información guardada hasta el momento.
            </p>
            <div className={styles.modalConfirmacionBotones}>
              <button className={styles.buttonSecondary} onClick={cancelarCancelar}>
                Seguir editando
              </button>
              <button className={styles.buttonDanger} onClick={confirmarCancelar}>
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className={styles['mensaje-error']} style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
          {error}
        </div>
      )}
    </>
  );
}
