"use client";

import { ChevronRight, Heart, RotateCcw, Sparkles } from "lucide-react";
import { Book, moods } from "@/lib/books";
import { BookCover, MiniBook, StoreLinks } from "@/app/components/book-display";
import { RecommendationSource } from "@/app/components/curation-form";

type RecommendationResultProps = {
  books: Book[];
  recommendationSource: RecommendationSource;
  savedIds: Set<string>;
  selectedMoodId: string;
  onBrowse: () => void;
  onChoose: (book: Book) => void;
  onRestart: () => void;
  onToggleSaved: (book: Book) => void;
};

export function RecommendationResult({
  books,
  recommendationSource,
  savedIds,
  selectedMoodId,
  onBrowse,
  onChoose,
  onRestart,
  onToggleSaved,
}: RecommendationResultProps) {
  const selectedMood = moods.find((mood) => mood.id === selectedMoodId);
  const book = books[0];

  if (!book) return null;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#eeeae2] bg-white">
      <div className="relative overflow-hidden bg-[#f2eef6] p-5 sm:p-7">
        <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-[#e5dcef] opacity-70 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#735f99]">
            <Sparkles size={13} />
            {recommendationSource === "shelf"
              ? "Uma leitura da sua estante"
              : "Um encontro para o seu momento"}
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[#d8cce8] bg-white px-4 py-2.5 text-xs font-semibold text-[#675386] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9a7d2] hover:bg-[#faf8fc] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a85bd] focus-visible:ring-offset-2"
            onClick={onRestart}
            type="button"
          >
            <RotateCcw size={14} strokeWidth={2} />
            Refazer minha curadoria
          </button>
        </div>
        <div className="relative mt-4 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div>
            <p className="text-xs text-[#82788b]">
              {selectedMood
                ? `Para quando você está ${selectedMood.label.toLocaleLowerCase("pt-BR")}`
                : "Uma leitura escolhida para você"}
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight tracking-[-0.03em] text-[#342f3b]">
              {book.title}
            </h2>
            <p className="mt-1 text-sm text-[#786f7e]">
              {book.author} <span className="mx-1.5 text-[#b8afbf]">·</span> {book.genre}
            </p>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#6f6877]">{book.description}</p>
            {book.descriptionEnglish && (
              <div className="mt-3 max-w-lg rounded-2xl border border-[#e9e3ef] bg-white/70 p-4">
                <p className="text-xs font-semibold text-[#736583]">Descrição em inglês</p>
                <p className="mt-1.5 text-sm leading-6 text-[#81798a]">{book.descriptionEnglish}</p>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StoreLinks book={book} />
              <button
                className={`grid h-10 w-10 place-items-center rounded-full border transition ${savedIds.has(book.id) ? "border-[#d8bbc0] bg-[#f8e9e9] text-[#b16470]" : "border-[#ded8e5] bg-white/70 text-[#887d98] hover:text-[#b16470]"}`}
                onClick={() => onToggleSaved(book)}
                aria-label={savedIds.has(book.id) ? "Remover da estante" : "Adicionar à estante"}
                type="button"
              >
                <Heart size={17} fill={savedIds.has(book.id) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
          <BookCover book={book} className="mx-auto w-36 sm:w-[155px]" />
        </div>
      </div>
      {books.length > 1 && (
        <div className="p-5 sm:px-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#423e38]">
                Outras histórias que podem combinar
              </h3>
              <p className="mt-1 text-xs text-[#a09990]">Mais caminhos para seguir no seu ritmo.</p>
            </div>
            <button
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#78669f] hover:text-[#594879]"
              onClick={onBrowse}
              type="button"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {books.slice(1).map((otherBook) => (
              <MiniBook key={otherBook.id} book={otherBook} onClick={() => onChoose(otherBook)} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function InspirationSection({
  books,
  isSearching,
  searchError,
  onBrowse,
  onChoose,
}: {
  books: Book[];
  isSearching: boolean;
  searchError: string;
  onBrowse: () => void;
  onChoose: (book: Book) => void;
}) {
  return (
    <section className="mt-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a09487]">
            Uma boa história espera
          </p>
          <h2 className="mt-1 font-display text-xl text-[#36322d]">Um pouco de inspiração</h2>
        </div>
        <button
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#78669f] hover:text-[#594879]"
          onClick={onBrowse}
          type="button"
        >
          Explorar livros <ChevronRight size={14} />
        </button>
      </div>
      {books.length ? (
        <div className="grid grid-cols-4 gap-3 sm:gap-5">
          {books.slice(0, 4).map((book) => (
            <MiniBook key={book.id} book={book} onClick={() => onChoose(book)} />
          ))}
        </div>
      ) : isSearching ? (
        <p className="py-6 text-center text-xs text-[#928a81]" role="status">
          Buscando novidades no Google Books...
        </p>
      ) : (
        <p className="py-6 text-center text-xs text-[#928a81]">
          {searchError || "Não foi possível carregar sugestões agora."}
        </p>
      )}
    </section>
  );
}
