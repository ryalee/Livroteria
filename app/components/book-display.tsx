"use client";

import { ArrowRight } from "lucide-react";
import { Book } from "@/lib/books";
import { useState } from "react";

export function BookCover({ book, className = "" }: { book: Book; className?: string }) {
  const hasCoverImage = Boolean(book.coverUrl && !book.isScanned);

  return (
    <div
      className={`book-cover ${book.cover} ${className}`}
      aria-label={`Capa ilustrada de ${book.title}`}
    >
      {hasCoverImage ? (
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={book.coverUrl}
          alt={`Capa de ${book.title}`}
        />
      ) : (
        <>
          <span className="cover-title">{book.title}</span>

          <span className="cover-mark" aria-hidden="true">
            {book.mark}
          </span>

          <span className="cover-author">{book.author}</span>
        </>
      )}
    </div>
  );
  F;
}

export function StoreLinks({ book }: { book: Book }) {
  const [loadingSkoob, setLoadingSkoob] = useState(false);
  const [skoobError, setSkoobError] = useState("");

  const query = encodeURIComponent(`${book.title} ${book.author}`.trim());

  const skeeloAppUrl = `https://skeelo.app.link/?q=${query}`;

  const googleBooksUrl = book.infoLink ?? `https://books.google.com/books?q=${query}`;

  async function handleSkoobSearch() {
    const isbn = book.isbn13 ?? book.isbn10;

    if (!isbn) {
      setSkoobError("ISBN não disponível para este livro.");
      return;
    }

    setLoadingSkoob(true);
    setSkoobError("");

    try {
      const response = await fetch("/api/skoob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isbn }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível encontrar o livro.");
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setSkoobError(error instanceof Error ? error.message : "Erro ao consultar o Skoob.");
    } finally {
      setLoadingSkoob(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="inline-flex items-center gap-2 rounded-full bg-[#78669f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#655489]"
        href={skeeloAppUrl}
        target="_blank"
        rel="noreferrer"
      >
        Encontrar no Skeelo
        <ArrowRight size={14} />
      </a>

      <button
        type="button"
        onClick={handleSkoobSearch}
        disabled={loadingSkoob}
        className="inline-flex items-center gap-2 rounded-full border border-[#e9e4dc] px-4 py-2.5 text-xs font-semibold text-[#5c5750] transition hover:border-[#cfc5b8] hover:bg-white disabled:cursor-wait disabled:opacity-60"
      >
        {loadingSkoob ? "Buscando..." : "Buscar no Skoob"}
        {!loadingSkoob && <ArrowRight size={14} />}
      </button>

      <a
        className="inline-flex items-center gap-2 rounded-full border border-[#e9e4dc] px-4 py-2.5 text-xs font-semibold text-[#5c5750] transition hover:border-[#cfc5b8] hover:bg-white"
        href={googleBooksUrl}
        target="_blank"
        rel="noreferrer"
      >
        Google Books
        <ArrowRight size={14} />
      </a>

      {skoobError && (
        <p className="w-full text-xs text-red-600" role="alert">
          {skoobError}
        </p>
      )}
    </div>
  );
}

export function MiniBook({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button className="group min-w-0 text-left" onClick={onClick} type="button">
      <BookCover
        book={book}
        className="w-full transition duration-300 group-hover:-translate-y-1"
      />

      <span className="mt-3 block truncate text-xs font-semibold text-[#34312d]">{book.title}</span>

      <span className="mt-1 block truncate text-[11px] text-[#938b82]">{book.author}</span>
    </button>
  );
}
