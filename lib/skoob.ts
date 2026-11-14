import "server-only";

type SkoobSearchItem = {
  book_id: number;
  edition_id: number;
  title: string;
  author: string;
  slug: string;
  cover_filename: string;
  rating: number;
  pages: number;
  publisher: string | null;
  year: number | null;
};

type SkoobSearchResponse = {
  total_items: number;
  total_pages: number;
  items: SkoobSearchItem[];
};

const SKOOB_SEARCH_URL = "https://www.skoob.com.br/pt/search";

const SKOOB_ACTION_ID = "40a8165bb14a97b1360dd0e820ce6d5ba794aa2fb5";

export type SkoobBook = SkoobSearchItem & {
  url: string;
};

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, "").toUpperCase();
}

function parseSkoobResponse(responseText: string): SkoobSearchResponse {
  const resultLine = responseText.split("\n").find((line) => line.startsWith("1:"));

  if (!resultLine) {
    throw new Error("Não foi possível interpretar a resposta do Skoob.");
  }

  return JSON.parse(resultLine.slice(2)) as SkoobSearchResponse;
}

export async function searchSkoobByIsbn(isbn: string): Promise<SkoobBook | null> {
  const normalizedIsbn = normalizeIsbn(isbn);

  if (!/^(?:\d{10}|\d{13}|[0-9]{9}X)$/.test(normalizedIsbn)) {
    throw new Error("ISBN inválido.");
  }

  const searchUrl = new URL(SKOOB_SEARCH_URL);
  searchUrl.searchParams.set("searchTerm", normalizedIsbn);
  searchUrl.searchParams.set("tab", "book");

  const response = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "Next-Action": SKOOB_ACTION_ID,
    },
    body: JSON.stringify([
      {
        searchType: "book",
        params: {
          page: 1,
          limit: 12,
          searchTerm: normalizedIsbn,
        },
      },
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`O Skoob retornou o status ${response.status}.`);
  }

  const responseText = await response.text();
  const searchResult = parseSkoobResponse(responseText);

  // const book = searchResult.items?.[0];

  console.log("Resultado completo da busca Skoob:", {
    searchedIsbn: normalizedIsbn,
    totalItems: searchResult.total_items,
    items: searchResult.items,
  });

  const book = searchResult.items?.[0];

  if (!book) {
    return null;
  }

  return {
    ...book,
    url: `https://www.skoob.com.br/${book.slug}`,
  };
}
