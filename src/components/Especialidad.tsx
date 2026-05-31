import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Breadcrumb from './Breadcrumb';
import styles from '../styles/Especialidad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface EspecialidadType {
  id: number;
  nombre: string;
  negocioId: number;
  actividadId: number;
}

export default function Especialidad() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actividadId } = useParams<{ actividadId: string }>();
  
  // Leer query params
  const queryParams = new URLSearchParams(location.search);
  const negocioIdFromQuery = queryParams.get('negocioId');
  const negocioNombreFromQuery = queryParams.get('negocioNombre');
  const negocioUrlFromQuery = queryParams.get('negocioUrl');
  
  // Prioridad: state > query params > valores por defecto
  const { 
    actividadNombre, 
    negocioId: negocioIdFromState, 
    negocioNombre: negocioNombreFromState,
    negocioUrl: negocioUrlFromState 
  } = location.state || { 
    actividadNombre: 'Actividad',
    negocioId: null,
    negocioNombre: null,
    negocioUrl: null
  };
  
  const negocioId = negocioIdFromState || negocioIdFromQuery || 6;
  const negocioNombre = negocioNombreFromState || negocioNombreFromQuery || 'DEMO';
  const negocioUrl = negocioUrlFromState || negocioUrlFromQuery || null;
  const actividadNombreFinal = actividadNombre || 'Actividad';
  const esNegocioReal = negocioId !== 6;
  
  const [especialidades, setEspecialidades] = useState<EspecialidadType[]>([]);
  const [filtradas, setFiltradas] = useState<EspecialidadType[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const handleEspecialidadSeleccionada = (especialidad: EspecialidadType) => {
    navigate(`/actividad/${actividadId}/especialidad/${especialidad.id}/centro?negocioId=${negocioId}&negocioNombre=${encodeURIComponent(negocioNombre)}&negocioUrl=${negocioUrl || ''}`, {
      state: {
        actividadNombre: actividadNombreFinal,
        especialidadNombre: especialidad.nombre,
        negocioId: negocioId,
        negocioNombre: negocioNombre,
        negocioUrl: negocioUrl
      }
    });
  };

  useEffect(() => {
    const cargarEspecialidades = async () => {
      if (!actividadId) {
        console.error('No se recibió actividadId');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = `${API_BASE_URL}/actividad-especialidad/especialidades-por-negocio-actividad/${negocioId}/${actividadId}`;
        console.log('Cargando especialidades desde:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Error al cargar las especialidades');
        }
        
        const data = await response.json();
        console.log('Especialidades recibidas:', data.length);
        
        const dataOrdenada = [...data].sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );
        setEspecialidades(dataOrdenada);
        setFiltradas(dataOrdenada);
      } catch (err: any) {
        console.error('Error:', err);
        setEspecialidades([]);
        setFiltradas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarEspecialidades();
  }, [actividadId, negocioId]);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setFiltradas(especialidades);
    } else {
      const filtrado = especialidades.filter(esp =>
        esp.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      setFiltradas(filtrado);
    }
  }, [busqueda, especialidades]);

  // Definir los items del breadcrumb según si hay negocio o no
  const breadcrumbItems = [];
  
  if (esNegocioReal && negocioUrl) {
    breadcrumbItems.push({ label: negocioNombre, path: `/negocio/${negocioUrl}` });
    breadcrumbItems.push({ label: 'Actividad', path: `/negocio/${negocioUrl}/actividad` });
    breadcrumbItems.push({ label: 'Especialidad' });
  } else {
    breadcrumbItems.push({ label: 'Actividad', path: '/actividad' });
    breadcrumbItems.push({ label: 'Especialidad' });
  }

  if (loading) {
    return (
      <div className={inicioStyles['inicio-container']}>
        <div className={inicioStyles['inicio-left']}>
          <div className={inicioStyles['inicio-left-content']}>
            <div className={inicioStyles['inicio-card']}>
              <h1 className={inicioStyles['inicio-titulo']}>Cargando especialidades...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={inicioStyles['inicio-container']}>
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          
          {/* Logo móvil - redirige al home del negocio si existe */}
          <div className={inicioStyles['inicio-logo-mobile']}>
            <a href={esNegocioReal && negocioUrl ? `/negocio/${negocioUrl}` : '/'}>
              <img 
                src="/1000133565.png" 
                alt="PWA Turnos" 
                className={inicioStyles['inicio-logo-mobile-img']}
              />
            </a>
          </div>

          <div className={inicioStyles['inicio-card']}>
            <Breadcrumb items={breadcrumbItems} />

            <div className={styles['seleccion-info']}>
              Has seleccionado: 
              {esNegocioReal && <strong> {negocioNombre} &gt; </strong>}
              <strong>{actividadNombreFinal}</strong>
            </div>

            <h1 className={inicioStyles['inicio-titulo']}>Busca o selecciona una especialidad</h1>
            
            <div className={styles['busqueda-container']}>
              <div className={styles['busqueda-input-wrapper']}>
                <FaSearch className={styles['busqueda-icono']} />
                <input
                  type="text"
                  placeholder="Buscar Especialidad"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className={styles['busqueda-input']}
                />
              </div>
            </div>

            <h2 className={styles['subtitulo']}>Especialidad</h2>

            {filtradas.length === 0 ? (
              <p className={styles['sin-resultados']}>No hay especialidades disponibles</p>
            ) : (
              <div className={styles['especialidad-grid']}>
                {filtradas.map((especialidad) => (
                  <button 
                    key={especialidad.id}
                    onClick={() => handleEspecialidadSeleccionada(especialidad)}
                    className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
                  >
                    {especialidad.nombre}
                  </button>
                ))}
              </div>
            )}

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

      {/* Columna derecha - Logo (solo desktop) - redirige al home del negocio si existe */}
      <div className={inicioStyles['inicio-right']}>
        <div className={inicioStyles['inicio-right-content']}>
          <a href={esNegocioReal && negocioUrl ? `/negocio/${negocioUrl}` : '/'}>
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
