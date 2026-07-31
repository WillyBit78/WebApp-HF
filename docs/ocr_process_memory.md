# 🧠 Memoria de Proyecto: Lógica, Proceso y Configuración del OCR & Conciliación Automática
> **Haedo Futsal App - Módulo de Auditoría de Pagos y Conciliación Bancaria**
> *Última actualización: v32 - Preservación de Reglas de Negocio*

---

## 📌 1. Arquitectura de Lectura OCR Dual-Pass

El sistema procesa los comprobantes adjuntos mediante una estrategia de **Doble Lectura Complementaria**:

1. **Paso 1 - Servidor (Gemini 1.5/2.0 Vision API en Vercel Backend `/api/analyze-receipt`)**:
   - **Compresión Previa**: Toda imagen adjuntada (capturas o fotos de alta resolución tomadas desde teléfonos celulares de hasta 10MB) se comprime localmente a un máximo de `1600px` con calidad JPEG `0.85` en HTML5 Canvas antes de ser transmitida. Esto garantiza que la carga no supere el límite de **4.5 MB Payload de Vercel Serverless Functions**.
   - **Comprensión Contextual**: Utiliza visión artificial para comprender la disposición de datos en comprobantes argentinos (*Mercado Pago, Personal Pay, Cuenta DNI, Banco Galicia, Santander, BBVA, Brubank, etc.*).

2. **Paso 2 - Cliente (Tesseract OCR local como respaldo)**:
   - Aplica filtros de contraste y binarización en Canvas para extraer texto raw mediante OCR local si la conexión o clave de API sufren interrupciones.

---

## ⚡ 2. Algoritmo de Extracción en 2 Pasos por Billetera Origen

El motor no evalúa campos a ciegas; primero determina la entidad emisora para bifurcar la estrategia de búsqueda:

- **Mercado Pago Interno**: Busca el N° de Operación de 10 a 12 dígitos al pie de página (ej: `171148585644`) y exime la presencia de COELSA ID (`coelsa_id = null`).
- **Billetera Externa (Personal Pay, Cuenta DNI, Bancos)**: Prioriza el `COELSA ID` alfanumérico de 14 a 32 caracteres (ej: `L18MKX9RP7P5PZQ4206WYV` o `1LMP6SNKKJKMMSKSNR70EV`).

---

## 🚫 3. Reglas Estrictas de Filtrado y Exclusión (Evitar Falsos Positivos)

1. **Exclusión Absoluta de DNIs de 8 Dígitos en `N° Operación`**:
   - Los números de 8 dígitos de titulares (ej: `26248272` o `29900782` pertenecientes a CUILs como `20-26248272-4`) **NUNCA** se asignan al campo `numero_operacion`.

2. **Limpieza Total del Nombre de Emisor**:
   - Se eliminan conectores de hora, comas y días de la semana: `, a las`, `a las`, `hs`, `hs.`, `transferencia`, `realizada`, `Lunes`...`Domingo`, `enero`...`diciembre`.
   - Si no se encuentra un nombre y apellido claro de persona de al menos 3 letras, devuelve `null` sin inventar palabras parásitas.

---

## 🤝 4. Lógica de Conciliación Automática y Sincronización de Cajas

1. **Regla de Sincronización de Monto con Mercado Pago (Caja 100% Cuadrada)**:
   - Cuando un comprobante coincide y se aprueba contra una transferencia recibida en Mercado Pago (`matchedTransfer`), **EL MONTO DEL PAGO SE SOBREESCRIBA AUTOMÁTICAMENTE CON EL MONTO REAL DE BANCO (`matchedTransfer.monto`)**.
   - *Ejemplo*: Si la cuota por defecto es $15.000 pero la transferencia real en Mercado Pago fue por **$30.000** (o $20.000), el pago guardado en la base de datos se registra por **$30.000**, logrando que la suma en el **Balance General del Club** coincida exactamente con la tesorería real.

2. **Tolerancia de Coincidencia de Fecha y Hora (`isSameTransactionDate`)**:
   - Tolera diferencias de formato de año (4 dígitos `2026` vs 2 dígitos `26`), formatos de 24 horas (`18:44 hs.`) vs 12 horas AM-PM (`6:44 p. m.`), y márgenes de diferencia de hasta 3 minutos entre la lectura OCR y la acreditación bancaria.
   - **Tolerancia OCR Alfanumérica en COELSA ID (`isCoelsaMatch`)**: Tolera confusiones habituales de tipografía OCR: `Z` $\leftrightarrow$ `7`, `O` $\leftrightarrow$ `0`, `I/L` $\leftrightarrow$ `1`, `B` $\leftrightarrow$ `8`.

3. **Período de Búsqueda Activa**:
   - Revisa las transferencias recibidas en los últimos **60 días** para evitar búsquedas lentas pero asegurando cubrir transferencias de meses anteriores.

---

## 🔒 5. Estado de Aprobación de Comprobantes

- **APROBADO Y CONCILIADO**: Los datos leídos coinciden al 100% con una transferencia acreditada en la cuenta del club.
- **EN REVISIÓN**: Se leyeron datos del comprobante pero aún no figura la transferencia en Mercado Pago o el monto difiere sin conciliar.
- **RECHAZADO**: Re-envío detectado (misma fecha/hora/socio ya registrado) o transferencia previamente conciliada con otro pago.
