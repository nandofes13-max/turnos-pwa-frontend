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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
  // ✅ Solo ALTAS y BAJAS en el filtro
  const tiposMovimiento = ['Altas', 'Bajas'];

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
    if (f.fecha_baja) return 'Bajas';
    return 'Altas'; // Si no está dada de baja, es Altas (aunque tenga modificaciones)
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

  // ===== FUNCIONES CRUD CON VALIDACIONES =====

  const handleAgregar = () => {
    setFormData({ codigo: '', nombre: '' });
    setErrorMessage(null);
    setModalMode('add');
  };

  const handleEditar = (filial: Filial) => {
    // Verificar si está de baja
    if (filial.fecha_baja) {
      alert('No se puede editar un registro dado de baja');
      return;
    }
    setFormData({ codigo: filial.codigo, nombre: filial.nombre });
    setSelectedFilial(filial);
    setErrorMessage(null);
    setModalMode('edit');
  };

  const handleVerDetalle = (filial: Filial) => {
    setSelectedFilial(filial);
    setModalMode('view');
  };

  const handleEliminar = (filial: Filial) => {
    // Verificar si ya está de baja
    if (filial.fecha_baja) {
      alert('Este registro ya está dado de baja');
      return;
    }
    setConfirmDelete(filial);
  };

  // Validar código (solo letras, máximo 2 caracteres)
  const validarCodigo = (codigo: string): boolean => {
    const soloLetras = /^[A-Za-z]{1,2}$/.test(codigo);
    return soloLetras;
  };

  // Verificar si ya existe un registro con mismo código o nombre (y no está de baja)
  const verificarExistente = async (codigo: string, nombre: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(FILIALES_URL);
      const data: Filial[] = await res.json();
      
      // Filtrar registros activos (no dados de baja) y excluir el actual si es edición
      const activos = data.filter(f => 
        !f.fecha_baja && 
        (id ? f.id !== id : true)
      );
      
      // Verificar código duplicado
      const codigoExistente = activos.some(f => 
        f.codigo.toUpperCase() === codigo.toUpperCase()
      );
      
      // Verificar nombre duplicado
      const nombreExistente = activos.some(f => 
        f.nombre.toUpperCase() === nombre.toUpperCase()
      );
      
      if (codigoExistente) {
        setErrorMessage('Ya existe un registro con ese código');
        return false;
      }
      
      if (nombreExistente) {
        setErrorMessage('Ya existe un registro con ese nombre');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarFilial = async () => {
    // Validar campos obligatorios
    if (!formData.codigo || !formData.nombre) {
      setErrorMessage('Completar código y nombre');
      return;
    }

    // Validar código (solo letras, máx 2)
    if (!validarCodigo(formData.codigo)) {
      setErrorMessage('El código debe contener solo letras y no más de 2 caracteres');
      return;
    }

    // Convertir a mayúsculas
    const codigoUpper = formData.codigo.toUpperCase();
    const nombreUpper = formData.nombre.toUpperCase();

    try {
      // Validar si ya existe (solo para altas y ediciones)
      if (modalMode === 'add' || modalMode === 'edit') {
        const esValido = await verificarExistente(
          codigoUpper, 
          nombreUpper, 
          modalMode === 'edit' ? selectedFilial?.id : undefined
        );
        if (!esValido) return;
      }

      let res;
      if (modalMode === 'add') {
        res = await fetch(FILIALES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            codigo: codigoUpper, 
            nombre: nombreUpper,
            usuario_alta: 'DEMO'
          }),
        });
      } else if (modalMode === 'edit' && selectedFilial) {
        res = await fetch(`${FILIALES_URL}/${selectedFilial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            codigo: codigoUpper, 
            nombre: nombreUpper,
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
      setErrorMessage(null);
      fetchFiliales();
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo guardar la filial');
    }
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-medium text-[#0056b3] mb-8">Gestión de Filiales</h1>

      {/* Filtros - con títulos DENTRO del recuadro */}
      <div className="filters-container relative pt-6">
        <div className="absolute -top-3 left-4 bg-white px-2 z-10">
          <span className="text-sm font-medium text-[#0056b3] bg-white px-1">Filtros</span>
        </div>
        
        <div className="flex flex-wrap gap-4 items-start">
          
          {/* Código - ANCHO REDUCIDO al mínimo */}
          <div className="w-24 relative">
            <label className="block text-center text-xs font-medium text-[#0056b3] mb-1">Código</label>
            <button
              onClick={() => setFiltroExpandido(prev => ({ ...prev, codigo: !prev.codigo }))}
              className="osde-select-trigger text-xs px-2 py-1"
            >
              <span className="text-gray-700">
                {filtroCodigo.length === 0 ? 'Todos' : `${filtroCodigo.length}`}
              </span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            
            {filtroExpandido.codigo && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-1 text-xs">
                <label className="flex items-center p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={filtroCodigo.length === codigosUnicos.length}
                    onChange={toggleTodosCodigos}
                    className="mr-1 rounded text-[#0056b3] scale-75"
                  />
                  <span className="font-medium text-gray-700">Todos</span>
                </label>
                <div className="max-h-40 overflow-y-auto border-t mt-1 pt-1">
                  {codigosUnicos.map(cod => (
                    <label key={cod} className="flex items-center p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filtroCodigo.includes(cod)}
                        onChange={() => toggleCodigo(cod)}
                        className="mr-1 rounded text-[#0056b3] scale-75"
                      />
                      <span className="text-gray-700 text-xs">{cod}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nombre */}
          <div className="w-48">
            <label className="block text-center text-xs font-medium text-[#0056b3] mb-1">Nombre</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              placeholder="Buscar..."
              className="osde-input text-xs px-2 py-1"
            />
          </div>

          {/* Fecha Desde - Hasta */}
          <div className="w-64">
            <div className="flex gap-1">
              <div className="flex-1">
                <label className="block text-center text-xs font-medium text-[#0056b3] mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="osde-input text-xs px-2 py-1"
                />
              </div>
              <div className="flex-1">
                <label className="block text-center text-xs font-medium text-[#0056b3] mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="osde-input text-xs px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* Movimiento - solo Altas/Bajas */}
          <div className="w-24 relative">
            <label className="block text-center text-xs font-medium text-[#0056b3] mb-1">Mov.</label>
            <button
              onClick={() => setFiltroExpandido(prev => ({ ...prev, movimiento: !prev.movimiento }))}
              className="osde-select-trigger text-xs px-2 py-1"
            >
              <span className="text-gray-700">
                {filtroTipoMovimiento.length === 0 ? 'Todos' : `${filtroTipoMovimiento.length}`}
              </span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>
            
            {filtroExpandido.movimiento && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-1 text-xs">
                <label className="flex items-center p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={filtroTipoMovimiento.length === tiposMovimiento.length}
                    onChange={toggleTodosMovimientos}
                    className="mr-1 rounded text-[#0056b3] scale-75"
                  />
                  <span className="font-medium text-gray-700">Todos</span>
                </label>
                <div className="border-t mt-1 pt-1">
                  {tiposMovimiento.map(mov => (
                    <label key={mov} className="flex items-center p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={filtroTipoMovimiento.includes(mov)}
                        onChange={() => toggleMovimiento(mov)}
                        className="mr-1 rounded text-[#0056b3] scale-75"
                      />
                      <span className={mov === 'Altas' ? 'text-green-600' : 'text-red-600'}>{mov}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Limpiar filtros */}
          <div className="self-end">
            <button
              onClick={() => {
                setFiltroCodigo([]);
                setFiltroTipoMovimiento([]);
                setFiltroNombre('');
                setFechaDesde('');
                setFechaHasta('');
              }}
              className="text-xs text-[#0056b3] border border-[#0056b3] px-3 py-1 rounded-full hover:bg-blue-50"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Filiales */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#0056b3]"></div>
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative mt-6">
          {/* Título "Filiales" DENTRO del recuadro */}
          <div className="absolute -top-3 left-4 bg-white px-2 z-10">
            <span className="text-sm font-medium text-[#0056b3] bg-white px-1">Filiales</span>
          </div>
          
          {/* Botón AGREGAR al lado del título */}
          <div className="absolute -top-3 left-24 bg-white px-2 z-10">
            <button
              onClick={handleAgregar}
              className="flex items-center gap-1 text-[#0056b3] hover:text-blue-700 text-xs font-medium"
              title="Agregar filial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span>Agregar</span>
            </button>
          </div>
          
          {/* Tabla con columnas ajustadas */}
          <table className="w-full pt-6">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-[#0056b3] uppercase tracking-wider bg-gray-50 w-16">Código</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-[#0056b3] uppercase tracking-wider bg-gray-50">Nombre</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-[#0056b3] uppercase tracking-wider bg-gray-50 w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filialesPaginadas.map((f) => (
                <tr 
                  key={f.id} 
                  className={`hover:bg-gray-50 transition-colors duration-150 ${f.fecha_baja ? 'bg-red-50' : ''}`}
                >
                  <td className={`px-2 py-1 text-xs font-medium ${f.fecha_baja ? 'text-red-600' : 'text-gray-900'}`}>
                    {f.codigo}
                  </td>
                  <td className={`px-2 py-1 text-xs ${f.fecha_baja ? 'text-red-600' : 'text-gray-600'}`}>
                    {f.nombre}
                  </td>
                  <td className="px-2 py-1 text-xs">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditar(f)}
                        disabled={!!f.fecha_baja}
                        className={`p-0.5 rounded ${f.fecha_baja ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50'}`}
                        title="Editar / Ver Detalles"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEliminar(f)}
                        disabled={!!f.fecha_baja}
                        className={`p-0.5 rounded ${f.fecha_baja ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50'}`}
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filialesPaginadas.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500 text-xs">
                    No hay filiales que coincidan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="px-2 py-1 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
            Mostrando {filialesPaginadas.length} de {filialesFiltradas.length}
          </div>
        </div>
      )}

      {/* MODAL AGREGAR/EDITAR */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {modalMode === 'add' ? 'Agregar Filial' : 'Editar Filial'}
            </h3>
            
            {errorMessage && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                {errorMessage}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Código (máx 2 letras)</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: CF"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm uppercase"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                placeholder="Ingrese nombre"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm uppercase"
              />
            </div>

            {/* Mostrar último movimiento en vistas de edición */}
            {modalMode === 'edit' && selectedFilial?.ultimoMovimiento && (
              <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-100">
                <span className="text-xs font-medium text-blue-600">Último Movimiento</span>
                <p className="text-xs text-blue-900 mt-1">
                  {selectedFilial.ultimoMovimiento.replace('demo', 'DEMO')}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setModalMode(null)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarFilial} 
                className="px-4 py-2 bg-[#0056b3] text-white rounded-lg hover:bg-[#004494] text-sm"
              >
                {modalMode === 'add' ? 'Agregar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE */}
      {modalMode === 'view' && selectedFilial && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Detalle de Filial</h3>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-xs font-medium text-gray-500">ID</span>
                <p className="text-sm font-medium text-[#0056b3]">{selectedFilial.id}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-xs font-medium text-gray-500">Código</span>
                <p className="text-sm font-medium text-[#0056b3]">{selectedFilial.codigo}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-xs font-medium text-gray-500">Nombre</span>
                <p className="text-sm font-medium text-[#0056b3]">{selectedFilial.nombre}</p>
              </div>
              
              <div className={`p-3 rounded border ${selectedFilial.fecha_baja ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                <span className={`text-xs font-medium ${selectedFilial.fecha_baja ? 'text-red-600' : 'text-blue-600'}`}>
                  Último Movimiento
                </span>
                <p className={`text-sm mt-1 ${selectedFilial.fecha_baja ? 'text-red-900' : 'text-blue-900'}`}>
                  {selectedFilial.ultimoMovimiento?.replace('demo', 'DEMO') || 'Sin datos'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-2 text-sm">¿Eliminar <strong>{confirmDelete.nombre}</strong>?</p>
            <p className="text-xs text-gray-500 mb-4">Esta acción no se puede deshacer.</p>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setConfirmDelete(null)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEliminar} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
