import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import Actividad from './components/Actividad';  // 👈 AGREGADO
import CPanel from './components/CPanel';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/actividad" element={<Actividad />} />  {/* 👈 AGREGADO */}
        <Route path="/cpanel" element={<CPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
