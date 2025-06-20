export interface Note {
  id: string;
  content: string;
  createdAt: number;
}

export interface Title {
  id: string;
  name: string;
  notes: Note[];
  createdAt: number;
}
