# Perros App

Base inicial para una aplicación de gestión de cuidador de perros con Next.js + Supabase + Vercel.

## Requisitos
- Node.js 20+
- Cuenta en Supabase
- Cuenta en Vercel

## Arranque local
1. Copia `.env.example` a `.env.local`
2. Rellena:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Instala dependencias:
   ```bash
   npm install
   ```
4. Lanza el proyecto:
   ```bash
   npm run dev
   ```

## Base de datos
Ejecuta `supabase/schema.sql` dentro de SQL Editor en Supabase.

## Storage
Crea un bucket llamado `dog-photos` en Supabase Storage.
