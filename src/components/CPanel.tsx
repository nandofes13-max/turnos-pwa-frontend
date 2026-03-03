import { useEffect, useState } from 'react';

interface Filial {
  id: number;
  codigo: string;
  nombre: string;
  ultimoMovimiento?: string; // Nuevo campo opcional
  // Los campos de auditoría vienen incluidos pero no los usamos directamente
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const FILIALES_URL = `${API_BASE_URL}/filiales`;

export default function CPanel() {
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

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

  const crearFilial = async () => {
    if (!codigo || !nombre) {
      alert('Completar código y nombre');
      return;
    }

    // Por ahora, hardcodeamos el usuario (luego vendrá de autenticación)
    const usuarioAlta = 'demo@usuario.com';

    try {
      const res = await fetch(FILIALES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          codigo, 
          nombre,
          usuario_alta: usuarioAlta 
        }),
      });
      
      if (!res.ok) throw new Error('Error al crear filial');
      
      setCodigo('');
      setNombre('');
      fetchFiliales();
    } catch (err) {
      console.error(err);
      alert('No se pudo crear la filial');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Filiales</h2>

      {/* Formulario de nueva filial */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Nueva Filial</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="border border-gray-300 p-2 rounded flex-1"
          />
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border border-gray-300 p-2 rounded flex-1"
          />
          <button
            onClick={crearFilial}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Crear
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Código</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Último Movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filiales.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{f.id}</td>
                  <td className="px-4 py-3 text-sm">{f.codigo}</td>
                  <td className="px-4 py-3 text-sm">{f.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {f.ultimoMovimiento || 'Sin datos'}
                  </td>
                </tr>
              ))}
              {filiales.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No hay filiales cargadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
