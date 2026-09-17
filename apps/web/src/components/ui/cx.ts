/** Fasst Klassennamen zusammen und laesst falsche Werte weg. Absichtlich winzig
 *  statt einer Abhaengigkeit - mehr wird hier nicht gebraucht (Regel 7). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => typeof p === 'string' && p !== '').join(' ');
}
