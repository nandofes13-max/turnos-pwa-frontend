import React from 'react';
import ActionIcons from './ActionIcons';

interface Columna {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface TablaMaestraProps {
  columnas: Columna[];
  datos: any[];
  onAdd?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  onSchedule?: (item: any) => void;  // 👈 NUEVO: para agenda
  esInactivo?: (item: any) => boolean;
  tamañoIconos?: 'md' | 'lg';
  avatar?: (item: any) => React.ReactNode;
}

export default function TablaMaestra({
  columnas,
  datos,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onSchedule,  // 👈 NUEVO
  esInactivo,
  tamañoIconos = 'md',
  avatar
}: TablaMaestraProps) {
  return (
    <div className="tm-tabla-centrado">
      <table className="tm-tabla">
        <thead>
          <tr>
            {avatar && <th>AVATAR</th>}
            {columnas.map(col => (
              <th key={col.key} className={col.align === 'center' ? 'text-center' : ''}>
                {col.label}
              </th>
            ))}
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((item, idx) => (
            <tr key={idx} className={esInactivo?.(item) ? 'tm-fila-inactiva' : ''}>
              {avatar && <td className="text-center">{avatar(item)}</td>}
              {columnas.map(col => (
                <td key={col.key} className={col.align === 'center' ? 'text-center' : ''}>
                  {item[col.key] ?? '-'}
                </td>
              ))}
              <td>
                <ActionIcons
                  onAdd={() => onAdd?.(item)}
                  onEdit={() => onEdit?.(item)}
                  onDelete={() => onDelete?.(item)}
                  onView={() => onView?.(item)}
                  onSchedule={() => onSchedule?.(item)}  // 👈 NUEVO
                  showAdd={!!onAdd}
                  showEdit={!!onEdit}
                  showDelete={!!onDelete}
                  showView={!!onView}
                  showSchedule={!!onSchedule}  // 👈 NUEVO
                  disabledAdd={!esInactivo?.(item)}
                  disabledEdit={esInactivo?.(item)}
                  disabledDelete={esInactivo?.(item)}
                  disabledView={false}
                  disabledSchedule={false}  // 👈 NUEVO
                  size={tamañoIconos}
                />
              </td>
            </tr>
          ))}
          {datos.length === 0 && (
            <tr>
              <td colSpan={columnas.length + (avatar ? 2 : 1)} className="tm-fila-vacia">
                No hay registros que coincidan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
