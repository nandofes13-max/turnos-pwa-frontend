// src/hooks/useDireccion.ts
import { useState, useCallback, useEffect } from 'react';

// Tipos para la dirección
export interface Direccion {
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

// Estado inicial vacío
const direccionVacia: Direccion = {
  street: '',
  street_number: '',
  postal_code: '',
  city: '',
  state: '',
  country: '',
  country_code: '',
  latitude: 0,
  longitude: 0,
  formatted_address: '',
};

// Opciones del hook
interface UseDireccionOptions {
  defaultCountry?: string;
  autoLocate?: boolean;
}

export function useDireccion(options: UseDireccionOptions = {}) {
  const { defaultCountry = 'AR', autoLocate = true } = options;

  // Estados
  const [direccion, setDireccion] = useState<Direccion>(direccionVacia);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  // =============================================
  // 1. Obtener ubicación del navegador
  // =============================================
  const obtenerUbicacion = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada por el navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  }, []);

  // =============================================
  // 2. Reverse Geocoding (coordenadas → dirección)
  // =============================================
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<Direccion | null> => {
    setLoading(true);
    setError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TurnosPWA/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Error en la solicitud a Nominatim');
      }

      const data = await response.json();

      if (!data || !data.address) {
        throw new Error('No se pudo obtener dirección de las coordenadas');
      }

      const nuevaDireccion: Direccion = {
        street: data.address.road || data.address.pedestrian || '',
        street_number: data.address.house_number || '',
        postal_code: data.address.postcode || '',
        city: data.address.city || data.address.town || data.address.village || '',
        state: data.address.state || '',
        country: data.address.country || '',
        country_code: (data.address.country_code || '').toUpperCase(),
        latitude: lat,
        longitude: lon,
        formatted_address: data.display_name || '',
      };

      setDireccion(nuevaDireccion);
      setLoading(false);
      return nuevaDireccion;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al obtener dirección';
      setError(mensaje);
      setLoading(false);
      return null;
    }
  }, []);

  // =============================================
  // 3. Localización automática al iniciar
  // =============================================
  const localizar = useCallback(async () => {
    try {
      const position = await obtenerUbicacion();
      const { latitude, longitude } = position.coords;
      await reverseGeocode(latitude, longitude);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al obtener ubicación');
      }
    }
  }, [obtenerUbicacion, reverseGeocode]);

  // =============================================
  // 4. Buscar direcciones (autocomplete)
  // =============================================
  const buscarDirecciones = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSugerencias([]);
      return;
    }

    setBuscando(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TurnosPWA/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      setSugerencias(data);
    } catch (err) {
      console.error('Error buscando direcciones:', err);
      setSugerencias([]);
    } finally {
      setBuscando(false);
    }
  }, []);

  // =============================================
  // 5. Seleccionar una dirección de las sugerencias
  // =============================================
  const seleccionarDireccion = useCallback(async (sugerencia: any) => {
    if (!sugerencia) return;

    setLoading(true);
    try {
      await reverseGeocode(parseFloat(sugerencia.lat), parseFloat(sugerencia.lon));
      setSugerencias([]);
    } catch (err) {
      console.error('Error al seleccionar dirección:', err);
    } finally {
      setLoading(false);
    }
  }, [reverseGeocode]);

  // =============================================
  // 6. Mover pin (actualizar solo coordenadas)
  // =============================================
  const moverPin = useCallback((lat: number, lng: number) => {
    setDireccion(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  }, []);

  // =============================================
  // 7. Resetear dirección
  // =============================================
  const resetear = useCallback(() => {
    setDireccion(direccionVacia);
    setError(null);
    setSugerencias([]);
  }, []);

  // =============================================
  // 8. Inicializar (auto localizar si está activado)
  // =============================================
  useEffect(() => {
    if (autoLocate) {
      localizar();
    }
  }, [autoLocate, localizar]); // 👈 CORREGIDO

  return {
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
  };
}
