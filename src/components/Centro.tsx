import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Breadcrumb from './Breadcrumb';
import styles from '../styles/Centro.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface CentroType {
  id: number;
  nombre: string;
  codigo: string;
  city: string;
  es_virtual: boolean;
  formatted_address: string;
  latitude: string;
  longitude: string;
}

export default function Centro() {
  const navigate = useNavigate();
  const { actividadId, especialidadId } = useParams<{ actividadId: string; especialidadId: string }>();
  const location = useLocation();
  const { actividadNombre, especialidadNombre } = location.state || { 
    actividadNombre: 'Actividad', 
    especialidadNombre: 'Especialidad' 
  };
  
  const [centros, setCentros] = useState<CentroType[]>([]);
  const [filtrados, setFiltrados] = useState<CentroType[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalCentro, setModalCentro] = useState<CentroType | null>(null);

  const NEGOCIO_DEMO_ID = 6;

  const handleCentroSeleccionado = (centro: CentroType) => {
    // Navegar a la pantalla de Agenda
    navigate(`/actividad/${actividadId}/especialidad/${especialidadId}/centro/${centro.id}/agenda`, {
      state: {
        actividadNombre: actividadNombre,
        especialidadNombre: especialidadNombre,
        centroNombre: centro.nombre
      }
    });
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

  const getTooltip = (centro: CentroType) => {
    if (centro.es_virtual) {
      return `${centro.nombre}\nCódigo: ${centro.codigo}\nTipo: Virtual`;
    }
    return `${centro.nombre}\nCódigo: ${centro.codigo}\nCiudad: ${centro.city}\nDirección: ${centro.formatted_address}`;
  };

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
      <div className={inicioStyles['inicio-left']}>
        <div className={inicioStyles['inicio-left-content']}>
          
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
            <Breadcrumb items={[
              { label: 'Actividad', path: '/actividad' },
              { label: 'Especialidad', path: `/actividad/${actividadId}/especialidad` },
              { label: 'Centro' }
            ]} />

            <div className={styles['seleccion-info']}>
              Has seleccionado: <strong>{actividadNombre}</strong> &gt; <strong>{especialidadNombre}</strong>
            </div>

            <h1 className={inicioStyles['inicio-titulo']}>Selecciona un centro</h1>
            
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

            <h2 className={styles['subtitulo']}>Centros disponibles</h2>

            {filtrados.length === 0 ? (
              <p className={styles['sin-resultados']}>No hay centros disponibles</p>
            ) : (
              <div className={styles['centro-list']}>
                {filtrados.map((centro) => (
                  <button 
                    key={centro.id}
                    onClick={() => setModalCentro(centro)}
                    className={`${inicioStyles['inicio-btn']} ${inicioStyles['inicio-btn-demo']}`}
                    title={getTooltip(centro)}
                  >
                    {centro.es_virtual ? '🖥️' : '🏢'} {centro.nombre} - {centro.city}
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

      {modalCentro && (
        <div className={styles['modal-overlay']} onClick={() => setModalCentro(null)}>
          <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles['modal-titulo']}>
              {modalCentro.es_virtual ? '🖥️' : '🏢'} {modalCentro.nombre}
            </h3>
            <div className={styles['modal-campo']}>
              <strong>Código:</strong> {modalCentro.codigo}
            </div>
            <div className={styles['modal-campo']}>
              <strong>Ciudad:</strong> {modalCentro.city}
            </div>
            {!modalCentro.es_virtual && (
              <div className={styles['modal-campo']}>
                <strong>Dirección:</strong> {modalCentro.formatted_address}
              </div>
            )}
            <div className={styles['modal-campo']}>
              <strong>Tipo:</strong> {modalCentro.es_virtual ? 'Virtual' : 'Presencial'}
            </div>
            <button 
              onClick={() => {
                setModalCentro(null);
                handleCentroSeleccionado(modalCentro);
              }}
              className={styles['modal-boton']}
            >
              Seleccionar este centro
            </button>
            <button 
              onClick={() => setModalCentro(null)}
              className={styles['modal-cerrar']}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
