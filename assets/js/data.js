// Medesthetique — capa de datos de la maqueta.
// Sin backend: todo vive en localStorage y lo comparten el sitio, el mapa facial 3D y el panel.
// Fuentes: medesthetique.com.ec (sedes, horarios, médicos, precios) e Instagram @medesthetique_.

const KEY = 'medesthetique.demo';
const VERSION = 4;

/* ---------- Negocio ---------- */

export const DEFAULT_SETTINGS = {
  nombre: 'Medesthetique',
  lema: 'Logramos tu mejor versión',
  fundadora: 'Dra. Estefanía Bustamante',
  whatsapp: '593967338950',
  whatsappDisplay: '096 733 8950',
  email: 'info@medesthetique.com.ec',
  instagram: 'medesthetique_',
  tiktok: 'medesthetique_',
  desde: 2014,
  slotMin: 30,
  cabinas: 2,
  escultura: 'david',
  campana: {
    activa: true,
    titulo: 'Esta Navidad, regala Medesthetique',
    texto: 'Gift cards para tratamientos o por monto. Se entregan en un sobre de la clínica o por WhatsApp.',
    cta: 'Crear una gift card',
    href: '#regalo',
  },
};

export const DEFAULT_SEDES = [
  { id: 'samborondon', nombre: 'Samborondón', activa: true,
    direccion: 'Samborondón Business Center, Torre B, local LB 06, planta baja, al lado del Teatro Sánchez Aguilar',
    mapa: 'Samborondón Business Center Torre B, Samborondón',
    horario: { lv: ['09:00', '20:00'], sab: ['09:00', '14:00'] } },
  { id: 'ceibos', nombre: 'Ceibos', activa: true,
    direccion: 'Av. Leopoldo Carrera, Mz. 62, Solar 1, Edificio Olivos Tower, piso 3, oficina 302',
    mapa: 'Olivos Tower, Av. Leopoldo Carrera, Guayaquil',
    horario: { lv: ['09:00', '20:00'], sab: ['09:00', '14:00'] } },
  { id: 'manta', nombre: 'Manta', activa: false,
    direccion: 'Av. M2 entre calles 23 y 24, Edificio Manta Business Center, piso 13, oficina 1304',
    mapa: 'Manta Business Center, Manta',
    horario: { lv: ['09:00', '20:00'], sab: ['09:00', '14:00'] } },
];

export const DEFAULT_DOCTORES = [
  { id: 'estefania', nombre: 'Dra. Estefanía Bustamante Kittyle', corto: 'Dra. Estefanía', iniciales: 'EB',
    rol: 'Fundadora · Armonización facial · Longevidad',
    bio: 'Fundó Medesthetique. Se formó en Argentina, Colombia, Italia, España y Corea. Su sello: rejuvenecimiento facial natural y protocolos personalizados.',
    instagram: 'draestefaniabustamante', activo: true },
  { id: 'karla', nombre: 'Dra. Karla Domínguez Rojas', corto: 'Dra. Karla', iniciales: 'KD',
    rol: 'Médica del equipo Medesthetique',
    bio: 'Atiende valoraciones y tratamientos faciales y corporales con los protocolos de la clínica.', activo: true },
  { id: 'gary', nombre: 'Dr. Gary Pallares C.', corto: 'Dr. Gary', iniciales: 'GP',
    rol: 'Médico del equipo Medesthetique',
    bio: 'Atiende valoraciones y tratamientos con los protocolos de la clínica.', activo: true },
];

export const CATEGORIES = [
  { id: 'facial', nombre: 'Facial' },
  { id: 'tecnologia', nombre: 'Tecnología y láser' },
  { id: 'corporal', nombre: 'Corporal' },
  { id: 'funcional', nombre: 'Medicina funcional' },
  { id: 'intimo', nombre: 'Rejuvenecimiento íntimo' },
];

/* ---------- Tratamientos ----------
   precio: el publicado en medesthetique.com.ec/tienda (null = se define en la valoración).
   dur: minutos aproximados de la sesión. control/retoque: días para el seguimiento del panel. */

const t = (id, cat, nombre, precio, desc, extra = {}) => ({ id, cat, nombre, precio, desc, activo: true, ...extra });

