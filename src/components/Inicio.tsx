import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from '../styles/Inicio.module.css';
import SolicitarServicioModal from './SolicitarServicioModal';

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
  const [modalAyudaAbierto, setModalAyudaAbierto] = useState(false);

  const handleDemo = () => {
    navigate('/actividad');
  };

  const handleSolicitarAgenda = () => {
    window.scrollTo(0, 0);
    navigate('/solicitar-agenda');
  };

  const handleAyuda = () => {
    setModalAyudaAbierto(true);
  };

  const handleTerminos = () => {
    navigate('/terminos');
  };

  const handlePoliticas = () => {
    navigate('/privacidad');
  };

  const preguntasFrecuentes = [
    {
      pregunta: '¿Qué es PWA-Turnos?',
      respuesta: 'PWA-Turnos es una agenda online que permite a tus clientes reservar turnos las 24 horas, desde cualquier dispositivo, sin necesidad de descargar una aplicación.\n\nVos administrás todo desde un panel simple e intuitivo, mientras que tus clientes pueden reservar cuando quieran, incluso fuera de tu horario de atención.\n\n'
    },
    {
      pregunta: '¿Cuánto cuesta?',
      respuesta: 'PWA-Turnos es 100% GRATIS para profesionales independientes y pequeños negocios.\n\nPodés comenzar a utilizarla sin costo y sin límite de tiempo dentro de las características incluidas en el Plan Gratuito.'
    },
    {
      pregunta: '¿Cómo empiezo a usarlo?',
      respuesta: 'Creá tu cuenta gratuita, configurá tu negocio, los servicios que ofrecés y tus horarios.\nEn pocos minutos ya podés comenzar a recibir reservas online.'
    },
    {
      pregunta: '¿Qué servicios ofrece PWA-Turnos?',
      respuesta: `• Agenda Online 24/7\n  Obtené un enlace para compartir en redes sociales, WhatsApp o tu sitio web.\n\n• Gestión de Turnos\n  Administrá toda tu agenda desde un panel simple.\n\n• Notificaciones por Email\n  Vos y tu cliente reciben una confirmación automática de cada reserva.\n\nPLAN GRATUITO\n\n✓ 1 profesional\n✓ 2 centros físicos\n✓ 1 centro virtual\n✓ Turnos ilimitados\n✓ Agenda online disponible las 24 horas`
    },
    {
      pregunta: '¿Necesito instalar una aplicación?',
      respuesta: 'No. Ni vos ni tus clientes necesitan instalar nada. Todo funciona desde el navegador.'
    },
    {
      pregunta: '¿Necesito conocimientos técnicos?',
      respuesta: 'No. Todo se configura desde un panel simple e intuitivo.'
    },
    {
      pregunta: '¿Qué tipos de negocios pueden utilizar PWA-Turnos?',
      respuesta: `PWA-Turnos está pensado para cualquier actividad que trabaje con turnos, por ejemplo:\n\n💈 Barberías\n✂️ Peluquerías\n💆 Centros de estética\n🐾 Veterinarias\n🩺 Consultorios médicos\n🧠 Psicólogos\n🦷 Odontólogos\n💪 Kinesiólogos\n🥗 Nutricionistas\n💆‍♂️ Masajistas\n🎨 Estudios de tatuajes\n⚽ Canchas de fútbol\n🏓 Canchas de pádel\n📌 Y muchas otras actividades.`
    },
    {
      pregunta: '¿Puedo brindar teleconsultas?',
      respuesta: 'Sí. Podés configurar agendas virtuales y atender respetando automáticamente la zona horaria.'
    },
    {
      pregunta: '¿Cómo agrego más profesionales, centros o funcionalidades?',
      respuesta: 'Si tu organización necesita ampliar su cuenta, escribinos desde Ayuda. Analizaremos tu caso y te ofreceremos la mejor alternativa según tus necesidades.'
    },
    {
      pregunta: '¿Por qué PWA-Turnos es GRATIS?',
      respuesta: 'Queremos que profesionales independientes y pequeños negocios puedan acceder a una agenda online moderna sin realizar una inversión inicial.\n\nLas sugerencias de nuestros usuarios nos ayudan a seguir mejorando la plataforma y desarrollar nuevas soluciones para organizaciones con necesidades más avanzadas.'
    },
    {
      pregunta: '¿Tienen pensado agregar más funcionalidades?',
      respuesta: `Sí. Estamos mejorando PWA-Turnos continuamente.\n\nPróximamente:\n📅 Configuración de días no laborables\n📧 Recordatorios por Email\n📱 Recordatorios por WhatsApp\n💳 Pago online de reservas\n🎁 Promociones y descuentos\n📊 Historial de turnos\n🛠️ Nuevas herramientas de administración`
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
            {/* 👈 NUEVO TÍTULO */}
            <h1 className={styles['inicio-titulo']}>¿Todavía gestionás turnos por WhatsApp?</h1>
            
            {/* 👈 NUEVO SUBTÍTULO */}
            <p className={styles['inicio-subtitulo']}>
              Tus clientes reservan turnos. Vos dedicás tu tiempo a trabajar.
              <br />
              Creá tu agenda en pocos minutos, compartí tu enlace y empezá a recibir reservas las 24 horas, desde cualquier dispositivo.
            </p>

            {/* Botones */}
            <div className={styles['inicio-botones']}>
              {/* 1. Demo */}
              <button 
                onClick={handleDemo}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-demo']}`}
              >
               ▶ Ver PWA-Turnos en acción (1 min)
              </button>

              {/* 2. Solicitar Agenda Gratis */}
              <button 
                onClick={handleSolicitarAgenda}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-solicitar']}`}
              >
                🚀 Creá tu agenda GRATIS
              </button>
            </div>

            {/* Badges pequeños */}
            <div className={styles['inicio-badges']}>
              <span className={styles['inicio-badge']}>✅ Sin tarjeta de crédito</span>
              <span className={styles['inicio-badge']}>📱 Sin instalar aplicaciones</span>
              <span className={styles['inicio-badge']}>⚡ Lista en pocos minutos</span>
            </div>

            {/* 👈 FRASE ELIMINADA */}

            {/* Sección de BENEFICIOS */}
            <div className={styles['inicio-beneficios']}>
              <h2 className={styles['inicio-beneficios-titulo']}>BENEFICIOS</h2>
              
              <div className={styles['inicio-beneficio-item']}>
                <span className={styles['inicio-beneficio-icono']}>🕒</span>
                <div>
                  <h3 className={styles['inicio-beneficio-titulo']}>Tus clientes reservan las 24 horas</h3>
                  <p className={styles['inicio-beneficio-descripcion']}>
                    Aunque tu negocio esté cerrado, tus clientes pueden seguir reservando turnos desde cualquier dispositivo.
                  </p>
                </div>
              </div>

              <div className={styles['inicio-beneficio-item']}>
                <span className={styles['inicio-beneficio-icono']}>📱</span>
                <div>
                  <h3 className={styles['inicio-beneficio-titulo']}>Funciona desde cualquier dispositivo</h3>
                  <p className={styles['inicio-beneficio-descripcion']}>
                    No necesitan descargar aplicaciones. Solo compartís tu enlace y empezás a recibir reservas.
                  </p>
                </div>
              </div>

              <div className={styles['inicio-beneficio-item']}>
                <span className={styles['inicio-beneficio-icono']}>⚡</span>
                <div>
                  <h3 className={styles['inicio-beneficio-titulo']}>Configuración rápida</h3>
                  <p className={styles['inicio-beneficio-descripcion']}>
                    En pocos minutos podés tener configurado tu negocio y comenzar a recibir reservas online.
                  </p>
                </div>
              </div>
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

            {/* Última llamada a la acción */}
            <div className={styles['inicio-cta-final']}>
              <h2 className={styles['inicio-cta-titulo']}>¿Listo para empezar?</h2>
              <p className={styles['inicio-cta-titulo']}>Creá tu agenda GRATIS y empezá a recibir reservas online hoy mismo.</p>
              <button 
                onClick={handleSolicitarAgenda}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-solicitar']}`}
                style={{ marginTop: '16px' }}
              >
                🚀 Creá tu agenda GRATIS
              </button>
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

      {/* Modal de ayuda */}
      <SolicitarServicioModal isOpen={modalAyudaAbierto} onClose={() => setModalAyudaAbierto(false)} />
    </div>
  );
}
