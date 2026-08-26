# Guía de Publicación en Google Play Store - Legado de Vida

Esta guía detalla los pasos específicos para llevar tu aplicación a la tienda de Google.

## 1. Requisitos Previos
*   **Google Play Console**: Debes tener una cuenta de desarrollador ($25 USD pago único).
*   **Android Studio**: Instalado en tu computadora local.

## 2. Configuración de Permisos (Crítico)
Para que la grabación de voz funcione en Android, debes asegurarte de que el archivo `android/app/src/main/AndroidManifest.xml` incluya estos permisos:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

## 3. Pasos Técnicos Locales
Ejecuta estos comandos en tu terminal local después de descargar el código:

1.  **Instalar dependencias**:
    `npm install`
2.  **Construir el proyecto web**:
    `npm run build`
3.  **Agregar la plataforma Android**:
    `npx cap add android`
4.  **Sincronizar cambios**:
    `npx cap sync android`
5.  **Abrir en Android Studio**:
    `npx cap open android`

## 4. Generar el App Bundle (.aab)
Dentro de Android Studio:
1.  Ve a **Build > Generate Signed Bundle / APK...**
2.  Selecciona **Android App Bundle** y presiona Next.
3.  Crea un nuevo **Key Store** (guarda este archivo y la contraseña en un lugar seguro, los necesitarás para todas las actualizaciones futuras).
4.  Selecciona la variante de construcción **release**.
5.  El archivo `.aab` resultante se encuentra en `android/app/release/app-release.aab`.

## 5. Subida a la Consola
1.  Crea una nueva aplicación en [Google Play Console](https://play.google.com/console).
2.  Completa la "Ficha de Play Store" (descripción, capturas de pantalla, iconos).
3.  En **Producción**, crea un nuevo lanzamiento y sube el archivo `.aab`.
4.  Completa el cuestionario de clasificación de contenido y la declaración de privacidad.
    *   **Importante**: Google Play requiere un enlace a una **Política de Privacidad**. He creado un archivo `PRIVACY_POLICY.md` en la raíz que puedes subir a un sitio web (como GitHub Pages o [...])

## 6. Iconos y Pantalla de Inicio
Usa la herramienta `@capacitor/assets` para generar automáticamente todos los tamaños de iconos:
`npx @capacitor/assets generate --android`
