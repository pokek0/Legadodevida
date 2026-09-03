
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause, Trash2, ChevronRight, ArrowLeft, CheckCircle, Feather, Volume2, VolumeX, BookOpen, Headphones, Loader2, Share2, ShieldCheck, PenTool, Download, Printer, Crown, St[...]
import { CHAPTERS, TRIGGER_QUESTIONS, APP_URL } from './constants';
import { Chapter, Question, Recordings, CurrentView, CoverConfig, CoverTemplate, BookTone } from './types';
import { GoogleGenAI, Modality } from "@google/genai";
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { audioStorage, draftStorage } from './src/services/storage';
import { ASSETS } from './src/assets';

const appLogo = ASSETS.logo;

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
[...]