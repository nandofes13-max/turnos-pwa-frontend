import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4173;

// Servir archivos compilados de Vite
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Redirigir todas las rutas al index.html para SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Arrancar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor PWA corriendo en puerto ${PORT}`);
});
