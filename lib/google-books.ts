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

  return (data?.items ?? [])
    .filter((volume) => volume.volumeInfo?.title)
    .map((volume, index) => {
      const info = volume.volumeInfo!;
      const rawCover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
      const coverUrl = getHighResolutionCover(rawCover);
      const title = info.subtitle ? `${info.title}: ${info.subtitle}` : info.title!;

      return {
        id: volume.id,
        title,
        author: info.authors?.join(", ") ?? "Autor não informado",
        description: info.description ?? "Descrição não disponível no Google Books.",
        genre: info.categories?.[0] ?? "Livro",
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
