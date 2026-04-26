import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import styles from '../styles/Especialidad.module.css';
import inicioStyles from '../styles/Inicio.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface EspecialidadType {
  id: number;
  nombre: string;
}

export default function Especialidad() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actividadId, actividadNombre } = location.state || { actividadId: null, actividadNombre: 'Actividad' };
  
  const [especialidades, setEspecialidades] = useState<EspecialidadType[]>([]);
  const [filtradas, setFiltradas] = useState<EspecialidadType[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const NEGOCIO_DEMO_ID = 6;

  const handleVolver = () => {
    navigate(-1); // Vuelve a la pantalla anterior
  };

  const handleEspecialidadSeleccionada = (especialidad: EspecialidadType) => {
    alert(`Has seleccionado: ${especialidad.nombre} - (Demo)`);
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
          `${API_BASE_URL}/profesional-centro/especialidades-con-disponibilidad?negocioId=${NEGOCIO_DEMO_ID}&actividadId=${actividadId}`
        );
        
        if (!response.ok) {
          throw new Error('Error al cargar las especialidades');
        }
        
        const data = await response.json();
        setEspecialidades(data);
        setFiltradas(data);
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
          
          <div className={inicioStyles['inicio-logo-mobile']}>
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={inicioStyles['inicio-logo-mobile-img']}
            />
          </div>

          <div className={inicioStyles['inicio-card']}>
            {/* Botón volver */}
            <div className={styles['volver-container']}>
              <button onClick={handleVolver} className={styles['btn-volver']}>
                <FaArrowLeft /> Volver
              </button>
            </div>

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

      {/* Columna derecha - LOGO (solo desktop) */}
      <div className={inicioStyles['inicio-right']}>
        <div className={inicioStyles['inicio-right-content']}>
          <img 
            src="/1000133565.png" 
            alt="PWA Turnos" 
            className={inicioStyles['inicio-logo-desktop']}
          />
        </div>
      </div>
    </div>
  );
}
