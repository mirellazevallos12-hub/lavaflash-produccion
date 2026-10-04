import React from 'react';
import { Order } from '../../types';
import { Printer, X, CheckCircle2, Clock, Phone, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BUSINESS } from '../../config/business';

interface OrderReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`;

  // Tax and IGV calculation
  const hasIgv = order.applyIgv !== false && (order.igvAmount !== undefined ? order.igvAmount > 0 : true);
  const taxableBase = order.taxableBase !== undefined
    ? order.taxableBase
    : (hasIgv ? Number((order.total / 1.18).toFixed(2)) : order.total);
  const igvAmount = order.igvAmount !== undefined
    ? order.igvAmount
    : (hasIgv ? Number((order.total - taxableBase).toFixed(2)) : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-400" />
            <span className="font-semibold text-sm">Comprobante de Recepción</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Ticket
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formato de impresión para ticket de 80 mm */}
        <div className="p-6 overflow-y-auto font-sans text-xs text-slate-800 bg-white space-y-4 print:p-0 print:m-0 print:text-black">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <h2 className="text-base font-black tracking-wider uppercase text-slate-900">{BUSINESS.tradeName}</h2>
            <p className="text-[11px] text-slate-600">LAVADO AL SECO, AL PESO &amp; TINTORERÍA</p>
            <p className="text-[10px] text-slate-500">{BUSINESS.legalName}</p><p className="text-[10px] text-slate-500">RUC: {BUSINESS.ruc} | {BUSINESS.addressShort}</p>
            <p className="text-[10px] text-slate-500">WhatsApp / Tel: {BUSINESS.phoneCompact}</p><p className="text-[10px] text-slate-500">{BUSINESS.email}</p>
            
            <div className="mt-2 inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded text-center">
              <span className="font-bold text-[13px] block text-slate-900">{order.voucherType.replace('_', ' ')}</span>
              <span className="text-[11px] font-semibold text-slate-700">{order.voucherNumber}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">CÓDIGO INTERNO: <span className="font-bold">{order.code}</span></p>
            <p className="text-[9px] text-slate-400 mt-1">Documento interno de recepción. No sustituye el comprobante electrónico tributario cuando corresponda.</p>
          </div>

          {/* Dates & Times */}
          <div className="border-b border-dashed border-slate-300 pb-2 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Recepción:</span>
              <span className="font-semibold">{new Date(order.receivedAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between text-teal-900 font-black bg-teal-50 px-1 py-0.5 rounded">
              <span>Entrega Prometida:</span>
              <span className="font-black">{new Date(order.promisedDeliveryAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Atendido por:</span>
              <span>{order.createdBy}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-b border-dashed border-slate-300 pb-2 text-[11px] space-y-0.5">
            <div className="font-black text-slate-900 uppercase">{order.customerName}</div>
            <div className="flex justify-between text-slate-600">
              <span className="font-black text-slate-900">DOC: {order.customerDocument}</span>
              <span>TELF: {order.customerPhone}</span>
            </div>
            {order.isDeliveryToHome && order.deliveryAddress && (
              <div className="text-[10px] text-amber-800 bg-amber-50 p-1 rounded mt-1">
                <span className="font-semibold">ENTREGA A DOMICILIO:</span> {order.deliveryAddress}
              </div>
            )}
          </div>

          {/* Garments / Items Table */}
          <div className="border-b border-dashed border-slate-300 pb-3">
            <div className="text-[10px] uppercase font-bold text-slate-500 grid grid-cols-12 mb-1">
              <span className="col-span-2">CANT</span>
              <span className="col-span-7">DESCRIPCIÓN / SERVICIO</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div key={item.id || idx} className="text-[11px] grid grid-cols-12 items-start border-t border-slate-100 pt-1">
                  <span className="col-span-2 font-bold">{item.quantity} {item.category === 'AL_PESO' ? 'kg' : ''}</span>
                  <div className="col-span-7 pr-1">
                    <span className="font-semibold">{item.serviceName}</span>
                    {item.isDelivered && (
                      <span className="ml-1 text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                        (ENTREGADO)
                      </span>
                    )}
                    {(item.brand || item.color || item.itemCondition) && (
                      <div className="text-[10px] text-slate-700 mt-0.5 space-x-1.5 flex flex-wrap">
                        {item.brand && <span className="bg-slate-100 px-1 rounded font-medium">🏷️ {item.brand}</span>}
                        {item.color && <span className="bg-slate-100 px-1 rounded font-medium">🎨 {item.color}</span>}
                        {item.itemCondition && <span className="text-amber-800 italic">⚠️ {item.itemCondition}</span>}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-rose-600 italic">
                        Obs: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="col-span-3 text-right font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="border-b border-dashed border-slate-300 pb-2 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>{order.discountReason || 'Descuento Aplicado'}:</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Op. Gravada:</span>
              <span>{formatCurrency(taxableBase)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span>I.G.V. (18%):</span>
              <span>{formatCurrency(igvAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL A PAGAR:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Monto Abonado:</span>
              <span className="font-bold">{formatCurrency(order.totalPaid)}</span>
            </div>
            
            {/* Pending Balance Badge */}
            <div className={`flex justify-between items-center p-1.5 rounded font-bold ${
              order.pendingBalance <= 0 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <span>{order.pendingBalance <= 0 ? 'ESTADO:' : 'SALDO PENDIENTE A CANCELAR:'}</span>
              <span className="text-sm">
                {order.pendingBalance <= 0 ? 'PAGADO COMPLETO' : formatCurrency(order.pendingBalance)}
              </span>
            </div>
          </div>

          {/* Payments Record */}
          {order.payments.length > 0 && (
            <div className="border-b border-dashed border-slate-300 pb-2 text-[10px] text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">DETALLE DE ABONOS RECIBIDOS:</span>
              {order.payments.map((p, idx) => (
                <div key={p.id || idx} className="flex justify-between py-0.5">
                  <span>{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {p.paymentMethod} ({p.paymentType})</span>
                  <span className="font-semibold">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Partial Deliveries History if any */}
          {order.partialDeliveries && order.partialDeliveries.length > 0 && (
            <div className="border-b border-dashed border-slate-300 pb-2 text-[10px] bg-slate-50 p-2 rounded">
              <span className="font-bold text-slate-800 block mb-1 text-[11px]">HISTORIAL DE ENTREGAS PARCIALES:</span>
              {order.partialDeliveries.map((pd, i) => (
                <div key={pd.id || i} className="text-slate-600 border-t border-slate-200 pt-1 mt-1">
                  <div className="flex justify-between font-semibold">
                    <span>Entrega #{i + 1} ({new Date(pd.timestamp).toLocaleDateString('es-PE')})</span>
                    <span>Cobrado: {formatCurrency(pd.amountCharged)}</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Prendas: {pd.deliveredItems.map(di => di.serviceName).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Observations and Alerts */}
          {order.observations && (
            <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[10px] text-amber-900">
              <span className="font-bold block">OBSERVACIONES / ALERTA:</span>
              {order.observations}
            </div>
          )}

          {/* Condiciones Generales — texto original LAVA FLASH 2023 */}
          <div className="text-[8px] text-slate-500 text-justify leading-tight space-y-1 border-t border-dashed border-slate-300 pt-2">
            <p className="font-bold text-slate-700 text-center">CONDICIONES GENERALES · TEXTO ORIGINAL 2023</p>
            <p>•El Cliente deberá revisar sus prendas en el establecimiento, por lo tanto una vez retirada las prendas NO SE ACEPTAN reclamos posteriores.</p>
            <p>Garantizamos un servicio de calidad, tratando con sumo cuidado sus prendas, con excepción de los sgtes. casos prendas que destiñan; botones y/o adornos que no resistan al lavado y planchado, prendas que se deterioren por estar demasiado usadas, o que tuviesen polillas y/o hongos ocultos que no han sido detectados a simple vista, ó tejidos y confecciones defectuosas, se rasguen o se descosan y/o las indicaciones de la etiqueta no sean correctas, o no cuenten con etiqueta de instrucciones, prendas que bajen de color en la primera lavada o que se decoloren debido a la mala calidad de los tintes usados por el fabricante, (o aglobamientos debido a la mala calidad de la película interna o la goma usada en el caso de sacos y casacas). prendas con manchas de guardado, manchas de óxido, manchas de lejía o deterioradas por almacenaje prolongado, prendas que ingresen con una o doble raya que no se borra con el lavado, prendas con aplicaciones de cuerina por ser un material que no resiste el proceso de lavado. Prendas que se encojan o se deterioren debido al contacto permanente con la luz solar o artificial, partículas de polvo o picadura de insectos: Las manchas existentes de humedad, perfumes, tintes de cabello, desodorante, etc., siendo que solo se eliminarán los problemas antes mencionados si el tipo o calidad de tela lo permite.</p>
            <p>El lavado de cortinas esta condicionado al estado en que se encuentren, ya que, por su prolongada exposición al sol, al tiempo y a las telas con las que han sido confeccionada, podría encogerse o deteriorarse de manera irreparable y es solo responsabilidad del cliente.</p>
            <p>No tenemos responsabilidad por objetos de valor, dinero documentos o cualquier cosa que sea los objetos olvidados y se deterioren o se pierdan en el proceso de lavado.</p>
            <p>•En caso de responsabilidad comprobada que impida el uso de la prenda, la empresa devolverá al cliente hasta un máximo de 3 veces el valor del servicio.</p>
            <p>*Las prendas dejadas en malla (ejem. al peso) solo incluye: lavado, secado y doblado, no planchado ni desmanchado, al no ser revisadas, ni contadas estas prendas, la empresa no podrá hacerse responsable por cualquier desperfecto o deterioro que pueda denunciar el cliente, siendo que las mismas prendas no son revisadas debido al tipo de servicio (al peso).</p>
            <p>•Solo podemos guardar sus prendas por un plazo máximo de 30 días, vencido dicho plazo, se cobrara un recargo aparte del importe total, que pago por el servicio debido a los gastos de almacenaje; si después de 6 meses no son recogidas las prendas por el cliente, LAVAFLASH  queda expresamente autorizado por el cliente a disponerlas libremente a favor de Instituciones de caridad, sin que nos imputen responsabilidad alguna.</p>
            <p>•El cliente paga por el servicio al momento de dejar alfombras y teñidos, en prendas 50%.</p>
            <p>El cliente debe indicar si las prendas presentan algún tipo de manchas como sangre, orina, maquillaje, tinta, etc. Estas indicaciones serán registradas en la orden de trabajo.</p>
            <p>•Por el solo uso y pago del servicio el cliente acepta los términos de las presentes condiciones</p>
            <p>* Las prendas solo podrán ser entregadas a la persona que porte el respectivo comprobante de pago (boleta o factura) y/u Orden de Trabajo. En ese sentido, de ocurrir la perdida de dicho comprobante, el cliente deberá comunicarlo inmediatamente, ello a fin de habilitar el recojo con la presentación del DNI del cliente. La empresa no se podrá hacer responsable por el uso del comprobante de pago de una tercera persona.</p>
            <p className="font-semibold text-center">GRACIAS POR SU COMPRENSION · LA ADMINISTRACION</p>
          </div>

          {/* Código de pedido y agradecimiento */}
          <div className="text-center pt-2">
            <div className="inline-block border border-slate-300 rounded px-3 py-1.5 bg-slate-50">
              <span className="text-[9px] text-slate-500 block">CÓDIGO DE PEDIDO</span>
              <p className="text-[11px] tracking-wider font-bold">{order.code}</p>
            </div>
            <p className="text-[11px] font-bold text-slate-800 mt-2">¡Gracias por su preferencia!</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprobante
          </button>
        </div>
      </div>
    </div>
  );
};
