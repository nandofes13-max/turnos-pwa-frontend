// src/components/ActionIcons.tsx
import { useState } from 'react';

interface ActionIconsProps {
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showAdd?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ActionIcons({ 
  onAdd, 
  onEdit, 
  onDelete, 
  showAdd = true, 
  showEdit = true, 
  showDelete = true,
  size = 'md'
}: ActionIconsProps) {
  
  const [tooltip, setTooltip] = useState<string | null>(null);

  // Tamaños de íconos
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      {/* Ícono ALTA (signo +) */}
      {showAdd && (
        <button
          onClick={onAdd}
          onMouseEnter={() => setTooltip('Agregar')}
          onMouseLeave={() => setTooltip(null)}
          className="p-1 rounded hover:bg-green-50 transition-colors duration-200 relative"
          title=""
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`${iconSize} text-green-600`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          {tooltip === 'Agregar' && (
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              Agregar
            </span>
          )}
        </button>
      )}

      {/* Ícono MODIFICACIÓN / VER (lápiz) */}
      {showEdit && (
        <button
          onClick={onEdit}
          onMouseEnter={() => setTooltip('Editar / Ver Detalles')}
          onMouseLeave={() => setTooltip(null)}
          className="p-1 rounded hover:bg-blue-50 transition-colors duration-200 relative"
          title=""
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`${iconSize} text-blue-600`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          {tooltip === 'Editar / Ver Detalles' && (
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              Editar / Ver Detalles
            </span>
          )}
        </button>
      )}

      {/* Ícono BAJA (cruz/x) */}
      {showDelete && (
        <button
          onClick={onDelete}
          onMouseEnter={() => setTooltip('Eliminar')}
          onMouseLeave={() => setTooltip(null)}
          className="p-1 rounded hover:bg-red-50 transition-colors duration-200 relative"
          title=""
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`${iconSize} text-red-600`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {tooltip === 'Eliminar' && (
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              Eliminar
            </span>
          )}
        </button>
      )}
    </div>
  );
}
