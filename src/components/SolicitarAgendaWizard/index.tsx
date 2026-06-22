// src/components/SolicitarAgendaWizard/index.tsx
// Wizard principal - Sin overlay, layout consistente con Inicio
// VERSIÓN MODIFICADA:
// - Agregado nombre del negocio en el resumen del Paso 3
// - Muestra domicilio del centro en lugar de "Relación ID"
// - Botón "Finalizar" deshabilitado (hasta implementar agenda)
// - Botón "Volver al Paso 2" → "CANCELAR" con doble aviso
// - Eliminado logo en cabecera móvil del Paso 3

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paso1DatosBasicos from './Paso1DatosBasicos';
import Paso2Profesionales from './Paso2Profesionales';
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

  const handleVolver = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
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

  // 👈 NUEVO: Función para formatear domicilio (igual que en Paso 1)
  const formatearDireccion = (centro: any): string => {
    if (centro.es_virtual) {
      return 'Virtual';
    }
    const calleCompleta = `${centro.street || ''} ${centro.street_number || ''}`.trim();
    return `${calleCompleta}, ${centro.city || ''}, ${centro.country || ''}`;
  };

  // 👈 NUEVO: Obtener centro por ID
  const obtenerCentroPorId = (centroId: number) => {
    if (!paso1Data?.centros) return null;
    return paso1Data.centros.find(c => c.id === centroId);
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
        // Verificar que tenemos los datos del Paso 1
        if (!paso1Data) {
          // Si no hay datos, volver al Paso 1
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
        // Paso 3: Configurar Agenda
        const relacionesCreadas = paso2Data?.profesionalCentroIds?.length || 0;
        const profesionalNombre = paso2Data?.profesional?.nombre || 'Profesional';
        const especialidadNombre = paso2Data?.especialidad?.nombre || 'Especialidad';
        const nombreNegocio = paso1Data?.negocio?.nombre || 'Negocio';
        
        return (
          <div className={styles['wizard-container-page']}>
            <div className={styles['wizard-left']}>
              <div className={styles['wizard-left-content']}>
                {/* 👈 LOGO ELIMINADO: ya no se muestra en móviles */}
                <div className={styles['wizard-card']}>
                  <h2 className={styles.title}>Paso 3: Configurar Agenda</h2>
                  
                  {/* Resumen de lo que se creó en el Paso 2 */}
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
                  
                  {relacionesCreadas > 0 ? (
                    <>
                      <p className={styles.subtitle}>
                        Configurá los días y horarios de atención para cada centro.
                      </p>
                      <div className={styles.centrosAgendaLista}>
                        {paso2Data?.profesionalCentroIds?.map((id, index) => {
                          // 👈 Obtener el centro correspondiente a esta relación
                          // Nota: necesitamos mapear profesionalCentroId → centroId
                          // Por ahora, usamos el índice para buscar en los centros
                          // En la implementación final, deberíamos tener un mapa
                          const centro = paso1Data?.centros?.[index] || null;
                          const direccion = centro ? formatearDireccion(centro) : 'Centro sin dirección';
                          
                          return (
                            <div key={id} className={styles.centroAgendaItem}>
                              <span className={styles.centroAgendaNumero}>#{index + 1}</span>
                              <span className={styles.centroAgendaId}>{direccion}</span>
                              <button className={styles.buttonSmall}>
                                Configurar Agenda
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className={styles.mensajeAdvertencia}>
                      ⚠️ No se encontraron centros para asignar agenda.
                      <br />
                      <small>Verificá que el negocio tenga centros activos.</small>
                    </div>
                  )}
                  
                  <div className={styles.buttonsContainer}>
                    <button 
                      className={styles.buttonSecondary} 
                      onClick={handleCancelar}  // 👈 CAMBIADO: ahora llama a handleCancelar
                    >
                      CANCELAR
                    </button>
                    <button 
                      className={styles.buttonPrimary} 
                      onClick={handleVolverInicio}
                      disabled={true}  // 👈 DESHABILITADO hasta tener agenda
                    >
                      Finalizar
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
      
      {/* 👈 NUEVO: Modal de confirmación para CANCELAR */}
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
