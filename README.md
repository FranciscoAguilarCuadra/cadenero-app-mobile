# Cadenero App Mobile

[![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000000?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

Aplicación móvil (Expo / React Native) para gestionar arriendos de cadenas de nieve del gremio de cadeneros Las Trancas. Es la versión móvil de [Cadenero-App](https://github.com/FranciscoAguilarCuadra/Cadenero-App) (web) y comparte el mismo backend de Supabase.

<!--
## Capturas
Coloca las imágenes en `docs/screenshots/` y descomenta:
![Dashboard](docs/screenshots/dashboard.png)
![Nuevo arriendo](docs/screenshots/nuevo-arriendo.png)
![Modo offline](docs/screenshots/offline.png)
-->

## Funcionalidades (MVP)

- Login cerrado para cadeneros autorizados.
- Registro de arriendo o porte con hasta 6 fotos del vehículo (cámara o galería, comprimidas automáticamente).
- Edición de arriendos activos y marca de daño previo.
- Marcar arriendo como devuelto y reactivarlo desde el historial.
- Eliminación con confirmación.
- Historial de arriendos devueltos.
- Modo offline: cola de sincronización automática al recuperar conexión.

## Requisitos

- Node.js
- Proyecto Supabase configurado (mismo esquema que la app web: `supabase-setup.sql`)
- Expo Go en el celular (para desarrollo) o un build de EAS

## Variables de entorno

Crear un archivo `.env` a partir de `.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Comandos

```bash
npm install
npx expo start        # escanear QR con Expo Go
npm run android       # abrir en emulador Android
npm run lint          # lint
npx expo-doctor       # diagnóstico de dependencias
npx expo export --platform android   # verificar bundle de producción
```

## Estructura

```
src/
  app/            # rutas (expo-router)
    (tabs)/       # Inicio (dashboard) e Historial
    login.js
  components/     # UI (PrestamoCard, ModalNuevoPrestamo, Header, etc.)
  context/        # AppContext (sesión, perfil, arriendos)
  services/       # Supabase, offline (cola/sync), conectividad
  utils/          # fechas, base64
```

## Versión

MVP móvil (Login, Dashboard, Historial). El panel Admin de usuarios es la próxima etapa.
