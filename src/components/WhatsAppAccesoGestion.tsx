// src/components/WhatsAppAccesoGestion.tsx
import { useEffect, useState } from 'react';
import ActionIcons from './ActionIcons';
import '../styles/tablas-maestras.css';
import '../styles/WhatsAppAccesoGestion.module.css';

interface NegocioAcceso {
  id: number;
  nombre: string;
  phoneNumber: string | null;
  accesoWhatsapp: boolean;
  activo: boolean;
  estado: string | null;
  instanciaId: number | null;
}

interface ConfiguracionWhatsApp {
  negocioId: number;
  phoneNumber: string | null;
  accesoWhatsapp: boolean;
  activo: boolean;
  estado: string | null;
  instanciaId: number | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const NEGOCIOS_URL = `${API_BASE_URL}/negocios`;
const WHATSAPP_ACCESO_URL = `${API_BASE_URL}/whatsapp`;

export default function WhatsAppAccesoGestion() {
  const [negocios, setNegocios] = useState<NegocioAcceso[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  const [filtroAcceso, setFiltroAcceso] = useState<string>('todos');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [mensaje, setMensaje] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      // 1. Obtener todos los negocios
      const resNegocios = await fetch(NEGOCIOS_URL);
      const negociosData = await resNegocios.json();

      // 2. Obtener configuración de WhatsApp para cada negocio
      const negociosConAcceso: NegocioAcceso[] = [];
      
      for (const negocio of negociosData) {
        try {
          const resConfig = await fetch(`${WHATSAPP_ACCESO_URL}/${negocio.id}/config`);
          if (resConfig.ok) {
            const config: ConfiguracionWhatsApp = await resConfig.json();
            negociosConAcceso.push({
              id: negocio.id,
              nombre: negocio.nombre,
              phoneNumber: config.phoneNumber || null,
              accesoWhatsapp: config.accesoWhatsapp || false,
              activo: config.activo || false,
              estado: config.estado || null,
              instanciaId: config.instanciaId || null,
            });
          } else {
            // Si no tiene configuración, asumir acceso false
            negociosConAcceso.push({
              id: negocio.id,
              nombre: negocio.nombre,
              phoneNumber: null,
              accesoWhatsapp: false,
              activo: false,
              estado: null,
              instanciaId: null,
            });
          }
        } catch (error) {
          console.error(`Error cargando configuración del negocio ${negocio.id}:`, error);
          negociosConAcceso.push({
            id: negocio.id,
            nombre: negocio.nombre,
            phoneNumber: null,
            accesoWhatsapp: false,
            activo: false,
            estado: null,
            instanciaId: null,
          });
        }
      }

      setNegocios(negociosConAcceso);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje({ type: 'error', text: '❌ Error al cargar los datos. Intentá nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAcceso = async (negocioId: number, estadoActual: boolean) => {
    if (!window.confirm(`¿${estadoActual ? 'Deshabilitar' : 'Habilitar'} el acceso a WhatsApp para este negocio?`)) {
      return;
    }

    setProcesando(true);
    setMensaje(null);
    try {
      const nuevoAcceso = !estadoActual;
      const response = await fetch(`${WHATSAPP_ACCESO_URL}/${negocioId}/acceso`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceso: nuevoAcceso }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el acceso');
      }

      // Actualizar el estado local
      setNegocios(negocios.map(n => 
        n.id === negocioId ? { ...n, accesoWhatsapp: nuevoAcceso } : n
      ));

      setMensaje({ 
        type: 'success', 
        text: `✅ Acceso ${nuevoAcceso ? 'habilitado' : 'deshabilitado'} correctamente.` 
      });
    } catch (error) {
      console.error('Error actualizando acceso:', error);
      setMensaje({ type: 'error', text: '❌ Error al actualizar el acceso. Intentá nuevamente.' });
    } finally {
      setProcesando(false);
    }
  };

  const habilitarTodos = async () => {
    if (!window.confirm('¿Habilitar el acceso a WhatsApp para TODOS los negocios?')) {
      return;
    }

    setProcesando(true);
    setMensaje(null);
    try {
      const negociosSinAcceso = negocios.filter(n => !n.accesoWhatsapp);
      for (const negocio of negociosSinAcceso) {
        const response = await fetch(`${WHATSAPP_ACCESO_URL}/${negocio.id}/acceso`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acceso: true }),
        });
        if (!response.ok) {
          console.error(`Error habilitando acceso para negocio ${negocio.id}`);
        }
      }

      // Actualizar el estado local
      setNegocios(negocios.map(n => ({ ...n, accesoWhatsapp: true })));
      setMensaje({ type: 'success', text: '✅ Acceso habilitado para todos los negocios.' });
    } catch (error) {
      console.error('Error habilitando todos:', error);
      setMensaje({ type: 'error', text: '❌ Error al habilitar todos los negocios.' });
    } finally {
      setProcesando(false);
    }
  };

  const filtrarNegocios = () => {
    return negocios.filter(n => {
      if (filtroAcceso === 'habilitados' && !n.accesoWhatsapp) return false;
      if (filtroAcceso === 'deshabilitados' && n.accesoWhatsapp) return false;
      if (filtroAcceso === 'sin-configuracion' && n.phoneNumber !== null) return false;
      if (filtroNombre && !n.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      return true;
    });
  };

  const negociosFiltrados = filtrarNegocios();
  const totalPaginas = Math.ceil(negociosFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const negociosPaginados = negociosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
  };

  const limpiarFiltros = () => {
    setFiltroAcceso('todos');
    setFiltroNombre('');
    setPaginaActual(1);
  };

  const obtenerBadgeEstado = (acceso: boolean, activo: boolean, estado: string | null) => {
    if (acceso && activo) {
      return <span className="badge-success">✅ Activo</span>;
    } else if (acceso && !activo) {
      return <span className="badge-warning">⏳ Pendiente</span>;
    } else if (acceso) {
      return <span className="badge-info">📱 Autorizado</span>;
    } else {
      return <span className="badge-danger">🔴 Sin acceso</span>;
    }
  };

  return (
    <div className="tm-page">
      <h1 className="tm-titulo">📱 Gestión de Acceso a WhatsApp</h1>

      <div className="tm-filtros">
        <div className="tm-filtros-fila">
          <div className="tm-filtro-campo tm-filtro-nombre">
            <label className="tm-filtro-label">Buscar negocio</label>
            <input
              type="text"
              value={filtroNombre}
              onChange={(e) => {
                setFiltroNombre(e.target.value);
                setPaginaActual(1);
              }}
              placeholder="Nombre del negocio..."
              className="tm-filtro-input"
            />
          </div>
          <div className="tm-filtro-campo tm-filtro-movimiento">
            <label className="tm-filtro-label">Estado de acceso</label>
            <select
              value={filtroAcceso}
              onChange={(e) => {
                setFiltroAcceso(e.target.value);
                setPaginaActual(1);
              }}
              className="tm-filtro-input"
            >
              <option value="todos">Todos</option>
              <option value="habilitados">Habilitados</option>
              <option value="deshabilitados">Deshabilitados</option>
              <option value="sin-configuracion">Sin configuración</option>
            </select>
          </div>
          <div className="tm-filtro-accion">
            <button onClick={limpiarFiltros} className="tm-btn-limpiar">
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className={mensaje.type === 'success' ? 'tm-alerta-exito' : 'tm-alerta-error'} style={{ marginBottom: '16px' }}>
          {mensaje.text}
        </div>
      )}

      <div className="tm-tabla-header-contenedor">
        <div className="tm-tabla-header-inner">
          <button onClick={habilitarTodos} className="tm-btn-primario" disabled={procesando}>
            📲 Habilitar todos
          </button>
          <button onClick={cargarDatos} className="tm-btn-secundario" disabled={loading}>
            🔄 Recargar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="tm-loading">
          <div className="tm-loading-spinner"></div>
          <p className="tm-loading-texto">Cargando datos...</p>
        </div>
      ) : (
        <div className="tm-tabla-wrapper">
          <div className="tm-tabla-centrado">
            <table className="tm-tabla">
              <thead>
                <tr>
                  <th className="tm-col-id">ID</th>
                  <th>NEGOCIO</th>
                  <th>NÚMERO WHATSAPP</th>
                  <th>ESTADO</th>
                  <th>ACCESO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {negociosPaginados.map((n) => (
                  <tr key={n.id}>
                    <td>{n.id}</td>
                    <td>
                      <strong>{n.nombre}</strong>
                    </td>
                    <td>
                      {n.phoneNumber ? (
                        <span className="font-mono text-sm">{n.phoneNumber}</span>
                      ) : (
                        <span className="text-gray-400">No configurado</span>
                      )}
                    </td>
                    <td>{obtenerBadgeEstado(n.accesoWhatsapp, n.activo, n.estado)}</td>
                    <td>
                      <span className={n.accesoWhatsapp ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {n.accesoWhatsapp ? '✅ Habilitado' : '❌ Deshabilitado'}
                      </span>
                    </td>
                    <td>
                      <ActionIcons
                        onEdit={() => toggleAcceso(n.id, n.accesoWhatsapp)}
                        showEdit={true}
                        showDelete={false}
                        showAdd={false}
                        showView={false}
                        disabledEdit={procesando}
                        size="md"
                        title={n.accesoWhatsapp ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                      />
                    </td>
                  </tr>
                ))}
                {negociosPaginados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="tm-fila-vacia">
                      No hay negocios que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Vista mobile en cards */}
          <div className="tm-cards">
            {negociosPaginados.map((n) => (
              <div key={`card-${n.id}`} className="tm-card-item">
                <div className="tm-card-nombre">
                  <strong>{n.nombre}</strong>
                  <span className="text-xs text-gray-500">ID: {n.id}</span>
                </div>
                <div className="tm-card-whatsapp">
                  📱 {n.phoneNumber || 'No configurado'}
                </div>
                <div className="tm-card-estado">{obtenerBadgeEstado(n.accesoWhatsapp, n.activo, n.estado)}</div>
                <div className="tm-card-acceso">
                  {n.accesoWhatsapp ? '✅ Habilitado' : '❌ Deshabilitado'}
                </div>
                <div className="tm-card-acciones">
                  <ActionIcons
                    onEdit={() => toggleAcceso(n.id, n.accesoWhatsapp)}
                    showEdit={true}
                    showDelete={false}
                    showAdd={false}
                    showView={false}
                    disabledEdit={procesando}
                    size="lg"
                    title={n.accesoWhatsapp ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                  />
                </div>
              </div>
            ))}
          </div>

          {negociosFiltrados.length > 0 && (
            <div className="tm-paginacion">
              <button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1} className="tm-paginacion-btn">←</button>
              <span className="tm-paginacion-info">
                Página {paginaActual} de {totalPaginas} ({negociosFiltrados.length} registros)
              </span>
              <button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="tm-paginacion-btn">→</button>
            </div>
          )}
          <div className="tm-tabla-footer">
            Mostrando {negociosPaginados.length} de {negociosFiltrados.length} negocios
          </div>
        </div>
      )}
    </div>
  );
}
