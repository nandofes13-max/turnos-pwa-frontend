// src/components/ActionIcons.tsx
import { useState } from 'react';
import '../styles/tablas-maestras.css';

interface ActionIconsProps {
  onAdd?:    () => void;
  onEdit?:   () => void;
  onDelete?: () => void;

  showAdd?:    boolean;
  showEdit?:   boolean;
  showDelete?: boolean;

  disabledAdd?:    boolean;
  disabledEdit?:   boolean;
  disabledDelete?: boolean;

  size?: 'sm' | 'md' | 'lg';
}

export default function ActionIcons({
  onAdd,
  onEdit,
  onDelete,
  showAdd    = true,
  showEdit   = true,
  showDelete = true,
  disabledAdd    = false,
  disabledEdit   = false,
  disabledDelete = false,
  size = 'md',
}: ActionIconsProps) {

  const [tooltip, setTooltip] = useState<string | null>(null);

  const sizeMap = {
    sm: '16px',
    md: '18px',
    lg: '22px',
  };
  const iconSize = sizeMap[size];

  return (
    <div className="tm-acciones">

      {/* ALTA */}
      {showAdd && (
        <button
          className={`tm-accion-btn tm-accion-alta`}
          onClick={disabledAdd ? undefined : onAdd}
          disabled={disabledAdd}
          onMouseEnter={() => setTooltip('Alta')}
          onMouseLeave={() => setTooltip(null)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8"  y1="12" x2="16" y2="12"/>
          </svg>
          {tooltip === 'Alta' && (
            <span className="tm-accion-tooltip">Alta</span>
          )}
        </button>
      )}

      {/* EDITAR */}
      {showEdit && (
        <button
          className={`tm-accion-btn tm-accion-editar`}
          onClick={disabledEdit ? undefined : onEdit}
          disabled={disabledEdit}
          onMouseEnter={() => setTooltip('Modificar')}
          onMouseLeave={() => setTooltip(null)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          {tooltip === 'Modificar' && (
            <span className="tm-accion-tooltip">Modificar</span>
          )}
        </button>
      )}

      {/* BAJA */}
      {showDelete && (
        <button
          className={`tm-accion-btn tm-accion-baja`}
          onClick={disabledDelete ? undefined : onDelete}
          disabled={disabledDelete}
          onMouseEnter={() => setTooltip('Baja')}
          onMouseLeave={() => setTooltip(null)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9"  x2="9"  y2="15"/>
            <line x1="9"  y1="9"  x2="15" y2="15"/>
          </svg>
          {tooltip === 'Baja' && (
            <span className="tm-accion-tooltip">Baja</span>
          )}
        </button>
      )}

    </div>
  );
}
