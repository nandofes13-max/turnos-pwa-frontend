// src/components/SolicitarAgendaWizard/index.tsx
// Wizard principal - Sin overlay, layout consistente con Inicio
// VERSIÓN CON RESUMEN DE CENTROS Y CONFIGURACIÓN POR CENTRO
// - Paso 3: resumen de todos los centros con botones "Configurar Agenda"
// - Al hacer clic, se abre la configuración para ese centro específico
// - Indicador "✅ Agenda configurada" cuando ya está guardada
// - Botón "Finalizar" habilitado cuando AL MENOS UNA agenda está configurada
// - Advertencia si faltan centros por configurar
// - Modal de Términos y Condiciones con scroll obligatorio al finalizar

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Paso1DatosBasicos from './Paso1DatosBasicos';
import Paso2Profesionales from './Paso2Profesionales';
import Paso3Agenda from './Paso3Agenda';
import { Paso1Result, Paso2Result } from '../../services/apiWizard';
import styles from './wizard.module.css';

type WizardStep = 1 | 2 | 3;
type SubStep = 'resumen' | 'configurar';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
  const [profesionalCentroSeleccionado, setProfesionalCentroSeleccionado] = useState<number | null>(null);
  const [mostrarExitoFinal, setMostrarExitoFinal] = useState(false);
  const [mostrarAdvertenciaFinalizar, setMostrarAdvertenciaFinalizar] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  
  // 👈 NUEVO: Estado para el modal de Términos y Condiciones
  const [mostrarModalTerminos, setMostrarModalTerminos] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [terminosScrollAlFinal, setTerminosScrollAlFinal] = useState(false);
  const terminosContainerRef = useRef<HTMLDivElement>(null);

  const centrosIds = paso1Data?.centros?.map(c => c.id) || [];
  const todosLosCentrosConfigurados = centrosIds.length > 0 && centrosIds.every(id => agendasConfiguradas.has(id));
  const alMenosUnaAgendaConfigurada = agendasConfiguradas.size > 0;
  const centrosFaltantes = centrosIds.filter(id => !agendasConfiguradas.has(id));

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
    setAgendasConfiguradas(prev => new Set(prev).add(centroId));
    setSubStep('resumen');
    setCentroSeleccionado(null);
    setProfesionalCentroSeleccionado(null);
    setError(null);
    console.log(`✅ Agenda configurada para centro ${centroId}`);
  };

  const handleVolver = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      if (subStep === 'configurar') {
        setSubStep('resumen');
        setCentroSeleccionado(null);
        setProfesionalCentroSeleccionado(null);
        return;
      }
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

  // 👈 NUEVO: Manejo del scroll en el modal de términos
  const handleScrollTerminos = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const scrolledToEnd = scrollTop + clientHeight >= scrollHeight - 10;
    
    setTerminosScrollAlFinal(scrolledToEnd);
  };

  // 👈 NUEVO: Abrir el modal de términos
  const abrirModalTerminos = () => {
    setTerminosScrollAlFinal(false);
    setTerminosAceptados(false);
    setMostrarModalTerminos(true);
    // Resetear scroll al abrir el modal
    setTimeout(() => {
      if (terminosContainerRef.current) {
        terminosContainerRef.current.scrollTop = 0;
      }
    }, 100);
  };

  // 👈 NUEVO: Aceptar términos y continuar
  const aceptarTerminos = () => {
    setTerminosAceptados(true);
    setMostrarModalTerminos(false);
    // Continuar con el proceso de finalización
    ejecutarFinalizacion();
  };

  // 👈 NUEVO: Ejecutar la finalización (después de aceptar términos)
  const ejecutarFinalizacion = async () => {
    // Mostrar éxito y enviar email
    setMostrarExitoFinal(true);
    await enviarEmailBienvenida();
  };

  // Enviar email de bienvenida
  const enviarEmailBienvenida = async () => {
    if (!paso1Data?.negocio || !paso1Data?.usuario) {
      console.warn('⚠️ No se puede enviar email: faltan datos del negocio o usuario');
      return;
    }

    setEnviandoEmail(true);

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/bienvenida-negocio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: paso1Data.usuario.email,
          nombreNegocio: paso1Data.negocio.nombre,
          urlPublica: `${window.location.origin}/negocio/${paso1Data.negocio.url}`,
          urlGestion: `${window.location.origin}/gestion/turnos/${paso1Data.negocio.urlGestion}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error enviando email de bienvenida:', data);
      } else {
        console.log('✅ Email de bienvenida enviado correctamente');
      }
    } catch (error) {
      console.error('❌ Error en el envío del email de bienvenida:', error);
    } finally {
      setEnviandoEmail(false);
    }
  };

  // 👈 NUEVO: Manejo del botón "Finalizar" - abre modal de términos
  const handleFinalizar = () => {
    if (!todosLosCentrosConfigurados) {
      setMostrarAdvertenciaFinalizar(true);
    } else {
      // Si todos los centros están configurados, abrir modal de términos
      abrirModalTerminos();
    }
  };

  const confirmarFinalizar = () => {
    setMostrarAdvertenciaFinalizar(false);
    // Al confirmar la advertencia, abrir modal de términos
    abrirModalTerminos();
  };

  const cancelarFinalizar = () => {
    setMostrarAdvertenciaFinalizar(false);
  };

  const cerrarExitoFinal = () => {
    setMostrarExitoFinal(false);
    navigate('/');
  };

  const handleConfigurarAgenda = (centroId: number) => {
    const index = paso1Data?.centros?.findIndex(c => c.id === centroId) ?? -1;
    if (index === -1) {
      console.error('Centro no encontrado');
      return;
    }
    const profesionalCentroId = paso2Data?.profesionalCentroIds?.[index] ?? 0;
    if (profesionalCentroId === 0) {
      console.error('No se encontró profesionalCentroId para el centro', centroId);
      return;
    }
    
    setCentroSeleccionado(centroId);
    setProfesionalCentroSeleccionado(profesionalCentroId);
    setSubStep('configurar');
  };

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

        if (subStep === 'configurar' && centroSeleccionado !== null && profesionalCentroSeleccionado !== null) {
          return (
            <Paso3Agenda
              paso1Data={paso1Data}
              paso2Data={paso2Data}
              centroId={centroSeleccionado}
              profesionalCentroId={profesionalCentroSeleccionado}
              onBack={() => {
                setSubStep('resumen');
                setCentroSeleccionado(null);
                setProfesionalCentroSeleccionado(null);
              }}
              onSuccess={handlePaso3Success}
            />
          );
        }

        return renderResumenCentros();
      default:
        return null;
    }
  };

  // Resumen de centros con botones "Configurar Agenda"
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
                    {!todosLosCentrosConfigurados && alMenosUnaAgendaConfigurada && ` (${agendasConfiguradas.size} configurados)`}
                  </span>
                </div>
              </div>

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
                  disabled={!alMenosUnaAgendaConfigurada || enviandoEmail}
                  style={{ opacity: alMenosUnaAgendaConfigurada && !enviandoEmail ? 1 : 0.5 }}
                >
                  {enviandoEmail ? 'Enviando correo...' : 'Finalizar'}
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

      {/* Modal de advertencia para finalizar (faltan agendas) */}
      {mostrarAdvertenciaFinalizar && (
        <div className={styles.modalConfirmacionOverlay} onClick={cancelarFinalizar}>
          <div className={styles.modalConfirmacion} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalConfirmacionTitulo}>⚠️ Faltan configurar agendas</h3>
            <p className={styles.modalConfirmacionMensaje}>
              {centrosFaltantes.length > 0 && (
                <>
                  Faltan configurar agendas para {centrosFaltantes.length} centro(s).
                  <br />
                  <br />
                  <strong>Centros pendientes:</strong>
                  <br />
                  {centrosFaltantes.map(id => {
                    const centro = paso1Data?.centros?.find(c => c.id === id);
                    return centro ? `• ${centro.codigo} - ${centro.nombre}` : null;
                  }).filter(Boolean).join('\n')}
                  <br />
                  <br />
                  ¿Está seguro que desea finalizar? No podrá volver atrás para cargar las agendas faltantes.
                </>
              )}
            </p>
            <div className={styles.modalConfirmacionBotones}>
              <button className={styles.buttonSecondary} onClick={cancelarFinalizar}>
                Seguir configurando
              </button>
              <button className={styles.buttonDanger} onClick={confirmarFinalizar}>
                Sí, finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👈 NUEVO: Modal de Términos y Condiciones con scroll obligatorio */}
      {mostrarModalTerminos && (
        <div className={styles.modalConfirmacionOverlay} onClick={() => {}}>
          <div className={styles.modalConfirmacion} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3 className={styles.modalConfirmacionTitulo}>📜 Términos y Condiciones</h3>
            <p className={styles.modalConfirmacionMensaje} style={{ fontSize: '14px', color: '#6b7280' }}>
              Por favor, lee los términos y condiciones antes de continuar.
              <br />
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {terminosScrollAlFinal ? '✅ Has llegado al final del documento' : '📄 Desplázate hasta el final para continuar'}
              </span>
            </p>
            
            {/* Contenedor con scroll */}
            <div 
              ref={terminosContainerRef}
              onScroll={handleScrollTerminos}
              style={{ 
                maxHeight: '350px', 
                overflowY: 'auto',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#374151'
              }}
            >
              <p><strong>Última actualización:</strong> Junio de 2026</p>
              <p>Bienvenido a <strong>PWA - Turnos</strong>.</p>
              <p>Al registrarte o utilizar esta plataforma aceptas los presentes Términos y Condiciones.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>1. Objeto del servicio</h4>
              <p>PWA - Turnos es una plataforma que permite a profesionales, comercios y organizaciones administrar agendas y gestionar reservas de turnos realizadas por sus clientes.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>2. Uso de la plataforma</h4>
              <p>El usuario se compromete a utilizar la plataforma de manera responsable, respetando la legislación vigente y los derechos de terceros.</p>
              <p>No está permitido utilizar el servicio para actividades ilícitas, fraudulentas o que puedan perjudicar a otros usuarios o al funcionamiento de la plataforma.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>3. Responsabilidad del usuario</h4>
              <p>Cada usuario es responsable de la información que registra y mantiene dentro de su cuenta, así como de la confidencialidad de sus credenciales de acceso.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>4. Responsabilidad del servicio</h4>
              <p>PWA - Turnos actúa únicamente como una herramienta tecnológica para la gestión de turnos.</p>
              <p>La plataforma no presta servicios médicos, veterinarios, estéticos, deportivos, profesionales ni comerciales, y no participa en la relación entre el profesional o negocio y sus clientes.</p>
              <p>Cada profesional o negocio es el único responsable de los servicios que ofrece y de la información publicada.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>5. Disponibilidad</h4>
              <p>Se realizan esfuerzos para mantener el servicio disponible de forma continua. Sin embargo, pueden producirse interrupciones por tareas de mantenimiento, actualizaciones, fallas técnicas o causas ajenas al control de la plataforma.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>6. Propiedad intelectual</h4>
              <p>El software, diseño, logotipos, código fuente, textos e identidad visual de PWA - Turnos son propiedad de sus titulares y no podrán copiarse, modificarse o distribuirse sin autorización.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>7. Modificaciones</h4>
              <p>Estos Términos y Condiciones podrán actualizarse cuando resulte necesario. Las modificaciones entrarán en vigencia desde su publicación en la plataforma.</p>
              
              <h4 style={{ marginTop: '16px', marginBottom: '4px' }}>8. Contacto</h4>
              <p>Para consultas relacionadas con estos términos podrás comunicarte mediante los canales de contacto disponibles dentro de la aplicación.</p>
              
              <div style={{ height: '20px' }} />
              <p style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Fin del documento</p>
            </div>
            
            <div className={styles.modalConfirmacionBotones}>
              <button 
                className={styles.buttonSecondary} 
                onClick={() => setMostrarModalTerminos(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.buttonPrimary} 
                onClick={aceptarTerminos}
                disabled={!terminosScrollAlFinal}
                style={{ opacity: terminosScrollAlFinal ? 1 : 0.5 }}
              >
                {terminosScrollAlFinal ? '✅ Aceptar' : '📄 Lee hasta el final'}
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
                <a
                  href={`${window.location.origin}/negocio/${paso1Data?.negocio?.url || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', wordBreak: 'break-all', textDecoration: 'underline' }}
                >
                  {`${window.location.origin}/negocio/${paso1Data?.negocio?.url || ''}`}
                </a>
              </p>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>⚙️ Link de Gestión (para administrar):</strong>
                <br />
                <a
                  href={`${window.location.origin}/gestion/turnos/${paso1Data?.negocio?.urlGestion || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', wordBreak: 'break-all', textDecoration: 'underline' }}
                >
                  {`${window.location.origin}/gestion/turnos/${paso1Data?.negocio?.urlGestion || ''}`}
                </a>
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
