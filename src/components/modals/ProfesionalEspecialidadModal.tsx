// src/components/modals/ProfesionalEspecialidadModal.tsx
import { useState, useEffect } from 'react';

interface Especialidad {
  id: number;
  nombre: string;
  fecha_baja?: string | null;
}

interface Profesional {
  id: number;
  nombre: string;
  documento: string;
}

interface ProfesionalEspecialidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profesionalId: number | null;
  profesionalNombre?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const RELACIONES_URL = `${API_BASE_URL}/profesional-especialidad`;
const ESPECIALIDADES_URL = `${API_BASE_URL}/especialidades`;

export default function ProfesionalEspecialidadModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  profesionalId,
  profesionalNombre 
}: ProfesionalEspecialidadModalProps) {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadesAsignadas, setEspecialidadesAsignadas] = useState<number[]>([]);
  const [especialidadId, setEspecialidadId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar especialidades disponibles al abrir el modal
  useEffect(() => {
    if (isOpen && profesionalId) {
      fetchEspecialidades();
      cargarEspecialidadesAsignadas();
    }
  }, [isOpen, profesionalId]);

  const fetchEspecialidades = async () => {
    try {
      const res = await fetch(ESPECIALIDADES_URL);
      const data = await res.json();
      setEspecialidades(data.filter((e: Especialidad) => !e.fecha_baja));
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  };

  const cargarEspecialidadesAsignadas = async () => {
    if (!profesionalId) return;
    try {
      const res = await fetch(`${RELACIONES_URL}/por-profesional/${profesionalId}`);
      if (res.ok) {
        const data = await res.json();
        const ids = data.map((r: any) => r.especialidadId);
        setEspecialidadesAsignadas(ids);
      }
    } catch (err) {
      console.error('Error cargando especialidades asignadas:', err);
    }
  };

  const handleAsignar = async () => {
    if (!especialidadId) {
      setErrorMessage('Debe seleccionar una especialidad');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(RELACIONES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profesionalId: profesionalId,
          especialidadId: parseInt(especialidadId),
          descripcion: descripcion || null
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al asignar especialidad');
      }

      // Limpiar y cerrar
      setEspecialidadId('');
      setDescripcion('');
      setErrorMessage(null);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo asignar la especialidad');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="tm-modal-titulo">
          Asignar Especialidad a {profesionalNombre || 'Profesional'}
        </h3>
        {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
        
        <div className="tm-modal-campo">
          <label className="tm-modal-label">Especialidad *</label>
          <select
            value={especialidadId}
            onChange={(e) => setEspecialidadId(e.target.value)}
            className="tm-modal-input"
            required
          >
            <option value="">Seleccionar especialidad...</option>
            {especialidades
              .filter(e => !especialidadesAsignadas.includes(e.id))
              .map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
          </select>
          {especialidades.filter(e => !especialidadesAsignadas.includes(e.id)).length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ No hay especialidades disponibles. Todas ya están asignadas a este profesional.
            </p>
          )}
        </div>

        <div className="tm-modal-campo">
          <label className="tm-modal-label">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Especialista en cardiología clínica"
            className="tm-modal-input tm-input-descripcion"
            rows={3}
          />
          <small className="tm-ayuda-texto">Descripción de la especialidad para este profesional (opcional)</small>
        </div>

        <div className="tm-modal-acciones">
          <button onClick={onClose} className="tm-btn-secundario">Cancelar</button>
          <button onClick={handleAsignar} className="tm-btn-primario" disabled={loading}>
            {loading ? 'Asignando...' : 'Asignar Especialidad'}
          </button>
        </div>
      </div>
    </div>
  );
}
