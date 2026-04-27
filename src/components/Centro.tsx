import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Breadcrumb from './Breadcrumb';
import styles from '../styles/Centro.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface CentroType {
  id: number;
  nombre: string;
  codigo: string;
  formatted_address: string;
  latitude: string;
  longitude: string;
}

// Función para extraer la ciudad de la dirección
const extraerCiudad = (formatted_address: string) => {
  if (!formatted_address) return '';
  const partes = formatted_address.split(',');
  for (const parte of partes) {
    const trimmed = parte.trim();
    if (!trimmed.match(/^\d+$/) && trimmed !== 'Argentina' && !trimmed.includes('Provincia')) {
      return trimmed;
    }
  }
  return partes[1]?.trim() || 'Ciudad no especificada';
};

export default function Centro() {
  const navigate = useNavigate();
  const { actividadId, especialidadId } = useParams<{ actividadId: string; especialidadId: string }>();
  
  const [centros, setCentros] = useState<CentroType[]>([]);
  const [filtrados, setFiltrados] = useState<CentroType[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const NEGOCIO_DEMO_ID = 6;

  const handleCentroSeleccionado = (centro: CentroType) => {
    alert(`Has seleccionado: ${centro.nombre} - (Demo)`);
    // Aquí después navegará al siguiente paso (profesional/agenda)
  };

  useEffect(() => {
    const cargarCentros = async () => {
      if (!especialidadId) {
        console.error('No se recibió especialidadId');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/profesional-centro/centros-por-especialidad/${NEGOCIO_DEMO_ID}/${especialidadId}`
        );
        
        if (!response.ok) {
          throw new Error('Error al cargar los centros');
        }
        
        const data = await response.json();
        // Ordenar alfabéticamente por nombre
        const dataOrdenada = [...data].sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );
        setCentros(dataOrdenada);
        setFiltrados(dataOrdenada);
      } catch (err: any) {
        console.error('Error:', err);
        setCentros([]);
        setFiltrados([]);
      } finally {
        setLoading(false);
      }
    };

    cargarCentros();
  }, [especialidadId]);

  // Filtrar centros por búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setFiltrados(centros);
    } else {
      const filtrado = centros.filter(centro =>
        centro.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      setFiltrados(filtrado);
    }
  }, [busqueda, centros]);

  if (loading) {
    return (
      <div className={inicioStyles['inicio-container']}>
        <div className={inicioStyles['inicio-left']}>
          <div className={inicioStyles['inicio-left-content']}>
            <div className={inicioStyles['inicio-card']}>
              <h1 className={inicioStyles['inicio-titulo']}>Cargando centros...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={inicioStyles['inicio-container']}>
      {/* Columna izquierda */}
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          
          {/* Logo solo visible en móvil - con enlace a home */}
          <div className={inicioStyles['inicio-logo-mobile']}>
            <a href="/">
              <img 
                src="/1000133565.png" 
                alt="PWA Turnos" 
                className={inicioStyles['inicio-logo-mobile-img']}
              />
            </a>
          </div>

          <div className={inicioStyles['inicio-card']}>
            {/* Breadcrumb de navegación */}
            <Breadcrumb items={[
              { label: 'Actividad', path: '/actividad' },
              { label: 'Especialidad', path: `/actividad/${actividadId}/especialidad` },
              { label: 'Centro' }
            ]} />

            <h1 className={inicioStyles['inicio-titulo']}>Selecciona un centro</h1>
            
            {/* Caja de búsqueda */}
            <div className={styles['busqueda-container']}>
              <div className={styles['busqueda-input-wrapper']}>
                <FaSearch className={styles['busqueda-icono']} />
                <input
                  type="text"
                  placeholder="Buscar Centro"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className={styles['busqueda-input']}
                />
              </div>
            </div>

            {/* Subtítulo */}
            <h2 className={styles['subtitulo']}>Centros disponibles</h2>

            {/* Lista vertical de centros */}
            {filtrados.length === 0 ? (
              <p className={styles['sin-resultados']}>No hay centros disponibles</p>
            ) : (
              <div className={styles['centro-list']}>
                {filtrados.map((centro) => (
                  <button 
                    key={centro.id}
                    onClick={() => handleCentroSeleccionado(centro)}
                    className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
                    title={`${centro.nombre}\nCódigo: ${centro.codigo}\nDirección: ${centro.formatted_address}`}
                  >
                    <strong>{centro.nombre}</strong> - {extraerCiudad(centro.formatted_address)}
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className={inicioStyles['inicio-footer']}>
              <a onClick={() => alert('Ayuda')} className={inicioStyles['inicio-footer-link']}>
                ¿Necesitas Ayuda?
              </a>
              <a onClick={() => alert('Términos')} className={inicioStyles['inicio-footer-link']}>
                Términos y Condiciones
              </a>
              <a onClick={() => alert('Políticas')} className={inicioStyles['inicio-footer-link']}>
                Políticas de Privacidad
              </a>
              <div className={inicioStyles['inicio-version']}>
                v.0.10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha - LOGO (solo desktop) con enlace a home */}
      <div className={inicioStyles['inicio-right']}>
        <div className={inicioStyles['inicio-right-content']}>
          <a href="/">
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={inicioStyles['inicio-logo-desktop']}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
