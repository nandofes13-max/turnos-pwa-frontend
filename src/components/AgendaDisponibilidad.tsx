// src/components/AgendaDisponibilidad.tsx
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
  diasIds?: number[];
  horaDesde: string;
  horaHasta: string;
  duracionTurno: number;
  fechaDesde: string;
  fechaHasta: string | null;
  horarios: string[];
  horariosDeshabilitados: { [diaIdx: number]: number[] };
  fecha_baja?: string | null;
}

interface SlotBackend {
  hora: string;
  bloqueado: boolean;
  disponible: boolean;
}

interface ExcepcionRecurrente {
  id: number;
  agendaDisponibilidadId: number;
  diaSemana: number;
  horaDesde: string;
  horaHasta: string;
  tipo: string;
}

interface ExcepcionFecha {
  id: number;
  agendaDisponibilidadId: number;
  fechaDesde: string;
  fechaHasta: string | null;
  horaDesde: string | null;
  horaHasta: string | null;
  tipo: string;
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

const calcularHoraMinima = (desde: string, duracion: number): string => {
  const [h, m] = desde.split(':').map(Number);
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
  const [desdeH, desdeM] = desde.split(':').map(Number);
  let minutos = desdeH * 60 + desdeM + duracion;
  
  while (minutos <= 23 * 60 + 59) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    opciones.push(`${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    minutos += duracion;
  }
  
  return opciones;
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
  const [bloquesExpandidos, setBloquesExpandidos] = useState<{ [key: number]: boolean }>({});
  
  const [nuevoDesde, setNuevoDesde] = useState('');
  const [nuevoHasta, setNuevoHasta] = useState('');
  const [nuevaDuracion, setNuevaDuracion] = useState(0);
  const [otraDuracion, setOtraDuracion] = useState('');
  const [mostrarOtraDuracion, setMostrarOtraDuracion] = useState(false);
  const [nuevaFechaDesde, setNuevaFechaDesde] = useState(new Date().toISOString().split('T')[0]);
  const [nuevaFechaHasta, setNuevaFechaHasta] = useState('');
  
  const [duracionValida, setDuracionValida] = useState(false);
  const [desdeSeleccionado, setDesdeSeleccionado] = useState(false);
  
  const [rangoBloqueoInicio, setRangoBloqueoInicio] = useState('');
  const [rangoBloqueoFin, setRangoBloqueoFin] = useState('');
  const [fechasBloqueadas, setFechasBloqueadas] = useState<ExcepcionFecha[]>([]);
  const [opcionesHora, setOpcionesHora] = useState<string[]>([]);

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

  useEffect(() => {
    if (profesionalCentroId) {
      cargarDatos();
    }
  }, [profesionalCentroId]);

  // Cargar slots desde el backend (ya aplica excepciones)
  const cargarSlotsDesdeBackend = async (profesionalCentroId: number, fecha: string): Promise<SlotBackend[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/generar-slots/${profesionalCentroId}?fecha=${fecha}`);
      if (!response.ok) {
        throw new Error('Error al cargar slots');
      }
      return await response.json();
    } catch (error) {
      console.error('Error cargando slots:', error);
      return [];
    }
  };

  // Cargar excepciones recurrentes para una agenda
  const cargarExcepcionesRecurrentes = async (agendaId: number): Promise<ExcepcionRecurrente[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/excepciones-recurrentes/por-agenda/${agendaId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error cargando excepciones recurrentes:', error);
      return [];
    }
  };

  // Cargar excepciones de fechas para una agenda
  const cargarExcepcionesFechas = async (agendaId: number): Promise<ExcepcionFecha[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/excepciones-fechas/por-agenda/${agendaId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error cargando excepciones de fechas:', error);
      return [];
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
      
      // Agrupar por bloque
      const grupos: { [key: string]: any } = {};
      
      for (const ag of dataAgendas) {
        const clave = `${ag.horaDesde}|${ag.horaHasta}|${ag.duracionTurno}|${ag.fechaDesde}|${ag.fechaHasta}`;
        
        let diaIdx = ag.diaSemana;
        if (diaIdx === 0) {
          diaIdx = 6;
        } else {
          diaIdx = diaIdx - 1;
        }
        
        if (!grupos[clave]) {
          grupos[clave] = {
            id: ag.id,
            diasIds: [],
            horaDesde: ag.horaDesde,
            horaHasta: ag.horaHasta,
            duracionTurno: ag.duracionTurno,
            fechaDesde: ag.fechaDesde,
            fechaHasta: ag.fechaHasta,
            horarios: [],
            horariosDeshabilitados: {},
            diasHabilitados: [],
            fecha_baja: ag.fecha_baja
          };
        }
        
        grupos[clave].diasIds.push(ag.id);
        
        if (!grupos[clave].diasHabilitados.includes(diaIdx)) {
          grupos[clave].diasHabilitados.push(diaIdx);
        }
      }
      
      const bloquesCargados: BloqueHorario[] = Object.values(grupos);
      
      // Cargar horarios y excepciones para cada bloque
      for (const bloque of bloquesCargados) {
        if (bloque.id) {
          // Cargar slots desde backend
          const fechaReferencia = bloque.fechaDesde || new Date().toISOString().split('T')[0];
          const slots = await cargarSlotsDesdeBackend(parseInt(profesionalCentroId!), fechaReferencia);
          bloque.horarios = slots.map(slot => slot.hora);
          
          // Cargar excepciones recurrentes
          const excepcionesRecurrentes = await cargarExcepcionesRecurrentes(bloque.id);
          
          // Cargar excepciones de fechas (para el modal)
          const excepcionesFechas = await cargarExcepcionesFechas(bloque.id);
          setFechasBloqueadas(excepcionesFechas);
          
          // Convertir excepciones recurrentes a horariosDeshabilitados
          for (const excepcion of excepcionesRecurrentes) {
            let diaIdx = excepcion.diaSemana;
            if (diaIdx === 0) {
              diaIdx = 6;
            } else {
              diaIdx = diaIdx - 1;
            }
            
            if (bloque.diasHabilitados.includes(diaIdx)) {
              // Encontrar índices de horarios que coinciden con el rango
              for (let i = 0; i < bloque.horarios.length; i++) {
                const horario = bloque.horarios[i];
                if (horario >= excepcion.horaDesde && horario < excepcion.horaHasta) {
                  if (!bloque.horariosDeshabilitados[diaIdx]) {
                    bloque.horariosDeshabilitados[diaIdx] = [];
                  }
                  if (!bloque.horariosDeshabilitados[diaIdx].includes(i)) {
                    bloque.horariosDeshabilitados[diaIdx].push(i);
                  }
                }
              }
            }
          }
        }
      }
      
      setBloques(bloquesCargados);
      
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerDuracionFinal = () => {
    let duracion = mostrarOtraDuracion ? parseInt(otraDuracion) : nuevaDuracion;
    return isNaN(duracion) || duracion <= 0 ? 0 : duracion;
  };

  const validarHorario = () => {
    if (!nuevoDesde || !nuevoHasta) {
      alert('Complete los horarios');
      return false;
    }
    if (nuevoDesde >= nuevoHasta) {
      alert('La hora "Desde" debe ser menor a la hora "Hasta"');
      return false;
    }
    
    const duracionFinal = obtenerDuracionFinal();
    if (!duracionFinal || duracionFinal <= 0) {
      alert('La duración del turno debe ser mayor a 0');
      return false;
    }
    
    const [desdeH, desdeM] = nuevoDesde.split(':').map(Number);
    const [hastaH, hastaM] = nuevoHasta.split(':').map(Number);
    const minutosTotales = (hastaH * 60 + hastaM) - (desdeH * 60 + desdeM);
    if (minutosTotales < duracionFinal) {
      alert(`El rango horario es menor a la duración del turno (${duracionFinal} min)`);
      return false;
    }
    
    return true;
  };

  const agregarBloque = () => {
    if (!validarHorario()) return;
    
    const duracionFinal = obtenerDuracionFinal();
    
    const yaExiste = bloques.some(bloque => 
      bloque.horaDesde === nuevoDesde && 
      bloque.horaHasta === nuevoHasta && 
      bloque.duracionTurno === duracionFinal &&
      bloque.fechaDesde === nuevaFechaDesde &&
      bloque.fechaHasta === (nuevaFechaHasta || null)
    );
    
    if (yaExiste) {
      alert('Ya existe un bloque con los mismos datos. No se pueden crear bloques duplicados.');
      return;
    }
    
    const nuevoBloque: BloqueHorario = {
      diasHabilitados: [],
      horaDesde: nuevoDesde,
      horaHasta: nuevoHasta,
      duracionTurno: duracionFinal,
      fechaDesde: nuevaFechaDesde,
      fechaHasta: nuevaFechaHasta || null,
      horarios: [],
      horariosDeshabilitados: {},
      fecha_baja: null
    };
    
    setBloques([...bloques, nuevoBloque]);
    setTieneCambios(true);
    
    setNuevoDesde('');
    setNuevoHasta('');
    setNuevaDuracion(0);
    setMostrarOtraDuracion(false);
    setOtraDuracion('');
    setNuevaFechaDesde(new Date().toISOString().split('T')[0]);
    setNuevaFechaHasta('');
  };

  const toggleActivarBloque = async (index: number) => {
    const bloque = bloques[index];
    if (!bloque.id) return;
    
    try {
      const newFechaBaja = bloque.fecha_baja ? null : new Date().toISOString();
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/${bloque.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha_baja: newFechaBaja,
          usuario_baja: newFechaBaja ? 'demo' : null
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar estado');
      }
      
      const nuevosBloques = [...bloques];
      nuevosBloques[index].fecha_baja = newFechaBaja;
      setBloques(nuevosBloques);
      setTieneCambios(true);
      alert(bloque.fecha_baja ? 'Bloque reactivado' : 'Bloque desactivado');
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'Error al cambiar estado del bloque');
    }
  };

  const toggleDia = async (bloqueIndex: number, diaIdx: number) => {
    const bloque = bloques[bloqueIndex];
    if (!bloque.id) return;
    
    const estaHabilitado = bloque.diasHabilitados.includes(diaIdx);
    let diaSemana = diaIdx;
    if (diaSemana === 6) {
      diaSemana = 0;
    } else {
      diaSemana = diaIdx + 1;
    }
    
    try {
      if (estaHabilitado) {
        // Deshabilitar el día completo: crear excepción recurrente
        const payload = {
          agendaDisponibilidadId: bloque.id,
          diaSemana: diaSemana,
          horaDesde: "00:00:00",
          horaHasta: "23:59:59",
          tipo: "deshabilitado"
        };
        
        const response = await fetch(`${API_BASE_URL}/excepciones-recurrentes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al deshabilitar el día');
        }
      } else {
        // Habilitar el día: eliminar excepciones recurrentes para ese día
        const excepciones = await cargarExcepcionesRecurrentes(bloque.id);
        const excepcionesDia = excepciones.filter(e => e.diaSemana === diaSemana);
        
        for (const excepcion of excepcionesDia) {
          await fetch(`${API_BASE_URL}/excepciones-recurrentes/${excepcion.id}`, {
            method: 'DELETE'
          });
        }
      }
      
      // Recargar datos
      await cargarDatos();
      setTieneCambios(true);
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'Error al cambiar estado del día');
    }
  };

  const toggleHorario = async (bloqueIndex: number, diaIdx: number, horarioIndex: number) => {
    const bloque = bloques[bloqueIndex];
    if (!bloque.id) return;
    
    const horario = bloque.horarios[horarioIndex];
    const siguienteHorario = bloque.horarios[horarioIndex + 1];
    const horaHasta = siguienteHorario || (() => {
      const [h, m] = horario.split(':').map(Number);
      let minutos = m + bloque.duracionTurno;
      let horas = h;
      if (minutos >= 60) {
        horas += Math.floor(minutos / 60);
        minutos = minutos % 60;
      }
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    })();
    
    let diaSemana = diaIdx;
    if (diaSemana === 6) {
      diaSemana = 0;
    } else {
      diaSemana = diaIdx + 1;
    }
    
    const estaDeshabilitado = bloque.horariosDeshabilitados[diaIdx]?.includes(horarioIndex);
    
    try {
      if (!estaDeshabilitado) {
        // Deshabilitar horario: crear excepción recurrente
        const payload = {
          agendaDisponibilidadId: bloque.id,
          diaSemana: diaSemana,
          horaDesde: `${horario}:00`,
          horaHasta: `${horaHasta}:00`,
          tipo: "deshabilitado"
        };
        
        const response = await fetch(`${API_BASE_URL}/excepciones-recurrentes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al deshabilitar el horario');
        }
      } else {
        // Habilitar horario: eliminar excepción específica
        const excepciones = await cargarExcepcionesRecurrentes(bloque.id);
        const excepcionHorario = excepciones.find(e => 
          e.diaSemana === diaSemana && 
          e.horaDesde === `${horario}:00` && 
          e.horaHasta === `${horaHasta}:00`
        );
        
        if (excepcionHorario) {
          await fetch(`${API_BASE_URL}/excepciones-recurrentes/${excepcionHorario.id}`, {
            method: 'DELETE'
          });
        }
      }
      
      // Recargar datos
      await cargarDatos();
      setTieneCambios(true);
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'Error al cambiar estado del horario');
    }
  };

  const toggleExpandirBloque = (index: number) => {
    setBloquesExpandidos(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const hoy = new Date().toISOString().split('T')[0];

  const agregarFechaBloqueada = async () => {
    if (!rangoBloqueoInicio) return;
    
    // Encontrar el primer bloque activo (usar el primero como referencia)
    const bloqueActivo = bloques.find(b => b.id);
    if (!bloqueActivo || !bloqueActivo.id) {
      alert('No hay bloques de agenda guardados. Primero debe guardar la agenda base.');
      return;
    }
    
    try {
      const payload: any = {
        agendaDisponibilidadId: bloqueActivo.id,
        fechaDesde: rangoBloqueoInicio,
        tipo: "deshabilitado"
      };
      
      if (rangoBloqueoFin) {
        payload.fechaHasta = rangoBloqueoFin;
      }
      
      // Si se seleccionaron horas específicas
      if (nuevoDesde && nuevoHasta) {
        payload.horaDesde = `${nuevoDesde}:00`;
        payload.horaHasta = `${nuevoHasta}:00`;
      }
      
      const response = await fetch(`${API_BASE_URL}/excepciones-fechas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al bloquear fechas');
      }
      
      setRangoBloqueoInicio('');
      setRangoBloqueoFin('');
      setTieneCambios(true);
      await cargarDatos();
      alert('Fechas bloqueadas correctamente');
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'Error al bloquear fechas');
    }
  };

  const eliminarFechaBloqueada = async (fecha: ExcepcionFecha) => {
    try {
      await fetch(`${API_BASE_URL}/excepciones-fechas/${fecha.id}`, {
        method: 'DELETE'
      });
      setTieneCambios(true);
      await cargarDatos();
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'Error al eliminar la fecha bloqueada');
    }
  };

  const guardarAgenda = async () => {
    if (!window.confirm('¿Está seguro de guardar los cambios en la agenda?')) return;
    
    const bloquesSinDias = bloques.filter(b => b.diasHabilitados.length === 0);
    if (bloquesSinDias.length > 0) {
      alert('Hay bloques sin días habilitados. Por favor, seleccione al menos un día para cada bloque o elimine los bloques vacíos.');
      return;
    }
    
    setGuardando(true);
    
    try {
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
          
          const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            let errorMessageText = 'Error al guardar la agenda';
            try {
              const errorData = await response.json();
              errorMessageText = errorData.message || errorMessageText;
            } catch (e) {
              errorMessageText = response.statusText || errorMessageText;
            }
            throw new Error(errorMessageText);
          }
          
          const agendaGuardada = await response.json();
          
          if (!bloque.id) {
            bloque.id = agendaGuardada.id;
          }
        }
      }
      
      alert('Agenda guardada correctamente');
      setTieneCambios(false);
      await cargarDatos();
    } catch (err: any) {
      console.error('Error guardando agenda:', err);
      
      const errorMessageText = err.message || '';
      
      if (errorMessageText.includes('Ya existe una agenda activa con los mismos datos')) {
        alert(`❌ ${errorMessageText}\n\nNo se puede duplicar un bloque horario.`);
      }
      else if (errorMessageText.includes('solapa') || errorMessageText.includes('exclusion') || errorMessageText.includes('conflicto') || errorMessageText.includes('violates exclusion constraint')) {
        alert(`❌ Solapamiento de horarios: ${errorMessageText}\n\nEl horario ingresado entra en conflicto con una agenda existente.`);
      }
      else {
        alert(`❌ Error: ${errorMessageText}`);
      }
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
      <div className="agenda-header">
        <h1 className="tm-titulo">Configuración de Agenda</h1>
        <div className="agenda-info">
          <p className="agenda-info-item"><span className="agenda-info-label">Negocio:</span> {relacion?.centro.negocio.nombre} ({relacion?.centro.negocio.url})</p>
          <p className="agenda-info-item"><span className="agenda-info-label">Centro:</span> {relacion?.centro.codigo} - {relacion?.centro.nombre} - {relacion?.centro.formatted_address || 'Sin domicilio'}</p>
          <p className="agenda-info-item"><span className="agenda-info-label">Especialidad:</span> {relacion?.especialidad.nombre}</p>
          <p className="agenda-info-item"><span className="agenda-info-label">Profesional:</span> {relacion?.profesional.nombre} (DNI: {relacion?.profesional.documento})</p>
        </div>
      </div>

      <div className="agenda-form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h3 className="agenda-form-title" style={{ marginBottom: 0 }}>Agregar Bloque Horario</h3>
          <button onClick={() => navigate('/profesional-centro')} className="tm-btn-agregar" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14L4 9l5-5"/>
              <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>
            </svg>
            Profesional-Centro
          </button>
          <button onClick={agregarBloque} className="tm-btn-agregar">+ Agregar Bloque</button>
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
                  setNuevaDuracion(0);
                } else {
                  setNuevaDuracion(val);
                  setMostrarOtraDuracion(false);
                }
              }} 
              className="agenda-form-input"
            >
              <option value={0} disabled>Seleccionar duración...</option>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={0}>Otro</option>
            </select>
            {mostrarOtraDuracion && (
              <input 
                type="number" 
                placeholder="Ingrese duración" 
                value={otraDuracion} 
                onChange={(e) => setOtraDuracion(e.target.value)} 
                className="agenda-form-input"
                style={{ marginTop: '4px' }}
              />
            )}
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '90px' }}>
            <label className="agenda-form-label">Desde</label>
            <select 
              value={nuevoDesde || ''} 
              onChange={(e) => setNuevoDesde(e.target.value)} 
              className="agenda-form-input"
              disabled={!duracionValida}
            >
              <option value="" disabled>Seleccionar hora...</option>
              {opcionesHora.map(hora => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '90px' }}>
            <label className="agenda-form-label">Hasta</label>
            <select 
              value={nuevoHasta || ''} 
              onChange={(e) => setNuevoHasta(e.target.value)} 
              className="agenda-form-input"
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
          
          <div className="agenda-form-field" style={{ minWidth: '110px' }}>
            <label className="agenda-form-label">Vigencia Desde</label>
            <input type="date" value={nuevaFechaDesde} onChange={(e) => setNuevaFechaDesde(e.target.value)} min={hoy} className="agenda-form-input" />
          </div>
          
          <div className="agenda-form-field" style={{ minWidth: '110px' }}>
            <label className="agenda-form-label">Vigencia Hasta</label>
            <input type="date" value={nuevaFechaHasta} onChange={(e) => setNuevaFechaHasta(e.target.value)} min={nuevaFechaDesde} className="agenda-form-input" />
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

      {bloques.map((bloque, idx) => {
        const estaActivo = !bloque.fecha_baja;
        const estaExpandido = bloquesExpandidos[idx];
        
        return (
          <div key={idx} className="agenda-bloque">
            <div className="agenda-bloque-header">
              <div className="agenda-bloque-info" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>
                  <strong>Bloque:</strong> {bloque.horaDesde} a {bloque.horaHasta} | 
                  <strong> Duración:</strong> {bloque.duracionTurno} min | 
                  <strong> Vigencia:</strong> {bloque.fechaDesde} {bloque.fechaHasta ? `hasta ${bloque.fechaHasta}` : 'indefinida'}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  NE({relacion?.centro.negocio.id})-CE({relacion?.centro.id})-ES({relacion?.especialidad.id})-PR({relacion?.profesional.id})
                  -BLs({bloque.diasIds && bloque.diasIds.length > 0 ? bloque.diasIds.join(',') : (bloque.id || 'nuevo')})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => toggleExpandirBloque(idx)} 
                  className="tm-btn-secundario" 
                  style={{ padding: '4px 12px' }}
                >
                  {estaExpandido ? '▲ Ocultar Horarios' : '▼ Ver Horarios'}
                </button>
                <button 
                  onClick={() => toggleActivarBloque(idx)} 
                  className={estaActivo ? 'tm-btn-danger' : 'tm-btn-success'}
                  style={{ padding: '4px 12px' }}
                >
                  {estaActivo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
            
            {estaActivo && estaExpandido && (
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
                      
                      {estaHabilitado && bloque.horarios.length > 0 && (
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
            )}
            
            {!estaActivo && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Bloque inactivo. Presione "Activar" para habilitarlo.
              </div>
            )}
          </div>
        );
      })}

      <div className="agenda-acciones">
        <button onClick={guardarAgenda} className="tm-btn-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar Agenda'}
        </button>
        <button onClick={handleClose} className="tm-btn-secundario">Cancelar</button>
      </div>

      {showFechasModal && (
        <div className="agenda-modal-overlay" onClick={() => setShowFechasModal(false)}>
          <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="agenda-modal-title">Fechas Bloqueadas</h3>
            <div className="agenda-modal-lista">
              {fechasBloqueadas.length === 0 ? (
                <p>No hay fechas bloqueadas</p>
              ) : (
                fechasBloqueadas.map(fecha => (
                  <div key={fecha.id} className="agenda-modal-fecha-item">
                    <span>
                      {fecha.fechaDesde}
                      {fecha.fechaHasta ? ` - ${fecha.fechaHasta}` : ''}
                      {fecha.horaDesde ? ` (${fecha.horaDesde.slice(0,5)} a ${fecha.horaHasta?.slice(0,5)})` : ' (día completo)'}
                    </span>
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
