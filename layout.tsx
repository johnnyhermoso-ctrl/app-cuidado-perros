name: Verificar aplicación

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: clave-publica-solo-para-compilar
    steps:
      - name: Descargar código
        uses: actions/checkout@v4

      - name: Preparar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: yarn

      - name: Instalar dependencias
        run: yarn install --frozen-lockfile

      - name: Ejecutar pruebas
        run: yarn test

      - name: Analizar código
        run: yarn lint

      - name: Compilar
        run: yarn build
