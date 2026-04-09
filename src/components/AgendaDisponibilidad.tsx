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
  diaSemana: number;
  horaDesde: string;
  horaHasta: string;
  duracionTurno: number;
  fechaDesde: string;
  fechaHasta: string | null;
  horariosHabilitados: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DIAS_CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DIAS_TOOLTIP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Generar opciones de hora según duración
const generarOpcionesHora = (duracion: number): string[] => {
  const opciones: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += duracion) {
      opciones.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
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
  
  const [nuevoDesde, setNuevoDesde] = useState('08:00');
  const [nuevoHasta, setNuevoHasta] = useState('12:00');
  const [nuevaDuracion, setNuevaDuracion] = useState(30);
  const [otraDuracion, setOtraDuracion] = useState('');
  const [mostrarOtraDuracion, setMostrarOtraDuracion] = useState(false);
  const [nuevaFechaDesde, setNuevaFechaDesde] = useState(new Date().toISOString().split('T')[0]);
  const [nuevaFechaHasta, setNuevaFechaHasta] = useState('');
  
  // Bloqueo de fechas
  const [rangoBloqueoInicio, setRangoBloqueoInicio] = useState('');
  const [rangoBloqueoFin, setRangoBloqueoFin] = useState('');
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  
  // Opciones de hora según duración
  const [opcionesHora, setOpcionesHora] = useState<string[]>(generarOpcionesHora(30));

  // Actualizar opciones de hora cuando cambia la duración
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

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resRelacion = await fetch(`${API_BASE_URL}/profesional-centro/${profesionalCentroId}`);
      const dataRelacion = await resRelacion.json();
      setRelacion(dataRelacion);
      
      const resAgendas = await fetch(`${API_BASE_URL}/agenda-disponibilidad/por-profesional-centro/${profesionalCentroId}`);
      const dataAgendas = await resAgendas.json();
      
      const bloquesCargados: BloqueHorario[] = dataAgendas.map((ag: any) => ({
        id: ag.id,
        diaSemana: ag.diaSemana,
        horaDesde: ag.horaDesde,
        horaHasta: ag.horaHasta,
        duracionTurno: ag.duracionTurno,
        fechaDesde: ag.fechaDesde,
        fechaHasta: ag.fechaHasta,
        horariosHabilitados: generarHorarios(ag.horaDesde, ag.horaHasta, ag.duracionTurno)
      }));
      setBloques(bloquesCargados);
      
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
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

  const obtenerDuracionFinal = () => {
    return mostrarOtraDuracion ? parseInt(otraDuracion) : nuevaDuracion;
  };

  const agregarBloque = () => {
    const duracionFinal = obtenerDuracionFinal();
    if (!nuevoDesde || !nuevoHasta || !duracionFinal || nuevoDesde >= nuevoHasta) {
      alert('Complete los campos del bloque correctamente');
      return;
    }
    
    const nuevoBloque: BloqueHorario = {
      diaSemana: -1,
      horaDesde: nuevoDesde,
      horaHasta: nuevoHasta,
      duracionTurno: duracionFinal,
      fechaDesde: nuevaFechaDesde,
      fechaHasta: nuevaFechaHasta || null,
      horariosHabilitados: generarHorarios(nuevoDesde, nuevoHasta, duracionFinal)
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

  const toggleDia = (bloqueIndex: number, diaSemana: number) => {
    const nuevosBloques = [...bloques];
    const bloque = nuevosBloques[bloqueIndex];
    if (bloque.diaSemana === diaSemana) {
      bloque.diaSemana = -1;
    } else {
      bloque.diaSemana = diaSemana;
    }
    setBloques(nuevosBloques);
    setTieneCambios(true);
  };

  const toggleHorario = (bloqueIndex: number, horario: string) => {
    const nuevosBloques = [...bloques];
    const bloque = nuevosBloques[bloqueIndex];
    if (bloque.horariosHabilitados.includes(horario)) {
      bloque.horariosHabilitados = bloque.horariosHabilitados.filter(h => h !== horario);
    } else {
      bloque.horariosHabilitados.push(horario);
      bloque.horariosHabilitados.sort();
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
    
    setGuardando(true);
    try {
      for (const bloque of bloques) {
        if (bloque.diaSemana >= 0 && bloque.diaSemana <= 6) {
          const payload = {
            profesionalCentroId: parseInt(profesionalCentroId!),
            diaSemana: bloque.diaSemana,
            horaDesde: bloque.horaDesde,
            horaHasta: bloque.horaHasta,
            duracionTurno: bloque.duracionTurno,
            bufferMinutos: 0,
            fechaDesde: bloque.fechaDesde,
            fechaHasta: bloque.fechaHasta
          };
          
          if (bloque.id) {
            await fetch(`${API_BASE_URL}/agenda-disponibilidad/${bloque.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } else {
            await fetch(`${API_BASE_URL}/agenda-disponibilidad`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
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

      {/* Formulario para agregar bloque */}
      <div className="agenda-form-section">
        <h3 className="agenda-form-title">Agregar Bloque Horario</h3>
        <div className="agenda-form-row">
          <div className="agenda-form-field">
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
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={0}>Otro...</option>
            </select>
            {mostrarOtraDuracion && (
              <input 
                type="number" 
                placeholder="Ingrese duración" 
                value={otraDuracion} 
                onChange={(e) => setOtraDuracion(e.target.value)} 
                className="agenda-form-input"
                style={{ marginTop: '8px' }}
              />
            )}
          </div>
          <div className="agenda-form-field">
            <label className="agenda-form-label">Desde</label>
            <select value={nuevoDesde} onChange={(e) => setNuevoDesde(e.target.value)} className="agenda-form-input">
              {opcionesHora.map(hora => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
          </div>
          <div className="agenda-form-field">
            <label className="agenda-form-label">Hasta</label>
            <select value={nuevoHasta} onChange={(e) => setNuevoHasta(e.target.value)} className="agenda-form-input">
              {opcionesHora.map(hora => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
          </div>
          <div className="agenda-form-field">
            <label className="agenda-form-label">Vigencia Desde</label>
            <input type="date" value={nuevaFechaDesde} onChange={(e) => setNuevaFechaDesde(e.target.value)} className="agenda-form-input" />
          </div>
          <div className="agenda-form-field">
            <label className="agenda-form-label">Vigencia Hasta</label>
            <input type="date" value={nuevaFechaHasta} onChange={(e) => setNuevaFechaHasta(e.target.value)} className="agenda-form-input" />
          </div>
        </div>
        
        {/* Bloquear Fechas dentro de la misma sección */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
          <div className="agenda-form-row">
            <div className="agenda-form-field">
              <label className="agenda-form-label">Bloquear Desde</label>
              <input 
                type="date" 
                value={rangoBloqueoInicio} 
                min={hoy}
                onChange={(e) => setRangoBloqueoInicio(e.target.value)} 
                className="agenda-form-input" 
              />
            </div>
            <div className="agenda-form-field">
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
              <button onClick={agregarFechaBloqueada} className="tm-btn-secundario">Bloquear</button>
            </div>
          </div>
          {fechasBloqueadas.length > 0 && (
            <div className="agenda-fechas-bloqueadas">
              <strong>Fechas bloqueadas:</strong>
              <div className="agenda-fechas-lista">
                {fechasBloqueadas.map(fecha => (
                  <span key={fecha} onClick={() => eliminarFechaBloqueada(fecha)} className="agenda-fecha-item">
                    {fecha} ✖
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={agregarBloque} className="tm-btn-agregar">+ Agregar Bloque</button>
        </div>
      </div>

      {/* Lista de bloques configurados */}
      {bloques.map((bloque, idx) => (
        <div key={idx} className="agenda-bloque">
          <div className="agenda-bloque-header">
            <span className="agenda-bloque-info">
              <strong>Bloque:</strong> {bloque.horaDesde} a {bloque.horaHasta} | 
              <strong> Duración:</strong> {bloque.duracionTurno} min | 
              <strong> Vigencia:</strong> {bloque.fechaDesde} {bloque.fechaHasta ? `hasta ${bloque.fechaHasta}` : 'indefinida'}
            </span>
            <button onClick={() => eliminarBloque(idx)} className="tm-btn-danger" style={{ padding: '4px 12px' }}>Eliminar Bloque</button>
          </div>
          
          <div className="agenda-grilla">
            {DIAS_CORTO.map((dia, diaIdx) => (
              <div key={diaIdx} className="agenda-dia-columna">
                <button
                  onClick={() => toggleDia(idx, diaIdx)}
                  className={`agenda-dia-boton ${bloque.diaSemana === diaIdx ? 'habilitado' : 'deshabilitado'}`}
                  data-tooltip={bloque.diaSemana === diaIdx ? `Deshabilitar ${DIAS_TOOLTIP[diaIdx]}` : `Habilitar ${DIAS_TOOLTIP[diaIdx]}`}
                >
                  {dia}
                  <div className="agenda-dia-icono">
                    {bloque.diaSemana === diaIdx ? '✅' : '🔒'}
                  </div>
                </button>
                
                {bloque.diaSemana === diaIdx && (
                  <div className="agenda-horarios">
                    {bloque.horariosHabilitados.map(horario => (
                      <button
                        key={horario}
                        onClick={() => toggleHorario(idx, horario)}
                        className={`agenda-horario-boton ${bloque.horariosHabilitados.includes(horario) ? 'habilitado' : 'deshabilitado'}`}
                      >
                        {horario}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
}
