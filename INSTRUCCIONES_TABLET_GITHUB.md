# 📱 Cómo compilar e instalar tu App desde tu Tablet con GitHub

Con la automatización que acabamos de agregar (**GitHub Actions**), no necesitas una computadora con Android Studio. Los servidores de GitHub compilarán la aplicación por ti en la nube.

---

### Paso 1: Exportar tu App a GitHub desde esta pantalla
1. En el menú superior o de ajustes de **Google AI Studio**, haz clic en **Export** o **Exportar a GitHub**.
2. Conecta tu cuenta de GitHub y confirma la creación del repositorio.

---

### Paso 2: Compilación automática en la nube
1. Una vez exportado, abre tu navegador en la tablet y ve a tu repositorio en [github.com](https://github.com).
2. Entra en la pestaña superior que dice **Actions** (Acciones).
3. Verás que se inicia automáticamente una tarea llamada **"Compilar Android (APK y AAB)"**.
4. Espera aproximadamente 3 a 5 minutos mientras GitHub construye la app. Cuando termine, se marcará con una palomita verde (✅).

---

### Paso 3: Descargar el archivo a tu Tablet
1. Toca sobre la ejecución completada en la pestaña **Actions**.
2. Al final de la página verás la sección **Artifacts** (Artefactos):
   * 📲 **Legado-de-Vida-APK-Instalador**: Es el archivo instalador `.apk` que puedes descargar e instalar directamente en tu tablet o celular Android para probar la app.
   * 📦 **Legado-de-Vida-AAB-GooglePlay**: Es el archivo `.aab` listo para subir a la **Google Play Console** cuando vayas a publicar la app en la tienda oficial.
