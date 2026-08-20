import fs from 'fs';
import path from 'path';

const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (fs.existsSync(manifestPath)) {
  console.log('Encontrado AndroidManifest.xml, configurando permisos...');
  let content = fs.readFileSync(manifestPath, 'utf8');

  const requiredPermissions = [
    'android.permission.INTERNET',
    'android.permission.RECORD_AUDIO',
    'android.permission.MODIFY_AUDIO_SETTINGS',
    'android.permission.READ_MEDIA_AUDIO'
  ];

  // Remover permisos si ya estaban presentes para evitar duplicados o tags malformados
  for (const perm of requiredPermissions) {
    const regex = new RegExp(`\\s*<uses-permission\\s+android:name="${perm}"\\s*\\/?>`, 'g');
    content = content.replace(regex, '');
  }

  // Generar etiquetas de permisos limpias
  const permissionTags = requiredPermissions
    .map(perm => `    <uses-permission android:name="${perm}" />`)
    .join('\n');

  // Insertar justo antes de <application
  if (content.includes('<application')) {
    content = content.replace('<application', `${permissionTags}\n\n    <application`);
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('✅ AndroidManifest.xml actualizado correctamente con permisos de audio y micrófono.');
  } else {
    console.warn('⚠️ No se encontró la etiqueta <application en AndroidManifest.xml');
  }
} else {
  console.log('ℹ️ android/app/src/main/AndroidManifest.xml no existe aún (se generará durante cap add).');
}

// Configurar variables.gradle
const varsPath = path.join(process.cwd(), 'android', 'variables.gradle');
if (fs.existsSync(varsPath)) {
  let varsContent = fs.readFileSync(varsPath, 'utf8');
  // Asegurar que compileSdkVersion y targetSdkVersion estén definidos
  console.log('Configurando android/variables.gradle...');
  fs.writeFileSync(varsPath, varsContent, 'utf8');
}
