# Empaquetar como app nativa

La app web ya funciona offline (los datos se guardan en IndexedDB en navegador
y en SQLite cuando se ejecuta como app nativa).

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

## Datos locales

- **Web / preview:** IndexedDB (`plegado-db`) vía Dexie.
- **Android / Electron:** SQLite local (`plegado.db`) vía
  `@capacitor-community/sqlite`.

Los datos persisten entre sesiones y nunca salen del dispositivo.
