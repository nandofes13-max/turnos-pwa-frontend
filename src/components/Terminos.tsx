// src/components/Terminos.tsx
import { useNavigate } from 'react-router-dom';

export default function Terminos() {
  const navigate = useNavigate();

  return (
    <div className="tm-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <h1 className="tm-titulo" style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>Términos y Condiciones de Uso</h1>
      
      <div style={{ lineHeight: '1.6', color: '#374151', fontSize: '0.9rem' }}>
        <p><strong>Última actualización:</strong> Junio de 2026</p>
        
        <p>Bienvenido a <strong>PWA - Turnos</strong>.</p>
        
        <p>Al registrarte o utilizar esta plataforma aceptas los presentes Términos y Condiciones.</p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>1. Objeto del servicio</h2>
        <p>
          PWA - Turnos es una plataforma que permite a profesionales, comercios y organizaciones administrar agendas 
          y gestionar reservas de turnos realizadas por sus clientes.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>2. Uso de la plataforma</h2>
        <p>
          El usuario se compromete a utilizar la plataforma de manera responsable, respetando la legislación vigente 
          y los derechos de terceros.
        </p>
        <p>
          No está permitido utilizar el servicio para actividades ilícitas, fraudulentas o que puedan perjudicar 
          a otros usuarios o al funcionamiento de la plataforma.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>3. Responsabilidad del usuario</h2>
        <p>
          Cada usuario es responsable de la información que registra y mantiene dentro de su cuenta, así como de 
          la confidencialidad de sus credenciales de acceso.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>4. Responsabilidad del servicio</h2>
        <p>
          PWA - Turnos actúa únicamente como una herramienta tecnológica para la gestión de turnos.
        </p>
        <p>
          La plataforma no presta servicios médicos, veterinarios, estéticos, deportivos, profesionales ni comerciales, 
          y no participa en la relación entre el profesional o negocio y sus clientes.
        </p>
        <p>
          Cada profesional o negocio es el único responsable de los servicios que ofrece y de la información publicada.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>5. Disponibilidad</h2>
        <p>
          Se realizan esfuerzos para mantener el servicio disponible de forma continua. Sin embargo, pueden producirse 
          interrupciones por tareas de mantenimiento, actualizaciones, fallas técnicas o causas ajenas al control 
          de la plataforma.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>6. Propiedad intelectual</h2>
        <p>
          El software, diseño, logotipos, código fuente, textos e identidad visual de PWA - Turnos son propiedad 
          de sus titulares y no podrán copiarse, modificarse o distribuirse sin autorización.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>7. Modificaciones</h2>
        <p>
          Estos Términos y Condiciones podrán actualizarse cuando resulte necesario. Las modificaciones entrarán 
          en vigencia desde su publicación en la plataforma.
        </p>

        <h2 style={{ marginTop: '1.2rem', marginBottom: '0.3rem', fontSize: '1.1rem' }}>8. Contacto</h2>
        <p>
          Para consultas relacionadas con estos términos podrás comunicarte mediante los canales de contacto 
          disponibles dentro de la aplicación.
        </p>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => navigate(-1)} className="tm-btn-secundario" style={{ padding: '0.4rem 1.5rem', fontSize: '0.9rem' }}>
          Volver
        </button>
      </div>
    </div>
  );
}
