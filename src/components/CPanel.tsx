import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';

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
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add' | null>(null);
  const [formData, setFormData] = useState({ codigo: '', nombre: '' });
  const [confirmDelete, setConfirmDelete] = useState<Filial | null>(null);
  
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

  // ===== FUNCIONES CRUD =====

  const handleAgregar = () => {
    setFormData({ codigo: '', nombre: '' });
    setModalMode('add');
  };

  const handleEditar = (filial: Filial) => {
    setFormData({ codigo: filial.codigo, nombre: filial.nombre });
    setSelectedFilial(filial);
    setModalMode('edit');
  };

  const handleVerDetalle = (filial: Filial) => {
    setSelectedFilial(filial);
    setModalMode('view');
  };

  const handleEliminar = (filial: Filial) => {
    setConfirmDelete(filial);
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${FILIALES_URL}/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Error al eliminar filial');

      setConfirmDelete(null);
      fetchFiliales();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la filial');
    }
  };

  const guardarFilial = async () => {
    if (!formData.codigo || !formData.nombre) {
      alert('Completar código y nombre');
      return;
    }

    try {
      let res;
      if (modalMode === 'add') {
        // Crear nueva filial
        res = await fetch(FILIALES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            codigo: formData.codigo, 
            nombre: formData.nombre,
            usuario_alta: 'DEMO'
          }),
        });
      } else if (modalMode === 'edit' && selectedFilial) {
        // Actualizar filial existente
        res = await fetch(`${FILIALES_URL}/${selectedFilial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            codigo: formData.codigo, 
            nombre: formData.nombre,
            usuario_modificacion: 'DEMO'
          }),
        });
      } else {
        return;
      }

      if (!res.ok) throw new Error('Error al guardar filial');

      setModalMode(null);
      setSelectedFilial(null);
      setFormData({ codigo: '', nombre: '' });
      fetchFiliales();
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar la filial');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Título con botón AGREGAR */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-[#0056b3]">Gestión de Filiales</h1>
        <ActionIcons 
          onAdd={handleAgregar}
          showEdit={false}
          showDelete={false}
          size="md"
        />
      </div>

      {/* Contenedor de Filtros */}
      <div className="filters-container relative">
        <div className="absolute -top-3 left-4 bg-white px-2">
          <span className="text-sm font-medium text-[#0056b3]">Filtros</span>
        </div>
        
        <div className="flex flex-wrap gap-6 items-start pt-2">
          
          {/* Código */}
          <div className="w-48 relative">
            <label className="block text-center text-sm font-medium text-[#0056b3] mb-2">Código</label>
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
                    className="mr-2 rounded text-[#0056b3]"
                  />
                  <span className="font-medium text-gray-700">Todos</span>
                </label>
                <div className="max-h-40 overflow-y-auto border-t mt-1 pt-1">
                  {codigosUnicos.map(cod => (
                    <label key={cod} className="flex items-center text-sm p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filtroCodigo.includes(cod)}
                        onChange={() => toggleCodigo(cod)}
                        className="mr-2 rounded text-[#0056b3]"
                      />
                      <span className="text-gray-700">{cod}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nombre */}
          <div className="w-64">
            <label className="block text-center text-sm font-medium text-[#0056b3] mb-2">Nombre</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              placeholder="Buscar por nombre..."
              className="osde-input"
            />
          </div>

          {/* Fecha Desde - Hasta */}
          <div className="w-80">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-center text-sm font-medium text-[#0056b3] mb-2">Fecha Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="osde-input"
                />
              </div>
              <div className="flex-1">
                <label className="block text-center text-sm font-medium text-[#0056b3] mb-2">Fecha Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="osde-input"
                />
              </div>
            </div>
          </div>

          {/* Movimiento */}
          <div className="w-48 relative">
            <label className="block text-center text-sm font-medium text-[#0056b3] mb-2">Movimiento</label>
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
                    className="mr-2 rounded text-[#0056b3]"
                  />
                  <span className="font-medium text-gray-700">Todos</span>
                </label>
                <div className="max-h-40 overflow-y-auto border-t mt-1 pt-1">
                  {tiposMovimiento.map(mov => (
                    <label key={mov} className="flex items-center text-sm p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filtroTipoMovimiento.includes(mov)}
                        onChange={() => toggleMovimiento(mov)}
                        className="mr-2 rounded text-[#0056b3]"
                      />
                      <span className="text-[#0056b3]">{mov}</span>
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

      {/* Contenedor de Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#0056b3]"></div>
          <p className="mt-2 text-gray-500">Cargando filiales...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative mt-6">
          <div className="absolute -top-3 left-4 bg-white px-2">
            <span className="text-sm font-medium text-[#0056b3]">Filiales</span>
          </div>
          
          <table className="osde-table pt-4">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#0056b3] uppercase tracking-wider bg-gray-50">Código</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#0056b3] uppercase tracking-wider bg-gray-50">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#0056b3] uppercase tracking-wider bg-gray-50">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filialesPaginadas.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{f.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.nombre}</td>
                  <td className="px-6 py-4 text-sm">
                    <ActionIcons 
                      onEdit={() => handleEditar(f)}
                      onDelete={() => handleEliminar(f)}
                      showAdd={false}
                      showEdit={true}
                      showDelete={true}
                      size="sm"
                    />
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

      {/* MODAL para AGREGAR/EDITAR */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="osde-modal" onClick={() => setModalMode(null)}>
          <div className="osde-modal-form" onClick={(e) => e.stopPropagation()}>
            <h3>{modalMode === 'add' ? 'Agregar Filial' : 'Editar Filial'}</h3>
            
            <div className="form-group">
              <label>Código</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ingrese código"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ingrese nombre"
              />
            </div>

            <div className="form-actions">
              <button onClick={() => setModalMode(null)} className="button-secondary">
                Cancelar
              </button>
              <button onClick={guardarFilial} className="button-primary">
                {modalMode === 'add' ? 'Agregar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL para VER DETALLE */}
      {modalMode === 'view' && selectedFilial && (
        <div className="osde-modal" onClick={() => setModalMode(null)}>
          <div className="osde-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Detalle de Filial</h3>
            
            <div className="space-y-2">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</span>
                <p className="text-base font-medium text-[#0056b3]">{selectedFilial.id}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Código</span>
                <p className="text-base font-medium text-[#0056b3]">{selectedFilial.codigo}</p>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</span>
                <p className="text-base font-medium text-[#0056b3]">{selectedFilial.nombre}</p>
              </div>
              
              <div className="bg-blue-50 p-2 rounded border border-blue-100">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Último Movimiento</span>
                <p className="text-sm text-blue-900">
                  {selectedFilial.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setModalMode(null)}
                className="osde-button-secondary text-sm py-1.5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      {confirmDelete && (
        <div className="confirm-dialog" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog-content" onClick={(e) => e.stopPropagation()}>
            <p>¿Está seguro que desea eliminar la filial <strong>{confirmDelete.nombre}</strong>?</p>
            <p className="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
            
            <div className="confirm-dialog-actions">
              <button onClick={() => setConfirmDelete(null)} className="button-secondary">
                Cancelar
              </button>
              <button onClick={confirmarEliminar} className="button-danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
