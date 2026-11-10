export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  descriptionEnglish?: string;
  genre: string;
  mood: string[];
  styles: string[];
  pace: string[];
  cover: string;
  mark: string;
  language?: string;
  categories?: string[];
  coverUrl?: string;
  infoLink?: string;
  previewLink?: string;
  publishedDate?: string;
  averageRating?: number;
  ratingsCount?: number;
};

export const moods = [
  { id: "feliz", label: "Feliz", emoji: "☀", color: "bg-[#f8efd9]" },
  { id: "ansioso", label: "Ansioso", emoji: "〰", color: "bg-[#e9e4f2]" },
  { id: "triste", label: "Um pouco triste", emoji: "☁", color: "bg-[#e4ebee]" },
  { id: "apaixonado", label: "Apaixonado", emoji: "♡", color: "bg-[#f4e3e1]" },
  { id: "esperancoso", label: "Esperançoso", emoji: "✳", color: "bg-[#e5eee4]" },
  { id: "introspectivo", label: "Introspectivo", emoji: "☾", color: "bg-[#eee8df]" },
  { id: "saudoso", label: "Saudoso", emoji: "⌁", color: "bg-[#eee7dc]" },
  { id: "curioso", label: "Curioso", emoji: "✦", color: "bg-[#e3eceb]" },
  { id: "cansado", label: "Precisando de leveza", emoji: "☁", color: "bg-[#f0e9e3]" },
  { id: "inspirado", label: "Inspirado", emoji: "↗", color: "bg-[#e4eddf]" },
];
