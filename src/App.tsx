import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Actividad from './components/Actividad';
import Especialidad from './components/Especialidad';
import Centro from './components/Centro';
import CPanel from './components/CPanel';
import Actividades from './components/Actividades';
import Usuarios from './components/Usuarios';
import Roles from './components/Roles';
import Negocios from './components/Negocios';
import NegociosUsuariosRoles from './components/NegociosUsuariosRoles';
import NegocioActividades from './components/NegocioActividades';
import Especialidades from './components/Especialidades';
import ActividadEspecialidad from './components/ActividadEspecialidad';
import Profesionales from './components/Profesionales';
import ProfesionalEspecialidad from './components/ProfesionalEspecialidad';
import Centros from './components/Centros';
import ProfesionalCentro from './components/ProfesionalCentro';
import AgendaDisponibilidad from './components/AgendaDisponibilidad';
import Agenda from './components/Agenda';
import Turnos from './components/Turnos';
import RedireccionNegocio from './components/RedireccionNegocio';
import RedireccionTurnos from './components/RedireccionTurnos';
import ActividadPorNegocio from './components/ActividadPorNegocio';
import SolicitarAgendaWizard from './components/SolicitarAgendaWizard';
import AdminLogin from './components/AdminLogin';
import Terminos from './components/Terminos';
import Privacidad from './components/Privacidad';
// 👈 NUEVO: Importar Footer
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          
          {/* ============================================================ */}
          {/* RUTA PARA SOLICITAR AGENDA GRATIS (WIZARD) */}
          {/* ============================================================ */}
          <Route path="/solicitar-agenda" element={<SolicitarAgendaWizard />} />
          
          {/* ============================================================ */}
          {/* RUTAS PARA NEGOCIOS (URL amigable) */}
          {/* ============================================================ */}
          <Route path="/negocio/:url" element={<RedireccionNegocio />} />
          <Route path="/negocio/:url/actividad" element={<ActividadPorNegocio />} />
          <Route path="/negocio/:url/actividad/:actividadId/especialidad" element={<Especialidad />} />
          <Route path="/negocio/:url/actividad/:actividadId/especialidad/:especialidadId/centro" element={<Centro />} />
          <Route path="/negocio/:url/actividad/:actividadId/especialidad/:especialidadId/centro/:centroId/agenda" element={<Agenda />} />
          
          {/* ============================================================ */}
          {/* RUTA PARA GESTIÓN DE TURNOS (DUEÑOS DE NEGOCIO) */}
          {/* ============================================================ */}
          <Route path="/gestion/turnos/:slug" element={<RedireccionTurnos />} />
          
          {/* ============================================================ */}
          {/* RUTA PARA ADMINISTRACIÓN DE TURNOS (CON LOGIN) */}
          {/* ============================================================ */}
          <Route path="/admin/turnos" element={<AdminLogin />} />
          
          {/* ============================================================ */}
          {/* RUTAS LEGALES */}
          {/* ============================================================ */}
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          
          {/* ============================================================ */}
          {/* RUTAS PARA DEMO (compatibilidad hacia atrás) */}
          {/* ============================================================ */}
          <Route path="/actividad" element={<Actividad />} />
          <Route path="/actividad/:actividadId/especialidad" element={<Especialidad />} />
          <Route path="/actividad/:actividadId/especialidad/:especialidadId/centro" element={<Centro />} />
          <Route path="/actividad/:actividadId/especialidad/:especialidadId/centro/:centroId/agenda" element={<Agenda />} />
          
          {/* ============================================================ */}
          {/* RUTAS DE ADMINISTRACIÓN */}
          {/* ============================================================ */}
          <Route path="/cpanel" element={<CPanel />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/negocios" element={<Negocios />} />
          <Route path="/negocios-usuarios-roles" element={<NegociosUsuariosRoles />} />
          <Route path="/negocio-actividades" element={<NegocioActividades />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route path="/actividad-especialidad" element={<ActividadEspecialidad />} />
          <Route path="/profesionales" element={<Profesionales />} />
          <Route path="/profesional-especialidad" element={<ProfesionalEspecialidad />} />
          <Route path="/centros" element={<Centros />} />
          <Route path="/profesional-centro" element={<ProfesionalCentro />} />
          <Route path="/agenda-disponibilidad/:profesionalCentroId" element={<AgendaDisponibilidad />} />
        </Routes>
        
        {/* 👈 NUEVO: Footer global fuera de las rutas */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
