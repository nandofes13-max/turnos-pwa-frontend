import { useState } from 'react';
import Login from './components/Login';
import MainMenu from './components/MainMenu';
import CPanel from './components/CPanel';

export default function App() {
  // Estado de la PWA
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<'menu' | 'cpanel' | 'pacientes'>('menu');

  // Función para manejar login
  const handleLogin = () => {
    setLoggedIn(true);
    setCurrentPanel('menu');
  };

  // Función para manejar selección del menú
  const handleMenuSelect = (panel: 'cpanel' | 'pacientes') => {
    setCurrentPanel(panel);
  };

  // Función para volver al menú principal
  const handleBackToMenu = () => {
    setCurrentPanel('menu');
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPanel === 'menu') {
    return <MainMenu onSelect={handleMenuSelect} />;
  }

  if (currentPanel === 'cpanel') {
    return (
      <div>
        <button
          onClick={handleBackToMenu}
          className="m-4 p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Volver al Menú
        </button>
        <CPanel />
      </div>
    );
  }

  // Por ahora dejamos Pacientes como un placeholder
  if (currentPanel === 'pacientes') {
    return (
      <div className="p-6">
        <button
          onClick={handleBackToMenu}
          className="m-4 p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Volver al Menú
        </button>
        <h2>Pantalla de Pacientes (demo)</h2>
      </div>
    );
  }

  return null;
}
