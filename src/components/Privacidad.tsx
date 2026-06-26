// src/components/Privacidad.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacidad() {
  const navigate = useNavigate();

  // 👈 Forzar scroll al inicio al cargar la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleVolver = () => {
    navigate('/'); // 👈 Volver al inicio
    window.scrollTo(0, 0); // 👈 Asegurar scroll al inicio
  };

  return (
    <div className="tm-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <h1 className="tm-titulo" style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>Política de Privacidad</h1>
      
      <div style={{ lineHeight: '1.6', color: '#374151', fontSize: '0.9rem' }}>
        <p><strong>Última actualización:</strong> Junio de 2026</p>
        
        <p>
          En <strong>PWA - Turnos</strong> valoramos la privacidad de nuestros usuarios y procuramos proteger 
          la información que nos confían.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>1. Información recopilada</h2>
        <p>
          Podemos recopilar información como nombre, correo electrónico, teléfono, datos de la cuenta y la información 
          necesaria para la gestión de turnos.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>2. Finalidad</h2>
        <p>Los datos se utilizan exclusivamente para:</p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '0.8rem' }}>
          <li>permitir el funcionamiento de la plataforma;</li>
          <li>gestionar turnos y agendas;</li>
          <li>identificar a los usuarios;</li>
          <li>mejorar el servicio;</li>
          <li>brindar soporte cuando sea necesario.</li>
        </ul>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>3. Compartir información</h2>
        <p>
          PWA - Turnos no vende ni comercializa los datos personales de sus usuarios.
        </p>
        <p>
          La información podrá ser compartida únicamente cuando resulte necesaria para el funcionamiento del servicio 
          o cuando exista una obligación legal.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>4. Seguridad</h2>
        <p>
          Se aplican medidas razonables de seguridad para proteger la información almacenada. No obstante, ningún 
          sistema es completamente infalible y no puede garantizarse una seguridad absoluta.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>5. Conservación de los datos</h2>
        <p>
          La información se conservará mientras la cuenta permanezca activa o durante el tiempo necesario para 
          prestar el servicio.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>6. Eliminación de la cuenta</h2>
        <p>
          El usuario podrá solicitar la eliminación de su cuenta y de los datos asociados conforme a las posibilidades 
          técnicas y a las obligaciones legales aplicables.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>7. Cambios en esta política</h2>
        <p>
          Esta Política de Privacidad podrá modificarse en cualquier momento. Las nuevas versiones estarán 
          disponibles dentro de la plataforma.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>8. Contacto</h2>
        <p>
          Si tienes consultas sobre esta Política de Privacidad podrás comunicarte mediante los canales de contacto 
          disponibles en la aplicación.
        </p>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button onClick={handleVolver} className="tm-btn-secundario" style={{ padding: '0.4rem 1.5rem', fontSize: '0.9rem' }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
