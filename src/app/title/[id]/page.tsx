'use client';

import { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Trash2, Plus, StickyNote } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Note, Title } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function TitleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { findTitleById, getNotesForTitle, addNote, deleteNote, deleteTitle } = useContext(AppContext);

  const titleId = params.id as string;
  const title = useMemo(() => findTitleById(titleId), [findTitleById, titleId]);
  const notes = useMemo(() => getNotesForTitle(titleId), [getNotesForTitle, titleId]);

  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isTitleDeleteAlertOpen, setIsTitleDeleteAlertOpen] = useState(false);
  const notesEndRef = useRef<HTMLDivElement>(null);
  
  // Effect to redirect if title not found
  useEffect(() => {
    if (!title) {
        const timeout = setTimeout(() => {
            if(!findTitleById(titleId)) {
                router.push('/');
            }
        }, 500);
        return () => clearTimeout(timeout);
    }
  }, [title, titleId, router, findTitleById]);
  
  const scrollToBottom = () => {
    notesEndRef.current?.scrollIntoView({ behavior: "smooth", block: 'start' });
  };

  const handleAddNote = () => {
    if (newNoteContent.trim() && title) {
      addNote(title.id, newNoteContent.trim());
      setNewNoteContent('');
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied to clipboard!',
      description: 'The note content has been copied.',
    });
  };
  
  const handleDeleteTitle = () => {
    if (title) {
      deleteTitle(title.id);
      router.push('/');
      toast({
        title: 'Title deleted',
        description: `"${title.name}" and all its notes have been deleted.`,
        variant: 'destructive',
      });
    }
  };

  const performNoteDeletion = () => {
    if(noteToDelete && title) {
        deleteNote(title.id, noteToDelete.id);
        setNoteToDelete(null);
    }
  }

  if (!title) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading title...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <h1 className="text-xl md:text-2xl font-bold font-headline tracking-tight truncate max-w-[150px] sm:max-w-xs md:max-w-sm">
                {title.name}
              </h1>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant="outline" size="icon" className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => setIsTitleDeleteAlertOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 w-full flex-grow max-w-2xl">
        <Card className="mb-6 shadow-sm">
            <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                    <Textarea
                    placeholder="Write a new note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={3}
                    />
                    <Button onClick={handleAddNote} disabled={!newNoteContent.trim()} className="self-end">
                    <Plus className="mr-2 h-4 w-4" />
                    Save Note
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Separator className="mb-6" />

        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map(note => (
              <Card key={note.id} className="group transition-shadow duration-200 hover:shadow-md">
                <CardContent className="p-4 flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon" onClick={() => handleCopy(note.content)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => setNoteToDelete(note)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
             <div ref={notesEndRef} />
          </div>
        ) : (
            <div className="text-center py-16">
                <StickyNote className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No Notes Here</h2>
                <p className="mt-2 text-muted-foreground">Add your first note above.</p>
            </div>
        )}
      </main>

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performNoteDeletion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isTitleDeleteAlertOpen} onOpenChange={setIsTitleDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{title.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this title and all its notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTitle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
