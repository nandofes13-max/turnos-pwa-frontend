import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Actividad from './components/Actividad';
import CPanel from './components/CPanel';
import Actividades from './components/Actividades';
import Usuarios from './components/Usuarios';
import Roles from './components/Roles';
import Negocios from './components/Negocios'; // 👈 AGREGADO
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
        <Route path="/negocios" element={<Negocios />} /> {/* 👈 AGREGADO */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
