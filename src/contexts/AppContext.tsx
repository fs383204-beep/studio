'use client';

import { createContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Title, Note } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Due to using local storage which is client side, we cannot import uuid directly in a server component context. A workaround is to require it on demand.
let v4: () => string;
try {
  v4 = require('uuid').v4;
} catch (e) {
  v4 = () => `mock-id-${Math.random()}`;
}


interface AppContextType {
  titles: Title[];
  addTitle: (name: string) => void;
  deleteTitle: (id: string) => void;
  getNotesForTitle: (titleId: string) => Note[];
  addNote: (titleId: string, content: string) => void;
  deleteNote: (titleId: string, noteId: string) => void;
  findTitleById: (titleId: string) => Title | undefined;
}

export const AppContext = createContext<AppContextType>({
  titles: [],
  addTitle: () => {},
  deleteTitle: () => {},
  getNotesForTitle: () => [],
  addNote: () => {},
  deleteNote: () => {},
  findTitleById: () => undefined,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [titles, setTitles] = useLocalStorage<Title[]>('titles', []);

  const addTitle = useCallback((name: string) => {
    const newTitle: Title = {
      id: v4(),
      name,
      notes: [],
      createdAt: Date.now(),
    };
    setTitles(prev => [...prev, newTitle]);
  }, [setTitles]);

  const deleteTitle = useCallback((id: string) => {
    setTitles(prev => prev.filter(title => title.id !== id));
  }, [setTitles]);
  
  const findTitleById = useCallback((titleId: string) => {
    return titles.find(title => title.id === titleId);
  }, [titles]);

  const getNotesForTitle = useCallback((titleId: string) => {
    const title = titles.find(t => t.id === titleId);
    return title ? title.notes.sort((a, b) => b.createdAt - a.createdAt) : [];
  }, [titles]);

  const addNote = useCallback((titleId: string, content: string) => {
    const newNote: Note = {
      id: v4(),
      content,
      createdAt: Date.now(),
    };
    setTitles(prev =>
      prev.map(title =>
        title.id === titleId
          ? { ...title, notes: [...title.notes, newNote] }
          : title
      )
    );
  }, [setTitles]);

  const deleteNote = useCallback((titleId: string, noteId: string) => {
    setTitles(prev =>
      prev.map(title =>
        title.id === titleId
          ? { ...title, notes: title.notes.filter(note => note.id !== noteId) }
          : title
      )
    );
  }, [setTitles]);

  return (
    <AppContext.Provider
      value={{
        titles,
        addTitle,
        deleteTitle,
        getNotesForTitle,
        addNote,
        deleteNote,
        findTitleById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
