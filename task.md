# 📌 MEMORIA OFICIAL DEL PROYECTO: HAEDO FUTSAL APP
**Última actualización:** 2 de Agosto de 2026

Este documento contiene la arquitectura del proyecto, la memoria técnica y la **directiva oficial del modo de trabajo**. **Consultar este archivo y `proyect_context.txt` al iniciar cualquier nueva sesión de chat.**

---

## 🤖 MODO DE TRABAJO OFICIAL: AGENTE ORQUESTADOR + ACCESOS FULL

- **Rol Principal de Antigravity (IA)**: **ORQUESTADOR, ARQUITECTO Y DESARROLLADOR FULL STACK**.
- **Servidor de IA Local**: Ollama / Qwen3 configurado en la red local:
  - **Endpoint Ollama**: `http://192.168.0.140:11434`
  - **Modelo Local**: `qwen3` / `qwen`
- **Flujo de Trabajo Exigido**:
  1. El **USUARIO** entrega un requerimiento o indicación.
  2. **ANTIGRAVITY** analiza los componentes, diseña la solución e implementa los cambios.
  3. **ANTIGRAVITY** compila y verifica que todo funcione sin errores (`npm run build`).
  4. **PUBLICACIÓN OBLIGATORIA EN GITHUB**: **SIEMPRE** hacer `git add .`, `git commit` y `git push` a GitHub al completar o modificar algo para que Vercel despliegue la versión actualizada automáticamente.
- **Acceso Total Concedido**: Antigravity tiene acceso full a **GitHub** (`WillyBit78/WebApp-HF`), **Vercel** y **Supabase** para modificar código, base de datos, deployments o configuraciones requeridas.

---

## 🔑 CREDENCIALES Y ACCESOS DEL PROYECTO

- **Supabase URL**: `https://jmfxxqbtmyzslkrslpvk.supabase.co`
- **Supabase DB Password**: `HaedoFutsal.2026`
- **Supabase Pooler (Postgres)**: `postgresql://postgres.jmfxxqbtmyzslkrslpvk:HaedoFutsal.2026@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`
- **Mercado Pago Token**: `APP_USR-3322444120483456-072316-c328d2ad7cb6de93a33a94812589756e-43153257`
- **VAPID Public Key**: `BNrO1BAPOhrooMRFovIRtRVXGwd9dxgT1ZWyzEVkPIauISEjh-EZl0MwUwaF1Wn7HJ1lOojM7CKt3he8jXvH-MQ`

---

## 📢 MEMORIA OFICIAL: MÓDULO DE COMUNICADOS Y AVISOS (`NoticeBoard.jsx` & `AppContext.jsx`)

- **Persistencia e Inserción Directa**:
  - `addNotice` ejecuta `await supabase.from('notices').insert(...)` arrojando excepciones explícitas si falla la conexión a la base de datos.
  - El modal reporta el estado exacto de dispositivos y notificaciones push enviadas.
- **Visualización Limpia de Avisos**:
  - Los avisos se muestran exclusivamente en la sección **Avisos** (`NoticeBoard.jsx`).
  - **REMOVIDO** el banner violeta/urgente de la pantalla principal de inicio del socio (`DashboardSocio.jsx`).
- **Formato del Emisor**:
  - El autor guarda y muestra únicamente el **nombre limpio** (ej: `"Guillermo"` o `"POL"`), removiendo cualquier sufijo de rol entre paréntesis.

---

## 🛍️ NAVEGACIÓN Y SECCIÓN TIENDA OFICIAL (`StoreModule.jsx`, `Sidebar.jsx`, `BottomNav.jsx`)

- **Sección Tienda Oficial**:
  - Ubicación en Celular: Botón **Tienda** (`ShoppingBag`) a la derecha de **Avisos** en la barra inferior.
  - Ubicación en PC: Ítem **Tienda Oficial** en el grupo General de la barra lateral fija.
  - Contenido: Muestra el banner explicativo *"Próximamente La Tienda oficial del Club"*.
- **Navegación Táctil (Swipe Eliminado)**:
  - **REMOVIDO EL SWIPE HORIZONTAL**: Se eliminó la navegación táctil horizontal por gestos para evitar inconvenientes en celulares y permitir un desplazamiento vertical fluido.
- **Barra Lateral Fija en PC (`Sidebar.jsx`)**:
  - La barra lateral permanece inmóvil (`sticky top-0 h-screen`) al hacer scroll vertical en el contenido del panel derecho.

---

## 📱 BANNER PWA/PUSH Y FICHA DE SOCIO (`PWAInstallBanner.jsx` & `ModalFichaSocio.jsx`)

- **Ocultamiento Automático del Banner de Instalación/Push**:
  - `PWAInstallBanner.jsx` detecta de forma nativa si la aplicación ya está instalada como PWA (`standaloneMode`) o si las notificaciones push ya fueron concedidas (`Notification.permission === 'granted'`).
  - En cualquiera de ambos casos, el banner flotante se oculta automáticamente.
- **Categoría/Disciplina Desplegable (Dropdown)**:
  - En `ModalFichaSocio.jsx`, la edición de Categoría/Disciplina se realiza mediante un elemento `<select>` con opciones estructuradas (Baby, Futsal Masculino, Femenino, Mayores, Dirigencia, Finanzas), evitando errores tipográficos.

---

## 1. 🗃️ ESQUEMA NATIVO Y PERSISTENCIA EN SUPABASE (`users`)

