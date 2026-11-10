import { NextResponse } from "next/server";
import { GoogleBooksError, searchGoogleBooks } from "@/lib/google-books";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Digite pelo menos 2 caracteres para buscar livros." },
      { status: 400 },
    );
  }

  try {
    const books = await searchGoogleBooks(query.slice(0, 100), 24);
    return NextResponse.json({ books });
  } catch (error) {
    const status = error instanceof GoogleBooksError ? error.status : 502;
    const message =
      error instanceof GoogleBooksError
        ? error.message
        : "Não foi possível buscar livros no Google Books.";
    return NextResponse.json({ error: message }, { status });
  }
}
