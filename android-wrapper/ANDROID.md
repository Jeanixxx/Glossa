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

- **Biblioteca y búsqueda:** filtro local por título, fuente, idioma y tema, con acceso a búsqueda de bibliotecas públicas.
- **Importación local:** importa archivos `.txt` de hasta 1 MB desde el selector de Android y conserva el contenido en el almacenamiento local para poder abrirlo después. PDF y EPUB quedan como siguiente ampliación.
- **Cuaderno de lectura:** crea, edita y elimina notas vinculadas a libros; las notas se conservan en el almacenamiento local del dispositivo.
- **Racha de lectura:** registra los días de actividad, la racha actual, el récord personal y una vista semanal.
- **Modo sin conexión:** el progreso, vocabulario y notas se conservan localmente; los libros externos descargados y las traducciones ya preparadas pueden reutilizarse sin red. La búsqueda de nuevas lecturas y las traducciones no guardadas requieren conexión.
- **Compartir lectura:** abre el selector nativo de compartir Android.
- **Lectura en voz alta:** utiliza Speech Synthesis del WebView y las voces instaladas en Android.
- **Respuesta háptica:** usa el plugin de vibración/háptica de Capacitor al pulsar acciones.
- **Diseño adaptable a zonas seguras:** respeta el inset inferior del dispositivo.

El archivo `enhancements.js` se copia a los activos públicos de Vite durante la preparación web y añade las funciones conectadas a la interfaz existente.

## Permisos y privacidad

La app no solicita ubicación, cámara, micrófono, contactos ni almacenamiento. La lectura en voz alta usa el motor de síntesis del sistema y no necesita permiso de micrófono. El selector de compartir y la respuesta háptica no requieren permisos peligrosos.

El HTML actual carga tipografías desde Google Fonts; por ello el wrapper necesita acceso a Internet para esas fuentes. El permiso `INTERNET` de Android es normal y se declara en el manifiesto generado por Capacitor. No se habilita tráfico HTTP sin cifrar.

El APK de depuración sirve para pruebas. Para distribuir una versión de producción, hay que configurar la firma de lanzamiento de forma segura mediante secretos de GitHub y generar un APK/AAB firmado.
