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

  // ============================================================
  // VALIDACIÓN DE SOLAPAMIENTO EN FRONTEND
  // ============================================================
  const validarSolapamientoBloque = (
    nuevoDesde: string,
    nuevoHasta: string,
    nuevaDuracion: number,
    nuevaFechaDesde: string,
    nuevaFechaHasta: string | null,
    bloquesExistentes: BloqueHorario[],
    bloqueIdAActualizar?: number
  ): { valido: boolean; mensaje: string } => {
    
    for (const bloque of bloquesExistentes) {
      // Si estamos editando un bloque, ignorar el mismo bloque
      if (bloqueIdAActualizar && bloque.id === bloqueIdAActualizar) continue;
      
      // Solo validar contra bloques activos (sin fecha_baja)
      if (bloque.fecha_baja) continue;
      
      // Verificar solapamiento de horarios
      const haySolapamientoHorario = (
        nuevoDesde < bloque.horaHasta && nuevoHasta > bloque.horaDesde
      );
      
      if (!haySolapamientoHorario) continue;
      
      // Verificar solapamiento de fechas
      const bloqueFechaHasta = bloque.fechaHasta || '9999-12-31';
      const nuevaFechaHastaFinal = nuevaFechaHasta || '9999-12-31';
      
      const haySolapamientoFechas = (
        nuevaFechaDesde <= bloqueFechaHasta &&
        nuevaFechaHastaFinal >= bloque.fechaDesde
      );
      
      if (haySolapamientoFechas) {
        const vigenciaBloque = bloque.fechaHasta 
          ? `desde ${bloque.fechaDesde} hasta ${bloque.fechaHasta}`
          : `desde ${bloque.fechaDesde} (indefinido)`;
        
        return {
          valido: false,
          mensaje: `❌ Solapa con bloque existente: ${bloque.horaDesde} a ${bloque.horaHasta} (${vigenciaBloque})`
        };
      }
    }
    
    return { valido: true, mensaje: '' };
  };

  // Validar duplicado exacto
  const validarDuplicadoExacto = (
    nuevoDesde: string,
    nuevoHasta: string,
    nuevaDuracion: number,
    nuevaFechaDesde: string,
    nuevaFechaHasta: string | null,
    bloquesExistentes: BloqueHorario[]
  ): { valido: boolean; mensaje: string } => {
    
    for (const bloque of bloquesExistentes) {
      if (bloque.fecha_baja) continue;
      
      const esMismoHorario = (
        normalizarHora(bloque.horaDesde) === normalizarHora(nuevoDesde) &&
        normalizarHora(bloque.horaHasta) === normalizarHora(nuevoHasta)
      );
      
      const esMismaDuracion = bloque.duracionTurno === nuevaDuracion;
      const esMismaFechaDesde = bloque.fechaDesde === nuevaFechaDesde;
      const esMismaFechaHasta = bloque.fechaHasta === nuevaFechaHasta;
      
      if (esMismoHorario && esMismaDuracion && esMismaFechaDesde && esMismaFechaHasta) {
        return {
          valido: false,
          mensaje: `❌ Ya existe un bloque idéntico: ${nuevoDesde} a ${nuevoHasta} (${nuevaDuracion} min) vigente desde ${nuevaFechaDesde}`
        };
      }
    }
    
    return { valido: true, mensaje: '' };
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
            console.log(`[Bloque ${bloque.id}] Usando ${bloque.horarios.length} horarios del backend`);
          } else {
            bloque.horarios = generarHorariosLocal(bloque.horaDesde, bloque.horaHasta, bloque.duracionTurno);
            console.log(`[Bloque ${bloque.id}] Usando horarios locales (${bloque.horarios.length}) porque slots está vacío`);
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
  
  // VALIDACIÓN SOLO: Evitar duplicados exactos (mismo desde, mismo hasta, misma duración, mismas fechas)
  const duplicadoExacto = bloques.some(bloque => {
    if (bloque.fecha_baja) return false;
    
    return (
      normalizarHora(bloque.horaDesde) === normalizarHora(nuevoDesde) &&
      normalizarHora(bloque.horaHasta) === normalizarHora(nuevoHasta) &&
      bloque.duracionTurno === duracionFinal &&
      bloque.fechaDesde === nuevaFechaDesde &&
      bloque.fechaHasta === fechaHastaFinal
    );
  });
  
  if (duplicadoExacto) {
    alert(`❌ Ya existe un bloque idéntico: ${nuevoDesde} a ${nuevoHasta} (${duracionFinal} min) vigente desde ${nuevaFechaDesde}`);
    return;
  }
  
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
  
  // Limpiar formulario
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
      alert(err.message || `Error al ${accion} el bloque`);
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
        if (!bloque.id) {
          console.log(`⚠️ Bloque sin ID (nuevo), se guardará al crear la agenda`);
          continue;
        }
        
        const diasHabilitados = bloque.diasHabilitados.map(diaIdx => {
          if (diaIdx === 6) return 0;
          return diaIdx + 1;
        });
        
        const excepcionesHorarios: { diaSemana: number; horaDesde: string; horaHasta: string }[] = [];
        
        const payload = {
          agendaDisponibilidadId: bloque.id,
          profesionalCentroId: parseInt(profesionalCentroId!),
          horaDesde: bloque.horaDesde,
          horaHasta: bloque.horaHasta,
          duracionTurno: bloque.duracionTurno,
          fechaDesde: bloque.fechaDesde,
          fechaHasta: bloque.fechaHasta,
          diasHabilitados: diasHabilitados,
          excepcionesHorarios: excepcionesHorarios
        };
        
        console.log(`📤 Enviando bloque ${bloque.horaDesde} a ${bloque.horaHasta} (ID: ${bloque.id})`);
        
        const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/sincronizar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          let errorMessageText = '';
          
          try {
            const errorData = await response.json();
            console.error('Error response del backend:', errorData);
            
            if (errorData.message) {
              if (Array.isArray(errorData.message)) {
                errorMessageText = errorData.message.join(', ');
              } else {
                errorMessageText = errorData.message;
              }
            } else if (errorData.error) {
              errorMessageText = errorData.error;
            } else {
              errorMessageText = response.statusText;
            }
          } catch (e) {
            errorMessageText = response.statusText || `Error ${response.status}`;
          }
          
          if (!errorMessageText) {
            errorMessageText = 'Error al guardar la agenda';
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
                  className={estaActivo ? 'tm-btn-danger' : 'tm-btn-success'}
                  style={{ padding: '4px 12px' }}
                >
                  {estaActivo ? 'Desactivar' : 'Activar'}
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
                        onClick={() => estaActivo && toggleDia(idx, diaIdx)}
                        className={`agenda-dia-boton ${estaHabilitado ? 'habilitado' : 'deshabilitado'}`}
                        disabled={!estaActivo}
                      >
                        {dia}
                        <div className="agenda-dia-icono">
                          {estaHabilitado ? '✅' : '🔒'}
                        </div>
                      </button>
                      
                      {estaHabilitado && bloque.horarios.length > 0 && (
                        <div className="agenda-horarios">
                          {bloque.horarios.map((horario, horarioIdx) => (
                            <div key={horarioIdx} className="agenda-horario-texto">
                              {horario}
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
