import React, { useState, useEffect } from 'react';
import { Customer, DocumentType, ClientCategory } from '../../types';
import { db } from '../../services/db';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Save, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onCustomerUpdated?: (updatedCustomer: Customer) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onCustomerUpdated,
}) => {
  const [fullName, setFullName] = useState('');
  const [clientType, setClientType] = useState<ClientCategory>('NATURAL');
  const [documentType, setDocumentType] = useState<DocumentType>('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [observations, setObservations] = useState('');
  
  // Specific company fields
  const [businessName, setBusinessName] = useState('');
  const [tradeName, setTradeName] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || '');
      setClientType(customer.clientType || (customer.documentType === 'RUC' ? 'EMPRESA' : 'NATURAL'));
      setDocumentType(customer.documentType || 'DNI');
      setDocumentNumber(customer.documentNumber || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setReference(customer.reference || '');
      setObservations(customer.observations || '');
      setBusinessName(customer.businessName || customer.fullName || '');
      setTradeName(customer.tradeName || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanDoc = documentNumber.trim();

    if (!cleanName) {
      setError('Por favor ingrese el nombre completo o razón social del cliente.');
      return;
    }

    if (!cleanPhone) {
      setError('El número de celular o teléfono es obligatorio para enviar notificaciones.');
      return;
    }

    // Validate phone length if digits
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 12) {
      setError('Por favor ingrese un número de celular válido (habitual de 9 dígitos en Perú).');
      return;
    }

    setIsSaving(true);

    try {
      const updates: Partial<Customer> = {
        fullName: cleanName,
        clientType,
        documentType,
        documentNumber: cleanDoc,
        phone: cleanPhone,
        email: email.trim(),
        address: address.trim(),
        reference: reference.trim(),
        observations: observations.trim(),
        businessName: clientType === 'EMPRESA' ? (businessName.trim() || cleanName) : undefined,
        tradeName: clientType === 'EMPRESA' ? tradeName.trim() : undefined,
      };

      const updated = db.updateCustomer(customer.id, updates);

      if (updated) {
        setSuccessMsg('¡Datos del cliente actualizados y guardados exitosamente!');
        if (onCustomerUpdated) {
          onCustomerUpdated(updated);
        }
        setTimeout(() => {
          setIsSaving(false);
          onClose();
        }, 800);
      } else {
        setError('No se pudo actualizar el cliente. Verifique los datos.');
        setIsSaving(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al guardar los cambios.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 py-4 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">Editar Datos del Cliente</h3>
                <span className="text-[10px] bg-teal-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  {customer.documentType}: {customer.documentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Modifique el número de celular, dirección o datos personales y guarde los cambios.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Notifications */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Type Selector (Persona Natural / Empresa) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setClientType('NATURAL');
                if (documentType === 'RUC') setDocumentType('DNI');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                clientType === 'NATURAL'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-200 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 text-teal-600" />
              <span>Persona Natural</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClientType('EMPRESA');
                setDocumentType('RUC');
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                clientType === 'EMPRESA'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-200 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Empresa / RUC (Factura)</span>
            </button>
          </div>

          {/* Full Name / Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {clientType === 'EMPRESA' ? 'Razón Social Oficial' : 'Nombres y Apellidos Completos'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={clientType === 'EMPRESA' ? 'Ej. INVERSIONES & SERVICIOS S.A.C.' : 'Ej. Roberto Silva Benavides'}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Document Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo Documento
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
              >
                <option value="DNI">DNI (8 dígitos)</option>
                <option value="RUC">RUC (11 dígitos)</option>
                <option value="CE">Carnet Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de Documento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Número de DNI / RUC"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* HIGHLIGHTED: PHONE / CELULAR (Key user request) */}
          <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-600" />
                <span>Número de Celular / Teléfono (WhatsApp)</span>
                <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                Para avisos y recordatorios
              </span>
            </div>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 992184711"
                className="w-full pl-9 pr-3 py-2.5 text-base bg-white border border-amber-400 font-mono font-bold text-slate-900 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-inner"
              />
              <Phone className="w-4 h-4 text-amber-600 absolute left-3 top-3.5" />
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              💡 Si el cliente cambió de número, modifíquelo aquí. Se sincronizará automáticamente para los recordatorios de recojo de prendas por WhatsApp y llamadas.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Electrónico (Opcional)
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Address & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dirección de Domicilio / Entrega
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Calle Las Begonias 780, San Isidro"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Referencia de Entrega
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej. Frente al parque / Piso 3 Dpto 302"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
              />
            </div>
          </div>

          {/* Observations & Washing Preferences */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Preferencias u Observaciones del Cliente
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ej. Prefiere poco almidón, alérgica a fragancias intensas, llamar siempre 15 min antes de llegar con el delivery..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Loyalty Summary Info */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-800 block">Historial de Fidelización:</span>
              <span>{customer.totalServicesCount} servicios acumulados • {customer.activeLoyaltyStamps}/10 sellos en tarjeta</span>
            </div>
            {customer.hasPendingVoucher && (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Vale S/ 15 Disponible
              </span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : '💾 Guardar y Actualizar Información'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
