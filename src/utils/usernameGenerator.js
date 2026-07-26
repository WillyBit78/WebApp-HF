/**
 * Genera un nombre de usuario único basado en los nombres y apellido del socio.
 * Reglas de resolución de colisiones:
 * 1. Inicial del 1er nombre + Apellido (ej: WLOPEZ)
 * 2. Si ya existe y tiene 2do nombre: Inicial 1er nombre + Inicial 2do nombre + Apellido (ej: WJLOPEZ)
 * 3. Si ya existe: 2 primeras letras del 1er nombre + (inicial 2do nombre si tiene) + Apellido (ej: WAJLOPEZ o WALOPEZ)
 * 4. Si aún existe: Agrega un número consecutivo al final (ej: WLOPEZ1, WLOPEZ2...)
 */
export function generateUniqueUsername(nombres = '', apellido = '', existingUsers = []) {
  const existingSet = new Set(
    existingUsers
      .map(u => (u.usuario || '').toString().trim().toUpperCase())
      .filter(Boolean)
  );

  const cleanApellido = apellido
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  const nameParts = nombres
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .map(n => n.replace(/[^a-zA-Z]/g, ''))
    .filter(Boolean);

  const firstName = (nameParts[0] || 'S').toUpperCase();
  const secondName = (nameParts[1] || '').toUpperCase();

  // Opción 1: WLOPEZ
  const cand1 = (firstName.charAt(0) + cleanApellido).toUpperCase();
  if (!existingSet.has(cand1)) return cand1;

  // Opción 2: WJLOPEZ (si tiene 2do nombre)
  if (secondName) {
    const cand2 = (firstName.charAt(0) + secondName.charAt(0) + cleanApellido).toUpperCase();
    if (!existingSet.has(cand2)) return cand2;
  }

  // Opción 3: WAJLOPEZ o WALOPEZ (2 letras del primer nombre)
  if (firstName.length >= 2) {
    const cand3 = (firstName.slice(0, 2) + (secondName ? secondName.charAt(0) : '') + cleanApellido).toUpperCase();
    if (!existingSet.has(cand3)) return cand3;
  }

  // Opción 4: WLOPEZ1, WLOPEZ2...
  let counter = 1;
  while (true) {
    const candNumbered = `${cand1}${counter}`;
    if (!existingSet.has(candNumbered)) return candNumbered;
    counter++;
  }
}
