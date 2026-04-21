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

const generarHorariosLocal = (desde: string, hasta: string, duracion: number): string[] => {
  const horarios: string[] = [];
  const normalizar = (hora: string) => hora.split(':').slice(0, 2).join(':');
  let actual = normalizar(desde);
  const horaFin = normalizar(hasta);
  
  while (actual < horaFin) {
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
  
  const [opcionesHora, setOpcionesHora] = useState<string[]>([]);

  const normalizarHora = (hora: string): string => {
    if (!hora) return hora;
    return hora.substring(0, 5);
  };

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

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resRelacion = await fetch(`${API_BASE_URL}/profesional-centro/${profesionalCentroId}`);
      const dataRelacion = await resRelacion.json();
      setRelacion(dataRelacion);
      
      const resAgendas = await fetch(`${API_BASE_URL}/agenda-disponibilidad/por-profesional-centro/${profesionalCentroId}`);
      const dataAgendas = await resAgendas.json();
      
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
            diasHabilitados: [],
            fecha_baja: ag.fecha_baja,
          };
        }
        
        grupos[clave].diasIds.push(ag.id);
        
        if (!grupos[clave].diasHabilitados.includes(diaIdx)) {
          grupos[clave].diasHabilitados.push(diaIdx);
        }
      }
      
      const bloquesCargados: BloqueHorario[] = Object.values(grupos);
      
      for (const bloque of bloquesCargados) {
        if (bloque.id) {
          const fechaReferencia = bloque.fechaDesde || new Date().toISOString().split('T')[0];
          const slots = await cargarSlotsDesdeBackend(parseInt(profesionalCentroId!), fechaReferencia);
       
          if (slots && slots.length > 0) {
            bloque.horarios = slots.map(slot => slot.hora);
          } else {
            bloque.horarios = generarHorariosLocal(bloque.horaDesde, bloque.horaHasta, bloque.duracionTurno);
          }
        } else {
          bloque.horarios = generarHorariosLocal(bloque.horaDesde, bloque.horaHasta, bloque.duracionTurno);
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
    const fechaHastaFinal = nuevaFechaHasta || null;
    
    // Buscar bloque INACTIVO con mismo horario base
    const bloqueInactivo = bloques.find(bloque => {
      const estaInactivo = !!bloque.fecha_baja;
      if (!estaInactivo) return false;
      
      return (
        normalizarHora(bloque.horaDesde) === normalizarHora(nuevoDesde) &&
        normalizarHora(bloque.horaHasta) === normalizarHora(nuevoHasta) &&
        bloque.duracionTurno === duracionFinal
      );
    });
    
    // Buscar bloque ACTIVO con mismo horario base
    const bloqueActivo = bloques.find(bloque => {
      const estaActivo = !bloque.fecha_baja;
      if (!estaActivo) return false;
      
      return (
        normalizarHora(bloque.horaDesde) === normalizarHora(nuevoDesde) &&
        normalizarHora(bloque.horaHasta) === normalizarHora(nuevoHasta) &&
        bloque.duracionTurno === duracionFinal
      );
    });
    
    // Caso 1: Ya existe ACTIVO
    if (bloqueActivo) {
      alert(`❌ Ya existe un bloque ACTIVO con el mismo horario (${nuevoDesde} a ${nuevoHasta}) y duración (${duracionFinal} min).`);
      return;
    }
    
    // Caso 2: Existe INACTIVO → ofrecer reactivar (sin días)
    if (bloqueInactivo) {
      const confirmar = window.confirm(
        `⚠️ Ya existe un bloque INACTIVO con el mismo horario (${nuevoDesde} a ${nuevoHasta}) y duración (${duracionFinal} min).\n\n` +
        `¿Desea REACTIVARLO? Se mantendrá el horario y duración, pero los días quedarán sin seleccionar.`
      );
      
      if (confirmar) {
        bloqueInactivo.fecha_baja = null;
        bloqueInactivo.horaDesde = nuevoDesde;
        bloqueInactivo.horaHasta = nuevoHasta;
        bloqueInactivo.duracionTurno = duracionFinal;
        bloqueInactivo.fechaDesde = nuevaFechaDesde;
        bloqueInactivo.fechaHasta = fechaHastaFinal;
        bloqueInactivo.horarios = generarHorariosLocal(nuevoDesde, nuevoHasta, duracionFinal);
        bloqueInactivo.diasHabilitados = []; // Resetear días
        
        setBloques([...bloques]);
        setTieneCambios(true);
        
        alert(`✅ Bloque reactivado correctamente. Los días quedaron sin seleccionar. No olvide guardar los cambios.`);
      }
      
      setNuevoDesde('');
      setNuevoHasta('');
      setNuevaDuracion(0);
      setMostrarOtraDuracion(false);
      setOtraDuracion('');
      setNuevaFechaDesde(new Date().toISOString().split('T')[0]);
      setNuevaFechaHasta('');
      
      return;
    }
    
    // Caso 3: No existe ningún bloque → crear nuevo
    const horarios = generarHorariosLocal(nuevoDesde, nuevoHasta, duracionFinal);
    
    const nuevoBloque: BloqueHorario = {
      diasHabilitados: [],
      horaDesde: nuevoDesde,
      horaHasta: nuevoHasta,
      duracionTurno: duracionFinal,
      fechaDesde: nuevaFechaDesde,
      fechaHasta: fechaHastaFinal,
      horarios: horarios,
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
    
    alert('✅ Bloque agregado correctamente (aún no guardado)');
  };
  
  const toggleActivarBloque = async (index: number) => {
    const bloque = bloques[index];
    
    if (!bloque.diasIds || bloque.diasIds.length === 0) {
      alert('No se encontraron IDs para este bloque');
      return;
    }
    
    const idsValidos = bloque.diasIds.filter(id => typeof id === 'number' && !isNaN(id));
    
    if (idsValidos.length === 0) {
      alert('No hay IDs válidos para este bloque');
      return;
    }
    
    const estaActivo = !bloque.fecha_baja;
    const accion = estaActivo ? 'desactivar' : 'activar';
    
    // Validación preventiva antes de activar (solo si está inactivo)
    if (!estaActivo) {
      // Verificar si ya existe un bloque ACTIVO con mismo día y horario solapado
      const bloqueConConflicto = bloques.find(b => {
        if (b.id === bloque.id) return false;
        if (!b.fecha_baja) return false; // solo activos
        if (b.diasIds?.some(id => bloque.diasIds?.includes(id))) return false;
        
        const diasCompartidos = bloque.diasHabilitados.filter(dia => b.diasHabilitados.includes(dia));
        if (diasCompartidos.length === 0) return false;
        
        const haySolapamientoHorario = (
          bloque.horaDesde < b.horaHasta && bloque.horaHasta > b.horaDesde
        );
        
        return haySolapamientoHorario;
      });
      
      if (bloqueConConflicto) {
        alert(`❌ No se puede activar porque ya existe otro bloque ACTIVO con horario ${bloqueConConflicto.horaDesde} a ${bloqueConConflicto.horaHasta} que solapa en los mismos días.`);
        return;
      }
    }
    
    if (!window.confirm(`¿Está seguro de ${accion} este bloque?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/activar-desactivar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: idsValidos,
          activar: !estaActivo
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error al ${accion} el bloque`);
      }
      
      await cargarDatos();
      setTieneCambios(true);
      
      alert(estaActivo ? 'Bloque desactivado' : 'Bloque activado');
    } catch (err: any) {
      console.error('Error:', err);
      alert(`❌ ${err.message}`);
    }
  };
  
  const toggleDia = (bloqueIndex: number, diaIdx: number) => {
    const bloque = bloques[bloqueIndex];
    const estaActivo = !bloque.fecha_baja;
    
    // Si el bloque está INACTIVO, no permitir toggle
    if (!estaActivo) return;
    
    const nuevosBloques = [...bloques];
    const bloqueActual = nuevosBloques[bloqueIndex];
    if (bloqueActual.diasHabilitados.includes(diaIdx)) {
      bloqueActual.diasHabilitados = bloqueActual.diasHabilitados.filter(d => d !== diaIdx);
    } else {
      bloqueActual.diasHabilitados.push(diaIdx);
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
    for (const bloque of bloques) {
      // ============================================================
      // CASO 1: Bloque NUEVO (sin ID) → CREAR primero
      // ============================================================
      if (!bloque.id) {
        console.log(`🆕 Bloque nuevo (${bloque.horaDesde} a ${bloque.horaHasta}) - Creando en BD...`);
        
        // Obtener el primer día habilitado para el dia_semana (por ahora usamos 1 como default)
        // El POST necesita un dia_semana, usamos el primero de la lista o 1 por defecto
        const primerDiaHabilitado = bloque.diasHabilitados.length > 0 ? bloque.diasHabilitados[0] : 1;
        let diaSemanaParaCrear = primerDiaHabilitado;
        if (diaSemanaParaCrear === 6) {
          diaSemanaParaCrear = 0;
        } else {
          diaSemanaParaCrear = diaSemanaParaCrear + 1;
        }
        
        const createPayload = {
          profesionalCentroId: parseInt(profesionalCentroId!),
          diaSemana: diaSemanaParaCrear,
          horaDesde: bloque.horaDesde,
          horaHasta: bloque.horaHasta,
          duracionTurno: bloque.duracionTurno,
          bufferMinutos: 0,
          fechaDesde: bloque.fechaDesde,
          fechaHasta: bloque.fechaHasta
        };
        
        console.log('📤 Create payload:', JSON.stringify(createPayload, null, 2));
        
        const createResponse = await fetch(`${API_BASE_URL}/agenda-disponibilidad`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload)
        });
        
        if (!createResponse.ok) {
          let errorMsg = 'Error al crear el bloque';
          try {
            const errorData = await createResponse.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) {}
          throw new Error(errorMsg);
        }
        
        const nuevoBloqueCreado = await createResponse.json();
        console.log(`✅ Bloque creado con ID: ${nuevoBloqueCreado.id}`);
        
        // Actualizar el bloque en el estado local con el nuevo ID
        bloque.id = nuevoBloqueCreado.id;
        
        // Ahora sincronizar los días para este bloque
        const diasHabilitados = bloque.diasHabilitados.map(diaIdx => {
          if (diaIdx === 6) return 0;
          return diaIdx + 1;
        });
        
        const syncPayload = {
          agendaDisponibilidadId: bloque.id,
          profesionalCentroId: parseInt(profesionalCentroId!),
          horaDesde: bloque.horaDesde,
          horaHasta: bloque.horaHasta,
          duracionTurno: bloque.duracionTurno,
          fechaDesde: bloque.fechaDesde,
          fechaHasta: bloque.fechaHasta,
          diasHabilitados: diasHabilitados,
          excepcionesHorarios: []
        };
        
        console.log(`📤 Sincronizando días para bloque ${bloque.id}:`, JSON.stringify(syncPayload, null, 2));
        
        const syncResponse = await fetch(`${API_BASE_URL}/agenda-disponibilidad/sincronizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload)
        });
        
        if (!syncResponse.ok) {
          let errorMsg = 'Error al sincronizar días';
          try {
            const errorData = await syncResponse.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) {}
          throw new Error(errorMsg);
        }
        
        console.log(`✅ Bloque ${bloque.id} sincronizado correctamente`);
        continue;
      }
      
      // ============================================================
      // CASO 2: Bloque EXISTENTE (con ID) → Solo sincronizar
      // ============================================================
      const diasHabilitados = bloque.diasHabilitados.map(diaIdx => {
        if (diaIdx === 6) return 0;
        return diaIdx + 1;
      });
      
      const payload = {
        agendaDisponibilidadId: bloque.id,
        profesionalCentroId: parseInt(profesionalCentroId!),
        horaDesde: bloque.horaDesde,
        horaHasta: bloque.horaHasta,
        duracionTurno: bloque.duracionTurno,
        fechaDesde: bloque.fechaDesde,
        fechaHasta: bloque.fechaHasta,
        diasHabilitados: diasHabilitados,
        excepcionesHorarios: []
      };
      
      console.log(`📤 Actualizando bloque ${bloque.id}:`, JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/sincronizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    }
    
    alert('✅ Agenda guardada correctamente');
    setTieneCambios(false);
    await cargarDatos();
  } catch (err: any) {
    console.error('Error guardando agenda:', err);
    alert(`❌ ${err.message}`);
    setErrorMessage(err.message);
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
        </div>
      </div>

      {bloques.map((bloque, idx) => {
        const estaActivo = !bloque.fecha_baja;
        const estaExpandido = bloquesExpandidos[idx];
        
        const formatVigencia = () => {
          const fechaDesdeDate = new Date(bloque.fechaDesde);
          const fechaDesdeFormateada = fechaDesdeDate.toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(',', '');
          
          if (bloque.fecha_baja) {
            const fechaBajaDate = new Date(bloque.fecha_baja);
            const fechaBajaFormateada = fechaBajaDate.toLocaleString('es-AR', {
              timeZone: 'America/Argentina/Buenos_Aires',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(',', '');
            return `Desde ${fechaDesdeFormateada} hs Hasta ${fechaBajaFormateada} hs`;
          } else {
            return `Desde ${fechaDesdeFormateada} hs indefinida`;
          }
        };
        
        return (
          <div key={idx} className="agenda-bloque">
            <div className="agenda-bloque-header">
              <div className="agenda-bloque-info" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>
                  <strong>Bloque:</strong> {bloque.horaDesde} a {bloque.horaHasta} | 
                  <strong> Duración:</strong> {bloque.duracionTurno} min | 
                  <strong> Vigencia:</strong> {formatVigencia()}
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
                  className={estaActivo ? 'tm-btn-estado-activo' : 'tm-btn-estado-inactivo'}
                  title={estaActivo ? 'Haga click para desactivar este bloque' : 'Haga click para activar este bloque'}
                >
                  {estaActivo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>
            
            {estaExpandido && (
              <div className="agenda-grilla">
                {DIAS_CORTO.map((dia, diaIdx) => {
                  const estaHabilitado = bloque.diasHabilitados.includes(diaIdx);
                  return (
                    <div key={diaIdx} className="agenda-dia-columna">
                      <button
                        onClick={() => toggleDia(idx, diaIdx)}
                        className={`agenda-dia-boton ${estaHabilitado ? 'habilitado' : 'deshabilitado'} ${!estaActivo ? 'inactivo' : ''}`}
                        disabled={!estaActivo}
                        title={!estaActivo ? 'Bloque inactivo - No se pueden modificar días' : (estaHabilitado ? 'Deshabilitar día' : 'Habilitar día')}
                      >
                        {dia}
                        <div className="agenda-dia-icono">
                          {!estaActivo ? '🔒' : (estaHabilitado ? '✅' : '🔒')}
                        </div>
                      </button>
                      
                      {estaHabilitado && bloque.horarios.length > 0 && (
                        <div className="agenda-horarios">
                          {bloque.horarios.map((horario, horarioIdx) => (
                            <div 
                              key={horarioIdx} 
                              className={`agenda-horario-texto ${!estaActivo ? 'inactivo' : ''}`}
                              title={!estaActivo ? 'Bloque inactivo' : 'Horario disponible'}
                            >
                              {horario} {!estaActivo && '🔒'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
    </div>
  );
}
