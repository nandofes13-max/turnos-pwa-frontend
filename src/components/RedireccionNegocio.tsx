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
        console.log('Buscando negocio con URL:', url);
        const response = await fetch(`${API_BASE_URL}/negocios/url/${url}`);
        const data = await response.json();

        if (response.ok && data.id) {
          console.log('Negocio encontrado:', data);
          
          const actividadesResponse = await fetch(`${API_BASE_URL}/negocio-actividades/negocio/${data.id}`);
          const actividades = await actividadesResponse.json();
          
          console.log('Actividades del negocio:', actividades);
          
          if (actividades && actividades.length > 0) {
            const primeraActividad = actividades[0];
            const actividadId = primeraActividad.actividadId;
            const actividadNombre = primeraActividad.actividad?.nombre || 'Actividad';
            
            console.log('Redirigiendo a actividad:', actividadId);
            
            // ✅ Enviar negocioId en state Y en query params (para máxima compatibilidad)
            navigate(`/actividad/${actividadId}/especialidad?negocioId=${data.id}&negocioNombre=${encodeURIComponent(data.nombre)}`, {
              state: { 
                negocioId: data.id,
                negocioNombre: data.nombre,
                actividadNombre: actividadNombre
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
