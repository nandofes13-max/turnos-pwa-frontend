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
  
  // Estado para controlar qué filtros están expandidos
  const [filtroExpandido, setFiltroExpandido] = useState({
    codigo: false,
    movimiento: false
  });

  // Opciones para combos
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

  // Función para determinar el tipo de movimiento de una filial
  const obtenerTipoMovimiento = (f: Filial): string => {
    if (f.fecha_baja) return 'BAJA';
    if (f.fecha_modificacion && f.fecha_alta && 
        new Date(f.fecha_modificacion).getTime() !== new Date(f.fecha_alta).getTime()) {
      return 'MODIFICACIÓN';
    }
    return 'ALTA';
  };

  // Función para filtrar filiales
  const filtrarFiliales = (filiales: Filial[]): Filial[] => {
    return filiales.filter(f => {
      // Filtro por código
      if (filtroCodigo.length > 0 && !filtroCodigo.includes(f.codigo)) {
        return false;
      }

      // Filtro por nombre (contiene)
      if (filtroNombre && !f.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) {
        return false;
      }

      // Filtro por tipo de movimiento
      const tipo = obtenerTipoMovimiento(f);
      if (filtroTipoMovimiento.length > 0 && !filtroTipoMovimiento.includes(tipo)) {
        return false;
      }

      // Filtro por fechas (usando fecha_alta como referencia)
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

  // Filiales filtradas y paginadas
  const filialesFiltradas = filtrarFiliales(filiales);
  const filialesPaginadas = filialesFiltradas
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .slice(0, 10);

  // Función para manejar checklist de código
  const toggleCodigo = (cod: string) => {
    setFiltroCodigo(prev => 
      prev.includes(cod) 
        ? prev.filter(c => c !== cod)
        : [...prev, cod]
    );
  };

  // Función para manejar checklist de movimiento
  const toggleMovimiento = (mov: string) => {
    setFiltroTipoMovimiento(prev => 
      prev.includes(mov) 
        ? prev.filter(m => m !== mov)
        : [...prev, mov]
    );
  };

  // Seleccionar/deseleccionar todos los códigos
  const toggleTodosCodigos = () => {
    if (filtroCodigo.length === codigosUnicos.length) {
      setFiltroCodigo([]);
    } else {
      setFiltroCodigo([...codigosUnicos]);
    }
  };

  // Seleccionar/deseleccionar todos los movimientos
  const toggleTodosMovimientos = () => {
    if (filtroTipoMovimiento.length === tiposMovimiento.length) {
      setFiltroTipoMovimiento([]);
    } else {
      setFiltroTipoMovimiento([...tiposMovimiento]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Título único: PWA - TURNOS */}
      <h1 className="text-3xl font-bold text-blue-600 mb-6">PWA - TURNOS</h1>
      
      {/* Título Gestión de Filiales */}
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gestión de Filiales</h2>

      {/* Filtros en línea */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-start">
          
          {/* FILTRO CÓDIGO */}
          <div className="w-48 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <button
              onClick={() => setFiltroExpandido(prev => ({ ...prev, codigo: !prev.codigo }))}
              className="w-full border border-gray-300 rounded p-2 text-left bg-white hover:bg-gray-50 flex justify-between items-center"
            >
              <span>
                {filtroCodigo.length === 0 
                  ? 'Todos' 
                  : `${filtroCodigo.length} seleccionado${filtroCodigo.length > 1 ? 's' : ''}`}
              </span>
              <span className="text-gray-500">▼</span>
            </button>
            
            {filtroExpandido.codigo && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg p-2">
                <div className="mb-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filtroCodigo.length === codigosUnicos.length}
                      onChange={toggleTodosCodigos}
                      className="mr-2"
                    />
                    <span className="font-medium">Todos</span>
                  </label>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {codigosUnicos.map(cod => (
                    <label key={cod} className="flex items-center text-sm py-1">
                      <input
                        type="checkbox"
                        checked={filtroCodigo.includes(cod)}
                        onChange={() => toggleCodigo(cod)}
                        className="mr-2"
                      />
                      {cod}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FILTRO NOMBRE */}
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              placeholder="Filtrar por nombre..."
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          {/* FILTRO FECHA DESDE - HASTA */}
          <div className="w-72">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Alta</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-1/2 border border-gray-300 p-2 rounded"
                placeholder="Desde"
              />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-1/2 border border-gray-300 p-2 rounded"
                placeholder="Hasta"
              />
            </div>
          </div>

          {/* FILTRO MOVIMIENTO */}
          <div className="w-48 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento</label>
            <button
              onClick={() => setFiltroExpandido(prev => ({ ...prev, movimiento: !prev.movimiento }))}
              className="w-full border border-gray-300 rounded p-2 text-left bg-white hover:bg-gray-50 flex justify-between items-center"
            >
              <span>
                {filtroTipoMovimiento.length === 0 
                  ? 'Todos' 
                  : `${filtroTipoMovimiento.length} seleccionado${filtroTipoMovimiento.length > 1 ? 's' : ''}`}
              </span>
              <span className="text-gray-500">▼</span>
            </button>
            
            {filtroExpandido.movimiento && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg p-2">
                <div className="mb-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filtroTipoMovimiento.length === tiposMovimiento.length}
                      onChange={toggleTodosMovimientos}
                      className="mr-2"
                    />
                    <span className="font-medium">Todos</span>
                  </label>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {tiposMovimiento.map(mov => (
                    <label key={mov} className="flex items-center text-sm py-1">
                      <input
                        type="checkbox"
                        checked={filtroTipoMovimiento.includes(mov)}
                        onChange={() => toggleMovimiento(mov)}
                        className="mr-2"
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

          {/* Botón limpiar filtros */}
          <div className="self-end ml-auto">
            <button
              onClick={() => {
                setFiltroCodigo([]);
                setFiltroTipoMovimiento([]);
                setFiltroNombre('');
                setFechaDesde('');
                setFechaHasta('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-3 py-2"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Listado de filiales */}
      {loading ? (
        <div className="text-center p-4">Cargando filiales...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Código</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filialesPaginadas.map((f) => (
                <tr 
                  key={f.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedFilial(f)}
                >
                  <td className="px-4 py-3 text-sm">{f.codigo}</td>
                  <td className="px-4 py-3 text-sm">{f.nombre}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-3 items-center">
                      {/* ALTA */}
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/3804/3804279.png" 
                        alt="ALTA"
                        className="w-5 h-5"
                        style={{ 
                          opacity: obtenerTipoMovimiento(f) === 'ALTA' ? 1 : 0.3,
                          filter: obtenerTipoMovimiento(f) === 'ALTA' ? 'none' : 'grayscale(100%)'
                        }}
                        title="ALTA"
                      />
                      {/* MODIFICACIÓN */}
                      <img 
                        src="https://img.freepik.com/icono-gratis/editar_2921179.png" 
                        alt="MODIFICACIÓN"
                        className="w-5 h-5"
                        style={{ 
                          opacity: obtenerTipoMovimiento(f) === 'MODIFICACIÓN' ? 1 : 0.3,
                          filter: obtenerTipoMovimiento(f) === 'MODIFICACIÓN' ? 'none' : 'grayscale(100%)'
                        }}
                        title="MODIFICACIÓN"
                      />
                      {/* BAJA */}
                      <img 
                        src="https://thumbs.dreamstime.com/b/marca-cruz-roja-vector-de-iconos-ilustraci%C3%B3n-del-s%C3%ADmbolo-cruzamiento-icono-para-error-y-cancelar-acci%C3%B3n-394756876.jpg" 
                        alt="BAJA"
                        className="w-5 h-5"
                        style={{ 
                          opacity: obtenerTipoMovimiento(f) === 'BAJA' ? 1 : 0.3,
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
                  <td colSpan={3} className="text-center py-4 text-gray-500">
                    No hay filiales que coincidan con los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Información de paginación */}
          <div className="px-4 py-2 text-sm text-gray-500 border-t">
            Mostrando {filialesPaginadas.length} de {filialesFiltradas.length} filiales
          </div>
        </div>
      )}

      {/* Modal de detalle (se muestra al hacer click en una fila) */}
      {selectedFilial && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedFilial(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Detalle de Filial</h3>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <span className="font-semibold text-gray-700">ID:</span>
                <p className="text-lg mt-1">{selectedFilial.id}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <span className="font-semibold text-gray-700">Código:</span>
                <p className="text-lg mt-1">{selectedFilial.codigo}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <span className="font-semibold text-gray-700">Nombre:</span>
                <p className="text-lg mt-1">{selectedFilial.nombre}</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <span className="font-semibold text-blue-700">Último Movimiento:</span>
                <p className="text-md mt-1">{selectedFilial.ultimoMovimiento || 'Sin datos'}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedFilial(null)}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
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
