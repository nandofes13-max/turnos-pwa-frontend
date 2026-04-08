import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/tablas-maestras.css';

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
  bufferMinutos: number;
  fechaDesde: string;
  fechaHasta: string | null;
  horariosHabilitados: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AgendaDisponibilidad() {
  const { profesionalCentroId } = useParams<{ profesionalCentroId: string }>();
  const navigate = useNavigate();
  
  const [relacion, setRelacion] = useState<ProfesionalCentro | null>(null);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tieneCambios, setTieneCambios] = useState(false);
  
  // Estados para el formulario de nuevo bloque
  const [nuevoDesde, setNuevoDesde] = useState('08:00');
  const [nuevoHasta, setNuevoHasta] = useState('12:00');
  const [nuevaDuracion, setNuevaDuracion] = useState(30);
  const [otraDuracion, setOtraDuracion] = useState('');
  const [mostrarOtraDuracion, setMostrarOtraDuracion] = useState(false);
  const [nuevoBuffer, setNuevoBuffer] = useState(0);
  const [nuevaFechaDesde, setNuevaFechaDesde] = useState(new Date().toISOString().split('T')[0]);
  const [nuevaFechaHasta, setNuevaFechaHasta] = useState('');
  
  // Estados para fechas bloqueadas
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [rangoBloqueoInicio, setRangoBloqueoInicio] = useState('');
  const [rangoBloqueoFin, setRangoBloqueoFin] = useState('');

  useEffect(() => {
    if (profesionalCentroId) {
      cargarDatos();
    }
  }, [profesionalCentroId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar relación profesional-centro
      const resRelacion = await fetch(`${API_BASE_URL}/profesional-centro/${profesionalCentroId}`);
      const dataRelacion = await resRelacion.json();
      setRelacion(dataRelacion);
      
      // Cargar agendas existentes
      const resAgendas = await fetch(`${API_BASE_URL}/agenda-disponibilidad/por-profesional-centro/${profesionalCentroId}`);
      const dataAgendas = await resAgendas.json();
      
      // Transformar agendas a bloques
      const bloquesCargados: BloqueHorario[] = dataAgendas.map((ag: any) => ({
        id: ag.id,
        diaSemana: ag.diaSemana,
        horaDesde: ag.horaDesde,
        horaHasta: ag.horaHasta,
        duracionTurno: ag.duracionTurno,
        bufferMinutos: ag.bufferMinutos,
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

  const agregarBloque = () => {
    const duracionFinal = mostrarOtraDuracion ? parseInt(otraDuracion) : nuevaDuracion;
    if (!nuevoDesde || !nuevoHasta || !duracionFinal || nuevoDesde >= nuevoHasta) {
      alert('Complete los campos del bloque correctamente');
      return;
    }
    
    const nuevoBloque: BloqueHorario = {
      diaSemana: 1, // Por defecto Lunes, el operador elegirá
      horaDesde: nuevoDesde,
      horaHasta: nuevoHasta,
      duracionTurno: duracionFinal,
      bufferMinutos: nuevoBuffer,
      fechaDesde: nuevaFechaDesde,
      fechaHasta: nuevaFechaHasta || null,
      horariosHabilitados: generarHorarios(nuevoDesde, nuevoHasta, duracionFinal)
    };
    
    setBloques([...bloques, nuevoBloque]);
    setTieneCambios(true);
    
    // Resetear formulario
    setNuevoDesde('08:00');
    setNuevoHasta('12:00');
    setNuevaDuracion(30);
    setNuevoBuffer(0);
    setMostrarOtraDuracion(false);
    setOtraDuracion('');
  };

  const eliminarBloque = (index: number) => {
    const nuevosBloques = [...bloques];
    nuevosBloques.splice(index, 1);
    setBloques(nuevosBloques);
    setTieneCambios(true);
  };

  const toggleDia = (bloqueIndex: number, diaSemana: number) => {
    const nuevosBloques = [...bloques];
    const bloque = nuevosBloques[bloqueIndex];
    if (bloque.diaSemana === diaSemana) {
      bloque.diaSemana = -1; // Deshabilitar
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
      // Enviar bloques al backend
      for (const bloque of bloques) {
        if (bloque.diaSemana >= 0 && bloque.diaSemana <= 6) {
          const payload = {
            profesionalCentroId: parseInt(profesionalCentroId!),
            diaSemana: bloque.diaSemana,
            horaDesde: bloque.horaDesde,
            horaHasta: bloque.horaHasta,
            duracionTurno: bloque.duracionTurno,
            bufferMinutos: bloque.bufferMinutos,
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
      
      // Aquí también enviar fechas bloqueadas a una tabla separada (pendiente)
      
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
      {/* Encabezado con información fija */}
      <div className="tm-agenda-header">
        <h1 className="tm-titulo">Configuración de Agenda</h1>
        <div className="tm-agenda-info">
          <p><strong>Negocio:</strong> {relacion?.centro.negocio.nombre} ({relacion?.centro.negocio.url})</p>
          <p><strong>Centro:</strong> {relacion?.centro.codigo} - {relacion?.centro.nombre} - {relacion?.centro.formatted_address || 'Sin domicilio'}</p>
          <p><strong>Especialidad:</strong> {relacion?.especialidad.nombre}</p>
          <p><strong>Profesional:</strong> {relacion?.profesional.nombre} (DNI: {relacion?.profesional.documento})</p>
        </div>
      </div>

      {/* Formulario para agregar bloque horario */}
      <div className="tm-agenda-form-bloque">
        <h3>Agregar Bloque Horario</h3>
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo">
            <label>Desde</label>
            <input type="time" value={nuevoDesde} onChange={(e) => setNuevoDesde(e.target.value)} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label>Hasta</label>
            <input type="time" value={nuevoHasta} onChange={(e) => setNuevoHasta(e.target.value)} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label>Duración (min)</label>
            <select value={nuevaDuracion} onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val === 0) {
                setMostrarOtraDuracion(true);
              } else {
                setNuevaDuracion(val);
                setMostrarOtraDuracion(false);
              }
            }} className="tm-filtro-input">
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={0}>Otro...</option>
            </select>
            {mostrarOtraDuracion && (
              <input type="number" placeholder="Ingrese duración" value={otraDuracion} onChange={(e) => setOtraDuracion(e.target.value)} className="tm-filtro-input mt-1" />
            )}
          </div>
          <div className="tm-filtro-campo">
            <label>Buffer (min)</label>
            <input type="number" value={nuevoBuffer} onChange={(e) => setNuevoBuffer(parseInt(e.target.value))} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label>Vigencia Desde</label>
            <input type="date" value={nuevaFechaDesde} onChange={(e) => setNuevaFechaDesde(e.target.value)} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label>Vigencia Hasta</label>
            <input type="date" value={nuevaFechaHasta} onChange={(e) => setNuevaFechaHasta(e.target.value)} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-accion">
            <button onClick={agregarBloque} className="tm-btn-agregar">+ Agregar Bloque</button>
          </div>
        </div>
      </div>

      {/* Bloqueo de fechas */}
      <div className="tm-agenda-bloqueo-fechas">
        <h3>Bloquear Fechas</h3>
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo">
            <label>Desde</label>
            <input type="date" value={rangoBloqueoInicio} onChange={(e) => setRangoBloqueoInicio(e.target.value)} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-campo">
            <label>Hasta</label>
            <input type="date" value={rangoBloqueoFin} onChange={(e) => setRangoBloqueoFin(e.target.value)} className="tm-filtro-input" />
          </div>
          <div className="tm-filtro-accion">
            <button onClick={agregarFechaBloqueada} className="tm-btn-secundario">Bloquear</button>
          </div>
        </div>
        {fechasBloqueadas.length > 0 && (
          <div className="tm-agenda-fechas-bloqueadas">
            <strong>Fechas bloqueadas:</strong>
            <div className="tm-fechas-lista">
              {fechasBloqueadas.map(fecha => (
                <span key={fecha} className="tm-fecha-bloqueada" onClick={() => eliminarFechaBloqueada(fecha)}>
                  {fecha} ✖
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de bloques configurados */}
      {bloques.map((bloque, idx) => (
        <div key={idx} className="tm-agenda-bloque">
          <div className="tm-agenda-bloque-header">
            <span>
              Bloque: {bloque.horaDesde} a {bloque.horaHasta} | 
              Duración: {bloque.duracionTurno} min | 
              Buffer: {bloque.bufferMinutos} min | 
              Vigencia: {bloque.fechaDesde} {bloque.fechaHasta ? `hasta ${bloque.fechaHasta}` : 'indefinida'}
            </span>
            <button onClick={() => eliminarBloque(idx)} className="tm-btn-danger" style={{ padding: '4px 12px' }}>Eliminar Bloque</button>
          </div>
          
          {/* Grilla de días */}
          <div className="tm-agenda-grilla-dias">
            {DIAS.map((dia, diaIdx) => (
              <div key={diaIdx} className="tm-agenda-dia-columna">
                <div 
                  className={`tm-agenda-dia-boton ${bloque.diaSemana === diaIdx ? 'activo' : 'inactivo'}`}
                  onClick={() => toggleDia(idx, diaIdx)}
                >
                  {dia.substring(0, 3)}
                </div>
                {bloque.diaSemana === diaIdx && (
                  <div className="tm-agenda-horarios">
                    {bloque.horariosHabilitados.map(horario => (
                      <div 
                        key={horario}
                        className={`tm-agenda-horario-boton ${bloque.horariosHabilitados.includes(horario) ? 'habilitado' : 'deshabilitado'}`}
                        onClick={() => toggleHorario(idx, horario)}
                      >
                        {horario}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Botones de acción */}
      <div className="tm-modal-acciones" style={{ marginTop: '24px' }}>
        <button onClick={handleClose} className="tm-btn-secundario">Cancelar</button>
        <button onClick={guardarAgenda} className="tm-btn-primario" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar Agenda'}
        </button>
      </div>
    </div>
  );
}
