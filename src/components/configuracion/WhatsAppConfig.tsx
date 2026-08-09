// src/components/configuracion/WhatsAppConfig.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegocioContext } from '../../context/NegocioContext';
import styles from '../../styles/WhatsAppConfig.module.css'; // 👈 RUTA CORREGIDA

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface ConfiguracionWhatsApp {
  instanceId: string;
  apiToken: string;
  phoneNumber?: string | null;
  activo: boolean;
  estado?: string;
  ultimaPrueba?: string | null;
}

export default function WhatsAppConfig() {
  const { negocioId, slug, nombre } = useNegocioContext();
  const navigate = useNavigate();

  // Estado del formulario
  const [instanceId, setInstanceId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado de la configuración actual
  const [configuracionActual, setConfiguracionActual] = useState<ConfiguracionWhatsApp | null>(null);
  const [cargandoConfig, setCargandoConfig] = useState(true);

  // Cargar configuración existente al montar el componente
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/whatsapp/${negocioId}/config`);
        if (response.ok) {
          const data = await response.json();
          setConfiguracionActual(data);
          // Si existe configuración, precargar los campos
          if (data.instanceId) setInstanceId(data.instanceId);
          if (data.apiToken) setApiToken(data.apiToken);
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
      } finally {
        setCargandoConfig(false);
      }
    };

    cargarConfiguracion();
  }, [negocioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validaciones básicas
    if (!instanceId.trim() || !apiToken.trim()) {
      setMessage({ type: 'error', text: '❌ Por favor, completá todos los campos obligatorios.' });
      setLoading(false);
      return;
    }

    try {
      // PASO 1: Guardar configuración
      const saveResponse = await fetch(`${API_BASE_URL}/whatsapp/${negocioId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: instanceId.trim(),
          apiToken: apiToken.trim(),
          provider: 'greenapi',
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Error al guardar la configuración');
      }

      const saveData = await saveResponse.json();

      // PASO 2: Validar conexión
      const validateResponse = await fetch(`${API_BASE_URL}/whatsapp/${negocioId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok || !validateData.success) {
        throw new Error(validateData.message || 'No se pudo validar la conexión con GREEN API');
      }

      // PASO 3: Enviar mensaje de prueba (automático)
      const testResponse = await fetch(`${API_BASE_URL}/whatsapp/${negocioId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const testData = await testResponse.json();

      // Recargar configuración actualizada
      const configResponse = await fetch(`${API_BASE_URL}/whatsapp/${negocioId}/config`);
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfiguracionActual(configData);
      }

      if (testResponse.ok) {
        setMessage({
          type: 'success',
          text: '✅ ¡Configuración activada correctamente! Se envió un mensaje de prueba a tu WhatsApp.',
        });
      } else {
        setMessage({
          type: 'success',
          text: '✅ Configuración guardada y validada, pero no se pudo enviar el mensaje de prueba. Verificá el número vinculado en GREEN API.',
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ ${error.message || 'Error al configurar WhatsApp. Intentá nuevamente.'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/gestion/turnos/${slug}`);
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr?: string | null) => {
    if (!fechaStr) return 'No realizada';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleCancel} className={styles.backButton}>
          ← Volver a Turnos
        </button>
        <h1 className={styles.title}>🔔 Configurar Notificaciones por WhatsApp</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.instructions}>
          <h4>📝 Instrucciones:</h4>
          <ol>
            <li>
              Regístrate en{' '}
              <a
                href="https://console.green-api.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                GREEN API
              </a>{' '}
              (es gratuito).
            </li>
            <li>Crea una instancia en el plan <strong>Developer</strong>.</li>
            <li>Copia el <strong>ID de Instancia</strong> y el <strong>Token de API</strong>.</li>
            <li>Pega los datos en los campos de abajo.</li>
          </ol>
          <p className={styles.help}>
            📌 ¿Necesitas ayuda?{' '}
            <a href="/ayuda/whatsapp" target="_blank" className={styles.link}>
              Ver guía paso a paso con imágenes
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="instanceId" className={styles.label}>
              🔑 ID de Instancia <span className={styles.required}>*</span>
            </label>
            <input
              id="instanceId"
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="Ej: 1101819818"
              className={styles.input}
              required
            />
            <span className={styles.hint}>Obtenido de GREEN API</span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="apiToken" className={styles.label}>
              🔑 API Token <span className={styles.required}>*</span>
            </label>
            <input
              id="apiToken"
              type="text"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Token generado por GREEN API"
              className={styles.input}
              required
            />
            <span className={styles.hint}>Obtenido de GREEN API</span>
          </div>

          {message && (
            <div className={message.type === 'success' ? styles.success : styles.error}>
              {message.text}
            </div>
          )}

          <div className={styles.actions}>
            <button type="submit" className={styles.primary} disabled={loading}>
              {loading ? '⏳ Validando...' : '✅ Guardar y Activar'}
            </button>
            <button type="button" className={styles.secondary} onClick={handleCancel}>
              ❌ Cancelar
            </button>
          </div>
        </form>

        {/* Sección de Estado de la integración */}
        <div className={styles.statusSection}>
          <h3>⚙️ Estado de la integración</h3>
          {cargandoConfig ? (
            <p className={styles.statusText}>Cargando estado...</p>
          ) : configuracionActual && configuracionActual.activo ? (
            <div className={styles.statusActive}>
              <p className={styles.statusItem}>
                <span className={styles.statusLabel}>📱 Número conectado:</span>
                <span className={styles.statusValue}>
                  {configuracionActual.phoneNumber || 'No disponible'}
                </span>
              </p>
              <p className={styles.statusItem}>
                <span className={styles.statusLabel}>🟢 Estado:</span>
                <span className={styles.statusValue}>
                  {configuracionActual.estado === 'authorized' || configuracionActual.estado === 'online'
                    ? 'Activo (online)'
                    : configuracionActual.estado || 'Activo'}
                </span>
              </p>
              <p className={styles.statusItem}>
                <span className={styles.statusLabel}>📅 Última prueba:</span>
                <span className={styles.statusValue}>
                  {formatearFecha(configuracionActual.ultimaPrueba)}
                </span>
              </p>
            </div>
          ) : (
            <p className={styles.statusInactive}>🔴 No configurado</p>
          )}
        </div>
      </div>
    </div>
  );
}
