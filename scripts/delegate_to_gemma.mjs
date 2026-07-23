import fs from 'fs';
import path from 'path';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://192.168.0.139:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'gemma4:31b';

/**
 * Script Orquestador: Delegar generación de código pesado a Gemma 4 en Ubuntu local
 */
async function delegateTask() {
  const args = process.argv.slice(2);
  const targetFilePath = args[0];
  const instruction = args[1];

  if (!targetFilePath || !instruction) {
    console.error('Uso: node scripts/delegate_to_gemma.mjs <archivo_destino> "<instrucciones_para_gemma>"');
    process.exit(1);
  }

  const absPath = path.resolve(targetFilePath);
  let existingContent = '';
  if (fs.existsSync(absPath)) {
    existingContent = fs.readFileSync(absPath, 'utf8');
  }

  console.log(`📡 Delegando trabajo pesado a Gemma 4 (${MODEL_NAME} en ${OLLAMA_HOST})...`);
  console.log(`📁 Archivo objetivo: ${targetFilePath}`);
  console.log(`💡 Instrucción: "${instruction}"`);

  const systemPrompt = `Eres un desarrollador Senior en React, Vite, Tailwind CSS y Supabase. 
Tu única tarea es generar el código fuente exacto para el archivo especificado.
RESPONDE ÚNICAMENTE CON EL CÓDIGO FUENTE DENTRO DE UN BLOQUE DE CÓDIGO MARKDOWN (\`\`\`jsx o \`\`\`js o \`\`\`css).
No agregues explicaciones, saludos ni introducciones fuera del bloque de código.`;

  const userPrompt = existingContent 
    ? `Instrucciones de modificación: ${instruction}\n\nCódigo actual del archivo (${targetFilePath}):\n\`\`\`\n${existingContent}\n\`\`\`\n\nGenera el código completo modificado para ${targetFilePath}:`
    : `Instrucciones para nuevo archivo: ${instruction}\n\nCrea el código completo para ${targetFilePath}:`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: {
          num_ctx: 32768,
          num_predict: 8192,
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const rawOutput = data.message.content;

    // Extraer bloque de código
    let extractedCode = rawOutput;
    const codeBlockMatch = rawOutput.match(/```(?:jsx|javascript|js|css|json|html)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      extractedCode = codeBlockMatch[1].trim();
    }

    // Asegurar directorio padre
    const dirName = path.dirname(absPath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    fs.writeFileSync(absPath, extractedCode, 'utf8');
    console.log(`🎉 ¡ÉXITO! Código generado por Gemma 4 guardado exitosamente en: ${targetFilePath} (${extractedCode.length} caracteres).`);

  } catch (err) {
    console.error('❌ Error delegando a Gemma 4 local:', err.message);
    process.exit(1);
  }
}

delegateTask();
