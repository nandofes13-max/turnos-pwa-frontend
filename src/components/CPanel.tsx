// src/components/CPanel.tsx (versión con estilos OSDE)
import { useEffect, useState } from 'react';

interface Filial {
  id: number;
  codigo: string;
  nombre: string;
  ultimoMovimiento?: string;
  fecha_alta?: string;
  usuario_alta?: string;
  fecha_modificacion?: string;
  usuario_modificacion?: string;
  fecha_baja?: string;
  usuario_baja?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const FILIALES_URL = `${API_BASE_URL}/filiales`;

export default function CPanel() {
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null);
  
  // Estados para filtros
  const [filtroCodigo, setFiltroCodigo] = useState<string[]>([]);
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  const [filtroExpandido, setFiltroExpandido] = useState({
    codigo: false,
    movimiento: false
  });

  const codigosUnicos = [...new Set(filiales.map(f => f.codigo))].sort();
  const tiposMovimiento = ['ALTA', 'BAJA', 'MODIFICACIÓN'];

  useEffect(() => {
    fetchFiliales();
  }, []);

  const fetchFiliales = async () => {
    setLoading(true);
    try {
      const res = await fetch(FILIALES_URL);
      const data = await res.json();
      setFiliales(data);
    } catch (err) {
      console.error('Error al cargar filiales:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipoMovimiento = (f: Filial): string => {
    if (f.fecha_baja) return 'BAJA';
    if (f.fecha_modificacion && f.fecha_alta && 
        new Date(f.fecha_modificacion).getTime() !== new Date(f.fecha_alta).getTime()) {
      return 'MODIFICACIÓN';
    }
    return 'ALTA';
  };

  const filtrarFiliales = (filiales: Filial[]): Filial[] => {
    return filiales.filter(f => {
      if (filtroCodigo.length > 0 && !filtroCodigo.includes(f.codigo)) return false;
      if (filtroNombre && !f.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      
      const tipo = obtenerTipoMovimiento(f);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) return false;

      if (fechaDesde && f.fecha_alta) {
        const fechaAlta = new Date(f.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta < fechaDesde) return false;
      }
      if (fechaHasta && f.fecha_alta) {
        const fechaAlta = new Date(f.fecha_alta).toISOString().split('T')[0];
        if (fechaAlta > fechaHasta) return false;
      }

      return true;
    });
  };

  const filialesFiltradas = filtrarFiliales(filiales);
  const filialesPaginadas = filialesFiltradas
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .slice(0, 10);

  const toggleCodigo = (cod: string) => {
    setFiltroCodigo(prev => 
      prev.includes(cod) ? prev.filter(c => c !== cod) : [...prev, cod]
    );
  };

  const toggleMovimiento = (mov: string) => {
    setFiltroTipoMovimiento(prev => 
      prev.includes(mov) ? prev.filter(m => m !== mov) : [...prev, mov]
    );
  };

  const toggleTodosCodigos = () => {
    if (filtroCodigo.length === codigosUnicos.length) {
      setFiltroCodigo([]);
    } else {
      setFiltroCodigo([...codigosUnicos]);
    }
  };

  const toggleTodosMovimientos = () => {
    if (filtroTipoMovimiento.length === tiposMovimiento.length) {
      setFiltroTipoMovimiento([]);
    } else {
      setFiltroTipoMovimiento([...tiposMovimiento]);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Título principal estilo OSDE */}
      <h1 className="text-4xl font-light text-[#0056b3] tracking-tight mb-2">PWA - TURNOS</h1>
      <h2 className="text-2xl font-medium text-gray-800 mb-8">Gestión de Filiales</h2>

      {/* Filtros - Contenedor estilo OSDE */}
      <div className="filters-container">
        <div className="flex flex-wrap gap-4 items-start">
          
          {/* Código */}
          <div className="w-48 relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">Código</label>
            <button
              onClick={() => setFiltroExpandido(prev => ({ ...prev, codigo: !prev.codigo }))}
              className="osde-select-trigger"
            >
              <span className="text-gray-700">
                {filtroCodigo.length === 0 
                  ? 'Todos' 
                  : `${filtroCodigo.length} seleccionado${filtroCodigo.length > 1 ? 's' : ''}`}
              </span>
              <span className="text-gray-400">▼</span>
            </button>
            
            {filtroExpandido.codigo && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                <label className="flex items-center text-sm p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={filtroCodigo.length === codigosUnicos.length}
                    onChange={toggleTodosCodigos}
                    className="mr-2 rounded text-blue-600"
                  />
                  <span className="font-medium">Todos</span>
                </label>
                <div className="max-h-40 overflow-y-auto border-t mt-1 pt-1">
                  {codigosUnicos.map(cod => (
                    <label key={cod} className="flex items-center text-sm p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filtroCodigo.includes(cod)}
                        onChange={() => toggleCodigo(cod)}
                        className="mr-2 rounded text-blue-600"
                      />
                      {cod}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nombre */}
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              placeholder="Buscar por nombre..."
              className="osde-input"
            />
          </div>

          {/* Fecha */}
          <div className="w-72">
            <label className="block text-sm font-medium text-gray-600 mb-1">Fecha Alta</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="osde-input"
                placeholder="Desde"
              />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="osde-input"
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* Movimiento */}
          <div className="w-48 relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">Movimiento</label>
            <button
              onClick={() => setFiltroExpandido(prev => ({ ...prev, movimiento: !prev.movimiento }))}
              className="osde-select-trigger"
            >
              <span className="text-gray-700">
                {filtroTipoMovimiento.length === 0 
                  ? 'Todos' 
                  : `${filtroTipoMovimiento.length} seleccionado${filtroTipoMovimiento.length > 1 ? 's' : ''}`}
              </span>
              <span className="text-gray-400">▼</span>
            </button>
            
            {filtroExpandido.movimiento && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                <label className="flex items-center text-sm p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={filtroTipoMovimiento.length === tiposMovimiento.length}
                    onChange={toggleTodosMovimientos}
                    className="mr-2 rounded text-blue-600"
                  />
                  <span className="font-medium">Todos</span>
                </label>
                <div className="max-h-40 overflow-y-auto border-t mt-1 pt-1">
                  {tiposMovimiento.map(mov => (
                    <label key={mov} className="flex items-center text-sm p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filtroTipoMovimiento.includes(mov)}
                        onChange={() => toggleMovimiento(mov)}
                        className="mr-2 rounded text-blue-600"
                      />
                      <span className={
                        mov === 'ALTA' ? 'text-green-600' : 
                        mov === 'MODIFICACIÓN' ? 'text-yellow-600' : 
                        'text-red-600'
                      }>
                        {mov}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Limpiar filtros */}
          <div className="self-end ml-auto">
            <button
              onClick={() => {
                setFiltroCodigo([]);
                setFiltroTipoMovimiento([]);
                setFiltroNombre('');
                setFechaDesde('');
                setFechaHasta('');
              }}
              className="osde-button-secondary text-sm"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Cargando filiales...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="osde-table">
            <thead>
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filialesPaginadas.map((f) => (
                <tr 
                  key={f.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  onClick={() => setSelectedFilial(f)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{f.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.nombre}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2 items-center">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/3804/3804279.png" 
                        alt="ALTA"
                        className="w-4 h-4"
                        style={{ 
                          opacity: obtenerTipoMovimiento(f) === 'ALTA' ? 1 : 0.2,
                          filter: obtenerTipoMovimiento(f) === 'ALTA' ? 'none' : 'grayscale(100%)'
                        }}
                        title="ALTA"
                      />
                      <img 
                        src="https://img.freepik.com/icono-gratis/editar_2921179.png" 
                        alt="MODIFICACIÓN"
                        className="w-4 h-4"
                        style={{ 
                          opacity: obtenerTipoMovimiento(f) === 'MODIFICACIÓN' ? 1 : 0.2,
                          filter: obtenerTipoMovimiento(f) === 'MODIFICACIÓN' ? 'none' : 'grayscale(100%)'
                        }}
                        title="MODIFICACIÓN"
                      />
                      <img 
                        src="https://thumbs.dreamstime.com/b/marca-cruz-roja-vector-de-iconos-ilustraci%C3%B3n-del-s%C3%ADmbolo-cruzamiento-icono-para-error-y-cancelar-acci%C3%B3n-394756876.jpg" 
                        alt="BAJA"
                        className="w-4 h-4"
                        style={{ 
                          opacity: obtenerTipoMovimiento(f) === 'BAJA' ? 1 : 0.2,
                          filter: obtenerTipoMovimiento(f) === 'BAJA' ? 'none' : 'grayscale(100%)'
                        }}
                        title="BAJA"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filialesPaginadas.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500">
                    No hay filiales que coincidan con los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="px-6 py-3 text-sm text-gray-500 border-t border-gray-100 bg-gray-50">
            Mostrando {filialesPaginadas.length} de {filialesFiltradas.length} filiales
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedFilial && (
        <div className="osde-modal" onClick={() => setSelectedFilial(null)}>
          <div className="osde-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Detalle de Filial</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</span>
                <p className="text-lg font-medium text-gray-900">{selectedFilial.id}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Código</span>
                <p className="text-lg font-medium text-gray-900">{selectedFilial.codigo}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</span>
                <p className="text-lg font-medium text-gray-900">{selectedFilial.nombre}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Último Movimiento</span>
                <p className="text-md text-blue-900">{selectedFilial.ultimoMovimiento || 'Sin datos'}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedFilial(null)}
                className="osde-button-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
