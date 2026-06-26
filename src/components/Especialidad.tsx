import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Breadcrumb from './Breadcrumb';
import SolicitarServicioModal from './SolicitarServicioModal'; // 👈 NUEVO
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
  const { actividadId, negocioUrl: negocioUrlParam } = useParams<{ actividadId: string; negocioUrl: string }>();
  
  const queryParams = new URLSearchParams(location.search);
  const negocioIdFromQuery = queryParams.get('negocioId');
  const negocioNombreFromQuery = queryParams.get('negocioNombre');
  const negocioUrlFromQuery = queryParams.get('negocioUrl');
  
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
  const negocioUrl = negocioUrlParam || negocioUrlFromQuery || negocioUrlFromState || null;
  const actividadNombreFinal = actividadNombre || 'Actividad';
  const esNegocioReal = !!negocioUrl && negocioUrl !== '';
  
  const [especialidades, setEspecialidades] = useState<EspecialidadType[]>([]);
  const [filtradas, setFiltradas] = useState<EspecialidadType[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false); // 👈 NUEVO

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

  // 👈 NUEVO: Funciones para el footer
  const handleAyuda = () => {
    setModalAbierto(true);
  };

  const handleTerminos = () => {
    navigate('/terminos');
  };

  const handlePoliticas = () => {
    navigate('/privacidad');
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

            {/* 👈 FOOTER MODIFICADO */}
            <div className={inicioStyles['inicio-footer']}>
              <button 
                onClick={handleAyuda} 
                className={inicioStyles['inicio-footer-link']}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ¿Necesitas Ayuda?
              </button>
              <button 
                onClick={handleTerminos} 
                className={inicioStyles['inicio-footer-link']}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Términos y Condiciones
              </button>
              <button 
                onClick={handlePoliticas} 
                className={inicioStyles['inicio-footer-link']}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Políticas de Privacidad
              </button>
              <div className={inicioStyles['inicio-version']}>v.1.00</div>
            </div>
          </div>
        </div>
      </div>

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

      {/* 👈 NUEVO: Modal de ayuda */}
      <SolicitarServicioModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}
