// src/components/SolicitarAgendaWizard/Paso3Agenda.tsx
// Paso 3 del Wizard: Configurar Agenda
// - Permite agregar bloques horarios (día, duración, desde, hasta)
// - Validación en cascada (igual que AgendaDisponibilidad.tsx)
// - Lista de bloques con expansión para ver horarios
// - Guardado mediante POST /agenda-disponibilidad/guardar-lote

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paso1Result, Paso2Result } from '../../services/apiWizard';
import styles from './wizard.module.css';

interface Paso3AgendaProps {
  paso1Data: Paso1Result;
  paso2Data: Paso2Result;
  onBack: () => void;
  onSuccess?: () => void;
}

interface BloqueHorario {
  id?: number;
  profesionalCentroId: number;
  diaSemana: number;
  horaDesde: string;
  horaHasta: string;
  duracionTurno: number;
  bufferMinutos: number;
  fechaDesde: string;
  fechaHasta: string | null;
  fecha_baja?: string | null;
  timezone?: string;
}

interface BloqueLocal {
  id: number;
  diaSemana: number;
  horaDesde: string;
  horaHasta: string;
  duracionTurno: number;
  fechaDesde: string;
  fechaHasta: string | null;
  horarios: string[];
  timezone: string;
  expandido: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DIAS_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const normalizarHora = (hora: string): string => {
  if (!hora) return hora;
  return hora.substring(0, 5);
};

const generarOpcionesHora = (duracion: number): string[] => {
  const opciones: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += duracion) {
      opciones.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return opciones;
};

const generarHorariosLocal = (desde: string, hasta: string, duracion: number): string[] => {
  const horarios: string[] = [];
  let horaActual = normalizarHora(desde);
  const horaFin = normalizarHora(hasta);
  let contador = 0;
  const maxIteraciones = 100;

  while (horaActual < horaFin && contador < maxIteraciones) {
    horarios.push(horaActual);
    contador++;

    const [h, m] = horaActual.split(':').map(Number);
    let minutos = m + duracion;
    let horas = h;
    if (minutos >= 60) {
      horas += Math.floor(minutos / 60);
      minutos = minutos % 60;
    }
    horaActual = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  return horarios;
};

const calcularHoraMinima = (desde: string, duracion: number): string => {
  const [h, m] = normalizarHora(desde).split(':').map(Number);
  let minutos = m + duracion;
  let horas = h;
  if (minutos >= 60) {
    horas += Math.floor(minutos / 60);
    minutos = minutos % 60;
  }
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
};

const generarOpcionesHasta = (desde: string, duracion: number): string[] => {
  if (!desde || duracion <= 0) return [];

  const opciones: string[] = [];
  const [desdeH, desdeM] = normalizarHora(desde).split(':').map(Number);
  let minutos = desdeH * 60 + desdeM + duracion;

  while (minutos <= 23 * 60 + 59) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    opciones.push(`${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    minutos += duracion;
  }

  return opciones;
};

const formatearTimezone = (tz: string | undefined): string => {
  if (!tz) return 'No definida';
  const parts = tz.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const region = parts.length > 1 ? parts[parts.length - 2] : '';
  if (region && region !== city) {
    return `${city} (${region}) - ${tz}`;
  }
  return `${city} - ${tz}`;
};

const Paso3Agenda: React.FC<Paso3AgendaProps> = ({
  paso1Data,
  paso2Data,
  onBack,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [bloques, setBloques] = useState<BloqueLocal[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mostrarConfirmacionCancelar, setMostrarConfirmacionCancelar] = useState(false);

  // Campos del formulario
  const [nuevoDiaUI, setNuevoDiaUI] = useState<number | null>(null);
  const [nuevoDesde, setNuevoDesde] = useState('');
  const [nuevoHasta, setNuevoHasta] = useState('');
  const [nuevaDuracion, setNuevaDuracion] = useState(0);
  const [otraDuracion, setOtraDuracion] = useState('');
  const [mostrarOtraDuracion, setMostrarOtraDuracion] = useState(false);
  const [opcionesHora, setOpcionesHora] = useState<string[]>([]);
  const [duracionValida, setDuracionValida] = useState(false);
  const [desdeSeleccionado, setDesdeSeleccionado] = useState(false);

  // Obtener el profesionalCentroId
  const profesionalCentroId = paso2Data?.profesionalCentroIds?.[0] || 0;

  // Obtener el timezone del centro
  const timezone = paso1Data?.centros?.[0]?.timezone || 'America/Argentina/Buenos_Aires';

  // Efecto para generar opciones de hora cuando cambia la duración
  useEffect(() => {
    let duracion = nuevaDuracion;
    if (mostrarOtraDuracion && otraDuracion) {
      duracion = parseInt(otraDuracion);
    }
    if (duracion && duracion > 0) {
      setOpcionesHora(generarOpcionesHora(duracion));
      setDuracionValida(true);
      setNuevoDesde('');
      setNuevoHasta('');
      setDesdeSeleccionado(false);
    } else {
      setOpcionesHora([]);
      setDuracionValida(false);
      setDesdeSeleccionado(false);
      setNuevoDesde('');
      setNuevoHasta('');
    }
  }, [nuevaDuracion, otraDuracion, mostrarOtraDuracion]);

  // Efecto para validar Desde cuando cambia
  useEffect(() => {
    if (duracionValida) {
      setDesdeSeleccionado(!!nuevoDesde && nuevoDesde !== '');
      const duracion = obtenerDuracionFinal();
      if (duracion > 0 && nuevoDesde && nuevoDesde !== '') {
        const horaMinima = calcularHoraMinima(nuevoDesde, duracion);
        if (nuevoHasta < horaMinima) {
          setNuevoHasta(horaMinima);
        }
      }
    }
  }, [nuevoDesde, duracionValida]);

  const obtenerDuracionFinal = () => {
    let duracion = mostrarOtraDuracion ? parseInt(otraDuracion) : nuevaDuracion;
    return isNaN(duracion) || duracion <= 0 ? 0 : duracion;
  };

  const validarHorario = (): boolean => {
    if (nuevoDiaUI === null) {
      setErrorMessage('Seleccione un día');
      return false;
    }
    if (!nuevoDesde || !nuevoHasta) {
      setErrorMessage('Complete los horarios');
      return false;
    }
    if (nuevoDesde >= nuevoHasta) {
      setErrorMessage('La hora "Desde" debe ser menor a la hora "Hasta"');
      return false;
    }

    const duracionFinal = obtenerDuracionFinal();
    if (!duracionFinal || duracionFinal <= 0) {
      setErrorMessage('La duración del turno debe ser mayor a 0');
      return false;
    }

    const [desdeH, desdeM] = nuevoDesde.split(':').map(Number);
    const [hastaH, hastaM] = nuevoHasta.split(':').map(Number);
    const minutosTotales = (hastaH * 60 + hastaM) - (desdeH * 60 + desdeM);
    if (minutosTotales < duracionFinal) {
      setErrorMessage(`El rango horario es menor a la duración del turno (${duracionFinal} min)`);
      return false;
    }

    // Verificar que la duración divida exactamente el rango
    if (minutosTotales % duracionFinal !== 0) {
      setErrorMessage(
        `La duración del turno (${duracionFinal} min) no divide exactamente el rango horario de ${minutosTotales} minutos.`
      );
      return false;
    }

    // Verificar solapamiento con bloques existentes
    const nuevoDiaBD = nuevoDiaUI;
    const bloqueSolapado = bloques.find(bloque => {
      const mismoDia = bloque.diaSemana === nuevoDiaBD;
      if (!mismoDia) return false;
      const solapa = nuevoDesde < bloque.horaHasta && nuevoHasta > bloque.horaDesde;
      return solapa;
    });

    if (bloqueSolapado) {
      const nombreDia = DIAS_COMPLETO[nuevoDiaUI];
      setErrorMessage(
        `❌ SOLAPAMIENTO: Ya existe un bloque para ${nombreDia} con horario ${bloqueSolapado.horaDesde} a ${bloqueSolapado.horaHasta}`
      );
      return false;
    }

    // Verificar duplicado exacto
    const duplicado = bloques.find(bloque => {
      return (
        bloque.diaSemana === nuevoDiaBD &&
        bloque.horaDesde === nuevoDesde &&
        bloque.horaHasta === nuevoHasta &&
        bloque.duracionTurno === duracionFinal
      );
    });

    if (duplicado) {
      const nombreDia = DIAS_COMPLETO[nuevoDiaUI];
      setErrorMessage(`❌ Ya existe un bloque para ${nombreDia} con el mismo horario y duración.`);
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const agregarBloque = () => {
    if (!validarHorario()) return;

    const duracionFinal = obtenerDuracionFinal();
    const diaBD = nuevoDiaUI!;
    const nombreDia = DIAS_COMPLETO[diaBD];
    const fechaActual = new Date().toISOString().split('T')[0];

    const horarios = generarHorariosLocal(nuevoDesde, nuevoHasta, duracionFinal);

    const nuevoBloque: BloqueLocal = {
      id: Date.now(),
      diaSemana: diaBD,
      horaDesde: normalizarHora(nuevoDesde),
      horaHasta: normalizarHora(nuevoHasta),
      duracionTurno: duracionFinal,
      fechaDesde: fechaActual,
      fechaHasta: null,
      horarios: horarios,
      timezone: timezone,
      expandido: false,
    };

    setBloques(prev => [...prev, nuevoBloque]);

    // Resetear campos
    setNuevoDiaUI(null);
    setNuevoDesde('');
    setNuevoHasta('');
    setNuevaDuracion(0);
    setMostrarOtraDuracion(false);
    setOtraDuracion('');
    setErrorMessage(null);

    alert(`✅ Bloque agregado correctamente para ${nombreDia}`);
  };

  const toggleExpandirBloque = (id: number) => {
    setBloques(prev =>
      prev.map(bloque =>
        bloque.id === id ? { ...bloque, expandido: !bloque.expandido } : bloque
      )
    );
  };

  const eliminarBloque = (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este bloque?')) return;
    setBloques(prev => prev.filter(bloque => bloque.id !== id));
  };

  const guardarAgenda = async () => {
    if (bloques.length === 0) {
      alert('⚠️ Debe agregar al menos un bloque horario antes de guardar.');
      return;
    }

    if (!window.confirm(`¿Está seguro de guardar ${bloques.length} bloque(s) en la agenda?`)) return;

    setGuardando(true);
    setErrorMessage(null);

    // Preparar payload para el backend
    const payload = {
      bloques: bloques.map(bloque => ({
        profesionalCentroId: profesionalCentroId,
        diaSemana: bloque.diaSemana,
        horaDesde: bloque.horaDesde,
        horaHasta: bloque.horaHasta,
        duracionTurno: bloque.duracionTurno,
        bufferMinutos: 0,
        fechaDesde: bloque.fechaDesde,
        fechaHasta: bloque.fechaHasta,
        fecha_baja: null,
        timezone: bloque.timezone,
      })),
    };

    console.log('📦 Enviando lote de bloques:', payload);

    try {
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/guardar-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessageText = '';
        try {
          const errorData = await response.json();
          errorMessageText = errorData.message || response.statusText;
        } catch (e) {
          errorMessageText = response.statusText || `Error ${response.status}`;
        }
        throw new Error(errorMessageText);
      }

      alert('✅ Agenda guardada correctamente');

      // Volver al resumen del Paso 3
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    } catch (err: any) {
      console.error('Error guardando agenda:', err);
      setErrorMessage(err.message || 'Error al guardar la agenda');
      alert(`❌ ${err.message || 'Error al guardar la agenda'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    if (bloques.length > 0) {
      setMostrarConfirmacionCancelar(true);
    } else {
      onBack();
    }
  };

  const confirmarCancelar = () => {
    setMostrarConfirmacionCancelar(false);
    onBack();
  };

  const cancelarCancelar = () => {
    setMostrarConfirmacionCancelar(false);
  };

  // Obtener datos para el contexto
  const negocio = paso1Data?.negocio;
  const especialidad = paso2Data?.especialidad;
  const profesional = paso2Data?.profesional;
  const centro = paso1Data?.centros?.[0];

  return (
    <div className={styles['wizard-container-page']}>
      <div className={styles['wizard-left']}>
        <div className={styles['wizard-left-content']}>
          <div className={styles['wizard-card']}>
            <h2 className={styles.title}>Configurar Agenda</h2>

            {/* Contexto del negocio */}
            <div className={styles.resumenPaso2}>
              <div className={styles.resumenItem}>
                <span className={styles.resumenLabel}>🏢 Negocio:</span>
                <span className={styles.resumenValor}>
                  {negocio?.nombre} ({negocio?.url})
                </span>
              </div>
              <div className={styles.resumenItem}>
                <span className={styles.resumenLabel}>📋 Especialidad:</span>
                <span className={styles.resumenValor}>{especialidad?.nombre}</span>
              </div>
              <div className={styles.resumenItem}>
                <span className={styles.resumenLabel}>👤 Profesional:</span>
                <span className={styles.resumenValor}>
                  {profesional?.nombre} (DNI: {profesional?.documento})
                </span>
              </div>
              <div className={styles.resumenItem}>
                <span className={styles.resumenLabel}>🏥 Centro:</span>
                <span className={styles.resumenValor}>
                  {centro?.codigo} - {centro?.nombre} - {centro?.formatted_address || 'Sin domicilio'}
                </span>
              </div>
              <div className={styles.resumenItem}>
                <span className={styles.resumenLabel}>🕒 Zona horaria:</span>
                <span className={styles.resumenValor}>{formatearTimezone(timezone)}</span>
              </div>
            </div>

            {/* Formulario de alta */}
            <div className={styles.agendaFormSection}>
              <h3 className={styles.agendaFormTitle}>Agregar Bloque Horario</h3>

              {errorMessage && (
                <div className={styles.mensajeError}>{errorMessage}</div>
              )}

              <div className={styles.agendaFormRow}>
                <div className={styles.agendaFormField}>
                  <label className={styles.agendaFormLabel}>Día</label>
                  <select
                    value={nuevoDiaUI !== null ? nuevoDiaUI : ''}
                    onChange={(e) => setNuevoDiaUI(parseInt(e.target.value))}
                    className={styles.agendaFormInput}
                  >
                    <option value="" disabled>Seleccionar día...</option>
                    {DIAS_COMPLETO.map((dia, idx) => (
                      <option key={idx} value={idx}>{dia}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.agendaFormField}>
                  <label className={styles.agendaFormLabel}>Duración (min)</label>
                  <select
                    value={nuevaDuracion}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val === 0) {
                        setMostrarOtraDuracion(true);
                        setNuevaDuracion(0);
                      } else {
                        setNuevaDuracion(val);
                        setMostrarOtraDuracion(false);
                      }
                    }}
                    className={styles.agendaFormInput}
                  >
                    <option value={0} disabled>Seleccionar duración...</option>
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={0}>Otro</option>
                  </select>
                  {mostrarOtraDuracion && (
                    <input
                      type="number"
                      placeholder="Ingrese duración"
                      value={otraDuracion}
                      onChange={(e) => setOtraDuracion(e.target.value)}
                      className={styles.agendaFormInput}
                      style={{ marginTop: '4px' }}
                    />
                  )}
                </div>

                <div className={styles.agendaFormField}>
                  <label className={styles.agendaFormLabel}>Desde</label>
                  <select
                    value={nuevoDesde || ''}
                    onChange={(e) => setNuevoDesde(e.target.value)}
                    className={styles.agendaFormInput}
                    disabled={!duracionValida}
                  >
                    <option value="" disabled>Seleccionar hora...</option>
                    {opcionesHora.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.agendaFormField}>
                  <label className={styles.agendaFormLabel}>Hasta</label>
                  <select
                    value={nuevoHasta || ''}
                    onChange={(e) => setNuevoHasta(e.target.value)}
                    className={styles.agendaFormInput}
                    disabled={!duracionValida || !desdeSeleccionado}
                  >
                    <option value="" disabled>Seleccionar hora...</option>
                    {desdeSeleccionado && nuevoDesde && duracionValida && (
                      generarOpcionesHasta(nuevoDesde, obtenerDuracionFinal()).map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className={styles.agendaFormField} style={{ justifyContent: 'flex-end' }}>
                  <button
                    onClick={agregarBloque}
                    className={styles.buttonAgregarBloque}
                  >
                    ➕ Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de bloques */}
            {bloques.length > 0 && (
              <div className={styles.agendaBloquesLista}>
                <h3 className={styles.agendaBloquesTitle}>Bloques agregados ({bloques.length})</h3>
                {bloques.map((bloque, idx) => {
                  const nombreDia = DIAS_COMPLETO[bloque.diaSemana];
                  const estaExpandido = bloque.expandido;

                  return (
                    <div key={bloque.id} className={styles.agendaBloqueItem}>
                      <div className={styles.agendaBloqueHeader}>
                        <div className={styles.agendaBloqueInfo}>
                          <span className={styles.agendaBloqueNumero}>#{idx + 1}</span>
                          <span>
                            <strong>{nombreDia}:</strong> {bloque.horaDesde} a {bloque.horaHasta} |
                            <strong> Duración:</strong> {bloque.duracionTurno} min
                          </span>
                        </div>
                        <div className={styles.agendaBloqueAcciones}>
                          <button
                            onClick={() => toggleExpandirBloque(bloque.id)}
                            className={styles.buttonSmall}
                          >
                            {estaExpandido ? '▲ Ocultar Horarios' : '▼ Ver Horarios'}
                          </button>
                          <button
                            onClick={() => eliminarBloque(bloque.id)}
                            className={styles.buttonEliminar}
                            title="Eliminar bloque"
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                      {estaExpandido && (
                        <div className={styles.agendaHorariosContainer}>
                          <div className={styles.agendaHorariosGrid}>
                            {bloque.horarios.map((horario, hIdx) => (
                              <span key={hIdx} className={styles.agendaHorarioSlot}>
                                {horario}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botones de acción */}
            <div className={styles.buttonsContainer}>
              <button
                className={styles.buttonSecondary}
                onClick={handleCancelar}
                disabled={guardando}
              >
                CANCELAR
              </button>
              <button
                className={styles.buttonPrimary}
                onClick={guardarAgenda}
                disabled={guardando || bloques.length === 0}
              >
                {guardando ? 'Guardando...' : 'Guardar Agenda'}
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

      {/* Modal de confirmación para cancelar */}
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
    </div>
  );
};

export default Paso3Agenda;
