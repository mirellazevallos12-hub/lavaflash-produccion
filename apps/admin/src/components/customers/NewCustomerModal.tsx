import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Customer, ClientCategory, DocumentType } from '../../types';
import { 
  User, Building2, CheckCircle2, AlertCircle,
  Phone, Mail, MapPin, FileText, X, ShieldCheck, Gift, Check
} from 'lucide-react';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSaved?: (customer: Customer) => void;
  initialDoc?: string;
  initialType?: ClientCategory;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerSaved,
  initialDoc = '',
  initialType = 'NATURAL'
}) => {
  // Step 1: Client Type
  const [clientType, setClientType] = useState<ClientCategory>(initialType);

  // Step 2: Identificación. La consulta externa no se simula.
  const [documentNumber, setDocumentNumber] = useState(initialDoc);
  const [searchError, setSearchError] = useState('');

  // Persona Natural fields
  const [firstName, setFirstName] = useState('');
  const [paternalLastName, setPaternalLastName] = useState('');
  const [maternalLastName, setMaternalLastName] = useState('');

  // Empresa fields
  const [businessName, setBusinessName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [fiscalAddress, setFiscalAddress] = useState('');
  const [taxStatus, setTaxStatus] = useState('ACTIVO - HABIDO');

  // Step 3: Contact & Additional info
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [observations, setObservations] = useState('');

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      if (initialDoc) {
        setDocumentNumber(initialDoc);
        const inferredType: ClientCategory = initialDoc.trim().length === 11 ? 'EMPRESA' : 'NATURAL';
        setClientType(inferredType);
        setSearchError('');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialDoc]);

  const resetForm = () => {
    setClientType('NATURAL');
    setDocumentNumber('');
    setSearchError('');
    setFirstName('');
    setPaternalLastName('');
    setMaternalLastName('');
    setBusinessName('');
    setTradeName('');
    setFiscalAddress('');
    setTaxStatus('ACTIVO - HABIDO');
    setPhone('');
    setEmail('');
    setAddress('');
    setObservations('');
  };

  const handleTypeChange = (newType: ClientCategory) => {
    setClientType(newType);
    setSearchError('');
    // If switching type, adjust document number length if needed
    if (newType === 'NATURAL' && documentNumber.length > 8) {
      setDocumentNumber(documentNumber.slice(0, 8));
    }
  };

  // Step 4: Guardar cliente / empresa
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDoc = documentNumber.replace(/\D/g, '').trim();
    const expectedLength = clientType === 'NATURAL' ? 8 : 11;

    if (cleanDoc.length !== expectedLength) {
      setSearchError(`Número de ${clientType === 'NATURAL' ? 'DNI' : 'RUC'} no válido.`);
      return;
    }

    let computedFullName = '';
    if (clientType === 'NATURAL') {
      if (!firstName.trim() || !paternalLastName.trim()) {
        setSearchError('Por favor complete el nombre y apellido paterno.');
        return;
      }
      computedFullName = `${firstName.trim()} ${paternalLastName.trim()} ${maternalLastName.trim()}`.trim();
    } else {
      if (!businessName.trim()) {
        setSearchError('Por favor ingrese la Razón Social de la empresa.');
        return;
      }
      computedFullName = businessName.trim();
    }

    if (!phone.trim()) {
      setSearchError('Por favor ingrese un número de teléfono o WhatsApp para notificaciones.');
      return;
    }

    const docType: DocumentType = clientType === 'NATURAL' ? 'DNI' : 'RUC';

    const saved = db.saveCustomer({
      clientType,
      documentType: docType,
      documentNumber: cleanDoc,
      fullName: computedFullName,
      firstName: clientType === 'NATURAL' ? firstName.trim() : undefined,
      paternalLastName: clientType === 'NATURAL' ? paternalLastName.trim() : undefined,
      maternalLastName: clientType === 'NATURAL' ? maternalLastName.trim() : undefined,
      businessName: clientType === 'EMPRESA' ? businessName.trim() : undefined,
      tradeName: clientType === 'EMPRESA' ? tradeName.trim() : undefined,
      fiscalAddress: clientType === 'EMPRESA' ? fiscalAddress.trim() : undefined,
      taxStatus: clientType === 'EMPRESA' ? taxStatus : undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || (clientType === 'EMPRESA' ? fiscalAddress : undefined),
      observations: observations.trim() || undefined
    });

    if (onCustomerSaved) {
      onCustomerSaved(saved);
    }

    onClose();
  };

  if (!isOpen) return null;

  const currentDisplayName = clientType === 'NATURAL'
    ? `${firstName} ${paternalLastName} ${maternalLastName}`.trim() || 'Nombre del Cliente'
    : businessName || 'Razón Social de la Empresa';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/25">
              {clientType === 'NATURAL' ? (
                <User className="w-6 h-6 text-slate-950" />
              ) : (
                <Building2 className="w-6 h-6 text-slate-950" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Registro de Nuevo Cliente</h2>
                <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                  Lavaflash CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro real de clientes. DNI/RUC y datos del titular se ingresan manualmente hasta conectar una consulta oficial.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Form Steps (7 cols) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
            
            {/* ================= STEP 1: TIPO DE CLIENTE ================= */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black inline-flex items-center justify-center">1</span>
                  Seleccionar Tipo de Cliente
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Requerido</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: Persona Natural */}
                <button
                  type="button"
                  onClick={() => handleTypeChange('NATURAL')}
                  className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-start gap-3 relative ${
                    clientType === 'NATURAL'
                      ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    clientType === 'NATURAL' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Persona Natural</span>
                    <span className="text-[11px] text-slate-500 font-semibold block">DNI (8 dígitos)</span>
                  </div>
                  {clientType === 'NATURAL' && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option 2: Empresa */}
                <button
                  type="button"
                  onClick={() => handleTypeChange('EMPRESA')}
                  className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-start gap-3 relative ${
                    clientType === 'EMPRESA'
                      ? 'border-teal-500 bg-teal-50/70 shadow-sm ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    clientType === 'EMPRESA' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Empresa</span>
                    <span className="text-[11px] text-slate-500 font-semibold block">RUC (11 dígitos)</span>
                  </div>
                  {clientType === 'EMPRESA' && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* ================= STEP 2: DOCUMENTO ================= */}
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black inline-flex items-center justify-center">2</span>
                  Ingresar {clientType === 'NATURAL' ? 'DNI' : 'RUC'}
                </label>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {clientType === 'NATURAL' ? '8 Dígitos Numéricos' : '11 Dígitos (10... ó 20...)'}
                </span>
              </div>

              {/* Documento */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={clientType === 'NATURAL' ? 8 : 11}
                    value={documentNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setDocumentNumber(val);
                      setSearchError('');
                    }}
                    placeholder={clientType === 'NATURAL' ? '8 dígitos' : '11 dígitos'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all tracking-wider"
                    required
                  />
                  {documentNumber && (
                    <span className="absolute right-3 top-3 text-[11px] font-mono text-slate-400">
                      {documentNumber.length}/{clientType === 'NATURAL' ? 8 : 11}
                    </span>
                  )}
                </div>
              </div>

              {/* Validación */}
              {searchError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Datos del cliente */}
              {clientType === 'NATURAL' ? (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Nombre:
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej. Juan"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Apellido Paterno:
                      </label>
                      <input
                        type="text"
                        value={paternalLastName}
                        onChange={(e) => setPaternalLastName(e.target.value)}
                        placeholder="Ej. Pérez"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Apellido Materno:
                      </label>
                      <input
                        type="text"
                        value={maternalLastName}
                        onChange={(e) => setMaternalLastName(e.target.value)}
                        placeholder="Ej. López"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Datos de empresa */
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Razón Social:
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Razón social de la empresa"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Nombre Comercial (si corresponde):
                    </label>
                    <input
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      placeholder="Nombre comercial"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Dirección fiscal:
                    </label>
                    <input
                      type="text"
                      value={fiscalAddress}
                      onChange={(e) => setFiscalAddress(e.target.value)}
                      placeholder="Dirección fiscal de la empresa"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ================= STEP 3: COMPLETAR INFORMACIÓN DE CONTACTO ================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black inline-flex items-center justify-center">3</span>
                  Completar Información de Contacto
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    Teléfono / Celular WhatsApp:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="999 888 777"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Para avisos automáticos de recojo de ropa</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Correo Electrónico (Opcional):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 block">Para envío de boletas y facturas electrónicas</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  Dirección de Entrega / Domicilio:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle / Av. Número, Dpto, Distrito..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Observaciones / Notas Especiales:
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  placeholder="Ej. Alérgico a suavizantes perfumados, prendas al seco siempre en percha..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* ================= STEP 4: BOTÓN DE GUARDADO ================= */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-600/25 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                <span>
                  {clientType === 'NATURAL' ? 'Guardar cliente' : 'Guardar empresa'}
                </span>
              </button>
            </div>

          </form>

          {/* RIGHT COLUMN: Live Card Preview & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                Previsualización de Tarjeta de Cliente:
              </span>

              {/* CARD PREVIEW */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-5 rounded-3xl shadow-xl border border-teal-500/30 relative overflow-hidden space-y-4">
                {/* Brand watermarks */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 block">
                      LAVAFLASH LAVANDERÍA
                    </span>
                    <span className="text-[10px] text-slate-400">Tarjeta de Afiliación &amp; Fidelización</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    clientType === 'NATURAL' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {clientType === 'NATURAL' ? 'Persona Natural' : 'Empresa / RUC'}
                  </span>
                </div>

                {/* Display Name */}
                <div className="pt-2">
                  <h3 className="text-base font-black leading-tight text-white line-clamp-2">
                    {currentDisplayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs font-mono text-teal-200">
                    <span>{clientType === 'NATURAL' ? 'DNI' : 'RUC'}: {documentNumber || '—'}</span>
                  </div>
                </div>

                {/* Contact info snippets */}
                <div className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-white/10 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-teal-400" />
                    <span>{phone || 'Teléfono no registrado'}</span>
                  </div>
                  {address && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 truncate">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">{address}</span>
                    </div>
                  )}
                </div>

                {/* Loyalty stamps preview */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center text-[10px] mb-1.5 text-slate-300">
                    <span className="font-bold flex items-center gap-1 text-amber-300">
                      <Gift className="w-3 h-3 text-amber-400" />
                      Sellos de Fidelización (10° Servicio = S/ 15 OFF)
                    </span>
                    <span className="font-mono font-bold text-teal-300">0 / 10</span>
                  </div>

                  {/* 10 Stamps preview circles */}
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`aspect-square rounded-md border flex items-center justify-center text-[8px] font-bold ${
                          idx === 9
                            ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                            : 'border-white/10 bg-white/5 text-white/30'
                        }`}
                      >
                        {idx === 9 ? 'S/15' : idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Estado de almacenamiento */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl text-[11px] text-teal-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <p>
                Al guardar, el cliente queda disponible en este navegador para recepciones, comprobantes y entregas. La sincronización entre varias computadoras se habilitará al conectar la base de datos central.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
