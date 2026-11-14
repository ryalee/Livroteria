import { Book } from "@/lib/books";

type GoogleVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    readingModes?: {
      text?: boolean;
      image?: boolean;
    };
    pageCount?: number;
    printType?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    infoLink?: string;
    previewLink?: string;
    language?: string;
  };
  accessInfo?: {
    publicDomain?: boolean;
    epub?: { isAvailable?: boolean };
    pdf?: { isAvailable?: boolean };
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

  if (!words?.length) {
    return isPortugueseEdition(editionLanguage);
  }

  const portugueseScore = words.filter((word) => portugueseDescriptionWords.has(word)).length;

  const englishScore = words.filter((word) => englishDescriptionWords.has(word)).length;

  if (portugueseScore !== englishScore) {
    return portugueseScore > englishScore;
  }

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

export type CoverQuality = {
  score: number;
  hasRealCover: boolean;
  isScanned: boolean;
};

const reprintPublishers = [
  "wentworth press",
  "forgotten books",
  "palala press",
  "nabu press",
  "legare street press",
  "creative media partners",
  "kessinger publishing",
  "alpha edition",
  "andesite press",
  "franklin classics",
  "arkose press",
  "general books",
  "rarebooksclub",
  "scholar's choice",
  "bibliobazaar",
  "hansebooks",
  "blurb",
  "lulu",
  "reprint",
  "facsimile",
  "book on demand",
  "classic reprint",
  "bavarian state library",
  "british library",
  "harvard library",
  "bodleian",
];

const academicOrPamphletPublishers = [
  "universidade de",
  "faculdade de",
  "tese de",
  "dissertação",
  "dissertacao",
  "monografia",
  "relatório",
  "relatorio",
  "governo do",
  "ministério",
  "ministerio",
];

const qualityPublishers = [
  "companhia das letras",
  "rocco",
  "record",
  "intrinseca",
  "intrínseca",
  "sextante",
  "arqueiro",
  "darkside",
  "globo",
  "leya",
  "aleph",
  "todavia",
  "antofagica",
  "antofágica",
  "suma",
  "harpercollins",
  "planeta",
  "galera",
  "novo conceito",
  "autentica",
  "autêntica",
  "editora 34",
  "cosac naify",
  "zahar",
  "morro branco",
  "bertrand",
  "paralela",
  "seguinte",
  "bestseller",
  "principis",
  "pandorga",
  "v&r",
  "alta books",
  "faro editorial",
  "gutenberg",
  "martin claret",
  "penguin",
  "abril",
  "estação liberdade",
  "estacao liberdade",
  "l&pm",
];

const scanTitlePhrases = [
  "(classic reprint)",
  "primary source edition",
  "scholar's choice edition",
  "facsimile reprint",
  "reprinted from",
  "edicao fac-similar",
  "edição fac-similar",
  "edicao fac-simile",
  "edição fac-símile",
  "reprodução fac-similar",
  "reproducao fac-similar",
];

const reprintDisclaimers = [
  "this work has been selected by scholars",
  "this is a reproduction of a book published before",
  "this work is in the public domain",
  "this book is a reproduction of an important historical work",
  "this historic book may have numerous typos",
  "imperfections such as marks, notations",
  "imperfections such as missing or blurred pages",
  "digitized by google",
  "digitally preserved",
  "scanned copy of the original",
  "obra selecionada por estudiosos",
  "reprodução de um livro histórico",
  "esta obra está em domínio público",
];

export function evaluateCoverQuality(volume: GoogleVolume): CoverQuality {
  const info = volume.volumeInfo;

  if (!info) {
    return { score: -100, hasRealCover: false, isScanned: false };
  }

  const rawCover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;

  if (!rawCover) {
    return { score: -80, hasRealCover: false, isScanned: false };
  }

  let score = 0;
  let isScanned = false;

  const readingModes = info.readingModes;

  if (readingModes) {
    if (readingModes.text === false && readingModes.image === true) {
      score -= 60;
      isScanned = true;
    } else if (readingModes.text === true) {
      score += 30;
    }
  }

  const accessInfo = volume.accessInfo;

  if (accessInfo) {
    if (accessInfo.publicDomain === true) {
      score -= 20;

      if (accessInfo.pdf?.isAvailable === true && accessInfo.epub?.isAvailable === false) {
        score -= 40;
        isScanned = true;
      }
    }

    if (accessInfo.epub?.isAvailable === true) {
      score += 15;
    }
  }

  const identifiers = info.industryIdentifiers ?? [];

  const hasIsbn13 = identifiers.some((id) => id.type === "ISBN_13");
  const hasIsbn10 = identifiers.some((id) => id.type === "ISBN_10");
  const onlyOther = identifiers.length > 0 && identifiers.every((id) => id.type === "OTHER");

  if (hasIsbn13) {
    score += 25;
  } else if (hasIsbn10) {
    score += 15;
  }

  if (onlyOther) {
    score -= 40;
    isScanned = true;
  } else if (identifiers.length === 0) {
    score -= 15;
  }

  const publisher = (info.publisher ?? "").toLowerCase().trim();

  const publishedYear = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : null;

  if (reprintPublishers.some((publisherName) => publisher.includes(publisherName))) {
    score -= 60;
    isScanned = true;
  } else if (
    academicOrPamphletPublishers.some((publisherName) => publisher.includes(publisherName))
  ) {
    score -= 40;
    isScanned = true;
  } else if (
    publisher.includes("oxford university press") &&
    publishedYear &&
    publishedYear < 1980
  ) {
    score -= 50;
    isScanned = true;
  } else if (qualityPublishers.some((publisherName) => publisher.includes(publisherName))) {
    score += 35;
  } else if (publisher.length >= 3) {
    score += 10;
  }

  const fullTitle = `${info.title ?? ""} ${info.subtitle ?? ""}`.toLowerCase();

  if (scanTitlePhrases.some((phrase) => fullTitle.includes(phrase))) {
    score -= 50;
    isScanned = true;
  }

  const desc = (info.description ?? "").toLowerCase();

  if (reprintDisclaimers.some((phrase) => desc.includes(phrase))) {
    score -= 60;
    isScanned = true;
  }

  if (info.description && info.description.length > 120) {
    score += 15;
  } else if (!info.description) {
    score -= 15;
  }

  if (publishedYear && !isNaN(publishedYear)) {
    if (publishedYear >= 2010) {
      score += 20;
    } else if (publishedYear >= 1990) {
      score += 10;
    } else if (publishedYear < 1970) {
      score -= 35;
      isScanned = true;
    }
  }

  if (info.ratingsCount && info.ratingsCount > 0) {
    score += Math.min(30, info.ratingsCount * 5);
  }

  if (info.averageRating && info.averageRating >= 3.5) {
    score += 10;
  }

  if (info.pageCount && info.pageCount >= 60 && info.pageCount <= 1200) {
    score += 10;
  } else if (info.pageCount && info.pageCount < 25) {
    score -= 20;
  }

  const hasRealCover = Boolean(rawCover) && !isScanned && score >= 10;

  return { score, hasRealCover, isScanned };
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

  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

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

  const mappedBooks = preferredVolumes.map((volume, index) => {
    const info = volume.volumeInfo!;
    const identifiers = info.industryIdentifiers ?? [];

    const isbn13 = identifiers.find((identifier) => identifier.type === "ISBN_13")?.identifier;

    const isbn10 = identifiers.find((identifier) => identifier.type === "ISBN_10")?.identifier;

    const rawDescription = info.description?.trim();

    const hasPortugueseDescription = rawDescription
      ? isPortugueseDescription(rawDescription, info.language)
      : false;

    const rawCover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;

    const coverUrl = getHighResolutionCover(rawCover);

    const title = info.subtitle ? `${info.title}: ${info.subtitle}` : info.title!;

    const quality = evaluateCoverQuality(volume);

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
      ...(info.publisher ? { publisher: info.publisher } : {}),
      ...(info.pageCount ? { pageCount: info.pageCount } : {}),
      hasRealCover: quality.hasRealCover,
      isScanned: quality.isScanned,
      coverQualityScore: quality.score,
      ...(isbn13 ? { isbn13 } : {}),
      ...(isbn10 ? { isbn10 } : {}),
    };
  });

  console.table(
    mappedBooks.map((book) => ({
      title: book.title,
      isbn13: book.isbn13,
      isbn10: book.isbn10,
    })),
  );

  return mappedBooks.sort((a, b) => {
    const aReal = a.hasRealCover && !a.isScanned && Boolean(a.coverUrl);
    const bReal = b.hasRealCover && !b.isScanned && Boolean(b.coverUrl);

    if (aReal !== bReal) {
      return aReal ? -1 : 1;
    }

    return (b.coverQualityScore ?? 0) - (a.coverQualityScore ?? 0);
  });
}
