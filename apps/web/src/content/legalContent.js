import { SITE } from '../config/site'

const companyId = `${SITE.legalName} · RUC ${SITE.ruc}`

export const ORIGINAL_SERVICE_CONDITIONS_2023 = [
  '•El Cliente deberá revisar sus prendas en el establecimiento, por lo tanto una vez retirada las prendas NO SE ACEPTAN reclamos posteriores.',
  'Garantizamos un servicio de calidad, tratando con sumo cuidado sus prendas, con excepción de los sgtes. casos prendas que destiñan; botones y/o adornos que no resistan al lavado y planchado, prendas que se deterioren por estar demasiado usadas, o que tuviesen polillas y/o hongos ocultos que no han sido detectados a simple vista, ó tejidos y confecciones defectuosas, se rasguen o se descosan y/o las indicaciones de la etiqueta no sean correctas, o no cuenten con etiqueta de instrucciones, prendas que bajen de color en la primera lavada o que se decoloren debido a la mala calidad de los tintes usados por el fabricante, (o aglobamientos debido a la mala calidad de la película interna o la goma usada en el caso de sacos y casacas). prendas con manchas de guardado, manchas de óxido, manchas de lejía o deterioradas por almacenaje prolongado, prendas que ingresen con una o doble raya que no se borra con el lavado, prendas con aplicaciones de cuerina por ser un material que no resiste el proceso de lavado. Prendas que se encojan o se deterioren debido al contacto permanente con la luz solar o artificial, partículas de polvo o picadura de insectos: Las manchas existentes de humedad, perfumes, tintes de cabello, desodorante, etc., siendo que solo se eliminarán los problemas antes mencionados si el tipo o calidad de tela lo permite.',
  'El lavado de cortinas esta condicionado al estado en que se encuentren, ya que, por su prolongada exposición al sol, al tiempo y a las telas con las que han sido confeccionada, podría encogerse o deteriorarse de manera irreparable y es solo responsabilidad del cliente.',
  'No tenemos responsabilidad por objetos de valor, dinero documentos o cualquier cosa que sea los objetos olvidados y se deterioren o se pierdan en el proceso de lavado.',
  '•En caso de responsabilidad comprobada que impida el uso de la prenda, la empresa devolverá al cliente hasta un máximo de 3 veces el valor del servicio.',
  '*Las prendas dejadas en malla (ejem. al peso) solo incluye: lavado, secado y doblado, no planchado ni desmanchado, al no ser revisadas, ni contadas estas prendas, la empresa no podrá hacerse responsable por cualquier desperfecto o deterioro que pueda denunciar el cliente, siendo que las mismas prendas no son revisadas debido al tipo de servicio (al peso).',
  '•Solo podemos guardar sus prendas por un plazo máximo de 30 días, vencido dicho plazo, se cobrara un recargo aparte del importe total, que pago por el servicio debido a los gastos de almacenaje; si después de 6 meses no son recogidas las prendas por el cliente, LAVAFLASH  queda expresamente autorizado por el cliente a disponerlas libremente a favor de Instituciones de caridad, sin que nos imputen responsabilidad alguna.',
  '•El cliente paga por el servicio al momento de dejar alfombras y teñidos, en prendas 50%.',
  'El cliente debe indicar si las prendas presentan algún tipo de manchas como sangre, orina, maquillaje, tinta, etc. Estas indicaciones serán registradas en la orden de trabajo.',
  '•Por el solo uso y pago del servicio el cliente acepta los términos de las presentes condiciones',
  '* Las prendas solo podrán ser entregadas a la persona que porte el respectivo comprobante de pago (boleta o factura) y/u Orden de Trabajo. En ese sentido, de ocurrir la perdida de dicho comprobante, el cliente deberá comunicarlo inmediatamente, ello a fin de habilitar el recojo con la presentación del DNI del cliente. La empresa no se podrá hacer responsable por el uso del comprobante de pago de una tercera persona.'
]