- **Campos Independientes y Nativos en Tabla `users`**:
  - `id`: Formato `usr-[DNI]` (ej: `"usr-26.248.272"`).
  - `dni`: Documento DNI limpio en su propia columna (`"26.248.272"`).
  - `telefono`: Teléfono de WhatsApp en su propia columna (`"11 6740-9620"`).
  - `nombre`: Nombre capitalizado (ej: `"Guillermo"`).
  - `apellido`: Apellido limpio en MAYÚSCULAS sin sufijos `META` (ej: `"PAZOS"`).
  - `fecha_nacimiento`: Fecha de nacimiento en su propia columna (`"14/08/1982"`).
  - `hincha_de`: Club del socio en su propia columna (`"Haedo Futsal"`).
  - `nombre_contacto`: Nombre y Apellido del Tutor / Contacto (`"Tutor Guillermo"`).
  - `telefono_contacto`: Teléfono del Tutor / Contacto (`"11 5544-3322"`).
  - `foto_rostro`: URL o base64 de la fotografía oficial del rostro.
  - `clave`: PIN de acceso de **4 dígitos exactos** (`"1234"`).
  - `rol`: `socio`, `coach`, `contador`, `admin`.
  - `categoria`: Disciplina / Categoría asignada.

---

## 2. 📋 PADRÓN DE SOCIOS (`DashboardSocios.jsx`)

- **Formato del Apellido y Nombre**:
  - **APELLIDO**: En **MAYÚSCULAS** (ej: `PAZOS`).
  - **Nombre**: Con la **Primera Letra Capitalizada** (ej: `Guillermo`).
  - El renderizador remueve automáticamente cualquier sufijo `| META:...` antes de mostrar el apellido.
- **Columnas en Padrón**:
  - **DNI NO SE MUESTRA** en la tabla del Padrón de Socios (pedido explícito).
  - **TELÉFONO SÍ SE MUESTRA** con un enlace directo a WhatsApp (`https://wa.me/549...`).

---

## 3. 👤 FICHA PERSONAL DE SOCIO (`ModalFichaSocio.jsx`)

- **Encabezado**:
  - Título principal con `APELLIDO, Nombre` y distintivo de categoría.
  - Se eliminó el DNI duplicado debajo del nombre grande superior.
- **Sección Datos Personales**:
  - **Documento DNI**: Visible en el recuadro de datos personales.
  - **N° de Socio / ID**: Generado automáticamente.
  - **Nacimiento**: Recuperado desde `META` (ej: `14/08/1982`).
  - **Hincha de**: Preferencia de club (ej: `Haedo Futsal`).
  - **Teléfono / WA Socio**: Número de teléfono con botón directo a WhatsApp.
- **Contacto de Emergencia / Tutor**:
  - **Nombre Tutor/Contacto**: Nombre del familiar.
  - **Teléfono Familiar / WA**: Número del familiar con botón verde a WhatsApp.
  - **PIN Acceso**: Exclusivamente de **4 dígitos**.
- **Fotografía**:
  - Muestra la imagen de rostro tomada en el alta o subida en la edición.

---

## 4. 💳 LECTOR DE COMPROBANTES Y PWA SHARE TARGET (`PaymentUploader.jsx` & `sw.js`)

- **Web Share Target de Android (`sw.js`)**:
  - Intercepta solicitudes `POST /share-receipt` al compartir imágenes o comprobantes en PDF desde apps bancarias o billeteras virtuales (Mercado Pago, Personal Pay, Cuenta DNI, BNA, etc.).
  - Guarda la respuesta en la caché con la clave `/shared-receipt-file` preservando el `Content-Type` exacto (`application/pdf` o `image/*`).
  - **Redireccionamiento Seguro (`Response.redirect`)**: Utiliza `new URL('/?shared=true', self.location.origin).href` para evitar excepciones por URL relativa en Service Workers de Android/Chrome.
- **Seguridad de Carga DB (`AppContext.jsx`)**:
  - Incluye un temporizador de seguridad (max 3.5s) que garantiza la transición de la pantalla del logo inicial incluso ante latencias de red móvil al compartir.
- **Cartel Informativo en Login (`LoginScreen.jsx`)**:
  - Si el usuario abre la app mediante `?shared=true` sin estar logueado, se muestra un banner verde informando: `📥 ¡Comprobante recibido desde tu billetera! Ingresá con tu usuario para procesarlo automáticamente.`
- **Lector Híbrido OCR (Gemini + PDF.js)**:
  - Soporta **Archivos PDF** (mediante `PDF.js` convirtiendo a Canvas) e **Imágenes** (JPG, PNG, WEBP).
  - Consulta los modelos `gemini-1.5-flash` / `gemini-2.0-flash`.
  - Si no hay internet o falla la API, la app **SIEMPRE avanza a la pantalla de "Analizando Comprobante" con la animación del escudo girando** y deja el pago registrado en estado `en_revision`.
- **Botones de Simulación Superior**:
  - Incluye los botones de prueba en la parte superior para simular rápidamente *"Comprobante Aprobado"* y *"Comprobante en Revisión"* en 1 clic.
- **Privacidad y Mensajes Diferenciados**:
  - **Vista del Socio**: Muestra únicamente un mensaje limpio: `⏳ Comprobante recibido. En proceso de verificación por Administración.`
  - **Vista del Contador/Admin**: Muestra el desglose de auditoría OCR (`DATOS LEÍDOS POR OCR: Monto | Fecha | Hora | COELSA ID` vs `FALTANTES`).

---

## 🚀 CÓMO INICIAR UNA NUEVA SESIÓN DE CHAT

Para mantener la memoria fresca al iniciar un nuevo chat, solo escribí:
> *"Continuemos con el proyecto Haedo Futsal App. Revisa task.md para el contexto del proyecto y la directiva de trabajo como Orquestador con Qwen3 local."*
