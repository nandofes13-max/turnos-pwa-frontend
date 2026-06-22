// src/components/SolicitarAgendaWizard/index.tsx
// Wizard principal - Sin overlay, layout consistente con Inicio
// VERSIÓN CON PASO 3 INTEGRADO (Agenda)
// - Paso 3 reemplazado por componente Paso3Agenda
// - Botón "Finalizar" se habilita cuando la agenda está guardada
// - Muestra indicador "✅ Agenda guardada" en el resumen

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
  const [mostrarExitoFinal, setMostrarExitoFinal] = useState(false);

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

  const handlePaso3Success = () => {
    setAgendaGuardada(true);
    setError(null);
    console.log('✅ Agenda guardada correctamente');
  };

  const handleVolver = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
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

  // 👈 NUEVO: Manejo del botón "Finalizar"
  const handleFinalizar = () => {
    setMostrarExitoFinal(true);
  };

  const cerrarExitoFinal = () => {
    setMostrarExitoFinal(false);
    navigate('/');
  };

  // Función para formatear domicilio (igual que en Paso 1)
  const formatearDireccion = (centro: any): string => {
    if (centro.es_virtual) {
      return 'Virtual';
    }
    const calleCompleta = `${centro.street || ''} ${centro.street_number || ''}`.trim();
    return `${calleCompleta}, ${centro.city || ''}, ${centro.country || ''}`;
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
        if (!paso1Data || !paso2Data) {
          setStep(1);
          return null;
        }
        // Si la agenda ya está guardada, mostramos el resumen con el indicador
        if (agendaGuardada) {
          return renderResumenAgendaGuardada();
        }
        // Si no está guardada, mostramos el componente de configuración
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

  // 👈 NUEVO: Resumen del Paso 3 con agenda guardada
  const renderResumenAgendaGuardada = () => {
    const relacionesCreadas = paso2Data?.profesionalCentroIds?.length || 0;
    const profesionalNombre = paso2Data?.profesional?.nombre || 'Profesional';
    const especialidadNombre = paso2Data?.especialidad?.nombre || 'Especialidad';
    const nombreNegocio = paso1Data?.negocio?.nombre || 'Negocio';

    return (
      <div className={styles['wizard-container-page']}>
        <div className={styles['wizard-left']}>
          <div className={styles['wizard-left-content']}>
            <div className={styles['wizard-card']}>
              <h2 className={styles.title}>Paso 3: Configurar Agenda</h2>

              {/* Indicador de agenda guardada */}
              <div className={styles.agendaGuardadaIndicator}>
                <span className={styles.agendaGuardadaIcon}>✅</span>
                <span className={styles.agendaGuardadaTexto}>Agenda guardada correctamente</span>
              </div>

              {/* Resumen de lo que se creó */}
              <div className={styles.resumenPaso2}>
                <div className={styles.resumenItem}>
                  <span className={styles.resumenLabel}>🏢 Negocio:</span>
                  <span className={styles.resumenValor}>{nombreNegocio}</span>
                </div>
                <div className={styles.resumenItem}>
                  <span className={styles.resumenLabel}>👤 Profesional:</span>
                  <span className={styles.resumenValor}>{profesionalNombre}</span>
                </div>
                <div className={styles.resumenItem}>
                  <span className={styles.resumenLabel}>📋 Especialidad:</span>
                  <span className={styles.resumenValor}>{especialidadNombre}</span>
                </div>
                <div className={styles.resumenItem}>
                  <span className={styles.resumenLabel}>🏢 Centros asignados:</span>
                  <span className={styles.resumenValor}>{relacionesCreadas} centros</span>
                </div>
              </div>

              {/* Lista de centros con indicador de agenda */}
              <div className={styles.centrosAgendaLista}>
                {paso2Data?.profesionalCentroIds?.map((id, index) => {
                  const centro = paso1Data?.centros?.[index] || null;
                  const direccion = centro ? formatearDireccion(centro) : 'Centro sin dirección';

                  return (
                    <div key={id} className={styles.centroAgendaItem}>
                      <span className={styles.centroAgendaNumero}>#{index + 1}</span>
                      <span className={styles.centroAgendaId}>{direccion}</span>
                      <span className={styles.agendaGuardadaBadge}>✅ Agenda configurada</span>
                    </div>
                  );
                })}
              </div>

              {/* Botones de acción */}
              <div className={styles.buttonsContainer}>
                <button
                  className={styles.buttonSecondary}
                  onClick={handleCancelar}
                >
                  CANCELAR
                </button>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleFinalizar}
                >
                  ✅ Finalizar
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
  };

  return (
    <>
      {renderStep()}

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

      {/* 👈 NUEVO: Modal de éxito final */}
      {mostrarExitoFinal && (
        <div className={styles.modalConfirmacionOverlay} onClick={cerrarExitoFinal}>
          <div className={styles.modalConfirmacion} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalConfirmacionTitulo}>✅ ¡Formulario completado con éxito!</h3>
            <p className={styles.modalConfirmacionMensaje}>
              Tu negocio ya está configurado. Compartí estos enlaces para empezar a recibir turnos:
            </p>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>📢 Link Público (para redes sociales):</strong>
                <br />
                <span style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                  {`${window.location.origin}/negocio/${paso1Data?.negocio?.url || ''}`}
                </span>
              </p>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>⚙️ Link de Gestión (para administrar):</strong>
                <br />
                <span style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                  {`${window.location.origin}/turnos`}
                </span>
              </p>
            </div>
            <div className={styles.modalConfirmacionBotones}>
              <button className={styles.buttonPrimary} onClick={cerrarExitoFinal}>
                Ir al inicio
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
