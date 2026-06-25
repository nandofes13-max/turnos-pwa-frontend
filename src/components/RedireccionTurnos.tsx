// src/components/RedireccionTurnos.tsx
// Componente para redirigir a la gestión de turnos de un negocio específico
// Ruta: /gestion/turnos/:slug
// Ejemplo: /gestion/turnos/gestion-turnos-a7f3k9

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function RedireccionTurnos() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerNegocioPorUrlGestion = async () => {
      if (!slug) {
        setError('URL de gestión no válida');
        setCargando(false);
        return;
      }

      try {
        console.log('🔍 Buscando negocio con URL de gestión:', slug);

        // 👈 1. Obtener todos los negocios y buscar por urlGestion
        const response = await fetch(`${API_BASE_URL}/negocios`);
        
        if (!response.ok) {
          throw new Error('Error al obtener negocios');
        }

        const negocios = await response.json();
        console.log('📋 Negocios encontrados:', negocios.length);

        // 👈 2. Buscar el negocio que tenga urlGestion igual al slug
        const negocio = negocios.find((n: any) => n.urlGestion === slug && !n.fecha_baja);

        if (negocio) {
          console.log('✅ Negocio encontrado para gestión:', negocio.id, negocio.nombre);
          // 👈 3. Redirigir a la pantalla de turnos con el negocioId en el ESTADO (no en la URL)
          navigate('/turnos', { state: { negocioId: negocio.id } });
        } else {
          console.warn('⚠️ No se encontró negocio con URL de gestión:', slug);
          setError('Negocio no encontrado. Verificá que la URL de gestión sea correcta.');
        }
      } catch (error) {
        console.error('❌ Error al obtener negocio:', error);
        setError('Error al cargar el negocio. Por favor, intentá de nuevo.');
      } finally {
        setCargando(false);
      }
    };

    obtenerNegocioPorUrlGestion();
  }, [slug, navigate]);

  if (cargando) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tm-loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Cargando acceso a la gestión de turnos...</p>
        </div>
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
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '12px' }}>❌ Error</h2>
        <p style={{ color: '#4b5563', maxWidth: '400px', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return null;
}
