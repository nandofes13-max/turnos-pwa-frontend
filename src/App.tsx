import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './components/Inicio';
import CPanel from './components/CPanel';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/cpanel" element={<CPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
