// src/components/MapaSelector.tsx
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import { useDireccion, Direccion } from '../hooks/useDireccion';
import '../styles/MapaSelector.css';

// Solucionar problema de iconos en Leaflet con React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente para manejar eventos del mapa
function MapEvents({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter();
      onMove(center.lat, center.lng);
    },
  });
  return null;
}

interface MapaSelectorProps {
  value?: Partial<Direccion>;
  onChange: (direccion: Direccion) => void;
  defaultCountry?: string;
  autoLocate?: boolean;
}

export default function MapaSelector({
  value,
  onChange,
  defaultCountry = 'AR',
  autoLocate = true,
}: MapaSelectorProps) {
  const {
    direccion,
    loading,
    error,
    sugerencias,
    buscando,
    localizar,
    buscarDirecciones,
    seleccionarDireccion,
    moverPin,
    resetear,
    setDireccion,
  } = useDireccion({ defaultCountry, autoLocate: autoLocate && !value });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Si hay un valor inicial, actualizar el hook
  useEffect(() => {
    if (value && value.latitude && value.longitude) {
      setDireccion(value as Direccion);
    }
  }, [value, setDireccion]);

  // Notificar cambios al padre
  useEffect(() => {
    if (direccion.formatted_address) {
      onChange(direccion);
    }
  }, [direccion, onChange]);

  // Buscar mientras se escribe (debounce manual)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setTimeout(() => {
      if (query === e.target.value && query.length >= 3) {
        buscarDirecciones(query);
      }
    }, 500);
  };

  const handleSugerenciaClick = (sugerencia: any) => {
    seleccionarDireccion(sugerencia);
    if (searchInputRef.current) {
      searchInputRef.current.value = sugerencia.display_name;
    }
  };

  const handlePinMoved = (lat: number, lng: number) => {
    moverPin(lat, lng);
  };

  return (
    <div className="mapa-selector-container">
      {/* Barra de búsqueda */}
      <div className="mapa-search-bar">
        <input
          type="text"
          ref={searchInputRef}
          placeholder="Buscar dirección (ej: Av Corrientes 1234, CABA)"
          onChange={handleSearchChange}
          className="mapa-search-input"
        />
        <button onClick={localizar} className="mapa-locate-btn" title="Usar mi ubicación">
          📍
        </button>
      </div>

      {/* Lista de sugerencias */}
      {buscando && <div className="mapa-loading">Buscando...</div>}
      {sugerencias.length > 0 && (
        <ul className="mapa-sugerencias">
          {sugerencias.map((sug, idx) => (
            <li
              key={idx}
              onClick={() => handleSugerenciaClick(sug)}
              className="mapa-sugerencia-item"
            >
              {sug.display_name}
            </li>
          ))}
        </ul>
      )}

      {/* Mapa */}
      <div className="mapa-container">
        {direccion.latitude !== 0 && direccion.longitude !== 0 ? (
          <MapContainer
            center={[direccion.latitude, direccion.longitude]}
            zoom={15}
            style={{ height: '300px', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[direccion.latitude, direccion.longitude]} />
            <MapEvents onMove={handlePinMoved} />
          </MapContainer>
        ) : (
          <div className="mapa-placeholder">
            <p>Esperando ubicación...</p>
          </div>
        )}
      </div>

      {/* Info de dirección seleccionada */}
      {direccion.formatted_address && (
        <div className="mapa-info">
          <p className="mapa-direccion-confirmada">
            <strong>Dirección:</strong> {direccion.formatted_address}
          </p>
          <button onClick={resetear} className="mapa-reset-btn">
            Cambiar dirección
          </button>
        </div>
      )}

      {/* Mensajes de error */}
      {error && <div className="mapa-error">{error}</div>}
      {loading && <div className="mapa-loading">Cargando dirección...</div>}
    </div>
  );
}
