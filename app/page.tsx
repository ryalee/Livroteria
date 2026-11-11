"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookHeart, BookOpen, Compass, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Book } from "@/lib/books";
import { BookSearchResults } from "@/app/components/book-search-results";
import { Answers, CurationForm, RecommendationSource } from "@/app/components/curation-form";
import { InspirationSection, RecommendationResult } from "@/app/components/recommendation-result";
import Image from "next/image";

type View = "inicio" | "estante" | "descobrir";

const shelfStorageKey = "livroteria:shelf";
const stepMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.26, ease: "easeOut" as const },
};

function isStoredBook(value: unknown): value is Book {
  if (typeof value !== "object" || value === null) return false;

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "author" in value &&
    typeof value.author === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "genre" in value &&
    typeof value.genre === "string" &&
    "cover" in value &&
    typeof value.cover === "string" &&
    "mark" in value &&
    typeof value.mark === "string"
  );
}

export default function Home() {
  const [view, setView] = useState<View>("inicio");
  const [step, setStep] = useState<1 | 2>(1);
  const [answers, setAnswers] = useState<Answers>({ styles: [], pace: "", mood: "" });
  const [recommendationSource, setRecommendationSource] = useState<RecommendationSource>("catalog");
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [bookResults, setBookResults] = useState<Book[]>([]);
  const [shelfBooks, setShelfBooks] = useState<Book[]>([]);
  const [isShelfLoaded, setIsShelfLoaded] = useState(false);
  const [shelfError, setShelfError] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [error, setError] = useState("");

  const savedIds = useMemo(() => new Set(shelfBooks.map((book) => book.id)), [shelfBooks]);
  const bookCatalog = useMemo(
    () =>
      [...shelfBooks, ...recommendations, ...bookResults].reduce<Book[]>(
        (catalog, book) =>
          catalog.some((item) => item.id === book.id) ? catalog : [...catalog, book],
        [],
      ),
    [shelfBooks, recommendations, bookResults],
  );
  const filteredBooks = view === "estante" ? shelfBooks : bookResults;

  useEffect(() => {
    try {
      const storedShelf = window.localStorage.getItem(shelfStorageKey);
      if (storedShelf) {
        const parsedShelf: unknown = JSON.parse(storedShelf);
        if (!Array.isArray(parsedShelf) || !parsedShelf.every(isStoredBook)) {
          throw new Error("Os dados salvos da estante estão inválidos.");
        }
        setShelfBooks(parsedShelf);
      }
    } catch (storageError) {
      setShelfError(
        storageError instanceof Error
          ? storageError.message
          : "Não foi possível carregar sua estante neste navegador.",
      );
    } finally {
      setIsShelfLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isShelfLoaded) return;

    try {
      window.localStorage.setItem(shelfStorageKey, JSON.stringify(shelfBooks));
    } catch {
      setShelfError("Não foi possível salvar sua estante neste navegador.");
    }
  }, [isShelfLoaded, shelfBooks]);

  useEffect(() => {
    const searchTerm = search.trim();
    if (searchTerm.length === 1) {
      setBookResults([]);
      setSearchError("Digite pelo menos 2 caracteres para buscar livros.");
      setIsSearching(false);
      return;
    }

    const query = searchTerm || "subject:fiction";
    const controller = new AbortController();
    setIsSearching(true);
    setSearchError("");
    setBookResults([]);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/books?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data: { books?: Book[]; error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Não foi possível buscar livros.");
        setBookResults(data.books ?? []);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setSearchError(
          requestError instanceof Error ? requestError.message : "Não foi possível buscar livros.",
        );
        setBookResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  async function getRecommendation() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...answers,
          source: recommendationSource,
          ...(recommendationSource === "shelf" ? { shelfBooks } : {}),
        }),
      });
      const data: { recommendations?: Book[]; error?: string } = await response.json();
      if (!response.ok || !data.recommendations?.length) {
        throw new Error(data.error ?? "Não foi possível encontrar uma recomendação agora.");
      }
      setRecommendations(data.recommendations);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Algo deu errado. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function restart() {
    setStep(1);
    setAnswers({ styles: [], pace: "", mood: "" });
    setRecommendationSource("catalog");
    setRecommendations([]);
    setError("");
  }

  function toggleSaved(book: Book) {
    setShelfBooks((current) =>
      current.some((savedBook) => savedBook.id === book.id)
        ? current.filter((savedBook) => savedBook.id !== book.id)
        : [book, ...current],
    );
  }

  function chooseBook(book: Book) {
    setRecommendations([
      book,
      ...bookCatalog.filter((candidate) => candidate.id !== book.id).slice(0, 2),
    ]);
    setView("inicio");
  }

  const navItems: { id: View; label: string; icon: typeof BookOpen }[] = [
    { id: "inicio", label: "Início", icon: Sun },
    { id: "estante", label: "Minha estante", icon: Bookmark },
    { id: "descobrir", label: "Descobrir", icon: Compass },
  ];

  return (
    <main className="app-shell">
      <div className="app-frame">
        <nav className="sidebar">
          <button
            className="mb-8 grid h-11 w-11 place-items-center rounded-xl shadow-sm"
            onClick={() => {
              setView("inicio");
              setSearch("");
            }}
            type="button"
          >
            <Image
              src="/logo.png"
              alt="Logo Livroteria"
              width={40}
              height={40}
            />
          </button>

          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`side-link ${view === id ? "active" : ""}`}
              aria-label={label}
              aria-current={view === id ? "page" : undefined}
              onClick={() => {
                setView(id);
                setSearch("");
              }}
              type="button"
            >
              <Icon size={19} strokeWidth={1.8} />
            </button>
          ))}
        </nav>

        <section className="main-area">
          <header className="mb-6 flex items-center gap-3">
            <label className="search-field flex-1" aria-label="Buscar livros">
              <Search size={17} />
              <input
                placeholder="Busque um livro, autor ou gênero..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (event.target.value) setView("descobrir");
                }}
              />
            </label>
          </header>

          {shelfError && (
            <p
              className="mb-5 rounded-xl bg-[#fbefed] px-4 py-3 text-xs text-[#a3443e]"
              role="alert"
            >
              {shelfError}
            </p>
          )}

          <AnimatePresence mode="wait">
            {view === "inicio" ? (
              <motion.div key="inicio" {...stepMotion}>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#92877c]">
                      Seu espaço de leitura
                    </p>
                    <h1 className="font-display text-[clamp(29px,4vw,42px)] leading-[1.08] tracking-[-0.035em] text-[#312e2a]">
                      Um livro para o seu <span className="text-[#8571ac]">agora.</span>
                    </h1>
                    <p className="mt-2 text-sm text-[#898279]">
                      A leitura certa encontra você no momento certo.
                    </p>
                  </div>
                </div>

                {recommendations.length ? (
                  <RecommendationResult
                    books={recommendations}
                    recommendationSource={recommendationSource}
                    savedIds={savedIds}
                    selectedMoodId={answers.mood}
                    onBrowse={() => setView("descobrir")}
                    onChoose={chooseBook}
                    onRestart={restart}
                    onToggleSaved={toggleSaved}
                  />
                ) : (
                  <CurationForm
                    answers={answers}
                    error={error}
                    isLoading={isLoading}
                    onRecommend={getRecommendation}
                    recommendationSource={recommendationSource}
                    setAnswers={setAnswers}
                    setRecommendationSource={setRecommendationSource}
                    setStep={setStep}
                    shelfBooks={shelfBooks}
                    step={step}
                  />
                )}

                <InspirationSection
                  books={bookResults}
                  isSearching={isSearching}
                  searchError={searchError}
                  onBrowse={() => setView("descobrir")}
                  onChoose={chooseBook}
                />
              </motion.div>
            ) : (
              <motion.div key={view} {...stepMotion}>
                <div className="mb-6">
                  <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#92877c]">
                    {view === "estante" ? <Bookmark size={13} /> : <Compass size={13} />}
                    {view === "estante" ? "Seu cantinho" : "Descubra sua próxima leitura"}
                  </p>
                  <h1 className="font-display text-[clamp(29px,4vw,42px)] leading-[1.08] tracking-[-0.035em] text-[#312e2a]">
                    {view === "estante" ? "Minha estante" : "Histórias para encontrar."}
                  </h1>
                  <p className="mt-2 text-sm text-[#898279]">
                    {view === "estante"
                      ? `${shelfBooks.length} ${shelfBooks.length === 1 ? "livro guardado" : "livros guardados"} para ler no seu tempo.`
                      : search.trim()
                        ? `Resultados do Google Books para “${search.trim()}”.`
                        : "Resultados do Google Books para abrir novos mundos."}
                  </p>
                </div>
                <BookSearchResults
                  books={filteredBooks}
                  error={searchError}
                  isSearching={view !== "estante" && isSearching}
                  isShelfView={view === "estante"}
                  onChoose={chooseBook}
                  onDiscover={() => setView("descobrir")}
                  onToggleSaved={toggleSaved}
                  savedIds={savedIds}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      <footer className="mt-8 flex w-full items-center justify-center border-t border-[#eeeae2] pt-4 font-bold text-[14px] text-[#aaa197]">
        <span>
          Livroteria <span className="mx-1">·</span> Desenvolvido por <a href="https://www.linkedin.com/in/ryan-alecrim-sodre/" target="_blank" className="hover:text-[#78669f] duration-300">Ryan Alecrim Sodre</a>
        </span>
      </footer>
    </main>
  );
}
