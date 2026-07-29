# 📌 MEMORIA OFICIAL DEL PROYECTO: HAEDO FUTSAL APP
**Última actualización:** 29 de Julio de 2026

Este documento contiene la arquitectura del proyecto, la memoria técnica y la **directiva oficial del modo de trabajo**. **Consultar este archivo al iniciar cualquier nueva sesión de chat.**

---

## 🤖 MODO DE TRABAJO OFICIAL: AGENTE ORQUESTADOR + IA LOCAL (QWEN3)

- **Rol Principal de Antigravity (IA)**: **ORQUESTADOR Y ARQUITECTO**.
- **Servidor de IA Local**: Ollama / Qwen3 configurado en la red local:
  - **Endpoint Ollama**: `http://192.168.0.140:11434`
  - **Modelo Local**: `qwen3` / `qwen`
- **Flujo de Trabajo Exigido**:
  1. El **USUARIO** entrega un requerimiento o indicación.
  2. **ANTIGRAVITY (Orquestador)** analiza los componentes, entiende el problema y redacta la tarea técnica detallada.
  3. **ANTIGRAVITY** envía la instrucción al servidor de IA local (`http://192.168.0.140:11434`) para generar/editar el código con **Qwen3**.
  4. **Qwen3 (IA Local)** ejecuta el trabajo pesado de código.
  5. **ANTIGRAVITY** revisa el resultado, compila la app (`npm run build`), verifica que todo funcione sin errores y le informa el resultado final al USUARIO.
- **Objetivo**: Minimizar el consumo de tokens de la suscripción delegando la escritura masiva de código al servidor local de Qwen3.

---

## 🔑 CREDENCIALES Y ACCESOS DEL PROYECTO

- **Supabase URL**: `https://jmfxxqbtmyzslkrslpvk.supabase.co`
- **Supabase DB Password**: `HaedoFutsal.2026`
- **Supabase Pooler (Postgres)**: `postgresql://postgres.jmfxxqbtmyzslkrslpvk:HaedoFutsal.2026@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`
- **Mercado Pago Token**: `APP_USR-3322444120483456-072316-c328d2ad7cb6de93a33a94812589756e-43153257`
- **VAPID Public Key**: `BNrO1BAPOhrooMRFovIRtRVXGwd9dxgT1ZWyzEVkPIauISEjh-EZl0MwUwaF1Wn7HJ1lOojM7CKt3he8jXvH-MQ`

---

## 1. 🗃️ ESQUEMA Y PERSISTENCIA EN SUPABASE (`users`)

- **Campos Independientes en Tabla `users`**:
  - `id`: Formato `usr-[DNI]` (ej: `"usr-26.248.272"`).
  - `dni`: Documento DNI limpio en su propia columna (`"26.248.272"`).
  - `telefono`: Teléfono de WhatsApp en su propia columna (`"11 6740-9620"`).
  - `nombre`: Nombre capitalizado (ej: `"Guillermo"`).
  - `apellido`: Almacena el Apellido en MAYÚSCULAS más el bloque empaquetado `META` (`"PAZOS | META:{...}"`).
  - `clave`: PIN de acceso de **4 dígitos exactos** (`"1234"`).
  - `rol`: `socio`, `coach`, `contador`, `admin`.
  - `categoria`: Disciplina / Categoría asignada.

- **Persistencia Física de Metadatos Extendidos (`META`)**:
  - En la columna `apellido`, se guarda el apellido concatenado con `| META:` conteniendo un JSON con:
    - `fechaNacimiento`: Fecha de nacimiento del socio.
    - `hinchaDe`: Club del socio (ej: `"Haedo Futsal"`).
    - `nombreContacto`: Nombre y Apellido del Contacto de Emergencia / Tutor.
    - `telefonoContacto`: Teléfono de WhatsApp del Tutor.
    - `fotoRostro`: Fotografía oficial del rostro.
  - Además, se mantiene un respaldo local en `localStorage` bajo la clave `socio_meta_[DNI]`.

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
  - Intercepta solicitudes `POST /share-receipt` al compartir imágenes o comprobantes en PDF desde apps bancarias o billeteras virtuales (Mercado Pago, Cuenta DNI, BNA, etc.).
  - Inspecciona todos los campos de `FormData` y guarda la respuesta en la caché con la clave `/shared-receipt-file` preservando el `Content-Type` exacto (`application/pdf` o `image/*`).
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
