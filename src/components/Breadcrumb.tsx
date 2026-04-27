import { useLocation, Link } from 'react-router-dom';
import styles from '../styles/Breadcrumb.module.css';

// Mapeo de rutas a nombres legibles
const breadcrumbMap: { [key: string]: string } = {
  'actividad': 'Actividad',
  'especialidad': 'Especialidad',
  'profesional': 'Profesional',
  'centro': 'Centro',
  'horario': 'Horario',
  'turno': 'Turno',
  'agenda-disponibilidad': 'Agenda',
  'cpanel': 'Panel de Control',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Si estamos en home o solo la raíz, no mostrar breadcrumb
  if (pathnames.length === 0) return null;

  return (
    <div className={styles['breadcrumb-container']}>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = breadcrumbMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

        return (
          <span key={name}>
            {index > 0 && <span className={styles['separator']}> &gt; </span>}
            {isLast ? (
              <span className={styles['current']}>{label}</span>
            ) : (
              <Link to={routeTo} className={styles['link']}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