const DEFAULT_TRATAMIENTOS = [
  t('valoracion', 'facial', 'Valoración médica', null,
    'El primer paso de todo protocolo: tu médico revisa tu piel, tu estructura y tus antecedentes, y te explica qué puede ayudarte y qué no.',
    { dur: 30, recup: 'Sin incapacidad', destacado: true, siempre: true }),
  t('toxina', 'facial', 'Toxina botulínica', 320,
    'Relaja los músculos que marcan las líneas de expresión y evita que se queden fijas. También para bruxismo, sudoración excesiva y sonrisa gingival.',
    { dur: 20, recup: 'Sin incapacidad', efecto: 'Dura alrededor de 4 meses', control: 15, retoque: 120,
      zonas: ['frente', 'entrecejo', 'patas-gallo', 'menton', 'cuello'], destacado: true, alias: 'Botox' }),
  t('hialuronico', 'facial', 'Ácido hialurónico', 450,
    'Devuelve estructura, hidratación y proporción sin cambiar tus facciones: labios, surcos, pómulos, mentón, mandíbula, ojeras y rinomodelación.',
    { dur: 45, recup: 'Puede haber leve inflamación 24 a 48 h', efecto: 'Dura de 9 a 18 meses según la zona', control: 15, retoque: 365,
      zonas: ['labios', 'surcos', 'pomulos', 'menton', 'mandibula', 'ojeras', 'nariz'], destacado: true }),
  t('bioestimuladores', 'facial', 'Bioestimuladores de colágeno', 500,
    'Estimulan tu propio colágeno para recuperar firmeza, soporte y calidad de piel de forma progresiva.',
    { dur: 45, sesiones: '2 a 3 sesiones', recup: 'Sin incapacidad', retoque: 45, zonas: ['pomulos', 'mandibula', 'cuello', 'surcos'], destacado: true }),
  t('bioremodeladores', 'facial', 'Bioremodeladores y skinboosters', 500,
    'Hidratación profunda y elasticidad donde las cremas no llegan. Piel más luminosa y con mejor textura.',
    { dur: 40, sesiones: '2 sesiones', recup: 'Pequeñas pápulas que desaparecen en horas', retoque: 30, zonas: ['pomulos', 'ojeras', 'cuello'] }),
  t('hilos', 'facial', 'Hilos tensores', 160,
    'Reposicionan y sostienen los tejidos de mejillas, mandíbula y cuello.',
    { dur: 50, recup: 'Leve sensibilidad unos días', zonas: ['mandibula', 'pomulos', 'cuello'] }),
  t('meso-facial', 'facial', 'Mesoterapia facial', 150,
    'Vitaminas, antioxidantes y activos aplicados en la piel para darle brillo e hidratación.',
    { dur: 40, sesiones: '3 a 4 sesiones', recup: 'Sin incapacidad', zonas: ['pomulos', 'frente'] }),
  t('enzimas-facial', 'facial', 'Enzimas liofilizadas (facial)', 250,
    'Ayudan a reducir grasa localizada en papada y contorno.',
    { dur: 30, sesiones: '2 a 3 sesiones', recup: 'Inflamación leve 48 h', zonas: ['papada', 'mandibula'] }),
  t('prp', 'facial', 'Plasma rico en plaquetas', 160,
    'Usa factores de tu propia sangre para mejorar la calidad de la piel y la zona de ojeras.',
    { dur: 45, sesiones: '3 sesiones', recup: 'Sin incapacidad', zonas: ['ojeras', 'pomulos'] }),
  t('limpieza', 'facial', 'Limpieza facial profunda', 70,
    'Protocolo según tu tipo de piel, artesanal o con SilkPeel. Deja la piel lista para que cualquier tratamiento funcione mejor.',
    { dur: 60, recup: 'Sin incapacidad', zonas: ['nariz', 'frente'] }),
  t('peeling', 'facial', 'Peelings e hidrataciones', 60,
    'Renuevan la superficie de la piel para unificar el tono y mejorar la textura.',
    { dur: 40, recup: 'Descamación leve según el peeling', zonas: ['frente', 'pomulos'] }),
  t('rf-facial', 'facial', 'Radiofrecuencia facial', 80,
    'Calor controlado que estimula el colágeno y mejora la firmeza.',
    { dur: 40, sesiones: '4 a 6 sesiones', recup: 'Sin incapacidad', zonas: ['mandibula', 'cuello'] }),

  t('liftera', 'tecnologia', 'Liftera (HIFU)', null,
    'Ultrasonido focalizado que tensa, redefine el contorno y estimula colágeno. Sin agujas, sin morados y sin incapacidad.',
    { dur: 60, recup: 'Sigues tu día normal', tech: 'liftera', zonas: ['mandibula', 'papada', 'cuello', 'pomulos'], destacado: true }),
  t('alteon', 'tecnologia', 'Alteon', null,
    'Láser y radiofrecuencia avanzada para reafirmar y dar un efecto tensor progresivo. Sin agujas ni downtime.',
    { dur: 45, recup: 'Sin incapacidad', tech: 'alteon', zonas: ['mandibula', 'papada', 'pomulos'] }),
  t('ultraclear', 'tecnologia', 'Ultraclear', null,
    'Láser para manchas, poros visibles, textura irregular y cicatrices de acné. Medesthetique es la única clínica de Ecuador que lo tiene.',
    { dur: 45, recup: 'Según el protocolo', tech: 'ultraclear', zonas: ['pomulos', 'frente', 'nariz'], destacado: true }),
  t('red-touch', 'tecnologia', 'Red Touch Pro', null,
    'Láser que estimula colágeno en profundidad respetando la superficie de la piel.',
    { dur: 40, recup: 'Enrojecimiento leve', tech: 'redtouch', zonas: ['patas-gallo', 'pomulos', 'cuello'] }),
  t('laser', 'tecnologia', 'Láser facial', 200,
    'Sesión de láser indicada en tu valoración: manchas, rejuvenecimiento, cicatrices o vasos.',
    { dur: 40, recup: 'Según el láser', zonas: ['pomulos', 'frente'] }),
  t('soprano', 'tecnologia', 'Depilación láser Soprano Titanium', null,
    'Depilación más cómoda y rápida, apta para distintos tipos de piel. Menos irritación y vellos encarnados.',
    { dur: 30, sesiones: '6 a 8 sesiones', recup: 'Sin incapacidad', tech: 'soprano', retoque: 35 }),

  t('rf-medica', 'corporal', 'Radiofrecuencia médica corporal', 600,
    'Reafirma la piel del cuerpo y mejora la flacidez en abdomen, brazos y piernas.',
    { dur: 50, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
  t('tonificacion', 'corporal', 'Tonificación muscular', 80,
    'El trabajo de miles de abdominales en 30 minutos. Para abdomen, glúteos, piernas y brazos.',
    { dur: 30, sesiones: 'Plan de 6 a 8 sesiones', recup: 'Sin incapacidad' }),
  t('alydia', 'corporal', 'Alydia para celulitis', null,
    'Tecnología médica que trata fibrosis, piel de naranja, flacidez y retención de líquidos.',
    { dur: 45, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad', tech: 'alydia' }),
  t('hidrolipoclasia', 'corporal', 'Hidrolipoclasia', 120,
    'Ayuda a reducir grasa localizada combinando infiltración y ultrasonido.',
    { dur: 45, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
  t('meso-corporal', 'corporal', 'Mesoterapia corporal', 100,
    'Activos aplicados en zonas específicas para grasa localizada y celulitis.',
    { dur: 30, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
  t('enzimas-corporal', 'corporal', 'Enzimas liofilizadas (corporal)', 250,
    'Para grasa localizada y fibrosis en abdomen, flancos y brazos.',
    { dur: 30, sesiones: '2 a 3 sesiones', recup: 'Inflamación leve 48 h' }),
  t('carboxiterapia', 'corporal', 'Carboxiterapia', 320,
    'Dióxido de carbono medicinal que mejora la circulación y la apariencia de la piel.',
    { dur: 30, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
  t('ondas-choque', 'corporal', 'Ondas de choque', 80,
    'Mejoran la textura de la piel con celulitis y fibrosis.',
    { dur: 30, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
  t('presoterapia', 'corporal', 'Presoterapia', 250,
    'Drenaje por presión para retención de líquidos y piernas cansadas.',
    { dur: 40, sesiones: 'Paquete de sesiones', recup: 'Sin incapacidad' }),
  t('sauna', 'corporal', 'Sauna infrarrojo', 60,
    'Calor infrarrojo para relajar, desinflamar y complementar tus tratamientos corporales.',
    { dur: 30, recup: 'Sin incapacidad' }),

  t('sueroterapia', 'funcional', 'Sueroterapia', 30,
    'Hidratación, vitaminas y antioxidantes por vía intravenosa, indicada tras la valoración.',
    { dur: 45, recup: 'Sin incapacidad' }),
  t('vacunas', 'funcional', 'Vacunas pro juventud', 200,
    'Protocolo antioxidante y regenerativo como parte de un plan de longevidad.',
    { dur: 30, recup: 'Sin incapacidad' }),
  t('peptidos', 'funcional', 'Péptidos y control de peso', null,
    'Péptidos como GHK-Cu y tratamientos para bajar de peso, siempre con un plan que cuide tu piel durante el proceso.',
    { dur: 40, recup: 'Seguimiento médico', destacado: true }),
  t('chip', 'funcional', 'Chip de rejuvenecimiento', 400,
    'Implante subdérmico indicado después de la valoración médica y los exámenes previos.',
    { dur: 30, recup: 'Cuidados de la zona por unos días' }),
  t('terapia-neural', 'funcional', 'Terapia neural', null,
    'Busca regular el sistema nervioso y acompañar distintas condiciones de salud cuando está bien indicada.',
    { dur: 40, recup: 'Sin incapacidad' }),

  t('tensado-vaginal', 'intimo', 'Tensado vaginal', 500,
    'Recupera firmeza y bienestar en la zona íntima con tecnología no quirúrgica.',
    { dur: 30, recup: 'Indicaciones según el protocolo' }),
  t('incontinencia', 'intimo', 'Incontinencia urinaria', 400,
    'Para quienes cruzan las piernas cada vez que estornudan: tratamiento sin cirugía.',
    { dur: 30, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
  t('piso-pelvico', 'intimo', 'Fortalecimiento de piso pélvico', 500,
    'Tonifica la musculatura del piso pélvico.',
    { dur: 30, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
  t('despigmentacion', 'intimo', 'Despigmentación íntima', 80,
    'Unifica el tono de la piel en zonas íntimas.',
    { dur: 30, sesiones: 'Plan por sesiones', recup: 'Sin incapacidad' }),
];

/* ---------- Tecnología (Instagram @medesthetique_) ---------- */

export const TECH = [
  { id: 'ultraclear', nombre: 'Ultraclear', tipo: 'Láser de fibra', claim: 'Únicos en Ecuador',
    texto: 'Manchas, poros visibles, textura irregular y cicatrices de acné, con protocolos que se ajustan a cada piel.', tags: ['Manchas', 'Poros', 'Acné'] },
  { id: 'liftera', nombre: 'Liftera', tipo: 'Ultrasonido focalizado (HIFU)', claim: 'Sin agujas',
    texto: 'Tensa, redefine el contorno y estimula colágeno sin morados ni incapacidad. Vuelves a tu día normal.', tags: ['Flacidez', 'Contorno', 'Papada'] },
  { id: 'alteon', nombre: 'Alteon', tipo: 'Láser + radiofrecuencia', claim: 'Sin downtime',
    texto: 'Reafirma, estimula colágeno y da un efecto tensor progresivo, sin dolor ni cirugía.', tags: ['Firmeza', 'Tensado'] },
  { id: 'soprano', nombre: 'Soprano Titanium', tipo: 'Depilación láser', claim: 'Más cómoda',
    texto: 'Disminución progresiva del vello, piel más suave y menos foliculitis, en distintos tipos de piel.', tags: ['Depilación'] },
  { id: 'alydia', nombre: 'Alydia', tipo: 'Tecnología corporal', claim: 'Trata la causa',
    texto: 'Actúa sobre fibrosis, piel de naranja, flacidez y retención de líquidos.', tags: ['Celulitis', 'Fibrosis'] },
  { id: 'redtouch', nombre: 'Red Touch Pro', tipo: 'Láser de colágeno', claim: 'Colágeno profundo',
    texto: 'Estimula colágeno en profundidad respetando la superficie de la piel.', tags: ['Rejuvenecimiento'] },
  { id: 'tonificacion', nombre: 'Tonificación muscular', tipo: 'Estimulación electromagnética', claim: '30 minutos',
    texto: 'El trabajo de miles de contracciones en una sesión para abdomen, glúteos, piernas y brazos.', tags: ['Abdomen', 'Glúteos'] },
];

/* ---------- Zonas del rostro para el mapa 3D ---------- */

export const ZONES = [
  { id: 'frente', nombre: 'Frente', preocupaciones: [
    { id: 'lineas-frente', texto: 'Líneas al levantar las cejas', tratamientos: ['toxina'] },
    { id: 'textura-frente', texto: 'Manchas o piel opaca', tratamientos: ['ultraclear', 'peeling'] },
  ] },
  { id: 'entrecejo', nombre: 'Entrecejo', preocupaciones: [
    { id: 'ceno', texto: 'Ceño marcado: te ves molesta aunque no lo estés', tratamientos: ['toxina'] },
  ] },
  { id: 'patas-gallo', nombre: 'Patas de gallo', preocupaciones: [
    { id: 'patas', texto: 'Líneas al sonreír', tratamientos: ['toxina'] },
    { id: 'piel-fina-ojo', texto: 'Piel fina alrededor de los ojos', tratamientos: ['red-touch', 'bioremodeladores'] },
  ] },
  { id: 'ojeras', nombre: 'Ojeras', preocupaciones: [
    { id: 'ojera-hundida', texto: 'Ojeras hundidas', tratamientos: ['hialuronico', 'prp'] },
    { id: 'mirada-cansada', texto: 'Mirada cansada aunque duermas bien', tratamientos: ['bioremodeladores', 'prp'] },
  ] },
  { id: 'pomulos', nombre: 'Pómulos', preocupaciones: [
    { id: 'soporte', texto: 'Pómulos que ya no sostienen igual', tratamientos: ['hialuronico', 'bioestimuladores'] },
    { id: 'manchas', texto: 'Manchas, poros o cicatrices de acné', tratamientos: ['ultraclear', 'laser'] },
  ] },
  { id: 'nariz', nombre: 'Nariz', preocupaciones: [
    { id: 'rinomodelacion', texto: 'Armonizar dorso o punta sin cirugía', tratamientos: ['hialuronico'], nota: 'Rinomodelación' },
    { id: 'poros-nariz', texto: 'Puntos negros y poros', tratamientos: ['limpieza'] },
  ] },
  { id: 'surcos', nombre: 'Surcos nasogenianos', preocupaciones: [
    { id: 'surcos-marcados', texto: 'Surcos marcados junto a la nariz', tratamientos: ['hialuronico', 'bioestimuladores'],
      nota: 'Antes de rellenar el surco evaluamos el pómulo: muchas veces la causa está ahí.' },
  ] },
  { id: 'labios', nombre: 'Labios', preocupaciones: [
    { id: 'definicion-labios', texto: 'Menos definición o hidratación', tratamientos: ['hialuronico'] },
    { id: 'codigo-barras', texto: 'Líneas sobre el labio superior', tratamientos: ['toxina', 'bioremodeladores'] },
  ] },
  { id: 'menton', nombre: 'Mentón', preocupaciones: [
    { id: 'proyeccion', texto: 'Mentón con poca proyección', tratamientos: ['hialuronico'],
      nota: 'Un mentón bien proyectado también define el cuello y disimula la papada.' },
    { id: 'celulitis-menton', texto: 'Piel de naranja en el mentón', tratamientos: ['toxina'] },
  ] },
  { id: 'mandibula', nombre: 'Mandíbula y contorno', preocupaciones: [
    { id: 'contorno', texto: 'Contorno sin definición', tratamientos: ['liftera', 'alteon', 'hialuronico', 'hilos'] },
    { id: 'bruxismo', texto: 'Aprietas los dientes (bruxismo)', tratamientos: ['toxina'] },
  ] },
  { id: 'papada', nombre: 'Papada', preocupaciones: [
    { id: 'papada-grasa', texto: 'Papada que se marca en las fotos', tratamientos: ['enzimas-facial', 'liftera'],
      nota: 'No toda papada es grasa: puede ser flacidez o falta de proyección del mentón.' },
  ] },
  { id: 'cuello', nombre: 'Cuello', preocupaciones: [
    { id: 'cuello-flacidez', texto: 'Flacidez o líneas en el cuello', tratamientos: ['liftera', 'bioestimuladores', 'red-touch'] },
    { id: 'bandas', texto: 'Bandas verticales al tensar el cuello', tratamientos: ['toxina'] },
  ] },
];

/* ---------- Tu piel por etapas (carrusel "Tu piel cambia con los años") ---------- */

export const ETAPAS = [
  { id: '20', nombre: '20+', colageno: 96, titulo: 'Prevenir y tratar lo que aparece',
    texto: 'Es la década de crear hábitos: protector solar todos los días, limpieza profesional y tratar a tiempo el acné y sus marcas.',
    tratamientos: ['limpieza', 'peeling', 'ultraclear'] },
  { id: '30', nombre: '30+', colageno: 86, titulo: 'Que las líneas no se queden',
    texto: 'Las primeras líneas aparecen al gesticular. Tratarlas a tiempo evita que se marquen en reposo; la piel agradece hidratación profunda.',
    tratamientos: ['toxina', 'bioremodeladores', 'red-touch'] },
  { id: '40', nombre: '40+', colageno: 76, titulo: 'Tres básicos que hacen la diferencia',
    texto: 'El colágeno disminuye y la regeneración es más lenta. Liftera para levantar, bioestimuladores para recuperar colágeno y toxina para que las arrugas no se fijen.',
    tratamientos: ['liftera', 'bioestimuladores', 'toxina'] },
  { id: '50', nombre: '50+', colageno: 66, titulo: 'Soporte, calidad de piel y cuello',
    texto: 'Se trata de devolver estructura sin exagerar: soporte con ácido hialurónico, colágeno con bioestimuladores, láser para manchas y cuidar el cuello.',
    tratamientos: ['hialuronico', 'bioestimuladores', 'ultraclear'] },
];

export const MITOS = [
  { q: '¿Si dejo de ponerme toxina botulínica me voy a ver peor?',
    a: 'No. Cuando pasa su efecto, el músculo vuelve a moverse como antes y las líneas regresan de a poco. Tu rostro no empeora: solo deja de estar tratado.' },
  { q: '¿Cuánto dura la toxina botulínica?',
    a: 'Alrededor de 4 meses. La aplicación toma unos 20 minutos y el efecto no es inmediato: se ve a lo largo de los primeros días. A los 15 días tienes tu cita de control.' },
  { q: '¿El ácido hialurónico deja la cara hinchada?',
    a: 'Bien indicado, no se nota. No se trata de rellenar sino de devolver lo que se ha perdido respetando tu cara. Los resultados exagerados vienen de una mala indicación.' },
  { q: '¿La depilación láser elimina el vello en una sesión?',
    a: 'No. El vello crece por ciclos, por eso se necesitan varias sesiones. Con Soprano Titanium el procedimiento es más cómodo y no tienes que dejar crecer el vello antes de tu cita.' },
  { q: '¿Puedo tomar omega 3, vitamina E o ginkgo antes de un inyectable?',
    a: 'Cuéntaselo a tu médico en la valoración. Algunos suplementos aumentan la probabilidad de hematomas, así que es probable que te pida suspenderlos unos días antes.' },
  { q: '¿Por qué no me dan el precio exacto por mensaje?',
    a: 'Porque depende de lo que necesites. En la valoración tu médico define el tratamiento, la dosis y el número de sesiones; así pagas por lo que de verdad te ayuda.' },
];

export const TESTIMONIOS = [
  { quien: 'Juanma Castillo', handle: 'juanmacastilloo', url: 'https://www.instagram.com/juanmacastilloo/reel/DcMX1zMKIQg/',
    texto: 'Viajó a Ecuador para hacerse una rinomodelación y láser Retouch con la Dra. Estefanía. Buscaba un cambio sutil y natural.', tratamiento: 'Rinomodelación + láser' },
  { quien: 'Karla Pérez', handle: 'karla_perez_oficial', url: 'https://www.instagram.com/karla_perez_oficial/reel/DZvPKkTJdLC/',
    texto: 'Para ella, ir a Medesthetique es amor propio: elegir lo mejor para sí misma se nota en su confianza.', tratamiento: 'Paciente' },
  { quien: 'María José Flores', handle: 'proesthetic.oficial', url: 'https://www.instagram.com/proesthetic.oficial/reel/DZdqrR1Neaq/',
    texto: 'Antes de viajar a cubrir el Mundial preparó su piel con bioestimulación para llegar luminosa a cámaras y largas jornadas.', tratamiento: 'Bioestimulación' },
];

export const ESTADOS = [
  { id: 'pendiente', nombre: 'Por confirmar' },
  { id: 'confirmada', nombre: 'Confirmada' },
  { id: 'atendida', nombre: 'Atendida' },
  { id: 'no-asistio', nombre: 'No asistió' },
  { id: 'cancelada', nombre: 'Cancelada' },
];

export const ORIGENES = { web: 'Sitio web', mapa: 'Mapa facial 3D', whatsapp: 'WhatsApp', instagram: 'Instagram', recepcion: 'Recepción' };

/* ---------- Utilidades ---------- */

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => (n == null ? 'En valoración' : '$' + Number(n).toLocaleString('es-EC', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }));
export const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const fmtDate = (s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  (s ? (typeof s === 'string' ? parseISO(s.slice(0, 10)) : s).toLocaleDateString('es-EC', opts) : '');
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- Datos de demostración (ficticios) relativos a hoy ---------- */

const NOMBRES = [
  'Andrea Villacís', 'María Fernanda Ortiz', 'Daniela Moreira', 'Gabriela Rendón', 'Carolina Andrade', 'Valentina Cedeño',
  'Paula Zambrano', 'Ana Lucía Vera', 'Isabel Mendoza', 'Camila Torres', 'Sofía Arteaga', 'Mónica Salazar', 'Lorena Pazmiño',
  'Verónica Chiriboga', 'Juan Carlos Rivas', 'Andrés Molina', 'Diego Alvarado', 'Fernanda Coello', 'Patricia Icaza', 'Ricardo Peña',
  'Natalia Game', 'Cristina Baquerizo',
];
const ALERTAS = ['Toma omega 3', 'Alergia a la lidocaína', 'Embarazo descartado', 'Hipertensión controlada', 'Toma anticoagulantes'];

function seedDemo() {
  const r = rng(20261112);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const hoy = today();
  const pacientes = NOMBRES.map((nombre, i) => ({
    id: 'p' + (i + 1), nombre,
    telefono: '09' + (6 + Math.floor(r() * 4)) + String(Math.floor(1000000 + r() * 8999999)),
    sede: r() < 0.55 ? 'samborondon' : 'ceibos',
    nacimiento: `${1972 + Math.floor(r() * 30)}-${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 27))}`,
    alertas: r() < 0.3 ? [pick(ALERTAS)] : [],
    consentimiento: r() < 0.85,
    historial: [],
    notas: '',
  }));

  // Historial de tratamientos de los últimos 8 meses (alimenta el seguimiento).
  const frecuentes = ['toxina', 'toxina', 'toxina', 'hialuronico', 'bioestimuladores', 'liftera', 'ultraclear', 'limpieza', 'bioremodeladores', 'tonificacion', 'soprano', 'peptidos'];
  const zonasDe = { toxina: [['frente', 'entrecejo', 'patas-gallo'], ['entrecejo'], ['frente', 'entrecejo']], hialuronico: [['labios'], ['menton'], ['surcos', 'pomulos'], ['nariz']],
    bioestimuladores: [['pomulos', 'mandibula']], liftera: [['mandibula', 'papada']], ultraclear: [['pomulos', 'frente']], bioremodeladores: [['pomulos', 'cuello']] };
  const detalleDe = { toxina: ['20 U', '24 U', '36 U'], hialuronico: ['1 ml', '1 ml', '2 ml'], bioestimuladores: ['1 vial'], liftera: ['Sesión completa'], ultraclear: ['Protocolo manchas'] };
  pacientes.forEach((p, i) => {
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const tr = k === 0 && i % 5 === 0 ? 'toxina' : k === 0 && i % 7 === 0 ? pick(['toxina', 'hialuronico']) : pick(frecuentes);
      // Algunos casos caen justo en ventana de control o retoque para que el panel tenga trabajo.
      const dias = i % 5 === 0 && k === 0 ? 118 + Math.floor(r() * 20) : i % 7 === 0 && k === 0 ? 13 + Math.floor(r() * 3) : 20 + Math.floor(r() * 220);
      p.historial.push({
        fecha: iso(addDays(hoy, -dias)), tratamiento: tr,
        zonas: zonasDe[tr] ? pick(zonasDe[tr]) : [],
        detalle: detalleDe[tr] ? pick(detalleDe[tr]) : '',
        doctor: r() < 0.55 ? 'estefania' : pick(['karla', 'gary']),
      });
    }
    p.historial.sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  // Citas: pasadas (atendidas o no) y próximas dos semanas.
  const citas = [];
  let seq = 1040;
  const horas = [];
  for (let m = 9 * 60; m <= 19 * 60; m += 30) horas.push(toHHMM(m));
  const tratamientosCita = ['valoracion', 'valoracion', 'toxina', 'hialuronico', 'liftera', 'ultraclear', 'bioestimuladores', 'limpieza', 'tonificacion', 'soprano', 'peptidos', 'alteon'];
  const origenes = ['whatsapp', 'whatsapp', 'whatsapp', 'instagram', 'instagram', 'recepcion', 'web', 'web', 'mapa'];
  // Quienes están en ventana de control o retoque no tienen cita futura: así el seguimiento tiene trabajo.
  const sinSeguimiento = pacientes.filter((_, i) => i % 5 !== 0 && i % 7 !== 0);
  for (let d = -45; d <= 14; d++) {
    const fecha = addDays(hoy, d);
    if (fecha.getDay() === 0) continue;
    const cuantas = fecha.getDay() === 6 ? 2 + Math.floor(r() * 3) : 3 + Math.floor(r() * 5);
    for (let k = 0; k < cuantas; k++) {
      const p = d >= 0 ? pick(sinSeguimiento) : pick(pacientes);
      let hora = pick(horas);
      if (fecha.getDay() === 6 && toMin(hora) > 13 * 60) hora = toHHMM(9 * 60 + Math.floor(r() * 9) * 30);
      const tr = pick(tratamientosCita);
      let estado;
      if (d < 0) estado = r() < 0.86 ? 'atendida' : r() < 0.6 ? 'no-asistio' : 'cancelada';
      else if (d === 0) estado = r() < 0.7 ? 'confirmada' : 'pendiente';
      else estado = r() < 0.55 ? 'confirmada' : 'pendiente';
      const origen = pick(origenes);
      citas.push({
        id: 'c' + seq, codigo: 'MED-' + seq++, pacienteId: p.id, nombre: p.nombre, telefono: p.telefono,
        sede: p.sede, doctor: r() < 0.5 ? 'estefania' : pick(['karla', 'gary']),
        fecha: iso(fecha), hora, tratamientos: [tr], estado, origen,
        primeraVez: tr === 'valoracion' && r() < 0.6,
        plan: origen === 'mapa' ? { zonas: ['mandibula', 'papada'], preocupaciones: ['contorno', 'papada-grasa'] } : null,
        nota: '', creada: addDays(fecha, -1 - Math.floor(r() * 6)).toISOString(),
      });
    }
  }

  const giftcards = [
    { id: 'g1', codigo: 'GIFT-7Q2M', tipo: 'monto', monto: 150, tratamiento: null, de: 'Daniel', para: 'Mamá', mensaje: 'Para que te consientas este diciembre.', telefono: '0991234567', estado: 'pagada', creada: addDays(hoy, -6).toISOString() },
    { id: 'g2', codigo: 'GIFT-K8PZ', tipo: 'tratamiento', monto: 70, tratamiento: 'limpieza', de: 'Equipo Ventas', para: 'Lucía', mensaje: '¡Feliz cumpleaños!', telefono: '0987654321', estado: 'por-pagar', creada: addDays(hoy, -2).toISOString() },
    { id: 'g3', codigo: 'GIFT-3RTA', tipo: 'tratamiento', monto: 320, tratamiento: 'toxina', de: 'Andrés', para: 'Carolina', mensaje: 'Te amo tal como eres, pero sé cuánto lo querías.', telefono: '0961112233', estado: 'canjeada', creada: addDays(hoy, -40).toISOString() },
  ];

  return { pacientes, citas, giftcards, seq };
}

function freshState() {
  const demo = seedDemo();
  return {
    v: VERSION,
    settings: structuredClone(DEFAULT_SETTINGS),
    sedes: structuredClone(DEFAULT_SEDES),
    doctores: structuredClone(DEFAULT_DOCTORES),
    tratamientos: structuredClone(DEFAULT_TRATAMIENTOS),
    contactados: {},
    ...demo,
  };
}

/* ---------- Estado ---------- */

let state;
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === VERSION) return s;
    }
  } catch { /* almacenamiento no disponible: se usa el estado en memoria */ }
  return freshState();
}

export function getState() {
  if (!state) { state = load(); persist(false); }
  return state;
}

function persist(notify = true) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento */ }
  if (notify) subs.forEach((fn) => fn(state));
}

export function update(fn) { fn(getState()); persist(); }
export function onChange(fn) { subs.add(fn); return () => subs.delete(fn); }
export function resetDemo() { state = freshState(); persist(); }

window.addEventListener('storage', (e) => {
  if (e.key !== KEY || !e.newValue) return;
  try { const s = JSON.parse(e.newValue); if (s.v === VERSION) { state = s; subs.forEach((fn) => fn(state)); } } catch { /* ignorar */ }
});

/* ---------- Consultas ---------- */

export const tratamiento = (id) => getState().tratamientos.find((x) => x.id === id);
export const sede = (id) => getState().sedes.find((x) => x.id === id);
export const doctor = (id) => getState().doctores.find((x) => x.id === id);
export const zone = (id) => ZONES.find((z) => z.id === id);
export const activeSedes = () => getState().sedes.filter((s) => s.activa);
export const activeTratamientos = () => getState().tratamientos.filter((x) => x.activo);

export function whatsappLink(text) {
  return `https://wa.me/${getState().settings.whatsapp}?text=${encodeURIComponent(text)}`;
}

// Horarios disponibles de una sede en una fecha (YYYY-MM-DD).
export function slotsFor(sedeId, fecha, ignoreId = null) {
  const s = getState();
  const se = sede(sedeId);
  if (!se) return [];
  const d = parseISO(fecha);
  const dow = d.getDay();
  if (dow === 0) return [];
  const [ini, fin] = dow === 6 ? se.horario.sab : se.horario.lv;
  const step = s.settings.slotMin;
  const ahora = new Date();
  const esHoy = iso(ahora) === fecha;
  const out = [];
  for (let m = toMin(ini); m + step <= toMin(fin); m += step) {
    const hora = toHHMM(m);
    const ocupadas = s.citas.filter((c) => c.id !== ignoreId && c.sede === sedeId && c.fecha === fecha && c.hora === hora && c.estado !== 'cancelada').length;
    const pasada = esHoy && m <= ahora.getHours() * 60 + ahora.getMinutes() + 60;
    out.push({ hora, libre: ocupadas < s.settings.cabinas && !pasada });
  }
  return out;
}

export function nextCode() {
  const s = getState();
  s.seq = (s.seq || 1000) + 1;
  return s.seq;
}

// Crea la cita y, si el teléfono no existe, la ficha del paciente.
export function addCita(data) {
  let cita;
  update((s) => {
    const tel = (data.telefono || '').replace(/\D/g, '');
    let p = s.pacientes.find((x) => x.telefono.replace(/\D/g, '') === tel && tel);
    if (!p) {
      p = { id: 'p' + Date.now().toString(36), nombre: data.nombre, telefono: data.telefono, sede: data.sede, nacimiento: '', alertas: [], consentimiento: false, historial: [], notas: '' };
      s.pacientes.push(p);
    }
    s.seq = (s.seq || 1000) + 1;
    cita = {
      id: 'c' + s.seq, codigo: 'MED-' + s.seq, pacienteId: p.id, nombre: data.nombre, telefono: data.telefono,
      sede: data.sede, doctor: data.doctor || '', fecha: data.fecha, hora: data.hora,
      tratamientos: data.tratamientos?.length ? data.tratamientos : ['valoracion'],
      estado: 'pendiente', origen: data.origen || 'web', primeraVez: !!data.primeraVez,
      plan: data.plan || null, nota: data.nota || '', creada: new Date().toISOString(),
    };
    s.citas.push(cita);
  });
  return cita;
}

export function addGift(data) {
  let g;
  update((s) => {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GIFT-';
    for (let i = 0; i < 4; i++) code += abc[Math.floor(Math.random() * abc.length)];
    g = { id: 'g' + Date.now().toString(36), codigo: code, estado: 'por-pagar', creada: new Date().toISOString(), ...data };
    s.giftcards.unshift(g);
  });
  return g;
}

// Seguimiento: controles y retoques que tocan según el historial de cada paciente.
export function seguimiento() {
  const s = getState();
  const hoy = iso(today());
  const out = [];
  for (const p of s.pacientes) {
    const vistos = new Set();
    for (const h of p.historial) {
      if (vistos.has(h.tratamiento)) continue;
      vistos.add(h.tratamiento);
      const tr = tratamiento(h.tratamiento);
      if (!tr) continue;
      const dias = daysBetween(h.fecha, hoy);
      const proxima = s.citas.some((c) => c.pacienteId === p.id && c.fecha >= hoy && c.estado !== 'cancelada');
      const key = `${p.id}:${h.tratamiento}:${h.fecha}`;
      if (tr.control && dias >= tr.control - 2 && dias <= tr.control + 6) {
        out.push({ key, tipo: 'control', paciente: p, h, tr, dias, proxima, contactado: s.contactados[key] || null });
      } else if (tr.retoque && dias >= tr.retoque - 7 && dias <= tr.retoque + 45) {
        out.push({ key, tipo: 'retoque', paciente: p, h, tr, dias, proxima, contactado: s.contactados[key] || null });
      }
    }
  }
  return out.sort((a, b) => (a.contactado ? 1 : 0) - (b.contactado ? 1 : 0) || b.dias - a.dias);
}

export function mensajeSeguimiento(item) {
  const nombre = item.paciente.nombre.split(' ')[0];
  const doc = doctor(item.h.doctor)?.corto || 'tu médico';
  if (item.tipo === 'control') {
    return `Hola ${nombre} 🤍 Te escribimos de Medesthetique. Ya pasaron ${item.dias} días desde tu ${item.tr.nombre.toLowerCase()}: es momento de tu cita de control con ${doc} para revisar el resultado. ¿Qué día te queda mejor?`;
  }
  return `Hola ${nombre} 🤍 Te escribimos de Medesthetique. Tu ${item.tr.nombre.toLowerCase()} fue el ${fmtDate(item.h.fecha, { day: 'numeric', month: 'long' })}; por esta fecha suele tocar la siguiente sesión para mantener el resultado. ¿Te agendamos con ${doc}?`;
}
