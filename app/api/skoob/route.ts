import { searchSkoobByIsbn } from "@/lib/skoob";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const isbn = body?.isbn;

    if (typeof isbn !== "string" || !isbn.trim()) {
      return Response.json(
        { error: "ISBN não informado." },
        { status: 400 }
      );
    }

    const book = await searchSkoobByIsbn(isbn);

    if (!book) {
      return Response.json(
        { error: "Livro não encontrado no Skoob." },
        { status: 404 }
      );
    }

    return Response.json({
      url: book.url,
      title: book.title,
    });
  } catch (error) {
    console.error("Erro ao consultar o Skoob:", error);

    return Response.json(
      { error: "Não foi possível consultar o Skoob." },
      { status: 502 }
    );
  }
}
