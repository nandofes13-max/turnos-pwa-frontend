// src/components/configuracion/WhatsAppConfig.tsx
import { useNegocioContext } from '../../context/NegocioContext';

export default function WhatsAppConfig() {
  const { negocioId, slug, nombre } = useNegocioContext();

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🔔 Configuración de Notificaciones por WhatsApp</h1>
      <p><strong>Negocio:</strong> {nombre}</p>
      <p><strong>ID:</strong> {negocioId}</p>
      <p><strong>Slug:</strong> {slug}</p>
      <hr />
      <p>📱 Recibirás las notificaciones en el número de WhatsApp que vinculaste con GREEN API.</p>
      <p style={{ color: '#888', fontSize: '14px' }}>
        Próximamente: integración completa con GREEN API.
      </p>
    </div>
  );
}
