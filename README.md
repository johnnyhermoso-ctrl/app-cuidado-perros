# Perros App

Aplicación interna para gestionar clientes, perros y reservas de un servicio de cuidado canino.

## Estado

La aplicación incluye:

- autenticación de usuarios existentes;
- alta y listado de clientes;
- alta y listado de perros;
- fotografías privadas en Supabase Storage;
- creación atómica y listado de reservas;
- catálogo configurable de servicios;
- tarifas generales con vigencia, edición y desactivación;
- selección de tarifa vigente y cálculo provisional al crear reservas;
- esquema inicial para tarifas, pagos, festivos y recurrencias.

Las tarifas especiales por cliente todavía no tienen pantalla propia, aunque el cálculo ya les da prioridad si existen en la base de datos. Los ajustes, cobros, calendario, capacidad, check-in/check-out y recurrencias todavía no están implementados en la interfaz.

El subtotal inicial de una reserva se calcula como `tarifa × unidades × número de perros`. La reserva conserva una copia de la tarifa y su origen para que futuras modificaciones no alteren el histórico.

## Requisitos

- Node.js 20 o superior;
- Yarn 1.x;
- un proyecto de Supabase destinado a desarrollo o pruebas.

## Configurar Supabase

1. Abre el editor SQL del proyecto de pruebas.
2. Ejecuta `supabase/schema.sql` completo. El script activa RLS, crea el bucket privado `dog-photos` y añade la función transaccional `crear_reserva`.
3. En Authentication > Users, crea manualmente el usuario administrador. El formulario público de registro no está habilitado deliberadamente.
4. Si ya existía el bucket `dog-photos`, confirma que aparece como privado.

El esquema permite operar a cualquier usuario autenticado porque la primera versión está diseñada para un único administrador. Antes de incorporar colaboradores habrá que añadir roles y políticas más específicas.

## Variables de entorno

Copia `.env.example` como `.env.local` y completa:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
```

No añadas nunca una clave `service_role` a una variable `NEXT_PUBLIC_*` ni al repositorio.

## Desarrollo

```bash
yarn install --frozen-lockfile
yarn dev
```

Abre `http://localhost:3000` e inicia sesión con el usuario creado en Supabase.

## Verificación

```bash
yarn test
yarn lint
yarn build
```

## Despliegue

Configura las dos variables públicas en el proveedor de alojamiento. Vercel Hobby no debe usarse para la operación comercial del negocio; la alternativa prevista es Cloudflare o un plan comercial compatible.

No uses datos reales hasta verificar autenticación, RLS, acceso privado a fotografías y copias de seguridad.
