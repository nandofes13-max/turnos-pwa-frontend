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
  street?: string;
  street_number?: string;
  country?: string;
  latitude: string;
  longitude: string;
}

export default function Centro() {
  const navigate = useNavigate();
  // ✅ Leer negocioUrl de los parámetros de la ruta
  const { actividadId, especialidadId, negocioUrl: negocioUrlParam } = useParams<{ 
    actividadId: string; 
    especialidadId: string;
    negocioUrl: string;
  }>();
  const location = useLocation();
  
  // Leer query params
  const queryParams = new URLSearchParams(location.search);
  const negocioIdFromQuery = queryParams.get('negocioId');
  const negocioNombreFromQuery = queryParams.get('negocioNombre');
  const negocioUrlFromQuery = queryParams.get('negocioUrl');
  
  // Prioridad: state > query params > parámetros de ruta > valores por defecto
  const { 
    actividadNombre, 
    especialidadNombre,
    negocioId: negocioIdFromState, 
    negocioNombre: negocioNombreFromState,
    negocioUrl: negocioUrlFromState 
  } = location.state || { 
    actividadNombre: 'Actividad', 
    especialidadNombre: 'Especialidad',
    negocioId: null,
    negocioNombre: null,
    negocioUrl: null
  };
  
  const negocioId = negocioIdFromState || negocioIdFromQuery || 6;
  const negocioNombre = negocioNombreFromState || negocioNombreFromQuery || 'DEMO';
  // ✅ Prioridad: parámetro de ruta > queryParams > state
  const negocioUrl = negocioUrlParam || negocioUrlFromQuery || negocioUrlFromState || null;
  const actividadNombreFinal = actividadNombre || 'Actividad';
  const especialidadNombreFinal = especialidadNombre || 'Especialidad';
  const esNegocioReal = !!negocioUrl && negocioUrl !== '';
  
  const [centros, setCentros] = useState<CentroType[]>([]);
  const [filtrados, setFiltrados] = useState<CentroType[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalCentro, setModalCentro] = useState<CentroType | null>(null);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);

  const formatearDireccion = (centro: CentroType): string => {
    if (centro.es_virtual) return 'Centro virtual';
    
    if (centro.street) {
      let direccion = centro.street;
      if (centro.street_number) {
        direccion += ` ${centro.street_number}`;
      }
      const partes = [direccion, centro.city, centro.country].filter(Boolean);
      if (partes.length > 0) {
        return partes.join(', ');
      }
    }
    
    return centro.formatted_address || 'Dirección no disponible';
  };

  const obtenerCentroCompleto = async (centroId: number): Promise<Partial<CentroType>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/centros/${centroId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          street: data.street,
          street_number: data.street_number,
          country: data.country,
        };
      }
    } catch (error) {
      console.error('Error al obtener dirección completa:', error);
    }
    return {};
  };

  const handleAbrirModal = async (centro: CentroType) => {
    setModalCentro(centro);
    setCargandoDireccion(true);
    
    const datosCompletos = await obtenerCentroCompleto(centro.id);
    setModalCentro(prev => prev ? { ...prev, ...datosCompletos } : null);
    setCargandoDireccion(false);
  };

  const handleCentroSeleccionado = (centro: CentroType) => {
    navigate(`/actividad/${actividadId}/especialidad/${especialidadId}/centro/${centro.id}/agenda?negocioId=${negocioId}&negocioNombre=${encodeURIComponent(negocioNombre)}&negocioUrl=${negocioUrl || ''}`, {
      state: {
        actividadNombre: actividadNombreFinal,
        especialidadNombre: especialidadNombreFinal,
        centroNombre: centro.nombre,
        negocioId: negocioId,
        negocioNombre: negocioNombre,
        negocioUrl: negocioUrl
      }
    });
  };

  // Definir breadcrumb según si hay negocio o no
  const breadcrumbItems = [];
  
  if (esNegocioReal && negocioUrl) {
    breadcrumbItems.push({ label: negocioNombre, path: `/negocio/${negocioUrl}` });
    breadcrumbItems.push({ label: 'Actividad', path: `/negocio/${negocioUrl}/actividad` });
    breadcrumbItems.push({ label: 'Especialidad', path: `/negocio/${negocioUrl}/actividad/${actividadId}/especialidad` });
    breadcrumbItems.push({ label: 'Centro' });
  } else {
    breadcrumbItems.push({ label: 'Actividad', path: '/actividad' });
    breadcrumbItems.push({ label: 'Especialidad', path: `/actividad/${actividadId}/especialidad` });
    breadcrumbItems.push({ label: 'Centro' });
  }

  useEffect(() => {
    const cargarCentros = async () => {
      if (!especialidadId) {
        console.error('No se recibió especialidadId');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = `${API_BASE_URL}/profesional-centro/centros-por-especialidad/${negocioId}/${especialidadId}`;
        console.log('Cargando centros desde:', url);
        
        const response = await fetch(url);
        
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
  }, [especialidadId, negocioId]);

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
    return `${centro.nombre}\nCódigo: ${centro.codigo}\nCiudad: ${centro.city}\nDirección: ${formatearDireccion(centro)}`;
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
              <strong>{actividadNombreFinal} &gt; {especialidadNombreFinal}</strong>
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
                    onClick={() => handleAbrirModal(centro)}
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
          <a href={esNegocioReal && negocioUrl ? `/negocio/${negocioUrl}` : '/'}>
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={inicioStyles['inicio-logo-desktop']}
            />
          </a>
        </div>
      </div>

      {/* Modal de detalle del centro */}
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
                <strong>Dirección:</strong> 
                {cargandoDireccion ? (
                  <span>Cargando...</span>
                ) : (
                  formatearDireccion(modalCentro)
                )}
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
