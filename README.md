# Portafolio de proyectos

Monorepo de Next.js 15 donde vive todo lo que fui construyendo: quinielas
deportivas, juegos 3D en el navegador, herramientas internas y sitios web para
clientes. La página principal (`/`) es el índice del portafolio.

## Arrancar

```bash
npm install
cp .env.example .env.local   # completá al menos MONGODB_URI
npm run dev                  # http://localhost:3000
```

Para el modo multijugador de la carrera hace falta además el relay de WebSocket:

```bash
npm run ws                   # ws://localhost:3001
```

## Estructura

```
app/
  page.tsx            → home del portafolio
  (page_routes)/      → una carpeta por proyecto, servida en la raíz
                        (/mundial, /scores, /mapa/juego, /sitios-web, …)
  api/                → route handlers, con el mismo nombre de proyecto
lib/                  → lógica compartida y de servidor
  mundial/ scores/ ufc/   dominio de cada quiniela
  realtime/               estado de partidas y salas de carrera
  helpers/ constants/ email/ security/
components/           → componentes fuera de una ruta concreta
scripts/              → seeds, tests de integración y el servidor WebSocket
```

`(page_routes)` es un [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups):
no aparece en la URL, solo agrupa las páginas y las separa de `app/api`.

## Agregar un proyecto al portafolio

1. Creá la página en `app/(page_routes)/<slug>/page.tsx`.
2. Agregá una entrada en [`lib/projects.ts`](lib/projects.ts).

La home se arma sola desde ese archivo, agrupada por categoría.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` sobre todo el repo |
| `npm run ws` | Relay WebSocket de la carrera multijugador |

## Variables de entorno

Están todas documentadas en [`.env.example`](.env.example). Lo mínimo para
levantar el proyecto es `MONGODB_URI`; cada proyecto va pidiendo las suyas
(PayPal, Resend, Google Maps) solo cuando usás esa función.

Los secretos de firma (`ADMIN_JWT_SECRET`, `*_PIN_PEPPER`) tienen un fallback de
desarrollo pero **fallan a propósito en producción** si no están configurados:
ver [`lib/security/runtime-secret.ts`](lib/security/runtime-secret.ts).

## Notas

- El build usa Turbopack (`next build --turbopack`). El pipeline de webpack
  falla en este proyecto con un error interno del plugin de minificación.
- `nsfwjs` + `@tensorflow/tfjs` se cargan de forma diferida y solo se usan para
  moderar los avatares que suben los jugadores en el mundial.
