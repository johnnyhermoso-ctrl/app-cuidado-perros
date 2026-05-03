# Perros App — fase 2

Esta versión incluye:
- clientes conectados a Supabase
- perros conectados a Supabase
- subida de foto a Supabase Storage (`dog-photos`)
- reservas reales conectadas a Supabase
- selección de cliente, perros y servicio
- listado de reservas

## Variables de entorno

Crea un archivo `.env.local` a partir de `.env.example` con:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Arranque local

```bash
npm install
npm run dev
```

## Bucket de fotos

Debes tener creado en Supabase Storage un bucket público llamado `dog-photos`.
