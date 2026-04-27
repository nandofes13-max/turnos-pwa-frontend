import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { actividadId } = useParams<{ actividadId: string }>();
  
  const [especialidades, setEspecialidades] = useState<EspecialidadType[]>([]);
  const [filtradas, setFiltradas] = useState<EspecialidadType[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const NEGOCIO_DEMO_ID = 6;

  // ... resto del código igual
const handleEspecialidadSeleccionada = (especialidad: EspecialidadType) => {
  navigate(`/actividad/${actividadId}/especialidad/${especialidad.id}/centro`);
    // Aquí después navegará al siguiente paso (profesional/centro)
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
        const response = await fetch(
          `${API_BASE_URL}/actividad-especialidad/especialidades-por-negocio-actividad/${NEGOCIO_DEMO_ID}/${actividadId}`
        );
        
        if (!response.ok) {
          throw new Error('Error al cargar las especialidades');
        }
        
       const data = await response.json();
// Ordenar alfabéticamente por nombre
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
  }, [actividadId]);

  // Filtrar especialidades por búsqueda
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
                    <Breadcrumb items={[
  { label: 'Actividad', path: '/actividad' },
  { label: 'Especialidad' }
]} />

            <h1 className={inicioStyles['inicio-titulo']}>Busca o selecciona una especialidad</h1>
            
            {/* Caja de búsqueda */}
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

            {/* Subtítulo */}
            <h2 className={styles['subtitulo']}>Especialidad</h2>

            {/* Grilla de especialidades */}
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
