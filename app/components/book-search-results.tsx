"use client";

import { Heart, Library } from "lucide-react";
import { Book } from "@/lib/books";
import { BookCover } from "@/app/components/book-display";

type BookSearchResultsProps = {
  books: Book[];
  error: string;
  isSearching: boolean;
  isShelfView: boolean;
  onChoose: (book: Book) => void;
  onDiscover: () => void;
  onToggleSaved: (book: Book) => void;
  savedIds: Set<string>;
};

export function BookSearchResults({
  books,
  error,
  isSearching,
  isShelfView,
  onChoose,
  onDiscover,
  onToggleSaved,
  savedIds,
}: BookSearchResultsProps) {
  if (books.length) {
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <div key={book.id} className="group min-w-0">
            <button
              className="block w-full text-left"
              onClick={() => onChoose(book)}
              type="button"
              aria-label={`Ver recomendação de ${book.title}`}
            >
              <BookCover
                book={book}
                className="w-full transition duration-300 group-hover:-translate-y-1"
              />
            </button>
            <div className="mt-3 flex items-start justify-between gap-2">
              <button className="min-w-0 text-left" onClick={() => onChoose(book)} type="button">
                <span className="block truncate text-xs font-semibold text-[#34312d]">
                  {book.title}
                </span>
                <span className="mt-1 block truncate text-[11px] text-[#938b82]">
                  {book.author}
                </span>
              </button>
              <button
                className={`mt-0.5 shrink-0 transition ${savedIds.has(book.id) ? "text-[#b16470]" : "text-[#b9b1a7] hover:text-[#b16470]"}`}
                onClick={() => onToggleSaved(book)}
                type="button"
                aria-label={
                  savedIds.has(book.id)
                    ? `Remover ${book.title} da estante`
                    : `Adicionar ${book.title} à estante`
                }
              >
                <Heart size={16} fill={savedIds.has(book.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <span className="mt-2 inline-block rounded-full bg-[#f2eee8] px-2.5 py-1 text-[10px] text-[#82796f]">
              {book.genre}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (isSearching) {
    return (
      <div
        className="rounded-[24px] border border-[#eeeae2] bg-white px-6 py-16 text-center"
        role="status"
      >
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#d9d0e5] border-t-[#78669f]" />
        <p className="mt-4 text-sm text-[#81796f]">Buscando livros no Google Books...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-[24px] border border-[#f0d7d2] bg-[#fff9f7] px-6 py-10 text-center"
        role="alert"
      >
        <p className="text-sm font-semibold text-[#8f4e47]">A busca não está disponível agora.</p>
        <p className="mt-2 text-sm text-[#a06b63]">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-dashed border-[#ded7ce] bg-white/60 px-6 py-16 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f0eaf6] text-[#78669f]">
        <Library size={21} />
      </span>
      <h2 className="mt-4 font-display text-xl text-[#403b35]">
        {isShelfView ? "Sua estante começa com uma história." : "Nenhum livro encontrado."}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#928a81]">
        {isShelfView
          ? "Guarde por aqui os livros que despertarem alguma coisa em você."
          : "Tente buscar por outro título, autor ou gênero."}
      </p>
      {isShelfView && (
        <button
          className="mt-5 rounded-full bg-[#78669f] px-5 py-3 text-xs font-semibold text-white hover:bg-[#655489]"
          onClick={onDiscover}
          type="button"
        >
          Encontrar um livro
        </button>
      )}
    </div>
  );
}
