// Guardar en gris mientras no se cambie nada al editar (pedido del dueño, Sesión 13): si se abre
// "Editar cuenta" y no se toca nada, no hay qué guardar.

// true si los dos tienen los mismos datos. Compara como texto: los formularios arman sus datos a
// partir de lo guardado con las mismas claves en el mismo orden.
export const mismosDatos = (a, b) => JSON.stringify(a) === JSON.stringify(b);
