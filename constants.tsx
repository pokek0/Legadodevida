
import React from 'react';
import { Heart, Star, Sun, Anchor, Feather } from 'lucide-react';
import { Chapter } from './types';

// Esta URL es para los botones de compartir. Si no tienes dominio, puedes usar la URL donde hospedes tu app (ej: GitHub Pages o Firebase)
export const APP_URL = typeof window !== 'undefined' ? window.location.origin : '';

export const CHAPTERS: Chapter[] = [
  {
    id: 'infancia',
    title: 'Mi Niñez',
    subtitle: 'Raíces, juegos y familia',
    icon: (props?: { size?: number; className?: string }) => (
      <img
        src="/images/chapter_infancia.png"
        alt="Mi Niñez"
        style={props?.size ? { width: props.size, height: props.size, maxWidth: '100%', maxHeight: '100%' } : undefined}
        className={`w-full h-full max-w-full max-h-full object-contain rounded-2xl ${props?.className || ''}`}
        referrerPolicy="no-referrer"
      />
    ),
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    questions: [
      { id: 'i1', text: '¿Cuál es tu primer recuerdo de cuando eras muy niño?' },
      { id: 'i2', text: '¿A qué jugabas con tus amigos en la calle o en casa?' },
      { id: 'i3', text: '¿Tenías alguna mascota especial?' },
      { id: 'i4', text: '¿Cuál era tu comida favorita que preparaban en casa?' },
      { id: 'i5', text: '¿Hiciste alguna travesura famosa que nunca olvidaste?' },
      { id: 'i6', text: 'Háblame de tu mamá: su voz, sus abrazos, ¿cómo era ella?' },
      { id: 'i7', text: 'Háblame de tu papá: ¿qué aprendiste de él mirándolo?' },
      { id: 'i8', text: '¿Cómo te llevabas con tus hermanos? ¿Peleaban mucho?' },
      { id: 'i9', text: '¿Cuál fue un momento triste o difícil que viviste de niño?' },
      { id: 'i_final', text: 'ANÉCDOTA: Cuéntame esa historia de niño que siempre cuentas en las fiestas.', isAnecdote: true },
    ]
  },
  {
    id: 'juventud',
    title: 'Mi Juventud',
    subtitle: 'Amores, trabajo y descubrimientos',
    icon: (props?: { size?: number; className?: string }) => (
      <img
        src="/images/chapter_juventud.png"
        alt="Mi Juventud"
        style={props?.size ? { width: props.size, height: props.size, maxWidth: '100%', maxHeight: '100%' } : undefined}
        className={`w-full h-full max-w-full max-h-full object-contain rounded-2xl ${props?.className || ''}`}
        referrerPolicy="no-referrer"
      />
    ),
    color: 'bg-sky-100 text-sky-900 border-sky-300',
    questions: [
      { id: 'j1', text: '¿Cuál fue tu primer trabajo y qué hacías con tu primer sueldo?' },
      { id: 'j2', text: '¿Qué música te gustaba bailar o escuchar en esa época?' },
      { id: 'j3', text: '¿Cómo celebraste tu mayoría de edad (o tus 15/18 años)?' },
      { id: 'j4', text: '¿Quién fue tu primer amor o ilusión?' },
      { id: 'j5', text: '¿Tuviste alguna decepción amorosa o de amistad que te dolió?' },
      { id: 'j6', text: '¿Cómo eran las fiestas o reuniones familiares en aquellos tiempos?' },
      { id: 'j7', text: '¿Cuándo sentiste que dejaste de ser niño y te hiciste hombre?' },
      { id: 'j_final', text: 'ANÉCDOTA: Cuéntame una aventura o locura de juventud que te marcó.', isAnecdote: true },
    ]
  },
  {
    id: 'adultez',
    title: 'La Adultez',
    subtitle: 'Construyendo mi propio camino',
    icon: (props?: { size?: number; className?: string }) => (
      <img
        src="/images/chapter_adultez.png"
        alt="La Adultez"
        style={props?.size ? { width: props.size, height: props.size, maxWidth: '100%', maxHeight: '100%' } : undefined}
        className={`w-full h-full max-w-full max-h-full object-contain rounded-2xl ${props?.className || ''}`}
        referrerPolicy="no-referrer"
      />
    ),
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    questions: [
      { id: 'a1', text: '¿Cómo conociste a tu pareja de vida?' },
      { id: 'a2', text: 'Si tuviste hijos, ¿qué sentiste al verlos nacer por primera vez?' },
      { id: 'a3', text: 'Háblame del día más feliz que viviste con nosotros (tu familia).' },
      { id: 'a4', text: '¿Cuál consideras que fue tu mayor logro profesional o personal?' },
      { id: 'a5', text: '¿Cuál fue el desafío o crisis más grande que enfrentaste para sacar adelante a la familia?' },
      { id: 'a6', text: '¿Qué momento histórico viviste que te impactó más?' },
      { id: 'a_final', text: 'ANÉCDOTA: Esa historia de "lucha y esfuerzo" que te define.', isAnecdote: true },
    ]
  },
  {
    id: 'legado',
    title: 'Sabiduría y Legado',
    subtitle: 'Mis pensamientos para ustedes',
    icon: (props?: { size?: number; className?: string }) => (
      <img
        src="/images/chapter_legado.png"
        alt="Sabiduría y Legado"
        style={props?.size ? { width: props.size, height: props.size, maxWidth: '100%', maxHeight: '100%' } : undefined}
        className={`w-full h-full max-w-full max-h-full object-contain rounded-2xl ${props?.className || ''}`}
        referrerPolicy="no-referrer"
      />
    ),
    color: 'bg-rose-100 text-rose-900 border-rose-300',
    questions: [
      { id: 's1', text: '¿Qué consejo le darías a tu "yo" de 20 años?' },
      { id: 's2', text: '¿Qué es lo que que más valoras hoy en día?' },
      { id: 's3', text: '¿Qué es lo que más extrañas de tus padres ahora que tienes esta edad?' },
      { id: 's4', text: '¿Hay algo de lo que te arrepientas o quisieras haber hecho diferente?' },
      { id: 's5', text: '¿Qué le dirías a tus nietos o bisnietos que escucharán esto en el futuro?' },
      { id: 's6', text: '¿Cómo te gustaría que te recordáramos siempre?' },
      { id: 's_final', text: 'ANÉCDOTA FINAL: Tu historia favorita de toda la vida.', isAnecdote: true },
    ]
  }
];

export const TRIGGER_QUESTIONS: Record<string, string[]> = {
  infancia: [
    "¿Cómo era la casa donde creciste y cuál era tu rincón favorito de ella?",
    "¿A qué jugabas en la calle con tus amigos o hermanos cuando eras niño?",
    "Cuéntame de tus abuelos, ¿qué es lo que más recuerdas de ellos?"
  ],
  juventud: [
    "¿Cómo fue tu primer día de trabajo y qué hiciste con tu primer sueldo?",
    "¿Cómo conociste a mamá? Cuéntame los detalles de esa primera vez.",
    "¿Qué música escuchabas de joven y en dónde se reunían para bailar o platicar?"
  ],
  adultez: [
    "¿Cuál ha sido el desafío más grande que enfrentaste y cómo lograste salir adelante?",
    "Si pudieras volver a un día de tu etapa de mayor trabajo, ¿cuál elegirías?"
  ],
  legado: [
    "¿Qué consejo le darías a tus nietos hoy mismo si estuvieran frente a ti?",
    "¿Cuál es el invento o cambio en el mundo que más te ha sorprendido ver en estos 80 años?"
  ]
};