export const legalCopy = {
  terms: {
    title: 'CONDICIONES GENERALES',
    subtitle: `Texto original · Condiciones de Servicio LAVA FLASH 2023 · ${companyId}`,
    official: true,
    sections: [
      {
        heading: 'Texto original del documento 2023',
        items: ORIGINAL_SERVICE_CONDITIONS_2023
      },
      {
        heading: 'Cierre del documento original',
        items: ['GRACIAS POR SU COMPRENSION', 'LA ADMINISTRACION']
      }
    ]
  },
  privacy: {
    title: 'Aviso de privacidad del portal',
    subtitle: `Aviso operativo del portal · ${companyId}`,
    official: false,
    sections: [
      { heading: 'Importante', items: ['Este aviso describe cómo funciona actualmente el portal web. No sustituye ni se presenta como una Política de Privacidad original de LAVA FLASH, porque todavía no se ha proporcionado un documento empresarial original con ese contenido.'] },
      { heading: 'Responsable', items: [`El responsable del tratamiento realizado mediante este portal es ${SITE.legalName}, RUC ${SITE.ruc}. Domicilio: ${SITE.address}. Correo: ${SITE.email}. Teléfono: ${SITE.phone}.`] },
      { heading: 'Datos que puede solicitar el portal', items: ['Datos de identificación y contacto: nombres y apellidos, DNI o RUC, teléfono, correo electrónico, domicilio y referencias de recojo.', 'Datos del servicio: pedidos, prendas o servicios solicitados, dirección y horario de recojo, cupones, estado del pedido, forma de pago preferida, reclamos y comunicaciones relacionadas con la atención.', 'El portal no solicita contraseñas bancarias ni números completos de tarjetas para realizar pagos.'] },
      { heading: 'Finalidades', items: ['Registrar y administrar la relación con el cliente; gestionar pedidos, recojos y entregas; identificar al titular; atender consultas y reclamos; dar seguimiento al servicio; emitir o coordinar comprobantes cuando corresponda; y comunicar información directamente relacionada con el servicio solicitado.'] },
      { heading: 'Almacenamiento actual del portal', items: ['La versión actual del portal utiliza almacenamiento local del navegador para determinadas funciones de cuenta, pedidos y preferencias. Los datos operativos del panel administrativo también se almacenan localmente mientras no se conecte la base de datos central.', 'Cuando se implemente almacenamiento central en la nube, este aviso deberá actualizarse para reflejar el funcionamiento real del sistema.'] },
      { heading: 'Servicios externos', items: ['Google Maps solo se carga dentro del portal cuando el usuario acepta funciones externas. Los enlaces a WhatsApp y Google Maps llevan a servicios de terceros sujetos a sus propias políticas.'] },
      { heading: 'Contacto', items: [`Las consultas relacionadas con datos personales pueden enviarse a ${SITE.email}, comunicarse al ${SITE.phone} o presentarse en ${SITE.address}.`] }
    ]
  },
  data: {
    title: 'Aviso sobre tratamiento de datos del portal',
    subtitle: `Información operativa del portal · ${companyId}`,
    official: false,
    sections: [
      { heading: 'Importante', items: ['Este aviso explica el tratamiento previsto dentro de la versión actual del portal. No se presenta como un documento original de LAVA FLASH mientras la empresa no proporcione su política o documento formal de tratamiento de datos.'] },
      { heading: 'Identificación del responsable', items: [`${SITE.legalName} · RUC ${SITE.ruc} · ${SITE.address} · ${SITE.email} · ${SITE.phone}.`] },
      { heading: 'Uso de los datos en el portal', items: ['Los datos solicitados se utilizan para registrar cuentas, gestionar servicios, recojos, entregas, seguimiento, atención, reclamos y comunicaciones relacionadas con el servicio.'] },
      { heading: 'Canales de contacto', items: [`Correo: ${SITE.email}. Teléfono: ${SITE.phone}. Atención presencial: ${SITE.address}.`] },
      { heading: 'Almacenamiento actual', items: ['Mientras no se conecte la base de datos central, determinados datos del portal y del panel administrativo permanecen en el navegador del dispositivo donde se utilizan.'] }
    ]
  },
  cookies: {
    title: 'Aviso de cookies y almacenamiento local',
    subtitle: `Funcionamiento actual del portal · ${companyId}`,
    official: false,
    sections: [
      { heading: 'Importante', items: ['Este aviso describe las tecnologías usadas por la versión actual del portal. No se presenta como una Política de Cookies original de LAVA FLASH mientras no exista un documento empresarial original proporcionado para publicación.'] },
      { heading: 'Qué usa actualmente este portal', items: ['El portal no incorpora cookies publicitarias ni analítica comportamental en esta versión.', 'Se utiliza almacenamiento local del navegador para recordar sesión, pedidos, preferencias y la elección sobre funciones externas. El acceso administrativo de producción puede utilizar una cookie de sesión necesaria y segura.'] },
      { heading: 'Funciones externas opcionales', items: ['Google Maps se carga dentro de la página únicamente cuando el usuario acepta funciones externas. Si elige “Solo necesarias”, puede abrir la ubicación mediante un enlace externo sin cargar el mapa embebido.'] },
      { heading: 'Cómo cambiar la elección', items: ['La preferencia puede revisarse desde el enlace “Cookies” del pie de página. También puede eliminarse desde la configuración del navegador.'] },
      { heading: 'Contacto', items: [`Para consultas sobre privacidad o tecnologías del portal: ${SITE.email} · ${SITE.phone}.`] }
    ]
  }
}
