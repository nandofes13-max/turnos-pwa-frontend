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

  // Manejar cambio en combos múltiples
  const handleComboChange = (e: React.ChangeEvent<HTMLSelectElement>, setter: Function) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setter(selected);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Título 1: PWA Turnos - DEMO */}
      <h1 className="text-3xl font-bold text-blue-600 mb-2">PWA Turnos - DEMO</h1>
      
      {/* Título 2: Gestión de Filiales */}
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Gestión de Filiales</h2>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro Código (múltiple) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <select
              multiple
              size={3}
              className="w-full border border-gray-300 rounded p-1"
              onChange={(e) => handleComboChange(e, setFiltroCodigo)}
            >
              {codigosUnicos.map(cod => (
                <option key={cod} value={cod}>{cod}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ctrl+click para múltiple</p>
          </div>

          {/* Filtro Tipo de Movimiento (múltiple) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento</label>
            <select
              multiple
              size={3}
              className="w-full border border-gray-300 rounded p-1"
              onChange={(e) => handleComboChange(e, setFiltroTipoMovimiento)}
            >
              {tiposMovimiento.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ctrl+click para múltiple</p>
          </div>

          {/* Filtro Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              placeholder="Filtrar por nombre..."
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          {/* Filtro Fechas */}
          <div>
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
        </div>
        
        {/* Botón para limpiar filtros */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              setFiltroCodigo([]);
              setFiltroTipoMovimiento([]);
              setFiltroNombre('');
              setFechaDesde('');
              setFechaHasta('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Limpiar filtros
          </button>
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
                    <div className="flex gap-2">
                      {/* ALTA - solo visible si corresponde */}
                      {obtenerTipoMovimiento(f) === 'ALTA' && (
                        <span className="text-green-600" title="ALTA">🟢</span>
                      )}
                      {/* MODIFICACIÓN - solo visible si corresponde */}
                      {obtenerTipoMovimiento(f) === 'MODIFICACIÓN' && (
                        <span className="text-yellow-600" title="MODIFICACIÓN">🟡</span>
                      )}
                      {/* BAJA - solo visible si corresponde */}
                      {obtenerTipoMovimiento(f) === 'BAJA' && (
                        <span className="text-red-600" title="BAJA">🔴</span>
                      )}
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
            
            <div className="mt-6 flex justify-end">
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
