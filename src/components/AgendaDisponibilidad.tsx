import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/agenda-disponibilidad.css';

interface ProfesionalCentro {
  id: number;
  profesional: { id: number; nombre: string; documento: string; foto?: string };
  especialidad: { id: number; nombre: string };
  centro: {
    id: number;
    nombre: string;
    codigo: string;
    formatted_address?: string;
    negocio: { id: number; nombre: string; url: string };
  };
}

interface BloqueHorario {
  id?: number;
  diasHabilitados: number[];
  horaDesde: string;
  horaHasta: string;
  duracionTurno: number;
  fechaDesde: string;
  fechaHasta: string | null;
  horarios: string[];
  horariosDeshabilitados: { [diaIdx: number]: number[] };
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DIAS_CORTO = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const generarOpcionesHora = (duracion: number): string[] => {
  const opciones: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += duracion) {
      opciones.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return opciones;
};

const generarHorarios = (desde: string, hasta: string, duracion: number): string[] => {
  const horarios: string[] = [];
  let actual = desde;
  while (actual < hasta) {
    horarios.push(actual);
    const [h, m] = actual.split(':').map(Number);
    let minutos = m + duracion;
    let horas = h;
    if (minutos >= 60) {
      horas += Math.floor(minutos / 60);
      minutos = minutos % 60;
    }
    actual = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }
  return horarios;
};

const calcularHoraDesdeIndice = (horarioIdx: number, horaDesde: string, duracionTurno: number): string => {
  const [h, m] = horaDesde.split(':').map(Number);
  let minutos = m + (horarioIdx * duracionTurno);
  let horas = h;
  if (minutos >= 60) {
    horas += Math.floor(minutos / 60);
    minutos = minutos % 60;
  }
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
};

export default function AgendaDisponibilidad() {
  const { profesionalCentroId } = useParams<{ profesionalCentroId: string }>();
  const navigate = useNavigate();
  
  const [relacion, setRelacion] = useState<ProfesionalCentro | null>(null);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tieneCambios, setTieneCambios] = useState(false);
  const [showFechasModal, setShowFechasModal] = useState(false);
  
  const [nuevoDesde, setNuevoDesde] = useState('08:00');
  const [nuevoHasta, setNuevoHasta] = useState('12:00');
  const [nuevaDuracion, setNuevaDuracion] = useState(30);
  const [otraDuracion, setOtraDuracion] = useState('');
  const [mostrarOtraDuracion, setMostrarOtraDuracion] = useState(false);
  const [nuevaFechaDesde, setNuevaFechaDesde] = useState(new Date().toISOString().split('T')[0]);
  const [nuevaFechaHasta, setNuevaFechaHasta] = useState('');
  
  const [rangoBloqueoInicio, setRangoBloqueoInicio] = useState('');
  const [rangoBloqueoFin, setRangoBloqueoFin] = useState('');
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [opcionesHora, setOpcionesHora] = useState<string[]>(generarOpcionesHora(30));

  useEffect(() => {
    const duracion = mostrarOtraDuracion ? parseInt(otraDuracion) : nuevaDuracion;
    if (duracion && duracion > 0) {
      setOpcionesHora(generarOpcionesHora(duracion));
    }
  }, [nuevaDuracion, otraDuracion, mostrarOtraDuracion]);

  useEffect(() => {
    if (profesionalCentroId) {
      cargarDatos();
    }
  }, [profesionalCentroId]);

