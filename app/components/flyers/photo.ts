/** Misma convención de recorte que `lib/tour-display.ts` para las fotos de stock. */
export function unsplashPhoto(id: string) {
  return `https://images.unsplash.com/photo-${id}?q=82&w=1600&auto=format&fit=crop`;
}
