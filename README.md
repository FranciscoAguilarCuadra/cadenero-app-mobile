# Cadenero App Mobile

Aplicación móvil (Expo / React Native) para gestionar arriendos de cadenas de nieve del gremio de cadeneros Las Trancas. Es la versión móvil de [Cadenero-App](https://github.com/FranciscoAguilarCuadra/Cadenero-App) (web) y comparte el mismo backend de Supabase.

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
