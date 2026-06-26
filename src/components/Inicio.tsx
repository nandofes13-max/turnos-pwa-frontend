import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from '../styles/Inicio.module.css';
import SolicitarServicioModal from './SolicitarServicioModal'; // 👈 NUEVO

// Componente de acordeón para preguntas frecuentes
const FaqItem = ({ pregunta, respuesta }: { pregunta: string; respuesta: string }) => {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={styles['faq-item']}>
      <button 
        className={styles['faq-pregunta']} 
        onClick={() => setAbierto(!abierto)}
      >
        <span>{pregunta}</span>
        {abierto ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {abierto && (
        <div className={styles['faq-respuesta']}>
          {respuesta}
        </div>
      )}
    </div>
  );
};

export default function Inicio() {
  const navigate = useNavigate();
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState(false); // 👈 NUEVO

  const handleDemo = () => {
    navigate('/actividad');
  };

  const handleSolicitarAgenda = () => {
    navigate('/solicitar-agenda');
  };

  // 👈 NUEVO: Abre el modal de ayuda
  const handleAyuda = () => {
    setModalAyudaAbierto(true);
  };

  // 👈 NUEVO: Redirigir a Términos y Condiciones
  const handleTerminos = () => {
    navigate('/terminos');
  };

  // 👈 NUEVO: Redirigir a Política de Privacidad
  const handlePoliticas = () => {
    navigate('/privacidad');
  };

  const preguntasFrecuentes = [
    {
      pregunta: '¿Qué es PWA Turnos?',
      respuesta: 'Es un sistema de gestión de turnos online que permite a tus clientes reservar turnos 24/7 desde cualquier dispositivo, sin necesidad de descargar una app.'
    },
    {
      pregunta: '¿Cómo empiezo a usarlo?',
      respuesta: 'Solo necesitas crear tu cuenta, configurar tu negocio, servicios y horarios. En menos de 20 minutos ya podés recibir reservas online.'
    },
    {
      pregunta: '¿Cuánto cuesta?',
      respuesta: 'Tenemos un plan gratuito sin límite de turnos. Para negocios que necesiten más funcionalidades, hay planes pagos desde $6.900 por mes. Sin comisiones por turno reservado.'
    },
    {
      pregunta: '¿Necesito saber programación?',
      respuesta: 'No, todo es configurable desde un panel administrativo simple e intuitivo. No necesitas conocimientos técnicos.'
    },
    {
      pregunta: '¿Puedo tener varios profesionales?',
      respuesta: 'Sí, cada profesional puede tener su propia agenda con accesos independientes. Vos tenés el control total.'
    }
  ];

  return (
    <div className={styles['inicio-container']}>
      
      {/* Columna izquierda */}
      <div className={styles['inicio-left']}>
        <div className={styles['inicio-left-content']}>
          
          {/* Logo solo visible en móvil */}
          <div className={styles['inicio-logo-mobile']}>
            <img 
              src="/logo-pwa-turnos.svg" 
              alt="PWA Turnos" 
              className={styles['inicio-logo-mobile-img']}
            />
          </div>

          <div className={styles['inicio-card']}>
            <h1 className={styles['inicio-titulo']}>Te damos la bienvenida</h1>
            <p className={styles['inicio-subtitulo']}>Gestioná tus turnos de manera simple y eficiente</p>

            {/* Botones */}
            <div className={styles['inicio-botones']}>
              {/* 1. Demo */}
              <button 
                onClick={handleDemo}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-demo']}`}
              >
                DEMO GRATIS
              </button>

              {/* 2. Solicitar Agenda Gratis */}
              <button 
                onClick={handleSolicitarAgenda}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-solicitar']}`}
              >
                SOLICITAR AGENDA GRATIS
              </button>
            </div>

            {/* Preguntas Frecuentes */}
            <div className={styles['faq-section']}>
              <h2 className={styles['faq-titulo']}>Preguntas Frecuentes</h2>
              <div className={styles['faq-lista']}>
                {preguntasFrecuentes.map((item, index) => (
                  <FaqItem key={index} pregunta={item.pregunta} respuesta={item.respuesta} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={styles['inicio-footer']}>
              <button 
                onClick={handleAyuda} 
                className={styles['inicio-footer-link']}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ¿Necesitas Ayuda?
              </button>
              <button 
                onClick={handleTerminos} 
                className={styles['inicio-footer-link']}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Términos y Condiciones
              </button>
              <button 
                onClick={handlePoliticas} 
                className={styles['inicio-footer-link']}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Políticas de Privacidad
              </button>
              <div className={styles['inicio-version']}>
                v.1.00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna derecha - LOGO (solo desktop) */}
      <div className={styles['inicio-right']}>
        <div className={styles['inicio-right-content']}>
          <Link to="/">
            <img 
              src="/1000133565.png" 
              alt="PWA Turnos" 
              className={styles['inicio-logo-desktop']}
            />
          </Link>
        </div>
      </div>

      {/* 👈 NUEVO: Modal de ayuda */}
      <SolicitarServicioModal isOpen={modalAyudaAbierto} onClose={() => setModalAyudaAbierto(false)} />
    </div>
  );
}
