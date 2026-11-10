import { NextResponse } from "next/server";
import { Book, moods } from "@/lib/books";
import { GoogleBooksError, searchGoogleBooks } from "@/lib/google-books";

export const runtime = "nodejs";

const validStyles = new Set(["reflexivo", "imaginativo", "emocional", "intenso"]);
const validPaces = new Set(["leve", "envolvente", "contemplativo", "intenso"]);
const validMoods = new Set(moods.map((mood) => mood.id));

const styleSubjects: Record<string, string> = {
  reflexivo: "Literary Fiction",
  imaginativo: "Fantasy",
  emocional: "Romance",
  intenso: "Thrillers",
};

const moodSubjects: Record<string, string> = {
  feliz: "Humor",
  ansioso: "Fiction",
  triste: "Fiction",
  apaixonado: "Romance",
  esperancoso: "Fiction",
  introspectivo: "Literary Fiction",
  saudoso: "Fiction",
  curioso: "Adventure",
  cansado: "Humor",
  inspirado: "Biography & Autobiography",
};

const paceSubjects: Record<string, string> = {
  leve: "Humor",
  envolvente: "Adventure",
  contemplativo: "Literary Fiction",
  intenso: "Thrillers",
};

const subjectAliases: Record<string, string[]> = {
  "Literary Fiction": ["literary fiction", "literary collections", "fiction"],
  Fantasy: ["fantasy", "fairy tales", "magic"],
  Romance: ["romance"],
  Thrillers: ["thriller", "mystery", "suspense"],
  Humor: ["humor", "comedy"],
  Fiction: ["fiction"],
  Adventure: ["adventure", "action"],
  "Biography & Autobiography": ["biography", "autobiography", "memoir"],
};

function isBook(value: unknown): value is Book {
  if (typeof value !== "object" || value === null) return false;

  return (
    "id" in value &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    "title" in value &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    "author" in value &&
    typeof value.author === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "genre" in value &&
    typeof value.genre === "string" &&
    (!("categories" in value) ||
      (Array.isArray(value.categories) &&
        value.categories.every((category) => typeof category === "string")))
  );
}

function getSubjectWeights(styles: string[], mood: string, pace: string) {
  const subjects = new Map<string, number>();

  for (const style of styles) {
    const subject = styleSubjects[style];
    if (subject) subjects.set(subject, (subjects.get(subject) ?? 0) + 3);
  }

  const moodSubject = moodSubjects[mood];
  subjects.set(moodSubject, (subjects.get(moodSubject) ?? 0) + 2);

  const paceSubject = paceSubjects[pace];
  subjects.set(paceSubject, (subjects.get(paceSubject) ?? 0) + 1);

  return subjects;
}

function normalizeCategory(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function rankShelfBooks(shelfBooks: Book[], subjects: Map<string, number>) {
  return shelfBooks
    .map((book) => {
      const categories = [...(book.categories ?? []), book.genre]
        .flatMap((category) => category.split("/"))
        .map(normalizeCategory);
      let score = 0;

      for (const [subject, weight] of subjects) {
        const aliases = subjectAliases[subject] ?? [subject.toLowerCase()];
        if (categories.some((category) => aliases.some((alias) => category.includes(alias)))) {
          score += weight;
        }
      }

      return { book, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ book }) => book);
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  if (
    typeof body !== "object" ||
    body === null ||
    !("styles" in body) ||
    !("pace" in body) ||
    !("mood" in body) ||
    !Array.isArray(body.styles) ||
    !body.styles.every((style) => typeof style === "string" && validStyles.has(style)) ||
    typeof body.pace !== "string" ||
    !validPaces.has(body.pace) ||
    typeof body.mood !== "string" ||
    !validMoods.has(body.mood) ||
    ("source" in body &&
      body.source !== undefined &&
      body.source !== "catalog" &&
      body.source !== "shelf") ||
    ("source" in body &&
      body.source === "shelf" &&
      (!("shelfBooks" in body) ||
        !Array.isArray(body.shelfBooks) ||
        body.shelfBooks.length === 0 ||
        body.shelfBooks.length > 100 ||
        !body.shelfBooks.every(isBook)))
  ) {
    return NextResponse.json(
      { error: "Não conseguimos entender suas escolhas. Tente novamente." },
      { status: 400 },
    );
  }

  try {
    const subjects = getSubjectWeights(body.styles, body.mood, body.pace);

    if (
      "source" in body &&
      body.source === "shelf" &&
      "shelfBooks" in body &&
      Array.isArray(body.shelfBooks)
    ) {
      const recommendations = rankShelfBooks(body.shelfBooks, subjects);

      if (!recommendations.length) {
        return NextResponse.json(
          {
            error:
              "Não encontramos livros da sua estante que combinem com esse perfil. Tente outra combinação ou busque no catálogo completo.",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({ recommendations });
    }

    const resultsBySubject = await Promise.all(
      [...subjects].map(async ([subject, weight]) => ({
        weight,
        books: await searchGoogleBooks(`subject:${subject}`, 12),
      })),
    );

    const scores = new Map<string, { book: Book; score: number }>();
    for (const { weight, books } of resultsBySubject) {
      books.forEach((book, index) => {
        const existing = scores.get(book.id);
        const score = weight / (index + 1);
        scores.set(book.id, { book, score: (existing?.score ?? 0) + score });
      });
    }

    const recommendations = [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ book }) => book);

    if (!recommendations.length) {
      return NextResponse.json(
        {
          error:
            "O Google Books não encontrou títulos para este perfil. Tente ajustar suas escolhas.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    const status = error instanceof GoogleBooksError ? error.status : 502;
    const message =
      error instanceof GoogleBooksError
        ? error.message
        : "Não foi possível buscar recomendações no Google Books.";
    return NextResponse.json({ error: message }, { status });
  }
}
