import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Actividad from './components/Actividad';
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
import ProfesionalCentro from './components/ProfesionalCentro'; // 👈 NUEVO IMPORT
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/actividad" element={<Actividad />} />
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
        <Route path="/profesional-centro" element={<ProfesionalCentro />} /> {/* 👈 NUEVA RUTA */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
