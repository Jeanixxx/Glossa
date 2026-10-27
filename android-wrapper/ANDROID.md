# Glóssa para Android

## Compilación

El workflow **Build Glóssa Android APK** se ejecuta manualmente desde GitHub Actions o al cambiar el HTML principal, el wrapper o el propio workflow. Al terminar, descarga el artefacto `glossa-debug-apk` desde la ejecución.

Para compilar localmente, usa Node.js 20, Java 21 y Android SDK:

```sh
cd android-wrapper
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

El APK de depuración queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Funciones integradas

- **Compartir lectura:** abre el selector nativo de compartir Android.
- **Lectura en voz alta:** utiliza Speech Synthesis del WebView y las voces instaladas en Android.
- **Respuesta háptica:** usa el plugin de vibración/háptica de Capacitor al pulsar acciones.
- **Diseño adaptable a zonas seguras:** respeta el inset inferior del dispositivo.

## Permisos y privacidad

La app no solicita ubicación, cámara, micrófono, contactos ni almacenamiento. La lectura en voz alta usa el motor de síntesis del sistema y no necesita permiso de micrófono. El selector de compartir y la respuesta háptica no requieren permisos peligrosos.

El HTML actual carga tipografías desde Google Fonts; por ello el wrapper necesita acceso a Internet para esas fuentes. El permiso `INTERNET` de Android es normal y se declara en el manifiesto generado por Capacitor. No se habilita tráfico HTTP sin cifrar.

El APK de depuración sirve para pruebas. Para distribuir una versión de producción, hay que configurar la firma de lanzamiento de forma segura mediante secretos de GitHub y generar un APK/AAB firmado.
