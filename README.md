# Medesthetique: maqueta web

Maqueta funcional para Medesthetique (medicina estética, Samborondón y Ceibos, Guayaquil). Incluye un sitio público con esculturas clásicas en 3D (David, Venus de Milo y Afrodita, intercambiables), un mapa facial 3D interactivo con plan sugerido y simulación de antes y después, una agenda en línea y un panel para la clínica. Todo en estilo glassmorphism, con tema claro y oscuro.

## Demo en línea

- Sitio: https://aurelioochoa.github.io/medesthetique/
- Mapa facial 3D: https://aurelioochoa.github.io/medesthetique/mapa.html
- Panel de la clínica: https://aurelioochoa.github.io/medesthetique/admin.html (acceso de demostración)

Los cambios hechos en el panel de la demo solo se guardan en el navegador de quien lo usa: no afectan lo que ven los demás.

No tiene backend. Todo corre en el navegador y los datos se guardan en `localStorage`, por eso funciona tal cual en GitHub Pages.

## Qué incluye

| Página | Qué hace |
| --- | --- |
| `index.html` | Sitio público. Portada con una escultura clásica en 3D que sigue al puntero, con etiquetas de tratamientos ancladas al rostro y un selector para cambiar entre David, Venus de Milo y Afrodita. Le sigue el recorrido "Tu rostro, zona por zona": al hacer scroll la cámara pasa por frente, pómulos, labios, mentón, cuello y calidad de piel, y la piel pasa de "antes" a "después". Después vienen el catálogo de 33 tratamientos con buscador, "Tu piel por etapas" (20, 30, 40, 50+), tecnología (Ultraclear, Liftera, Alteon, Soprano, Alydia…), la sección "¿Precio o seguridad?", el equipo médico, testimonios, mitos y verdades, gift cards con tarjeta 3D, sedes y el cajón para agendar. |
| `mapa.html` | Mapa facial 3D. Se gira el rostro y se toca una de las 12 zonas. Para cada zona se marca lo que molesta (por ejemplo "surcos marcados") y se ven los tratamientos que pueden ayudar, con su precio de referencia. Se arma un plan, se mueve el control "Antes / Después" (simulación ilustrativa: líneas, manchas y flacidez) y se agenda la valoración con ese plan o se envía por WhatsApp. |
| `admin.html` | Panel de la clínica. Resumen con indicadores y citas por día y sede. Agenda por sede y horario (confirmar, asignar médico, marcar atendida). Pacientes con ficha clínica, alertas, consentimiento, historial y un rostro 3D que muestra las zonas tratadas. Seguimiento automático de controles (15 días) y retoques (toxina a los 4 meses) con el mensaje de WhatsApp ya escrito. Además: tratamientos y precios, gift cards y ajustes (campaña, sedes, horarios, contacto y equipo). |

Las tres páginas tienen **tema claro y oscuro**: el botón de la luna cambia el tema y se recuerda en el navegador; la primera vez sigue al sistema. El diseño es **glassmorphism**: un fondo de luz en azul polvo, nude y azul marino, y encima tarjetas, paneles, cajones y menús de vidrio esmerilado (`assets/css/glass.css`).

El sitio y el panel comparten el mismo estado:

- Un precio cambiado, un tratamiento apagado o una campaña editada en el panel se ve al instante en la web.
- Una cita agendada en la web o en el mapa 3D aparece en la agenda del panel, con el plan de zonas incluido.
- Una cita marcada como atendida registra sus tratamientos en la ficha y entra al seguimiento.

## Verlo en local

Necesita un servidor estático porque usa módulos ES:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

El acceso al panel es de demostración: basta con pulsar "Entrar al panel". En **Ajustes → Restablecer la maqueta** se vuelve al estado inicial.

## Estructura

