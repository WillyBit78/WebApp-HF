import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = 
      process.env.GEMINI_API_KEY || 
      process.env.VITE_GEMINI_API_KEY || 
      process.env.GOOGLE_API_KEY || 
      process.env.GEMINI_KEY || 
      '';

    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY no encontrada en las variables de entorno de Vercel.' });
    }

    const { dataUrl, imageBase64, mimeType = 'image/jpeg' } = req.body || {};
    let base64 = imageBase64;
    let mime = mimeType;

    if (dataUrl && dataUrl.includes(';base64,')) {
      const parts = dataUrl.split(';base64,');
      mime = parts[0].replace('data:', '');
      base64 = parts[1];
    }

    if (!base64) {
      return res.status(400).json({ error: 'Falta la imagen base64' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (e) {
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    const imageParts = [{
      inlineData: {
        data: base64,
        mimeType: mime
      }
    }];

    const prompt = `Analizá minuciosamente la imagen de este comprobante bancario o billetera virtual de Argentina (Personal Pay, Mercado Pago, Cuenta DNI, Banco Galicia, Santander, BBVA, Brubank, etc.).

PASO 1: Identificá la billetera origen ("billetera"):
- Si el encabezado dice "Mercado Pago", "MercadoPago", "MP": billetera = "Mercado Pago".
- Si el encabezado dice "Personal Pay", "personalpay": billetera = "Personal Pay".
- Si dice "Cuenta DNI", "Banco Provincia": billetera = "Cuenta DNI".

PASO 2: Extraé los campos numéricos e identificadores con estas REGLAS ABSOLUTAS:
1. "fecha": Formato DD/MM/YYYY (ej: 25/07/2026, 12/07/2026, 29/07/2026).
2. "hora": Formato HH:MM hs. (ej: 15:47 hs., 18:18 hs., 20:57 hs.).
3. "monto": Número entero (ej: 15000, 30000, 20000).
4. "billetera": Nombre de la billetera o banco detectado.
5. "numero_operacion": 
   - Para Mercado Pago: Buscar el número de 10 a 12 dígitos ubicado abajo de todo tras la frase "Número de operación de Mercado Pago" (ej: 171148585644 o 2846588696).
   - Para Personal Pay / Cuenta DNI / Bancos: Buscar bajo "N° de la operación" (ej: 2897797408).
   - REGLA CRÍTICA: NUNCA tomar el DNI o CUIL de 8 dígitos (ej: 26248272 o 29900782 del CUIL 20-26248272-4 / 20-29900782-4). Si solo hay un DNI/CUIL y no hay número de operación separado, retornar null.
6. "coelsa_id": 
   - Para Personal Pay / Cuenta DNI / Bancos externos: Buscar el código alfanumérico de 14 a 32 caracteres (ej: L18MKX9RP7P5PZQ4206WYV o 7L8GYKNX40Z81P7KNMPRZ5). A veces figura como "CoelsaID", "Id Bancario" o "N° de identificación".
   - Para Mercado Pago interno: Retornar null (las transferencias entre cuentas MP no usan COELSA ID).
7. "emisor": Nombre y apellido del pagador u emisor (ej: "Pazos, Guillermo Pablo" o "Guillermo Pablo Pazos").
   - REGLA CRÍTICA: EXCLUIR absolutamente palabras de fecha/días como "transferencia", "realizada", "el", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre". Si no se ve un nombre de persona claro, retornar null.

Retorná ÚNICAMENTE JSON puro con la estructura:
{
  "billetera": "Nombre de billetera",
  "fecha": "DD/MM/YYYY",
  "hora": "HH:MM hs.",
  "monto": 15000,
  "coelsa_id": "código alfanumérico o null",
  "numero_operacion": "número de 10-12 dígitos o null",
  "emisor": "Nombre completo o null"
}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    let cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').replace(/\/\/.*$/gm, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanedText);

    return res.status(200).json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('Error en API Vercel Gemini Vision:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error procesando la imagen con Gemini Vision'
    });
  }
}
