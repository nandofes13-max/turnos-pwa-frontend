import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface NegocioData {
  id: number;
  nombre: string;
  url: string;
}

interface Actividad {
  id: number;
  nombre: string;
}

export default function RedireccionNegocio() {
  const { url } = useParams<{ url: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerNegocio = async () => {
      if (!url) {
        setError('URL no válida');
        setCargando(false);
        return;
      }

      try {
        console.log('Buscando negocio con URL:', url);
        const response = await fetch(`${API_BASE_URL}/negocios/url/${url}`);
        const data = await response.json();

        if (response.ok && data.id) {
          console.log('Negocio encontrado:', data);
          
          // PASO 1: Obtener actividades del negocio
          const actividadesResponse = await fetch(`${API_BASE_URL}/negocio-actividades/negocio/${data.id}`);
          const actividades = await actividadesResponse.json();
          
          console.log('Actividades del negocio:', actividades);
          
          if (!actividades || actividades.length === 0) {
            setError('Este negocio no tiene actividades configuradas');
            setCargando(false);
            return;
          }
          
          // Si tiene más de una actividad, redirigir a pantalla de selección
          if (actividades.length > 1) {
            console.log('Múltiples actividades, redirigiendo a selección');
            navigate(`/negocio/${url}/actividad`, {
              state: { 
                negocioId: data.id,
                negocioNombre: data.nombre,
                negocioUrl: url,
                actividades: actividades
              }
            });
            return;
          }
          
          // PASO 2: Una sola actividad, obtener especialidades (usando el nuevo endpoint)
          const primeraActividad = actividades[0];
          const actividadId = primeraActividad.actividadId;
          const actividadNombre = primeraActividad.actividad?.nombre || 'Actividad';
          
          console.log(`Obteniendo especialidades para negocio ${data.id} usando agenda-publica`);
          const especialidadesResponse = await fetch(`${API_BASE_URL}/agenda-publica/especialidades-por-negocio?negocioId=${data.id}`);
          const especialidades = await especialidadesResponse.json();
          
          console.log('Especialidades encontradas:', especialidades);
          
          if (!especialidades || especialidades.length === 0) {
            setError('Este negocio no tiene especialidades con horarios disponibles');
            setCargando(false);
            return;
          }
          
          // Si tiene más de una especialidad, redirigir a pantalla de especialidades
          if (especialidades.length > 1) {
            console.log('Múltiples especialidades, redirigiendo a selección');
            navigate(`/negocio/${url}/actividad/${actividadId}/especialidad`, {
              state: {
                negocioId: data.id,
                negocioNombre: data.nombre,
                negocioUrl: url,
                actividadNombre: actividadNombre,
                especialidades: especialidades
              }
            });
            return;
          }
          
          // PASO 3: Una sola especialidad, obtener centros
          const unaEspecialidad = especialidades[0];
          const especialidadId = unaEspecialidad.id;
          const especialidadNombre = unaEspecialidad.nombre;
          
          const centrosResponse = await fetch(`${API_BASE_URL}/profesional-centro/centros-por-especialidad/${data.id}/${especialidadId}`);
          const centros = await centrosResponse.json();
          
          console.log('Centros encontrados:', centros);
          
          if (!centros || centros.length === 0) {
            setError('Este negocio no tiene centros disponibles para esta especialidad');
            setCargando(false);
            return;
          }
          
          // Si tiene más de un centro, redirigir a pantalla de centros
          if (centros.length > 1) {
            console.log('Múltiples centros, redirigiendo a selección');
            navigate(`/negocio/${url}/actividad/${actividadId}/especialidad/${especialidadId}/centro`, {
              state: {
                negocioId: data.id,
                negocioNombre: data.nombre,
                negocioUrl: url,
                actividadNombre: actividadNombre,
                especialidadNombre: especialidadNombre,
                centros: centros
              }
            });
            return;
          }
          
          // PASO 4: Un solo centro, obtener profesionales y agenda
          const unCentro = centros[0];
          const centroId = unCentro.id;
          const centroNombre = unCentro.nombre;
          
          // Redirigir directamente a la agenda
          console.log('Redirigiendo directamente a agenda');
          navigate(`/actividad/${actividadId}/especialidad/${especialidadId}/centro/${centroId}/agenda`, {
            state: {
              actividadNombre: actividadNombre,
              especialidadNombre: especialidadNombre,
              centroNombre: centroNombre,
              negocioId: data.id,
              negocioNombre: data.nombre,
              negocioUrl: url
            }
          });
          
        } else {
          setError('Negocio no encontrado');
        }
      } catch (error) {
        console.error('Error al obtener negocio:', error);
        setError('Error al cargar el negocio');
      } finally {
        setCargando(false);
      }
    };

    obtenerNegocio();
  }, [url, navigate]);

  if (cargando) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    );
  }

  return null;
}
