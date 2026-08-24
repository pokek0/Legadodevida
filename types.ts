import React from 'react';

export type CurrentView = 'home' | 'chapter' | 'recorder' | 'explanation' | 'audiobook' | 'privacy' | 'book' | 'premium' | 'cover_config' | 'settings';

export interface Question {
  id: string;
  text: string;
  isAnecdote?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  // FIX: Define `icon` as a function that returns `React.ReactNode` with optional size and className props.
  icon: (props?: { size?: number; className?: string }) => React.ReactNode;
  color: string;
  questions: Question[];
}

export type RecordingItem = string | { mimeType?: string; data: string };

export type Recordings = {
  [questionId: string]: RecordingItem; // Stores either a data URL string or an object { mimeType, data }
};

export type CoverTemplate = 'option1' | 'option2';
export type BookTone = 'classic' | 'modern' | 'nature';

export interface CoverConfig {
  tone: BookTone;
  template: CoverTemplate;
  userImage?: string; // base64
}
