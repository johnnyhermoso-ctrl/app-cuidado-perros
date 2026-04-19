# Perros App

Base en Next.js + Supabase para la gestión de un cuidador de perros.

## Qué incluye en esta fase

- Alta de clientes conectada a Supabase
- Listado de clientes
- Alta de perros conectada a Supabase
- Subida de foto del perro a Supabase Storage
- Vista previa antes de guardar la foto
- Listado de perros
- Navegación base: inicio, dashboard, calendario, reservas, clientes y perros

## Variables de entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Requisitos adicionales

En Supabase Storage crea un bucket público llamado `dog-photos`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue en Vercel

- Framework preset: Next.js
- Root directory: `perros-app` si el proyecto está dentro de esa carpeta en el repositorio
- Variables de entorno: las mismas del `.env.local`
