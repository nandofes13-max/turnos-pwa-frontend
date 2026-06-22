// src/components/SolicitarAgendaWizard/Paso3Agenda.tsx
// Paso 3 del Wizard: Configurar Agenda
// - Permite agregar bloques horarios (día, duración, desde, hasta)
// - Validación en cascada (igual que AgendaDisponibilidad.tsx)
// - Lista de bloques con expansión para ver horarios
// - Guardado mediante POST /agenda-disponibilidad/guardar-lote
// - Mensajes de éxito/error consistentes con el formulario
// - Mensaje BLOQUEANTE: el usuario debe cerrarlo para continuar
// - Conversión de días IDÉNTICA a AgendaDisponibilidad.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paso1Result, Paso2Result, guardarAgenda } from '../../services/apiWizard';
import styles from './wizard.module.css';

interface Paso3AgendaProps {
  paso1Data: Paso1Result;
  paso2Data: Paso2Result;
  onBack: () => void;
  onSuccess?: () => void;
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

interface Mensaje {
  id: string;
  tipo: 'exito' | 'error';
  texto: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DIAS_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ============================================================
// FUNCIONES DE CONVERSIÓN DE DÍAS (IDÉNTICAS A AgendaDisponibilidad.tsx)
// ============================================================

// Convertir índice del frontend (0=Lunes) a valor de BD (0=Domingo)
const uiToBdDay = (uiDay: number): number => {
  if (uiDay === 6) return 0;  // Domingo → 0
  return uiDay + 1;           // Lunes → 1, Martes → 2, ...
};

// Convertir valor de BD (0=Domingo) a índice del frontend (0=Lunes)
const bdToUiDay = (bdDay: number): number => {
  if (bdDay === 0) return 6;  // Domingo → 6
  return bdDay - 1;           // Lunes → 0, Martes → 1, ...
};

// ============================================================
// FUNCIONES DE HORARIOS (IDÉNTICAS A AgendaDisponibilidad.tsx)
// ============================================================

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

// Función para formatear domicilio (igual que en Paso 1)
const formatearDireccion = (centro: any): string => {
  if (!centro) return 'Sin domicilio';
  if (centro.es_virtual) {
    return 'Virtual';
  }
  const calleCompleta = `${centro.street || ''} ${centro.street_number || ''}`.trim();
  return `${calleCompleta}, ${centro.city || ''}, ${centro.country || ''}`;
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

// Generador de ID único para mensajes
let mensajeIdCounter = 0;
const generarIdMensaje = () => {
  mensajeIdCounter += 1;
  return `msg-${Date.now()}-${mensajeIdCounter}`;
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
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [mensajeActivo, setMensajeActivo] = useState(false);
  const [mostrarConfirmacionCancelar, setMostrarConfirmacionCancelar] = useState(false);
  const [mostrarConfirmacionGuardar, setMostrarConfirmacionGuardar] = useState(false);

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

  // Obtener el centro
  const centro = paso1Data?.centros?.[0];

  // Función para agregar mensaje (bloqueante)
  const agregarMensaje = (tipo: 'exito' | 'error', texto: string) => {
    const id = generarIdMensaje();
    setMensajes([{ id, tipo, texto }]);
    setMensajeActivo(true);
  };

  const eliminarMensaje = (id: string) => {
    setMensajes(prev => prev.filter(m => m.id !== id));
    setMensajeActivo(false);
  };

  const limpiarMensajes = () => {
    setMensajes([]);
    setMensajeActivo(false);
  };

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
    limpiarMensajes();

    if (nuevoDiaUI === null) {
      agregarMensaje('error', '⚠️ Seleccione un día');
      return false;
    }
    if (!nuevoDesde || !nuevoHasta) {
      agregarMensaje('error', '⚠️ Complete los horarios');
      return false;
    }
    if (nuevoDesde >= nuevoHasta) {
      agregarMensaje('error', '⚠️ La hora "Desde" debe ser menor a la hora "Hasta"');
      return false;
    }

    const duracionFinal = obtenerDuracionFinal();
    if (!duracionFinal || duracionFinal <= 0) {
      agregarMensaje('error', '⚠️ La duración del turno debe ser mayor a 0');
      return false;
    }

    const [desdeH, desdeM] = nuevoDesde.split(':').map(Number);
    const [hastaH, hastaM] = nuevoHasta.split(':').map(Number);
    const minutosTotales = (hastaH * 60 + hastaM) - (desdeH * 60 + desdeM);
    if (minutosTotales < duracionFinal) {
      agregarMensaje('error', `⚠️ El rango horario es menor a la duración del turno (${duracionFinal} min)`);
      return false;
    }

    if (minutosTotales % duracionFinal !== 0) {
      agregarMensaje('error',
        `⚠️ La duración del turno (${duracionFinal} min) no divide exactamente el rango horario de ${minutosTotales} minutos.`
      );
      return false;
    }

    // 👈 CONVERSIÓN DE DÍA: usar uiToBdDay para comparar con bloques existentes
    const nuevoDiaBD = uiToBdDay(nuevoDiaUI);
    const bloqueSolapado = bloques.find(bloque => {
      const mismoDia = bloque.diaSemana === nuevoDiaBD;
      if (!mismoDia) return false;
      const solapa = nuevoDesde < bloque.horaHasta && nuevoHasta > bloque.horaDesde;
      return solapa;
    });

    if (bloqueSolapado) {
      const nombreDia = DIAS_COMPLETO[nuevoDiaUI];
      agregarMensaje('error',
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
      agregarMensaje('error', `❌ Ya existe un bloque para ${nombreDia} con el mismo horario y duración.`);
      return false;
    }

    return true;
  };

  const agregarBloque = () => {
    // Si hay un mensaje activo, no permitir agregar otro bloque
    if (mensajeActivo) {
      return;
    }

    if (!validarHorario()) return;

    const duracionFinal = obtenerDuracionFinal();
    // 👈 CONVERSIÓN DE DÍA: usar uiToBdDay para guardar en BD
    const diaBD = uiToBdDay(nuevoDiaUI!);
    const nombreDia = DIAS_COMPLETO[nuevoDiaUI!];
    const fechaActual = new Date().toISOString().split('T')[0];

    const horarios = generarHorariosLocal(nuevoDesde, nuevoHasta, duracionFinal);

    const nuevoBloque: BloqueLocal = {
      id: Date.now(),
      diaSemana: diaBD, // Guardamos el valor convertido para BD
      horaDesde: normalizarHora(nuevoDesde),
      horaHasta: normalizarHora(nuevoHasta),
      duracionTurno: duracionFinal,
      fechaDesde: fechaActual,
      fechaHasta: null,
      horarios: horarios,
      timezone: centro?.timezone || 'America/Argentina/Buenos_Aires',
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

    agregarMensaje('exito', `✅ Bloque agregado para ${nombreDia}`);
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
    agregarMensaje('exito', '✅ Bloque eliminado');
  };

  // Guardar agenda con doble confirmación
  const handleGuardar = () => {
    if (mensajeActivo) return;
    
    if (bloques.length === 0) {
      agregarMensaje('error', '⚠️ Debe agregar al menos un bloque horario antes de guardar.');
      return;
    }
    setMostrarConfirmacionGuardar(true);
  };

  const confirmarGuardar = async () => {
    setMostrarConfirmacionGuardar(false);
    setGuardando(true);
    limpiarMensajes();

    try {
      const payload = bloques.map(bloque => ({
        profesionalCentroId: profesionalCentroId,
        diaSemana: bloque.diaSemana, // Ya está en formato BD (0=Domingo)
        horaDesde: bloque.horaDesde,
        horaHasta: bloque.horaHasta,
        duracionTurno: bloque.duracionTurno,
        bufferMinutos: 0,
        fechaDesde: bloque.fechaDesde,
        fechaHasta: bloque.fechaHasta,
        fecha_baja: null,
        timezone: bloque.timezone,
      }));

      await guardarAgenda(payload, profesionalCentroId);
      
      agregarMensaje('exito', `✅ Agenda guardada correctamente (${bloques.length} bloques)`);
      
    } catch (err: any) {
      console.error('Error guardando agenda:', err);
      agregarMensaje('error', `❌ ${err.message || 'Error al guardar la agenda'}`);
    } finally {
      setGuardando(false);
    }
  };

  // Función para cerrar mensaje y luego ejecutar acción
  const cerrarMensajeYVolver = () => {
    if (mensajes.length > 0 && mensajes[0].tipo === 'exito' && mensajes[0].texto.includes('Agenda guardada')) {
      eliminarMensaje(mensajes[0].id);
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    } else {
      eliminarMensaje(mensajes[0].id);
    }
  };

  const cancelarGuardar = () => {
    setMostrarConfirmacionGuardar(false);
  };

  // Cancelar con doble confirmación
  const handleCancelar = () => {
    if (mensajeActivo) return;
    
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

  // Renderizar mensajes (bloqueantes) - COLOCADOS ENCIMA DEL FORMULARIO
  const renderizarMensajes = () => {
    if (mensajes.length === 0) return null;

    const msg = mensajes[0];
    const esExito = msg.tipo === 'exito';
    const esGuardadoExitoso = esExito && msg.texto.includes('Agenda guardada');

    return (
      <div className={styles.mensajesContainer}>
        <div className={esExito ? styles.mensajeExito : styles.mensajeError}>
          <span>{msg.texto}</span>
          <button
            type="button"
            onClick={esGuardadoExitoso ? cerrarMensajeYVolver : () => eliminarMensaje(msg.id)}
            className={styles.mensajeCerrar}
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

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
                  {centro?.codigo} - {formatearDireccion(centro)}
                </span>
              </div>
              <div className={styles.resumenItem}>
                <span className={styles.resumenLabel}>🕒 Zona horaria:</span>
                <span className={styles.resumenValor}>{formatearTimezone(centro?.timezone)}</span>
              </div>
            </div>

            {/* Formulario de alta */}
            <div className={styles.agendaFormSection}>
              <h3 className={styles.agendaFormTitle}>Agregar Bloque Horario</h3>

              {/* 👈 Mensajes COLOCADOS AQUÍ (encima de los campos) */}
              {renderizarMensajes()}

              <div className={styles.agendaFormRow}>
                <div className={styles.agendaFormField}>
                  <label className={styles.agendaFormLabel}>Día</label>
                  <select
                    value={nuevoDiaUI !== null ? nuevoDiaUI : ''}
                    onChange={(e) => setNuevoDiaUI(parseInt(e.target.value))}
                    className={styles.agendaFormInput}
                    disabled={mensajeActivo || guardando}
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
                    disabled={mensajeActivo || guardando}
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
                      disabled={mensajeActivo || guardando}
                    />
                  )}
                </div>

                <div className={styles.agendaFormField}>
                  <label className={styles.agendaFormLabel}>Desde</label>
                  <select
                    value={nuevoDesde || ''}
                    onChange={(e) => setNuevoDesde(e.target.value)}
                    className={styles.agendaFormInput}
                    disabled={!duracionValida || mensajeActivo || guardando}
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
                    disabled={!duracionValida || !desdeSeleccionado || mensajeActivo || guardando}
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
                    disabled={mensajeActivo || guardando}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de bloques */}
            {bloques.length > 0 && (
              <div className={styles.agendaBloquesLista}>
                <h3 className={styles.agendaBloquesTitle}>Bloques agregados ({bloques.length})</h3>
                {bloques.map((bloque, idx) => {
                  // 👈 CONVERSIÓN DE DÍA: usar bdToUiDay para mostrar el día correcto
                  const diaUI = bdToUiDay(bloque.diaSemana);
                  const nombreDia = DIAS_COMPLETO[diaUI];
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
                            disabled={mensajeActivo || guardando}
                          >
                            {estaExpandido ? '▲ Ocultar Horarios' : '▼ Ver Horarios'}
                          </button>
                          <button
                            onClick={() => eliminarBloque(bloque.id)}
                            className={styles.buttonEliminar}
                            title="Eliminar bloque"
                            disabled={mensajeActivo || guardando}
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
                disabled={mensajeActivo || guardando}
              >
                Cancelar
              </button>
              <button
                className={styles.buttonPrimary}
                onClick={handleGuardar}
                disabled={guardando || bloques.length === 0 || mensajeActivo}
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

      {/* Modal de confirmación para guardar */}
      {mostrarConfirmacionGuardar && (
        <div className={styles.modalConfirmacionOverlay} onClick={cancelarGuardar}>
          <div className={styles.modalConfirmacion} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalConfirmacionTitulo}>¿Guardar la agenda?</h3>
            <p className={styles.modalConfirmacionMensaje}>
              Se guardarán {bloques.length} bloque(s) en la agenda.
              {bloques.length > 0 && (
                <span style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                  {bloques.map(b => {
                    const diaUI = bdToUiDay(b.diaSemana);
                    return `${DIAS_COMPLETO[diaUI]} (${b.horaDesde}-${b.horaHasta})`;
                  }).join(', ')}
                </span>
              )}
            </p>
            <div className={styles.modalConfirmacionBotones}>
              <button className={styles.buttonSecondary} onClick={cancelarGuardar}>
                Cancelar
              </button>
              <button className={styles.buttonPrimary} onClick={confirmarGuardar}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paso3Agenda;
