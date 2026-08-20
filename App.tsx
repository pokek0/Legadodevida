

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause, Trash2, ChevronRight, ArrowLeft, CheckCircle, Feather, Volume2, VolumeX, BookOpen, Headphones, Loader2, Share2, ShieldCheck, PenTool, Download, Printer, Crown, Star, CreditCard, Lock, Image as ImageIcon, MessageSquare, Camera, ArrowUpCircle, Settings, Search, X } from 'lucide-react';
import { CHAPTERS, TRIGGER_QUESTIONS, APP_URL } from './constants';
import { Chapter, Question, Recordings, CurrentView, CoverConfig, CoverTemplate, BookTone } from './types';
import { GoogleGenAI, Modality } from "@google/genai";
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { audioStorage, draftStorage } from './src/services/storage';
import appLogo from './src/assets/logo.png';

// Placeholder for background music file path
// IMPORTANT: Replace this with the actual path to your background music file (e.g., '/audio/background_music.mp3')
const BACKGROUND_MUSIC_PATH = '/path/to/your/background_music.mp3';

export default function App(): React.ReactElement {
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    const saved = localStorage.getItem('isPremium');
    return saved === 'true';
  });
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [recordings, setRecordings] = useState<Recordings>({});
  const [dedication, setDedication] = useState<string | null>(null);
  const [coverConfig, setCoverConfig] = useState<CoverConfig>({ tone: 'classic', template: 'option1' });
  const [chapterImages, setChapterImages] = useState<Record<string, string>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [draftRecordings, setDraftRecordings] = useState<Recordings>({}); // New state for draft recordings
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query for filtering chapters/questions

  // Load recordings and drafts from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedRecordings = await audioStorage.getAll();
        setRecordings(savedRecordings);
        
        const savedDrafts = await draftStorage.getAll();
        setDraftRecordings(savedDrafts);
      } catch (e) {
        console.error("Failed to load recordings from IndexedDB", e);
      }
    };
    loadData();

    const savedDedication = localStorage.getItem('memoriaVivaDedication');
    if (savedDedication) setDedication(savedDedication);

    const savedCover = localStorage.getItem('memoriaVivaCoverConfig');
    if (savedCover) {
      try {
        setCoverConfig(JSON.parse(savedCover));
      } catch (e) {
        console.error("Failed to parse cover config", e);
      }
    }

    const savedChapterImages = localStorage.getItem('memoriaVivaChapterImages');
    if (savedChapterImages) {
      try {
        setChapterImages(JSON.parse(savedChapterImages));
      } catch (e) {
        console.error("Failed to parse chapter images", e);
      }
    }

    const hasSeenOnboarding = localStorage.getItem('memoriaVivaOnboardingSeen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []); // Run once on mount

  // Save dedication and coverConfig to localStorage
  useEffect(() => {
    if (dedication) {
      localStorage.setItem('memoriaVivaDedication', dedication);
    } else {
      localStorage.removeItem('memoriaVivaDedication');
    }
    localStorage.setItem('memoriaVivaCoverConfig', JSON.stringify(coverConfig));
    localStorage.setItem('memoriaVivaChapterImages', JSON.stringify(chapterImages));
  }, [dedication, coverConfig, chapterImages]);

  const finishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('memoriaVivaOnboardingSeen', 'true');
  };

  // FIX: Moved `deleteDraftRecording` before `saveRecordingData` to resolve "used before its declaration" error.
  const deleteDraftRecording = useCallback(async (questionId: string) => {
    const newDraftRecordings: Recordings = { ...draftRecordings };
    delete newDraftRecordings[questionId];
    setDraftRecordings(newDraftRecordings);
    await draftStorage.delete(questionId);
  }, [draftRecordings]);

  // FIX: `deleteDraftRecording` is now defined before this `useCallback`.
  const saveRecordingData = useCallback(async (questionId: string, audioData: string) => {
    const newRecordings: Recordings = { ...recordings, [questionId]: audioData };
    setRecordings(newRecordings);
    await audioStorage.save(questionId, audioData);
    await deleteDraftRecording(questionId); // Clear draft if permanently saved
  }, [recordings, deleteDraftRecording]); // Added deleteDraftRecording to dependencies

  const deleteRecording = useCallback(async (questionId: string) => {
    const newRecordings: Recordings = { ...recordings };
    delete newRecordings[questionId];
    setRecordings(newRecordings);
    await audioStorage.delete(questionId);
  }, [recordings]);

  // New functions for draft management
  const saveDraftRecordingData = useCallback(async (questionId: string, audioData: string) => {
    const newDraftRecordings: Recordings = { ...draftRecordings, [questionId]: audioData };
    setDraftRecordings(newDraftRecordings);
    await draftStorage.save(questionId, audioData);
  }, [draftRecordings]);


  const goToChapter = useCallback((chapter: Chapter) => { setActiveChapter(chapter); setCurrentView('chapter'); }, []);
  const goToRecorder = useCallback((question: Question) => { setActiveQuestion(question); setCurrentView('recorder'); }, []);
  const goHome = useCallback(() => { setCurrentView('home'); setActiveChapter(null); }, []);
  const goBackToChapter = useCallback(() => { setCurrentView('chapter'); setActiveQuestion(null); }, []);
  const goToExplanation = useCallback(() => { setCurrentView('explanation'); }, []); // New navigation function
  const goToAudiobook = useCallback(() => { setCurrentView('audiobook'); }, []);
  const goToPrivacy = useCallback(() => { setCurrentView('privacy'); }, []);
  const goToBook = useCallback(() => { setCurrentView('book'); }, []);
  const goToPremium = useCallback(() => { setCurrentView('premium'); }, []);
  const goToCoverConfig = useCallback(() => { setCurrentView('cover_config'); }, []);
  const goToSettings = useCallback(() => { setCurrentView('settings'); }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Legado de Vida',
          text: 'Estoy grabando mis memorias en esta app. ¡Deberías probarla!',
          url: APP_URL,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(APP_URL);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleExportBackup = async () => {
    try {
      const allRecordings = await audioStorage.getAll();
      const allDrafts = await draftStorage.getAll();
      const data = {
        recordings: allRecordings,
        drafts: allDrafts,
        metadata: {
          dedication,
          coverConfig,
          chapterImages,
          isPremium,
          onboardingSeen: localStorage.getItem('memoriaVivaOnboardingSeen') === 'true'
        },
        version: "1.0",
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MemoriaViva_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export backup error:", error);
      alert("Error al exportar la copia de seguridad.");
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Esta acción reemplazará todos tus datos actuales con los de la copia de seguridad. ¿Deseas continuar?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Restore meta to localStorage
        if (data.metadata) {
          const m = data.metadata;
          if (m.dedication !== undefined) localStorage.setItem('memoriaVivaDedication', m.dedication);
          if (m.coverConfig) localStorage.setItem('memoriaVivaCoverConfig', JSON.stringify(m.coverConfig));
          if (m.chapterImages) localStorage.setItem('memoriaVivaChapterImages', JSON.stringify(m.chapterImages));
          if (m.isPremium !== undefined) localStorage.setItem('memoriaVivaIsPremium', String(m.isPremium));
          if (m.onboardingSeen !== undefined) localStorage.setItem('memoriaVivaOnboardingSeen', String(m.onboardingSeen));
        }

        // Clear current first
        await audioStorage.clearAll();
        await draftStorage.clearAll();
        
        // Restore recordings
        if (data.recordings) {
          for (const [id, audio] of Object.entries(data.recordings)) {
            await audioStorage.save(id, audio as string);
          }
        }
        
        // Restore drafts
        if (data.drafts) {
          for (const [id, audio] of Object.entries(data.drafts)) {
            await draftStorage.save(id, audio as string);
          }
        }

        alert("Copia de seguridad restaurada con éxito. La aplicación se reiniciará.");
        window.location.reload();
      } catch (error) {
        console.error("Import backup error:", error);
        alert("Error al importar. El archivo puede no ser válido.");
      }
    };
    reader.readAsText(file);
  };

  const OnboardingView = (): React.ReactElement => {
    const [step, setStep] = useState(0);
    const steps = [
      {
        title: "Bienvenido a tu Legado",
        description: "Esta aplicación te ayudará a capturar tus historias más valiosas para que nunca se olviden.",
        icon: <BookOpen size={80} className="text-amber-500" />,
        color: "bg-amber-50"
      },
      {
        title: "Graba tu Voz",
        description: "Responde a preguntas sobre tu vida. Tu voz es el regalo más grande para tus seres queridos.",
        icon: <Mic size={80} className="text-brand-blue" />,
        color: "bg-brand-blue/10"
      },
      {
        title: "Crea un Libro Real",
        description: "Nuestra IA transformará tus grabaciones en un libro escrito con fotos y dedicatorias.",
        icon: <PenTool size={80} className="text-emerald-500" />,
        color: "bg-emerald-50"
      }
    ];

    const currentStep = steps[step];

    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 md:p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={step}
          className="max-w-md w-full"
        >
          <div className={`w-28 h-28 md:w-32 md:h-32 ${currentStep.color} rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner`}>
            {step === 0 && <BookOpen size={64} className="text-amber-500" />}
            {step === 1 && <Mic size={64} className="text-brand-blue" />}
            {step === 2 && <PenTool size={64} className="text-emerald-500" />}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-stone-800 mb-4 leading-tight">{currentStep.title}</h2>
          <p className="text-lg md:text-xl text-stone-500 mb-8 md:mb-12 leading-relaxed">{currentStep.description}</p>
          
          <div className="flex gap-2 justify-center mb-8 md:mb-12">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-stone-800' : 'w-2 bg-stone-200'}`} />
            ))}
          </div>

          <button
            onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : finishOnboarding()}
            className="w-full bg-stone-800 text-white py-5 md:py-6 rounded-3xl text-xl md:text-2xl font-bold shadow-xl hover:bg-stone-900 active:scale-95 transition-all"
          >
            {step < steps.length - 1 ? 'Siguiente' : 'Comenzar mi Historia'}
          </button>
        </motion.div>
      </div>
    );
  };

  const HomeView = (): React.ReactElement => {
    const totalQuestionsCount = CHAPTERS.reduce((acc, c) => acc + c.questions.length, 0);
    const totalAnsweredCount = CHAPTERS.flatMap(c => c.questions).filter(q => recordings[q.id]).length;
    const globalPercentage = totalQuestionsCount > 0 ? Math.round((totalAnsweredCount / totalQuestionsCount) * 100) : 0;

    const filteredChapters = CHAPTERS.map(chapter => {
      const chapterMatches = 
        chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchingQuestions = chapter.questions.filter(question =>
        question.text.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        ...chapter,
        chapterMatches,
        matchingQuestions,
        hasMatches: chapterMatches || matchingQuestions.length > 0
      };
    }).filter(c => c.hasMatches);

    return (
      <div className="pb-10">
        <header className="text-center mb-8 bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-md border-2 border-stone-100 flex flex-col items-center max-w-full overflow-hidden">
          <img 
            src={appLogo} 
            alt="Legado de Vida Logo" 
            className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-3xl mb-4 shadow-sm object-contain border-4 border-stone-50 bg-white max-w-full" 
            referrerPolicy="no-referrer" 
          />
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-normal text-brand-blue mb-1 font-display leading-tight break-words max-w-full px-2">
            Legado de Vida
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-stone-500 font-semibold font-sans">
            Para mi familia, con amor.
          </p>
        </header>

        {/* Global Progress Bar */}
        <div className="bg-gradient-to-br from-stone-50 to-brand-blue/5 border-2 border-brand-blue/10 rounded-3xl p-6 mb-8 shadow-sm flex flex-col gap-3" id="global-progress-card">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue">
                <Mic size={20} />
              </span>
              <h3 className="text-xl font-bold text-stone-700 font-sans">Tu Legado Grabado</h3>
            </div>
            <span className="text-2xl font-black text-brand-blue font-mono">{globalPercentage}%</span>
          </div>
          <div className="w-full bg-stone-200/60 rounded-full h-5 overflow-hidden shadow-inner relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-yellow transition-all duration-1000 ease-out shadow-md"
              style={{ width: `${globalPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            </div>
          </div>
          <p className="text-stone-500 font-semibold text-center mt-1 text-sm md:text-base">
            Has completado <span className="text-brand-blue font-bold">{totalAnsweredCount}</span> de <span className="text-stone-700 font-bold">{totalQuestionsCount}</span> historias posibles. ¡Sigue narrando tus recuerdos más preciados!
          </p>
        </div>

        {/* New button to access explanation view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={goToExplanation}
            className="bg-brand-blue text-white px-6 py-4 rounded-3xl shadow-lg hover:bg-brand-blue-hover active:scale-95 transition-all text-xl md:text-2xl font-bold flex items-center justify-center gap-3"
            aria-label="Cómo funciona la aplicación"
          >
            <BookOpen size={28} />
            Cómo funciona
          </button>

          <button
            onClick={isPremium ? goToAudiobook : goToPremium}
            className={`${isPremium ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-stone-200 text-stone-500'} text-white px-6 py-4 rounded-3xl shadow-lg active:scale-95 transition-all text-xl md:text-2xl font-bold flex items-center justify-center gap-3 relative overflow-hidden`}
            aria-label="Audiolibro Narrado"
          >
            <Headphones size={28} />
            Audiolibro Narrado
            {!isPremium && <Lock size={18} className="absolute top-2 right-4 opacity-50" />}
          </button>

          <button
            onClick={isPremium ? goToBook : goToPremium}
            className={`${isPremium ? 'bg-amber-600 hover:bg-amber-700' : 'bg-stone-200 text-stone-500'} text-white px-6 py-4 rounded-3xl shadow-lg active:scale-95 transition-all text-xl md:text-2xl font-bold flex items-center justify-center gap-3 relative overflow-hidden`}
            aria-label="Escribir mi legado"
          >
            <PenTool size={28} />
            Escribir mi Legado
            {!isPremium && <Lock size={18} className="absolute top-2 right-4 opacity-50" />}
          </button>

          {!isPremium && (
            <button
              onClick={goToPremium}
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-4 rounded-3xl shadow-xl hover:from-amber-500 hover:to-orange-600 active:scale-95 transition-all text-lg md:text-xl font-black flex items-center justify-center gap-3 animate-pulse-slow"
            >
              <Crown size={24} />
              DESBLOQUEAR PREMIUM
            </button>
          )}

          {isPremium && (
            <button
              onClick={goToCoverConfig}
              className="bg-stone-800 text-white px-6 py-4 rounded-3xl shadow-lg hover:bg-stone-900 active:scale-95 transition-all text-lg md:text-xl font-bold flex items-center justify-center gap-3"
            >
              <ImageIcon size={24} />
              Portada y Dedicatoria
            </button>
          )}

          <button
            onClick={goToSettings}
            className="bg-stone-100 text-stone-600 px-6 py-4 rounded-3xl border border-stone-200 hover:bg-stone-200 active:scale-95 transition-all text-lg md:text-xl font-bold flex items-center justify-center gap-3"
          >
            <Settings size={24} />
            Ajustes
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <button
            onClick={handleShare}
            className="w-full bg-stone-100 text-stone-600 px-8 py-4 rounded-3xl border border-stone-200 hover:bg-stone-200 active:scale-95 transition-all text-xl font-bold flex items-center justify-center gap-3"
          >
            <Share2 size={24} />
            Compartir App
          </button>

          <button
            onClick={goToPrivacy}
            className="text-stone-400 text-sm hover:underline self-center"
          >
            Política de Privacidad
          </button>
        </div>

        {/* Buscador de Capítulos y Preguntas */}
        <div className="mb-8 relative" id="chapter-search-container">
          <div className="relative flex items-center">
            <Search size={22} className="absolute left-5 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por capítulos, preguntas o temas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-stone-800 text-lg md:text-xl pl-14 pr-12 py-4 md:py-5 rounded-3xl shadow-sm border-2 border-stone-100 focus:outline-none focus:border-stone-300 transition-all placeholder-stone-400 font-medium animate-none"
              id="chapter-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 p-1 rounded-full bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                title="Limpiar búsqueda"
                id="clear-search-button"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-stone-500 text-sm mt-3 ml-4 font-medium">
              Mostrando resultados para "{searchQuery}"
            </p>
          )}
        </div>

        <div className="grid gap-6">
          {filteredChapters.length === 0 ? (
            <div 
              className="text-center py-16 bg-white rounded-3xl shadow-md border-2 border-stone-100 p-8"
              id="no-search-results"
            >
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                <Search size={36} />
              </div>
              <h3 className="text-2xl font-bold text-stone-700 mb-2 font-sans">No se encontraron resultados</h3>
              <p className="text-stone-500 text-lg max-w-md mx-auto mb-6">
                No pudimos encontrar capítulos o preguntas que coincidan con "<span className="font-semibold">{searchQuery}</span>". Intenta con otra palabra clave.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-stone-800 text-white px-6 py-3 rounded-full text-lg font-bold shadow-md hover:bg-stone-900 transition-all active:scale-95"
                id="reset-search-button"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            filteredChapters.map((chapter) => {
              const totalQ = chapter.questions.length;
              const answeredQ = chapter.questions.filter(q => recordings[q.id]).length;
              const isComplete = totalQ === answeredQ;

              return (
                <div key={chapter.id} className="flex flex-col gap-3" id={`chapter-group-${chapter.id}`}>
                  <button
                    onClick={() => goToChapter(chapter)}
                    className={`w-full p-4 sm:p-6 md:p-8 rounded-3xl shadow-lg active:scale-95 transition-all flex items-center justify-between border-b-8 ${chapter.color} bg-white`}
                    id={`chapter-card-${chapter.id}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-6 text-left w-full min-w-0">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white border border-stone-200/60 rounded-2xl sm:rounded-[2rem] p-1 shrink-0 shadow-inner flex items-center justify-center overflow-hidden">
                        {chapter.icon({ className: "w-full h-full object-contain" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 truncate">{chapter.title}</h2>
                        <p className="text-sm sm:text-lg md:text-xl opacity-70 font-medium truncate">{chapter.subtitle}</p>
                        <div className="mt-4 w-full bg-stone-100 rounded-full h-4 shadow-inner relative overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${(answeredQ / totalQ) * 100}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">
                            {answeredQ} de {totalQ} historias
                          </p>
                          <p className="text-sm font-bold text-stone-800">
                            {Math.round((answeredQ / totalQ) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                       <ChevronRight size={40} className="opacity-40" />
                    </div>
                  </button>

                  {/* Preguntas coincidentes si la búsqueda está activa */}
                  {searchQuery.trim().length > 0 && chapter.matchingQuestions.length > 0 && (
                    <div className="pl-6 pr-2 py-2 flex flex-col gap-2 border-l-4 border-stone-200 ml-6 mt-1" id={`matching-questions-${chapter.id}`}>
                      <p className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-1">Preguntas coincidentes:</p>
                      {chapter.matchingQuestions.map((q: Question) => {
                        const hasRecording = !!recordings[q.id];
                        const hasDraft = !!draftRecordings[q.id];
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setActiveChapter(chapter);
                              goToRecorder(q);
                            }}
                            className={`w-full p-4 rounded-2xl text-left shadow-sm border flex items-center justify-between hover:scale-[1.01] transition-all active:scale-95 bg-white
                              ${hasRecording 
                                ? 'border-green-200 bg-green-50/50 hover:bg-green-50 text-stone-700' 
                                : hasDraft 
                                  ? 'border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-stone-700' 
                                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                              }`}
                            id={`matching-question-${q.id}`}
                          >
                            <div className="flex items-center gap-3 pr-2 min-w-0">
                              {hasRecording ? (
                                <CheckCircle className="text-green-500 shrink-0" size={20} />
                              ) : hasDraft ? (
                                <BookOpen className="text-orange-500 shrink-0" size={20} />
                              ) : (
                                <Mic className="text-stone-400 shrink-0" size={20} />
                              )}
                              <p className="text-base font-semibold truncate">{q.text}</p>
                            </div>
                            <ChevronRight size={18} className="text-stone-400 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const ChapterView = (): React.ReactElement => (
    <div className="pb-10">
      <button
        onClick={goHome}
        className="flex items-center gap-3 text-2xl font-bold text-stone-600 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 active:bg-stone-100 w-full md:w-auto"
      >
        <ArrowLeft size={32} />
        Regresar al Álbum
      </button>

      <div className={`p-6 md:p-8 rounded-3xl mb-8 text-center ${activeChapter?.color} border-none shadow-inner relative overflow-hidden`}>
        {activeChapter && chapterImages[activeChapter.id] && (
          <img 
            src={chapterImages[activeChapter.id]} 
            alt="Fondo" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" 
          />
        )}
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 bg-white border-4 border-white/50 rounded-full p-2 shadow-xl flex items-center justify-center overflow-hidden">
              {activeChapter?.icon({ className: "w-full h-full object-contain" })}
            </div>
          </div>
          <h2 className="text-4xl font-bold text-current">{activeChapter?.title}</h2>
          <p className="text-xl mt-2 opacity-80 font-medium">{activeChapter?.questions.filter(q => recordings[q.id]).length} de {activeChapter?.questions.length} historias contadas</p>
          
          {isPremium && activeChapter && (
            <div className="mt-6 flex flex-col items-center">
              <label className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-current px-4 py-2 rounded-xl cursor-pointer transition-all border border-current/20 backdrop-blur-sm">
                <Camera size={20} />
                <span className="font-bold text-sm">
                  {chapterImages[activeChapter.id] ? 'Cambiar foto del capítulo' : 'Subir foto para este capítulo'}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setChapterImages(prev => ({ ...prev, [activeChapter.id]: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {chapterImages[activeChapter.id] && (
                <button 
                  onClick={() => setChapterImages(prev => {
                    const next = { ...prev };
                    delete next[activeChapter.id];
                    return next;
                  })}
                  className="mt-2 text-xs opacity-60 hover:opacity-100 underline font-bold"
                >
                  Eliminar foto
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5">
        {activeChapter?.questions.map((q: Question) => {
          const hasRecording = !!recordings[q.id];
          const hasDraft = !!draftRecordings[q.id]; // Check for draft
          const isAnecdote = q.isAnecdote;

          return (
            <div
              key={q.id}
              onClick={() => goToRecorder(q)}
              className={`w-full p-6 rounded-2xl text-left shadow-md border-l-8 flex items-center justify-between transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]
                ${hasRecording
                  ? 'bg-green-50 border-green-400 text-stone-600'
                  : hasDraft // If no recording, check for draft
                    ? 'bg-orange-50 border-orange-400 text-orange-800 ring-2 ring-orange-100'
                    : isAnecdote
                      ? 'bg-amber-50 border-amber-400 text-stone-800 ring-2 ring-amber-100'
                      : 'bg-white border-stone-300 text-stone-800'
                }`}
            >
              <div className="flex-1 pr-4">
                {isAnecdote && (
                  <span className="inline-block bg-amber-200 text-amber-900 text-sm font-bold px-3 py-1 rounded-full mb-2">
                    MOMENTO ESPECIAL
                  </span>
                )}
                {hasDraft && !hasRecording && ( // Show draft badge if no permanent recording
                  <span className="inline-block bg-orange-200 text-orange-900 text-sm font-bold px-3 py-1 rounded-full mb-2 mr-2">
                    BORRADOR
                  </span>
                )}
                <p className={`font-medium leading-snug ${isAnecdote ? 'text-2xl italic font-sans' : 'text-2xl'}`}>
                  {q.text}
                </p>
              </div>
              <div className="ml-2 min-w-[3rem] flex items-center gap-3">
                {(hasRecording || hasDraft) && (
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      const type = hasRecording ? 'historia guardada' : 'borrador';
                      if (window.confirm(`¿Estás seguro de que quieres eliminar esta ${type}?`)) {
                        if (hasRecording) {
                          await deleteRecording(q.id);
                        } else {
                          await deleteDraftRecording(q.id);
                        }
                      }
                    }}
                    className="p-3 bg-white/50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-full transition-all border border-transparent hover:border-red-100 shadow-sm"
                    title="Eliminar"
                  >
                    <Trash2 size={24} />
                  </button>
                )}
                
                {hasRecording ? (
                  <CheckCircle className="text-green-500" size={40} />
                ) : hasDraft ? ( // Show draft icon if no permanent recording but there is a draft
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-orange-200`}>
                    <BookOpen className={'text-orange-700'} size={32} />
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isAnecdote ? 'bg-amber-200' : 'bg-stone-100'}`}>
                    <Mic className={isAnecdote ? 'text-amber-700' : 'text-stone-400'} size={32} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const goToNextQuestion = () => {
    if (!activeChapter || !activeQuestion) return;
    const currentIndex = activeChapter.questions.findIndex(q => q.id === activeQuestion.id);
    if (currentIndex < activeChapter.questions.length - 1) {
      setActiveQuestion(activeChapter.questions[currentIndex + 1]);
    } else {
      setCurrentView('chapter');
    }
  };

  const RecorderView = ({ recordings, draftRecordings, saveRecordingData, deleteRecording, saveDraftRecordingData, deleteDraftRecording, goToNextQuestion }: { 
    recordings: Recordings; 
    draftRecordings: Recordings;
    saveRecordingData: (questionId: string, audioData: string) => void; 
    deleteRecording: (questionId: string) => void;
    saveDraftRecordingData: (questionId: string, audioData: string) => void;
    deleteDraftRecording: (questionId: string) => void;
    goToNextQuestion: () => void;
  }): React.ReactElement => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [audioDataForPlayer, setAudioDataForPlayer] = useState<string | null>(null); // The actual audio for the <audio> tag
    const [isCurrentlyDraft, setIsCurrentlyDraft] = useState<boolean>(false); // Is the loaded audio a draft?
    const [timer, setTimer] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const [suggestedQuestion, setSuggestedQuestion] = useState<string | null>(null);
    const [isThinkingSuggestion, setIsThinkingSuggestion] = useState<boolean>(false);

    const handleGetSuggestion = async () => {
      if (!isPremium) {
        goToPremium();
        return;
      }
      const chapterId = activeChapter?.id;
      if (!chapterId || !TRIGGER_QUESTIONS[chapterId]) return;

      setIsThinkingSuggestion(true);
      
      try {
        // If there's already a recording, use Gemini to pick the most coherent question
        const currentRecording = recordings[questionId!] || draftRecordings[questionId!];
        
        if (currentRecording) {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { text: `Eres un entrevistador de historias de vida. El usuario acaba de contar una historia (audio adjunto). Elige la mejor "Pregunta Detonante" de la siguiente lista para que la historia fluya de manera natural. Responde SOLO con el texto de la pregunta elegida.\n\nLista de preguntas:\n${TRIGGER_QUESTIONS[chapterId].join('\n')}` },
                {
                  inlineData: {
                    mimeType: "audio/webm",
                    data: currentRecording.split(',')[1]
                  }
                }
              ]
            }
          });
          setSuggestedQuestion(response.text?.trim() || TRIGGER_QUESTIONS[chapterId][0]);
        } else {
          // If no recording, just pick a random one
          const questions = TRIGGER_QUESTIONS[chapterId];
          const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
          setSuggestedQuestion(randomQuestion);
        }
      } catch (error) {
        console.error("Error getting suggestion:", error);
        const questions = TRIGGER_QUESTIONS[chapterId];
        setSuggestedQuestion(questions[0]);
      } finally {
        setIsThinkingSuggestion(false);
      }
    };

    // UI state controls
    const [showDraftOptions, setShowDraftOptions] = useState<boolean>(false);
    const [showSavedOptions, setShowSavedOptions] = useState<boolean>(false);
    const [showNewRecordingControls, setShowNewRecordingControls] = useState<boolean>(false);


    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const timerIntervalRef = useRef<number | null>(null);

    // Web Audio API refs for waveform visualization
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    // FIX: Initialized canvasRef with null instead of itself to avoid "used before its declaration" error.
    const canvasRef = useRef<HTMLCanvasElement | null>(null); 
    const animationFrameIdRef = useRef<number | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    const questionId = activeQuestion?.id; // Capture questionId for use in effects

    // Initialize Web Audio API and cleanup on unmount
    useEffect(() => {
      // Create a new AudioContext and AnalyserNode for this RecorderView instance
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048; // A good balance for frequency data
        analyserRef.current.minDecibels = -90;
        analyserRef.current.maxDecibels = -10;
        analyserRef.current.smoothingTimeConstant = 0.85; // Smooths the data
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount); // Use frequencyBinCount as it's half of fftSize
      }

      // Cleanup function for RecorderView. This runs on unmount or before dependencies change.
      return () => {
        // Stop recording and save as draft if still recording or paused on unmount/navigate away
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop(); // This triggers onstop, which handles saving as draft
        }
        
        // Clear timer if it's running
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Web Audio API cleanup
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(e => console.error("Error closing RecorderView AudioContext:", e));
          audioContextRef.current = null;
          analyserRef.current = null;
        }
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
      };
    }, [questionId]); // Only re-run if questionId changes or on unmount

    // Effect to load initial audio (saved or draft) based on questionId
    useEffect(() => {
      if (!questionId) return;

      const saved = recordings[questionId];
      const draft = draftRecordings[questionId];

      if (saved) {
        setAudioDataForPlayer(saved);
        setIsCurrentlyDraft(false);
        setShowSavedOptions(true);
        setShowDraftOptions(false);
        setShowNewRecordingControls(false);
      } else if (draft) {
        setAudioDataForPlayer(draft);
        setIsCurrentlyDraft(true);
        setShowDraftOptions(true);
        setShowSavedOptions(false);
        setShowNewRecordingControls(false);
      } else {
        setAudioDataForPlayer(null);
        setIsCurrentlyDraft(false);
        setShowDraftOptions(false);
        setShowSavedOptions(false);
        setShowNewRecordingControls(true); // Default to showing mic button
      }
      setTimer(0); // Reset timer on question change
      setIsPlaying(false); // Stop playback on question change
      // Clear canvas on new question load
      const canvas = canvasRef.current;
      if (canvas) {
          const canvasCtx = canvas.getContext('2d');
          if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, [questionId, recordings, draftRecordings]); // Dependencies for initial load

    // Function to draw the waveform on the canvas
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;

      if (!canvas || !analyser || !dataArray) {
        animationFrameIdRef.current = null;
        return;
      }

      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      // Use frequency data for a more "active" look
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Add a minimum height so it always looks "active"
        if (isRecording && !isPaused) {
           barHeight = Math.max(barHeight, 2 + Math.random() * 3);
        }

        canvasCtx.fillStyle = isPaused ? 'rgb(214 211 209)' : 'rgb(74 222 128)'; // stone-300 or green-400
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
    }, [isRecording, isPaused]);


    const getSupportedAudioMimeType = (): string => {
      if (typeof MediaRecorder === 'undefined') return 'audio/webm';
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg'
      ];
      for (const mime of candidates) {
        try {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
            return mime;
          }
        } catch {
          // ignore
        }
      }
      return '';
    };

    const startRecording = async () => {
      // Before starting, ensure no existing recording/draft is mistakenly kept
      setAudioDataForPlayer(null);
      setIsCurrentlyDraft(false);
      setShowDraftOptions(false);
      setShowSavedOptions(false);
      setShowNewRecordingControls(false); // Hide while recording
      setIsPaused(false);

      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('getUserMedia no disponible en este dispositivo');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const mimeType = getSupportedAudioMimeType();
        const options = mimeType ? { mimeType } : undefined;
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorderRef.current.onstop = () => {
          const actualMime = mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            setAudioDataForPlayer(base64Audio); // Set the newly recorded audio
            setIsCurrentlyDraft(true); // It's a draft until explicitly saved
            setShowDraftOptions(true); // Show draft options
            if (questionId) {
                saveDraftRecordingData(questionId, base64Audio); // Persist as draft immediately
            }
          };
          stream.getTracks().forEach(track => track.stop()); // Stop mic access

          // Cleanup Web Audio API resources after recording stops
          if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
          }
          if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
          }
          // Clear canvas
          const canvas = canvasRef.current;
          if (canvas) {
              const canvasCtx = canvas.getContext('2d');
              if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          }
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setTimer(0); // Reset timer after recording
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setTimer(0);
        timerIntervalRef.current = window.setInterval(() => setTimer(p => p + 1), 1000);

        // Web Audio API for visualization during recording
        if (audioContextRef.current && analyserRef.current) {
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
          // Disconnect previous source if any
          if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
          }
          sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
          sourceNodeRef.current.connect(analyserRef.current);
          // Do not connect analyser to destination to avoid monitoring mic input
          animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
        }

      } catch (err: any) {
        console.error("Microphone access error:", err);
        const isPermissionError = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.message?.includes('Permission');
        const alertMsg = isPermissionError
          ? "No se pudo acceder al micrófono. Por favor permite el acceso al micrófono en la ventana de permisos o en los Ajustes de la App en tu dispositivo."
          : "No se pudo iniciar la grabación de audio. Verifica los permisos del micrófono en tu dispositivo.";
        alert(alertMsg);
        // If error, ensure recording states are reset
        setIsRecording(false);
        setShowNewRecordingControls(true); // Show new recording controls again
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current && (isRecording || isPaused)) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false); // onstop will handle timer and other state updates
      }
    };

    const pauseRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      }
    };

    const resumeRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerIntervalRef.current = window.setInterval(() => setTimer(p => p + 1), 1000);
        animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
      }
    };

    const handlePlayPause = async () => {
      if (!audioPlayerRef.current || !audioDataForPlayer) return;

      if (isPlaying) {
        audioPlayerRef.current.pause();
        // Cleanup Web Audio API resources after pausing
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect(); // Disconnect analyser from destination
        }
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        // Clear canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const canvasCtx = canvas.getContext('2d');
            if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        // Web Audio API for playback visualization
        if (audioContextRef.current && analyserRef.current) {
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          // Disconnect previous source if any
          if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
          }

          sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
          sourceNodeRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination); // Connect analyser to destination to hear audio
          animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
        }
        audioPlayerRef.current.play();
      }
      setIsPlaying(prev => !prev);
    };

    const handleSaveDraftPermanently = async () => {
      if (questionId && audioDataForPlayer) {
        await saveRecordingData(questionId, audioDataForPlayer); // This also deletes the draft via App.tsx callback
        setIsCurrentlyDraft(false);
        setShowSavedOptions(true);
        setShowDraftOptions(false);
        handleGetSuggestion(); // Sugerir pregunta después de guardar
      }
    };

    const handleDiscard = async () => {
      const confirmMsg = isCurrentlyDraft 
        ? '¿Estás seguro de que quieres eliminar este borrador? No podrás recuperarlo y la pregunta volverá a estar pendiente.' 
        : '¿Estás seguro de que quieres eliminar esta historia guardada? Perderás el avance de esta pregunta.';
        
      if (window.confirm(confirmMsg)) {
        try {
          if (questionId) {
            if (isCurrentlyDraft) {
              await deleteDraftRecording(questionId);
            } else {
              await deleteRecording(questionId);
            }
          }
        } catch (error) {
          console.error("Error deleting recording:", error);
          alert("Hubo un error al eliminar. Por favor, intenta de nuevo.");
        } finally {
          // Reset all states to initial (new recording) regardless of success
          setAudioDataForPlayer(null);
          setIsCurrentlyDraft(false);
          setShowDraftOptions(false);
          setShowSavedOptions(false);
          setShowNewRecordingControls(true); // Show mic button again
          setTimer(0);
          setIsPlaying(false);
          // Clear canvas on delete
          const canvas = canvasRef.current;
          if (canvas) {
              const canvasCtx = canvas.getContext('2d');
              if (canvasCtx) {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                // Draw a subtle "reset" line
                canvasCtx.beginPath();
                canvasCtx.strokeStyle = '#e5e7eb';
                canvasCtx.moveTo(0, canvas.height / 2);
                canvasCtx.lineTo(canvas.width, canvas.height / 2);
                canvasCtx.stroke();
              }
          }
        }
      }
    };

    const handleRerecord = async () => {
      if (window.confirm(isCurrentlyDraft ? 'Al grabar de nuevo, tu borrador actual se eliminará. ¿Quieres continuar?' : 'Al grabar de nuevo, tu historia guardada se eliminará y reemplazará. ¿Quieres continuar?')) {
        if (questionId) {
          if (isCurrentlyDraft) {
            await deleteDraftRecording(questionId);
          } else {
            await deleteRecording(questionId);
          }
        }
        startRecording(); // This will reset other states internally for a new recording
      }
    };

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!activeQuestion || !activeChapter) {
      // Should not happen if navigation is controlled, but good for type safety
      return (
        <div className="flex flex-col h-full items-center justify-center text-stone-500">
          <p>Error: No hay pregunta o capítulo activo.</p>
          <button onClick={goHome} className="mt-4 text-brand-blue hover:text-brand-blue-hover underline">Volver al inicio</button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full pb-10">
        <button
          onClick={goBackToChapter}
          className="flex items-center gap-3 text-2xl font-bold text-stone-600 mb-6 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 self-start"
        >
          <ArrowLeft size={32} />
          Atrás
        </button>

        <div className="flex-1 flex flex-col p-4 bg-white rounded-[3rem] shadow-xl border border-stone-100">
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
             {activeQuestion.isAnecdote && (
                <div className="mb-6 bg-amber-100 text-amber-800 px-6 py-3 rounded-full font-bold text-xl flex items-center gap-2 animate-pulse-slow">
                  <Feather size={28} /> Momento de contar una historia
                </div>
             )}
            <h3 className="text-xl text-stone-400 font-bold uppercase tracking-widest mb-6">
              {activeChapter.title}
            </h3>
            <p className="text-3xl md:text-5xl font-sans font-bold text-stone-800 leading-tight">
              {activeQuestion.text}
            </p>
          </div>

          <div className="bg-stone-50 rounded-[2rem] p-4 md:p-8 flex flex-col items-center gap-6 md:gap-8 mt-6 border-t border-stone-100">
            <div className={`text-5xl md:text-6xl font-mono font-bold transition-colors ${isRecording ? 'text-red-500' : 'text-stone-700'}`}>
              {formatTime(timer)}
            </div>

            <canvas ref={canvasRef} className="w-full h-20 md:h-24 bg-stone-100 rounded-xl border border-stone-200" width="400" height="100"></canvas>

            {isRecording || isPaused ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full bg-red-500 ${!isPaused ? 'animate-pulse' : ''}`} />
                  <span className={`font-bold text-xl uppercase tracking-widest ${!isPaused ? 'text-red-500' : 'text-stone-400'}`}>
                    {isPaused ? 'Grabación Pausada' : 'Grabando...'}
                  </span>
                </div>

                <div className="flex items-center gap-8 md:gap-12">
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all ${
                      isPaused ? 'bg-green-500 ring-8 ring-green-100' : 'bg-amber-500 ring-8 ring-amber-100'
                    }`}
                  >
                    {isPaused ? <Mic size={48} className="text-white" /> : <Pause size={48} className="text-white" />}
                  </button>

                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 md:w-28 md:h-28 bg-red-500 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all ring-8 ring-red-100"
                  >
                    <CheckCircle size={48} className="text-white" />
                  </button>
                </div>
                
                <p className="text-stone-500 font-medium text-lg">
                  {isPaused ? 'Toca el micrófono para seguir' : 'Toca el botón rojo para terminar'}
                </p>

                <button
                  onClick={handleGetSuggestion}
                  className="mt-4 flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors font-bold"
                >
                  <MessageSquare size={20} />
                  ¿De qué hablo?
                </button>
              </div>
            ) : showNewRecordingControls ? ( // Show only if no audio (saved or draft)
              <>
                <button
                  onClick={startRecording}
                  className="w-32 h-32 bg-stone-800 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ring-8 ring-stone-200 hover:ring-stone-300"
                >
                  <Mic size={64} className="text-white" />
                </button>
                <p className="text-stone-500 font-medium text-2xl">Toca el micrófono para hablar</p>
                
                <button
                  onClick={handleGetSuggestion}
                  className="mt-4 flex items-center gap-2 text-brand-blue hover:text-brand-blue-hover transition-colors font-bold bg-brand-blue/10 px-6 py-3 rounded-full"
                >
                  <MessageSquare size={24} />
                  No sé qué decir...
                </button>
              </>
            ) : audioDataForPlayer && (showDraftOptions || showSavedOptions) ? ( // Show controls if audio exists
              <div className="w-full flex flex-col items-center gap-8">
                <audio
                  ref={audioPlayerRef}
                  src={audioDataForPlayer}
                  onEnded={async () => {
                    setIsPlaying(false);
                    // Cleanup Web Audio API resources after playback ends
                    if (sourceNodeRef.current) {
                      sourceNodeRef.current.disconnect();
                      sourceNodeRef.current = null;
                    }
                    if (analyserRef.current) {
                      analyserRef.current.disconnect();
                    }
                    if (animationFrameIdRef.current) {
                      cancelAnimationFrame(animationFrameIdRef.current);
                      animationFrameIdRef.current = null;
                    }
                    // Clear canvas
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const canvasCtx = canvas.getContext('2d');
                        if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  className="hidden"
                />

                {showDraftOptions && (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="text-center bg-orange-50 px-8 py-4 rounded-2xl border border-orange-200">
                      <p className="text-orange-700 font-bold text-2xl flex items-center gap-2 justify-center">
                        <BookOpen size={32} />
                        Borrador Guardado
                      </p>
                      <p className="text-orange-600 text-lg mt-2">Puedes guardarlo permanentemente o grabar de nuevo.</p>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8">
                      <button
                        onClick={handleDiscard}
                        className="p-4 md:p-6 rounded-full bg-red-500 text-white shadow-md active:scale-95 transition-all"
                        title="Borrar borrador"
                      >
                        <Trash2 size={32} />
                      </button>

                      <button
                        onClick={handlePlayPause}
                        className="w-24 h-24 md:w-32 md:h-32 bg-brand-blue rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all text-white ring-8 ring-brand-blue/20"
                      >
                        {isPlaying ? <Square size={48} className="fill-current" /> : <Play size={56} className="ml-2 fill-current" />}
                      </button>
                      
                      <button
                        onClick={handleRerecord}
                        className="p-4 md:p-6 rounded-full bg-stone-800 text-white shadow-md active:scale-95 transition-all"
                        title="Grabar de nuevo (descarta borrador)"
                      >
                        <Mic size={32} />
                      </button>
                    </div>
                    <button
                      onClick={handleSaveDraftPermanently}
                      className="w-full bg-green-600 text-white px-8 py-4 rounded-3xl shadow-lg hover:bg-green-700 active:scale-95 transition-all text-2xl font-bold flex items-center justify-center gap-3"
                    >
                      <CheckCircle size={32} />
                      Guardar Historia
                    </button>

                    <button
                      onClick={async () => {
                        await handleSaveDraftPermanently();
                        goToNextQuestion();
                      }}
                      className="w-full bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all text-2xl font-bold flex items-center justify-center gap-3 mt-2"
                    >
                      <ChevronRight size={32} />
                      Guardar y Siguiente
                    </button>
                  </div>
                )}

                {showSavedOptions && (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="text-center bg-green-50 px-8 py-4 rounded-2xl border border-green-200">
                      <p className="text-green-700 font-bold text-2xl flex items-center gap-2 justify-center">
                        <CheckCircle size={32} />
                        ¡Historia Guardada!
                      </p>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8">
                      <button
                        onClick={handleDiscard}
                        className="p-4 md:p-6 rounded-full bg-red-500 text-white shadow-md active:scale-95 transition-all"
                        title="Borrar historia guardada"
                      >
                        <Trash2 size={32} />
                      </button>

                      <button
                        onClick={handlePlayPause}
                        className="w-24 h-24 md:w-32 md:h-32 bg-brand-blue rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all text-white ring-8 ring-brand-blue/20"
                      >
                        {isPlaying ? <Square size={48} className="fill-current" /> : <Play size={56} className="ml-2 fill-current" />}
                      </button>

                      <button
                        onClick={handleRerecord}
                        className="p-4 md:p-6 rounded-full bg-stone-800 text-white shadow-md active:scale-95 transition-all"
                        title="Grabar de nuevo (reemplaza historia)"
                      >
                        <Mic size={32} />
                      </button>
                    </div>

                    <button
                      onClick={goToNextQuestion}
                      className="w-full bg-stone-800 text-white px-8 py-4 rounded-3xl shadow-lg hover:bg-stone-900 active:scale-95 transition-all text-2xl font-bold flex items-center justify-center gap-3 mt-4"
                    >
                      Siguiente Pregunta
                      <ChevronRight size={32} />
                    </button>
                  </div>
                )}
              </div>
            ) : null} {/* Fallback if no specific state matches */}

            {/* Interviewer Suggestion UI */}
            {(suggestedQuestion || isThinkingSuggestion) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-8 p-6 bg-brand-blue/5 rounded-3xl border-2 border-brand-blue/25 relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                    <MessageSquare size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-brand-blue/60 uppercase tracking-widest mb-1">Tu Entrevistador sugiere:</p>
                    {isThinkingSuggestion ? (
                      <div className="flex items-center gap-2 text-brand-blue font-bold">
                        <Loader2 size={20} className="animate-spin" />
                        Pensando en la mejor pregunta...
                      </div>
                    ) : (
                      <p className="text-xl font-sans font-semibold italic text-brand-blue leading-tight">
                        "{suggestedQuestion}"
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ExplanationView = (): React.ReactElement => (
    <div className="pb-10">
      <button
        onClick={goHome}
        className="flex items-center gap-3 text-2xl font-bold text-stone-600 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 active:bg-stone-100 w-full md:w-auto"
      >
        <ArrowLeft size={32} />
        Regresar al Álbum
      </button>

      <div className="p-6 md:p-8 rounded-3xl mb-8 bg-white shadow-xl border border-stone-100">
        <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-6 text-center">Cómo funciona El Libro de mi Vida</h2>

        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-stone-700 mb-4">El Propósito</h3>
          <p className="text-lg md:text-xl text-stone-600 leading-relaxed">
            "El Libro de mi Vida" es una aplicación diseñada para ayudarte a narrar y organizar tus recuerdos más preciados en forma de historias de vida.
            Imagina que estás construyendo un álbum oral de tu existencia, capítulo por capítulo, respondiendo a preguntas que te guiarán a través de tu niñez, juventud, adultez y el legado que deseas dejar.
            Es un regalo invaluable para tu familia, permitiéndoles conectar con tu voz y tus experiencias de una manera única.
          </p>
        </div>

        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-stone-700 mb-4">Privacidad y Permisos</h3>
          <div className="space-y-4 text-lg md:text-xl text-stone-600">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-500 shrink-0 mt-1" size={28} />
              <p>
                <strong>Tus datos son tuyos:</strong> Todas tus grabaciones se guardan localmente en tu dispositivo. No las subimos a ningún servidor público sin tu consentimiento.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Mic className="text-brand-blue shrink-0 mt-1" size={28} />
              <p>
                <strong>Permiso de Micrófono:</strong> Solo necesitamos acceso a tu micrófono para que puedas grabar tus historias. Puedes revocar este permiso en cualquier momento desde los ajustes de tu navegador.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-2xl md:text-3xl font-bold text-stone-700 mb-4">Pasos Sencillos para Empezar</h3>
          <ol className="list-decimal list-inside text-lg md:text-xl text-stone-600 space-y-3 pl-4">
            <li>
              <strong>Selecciona un Capítulo:</strong> En la pantalla principal, elige uno de los capítulos que representan una etapa de tu vida.
            </li>
            <li>
              <strong>Elige una Pregunta:</strong> Dentro de cada capítulo, encontrarás una serie de preguntas. Toca la que desees responder. ¡No hay un orden específico!
            </li>
            <li>
              <strong>Graba tu Historia:</strong> Una vez en la vista del grabador, presiona el botón del micrófono para comenzar a grabar tu respuesta. Verás una onda de sonido en tiempo real.
            </li>
            <li>
              <strong>Detén y Escucha:</strong> Cuando termines de hablar, presiona el botón cuadrado rojo. Luego podrás escuchar tu grabación, borrarla si deseas repetirla, o dejarla guardada.
            </li>
            <li>
              <strong>Explora y Continúa:</strong> Una vez que hayas grabado una respuesta, podrás ver una marca de verificación en la pregunta. Puedes volver al capítulo o al inicio para elegir más preguntas.
            </li>
          </ol>
          <p className="text-lg md:text-xl text-stone-600 mt-6 leading-relaxed italic">
            ¡Cada historia que grabes se convertirá en una pieza invaluable de tu legado familiar!
          </p>
        </div>
      </div>

      <button
        onClick={goHome}
        className="w-full bg-brand-blue text-white px-8 py-4 rounded-3xl shadow-lg hover:bg-brand-blue-hover active:scale-95 transition-all text-2xl font-bold flex items-center justify-center gap-3 mt-8"
        aria-label="Regresar al álbum de historias"
      >
        <ArrowLeft size={32} />
        Regresar al Álbum
      </button>
    </div>
  );

  const AudiobookView = (): React.ReactElement => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // 0: idle, 1: narrating Q, 2: playing user recording
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

    const [playedDedication, setPlayedDedication] = useState(false);

    const questionsWithRecordings = CHAPTERS.flatMap(c => 
      c.questions.filter(q => recordings[q.id]).map(q => ({ ...q, chapterTitle: c.title }))
    );

    const playNext = useCallback(async () => {
      // Handle Dedication first
      if (dedication && !playedDedication) {
        setCurrentStep(3); // 3: playing dedication
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = dedication;
          audioPlayerRef.current.play();
        }
        return;
      }

      if (currentIndex >= questionsWithRecordings.length) {
        setIsPlaying(false);
        setCurrentStep(0);
        setCurrentIndex(0);
        return;
      }

      const currentQ = questionsWithRecordings[currentIndex];
      
      // Step 1: Narrate a bridge/introduction
      setCurrentStep(1);
      setIsGenerating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: {
            parts: [{ text: `Actúa como un narrador cálido y nostálgico. Basado en la pregunta "${currentQ.text}", genera una brevísima frase de introducción (máximo 12 palabras) para presentar la historia que el usuario grabó sobre este tema. Por ejemplo: "Y así fue como empezaron los primeros recuerdos de la infancia..." o "Hablemos ahora de aquel momento que cambió tu juventud...". Devuelve SOLO la frase narrativa.` }]
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioUrl = `data:audio/wav;base64,${base64Audio}`;
          if (ttsAudioRef.current) {
            ttsAudioRef.current.src = audioUrl;
            ttsAudioRef.current.play();
          }
        }
      } catch (error) {
        console.error("Error generating TTS:", error);
        // Skip to user recording if TTS fails
        setCurrentStep(2);
      } finally {
        setIsGenerating(false);
      }
    }, [currentIndex, questionsWithRecordings, recordings]);

    useEffect(() => {
      if (isPlaying && currentStep === 0) {
        playNext();
      }
    }, [isPlaying, currentStep, playNext]);

    const handleTtsEnded = () => {
      setCurrentStep(2);
      if (audioPlayerRef.current) {
        const currentQ = questionsWithRecordings[currentIndex];
        audioPlayerRef.current.src = recordings[currentQ.id];
        audioPlayerRef.current.play();
      }
    };

    const handleUserAudioEnded = () => {
      if (currentStep === 3) {
        setPlayedDedication(true);
        setCurrentStep(0);
        return;
      }
      setCurrentIndex(prev => prev + 1);
      setCurrentStep(0); // Reset to trigger next playNext
    };

    const togglePlay = () => {
      if (isPlaying) {
        setIsPlaying(false);
        if (ttsAudioRef.current) ttsAudioRef.current.pause();
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
      } else {
        setIsPlaying(true);
      }
    };

    if (questionsWithRecordings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Headphones size={80} className="text-stone-300 mb-6" />
          <h2 className="text-3xl font-bold text-stone-800 mb-4">Aún no hay historias grabadas</h2>
          <p className="text-xl text-stone-500 mb-8">Graba al menos una historia para poder crear tu audiolibro.</p>
          <button
            onClick={goHome}
            className="bg-brand-blue text-white px-8 py-4 rounded-3xl shadow-lg hover:bg-brand-blue-hover active:scale-95 transition-all text-xl font-bold"
          >
            Ir a grabar
          </button>
        </div>
      );
    }

    return (
      <div className="pb-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={goHome}
            className="flex items-center gap-3 text-2xl font-bold text-stone-600 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 active:bg-stone-100 self-start"
          >
            <ArrowLeft size={32} />
            Regresar
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-6 py-4 rounded-2xl shadow-sm border border-brand-blue/25 active:scale-95 transition-all font-bold"
          >
            <Share2 size={24} />
            Compartir
          </button>
        </div>

        <div className="bg-white rounded-[3rem] shadow-xl border border-stone-100 p-8 flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-12">
            <div className="w-48 h-48 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Headphones size={80} className="text-emerald-600" />
            </div>
            <h2 className="text-4xl font-bold text-stone-800 mb-2">Tu Historia Narrada</h2>
            <p className="text-xl text-stone-500 font-medium">La IA hila tus recuerdos en un relato continuo</p>
          </div>

          <div className="w-full max-w-md mb-12">
            {isPlaying ? (
              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                  <p className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-2">
                    {questionsWithRecordings[currentIndex]?.chapterTitle}
                  </p>
                  <p className="text-2xl font-sans font-bold text-stone-800 leading-tight italic">
                    "{questionsWithRecordings[currentIndex]?.text}"
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-3 text-emerald-600 font-bold">
                  {currentStep === 1 ? (
                    <>
                      {isGenerating ? <Loader2 className="animate-spin" /> : <Volume2 className="animate-pulse" />}
                      <span>El narrador introduce tu historia...</span>
                    </>
                  ) : currentStep === 3 ? (
                    <>
                      <Volume2 className="animate-pulse" />
                      <span>Escuchando tu dedicatoria...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="animate-pulse" />
                      <span>Escuchando tu voz...</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xl text-stone-400">Presiona el botón para comenzar la experiencia narrativa</p>
            )}
          </div>

          <button
            onClick={togglePlay}
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ring-8 ${
              isPlaying ? 'bg-stone-800 ring-stone-100' : 'bg-emerald-600 ring-emerald-100'
            }`}
          >
            {isPlaying ? <Square size={56} className="text-white fill-current" /> : <Play size={64} className="text-white ml-2 fill-current" />}
          </button>

          <div className="mt-12 w-full bg-stone-100 h-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${((currentIndex + (currentStep === 2 ? 0.5 : 0)) / questionsWithRecordings.length) * 100}%` }}
            />
          </div>
          <p className="mt-4 text-stone-400 font-bold">
            Recuerdo {currentIndex + 1} de {questionsWithRecordings.length}
          </p>
        </div>

        <audio ref={ttsAudioRef} onEnded={handleTtsEnded} className="hidden" />
        <audio ref={audioPlayerRef} onEnded={handleUserAudioEnded} className="hidden" />
      </div>
    );
  };

  const BookView = (): React.ReactElement => {
    const [bookContent, setBookContent] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleShareBook = async () => {
      if (!bookContent) return;
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Legado de Vida',
            text: `He escrito mi biografía: "${coverConfig.template === 'option1' ? 'Memorias' : 'Mi Legado'}"\n\nAquí tienes un fragmento:\n\n${bookContent.substring(0, 200)}...`,
            url: APP_URL,
          });
        } catch (err) {
          console.log('Error sharing book:', err);
        }
      } else {
        navigator.clipboard.writeText(bookContent);
        alert('Contenido del libro copiado al portapapeles');
      }
    };

    const handleExportText = () => {
      if (!bookContent) return;
      const element = document.createElement("a");
      const title = coverConfig.template === 'option1' ? 'Memorias' : 'Mi Legado';
      const content = `${title}\n${'='.repeat(title.length)}\n\n${bookContent}`;
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${title.replace(/\s+/g, '_')}_Libro_Export.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    const questionsWithRecordings = CHAPTERS.flatMap(c => 
      c.questions.filter(q => recordings[q.id]).map(q => ({ ...q, chapterTitle: c.title, chapterId: c.id }))
    );

    const generateBook = async () => {
      if (questionsWithRecordings.length === 0) return;
      
      setIsGenerating(true);
      setProgress(10);
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        
        // Prepare parts for Gemini
        const parts: any[] = [
          { text: "Eres un biógrafo experto y sensible. A continuación te proporciono una serie de grabaciones de audio de una persona contando su vida. Tu tarea es transcribir y redactar estas historias en un libro de memorias hermoso, coherente y literario. Organízalo por capítulos basados en los títulos proporcionados. Dale un título poético al libro al principio. Si hay una dedicatoria, inclúyela al principio del libro de forma destacada. Para cada capítulo, inserta un marcador de posición como '[IMAGEN_CAPITULO: ID_DEL_CAPITULO]' justo después del título del capítulo. Usa Markdown para el formato (títulos, negritas, etc.)." }
        ];

        // Add dedication if exists
        if (dedication) {
          parts.push({ text: "Esta es la dedicatoria del autor para el libro:" });
          parts.push({
            inlineData: {
              mimeType: "audio/webm",
              data: dedication.split(',')[1]
            }
          });
        }

        // Add each recording as a part
        for (let i = 0; i < questionsWithRecordings.length; i++) {
          const q = questionsWithRecordings[i];
          const audioData = recordings[q.id];
          const base64Data = audioData.split(',')[1];
          
          parts.push({ text: `Capítulo ID: ${q.chapterId}. Título Capítulo: ${q.chapterTitle}. Pregunta respondida: ${q.text}` });
          parts.push({
            inlineData: {
              mimeType: "audio/webm", // Assuming webm from the recorder
              data: base64Data
            }
          });
          setProgress(10 + ((i + 1) / questionsWithRecordings.length) * 40);
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview", 
          contents: { parts },
        });

        setBookContent(response.text || 'No se pudo generar el contenido.');
        setProgress(100);
      } catch (error) {
        console.error("Error generating book:", error);
        setBookContent("Hubo un error al generar tu libro. Por favor, intenta de nuevo.");
      } finally {
        setIsGenerating(false);
      }
    };

    useEffect(() => {
      if (!bookContent && !isGenerating) {
        generateBook();
      }
    }, []);

    const handlePrint = () => {
      window.print();
    };

    const renderBookContent = () => {
      if (!bookContent) return null;

      const isClassic = coverConfig.tone === 'classic';
      const isModern = coverConfig.tone === 'modern';
      const isNature = coverConfig.tone === 'nature';

      // Replace image placeholders with actual images
      const parts = bookContent.split(/(\[IMAGEN_CAPITULO: [^\]]+\])/g);
      
      return parts.map((part, index) => {
        const match = part.match(/\[IMAGEN_CAPITULO: ([^\]]+)\]/);
        if (match) {
          const chapterId = match[1].trim();
          const imageUrl = chapterImages[chapterId];
          if (imageUrl) {
            return (
              <div key={index} className={`my-12 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 border-8 ${
                isClassic ? 'border-[#d4af37]/20' : isModern ? 'border-white' : 'border-[#d48181]/20'
              }`}>
                <img src={imageUrl} alt="Capítulo" className="w-full h-auto" />
              </div>
            );
          }
          return null;
        }
        return (
          <div key={index} className={`
            ${isClassic ? 'font-serif text-[#d4af37] leading-relaxed text-xl' : ''}
            ${isModern ? 'font-sans text-stone-800 leading-loose text-lg' : ''}
            ${isNature ? 'font-serif italic text-[#5a3e3e] leading-relaxed text-xl' : ''}
          `}>
            <Markdown 
              components={{
                h1: ({node, ...props}) => <h1 className={`text-4xl font-bold mb-8 ${isClassic ? 'font-serif italic border-b border-[#d4af37]/30 pb-4' : 'font-sans uppercase tracking-widest'}`} {...props} />,
                h2: ({node, ...props}) => <h2 className={`text-3xl font-bold mt-12 mb-6 ${isClassic ? 'font-serif italic' : 'font-sans'}`} {...props} />,
                p: ({node, ...props}) => <p className="mb-6 last:mb-0" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className={`border-l-4 pl-6 italic my-8 ${isClassic ? 'border-[#d4af37]/50 text-[#d4af37]/80' : 'border-brand-blue text-stone-500'}`} {...props} />
              }}
            >
              {part}
            </Markdown>
          </div>
        );
      });
    };

    if (questionsWithRecordings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <PenTool size={80} className="text-stone-300 mb-6" />
          <h2 className="text-3xl font-bold text-stone-800 mb-4">Aún no hay historias para escribir</h2>
          <p className="text-xl text-stone-500 mb-8">Graba tus memorias primero para que la IA pueda redactar tu libro.</p>
          <button
            onClick={goHome}
            className="bg-brand-blue text-white px-8 py-4 rounded-3xl shadow-lg hover:bg-brand-blue-hover active:scale-95 transition-all text-xl font-bold"
          >
            Ir a grabar
          </button>
        </div>
      );
    }

    return (
      <div className="pb-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={goHome}
            className="flex items-center gap-3 text-2xl font-bold text-stone-600 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 active:bg-stone-100"
          >
            <ArrowLeft size={32} />
            Regresar
          </button>

          {bookContent && !isGenerating && (
            <div className="flex flex-wrap gap-3 justify-center md:justify-end">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-stone-800 text-white px-6 py-4 rounded-2xl shadow-lg hover:bg-stone-900 active:scale-95 transition-all font-bold"
              >
                <Printer size={24} />
                Imprimir
              </button>
              <button
                onClick={handleExportText}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all font-bold"
              >
                <Download size={24} />
                Texto
              </button>
              <button
                onClick={handleShareBook}
                className="flex items-center gap-2 bg-brand-blue text-white px-6 py-4 rounded-2xl shadow-lg hover:bg-brand-blue-hover active:scale-95 transition-all font-bold"
              >
                <Share2 size={24} />
                Compartir
              </button>
            </div>
          )}
        </div>

        <div className={`p-8 md:p-12 rounded-[3rem] shadow-2xl border-2 min-h-[600px] relative transition-all duration-700 ${
          coverConfig.tone === 'classic' ? 'bg-[#1a1a1a] text-[#d4af37] border-[#d4af37]/20' : 
          coverConfig.tone === 'modern' ? 'bg-white text-stone-800 border-stone-100' : 
          'bg-[#fdf5f5] text-[#5a3e3e] border-[#d48181]/20'
        }`}>
          {!isGenerating && bookContent && (
            <div className={`mb-16 aspect-[3/4] max-w-sm mx-auto rounded-2xl shadow-2xl flex flex-col items-center justify-between p-8 text-white relative overflow-hidden transform -rotate-1 hover:rotate-0 transition-transform duration-500 ${
              coverConfig.tone === 'classic' ? 'bg-[#1a1a1a] text-[#d4af37]' : 
              coverConfig.tone === 'modern' ? 'bg-brand-blue text-white' : 
              'bg-[#fdf5f5] text-[#d48181]'
            }`}>
              {coverConfig.tone === 'classic' && <div className="absolute inset-2 border-2 border-[#d4af37]/30 rounded-xl pointer-events-none" />}
              {coverConfig.tone === 'nature' && <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />}
              
              <div className="relative z-10 text-center mt-4">
                <BookOpen size={48} className={`mx-auto mb-4 ${coverConfig.tone === 'classic' ? 'text-[#d4af37]/50' : 'opacity-50'}`} />
                <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none mb-2 ${coverConfig.tone === 'classic' ? 'font-serif italic' : ''}`}>
                  {coverConfig.template === 'option1' ? 'Memorias' : 'Mi Legado'}
                </h1>
                <div className={`h-1.5 w-16 mx-auto mb-4 ${coverConfig.tone === 'classic' ? 'bg-[#d4af37]/40' : coverConfig.tone === 'modern' ? 'bg-white/30' : 'bg-[#d48181]/40'}`} />
              </div>

              <div className={`relative z-10 w-full aspect-[4/5] rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden shadow-inner ${
                coverConfig.tone === 'classic' ? 'bg-white/5 border-white/10' : 
                coverConfig.tone === 'modern' ? 'bg-white/10 border-white/20' : 
                'bg-white/50 border-[#d48181]/20'
              }`}>
                {coverConfig.userImage ? (
                  <img src={coverConfig.userImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={48} className="opacity-20" />
                )}
              </div>

              <div className="relative z-10 text-center mb-4">
                <p className={`text-xl italic opacity-80 ${coverConfig.tone === 'classic' ? 'font-serif' : ''}`}>El Libro de mi Vida</p>
              </div>
            </div>
          )}

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative w-40 h-40 mb-10">
                <Loader2 size={160} className="text-amber-500 animate-spin opacity-20" />
                <PenTool size={64} className="text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>
              <h2 className="text-4xl font-bold text-stone-800 mb-6">Redactando tu Legado...</h2>
              <p className="text-2xl text-stone-500 max-w-md mx-auto mb-10 leading-relaxed">
                Nuestra IA está escuchando tus grabaciones y transformándolas en un libro de memorias único.
              </p>
              <div className="w-full max-w-md bg-stone-100 h-3 rounded-full overflow-hidden mx-auto shadow-inner">
                <div 
                  className="h-full bg-amber-500 transition-all duration-1000 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-4 text-stone-400 font-bold text-lg uppercase tracking-widest">{Math.round(progress)}% completado</p>
            </div>
          ) : (
            <div className={`markdown-body max-w-2xl mx-auto ${coverConfig.tone === 'classic' ? 'prose-invert prose-gold' : ''}`}>
              {renderBookContent()}
            </div>
          )}
          
          {/* Decorative book elements */}
          <div className="absolute top-0 left-0 w-6 h-full bg-stone-50 border-r border-stone-100 shadow-inner" />
          <div className="absolute top-0 right-0 w-2 h-full bg-stone-50/30" />
        </div>

        {!isGenerating && bookContent && (
          <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 text-amber-900 text-center">
            <p className="text-lg font-medium">
              Este libro ha sido redactado por IA basándose fielmente en tus grabaciones de voz.
            </p>
          </div>
        )}
      </div>
    );
  };

  const PremiumView = (): React.ReactElement => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePurchase = () => {
      setIsProcessing(true);
      // Simulate payment processing
      setTimeout(() => {
        setIsPremium(true);
        localStorage.setItem('isPremium', 'true');
        setIsProcessing(false);
        goHome();
      }, 2000);
    };

    return (
      <div className="pb-10">
        <button
          onClick={goHome}
          className="flex items-center gap-3 text-2xl font-bold text-stone-600 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 active:bg-stone-100 self-start"
        >
          <ArrowLeft size={32} />
          Regresar
        </button>

        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-amber-100 rounded-full mb-4">
            <Crown size={56} className="text-amber-600" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-stone-800 mb-4">Legado Eterno</h2>
          <p className="text-lg md:text-2xl text-stone-500 max-w-lg mx-auto">
            Desbloquea el poder total de tu historia y preserva tus recuerdos para siempre.
          </p>
        </div>

        <div className="grid gap-8 max-w-2xl mx-auto">
          {/* Premium Card */}
          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border-4 border-amber-400 p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400 text-white px-4 md:px-6 py-2 rounded-bl-3xl font-black text-xs md:text-sm uppercase tracking-widest">
              Recomendado
            </div>
            
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-black text-stone-800 mb-2">Acceso Vitalicio</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-amber-600">$19.99</span>
                <span className="text-lg md:text-xl text-stone-400 font-bold">Pago único</span>
              </div>
            </div>

            <ul className="space-y-4 md:space-y-6 mb-10">
              {[
                { icon: <Headphones className="text-emerald-500" />, text: "Audiolibro Narrado por IA" },
                { icon: <MessageSquare className="text-brand-blue" />, text: "Entrevistador Inteligente" },
                { icon: <PenTool className="text-amber-500" />, text: "Redacción de Libro de Memorias" },
                { icon: <Star className="text-brand-blue" />, text: "Capítulos Ilimitados" },
                { icon: <Printer className="text-stone-500" />, text: "Exportación a PDF e Impresión" },
                { icon: <ShieldCheck className="text-purple-500" />, text: "Privacidad y Seguridad Premium" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-lg md:text-xl font-medium text-stone-700">
                  <div className="p-2 bg-stone-50 rounded-xl">{item.icon}</div>
                  {item.text}
                </li>
              ))}
            </ul>

            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full bg-amber-500 text-white py-6 rounded-3xl shadow-xl hover:bg-amber-600 active:scale-95 transition-all text-2xl font-black flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 size={32} className="animate-spin" />
              ) : (
                <>
                  <CreditCard size={32} />
                  COMPRAR AHORA
                </>
              )}
            </button>
            
            <p className="text-center mt-6 text-stone-400 text-sm font-bold flex items-center justify-center gap-2">
              <ShieldCheck size={16} />
              Transacción segura y encriptada
            </p>
          </div>

          {/* Free Card (Comparison) */}
          <div className="bg-stone-50 rounded-[2rem] border border-stone-200 p-8 opacity-60">
            <h3 className="text-xl font-bold text-stone-500 mb-4">Versión Gratuita</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-stone-500">
                <CheckCircle size={20} /> Grabación de voz básica
              </li>
              <li className="flex items-center gap-3 text-stone-300 line-through">
                <Lock size={20} /> Audiolibro Narrado
              </li>
              <li className="flex items-center gap-3 text-stone-300 line-through">
                <Lock size={20} /> Redacción de Libro
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center text-stone-400 text-sm">
          <p>Al comprar, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
          <p>Las compras digitales no son reembolsables una vez generado el contenido por IA.</p>
        </div>
      </div>
    );
  };

  const CoverAndDedicationView = (): React.ReactElement => {
    const [isRecordingDedication, setIsRecordingDedication] = useState(false);
    const [dedicationTimer, setDedicationTimer] = useState(0);
    const dedicationRecorderRef = useRef<MediaRecorder | null>(null);
    const dedicationIntervalRef = useRef<number | null>(null);

    const startRecordingDedication = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('getUserMedia no disponible');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
        let selectedMime = '';
        if (typeof MediaRecorder !== 'undefined') {
          for (const m of candidates) {
            try {
              if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
                selectedMime = m;
                break;
              }
            } catch {
              // ignore
            }
          }
        }
        const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: selectedMime || 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            setDedication(base64);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        dedicationRecorderRef.current = recorder;
        recorder.start();
        setIsRecordingDedication(true);
        setDedicationTimer(0);
        dedicationIntervalRef.current = window.setInterval(() => setDedicationTimer(p => p + 1), 1000);
      } catch (err: any) {
        console.error("Error starting dedication recording", err);
        alert("No se pudo acceder al micrófono para la dedicatoria. Por favor verifica los permisos.");
      }
    };

    const stopRecordingDedication = () => {
      if (dedicationRecorderRef.current) {
        dedicationRecorderRef.current.stop();
        setIsRecordingDedication(false);
        if (dedicationIntervalRef.current) {
          window.clearInterval(dedicationIntervalRef.current);
          dedicationIntervalRef.current = null;
        }
      }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverConfig(prev => ({ ...prev, userImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };

    const tones: { id: BookTone; name: string; description: string; colors: string }[] = [
      { id: 'classic', name: 'Clásico', description: 'Elegancia atemporal en negro y oro', colors: 'bg-[#1a1a1a] text-[#d4af37]' },
      { id: 'modern', name: 'Moderno', description: 'Limpio, minimalista y contemporáneo', colors: 'bg-white text-stone-800 border-stone-100' },
      { id: 'nature', name: 'Naturaleza', description: 'Tonos tierra y orgánicos', colors: 'bg-[#fdf5f5] text-[#d48181]' },
    ];

    const getTemplatePreview = (tone: BookTone, template: CoverTemplate) => {
      const isClassic = tone === 'classic';
      const isModern = tone === 'modern';
      const isNature = tone === 'nature';

      const bgClass = isClassic ? 'bg-[#1a1a1a]' : isModern ? 'bg-white' : 'bg-[#fdf5f5]';
      const textClass = isClassic ? 'text-[#d4af37]' : isModern ? 'text-stone-800' : 'text-[#d48181]';
      const accentBorder = isClassic ? 'border-[#d4af37]/30' : isModern ? 'border-stone-200' : 'border-[#d48181]/30';

      return (
        <div className={`w-full h-full flex flex-col items-center justify-between p-4 relative ${bgClass} ${textClass}`}>
          {isClassic && <div className="absolute inset-1 border border-[#d4af37]/20 rounded-lg pointer-events-none" />}
          
          <div className="text-center mt-2">
            <div className={`h-0.5 w-4 mx-auto mb-2 ${isClassic ? 'bg-[#d4af37]/40' : isModern ? 'bg-stone-300' : 'bg-[#d48181]/40'}`} />
          </div>

          {/* Photo Area */}
          <div className={`w-full aspect-[4/5] rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden ${
            isClassic ? 'bg-white/5 border-white/10' : 
            isModern ? 'bg-stone-50 border-stone-200' : 
            'bg-white/50 border-[#d48181]/20'
          }`}>
            {coverConfig.userImage ? (
              <img src={coverConfig.userImage} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera size={20} className="mx-auto mb-1 opacity-20" />
                <span className="text-[6px] font-black uppercase tracking-widest opacity-30">Tu foto</span>
              </div>
            )}
          </div>

          <div className="text-center mb-2">
            <h3 className={`text-xs font-bold leading-tight ${isClassic ? 'font-serif italic' : 'font-sans uppercase tracking-tighter'}`}>
              {template === 'option1' ? 'Memorias' : 'Mi Legado'}
            </h3>
            <p className="text-[6px] opacity-40 font-medium uppercase tracking-widest">Tomo I</p>
          </div>
        </div>
      );
    };

    return (
      <div className="pb-10">
        <button
          onClick={goHome}
          className="flex items-center gap-3 text-2xl font-bold text-stone-600 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 active:bg-stone-100 self-start"
        >
          <ArrowLeft size={32} />
          Regresar
        </button>

        <div className="grid gap-12">
          {/* Dedication Section */}
          <section className="bg-white rounded-[3rem] shadow-xl border border-stone-100 p-10">
            <div className="flex items-center gap-4 mb-8 text-amber-600">
              <MessageSquare size={40} />
              <h2 className="text-4xl font-bold text-stone-800">Dedicatoria</h2>
            </div>
            
            <p className="text-xl text-stone-500 mb-8">
              Graba un mensaje especial para quienes lean o escuchen tu libro. Esta dedicatoria aparecerá al inicio de tu legado.
            </p>

            <div className="flex flex-col items-center gap-6">
              {dedication && !isRecordingDedication && (
                <div className="w-full bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-700">
                      <Play size={24} />
                    </div>
                    <span className="font-bold text-amber-900">Dedicatoria grabada</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres eliminar la dedicatoria?')) {
                        setDedication(null);
                      }
                    }}
                    className="text-stone-400 hover:text-red-500 transition-colors p-2"
                    title="Eliminar dedicatoria"
                  >
                    <Trash2 size={28} />
                  </button>
                </div>
              )}

              <button
                onClick={isRecordingDedication ? stopRecordingDedication : startRecordingDedication}
                className={`w-full py-6 rounded-3xl text-2xl font-bold flex items-center justify-center gap-4 transition-all shadow-lg ${
                  isRecordingDedication 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-stone-800 text-white hover:bg-stone-900'
                }`}
              >
                {isRecordingDedication ? (
                  <>
                    <Square size={32} />
                    Detener ({Math.floor(dedicationTimer / 60)}:{(dedicationTimer % 60).toString().padStart(2, '0')})
                  </>
                ) : (
                  <>
                    <Mic size={32} />
                    {dedication ? 'Volver a grabar dedicatoria' : 'Grabar dedicatoria'}
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Cover Section */}
          <section className="bg-white rounded-[3rem] shadow-xl border border-stone-100 p-10">
            <div className="flex items-center gap-4 mb-8 text-brand-blue">
              <ImageIcon size={40} />
              <h2 className="text-4xl font-bold text-stone-800">Personaliza tu Libro</h2>
            </div>

            {/* Step 1: Tone Selection */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center text-sm">1</div>
                Elige el Tono de tu Historia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCoverConfig(prev => ({ ...prev, tone: t.id }))}
                    className={`p-6 rounded-[2rem] border-4 transition-all text-left ${
                      coverConfig.tone === t.id ? 'border-brand-blue bg-brand-blue/5' : 'border-stone-100 hover:border-stone-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl mb-4 shadow-inner ${t.colors} flex items-center justify-center`}>
                      <Star size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-stone-800 mb-1">{t.name}</h4>
                    <p className="text-stone-500 text-sm">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Template Selection */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center text-sm">2</div>
                Elige tu Portada Favorita
              </h3>
              <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                {(['option1', 'option2'] as CoverTemplate[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setCoverConfig(prev => ({ ...prev, template: opt }))}
                    className={`aspect-[3/4] rounded-[2rem] border-4 transition-all relative overflow-hidden shadow-xl ${
                      coverConfig.template === opt ? 'border-brand-blue scale-105 shadow-2xl z-10' : 'border-transparent hover:border-stone-200'
                    }`}
                  >
                    {getTemplatePreview(coverConfig.tone, opt)}
                    {coverConfig.template === opt && (
                      <div className="absolute top-4 right-4 bg-brand-blue text-white p-1.5 rounded-full shadow-lg z-20">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Photo Upload */}
            <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100">
              <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
                <Camera size={28} className="text-stone-400" />
                Sube tu Foto Principal
              </h3>
              
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-48 h-64 bg-white rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative group border-2 border-dashed border-stone-300">
                  {coverConfig.userImage ? (
                    <img src={coverConfig.userImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Camera size={48} className="text-stone-300 mx-auto mb-2" />
                      <span className="text-stone-400 font-bold text-sm uppercase tracking-widest block">Tu foto irá aquí</span>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <span className="text-white font-bold">Cambiar foto</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-lg text-stone-500">
                    Esta foto aparecerá en el centro de la portada que elegiste arriba. Recomendamos un retrato claro y con buena iluminación.
                  </p>
                  <label className="inline-flex items-center gap-3 bg-white border-2 border-stone-200 px-6 py-3 rounded-2xl font-bold text-stone-600 hover:bg-stone-50 cursor-pointer transition-all">
                    <Download size={20} />
                    Seleccionar archivo
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const PrivacyView = (): React.ReactElement => (
    <div className="pb-10">
      <button
        onClick={goHome}
        className="flex items-center gap-3 text-2xl font-bold text-stone-600 mb-8 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-200 active:bg-stone-100 self-start"
      >
        <ArrowLeft size={32} />
        Regresar
      </button>

      <div className="p-8 rounded-3xl mb-8 bg-white shadow-xl border border-stone-100">
        <div className="flex items-center gap-3 mb-6 text-emerald-600">
          <ShieldCheck size={40} />
          <h2 className="text-4xl font-bold text-stone-800">Privacidad</h2>
        </div>

        <div className="space-y-6 text-xl text-stone-600 leading-relaxed">
          <p>
            En <strong>El Libro de mi Vida</strong>, tu privacidad es nuestra prioridad absoluta. Esta aplicación ha sido diseñada bajo el principio de "Privacidad por Diseño".
          </p>
          
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h3 className="font-bold text-stone-800 mb-2">Tus datos son tuyos</h3>
            <p>
              Todas las grabaciones de voz y borradores se guardan <strong>únicamente en la memoria de tu dispositivo</strong> (almacenamiento local). No enviamos tus audios a ningún servidor externo para su almacenamiento.
            </p>
          </div>

          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h3 className="font-bold text-stone-800 mb-2">Uso de Inteligencia Artificial</h3>
            <p>
              Utilizamos la tecnología de Google Gemini únicamente para la función de "Audiolibro", donde el texto de las preguntas se convierte a voz. Tus grabaciones personales no son procesadas por la IA para entrenamiento ni análisis.
            </p>
          </div>

          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h3 className="font-bold text-stone-800 mb-2">Sin rastreo</h3>
            <p>
              No recopilamos información personal identificable, ni utilizamos cookies de rastreo publicitario. La aplicación es una herramienta pura para la preservación de tu legado familiar.
            </p>
          </div>

          <p className="italic text-stone-400 text-lg">
            Última actualización: Febrero 2026
          </p>
        </div>
      </div>

      {/* Debug/Test Section to reset the app */}
      <div className="p-8 rounded-3xl bg-red-50 border-2 border-dashed border-red-200">
        <h3 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
          <Trash2 size={28} />
          Zona de Pruebas
        </h3>
        <p className="text-red-600 mb-6 text-lg">
          Usa este botón para simular que eres un usuario nuevo que acaba de descargar la app. Se borrarán tus grabaciones y el estado Premium.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={async () => {
              if (confirm('¿Estás seguro? Se borrarán todos tus datos locales (incluyendo audios) para simular un inicio limpio.')) {
                await audioStorage.clearAll();
                await draftStorage.clearAll();
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg active:scale-95"
          >
            Reiniciar Aplicación (Modo Prueba)
          </button>

          <button
            onClick={() => {
              setIsPremium(false);
              localStorage.removeItem('isPremium');
              alert('Modo Premium desactivado. Ahora puedes ver la app como un usuario gratuito.');
              goHome();
            }}
            className="bg-stone-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-900 transition-all shadow-lg active:scale-95"
          >
            Desactivar Premium
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsView = (): React.ReactElement => (
    <div className="pb-10">
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={goHome}
          className="p-4 rounded-2xl bg-white shadow-sm border border-stone-200 text-stone-600 active:scale-95 transition-all"
        >
          <ArrowLeft size={28} />
        </button>
        <h2 className="text-3xl font-bold text-stone-800">Ajustes</h2>
      </header>

      <div className="space-y-6">
        <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100">
          <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Download size={28} className="text-brand-blue" />
            Exportación y Respaldo
          </h3>
          <p className="text-lg text-stone-500 mb-6 leading-relaxed">
            Tus datos se guardan solo en este dispositivo. Te recomendamos exportar una copia de seguridad periódicamente.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-3 bg-brand-blue text-white p-5 rounded-3xl font-bold text-xl shadow-lg hover:bg-brand-blue-hover active:scale-95 transition-all"
            >
              <Download size={24} />
              Exportar Copia de Seguridad
            </button>
            
            <label className="flex items-center justify-center gap-3 bg-stone-800 text-white p-5 rounded-3xl font-bold text-xl shadow-lg hover:bg-stone-900 active:scale-95 transition-all cursor-pointer">
              <ArrowUpCircle size={24} />
              Importar Copia de Seguridad
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleImportBackup}
              />
            </label>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100">
          <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
            <ShieldCheck size={28} className="text-emerald-500" />
            Privacidad y Legal
          </h3>
          <button
            onClick={goToPrivacy}
            className="w-full text-left p-6 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-all flex items-center justify-between group"
          >
            <span className="text-xl font-bold text-stone-700">Política de Privacidad</span>
            <ChevronRight className="text-stone-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100">
          <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-2">
            <Trash2 size={28} />
            Zona de Peligro
          </h3>
          <p className="text-lg text-stone-500 mb-6 leading-relaxed">
            Estas acciones son irreversibles. Ten cuidado al usarlas.
          </p>
          <button
            onClick={async () => {
              if (confirm('¿Estás seguro de que quieres borrar TODAS tus historias y grabaciones? Esta acción no se puede deshacer.')) {
                await audioStorage.clearAll();
                await draftStorage.clearAll();
                const premium = localStorage.getItem('memoriaVivaIsPremium');
                localStorage.clear();
                if (premium) localStorage.setItem('memoriaVivaIsPremium', premium);
                alert("Todas las historias han sido borradas.");
                window.location.reload();
              }
            }}
            className="w-full flex items-center justify-center gap-3 border-2 border-red-200 text-red-600 p-5 rounded-3xl font-bold text-xl hover:bg-red-50 active:scale-95 transition-all"
          >
            <Trash2 size={24} />
            Borrar todas mis historias
          </button>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdfcf8] text-stone-800 font-sans selection:bg-amber-200 overflow-x-hidden">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        <main className="flex-1 p-4 md:p-6">
          {showOnboarding && <OnboardingView />}
          {currentView === 'home' && <HomeView />}
          {currentView === 'chapter' && <ChapterView />}
          {currentView === 'recorder' && (
            <RecorderView
              recordings={recordings}
              draftRecordings={draftRecordings}
              saveRecordingData={saveRecordingData}
              deleteRecording={deleteRecording}
              saveDraftRecordingData={saveDraftRecordingData}
              deleteDraftRecording={deleteDraftRecording}
              goToNextQuestion={goToNextQuestion}
            />
          )}
          {currentView === 'explanation' && <ExplanationView />}
          {currentView === 'audiobook' && <AudiobookView />}
          {currentView === 'book' && <BookView />}
          {currentView === 'premium' && <PremiumView />}
          {currentView === 'privacy' && <PrivacyView />}
          {currentView === 'cover_config' && <CoverAndDedicationView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Tailwind's built-in animations are used where possible. Custom keyframe animations
          like 'fade-in' and 'bounce-slow' are not supported directly with the CDN-only
          Tailwind setup without a tailwind.config.js file. */}
      <style>{`
        /* Minimal custom keyframes for pulse-slow if needed, otherwise rely on Tailwind's 'animate-pulse' */
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .markdown-body { font-size: 12pt; line-height: 1.5; }
          .bg-white { box-shadow: none !important; border: none !important; }
          button, .fixed { display: none !important; }
        }
      `}</style>
    </div>
  );
}