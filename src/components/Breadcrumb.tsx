//src/components/Breadcrumb.tsx
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Breadcrumb.module.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;  // Opcional, si se puede navegar a esa pantalla
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const navigate = useNavigate();

  const handleClick = (item: BreadcrumbItem, index: number) => {
    // Solo navegar si es el último item o si tiene path definido
    if (item.path && index < items.length - 1) {
      navigate(item.path);
    }
  };

  return (
    <div className={styles['breadcrumb-container']}>
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className={styles['separator']}> &gt; </span>}
          {index === items.length - 1 ? (
            <span className={styles['current']}>{item.label}</span>
          ) : (
            <button
              onClick={() => handleClick(item, index)}
              className={styles['link']}
            >
              {item.label}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
