"use client";

import { ArrowRight } from "lucide-react";
import { Book } from "@/lib/books";

export function BookCover({ book, className = "" }: { book: Book; className?: string }) {
  return (
    <div
      className={`book-cover ${book.cover} ${className}`}
      aria-label={`Capa ilustrada de ${book.title}`}
    >
      {book.coverUrl ? (
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
}

export function StoreLinks({ book }: { book: Book }) {
  const query = encodeURIComponent(`${book.title} ${book.author}`);
  const skeeloSearchUrl = `https://skeelo.com/pt/search/?q=${query}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="inline-flex items-center gap-2 rounded-full bg-[#78669f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#655489]"
        href={skeeloSearchUrl}
        target="_blank"
        rel="noreferrer"
      >
        Encontrar no Skeelo <ArrowRight size={14} />
      </a>
      <a
        className="inline-flex items-center gap-2 rounded-full border border-[#e9e4dc] px-4 py-2.5 text-xs font-semibold text-[#5c5750] transition hover:border-[#cfc5b8] hover:bg-white"
        href={book.infoLink ?? `https://books.google.com/books?q=${query}`}
        target="_blank"
        rel="noreferrer"
      >
        Google Books <ArrowRight size={14} />
      </a>
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
