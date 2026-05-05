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
    timezone?: string;
    negocio: { id: number; nombre: string; url: string };
  };
}

interface BloqueHorario {
  id?: number;
  diaSemana: number;
  horaDesde: string;
  horaHasta: string;
  duracionTurno: number;
  fechaDesde: string;
  fechaHasta: string | null;
  horarios: string[];
  fecha_baja?: string | null;
  timezone?: string;  // 🔹 AGREGADO
}

interface SlotBackend {
  hora: string;
  bloqueado: boolean;
  disponible: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DIAS_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const normalizarHora = (hora: string): string => {
  if (!hora) return hora;
  return hora.substring(0, 5);
};

const uiToBdDay = (uiDay: number): number => {
  if (uiDay === 6) return 0;
  return uiDay + 1;
};

const bdToUiDay = (bdDay: number): number => {
  if (bdDay === 0) return 6;
  return bdDay - 1;
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
  const horaInicio = normalizarHora(desde);
  const horaFin = normalizarHora(hasta);
  
  let horaActual = horaInicio;
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

const ordenarBloques = (bloques: BloqueHorario[]): BloqueHorario[] => {
  return [...bloques].sort((a, b) => {
    const aOrder = a.diaSemana === 0 ? 7 : a.diaSemana;
    const bOrder = b.diaSemana === 0 ? 7 : b.diaSemana;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return a.horaDesde.localeCompare(b.horaDesde);
  });
};

// 🔹 Función para formatear timezone de forma amigable
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
  
  const [nuevoDiaUI, setNuevoDiaUI] = useState<number | null>(null);
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

  const cargarSlotsDesdeBackend = async (profesionalCentroId: number, agendaId: number): Promise<SlotBackend[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/generar-slots-por-id?profesionalCentroId=${profesionalCentroId}&agendaId=${agendaId}`);
      if (!response.ok) {
        throw new Error('Error al cargar slots');
      }
      const slots = await response.json();
      return slots.map((slot: any) => ({
        ...slot,
        hora: normalizarHora(slot.hora)
      }));
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
      
      const bloquesCargados: BloqueHorario[] = [];
      
      for (const ag of dataAgendas) {
        let horarios: string[] = [];
        const slots = await cargarSlotsDesdeBackend(parseInt(profesionalCentroId!), ag.id);
        
        if (slots && slots.length > 0) {
          horarios = slots.map(slot => slot.hora);
        } else {
          horarios = generarHorariosLocal(ag.horaDesde, ag.horaHasta, ag.duracionTurno);
        }
        
        bloquesCargados.push({
          id: ag.id,
          diaSemana: ag.diaSemana,
          horaDesde: normalizarHora(ag.horaDesde),
          horaHasta: normalizarHora(ag.horaHasta),
          duracionTurno: ag.duracionTurno,
          fechaDesde: ag.fechaDesde,
          fechaHasta: ag.fechaHasta,
          horarios: horarios,
          fecha_baja: ag.fecha_baja,
          timezone: ag.timezone,  // 🔹 AGREGADO: guardar timezone del backend
        });
      }
      
      const bloquesOrdenados = ordenarBloques(bloquesCargados);
      setBloques(bloquesOrdenados);
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
    if (nuevoDiaUI === null) {
      alert('Seleccione un día');
      return false;
    }
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
    
    const nuevoDiaBD = uiToBdDay(nuevoDiaUI!);
    const nombreDia = DIAS_COMPLETO[nuevoDiaUI!];
    
    const bloqueSolapadoActivo = bloques.find(bloque => {
      const estaActivo = !bloque.fecha_baja;
      if (!estaActivo) return false;
      if (bloque.diaSemana !== nuevoDiaBD) return false;
      const haySolapamientoHorario = (
        (nuevoDesde < bloque.horaHasta && nuevoHasta > bloque.horaDesde)
      );
      return haySolapamientoHorario;
    });
    
    if (bloqueSolapadoActivo) {
      alert(`❌ SOLAPAMIENTO: Ya existe un bloque ACTIVO para ${nombreDia} con horario ${bloqueSolapadoActivo.horaDesde} a ${bloqueSolapadoActivo.horaHasta} (duración ${bloqueSolapadoActivo.duracionTurno} min).`);
      return;
    }
    
    const duplicadoActivo = bloques.find(bloque => {
      const estaActivo = !bloque.fecha_baja;
      if (!estaActivo) return false;
      return (
        bloque.diaSemana === nuevoDiaBD &&
        bloque.horaDesde === nuevoDesde &&
        bloque.horaHasta === nuevoHasta &&
        bloque.duracionTurno === duracionFinal
      );
    });
    
    if (duplicadoActivo) {
      alert(`❌ Ya existe un bloque ACTIVO para ${nombreDia} con el mismo horario y duración.`);
      return;
    }
    
    const duplicadoInactivo = bloques.find(bloque => {
      const estaInactivo = !!bloque.fecha_baja;
      if (!estaInactivo) return false;
      return (
        bloque.diaSemana === nuevoDiaBD &&
        bloque.horaDesde === nuevoDesde &&
        bloque.horaHasta === nuevoHasta &&
        bloque.duracionTurno === duracionFinal
      );
    });
    
    if (duplicadoInactivo) {
      const confirmar = window.confirm(
        `⚠️ Ya existe un bloque INACTIVO para ${nombreDia} con el mismo horario y duración.\n\n¿Desea REACTIVARLO?`
      );
      
      if (confirmar) {
        duplicadoInactivo.fecha_baja = null;
        duplicadoInactivo.horaDesde = nuevoDesde;
        duplicadoInactivo.horaHasta = nuevoHasta;
        duplicadoInactivo.duracionTurno = duracionFinal;
        duplicadoInactivo.fechaDesde = nuevaFechaDesde;
        duplicadoInactivo.fechaHasta = fechaHastaFinal;
        duplicadoInactivo.horarios = generarHorariosLocal(nuevoDesde, nuevoHasta, duracionFinal);
        
        setBloques(ordenarBloques([...bloques]));
        setTieneCambios(true);
        
        alert(`✅ Bloque reactivado correctamente para ${nombreDia}.`);
      }
      
      setNuevoDiaUI(null);
      setNuevoDesde('');
      setNuevoHasta('');
      setNuevaDuracion(0);
      setMostrarOtraDuracion(false);
      setOtraDuracion('');
      setNuevaFechaDesde(new Date().toISOString().split('T')[0]);
      setNuevaFechaHasta('');
      
      return;
    }
    
    const horarios = generarHorariosLocal(nuevoDesde, nuevoHasta, duracionFinal);
    
    // 🔹 Usar el timezone del centro para el nuevo bloque
    const timezoneDelCentro = relacion?.centro.timezone || 'America/Argentina/Buenos_Aires';
    
    const nuevoBloque: BloqueHorario = {
      diaSemana: nuevoDiaBD,
      horaDesde: nuevoDesde,
      horaHasta: nuevoHasta,
      duracionTurno: duracionFinal,
      fechaDesde: nuevaFechaDesde,
      fechaHasta: fechaHastaFinal,
      horarios: horarios,
      fecha_baja: null,
      timezone: timezoneDelCentro,  // 🔹 AGREGADO
    };
    
    const nuevosBloques = ordenarBloques([...bloques, nuevoBloque]);
    setBloques(nuevosBloques);
    setTieneCambios(true);
    
    setNuevoDiaUI(null);
    setNuevoDesde('');
    setNuevoHasta('');
    setNuevaDuracion(0);
    setMostrarOtraDuracion(false);
    setOtraDuracion('');
    setNuevaFechaDesde(new Date().toISOString().split('T')[0]);
    setNuevaFechaHasta('');
    setErrorMessage(null);
    
    alert(`✅ Bloque agregado correctamente para ${nombreDia} (aún no guardado)`);
  };
  
  const toggleActivarBloque = async (index: number) => {
    const bloque = bloques[index];
    
    if (!bloque.id) {
      alert('Este bloque aún no tiene ID. Debe guardar la agenda primero.');
      return;
    }
    
    const estaActivo = !bloque.fecha_baja;
    const diaUI = bdToUiDay(bloque.diaSemana);
    const nombreDia = DIAS_COMPLETO[diaUI];
    const accion = estaActivo ? 'desactivar' : 'activar';
    
    if (!window.confirm(`¿Está seguro de ${accion} el bloque para ${nombreDia}?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/activar-desactivar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [bloque.id],
          activar: !estaActivo
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error al ${accion} el bloque`);
      }
      
      await cargarDatos();
      setTieneCambios(true);
      
      alert(estaActivo ? `Bloque de ${nombreDia} desactivado` : `Bloque de ${nombreDia} activado`);
    } catch (err: any) {
      console.error('Error:', err);
      alert(`❌ ${err.message}`);
    }
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
    
    setGuardando(true);
    setErrorMessage(null);

    // Validación de solapamiento en frontend
    for (let i = 0; i < bloques.length; i++) {
      const bloqueA = bloques[i];
      if (bloqueA.fecha_baja) continue;
      
      for (let j = i + 1; j < bloques.length; j++) {
        const bloqueB = bloques[j];
        if (bloqueB.fecha_baja) continue;
        
        if (bloqueA.diaSemana !== bloqueB.diaSemana) continue;
        
        const haySolapamiento = (
          (bloqueA.horaDesde < bloqueB.horaHasta && bloqueA.horaHasta > bloqueB.horaDesde)
        );
        
        if (haySolapamiento) {
          const diaNombre = DIAS_COMPLETO[bdToUiDay(bloqueA.diaSemana)];
          alert(`❌ SOLAPAMIENTO: Los bloques de ${diaNombre} tienen horarios que se cruzan.\n\nPor favor, corrija los horarios antes de guardar.`);
          setGuardando(false);
          return;
        }
      }
    }

    // Preparar payload para enviar TODOS los bloques
    const payload = {
      bloques: bloques.map(bloque => ({
        id: bloque.id,
        profesionalCentroId: parseInt(profesionalCentroId!),
        diaSemana: bloque.diaSemana,
        horaDesde: bloque.horaDesde,
        horaHasta: bloque.horaHasta,
        duracionTurno: bloque.duracionTurno,
        bufferMinutos: 0,
        fechaDesde: bloque.fechaDesde,
        fechaHasta: bloque.fechaHasta,
        fecha_baja: bloque.fecha_baja,
        timezone: bloque.timezone,  // 🔹 AGREGADO: enviar timezone al backend
        diasHabilitados: bloque.diasHabilitados
      }))
    };

    console.log('📦 Enviando lote de bloques:', payload);

    try {
      const response = await fetch(`${API_BASE_URL}/agenda-disponibilidad/guardar-lote`, {
        method: 'POST',
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

      alert('✅ Agenda guardada correctamente');
      setTieneCambios(false);
      await cargarDatos();
      
    } catch (err: any) {
      console.error('Error guardando agenda:', err);
      alert(`❌ ${err.message}`);
      setErrorMessage(err.message);
      await cargarDatos();
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
          <p className="agenda-info-item">
            <span className="agenda-info-label">Negocio:</span> {relacion?.centro.negocio.nombre} ({relacion?.centro.negocio.url}) | 
            <span className="agenda-info-label"> Especialidad:</span> {relacion?.especialidad.nombre} | 
            <span className="agenda-info-label"> Profesional:</span> {relacion?.profesional.nombre} (DNI: {relacion?.profesional.documento})
          </p>
          <p className="agenda-info-item">
            <span className="agenda-info-label">Centro:</span> {relacion?.centro.codigo} - {relacion?.centro.nombre} - {relacion?.centro.formatted_address || 'Sin domicilio'}
            {relacion?.centro.timezone && (
              <span style={{ marginLeft: '8px', backgroundColor: '#e3f2fd', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                🕒 Zona horaria: {formatearTimezone(relacion.centro.timezone)}
              </span>
            )}
          </p>
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
          <div className="agenda-form-field" style={{ minWidth: '120px' }}>
            <label className="agenda-form-label">Día</label>
            <select 
              value={nuevoDiaUI !== null ? nuevoDiaUI : ''} 
              onChange={(e) => setNuevoDiaUI(parseInt(e.target.value))} 
              className="agenda-form-input"
            >
              <option value="" disabled>Seleccionar día...</option>
              {DIAS_COMPLETO.map((dia, idx) => (
                <option key={idx} value={idx}>{dia}</option>
              ))}
            </select>
          </div>
          
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
        const diaUI = bdToUiDay(bloque.diaSemana);
        const nombreDia = DIAS_COMPLETO[diaUI];
        
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
                  <strong>{nombreDia}:</strong> {bloque.horaDesde} a {bloque.horaHasta} | 
                  <strong> Duración:</strong> {bloque.duracionTurno} min | 
                  <strong> Vigencia:</strong> {formatVigencia()}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  ID: {bloque.id || 'nuevo'} | Estado: {estaActivo ? 'ACTIVO' : 'INACTIVO'} 
                  {bloque.timezone && ` | Zona horaria: ${formatearTimezone(bloque.timezone)}`}
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
                <div className="agenda-dia-columna">
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
                </div>
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
