import { Book } from "@/lib/books";

type GoogleVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    infoLink?: string;
    previewLink?: string;
    publishedDate?: string;
    averageRating?: number;
    ratingsCount?: number;
    language?: string;
  };
};

type GoogleBooksResponse = {
  items?: GoogleVolume[];
  error?: { message?: string };
};

export class GoogleBooksError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "GoogleBooksError";
  }
}

const categoryTranslations: Record<string, string> = {
  "adventure stories": "Aventura",
  adventure: "Aventura",
  "biography & autobiography": "Biografia e autobiografia",
  biography: "Biografia",
  business: "Negócios",
  "business & economics": "Negócios e economia",
  classics: "Clássicos",
  comedy: "Comédia",
  comics: "Quadrinhos",
  "comics & graphic novels": "Quadrinhos e romances gráficos",
  cooking: "Culinária",
  drama: "Drama",
  education: "Educação",
  fantasy: "Fantasia",
  fiction: "Ficção",
  "juvenile fiction": "Ficção infantojuvenil",
  history: "História",
  humor: "Humor",
  literature: "Literatura",
  "literary collections": "Coletâneas literárias",
  "literary criticism": "Crítica literária",
  "mystery & detective": "Mistério e investigação",
  nonfiction: "Não ficção",
  poetry: "Poesia",
  psychology: "Psicologia",
  religion: "Religião",
  romance: "Romance",
  science: "Ciência",
  "science fiction": "Ficção científica",
  "self-help": "Autoajuda",
  suspense: "Suspense",
  thrillers: "Suspense e thriller",
  travel: "Viagem",
};

const portugueseDescriptionWords = new Set([
  "ao",
  "aos",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "esta",
  "este",
  "mais",
  "mas",
  "na",
  "nas",
  "no",
  "nos",
  "nao",
  "para",
  "pela",
  "pelas",
  "pelo",
  "pelos",
  "por",
  "que",
  "seu",
  "sua",
  "seus",
  "suas",
  "uma",
  "umas",
  "uns",
  "voce",
]);

const englishDescriptionWords = new Set([
  "about",
  "after",
  "and",
  "are",
  "been",
  "book",
  "by",
  "for",
  "from",
  "has",
  "have",
  "her",
  "his",
  "into",
  "is",
  "its",
  "novel",
  "of",
  "on",
  "story",
  "that",
  "their",
  "the",
  "this",
  "through",
  "to",
  "was",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "you",
]);

function isPortugueseEdition(language?: string): boolean {
  return language?.toLowerCase().startsWith("pt") ?? false;
}

function isPortugueseDescription(description: string, editionLanguage?: string): boolean {
  const words = description
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[\p{L}]+/gu);

  if (!words?.length) return isPortugueseEdition(editionLanguage);

  const portugueseScore = words.filter((word) => portugueseDescriptionWords.has(word)).length;
  const englishScore = words.filter((word) => englishDescriptionWords.has(word)).length;

  if (portugueseScore !== englishScore) return portugueseScore > englishScore;
  return isPortugueseEdition(editionLanguage);
}

function translateCategory(category?: string): string {
  if (!category) return "Livro";

  const normalizedCategory = category.split("/")[0].trim().toLowerCase();
  return categoryTranslations[normalizedCategory] ?? "Livro";
}

function getHighResolutionCover(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;

  const coverUrl = new URL(imageUrl.replace(/^http:/, "https:"));
  coverUrl.searchParams.set("zoom", "0");
  coverUrl.searchParams.delete("edge");
  return coverUrl.toString();
}

export async function searchGoogleBooks(query: string, maxResults = 20): Promise<Book[]> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("langRestrict", "pt");
  url.searchParams.set("country", "BR");
  url.searchParams.set("printType", "books");
  url.searchParams.set("orderBy", "relevance");

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) url.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 3600 } });
  } catch {
    throw new GoogleBooksError(
      "Não foi possível conectar ao Google Books. Tente novamente em instantes.",
      503,
    );
  }

  const data = (await response.json().catch(() => null)) as GoogleBooksResponse | null;
  if (!response.ok) {
    const message = data?.error?.message;
    throw new GoogleBooksError(
      message
        ? `O Google Books não conseguiu concluir a busca: ${message}`
        : "O Google Books está indisponível no momento. Tente novamente.",
      response.status === 429 ? 503 : 502,
    );
  }

  const volumes = (data?.items ?? []).filter((volume) => volume.volumeInfo?.title);
  const portugueseVolumes = volumes.filter((volume) =>
    isPortugueseEdition(volume.volumeInfo?.language),
  );
  const preferredVolumes = portugueseVolumes.length ? portugueseVolumes : volumes;

  return preferredVolumes.map((volume, index) => {
    const info = volume.volumeInfo!;
    const isPortuguese = isPortugueseEdition(info.language);
    const rawDescription = info.description?.trim();
    const hasPortugueseDescription = rawDescription
      ? isPortugueseDescription(rawDescription, info.language)
      : false;
    const rawCover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
    const coverUrl = getHighResolutionCover(rawCover);
    const title = info.subtitle ? `${info.title}: ${info.subtitle}` : info.title!;

    return {
      id: volume.id,
      title,
      author: info.authors?.join(", ") ?? "Autor não informado",
      description:
        (hasPortugueseDescription ? rawDescription : undefined) ||
        "Descrição em português não disponível para esta edição.",
      ...(rawDescription && !hasPortugueseDescription
        ? { descriptionEnglish: rawDescription }
        : {}),
      genre: translateCategory(info.categories?.[0]),
      ...(info.language ? { language: info.language } : {}),
      ...(info.categories ? { categories: info.categories } : {}),
      mood: [],
      styles: [],
      pace: [],
      cover: `cover-${["blue", "amber", "rose", "olive", "plum", "sky", "sand", "mint"][index % 8]}`,
      mark: "✦",
      ...(coverUrl ? { coverUrl } : {}),
      ...(info.infoLink ? { infoLink: info.infoLink } : {}),
      ...(info.previewLink ? { previewLink: info.previewLink } : {}),
      ...(info.publishedDate ? { publishedDate: info.publishedDate } : {}),
      ...(info.averageRating !== undefined ? { averageRating: info.averageRating } : {}),
      ...(info.ratingsCount !== undefined ? { ratingsCount: info.ratingsCount } : {}),
    };
  });
}
