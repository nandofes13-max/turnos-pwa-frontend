import { Link } from 'react-router-dom';
import styles from '../styles/Breadcrumb.module.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={styles['breadcrumb-container']}>
      {items.map((item, index) => (
        <span key={item.label}>
          {index > 0 && <span className={styles['separator']}> &gt; </span>}
          {index === items.length - 1 ? (
            <span className={styles['current']}>{item.label}</span>
          ) : (
            <Link to={item.path!} className={styles['link']}>
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
