// src/components/Inicio.tsx
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

  const handleWhatsApp = () => {
    const mensaje = encodeURIComponent('Hola, tengo una consulta sobre PWA-Turnos.');
    window.open(`https://wa.me/5491170602543?text=${mensaje}`, '_blank');
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
      
      {/* 👈 BOTÓN FLOTANTE DE WHATSAPP */}
      <button
        onClick={handleWhatsApp}
        className={styles['whatsapp-float']}
        aria-label="Contactar por WhatsApp"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          fill="white"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>

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
            <h1 className={styles['inicio-titulo']}>¿Todavía gestionás turnos por WhatsApp?</h1>
            
            <p className={styles['inicio-subtitulo']}>
              Tus clientes reservan turnos. Vos dedicás tu tiempo a trabajar.
              <br />
              Creá tu agenda en pocos minutos, compartí tu enlace y empezá a recibir reservas las 24 horas, desde cualquier dispositivo.
            </p>

            {/* Botones */}
            <div className={styles['inicio-botones']}>
              <button 
                onClick={handleDemo}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-demo']}`}
              >
               ▶ Ver PWA-Turnos en acción (1 min)
              </button>

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

            {/* 👈 IMAGEN AGREGADA AQUÍ (después de beneficios, antes de FAQ) */}
            <div className={styles['inicio-imagen-container']}>
              <h3 className={styles['inicio-imagen-titulo']}>
                Reservar un turno es así de simple.
              </h3>
              
              <img 
                src="/agenda.png" 
                alt="Compartí tu enlace y dejá que tus clientes reserven cuando quieran." 
                className={styles['inicio-imagen']}
                loading="lazy"
              />
              
              <p className={styles['inicio-imagen-texto']}>
                Compartí tu enlace y dejá que tus clientes reserven cuando quieran.
              </p>
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
              <p className={styles['inicio-beneficio-descripcion']}>
                    Creá tu agenda GRATIS y empezá a recibir reservas online hoy mismo.
                  </p>
              <button 
                onClick={handleSolicitarAgenda}
                className={`${styles['inicio-btn']} ${styles['inicio-btn-solicitar']}`}
                style={{ marginTop: '16px' }}
              >
                🚀 Creá tu agenda GRATIS
              </button>
            </div>

            {/* Footer con WhatsApp */}
            <div className={styles['inicio-footer']}>
              <button 
                onClick={handleAyuda} 
                className={styles['inicio-footer-link']}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ¿Necesitas Ayuda?
              </button>
              {/* 👈 NUEVO: Enlace de WhatsApp en el footer */}
              <button 
                onClick={handleWhatsApp} 
                className={styles['inicio-footer-link']}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  width="16" 
                  height="16" 
                  fill="#25D366"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contáctanos por WhatsApp
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
