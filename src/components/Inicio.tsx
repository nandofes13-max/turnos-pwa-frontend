import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaMicrosoft } from 'react-icons/fa';
import { MdPhoneIphone, MdEmail } from 'react-icons/md';
import '../styles/Inicio.module.css';

export default function Inicio() {
  const handleDemo = () => {
    // Por ahora redirige a /cpanel (después manejaremos roles)
    window.location.href = '/cpanel';
  };

  const handleAyuda = () => {
    alert('Funcionalidad demo: Ayuda');
  };

  const handleTerminos = () => {
    alert('Funcionalidad demo: Términos y Condiciones');
  };

  const handlePoliticas = () => {
    alert('Funcionalidad demo: Políticas de Privacidad');
  };

  return (
    <div className="inicio-container">
      <div className="inicio-card">
        
        {/* Logo */}
        <div className="inicio-logo">
          <img 
            src="/logo-pwa-turnos.svg" 
            alt="PWA Turnos" 
            className="inicio-logo-img"
          />
        </div>

        {/* Títulos */}
        <h1 className="inicio-titulo">Te damos la bienvenida</h1>
        <p className="inicio-subtitulo">Inicia sesión o suscríbete</p>

        {/* Botones */}
        <div className="inicio-botones">
          <button 
            onClick={handleDemo}
            className="inicio-btn inicio-btn-demo"
          >
            Demo
          </button>

          <button className="inicio-btn">
            <FcGoogle className="inicio-btn-icon" />
            Continuar con Google
          </button>

          <button className="inicio-btn">
            <FaApple className="inicio-btn-icon" />
            Continuar con Apple
          </button>

          <button className="inicio-btn">
            <FaMicrosoft className="inicio-btn-icon" />
            Continuar con Microsoft
          </button>

          <button className="inicio-btn">
            <MdPhoneIphone className="inicio-btn-icon" />
            Continuar con el teléfono
          </button>

          <button className="inicio-btn">
            <MdEmail className="inicio-btn-icon" />
            Dirección Correo Electrónico
          </button>
        </div>

        {/* Footer */}
        <div className="inicio-footer">
          <a onClick={handleAyuda} className="inicio-footer-link">
            ¿Necesitas Ayuda?
          </a>
          <a onClick={handleTerminos} className="inicio-footer-link">
            Términos y Condiciones
          </a>
          <a onClick={handlePoliticas} className="inicio-footer-link">
            Políticas de Privacidad
          </a>
          <div className="inicio-version">
            v.0.10
          </div>
        </div>

      </div>
    </div>
  );
}