  const sincronizarExcepciones = async (
    agendaId: number, 
    horariosDeshabilitados: number[], 
    fechaDesde: string, 
    fechaHasta: string | null, 
    horaDesde: string, 
    duracionTurno: number
  ) => {
    // Primero, eliminar excepciones existentes para esta agenda
    const resExistentes = await fetch(`${API_BASE_URL}/agenda-excepciones/por-agenda/${agendaId}`);
    const existentes = await resExistentes.json();
    for (const excepcion of existentes) {
      await fetch(`${API_BASE_URL}/agenda-excepciones/${excepcion.id}`, { method: 'DELETE' });
    }
    
    // Generar la lista de fechas dentro del rango
    const fechas: string[] = [];
    let fechaActual = new Date(fechaDesde);
    const fechaFin = fechaHasta ? new Date(fechaHasta) : new Date(fechaDesde);
    
    while (fechaActual <= fechaFin) {
      fechas.push(fechaActual.toISOString().split('T')[0]);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    // Para cada horario deshabilitado, crear una excepción para cada fecha en el rango
    for (const horarioIdx of horariosDeshabilitados) {
      const hora = calcularHoraDesdeIndice(horarioIdx, horaDesde, duracionTurno);
      
      for (const fecha of fechas) {
        await fetch(`${API_BASE_URL}/agenda-excepciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agendaDisponibilidadId: agendaId,
            fecha: fecha,
            hora: hora,
            tipo: 'deshabilitado'
          })
        });
      }
    }
  };

  const cargarDatos = async () => {
  setLoading(true);
  try {
    const resRelacion = await fetch(`${API_BASE_URL}/profesional-centro/${profesionalCentroId}`);
    const dataRelacion = await resRelacion.json();
    setRelacion(dataRelacion);
    
    const resAgendas = await fetch(`${API_BASE_URL}/agenda-disponibilidad/por-profesional-centro/${profesionalCentroId}`);
    const dataAgendas = await resAgendas.json();
    
    // Cargar excepciones para cada agenda
    const excepcionesPorAgenda: { [key: number]: { fecha: string; hora: string }[] } = {};
    for (const ag of dataAgendas) {
      const resExcepciones = await fetch(`${API_BASE_URL}/agenda-excepciones/por-agenda/${ag.id}`);
      const excepciones = await resExcepciones.json();
      excepcionesPorAgenda[ag.id] = excepciones;
    }
    
    // Agrupar por bloque (misma horaDesde, horaHasta, duracionTurno, fechas)
    const grupos: { [key: string]: any } = {};
    
    for (const ag of dataAgendas) {
      const clave = `${ag.horaDesde}|${ag.horaHasta}|${ag.duracionTurno}|${ag.fechaDesde}|${ag.fechaHasta}`;
      
      // Convertir día de BD a índice frontend
      let diaIdx = ag.diaSemana;
      if (diaIdx === 0) {
        diaIdx = 6;
      } else {
        diaIdx = diaIdx - 1;
      }
      
      if (!grupos[clave]) {
        grupos[clave] = {
          id: ag.id,
          horaDesde: ag.horaDesde,
          horaHasta: ag.horaHasta,
          duracionTurno: ag.duracionTurno,
          fechaDesde: ag.fechaDesde,
          fechaHasta: ag.fechaHasta,
          horarios: generarHorarios(ag.horaDesde, ag.horaHasta, ag.duracionTurno),
          horariosDeshabilitados: {},
          diasHabilitados: []
        };
      }
      
      if (!grupos[clave].diasHabilitados.includes(diaIdx)) {
        grupos[clave].diasHabilitados.push(diaIdx);
      }
      
      // Cargar horarios deshabilitados desde excepciones para ESTE día específico
      const excepciones = excepcionesPorAgenda[ag.id] || [];
      const horariosDeshabilitadosSet = new Set<number>();
      
      for (const excepcion of excepciones) {
        // Buscar el índice del horario que coincide con la hora de la excepción
        const horarioIndex = grupos[clave].horarios.findIndex((h: string) => h === excepcion.hora);
        if (horarioIndex !== -1) {
          horariosDeshabilitadosSet.add(horarioIndex);
        }
      }
      
      if (horariosDeshabilitadosSet.size > 0) {
        // Si ya hay horarios deshabilitados para este día, combinarlos
        const existentes = grupos[clave].horariosDeshabilitados[diaIdx] || [];
        grupos[clave].horariosDeshabilitados[diaIdx] = [...new Set([...existentes, ...Array.from(horariosDeshabilitadosSet)])];
      }
    }
    
    const bloquesCargados: BloqueHorario[] = Object.values(grupos);
    setBloques(bloquesCargados);
    
  } catch (err) {
    console.error('Error cargando datos:', err);
  } finally {
    setLoading(false);
  }
};
  const obtenerDuracionFinal = () => {
    return mostrarOtraDuracion ? parseInt(otraDuracion) : nuevaDuracion;
  };

  const agregarBloque = () => {
    const duracionFinal = obtenerDuracionFinal();
    if (!nuevoDesde || !nuevoHasta || !duracionFinal || nuevoDesde >= nuevoHasta) {
      alert('Complete los campos del bloque correctamente');
      return;
    }
    
    const horarios = generarHorarios(nuevoDesde, nuevoHasta, duracionFinal);
    
    const nuevoBloque: BloqueHorario = {
      diasHabilitados: [],
      horaDesde: nuevoDesde,
      horaHasta: nuevoHasta,
      duracionTurno: duracionFinal,
      fechaDesde: nuevaFechaDesde,
      fechaHasta: nuevaFechaHasta || null,
      horarios: horarios,
      horariosDeshabilitados: {}
    };
    
    setBloques([...bloques, nuevoBloque]);
    setTieneCambios(true);
    
    setNuevoDesde('08:00');
    setNuevoHasta('12:00');
    setNuevaDuracion(30);
    setMostrarOtraDuracion(false);
    setOtraDuracion('');
    setNuevaFechaDesde(new Date().toISOString().split('T')[0]);
    setNuevaFechaHasta('');
  };

  const eliminarBloque = (index: number) => {
    if (window.confirm('¿Eliminar este bloque horario?')) {
      const nuevosBloques = [...bloques];
      nuevosBloques.splice(index, 1);
      setBloques(nuevosBloques);
      setTieneCambios(true);
    }
  };

  const toggleDia = (bloqueIndex: number, diaIdx: number) => {
    const nuevosBloques = [...bloques];
    const bloque = nuevosBloques[bloqueIndex];
    if (bloque.diasHabilitados.includes(diaIdx)) {
      bloque.diasHabilitados = bloque.diasHabilitados.filter(d => d !== diaIdx);
    } else {
      bloque.diasHabilitados.push(diaIdx);
    }
    setBloques(nuevosBloques);
    setTieneCambios(true);
  };

  const toggleHorario = (bloqueIndex: number, diaIdx: number, horarioIndex: number) => {
    const nuevosBloques = [...bloques];
    const bloque = nuevosBloques[bloqueIndex];
    
    const deshabilitadosDia = bloque.horariosDeshabilitados[diaIdx] || [];
    
    if (deshabilitadosDia.includes(horarioIndex)) {
      bloque.horariosDeshabilitados[diaIdx] = deshabilitadosDia.filter(i => i !== horarioIndex);
      if (bloque.horariosDeshabilitados[diaIdx].length === 0) {
        delete bloque.horariosDeshabilitados[diaIdx];
      }
    } else {
      bloque.horariosDeshabilitados[diaIdx] = [...deshabilitadosDia, horarioIndex];
    }
    
    setBloques(nuevosBloques);
    setTieneCambios(true);
  };

  const hoy = new Date().toISOString().split('T')[0];

  const agregarFechaBloqueada = () => {
    if (rangoBloqueoInicio) {
      const nuevasFechas = [...fechasBloqueadas];
      if (rangoBloqueoFin && rangoBloqueoFin > rangoBloqueoInicio) {
        let actual = new Date(rangoBloqueoInicio);
        const fin = new Date(rangoBloqueoFin);
        while (actual <= fin) {
          const fechaStr = actual.toISOString().split('T')[0];
          if (!nuevasFechas.includes(fechaStr)) {
            nuevasFechas.push(fechaStr);
          }
          actual.setDate(actual.getDate() + 1);
        }
      } else {
        if (!nuevasFechas.includes(rangoBloqueoInicio)) {
          nuevasFechas.push(rangoBloqueoInicio);
        }
      }
      setFechasBloqueadas(nuevasFechas);
      setRangoBloqueoInicio('');
      setRangoBloqueoFin('');
      setTieneCambios(true);
    }
  };

  const eliminarFechaBloqueada = (fecha: string) => {
    setFechasBloqueadas(fechasBloqueadas.filter(f => f !== fecha));
    setTieneCambios(true);
  };

  const guardarAgenda = async () => {
    if (!window.confirm('¿Está seguro de guardar los cambios en la agenda?')) return;
    
    console.log('===== DIAGNÓSTICO DE AGENDA =====');
    for (const bloque of bloques) {
      console.log(`Bloque: ${bloque.horaDesde} a ${bloque.horaHasta}`);
      console.log('diasHabilitados (índices frontend):', bloque.diasHabilitados);
      console.log('horariosDeshabilitados:', bloque.horariosDeshabilitados);
      
      for (const diaIdx of bloque.diasHabilitados) {
        let diaSemana;
        if (diaIdx === 6) {
          diaSemana = 0;
        } else {
          diaSemana = diaIdx + 1;
        }
        console.log(`  día ${diaIdx} (${DIAS_CORTO[diaIdx]}) → diaSemana ${diaSemana}`);
      }
    }
    
    setGuardando(true);
    try {
      const resExistentes = await fetch(`${API_BASE_URL}/agenda-disponibilidad/por-profesional-centro/${profesionalCentroId}`);
      const existentes = await resExistentes.json();
      for (const agenda of existentes) {
        await fetch(`${API_BASE_URL}/agenda-disponibilidad/${agenda.id}`, { method: 'DELETE' });
      }
      
      for (const bloque of bloques) {
        for (const diaIdx of bloque.diasHabilitados) {
          let diaSemana;
          if (diaIdx === 6) {
            diaSemana = 0;
          } else {
            diaSemana = diaIdx + 1;
          }
          
          const payload = {
            profesionalCentroId: parseInt(profesionalCentroId!),
            diaSemana: diaSemana,
            horaDesde: bloque.horaDesde,
            horaHasta: bloque.horaHasta,
            duracionTurno: bloque.duracionTurno,
            bufferMinutos: 0,
            fechaDesde: bloque.fechaDesde,
            fechaHasta: bloque.fechaHasta
          };
          
          console.log('Enviando payload:', payload);
          
          const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          const agendaGuardada = await response.json();
          
          // Sincronizar excepciones para esta agenda (horarios deshabilitados para este día específico)
          const horariosDeshabilitadosDia = bloque.horariosDeshabilitados[diaIdx] || [];
          if (horariosDeshabilitadosDia.length > 0) {
            await sincronizarExcepciones(
              agendaGuardada.id,
              horariosDeshabilitadosDia,
              bloque.fechaDesde,
              bloque.fechaHasta,
              bloque.horaDesde,
              bloque.duracionTurno
            );
          }
        }
      }
      
      alert('Agenda guardada correctamente');
      setTieneCambios(false);
      cargarDatos();
    } catch (err) {
      console.error('Error guardando agenda:', err);
      alert('Error al guardar la agenda');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    if (tieneCambios) {
      if (window.confirm('Hay cambios sin guardar. ¿Desea guardarlos antes de salir?')) {
        guardarAgenda();
      } else {
        navigate('/profesional-centro');
      }
    } else {
      navigate('/profesional-centro');
    }
  };

  if (loading) {
    return (
      <div className="tm-loading">
        <div className="tm-loading-spinner"></div>
        <p className="tm-loading-texto">Cargando agenda...</p>
      </div>
    );
  }

  return (
    <div className="tm-page">
      {/* Encabezado */}
      <div className="agenda-header">
        <h1 className="tm-titulo">Configuración de Agenda</h1>
        <div className="agenda-info">
          <p className="agenda-info-item"><span className="agenda-info-label">Negocio:</span> {relacion?.centro.negocio.nombre} ({relacion?.centro.negocio.url})</p>
          <p className="agenda-info-item"><span className="agenda-info-label">Centro:</span> {relacion?.centro.codigo} - {relacion?.centro.nombre} - {relacion?.centro.formatted_address || 'Sin domicilio'}</p>
          <p className="agenda-info-item"><span className="agenda-info-label">Especialidad:</span> {relacion?.especialidad.nombre}</p>
          <p className="agenda-info-item"><span className="agenda-info-label">Profesional:</span> {relacion?.profesional.nombre} (DNI: {relacion?.profesional.documento})</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="agenda-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h3 className="agenda-form-title" style={{ marginBottom: 0, display: 'inline-block', width: 'auto' }}>Agregar Bloque Horario - Bloquear Fechas</h3>
          <button onClick={agregarBloque} className="tm-btn-agregar" style={{ padding: '6px 12px', fontSize: '13px' }}>+ Agregar Bloque</button>
        </div>
        <div className="agenda-form-row">
          <div className="agenda-form-field" style={{ minWidth: '100px' }}>
            <label className="agenda-form-label">Duración (min)</label>
            <select 
              value={nuevaDuracion} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val === 0) {
                  setMostrarOtraDuracion(true);
                } else {
                  setNuevaDuracion(val);
                  setMostrarOtraDuracion(false);
                }
              }} 
              className="agenda-form-input"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={0}>Otro</option>
            </select>
            {mostrarOtraDuracion && (
              <input 
                type="number" 
                placeholder="Duración" 
                value={otraDuracion} 
                onChange={(e) => setOtraDuracion(e.target.value)} 
                className="agenda-form-input"
                style={{ marginTop: '4px' }}
              />
            )}
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '90px' }}>
            <label className="agenda-form-label">Desde</label>
            <select value={nuevoDesde} onChange={(e) => setNuevoDesde(e.target.value)} className="agenda-form-input">
              {opcionesHora.map(hora => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '90px' }}>
            <label className="agenda-form-label">Hasta</label>
            <select value={nuevoHasta} onChange={(e) => setNuevoHasta(e.target.value)} className="agenda-form-input">
              {opcionesHora.map(hora => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '110px' }}>
            <label className="agenda-form-label">Vigencia Desde</label>
            <input type="date" value={nuevaFechaDesde} onChange={(e) => setNuevaFechaDesde(e.target.value)} className="agenda-form-input" />
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '110px' }}>
            <label className="agenda-form-label">Vigencia Hasta</label>
            <input type="date" value={nuevaFechaHasta} onChange={(e) => setNuevaFechaHasta(e.target.value)} className="agenda-form-input" />
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '110px' }}>
            <label className="agenda-form-label">Bloquear Desde</label>
            <input 
              type="date" 
              value={rangoBloqueoInicio} 
              min={hoy}
              onChange={(e) => setRangoBloqueoInicio(e.target.value)} 
              className="agenda-form-input" 
            />
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '110px' }}>
            <label className="agenda-form-label">Bloquear Hasta</label>
            <input 
              type="date" 
              value={rangoBloqueoFin} 
              min={rangoBloqueoInicio || hoy}
              onChange={(e) => setRangoBloqueoFin(e.target.value)} 
              className="agenda-form-input" 
            />
          </div>
          
          <div>
            <button onClick={agregarFechaBloqueada} className="tm-btn-secundario" style={{ marginTop: '24px' }}>Bloquear</button>
          </div>
          
          <div>
            <button onClick={() => setShowFechasModal(true)} className="agenda-btn-fechas" style={{ marginTop: '24px' }}>
              📅 Ver ({fechasBloqueadas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Bloques configurados */}
      {bloques.map((bloque, idx) => (
        <div key={idx} className="agenda-bloque">
          <div className="agenda-bloque-header">
            <span className="agenda-bloque-info">
              <strong>Bloque:</strong> {bloque.horaDesde} a {bloque.horaHasta} | 
              <strong> Duración:</strong> {bloque.duracionTurno} min | 
              <strong> Vigencia:</strong> {bloque.fechaDesde} {bloque.fechaHasta ? `hasta ${bloque.fechaHasta}` : 'indefinida'}
            </span>
            <button onClick={() => eliminarBloque(idx)} className="tm-btn-secundario" style={{ padding: '4px 12px' }}>Eliminar Bloque</button>
          </div>
          
          <div className="agenda-grilla">
            {DIAS_CORTO.map((dia, diaIdx) => {
              const estaHabilitado = bloque.diasHabilitados.includes(diaIdx);
              return (
                <div key={diaIdx} className="agenda-dia-columna">
                  <button
                    onClick={() => toggleDia(idx, diaIdx)}
                    className={`agenda-dia-boton ${estaHabilitado ? 'habilitado' : 'deshabilitado'}`}
                  >
                    {dia}
                    <div className="agenda-dia-icono">
                      {estaHabilitado ? '✅' : '🔒'}
                    </div>
                  </button>
                  
                  {estaHabilitado && (
                    <div className="agenda-horarios">
                      {bloque.horarios.map((horario, horarioIdx) => {
                        const deshabilitadosDia = bloque.horariosDeshabilitados[diaIdx] || [];
                        const isDeshabilitado = deshabilitadosDia.includes(horarioIdx);
                        return (
                          <button
                            key={horarioIdx}
                            onClick={() => toggleHorario(idx, diaIdx, horarioIdx)}
                            className={`agenda-horario-boton ${isDeshabilitado ? 'deshabilitado' : 'habilitado'}`}
                          >
                            {horario} {isDeshabilitado && '🔒'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Botones de acción */}
      <div className="agenda-acciones">
        <button onClick={handleClose} className="tm-btn-secundario">Cancelar</button>
        <button onClick={guardarAgenda} className="tm-btn-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar Agenda'}
        </button>
      </div>

      {/* Modal de fechas bloqueadas */}
      {showFechasModal && (
        <div className="agenda-modal-overlay" onClick={() => setShowFechasModal(false)}>
          <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="agenda-modal-title">Fechas Bloqueadas</h3>
            <div className="agenda-modal-lista">
              {fechasBloqueadas.length === 0 ? (
                <p>No hay fechas bloqueadas</p>
              ) : (
                fechasBloqueadas.map(fecha => (
                  <div key={fecha} className="agenda-modal-fecha-item">
                    <span>{fecha}</span>
                    <button onClick={() => eliminarFechaBloqueada(fecha)}>✖</button>
                  </div>
                ))
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setShowFechasModal(false)} className="tm-btn-secundario">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
