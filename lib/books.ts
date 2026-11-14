export type Book = {
  id: string;
  title: string;
  author: string;
  isbn13?: string;
  isbn10?: string;
  skoobId?: string;
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
  publisher?: string;
  pageCount?: number;
  hasRealCover?: boolean;
  isScanned?: boolean;
  coverQualityScore?: number;
};

export const moods = [
  { id: "feliz", label: "Feliz", emoji: "/happy.png", color: "bg-[#f8efd9]" },
  { id: "ansioso", label: "Ansioso", emoji: "/ansioso.png", color: "bg-[#e9e4f2]" },
  { id: "triste", label: "Um pouco triste", emoji: "/sad.png", color: "bg-[#e4ebee]" },
  { id: "apaixonado", label: "Apaixonado", emoji: "/love.png", color: "bg-[#f4e3e1]" },
  { id: "esperancoso", label: "Esperançoso", emoji: "/yoga.png", color: "bg-[#e5eee4]" },
  { id: "introspectivo", label: "Introspectivo", emoji: "/pensando.png", color: "bg-[#eee8df]" },
  { id: "saudoso", label: "Saudoso", emoji: "/past.png", color: "bg-[#eee7dc]" },
  { id: "curioso", label: "Curioso", emoji: "/curioso.png", color: "bg-[#e3eceb]" },
  { id: "cansado", label: "Precisando de leveza", emoji: "/relax.png", color: "bg-[#f0e9e3]" },
  { id: "inspirado", label: "Inspirado", emoji: "/Sun.png", color: "bg-[#e4eddf]" },
];
