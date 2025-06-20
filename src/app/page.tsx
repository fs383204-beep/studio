'use client';

import { useState, useContext, useMemo } from 'react';
import Link from 'next/link';
import { AppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Search, Book } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  const { titles, addTitle } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAddTitle = () => {
    if (newTitle.trim()) {
      addTitle(newTitle.trim());
      setNewTitle('');
      setIsAddDialogOpen(false);
    }
  };

  const filteredTitles = useMemo(() => {
    return titles
      .filter(title =>
        title.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [titles, searchQuery]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold font-headline tracking-tight">TitleNote</h1>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 w-full flex-grow">
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search titles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="shrink-0">
            <Plus className="mr-2 h-5 w-5" />
            New Title
          </Button>
        </div>

        {filteredTitles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTitles.map(title => (
              <Link href={`/title/${title.id}`} key={title.id} passHref>
                <Card className="h-full hover:shadow-md transition-shadow duration-300 hover:border-primary cursor-pointer flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-headline truncate">{title.name}</CardTitle>
                    <CardDescription>{title.notes.length} {title.notes.length === 1 ? 'note' : 'notes'}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Book className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Titles Yet</h2>
            <p className="mt-2 text-muted-foreground">Click "New Title" to get started.</p>
          </div>
        )}
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new title</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter title name"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTitle()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddTitle} disabled={!newTitle.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