```
index.html · mapa.html · admin.html
assets/
  css/     base.css (marca, componentes y tokens del tema oscuro), site.css, mapa.css, admin.css,
           glass.css (capa de glassmorphism, se carga al final)
  js/
    data.js       negocio, tratamientos, zonas, estado en localStorage, agenda y seguimiento
    face3d.js     motor 3D (Three.js): esculturas, piel, zonas, cámara y simulación
    ui.js         cabecera, tema, escultura elegida, avisos y cajón para agendar
    site.js       sitio público y escenas 3D
    mapa.js       mapa facial 3D
    admin.js      panel de la clínica
  models/         david.bin (+ david-normal.jpg), venus.bin, afrodita.bin: mallas listas para la web
  img/            favicon
tools/build-esculturas.mjs   convierte los escaneos originales en las mallas de assets/models
vendor/three/   Three.js 0.170 (MIT)
docs/investigacion.md  investigación del negocio, fuentes y supuestos
docs/propuesta.md      argumentos para presentar la maqueta al cliente
```

No hay que instalar dependencias. Las tipografías (Instrument Serif, Manrope y Quicksand) se cargan desde Google Fonts.

## Sobre las esculturas 3D

Son escaneos reales de obras clásicas con licencia libre:

| Escultura | Origen | Licencia |
| --- | --- | --- |
| David (cabeza) | "Head Of Michelangelo's David, Optimised", Thomas Flynn, a partir del escaneo del yeso de 1899 del SMK – National Gallery of Denmark | CC BY 4.0: hay que dar crédito (el sitio lo muestra al pie y en el mapa) |
| Venus de Milo | "Venus de Milo (Aphrodite of Milos)", SMK – National Gallery of Denmark | CC0, dominio público |
| Afrodita | Copia romana de Praxíteles, The Usher Gallery, Lincoln; escaneo de Oliver Laric (threedscans.com) | Sin copyright declarado; se pide dar crédito |

`tools/build-esculturas.mjs` orienta cada escaneo, recorta la cabeza, la alinea a un marco común (altura de los ojos, punta de la nariz y mentón), la simplifica con meshoptimizer, recalcula normales y hornea la oclusión ambiental por vértice. Gracias a ese marco común, las 12 zonas del rostro, las vistas de cámara y la capa de piel sirven para las tres. En el navegador, un shader agrega las líneas de expresión, las manchas, la flacidez (un leve descenso de mejillas, mandíbula y papada) y el brillo de las zonas.

La escultura por defecto se elige en **Ajustes** del panel. Quien visita el sitio puede cambiarla con el selector, y su elección se recuerda en su navegador.

Para regenerar las mallas hacen falta los originales, que no se guardan en el repo: `david.glb` y `venus.glb` (espejo en Objaverse, Hugging Face) y `aphrodite.stl` (threedscans.com). También hace falta el paquete `meshoptimizer`:

```bash
node tools/build-esculturas.mjs --src <carpeta con los originales> --meshopt <ruta a meshoptimizer/meshopt_simplifier.module.js>
```

Con movimiento reducido activado en el sistema, o sin WebGL, el recorrido se muestra como una lista y el mapa funciona con la lista de zonas.

## Datos reales y supuestos

Sedes, horarios, médicos, WhatsApp, correo y los 28 precios salen de su web, medesthetique.com.ec. La tecnología, el tono y el contenido educativo salen de su Instagram.

Son supuestos de la maqueta: duraciones y sesiones (salvo la toxina, 20 minutos y unos 4 meses), las 2 cabinas por sede y todos los pacientes, citas y gift cards del panel, que son ficticios. La sede de Manta está apagada por defecto porque ya no aparece en su Instagram. El detalle está en [docs/investigacion.md](docs/investigacion.md).

## Para pasar a producción

1. **Backend** (Supabase o Firebase): citas, pacientes, historial e inicio de sesión del personal, con permisos por rol. Reemplaza a `data.js`. Una ficha clínica real exige cifrado y control de acceso.
2. **WhatsApp Business API** para enviar las confirmaciones y los recordatorios de seguimiento sin abrir el chat a mano.
3. Logotipo oficial, fotos del equipo y de las sedes, y especialidades de cada médico.
4. Elegir la escultura definitiva. El David tiene el mejor detalle, pero Italia ha demandado usos comerciales de su imagen; la Venus (CC0) y la Afrodita no tienen ese riesgo.
5. Confirmar con la clínica los precios (por sesión, zona o vial), las duraciones y si la sede de Manta sigue abierta.
