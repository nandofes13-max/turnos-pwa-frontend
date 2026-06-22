// src/components/SolicitarAgendaWizard/index.tsx
// Wizard principal - Sin overlay, layout consistente con Inicio
// VERSIÓN CON RESUMEN DE CENTROS Y CONFIGURACIÓN POR CENTRO
// - Paso 3: resumen de todos los centros con botones "Configurar Agenda"
// - Al hacer clic, se abre la configuración para ese centro específico
// - Indicador "✅ Agenda configurada" cuando ya está guardada
// - Botón "Finalizar" habilitado cuando TODOS los centros tienen agenda

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paso1DatosBasicos from './Paso1DatosBasicos';
import Paso2Profesionales from './Paso2Profesionales';
import Paso3Agenda from './Paso3Agenda';
import { Paso1Result, Paso2Result } from '../../services/apiWizard';
import styles from './wizard.module.css';

type WizardStep = 1 | 2 | 3;
type SubStep = 'resumen' | 'configurar';

export default function SolicitarAgendaWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [subStep, setSubStep] = useState<SubStep>('resumen');
  const [paso1Data, setPaso1Data] = useState<Paso1Result | null>(null);
  const [paso2Data, setPaso2Data] = useState<Paso2Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarConfirmacionCancelar, setMostrarConfirmacionCancelar] = useState(false);
  const [agendasConfiguradas, setAgendasConfiguradas] = useState<Set<number>>(new Set());
  const [centroSeleccionado, setCentroSeleccionado] = useState<number | null>(null);
  const [mostrarExitoFinal, setMostrarExitoFinal] = useState(false);

  // Obtener los IDs de los centros
  const centrosIds = paso1Data?.centros?.map(c => c.id) || [];

  // Verificar si todos los centros tienen agenda configurada
  const todosLosCentrosConfigurados = centrosIds.length > 0 && centrosIds.every(id => agendasConfiguradas.has(id));

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
    setSubStep('resumen');
    setError(null);
    console.log('✅ Relaciones profesional-centro creadas:', data.profesionalCentroIds?.length || 0);
  };

  const handlePaso2Error = (err: string) => {
    setError(err);
  };

  const handlePaso3Success = (centroId: number) => {
    // Marcar el centro como configurado
    setAgendasConfiguradas(prev => new Set(prev).add(centroId));
    setSubStep('resumen');
    setCentroSeleccionado(null);
    setError(null);
    console.log(`✅ Agenda configurada para centro ${centroId}`);
  };

  const handleVolver = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      if (subStep === 'configurar') {
        // Volver al resumen desde la configuración
        setSubStep('resumen');
        setCentroSeleccionado(null);
        return;
      }
      // Si estamos en el resumen y hay agendas configuradas
      if (agendasConfiguradas.size > 0) {
        if (window.confirm('Ya has configurado algunas agendas. ¿Estás seguro que deseas volver? Perderás los cambios.')) {
          setStep(2);
          setAgendasConfiguradas(new Set());
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

  const handleFinalizar = () => {
    setMostrarExitoFinal(true);
  };

  const cerrarExitoFinal = () => {
    setMostrarExitoFinal(false);
    navigate('/');
  };

  const handleConfigurarAgenda = (centroId: number) => {
    setCentroSeleccionado(centroId);
    setSubStep('configurar');
  };

  // Función para formatear domicilio (igual que en Paso 1)
  const formatearDireccion = (centro: any): string => {
    if (!centro) return 'Sin domicilio';
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

        // Sub-paso: Configurar agenda para un centro específico
        if (subStep === 'configurar' && centroSeleccionado !== null) {
          return (
            <Paso3Agenda
              paso1Data={paso1Data}
              paso2Data={paso2Data}
              centroId={centroSeleccionado}
              onBack={() => {
                setSubStep('resumen');
                setCentroSeleccionado(null);
              }}
              onSuccess={handlePaso3Success}
            />
          );
        }

        // Sub-paso: Resumen de centros
        return renderResumenCentros();
      default:
        return null;
    }
  };

  // 👈 NUEVO: Resumen de centros con botones "Configurar Agenda"
  const renderResumenCentros = () => {
    const profesionalNombre = paso2Data?.profesional?.nombre || 'Profesional';
    const especialidadNombre = paso2Data?.especialidad?.nombre || 'Especialidad';
    const nombreNegocio = paso1Data?.negocio?.nombre || 'Negocio';

    return (
      <div className={styles['wizard-container-page']}>
        <div className={styles['wizard-left']}>
          <div className={styles['wizard-left-content']}>
            <div className={styles['wizard-card']}>
              <h2 className={styles.title}>Paso 3: Configurar Agenda</h2>

              {/* Resumen del negocio */}
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
                  <span className={styles.resumenLabel}>🏢 Centros:</span>
                  <span className={styles.resumenValor}>
                    {centrosIds.length} centros
                    {todosLosCentrosConfigurados && ' ✅ Todos configurados'}
                  </span>
                </div>
              </div>

              {/* Lista de centros con botones */}
              <div className={styles.centrosAgendaLista}>
                {paso1Data?.centros?.map((centro, index) => {
                  const estaConfigurado = agendasConfiguradas.has(centro.id);
                  const direccion = formatearDireccion(centro);

                  return (
                    <div key={centro.id} className={styles.centroAgendaItem}>
                      <span className={styles.centroAgendaNumero}>#{index + 1}</span>
                      <span className={styles.centroAgendaId}>
                        {centro.codigo} - {direccion}
                      </span>
                      {estaConfigurado ? (
                        <span className={styles.agendaGuardadaBadge}>✅ Agenda configurada</span>
                      ) : (
                        <button
                          className={styles.buttonSmall}
                          onClick={() => handleConfigurarAgenda(centro.id)}
                        >
                          Configurar Agenda
                        </button>
                      )}
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
                  disabled={!todosLosCentrosConfigurados}
                  style={{ opacity: todosLosCentrosConfigurados ? 1 : 0.5 }}
                >
                  {todosLosCentrosConfigurados ? '✅ Finalizar' : 'Configura todas las agendas para finalizar'}
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

      {/* Modal de éxito final */}
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
