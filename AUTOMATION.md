# Flujo automático de cambios

## Objetivo

Ningún cambio llega a producción sin pruebas y revisión visual.

## Flujo habitual

1. Crear una rama desde `main` con un nombre descriptivo.
2. Implementar el cambio y actualizar sus pruebas.
3. Abrir un pull request.
4. Esperar a que GitHub Actions complete pruebas, lint y compilación.
5. Revisar la vista previa creada por Cloudflare.
6. Aprobar y fusionar el pull request.
7. Cloudflare despliega automáticamente el nuevo `main` en producción.

## Configuración recomendada en GitHub

En **Settings > Branches** o **Settings > Rules > Rulesets**, protege `main` con:

- pull request obligatorio antes de fusionar;
- comprobación `verify` obligatoria;
- rama actualizada antes de fusionar;
- conversaciones resueltas;
- impedir force pushes y eliminación de `main`.

Para un repositorio gestionado por una sola persona no es necesario exigir una aprobación de un segundo usuario, pero sí revisar la vista previa antes de fusionar.

## Configuración recomendada en Cloudflare

En **Settings > Builds & deployments > Branch control**:

- rama de producción: `main`;
- despliegues automáticos de producción: activados;
- despliegues de vista previa para otras ramas: activados.

## Base de datos

Los cambios SQL no se ejecutan automáticamente en producción durante esta etapa. Cada migración debe:

1. probarse en un proyecto de desarrollo;
2. revisarse;
3. contar con una copia de seguridad;
4. ejecutarse manualmente con aprobación.

Automatizar la base de datos será una fase posterior, cuando existan migraciones incrementales y restauraciones verificadas.
