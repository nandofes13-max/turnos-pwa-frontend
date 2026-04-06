// src/components/modals/ProfesionalFormModal.tsx
import { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface ProfesionalFormData {
  id?: number;
  documento: string;
  nombre: string;
  email: string;
  genero: string;
  matricula: string;
  foto: string;
}

interface ProfesionalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profesionalCreado?: any) => void;
  profesional?: ProfesionalFormData | null;
  modo: 'add' | 'edit';
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PROFESIONALES_URL = `${API_BASE_URL}/profesionales`;
const UPLOAD_URL = `${API_BASE_URL}/upload`;

export default function ProfesionalFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  profesional, 
  modo 
}: ProfesionalFormModalProps) {
  const [formData, setFormData] = useState<ProfesionalFormData>({
    documento: '',
    nombre: '',
    email: '',
    genero: '',
    matricula: '',
    foto: ''
  });
  const [phoneValue, setPhoneValue] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profesional && modo === 'edit') {
      setFormData({
        documento: profesional.documento,
        nombre: profesional.nombre,
        email: profesional.email,
        genero: profesional.genero || '',
        matricula: profesional.matricula || '',
        foto: profesional.foto || ''
      });
      // Nota: El teléfono debería venir en el objeto profesional
      // Por ahora lo dejamos como está, idealmente deberías pasar phoneValue también
    } else if (modo === 'add') {
      setFormData({
        documento: '',
        nombre: '',
        email: '',
        genero: '',
        matricula: '',
        foto: ''
      });
      setPhoneValue(undefined);
    }
    setErrorMessage(null);
  }, [profesional, modo, isOpen]);

  const parsePhoneE164 = (phone: string | undefined) => {
    if (!phone) return { country_code: null, national_number: '' };
    const match = phone.match(/^\+(\d{1,3})(\d+)$/);
    if (match) {
      return { country_code: parseInt(match[1], 10), national_number: match[2] };
    }
    return { country_code: null, national_number: '' };
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          if (!res.ok) throw new Error('Error al subir imagen');
          const data = await res.json();
          resolve(data.url);
        } catch (err) {
          reject(err);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploading(false);
        reject(new Error('Error al leer el archivo'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se permiten imágenes');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('La imagen no debe superar los 2MB');
      return;
    }

    try {
      const url = await uploadImage(file);
      setFormData({ ...formData, foto: url });
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al subir la imagen');
    }
  };

  const validarFormulario = (): boolean => {
    if (!formData.documento.trim()) {
      setErrorMessage('El documento es obligatorio');
      return false;
    }
    if (!formData.nombre.trim()) {
      setErrorMessage('El nombre es obligatorio');
      return false;
    }
    if (!formData.email.trim()) {
      setErrorMessage('El email es obligatorio');
      return false;
    }
    if (!formData.genero) {
      setErrorMessage('Debe seleccionar un género');
      return false;
    }
    if (!phoneValue) {
      setErrorMessage('El WhatsApp es obligatorio');
      return false;
    }
    return true;
  };

  const verificarExistente = async (documento: string, email: string, id?: number): Promise<boolean> => {
    try {
      const res = await fetch(PROFESIONALES_URL);
      const data: any[] = await res.json();
      const activos = data.filter(p => 
        !p.fecha_baja && 
        (id ? p.id !== id : true)
      );
      const documentoExistente = activos.some(p => p.documento === documento);
      const emailExistente = activos.some(p => p.email === email);
      
      if (documentoExistente) {
        setErrorMessage('Ya existe un profesional activo con ese documento');
        return false;
      }
      if (emailExistente) {
        setErrorMessage('Ya existe un profesional activo con ese email');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error al validar:', err);
      return false;
    }
  };

  const guardarProfesional = async () => {
    if (!validarFormulario()) return;

    const { country_code, national_number } = parsePhoneE164(phoneValue);
    if (!country_code || !national_number) {
      setErrorMessage('El número de WhatsApp no es válido');
      return;
    }

    const datosParaEnviar = {
      documento: formData.documento,
      nombre: formData.nombre.toUpperCase(),
      email: formData.email,
      country_code: country_code,
      national_number: national_number,
      genero: formData.genero,
      matricula: formData.matricula || null,
      foto: formData.foto || null
    };

    setLoading(true);
    try {
      if (modo === 'add') {
        const esValido = await verificarExistente(datosParaEnviar.documento, datosParaEnviar.email);
        if (!esValido) return;
      }

      let res;
      if (modo === 'add') {
        res = await fetch(PROFESIONALES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
        });
      } else if (modo === 'edit' && profesional?.id) {
        res = await fetch(`${PROFESIONALES_URL}/${profesional.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosParaEnviar),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar profesional');
      }

      const profesionalCreado = await res.json();
      onSuccess(profesionalCreado);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar el profesional');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="tm-modal-titulo">
          {modo === 'add' ? 'Agregar Profesional' : 'Editar Profesional'}
        </h3>
        {errorMessage && <div className="tm-modal-error">{errorMessage}</div>}
        
        <div className="tm-modal-campo">
          <label className="tm-modal-label">Documento *</label>
          <input
            type="text"
            value={formData.documento}
            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
            placeholder="DNI / CUIT / CUIL"
            className="tm-modal-input"
            autoFocus
          />
        </div>

        <div className="tm-modal-campo">
          <label className="tm-modal-label">Nombre *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
            placeholder="Ej: DR. JUAN PÉREZ"
            className="tm-modal-input"
          />
        </div>

        <div className="tm-modal-campo">
          <label className="tm-modal-label">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ejemplo@mail.com"
            className="tm-modal-input"
          />
        </div>

        <div className="tm-modal-campo">
          <label className="tm-modal-label">Género *</label>
          <select
            value={formData.genero}
            onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
            className="tm-modal-input"
            required
          >
            <option value="">Seleccionar género...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="X">No Binario</option>
          </select>
        </div>

        <div className="tm-modal-campo">
          <label className="tm-modal-label">WhatsApp *</label>
          <PhoneInput
            international
            defaultCountry="AR"
            value={phoneValue}
            onChange={setPhoneValue}
            className="tm-phone-input"
            limitMaxLength={true}
          />
          <small className="tm-ayuda-texto">Seleccioná país e ingresá tu número</small>
        </div>

        <div className="tm-modal-campo">
          <label className="tm-modal-label">Matrícula</label>
          <input
            type="text"
            value={formData.matricula}
            onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
            placeholder="Opcional"
            className="tm-modal-input"
          />
        </div>

        <div className="tm-modal-campo">
          <label className="tm-modal-label">Foto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="tm-modal-input"
            disabled={uploading}
          />
          {uploading && <small className="tm-ayuda-texto">Subiendo imagen...</small>}
          {formData.foto && (
            <div className="mt-2">
              <img 
                src={formData.foto} 
                alt="Vista previa" 
                className="w-24 h-24 object-cover rounded-full border border-gray-300"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, foto: '' })}
                className="mt-1 text-sm text-red-600 hover:text-red-800"
              >
                🗑️ Quitar foto
              </button>
            </div>
          )}
        </div>

        <div className="tm-modal-acciones">
          <button onClick={onClose} className="tm-btn-secundario">Cancelar</button>
          <button onClick={guardarProfesional} className="tm-btn-primario" disabled={loading}>
            {loading ? 'Guardando...' : (modo === 'add' ? 'Agregar' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
}
