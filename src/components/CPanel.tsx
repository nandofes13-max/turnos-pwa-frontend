import { useEffect, useState } from 'react';

interface Filial {
  id: number;
  codigo: string;
  nombre: string;
  fecha_alta?: string;
  usuario_alta?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const FILIALES_URL = `${API_BASE_URL}/filiales`;

export default function CPanel() {
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar filiales al iniciar
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
    if (!codigo || !nombre) return alert('Completar código y nombre');
    try {
      const res = await fetch(FILIALES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, nombre }),
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

  const eliminarFilial = async (id: number) => {
    // Opcional: si tu backend soporta DELETE
    try {
      const res = await fetch(`${FILIALES_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar filial');
      fetchFiliales();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la filial');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gestión de Filiales</h2>

      {/* Formulario de nueva filial */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          onClick={crearFilial}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Crear
        </button>
      </div>

      {/* Listado de filiales */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="border-collapse border border-gray-300 w-full">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Código</th>
              <th className="border p-2">Nombre</th>
              <th className="border p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filiales.map((f) => (
              <tr key={f.id}>
                <td className="border p-2">{f.id}</td>
                <td className="border p-2">{f.codigo}</td>
                <td className="border p-2">{f.nombre}</td>
                <td className="border p-2">
                  <button
                    onClick={() => eliminarFilial(f.id)}
                    className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filiales.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-2">
                  No hay filiales
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
