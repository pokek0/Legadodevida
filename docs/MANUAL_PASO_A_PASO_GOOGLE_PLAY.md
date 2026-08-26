# 📘 Manual Paso a Paso: Publicación en Google Play Store
## Aplicación: Legado de Vida

Este manual detalla el proceso exacto para convertir tu aplicación web en una aplicación de Android y publicarla en la tienda oficial de Google.

---

### 📂 Fase 1: Preparación de Archivos (Checklist)
Antes de empezar, asegúrate de tener estos archivos listos en tu computadora:

1.  **Icono de la App**: Un archivo cuadrado de `1024x1024 px` (PNG).
2.  **Imagen de Portada (Feature Graphic)**: `1024x500 px` (PNG/JPG).
3.  **Capturas de Pantalla**: Al menos 4 capturas de la app funcionando (puedes tomarlas desde el navegador o el simulador).
4.  **Política de Privacidad**: El archivo `PRIVACY_POLICY.md` (puedes hospedarlo gratis en Google Sites o GitHub Gist).
5.  **Archivo de Firma (Keystore)**: Se generará en el Paso 4. **¡No lo pierdas!**

---

### 🛠 Fase 2: Configuración Técnica (Capacitor)
Sigue estos pasos en tu terminal local (donde tienes el código):

1.  **Instalar Capacitor Assets** (para generar iconos automáticamente):
    ```bash
    npm install -D @capacitor/assets
    ```
2.  **Construir la versión de producción**:
    ```bash
    npm run build
    ```
3.  **Agregar plataforma Android**:
    ```bash
    npx cap add android
    ```
4.  **Sincronizar el código con Android**:
    ```bash
    npx cap sync android
    ```

---

### 📱 Fase 3: Android Studio y Permisos
1.  **Abrir el proyecto**:
    ```bash
    npx cap open android
    ```
2.  **Configurar Permisos de Micrófono**:
    Abre el archivo `android/app/src/main/AndroidManifest.xml` y añade estas líneas antes de la etiqueta `<application>`:
    ```xml
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    ```
3.  **Cambiar el Nombre del Paquete (Opcional)**:
    Si quieres cambiar `com.memoriaviva.libro`, hazlo en `capacitor.config.ts` antes del paso 3 de la Fase 2.

---

### 🔐 Fase 4: Generar el archivo .AAB (El archivo que se sube)
Dentro de **Android Studio**:
1.  Ve al menú superior: **Build > Generate Signed Bundle / APK...**
2.  Selecciona **Android App Bundle** y dale a *Next*.
3.  **Key store path**: Dale a *Create new...*
    *   Elige una ubicación segura.
    *   Pon una contraseña fuerte (y anótala).
    *   Completa los datos del certificado (Nombre, Organización, etc.).
4.  Selecciona **release** como variante de construcción.
5.  Al finalizar, Android Studio te mostrará una carpeta con el archivo: `app-release.aab`. **Este es el archivo que subirás a Google.**

---

### 🚀 Fase 5: Google Play Console (La Subida)
1.  **Cuenta de Desarrollador**: Entra en [Google Play Console](https://play.google.com/console) (requiere pago único de $25).
2.  **Crear App**: Haz clic en "Crear aplicación" y pon el nombre "El Libro de mi Vida".
3.  **Configuración de la App**: Completa todas las tareas obligatorias:
    *   **Clasificación de contenido**: Responde el cuestionario (es una app de utilidad/estilo de vida).
    *   **Acceso a la app**: Indica que todas las funciones están disponibles sin restricciones.
    *   **Privacidad**: Pega el enlace a tu Política de Privacidad (usa una URL gratuita si no tienes dominio, como se explica en la Fase 1).
4.  **Ficha de Play Store**: Sube el icono, la imagen de portada y las capturas que preparaste en la Fase 1.
5.  **Producción**: 
    *   Ve a "Producción" en el menú lateral.
    *   Crea un "Nuevo lanzamiento".
    *   Sube el archivo `app-release.aab`.
    *   Dale a "Revisar lanzamiento" y luego a "Iniciar lanzamiento a producción".

---

### 💾 Fase 6: Respaldo y Exportación (Sistema de Ajustes)
La aplicación incluye un sistema de seguridad para que el usuario no pierda sus datos, ya que estos se guardan **localmente** por privacidad.

1.  **Copia de Seguridad**: En la sección de **Ajustes**, puedes descargar un archivo `.json`. 
    *   Recomienda a tus usuarios que hagan esto periódicamente.
    *   Si el usuario cambia de teléfono, puede subir este archivo en su nuevo dispositivo para recuperar todas sus grabaciones.
2.  **Exportación de Texto**: Una vez generado el libro, el usuario puede exportar el relato completo como un archivo de texto plano (`.txt`).
3.  **Compartir**: Se pueden compartir fragmentos del libro directamente a WhatsApp o Redes Sociales mediante el botón de "Compartir".

---

### 🧠 Fase 7: Inteligencia Artificial (Gemini API)
Tu aplicación utiliza **Google Gemini** para redactar el libro.
1.  **API Key**: Asegúrate de tener la variable `GEMINI_API_KEY` disponible en el entorno donde despliegues.
2.  **Modelo**: La app usa `gemini-3.1-pro-preview` para una redacción de nivel literario.

---

### 💡 Consejos Finales
*   **Pruebas Internas**: Antes de lanzar a producción, usa la opción "Pruebas internas" en la consola para probar la app en tu propio teléfono.
*   **Actualizaciones**: Cada vez que hagas un cambio en el código, ejecuta:
    `npm run build && npx cap copy android`
    Luego genera un nuevo `.aab` en Android Studio subiendo la versión en el archivo `build.gradle`.
