# Empaquetar como app nativa

Los cálculos estándar, las exportaciones y el almacenamiento local no necesitan
conexión mientras la aplicación está cargada. En la versión web no hay una caché
de aplicación instalada que garantice abrirla de nuevo tras perder la conexión.
Las consultas de IA son opcionales, requieren internet y envían los datos de la
consulta a las funciones de Supabase.

## Requisitos previos

- Exportar el proyecto a tu propio repositorio GitHub (botón "Export to GitHub" en Lovable).
- `git clone` el proyecto en tu equipo.
- Instalar Node.js 20+ y `npm install`.

---

## Android (.apk)

Necesitas: **Android Studio** instalado.

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Se abrirá Android Studio. Desde el menú:

- **Build → Build Bundle(s) / APK(s) → Build APK(s)**

El `.apk` quedará en `android/app/build/outputs/apk/debug/app-debug.apk`.
Para una versión firmada de release, usa **Build → Generate Signed Bundle / APK**.

> Cada vez que actualices el código del proyecto, repite:
> `npm run build && npx cap sync android`

---

## Windows (.exe)

Necesitas: cualquier sistema con Node.js (puedes generar el .exe incluso desde Linux/Mac).

```bash
npm install
npm install --save-dev electron @electron/packager
npm run build
npx @electron/packager . CalculadoraPlegado --platform=win32 --arch=x64 --out=electron-release --overwrite --ignore="^/src" --ignore="^/public" --ignore="^/electron-release" --ignore="^/android" --ignore="^/ios"
```

El ejecutable estará en:
`electron-release/CalculadoraPlegado-win32-x64/CalculadoraPlegado.exe`

Para probarlo en tu propio sistema operativo durante desarrollo:

```bash
npm run electron:dev
```

---

## Datos locales y conexión

- **Web / preview:** IndexedDB (`plegado-db`) vía Dexie.
- **Android / Electron:** SQLite local (`plegado.db`) vía
  `@capacitor-community/sqlite`.
- Los cálculos y las exportaciones se ejecutan en el dispositivo.
- Las consultas de IA a `ai-plegado-asistente`, `remate-desigual-ai`,
  `sugerir-vueltas-ai` y `validar-pieza-ai` necesitan conexión y envían los
  datos incluidos en cada formulario a Supabase para generar una respuesta.
- En Electron y Android los recursos web se empaquetan dentro de la aplicación;
  la operación local puede continuar sin red, pero las consultas de IA no.

Los registros de piezas y materiales se guardan localmente. No se sincronizan
con Supabase; la excepción son los campos enviados al invocar explícitamente
una función de IA.
