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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
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

  const sincronizarExcepciones = async (
    agendaId: number, 
    horariosDeshabilitados: number[], 
    fechaDesde: string, 
    fechaHasta: string | null, 
    horaDesde: string,
    duracionTurno: number
  ) => {
    const resExistentes = await fetch(`${API_BASE_URL}/agenda-excepciones/por-agenda/${agendaId}`);
    const existentes = await resExistentes.json();
    for (const excepcion of existentes) {
      await fetch(`${API_BASE_URL}/agenda-excepciones/${excepcion.id}`, { method: 'DELETE' });
    }
    
    const fechas: string[] = [];
    let fechaActual = new Date(fechaDesde);
    const fechaFin = fechaHasta ? new Date(fechaHasta) : new Date(fechaDesde);
    
    while (fechaActual <= fechaFin) {
      fechas.push(fechaActual.toISOString().split('T')[0]);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    if (horariosDeshabilitados.length === 0) return;
    
    const sorted = [...horariosDeshabilitados].sort((a, b) => a - b);
    const rangos: { inicio: number; fin: number }[] = [];
    let inicio = sorted[0];
    let fin = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === fin + 1) {
        fin = sorted[i];
      } else {
        rangos.push({ inicio, fin });
        inicio = sorted[i];
        fin = sorted[i];
      }
    }
    rangos.push({ inicio, fin });
    
    for (const rango of rangos) {
      const horaDesdeRango = calcularHoraDesdeIndice(rango.inicio, horaDesde, duracionTurno);
      const siguienteIndice = rango.fin + 1;
      let horaHastaRango;
      if (siguienteIndice * duracionTurno + parseInt(horaDesde.split(':')[1]) < 60 * 24) {
        horaHastaRango = calcularHoraDesdeIndice(siguienteIndice, horaDesde, duracionTurno);
      } else {
        horaHastaRango = '23:59';
      }
      
      for (const fecha of fechas) {
        await fetch(`${API_BASE_URL}/agenda-excepciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agendaDisponibilidadId: agendaId,
            fecha: fecha,
            horaDesde: horaDesdeRango,
            horaHasta: horaHastaRango,
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
      const excepcionesPorAgenda: { [key: number]: { fecha: string; horaDesde: string; horaHasta: string }[] } = {};
      for (const ag of dataAgendas) {
        const resExcepciones = await fetch(`${API_BASE_URL}/agenda-excepciones/por-agenda/${ag.id}`);
        const excepciones = await resExcepciones.json();
        excepcionesPorAgenda[ag.id] = excepciones;
      }
      
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
            horarios: [], // Se llenará desde el backend
            horariosDeshabilitados: {},
            diasHabilitados: [],
            fecha_baja: ag.fecha_baja
          };
        }
        
        grupos[clave].diasIds.push(ag.id);
        
        if (!grupos[clave].diasHabilitados.includes(diaIdx)) {
          grupos[clave].diasHabilitados.push(diaIdx);
        }
        
        // Convertir excepciones de rango a índices de horarios deshabilitados
        const excepciones = excepcionesPorAgenda[ag.id] || [];
        const horariosDeshabilitadosSet = new Set<number>();
        
        // Necesitamos los horarios del backend para esto, pero aún no los tenemos
        // Por ahora, guardamos las excepciones y las procesaremos después
        grupos[clave].excepciones = excepciones;
      }
      
      const bloquesCargados: BloqueHorario[] = Object.values(grupos);
      
      // Para cada bloque, cargar los horarios desde el backend (usando una fecha de ejemplo)
      for (const bloque of bloquesCargados) {
        if (bloque.diasHabilitados.length > 0) {
          // Usar la fecha desde del bloque como referencia
          const fechaEjemplo = bloque.fechaDesde;
          const slots = await cargarSlotsDesdeBackend(parseInt(profesionalCentroId!), fechaEjemplo);
          bloque.horarios = slots.map(slot => slot.hora);
          
          // Procesar excepciones para marcar horarios deshabilitados
          if (bloque.excepciones) {
            for (const excepcion of bloque.excepciones) {
              for (let i = 0; i < bloque.horarios.length; i++) {
                const horario = bloque.horarios[i];
                if (horario >= excepcion.horaDesde && horario < excepcion.horaHasta) {
                  if (!bloque.horariosDeshabilitados[excepcion.diaIdx]) {
                    bloque.horariosDeshabilitados[excepcion.diaIdx] = [];
                  }
                  bloque.horariosDeshabilitados[excepcion.diaIdx].push(i);
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
    setErrorMessage(null);
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
  const nuevosBloques = [...bloques];
  const bloque = nuevosBloques[bloqueIndex];
  const estabaHabilitado = bloque.diasHabilitados.includes(diaIdx);
  
  if (estabaHabilitado) {
    bloque.diasHabilitados = bloque.diasHabilitados.filter(d => d !== diaIdx);
  } else {
    bloque.diasHabilitados.push(diaIdx);
    
    // Si el bloque no tiene horarios cargados, cargarlos desde el backend
    if (bloque.horarios.length === 0 && bloque.id) {
      // Usar la fecha desde del bloque o la fecha actual
      const fechaReferencia = bloque.fechaDesde || new Date().toISOString().split('T')[0];
      const slots = await cargarSlotsDesdeBackend(parseInt(profesionalCentroId!), fechaReferencia);
      bloque.horarios = slots.map(slot => slot.hora);
      
      // También cargar excepciones si existen
      if (bloque.id) {
        const resExcepciones = await fetch(`${API_BASE_URL}/agenda-excepciones/por-agenda/${bloque.id}`);
        const excepciones = await resExcepciones.json();
        const horariosDeshabilitadosSet = new Set<number>();
        for (const excepcion of excepciones) {
          for (let i = 0; i < bloque.horarios.length; i++) {
            const horario = bloque.horarios[i];
            if (horario >= excepcion.horaDesde && horario < excepcion.horaHasta) {
              horariosDeshabilitadosSet.add(i);
            }
          }
        }
        if (horariosDeshabilitadosSet.size > 0) {
          bloque.horariosDeshabilitados[diaIdx] = Array.from(horariosDeshabilitadosSet);
        }
      }
    }
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

  const toggleExpandirBloque = (index: number) => {
    setBloquesExpandidos(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
    
    const bloquesSinDias = bloques.filter(b => b.diasHabilitados.length === 0);
    if (bloquesSinDias.length > 0) {
      alert('Hay bloques sin días habilitados. Por favor, seleccione al menos un día para cada bloque o elimine los bloques vacíos.');
      return;
    }
    
    setGuardando(true);
    setErrorMessage(null);
    
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
    } catch (err: any) {
      console.error('Error guardando agenda:', err);
      
      const errorMessageText = err.message || '';
      
      alert(errorMessageText);
      
      if (errorMessageText.includes('solapa') || errorMessageText.includes('exclusion') || errorMessageText.includes('conflicto') || errorMessageText.includes('violates exclusion constraint')) {
        const nuevosBloques = [...bloques];
        const bloqueEliminado = nuevosBloques.pop();
        
        if (bloqueEliminado) {
          setBloques(nuevosBloques);
          setTieneCambios(true);
          alert(`Se ha eliminado automáticamente el bloque conflictivo (${bloqueEliminado.horaDesde} a ${bloqueEliminado.horaHasta}) para resolver el solapamiento.\n\nPor favor, revise la configuración y vuelva a intentarlo.`);
        }
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
