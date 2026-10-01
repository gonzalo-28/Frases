/**
 * Quote dataset.
 *
 * Plain typed constants — no logic, no randomness. Kept separate from
 * `quotePicker.ts` so the data can grow (or be swapped) without touching the
 * selection logic, and so tests can assert on it independently.
 */

/** A single motivational quote and its author. */
export type Quote = {
  text: string
  author: string
}

/**
 * Well-known motivational quotes with their traditional attributions.
 * Ordered as a stable, human-readable list; selection order does not depend on it.
 */
export const quotes: readonly Quote[] = [
  { text: 'Todo lo que puedes imaginar es real.', author: 'Pablo Picasso' },
  {
    text: 'El éxito no es final, el fracaso no es fatal: lo importante es la fuerza para continuar.',
    author: 'Winston Churchill',
  },
  {
    text: 'La vida es como una bicicleta. Para mantener el equilibrio no puedes mantenerte estático.',
    author: 'Albert Einstein',
  },
  { text: 'La insatisfacción es el primer paso hacia la mejora.', author: 'Bill Hicks' },
  { text: 'Del dicho al hecho hay mucho trecho.', author: 'Miguel de Cervantes' },
  {
    text: 'Quien mucho abarca, poco aprieta.',
    author: 'Miguel de Cervantes',
  },
  {
    text: 'No es grande el hombre por la forma en que muere, sino por la forma en que vive.',
    author: 'Machado de Assis',
  },
  { text: 'No cuentes los días; haz que los días cuenten.', author: 'Muhammad Ali' },
  {
    text: 'Todo lo que ha sido hecho en el mundo ha sido posible porque alguien pudo no hacerlo.',
    author: 'Simone Weil',
  },
  { text: 'El hombre es un fin en sí mismo.', author: 'Immanuel Kant' },
  {
    text: 'La libertad consiste en poder hacer todo lo que no está prohibido por la ley.',
    author: 'Immanuel Kant',
  },
  {
    text: 'Todos somos el universo mirando en sí mismo.',
    author: 'John Barrow',
  },
  {
    text: 'Quien tiene la razón nunca está solo.',
    author: 'Proverbio chino',
  },
  {
    text: 'El mejor momento para plantar un árbol fue hace veinte años; el segundo mejor momento es ahora.',
    author: 'Proverbio chino',
  },
  {
    text: 'A quien tiene un amigo, tiene un hermano.',
    author: 'Proverbio árabe',
  },
  {
    text: 'No hay mal que por bien no venga.',
    author: 'Proverbio español',
  },
  {
    text: 'El ayer es historia, el mañana es un misterio y el hoy es un regalo.',
    author: 'Proverbio',
  },
  {
    text: 'El hombre que no tiene miedo de los monstruos, los monstruos no lo tienen de él.',
    author: 'Proverbio chino',
  },
  {
    text: 'La constancia es el camino más corto hasta cualquier meta.',
    author: 'Anónimo',
  },
  {
    text: 'Con esfuerzo y constancia se llega a lo que uno se propone.',
    author: 'Anónimo',
  },
  {
    text: 'Quien no arriesga, no gana.',
    author: 'Anónimo',
  },
  { text: 'Conócete a ti mismo.', author: 'Sócrates' },
  {
    text: 'El hombre más rico del mundo es el que necesita menos cosas.',
    author: 'Epicteto',
  },
] as const