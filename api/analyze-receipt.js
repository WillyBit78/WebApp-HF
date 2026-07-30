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

    const prompt = `Analizá la imagen de este comprobante bancario o billetera virtual de Argentina (Personal Pay, Mercado Pago, Cuenta DNI, Banco Galicia, Santander, BBVA, Brubank, etc.).
Reglas de extracción estrictas:
1. "fecha": Formato DD/MM/YYYY (ej: 25/07/2026 o 29/07/2026).
2. "hora": Formato HH:MM hs. (ej: 15:47 hs. o 20:57 hs.).
3. "monto": Número entero o decimal (ej: 15000 o 30000).
4. "numero_operacion": El número de comprobante u operación oficial (8 a 12 dígitos, ej: 2897797408 o 171148585644). IMPORTANTE: NO confundir con el DNI/CUIL de 8 dígitos del titular (ej: 26248272 o 29900782).
5. "coelsa_id": Código alfanumérico largo (14 a 32 caracteres, ej: 7L8GYKNX40Z81P7KNMPRZ5). Si es un comprobante interno de Mercado Pago y no tiene COELSA ID, retornar null.
6. "emisor": Nombre completo y apellido del pagador (ej: "Pazos, Guillermo Pablo"). IMPORTANTE: NO incluir fechas, meses (ej: "julio de"), ni palabras como "Desde", "Recibe", "Transferencia".
7. "billetera": Nombre de la billetera origen (ej: "Personal Pay", "Mercado Pago", "Cuenta DNI").

Retorná ÚNICAMENTE en JSON puro con la estructura:
{
  "fecha": "DD/MM/YYYY",
  "hora": "HH:MM hs.",
  "monto": 15000,
  "coelsa_id": "código alfanumérico o null",
  "numero_operacion": "número de operación o null",
  "emisor": "Nombre completo o null",
  "billetera": "Nombre de billetera"
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
