// src/context/NegocioContext.tsx
import { createContext, useContext, ReactNode } from 'react';

// 📋 Interfaz que define los datos del negocio
interface NegocioContextProps {
  negocioId: number;
  slug: string;
  nombre: string;
}

// 📋 Interfaz para las props del Provider
interface NegocioProviderProps {
  children: ReactNode;
  negocioId: number;
  slug: string;
  nombre: string;
}

// 📌 Crear el contexto con un valor por defecto (undefined)
const NegocioContext = createContext<NegocioContextProps | undefined>(undefined);

// 📌 Provider: provee los datos del negocio a los hijos
export const NegocioProvider = ({ children, negocioId, slug, nombre }: NegocioProviderProps) => {
  return (
    <NegocioContext.Provider value={{ negocioId, slug, nombre }}>
      {children}
    </NegocioContext.Provider>
  );
};

// 📌 Hook personalizado para usar el contexto fácilmente
export const useNegocioContext = (): NegocioContextProps => {
  const context = useContext(NegocioContext);
  if (!context) {
    throw new Error('useNegocioContext debe usarse dentro de un NegocioProvider');
  }
  return context;
};
