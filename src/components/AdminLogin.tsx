// src/components/AdminLogin.tsx
// Pantalla de login para administradores
// Ruta: /admin/turnos

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Turnos from './Turnos';
import styles from '../styles/AdminLogin.module.css';

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'admin123'; // ⚠️ Cambiar por una contraseña segura

export default function AdminLogin() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [autenticado, setAutenticado] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usuario === ADMIN_USER && password === ADMIN_PASSWORD) {
      setAutenticado(true);
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  if (autenticado) {
    // Si está autenticado, mostrar la pantalla de turnos
    return <Turnos />;
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>🔐 Acceso Administrativo</h1>
        <p className={styles.loginSubtitle}>Ingresá tus credenciales para gestionar todos los turnos</p>
        
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className={styles.formInput}
              placeholder="Ingresá tu usuario"
              autoFocus
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
              placeholder="Ingresá tu contraseña"
            />
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <button type="submit" className={styles.loginButton}>
            Ingresar
          </button>
        </form>
        
        <p className={styles.loginFooter}>
          Solo personal autorizado
        </p>
      </div>
    </div>
  );
}
