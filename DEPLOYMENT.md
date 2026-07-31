# Despliegue en Supabase y Cloudflare Pages

## 1. Preparar Supabase

1. Entra en el proyecto de pruebas de Supabase.
2. Abre **SQL Editor** y crea una consulta nueva.
3. Copia y ejecuta todo el contenido de `supabase/schema.sql`.
4. En **Authentication > Providers > Email**, desactiva el registro público de nuevos usuarios.
5. En **Authentication > Users**, crea el usuario administrador.
6. En **Project Settings > API**, copia la URL del proyecto y la clave pública `anon` o `publishable`. No copies `service_role`.

## 2. Publicar el código en GitHub

El repositorio debe contener el contenido de la carpeta `perros-app`, incluyendo `.github`, pero nunca `.env.local` ni `node_modules`.

Antes de desplegar, comprueba en GitHub que la raíz del repositorio contiene `package.json`, `next.config.js`, `app`, `components` y `supabase`.

## 3. Crear el proyecto en Cloudflare Pages

1. Entra en Cloudflare y abre **Workers & Pages**.
2. Selecciona **Create application > Pages > Connect to Git**.
3. Autoriza GitHub y selecciona el repositorio.
4. Usa estos valores de compilación:

   - Rama de producción: `main`
   - Framework preset: `Next.js (Static HTML Export)`
   - Build command: `yarn build`
   - Build output directory: `out`
   - Root directory: deja vacío si `package.json` está en la raíz. Si conservas la carpeta exterior, indica `perros-app`.

5. En variables de producción y de vista previa añade:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. Guarda y ejecuta el primer despliegue.

## 4. Configurar la URL en Supabase

Cuando Cloudflare entregue una dirección `https://...pages.dev`:

1. Ve a **Supabase > Authentication > URL Configuration**.
2. Configura **Site URL** con la dirección exacta de producción.
3. Añade `http://localhost:3000/**` como URL adicional para desarrollo.
4. Si más adelante conectas un dominio propio, reemplaza Site URL por el dominio definitivo.

## 5. Prueba de aceptación

Comprueba en este orden:

1. Sin iniciar sesión no se muestran datos.
2. El usuario administrador puede entrar y cerrar sesión.
3. Puede crear un cliente y un perro.
4. La foto solo aparece después de iniciar sesión.
5. Puede crear una reserva con uno o varios perros.
6. Fechas inválidas son rechazadas.
7. Al recargar, los datos permanecen.

No introduzcas datos reales hasta completar estas comprobaciones.

## Automatización

Cloudflare Pages queda conectado a GitHub:

- cada cambio en `main` genera un despliegue de producción;
- cada pull request puede generar una vista previa;
- `.github/workflows/ci.yml` ejecuta pruebas, lint y compilación.

La protección recomendada es trabajar en una rama, abrir un pull request y fusionarlo en `main` solamente cuando el control automático esté verde y la vista previa haya sido aprobada.
