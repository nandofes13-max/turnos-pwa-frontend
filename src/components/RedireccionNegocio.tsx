import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface NegocioData {
  id: number;
  nombre: string;
  url: string;
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
        const response = await fetch(`${API_BASE_URL}/negocios/url/${url}`);
        const data = await response.json();

        if (response.ok && data.id) {
          // ✅ Obtener la primera actividad del negocio
          const actividadesResponse = await fetch(`${API_BASE_URL}/negocio-actividades/negocio/${data.id}`);
          const actividades = await actividadesResponse.json();
          
          if (actividades && actividades.length > 0) {
            const primeraActividadId = actividades[0].actividadId;
            // Redirigir a la pantalla de especialidad de esa actividad
            navigate(`/actividad/${primeraActividadId}/especialidad`, {
              state: { 
                negocioId: data.id,
                negocioNombre: data.nombre,
                actividadNombre: actividades[0].actividad?.nombre || 'Actividad'
              }
            });
          } else {
            setError('Este negocio no tiene actividades configuradas');
          }
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
