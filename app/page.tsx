"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookHeart,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Heart,
  Library,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Book, moods } from "@/lib/books";

type View = "inicio" | "estante" | "descobrir";
type Answers = { styles: string[]; pace: string; mood: string };
type RecommendationSource = "catalog" | "shelf";

const shelfStorageKey = "livroteria:shelf";

const styleChoices = [
  {
    id: "reflexivo",
    title: "Que me fazem pensar",
    detail: "Histórias com camadas e ideias",
    icon: "✧",
  },
  {
    id: "imaginativo",
    title: "Que me levam longe",
    detail: "Fantasia, mundos e descobertas",
    icon: "☾",
  },
  {
    id: "emocional",
    title: "Que me fazem sentir",
    detail: "Personagens que ficam comigo",
    icon: "♡",
  },
  {
    id: "intenso",
    title: "Que me prendem",
    detail: "Narrativas fortes e inesquecíveis",
    icon: "↗",
  },
];

const paceChoices = [
  { id: "leve", title: "Leve e acolhedora", detail: "Uma leitura para respirar" },
  { id: "envolvente", title: "Daquelas que fluem", detail: "Só mais um capítulo..." },
  { id: "contemplativo", title: "Sem pressa", detail: "Para saborear cada página" },
  { id: "intenso", title: "Cheia de intensidade", detail: "Quero sentir tudo de uma vez" },
];

const stepMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.26, ease: "easeOut" as const },
};

function BookCover({ book, className = "" }: { book: Book; className?: string }) {
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

function StoreLinks({ book }: { book: Book }) {
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

function MiniBook({ book, onClick }: { book: Book; onClick: () => void }) {
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

  const selectedMood = moods.find((mood) => mood.id === answers.mood);
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
  const filteredBooks = useMemo(() => {
    if (view === "estante") return shelfBooks;
    return bookResults;
  }, [view, shelfBooks, bookResults]);

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

  function toggleStyle(id: string) {
    setAnswers((current) => ({
      ...current,
      styles: current.styles.includes(id)
        ? current.styles.filter((style) => style !== id)
        : [...current.styles, id],
    }));
  }

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
        <nav className="sidebar" aria-label="Navegação principal">
          <button
            className="mb-8 grid h-11 w-11 place-items-center rounded-2xl bg-[#78669f] text-white shadow-sm"
            aria-label="Livroteria, início"
            onClick={() => {
              setView("inicio");
              setSearch("");
            }}
            type="button"
          >
            <BookHeart size={20} strokeWidth={1.8} />
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
          <div className="mt-auto hidden h-11 w-11 place-items-center rounded-full bg-[#e6ddcf] text-sm font-semibold text-[#89796a] sm:grid">
            L.
          </div>
        </nav>

        <section className="main-area">
          <header className="mb-8 flex items-center gap-3">
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
              <kbd className="hidden rounded-md border border-[#e8e3db] bg-white px-1.5 py-0.5 text-[10px] text-[#a29b91] sm:block">
                ⌘ K
              </kbd>
            </label>
            <button
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#eeeae2] bg-white text-[#777068] transition hover:text-[#78669f]"
              type="button"
              onClick={() => setView("estante")}
              aria-label={`Minha estante, ${shelfBooks.length} livros salvos`}
            >
              <Bookmark size={18} />
            </button>
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
            {view === "inicio" && (
              <motion.div key="inicio" {...stepMotion}>
                <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#92877c]">
                      <Sparkles size={13} className="text-[#b18a59]" /> Seu espaço de leitura
                    </p>
                    <h1 className="font-display text-[clamp(29px,4vw,42px)] leading-[1.08] tracking-[-0.035em] text-[#312e2a]">
                      Um livro para o seu <span className="text-[#8571ac]">agora.</span>
                    </h1>
                    <p className="mt-2 text-sm text-[#898279]">
                      A leitura certa encontra você no momento certo.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f0ece5] px-3 py-1.5 text-[11px] font-medium text-[#857c72]">
                    feito para você, com carinho
                  </span>
                </div>

                {!recommendations.length ? (
                  <section className="overflow-hidden rounded-[24px] border border-[#eeeae2] bg-white">
                    <div className="flex items-center justify-between border-b border-[#f0ede7] px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f0eaf6] text-[#78669f]">
                          <Sparkles size={14} />
                        </span>
                        <span className="text-xs font-semibold text-[#68615a]">
                          Sua curadoria pessoal
                        </span>
                      </div>
                      <span className="text-xs text-[#a19a91]">
                        0{step} <span className="mx-1">/</span> 02
                      </span>
                    </div>
                    <div className="h-1 bg-[#f3f0eb]">
                      <motion.div
                        className="h-full bg-[#8b78bc]"
                        animate={{ width: step === 1 ? "50%" : "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="p-6 sm:p-8">
                      <AnimatePresence mode="wait">
                        {step === 1 ? (
                          <motion.div key="personalidade" {...stepMotion}>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a09284]">
                              Primeiro, um pouquinho sobre você
                            </span>
                            <h2 className="mt-2 font-display text-[25px] leading-tight text-[#322f2b]">
                              O que você busca em uma leitura?
                            </h2>
                            <p className="mt-2 text-sm text-[#898279]">
                              Escolha tudo que combina com você. Não tem resposta errada.
                            </p>

                            <fieldset className="mt-6">
                              <legend className="text-[13px] font-semibold text-[#4c4741]">
                                Onde procurar recomendações?
                              </legend>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <button
                                  className={`choice-card rounded-2xl p-4 text-left ${recommendationSource === "catalog" ? "selected" : ""}`}
                                  onClick={() => setRecommendationSource("catalog")}
                                  type="button"
                                  aria-pressed={recommendationSource === "catalog"}
                                >
                                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#49443e]">
                                    <Compass size={16} className="text-[#78669f]" />
                                    Todo o catálogo
                                  </span>
                                  <span className="mt-1 block pl-6 text-[11px] text-[#9a938a]">
                                    Buscar no Google Books
                                  </span>
                                </button>
                                <button
                                  className={`choice-card rounded-2xl p-4 text-left disabled:cursor-not-allowed disabled:opacity-50 ${recommendationSource === "shelf" ? "selected" : ""}`}
                                  onClick={() => setRecommendationSource("shelf")}
                                  type="button"
                                  aria-pressed={recommendationSource === "shelf"}
                                  disabled={!shelfBooks.length}
                                >
                                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#49443e]">
                                    <Library size={16} className="text-[#78669f]" />
                                    Minha estante
                                    <span className="text-[11px] font-normal text-[#9a938a]">
                                      ({shelfBooks.length})
                                    </span>
                                  </span>
                                  <span className="mt-1 block pl-6 text-[11px] text-[#9a938a]">
                                    {shelfBooks.length
                                      ? "Escolher entre os livros que você tem"
                                      : "Adicione livros à estante para usar esta opção"}
                                  </span>
                                </button>
                              </div>
                            </fieldset>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                              {styleChoices.map((choice) => {
                                const isSelected = answers.styles.includes(choice.id);
                                return (
                                  <button
                                    key={choice.id}
                                    className={`choice-card flex min-h-[78px] items-center gap-3 rounded-2xl p-4 text-left ${isSelected ? "selected" : "rounded-2xl"}`}
                                    onClick={() => toggleStyle(choice.id)}
                                    type="button"
                                    aria-pressed={isSelected}
                                  >
                                    <span
                                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${isSelected ? "bg-[#e9e2f2] text-[#78669f]" : "bg-[#f5f2ec] text-[#9a8974]"}`}
                                    >
                                      {choice.icon}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-[13px] font-semibold text-[#49443e]">
                                        {choice.title}
                                      </span>
                                      <span className="mt-1 block text-[11px] text-[#9a938a]">
                                        {choice.detail}
                                      </span>
                                    </span>
                                    {isSelected && <Check size={16} className="text-[#78669f]" />}
                                  </button>
                                );
                              })}
                            </div>

                            <fieldset className="mt-7">
                              <legend className="text-[13px] font-semibold text-[#4c4741]">
                                E o ritmo?{" "}
                                <span className="font-normal text-[#9b948b]">
                                  Escolha o que combina com seu momento.
                                </span>
                              </legend>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {paceChoices.map((pace) => (
                                  <button
                                    key={pace.id}
                                    className={`rounded-full border px-3.5 py-2 text-xs transition ${answers.pace === pace.id ? "border-[#8b78bc] bg-[#f4f0f8] font-semibold text-[#6e5b97]" : "border-[#eeeae2] bg-white text-[#777068] hover:border-[#cfc5db]"}`}
                                    type="button"
                                    aria-pressed={answers.pace === pace.id}
                                    title={pace.detail}
                                    onClick={() =>
                                      setAnswers((current) => ({ ...current, pace: pace.id }))
                                    }
                                  >
                                    {pace.title}
                                  </button>
                                ))}
                              </div>
                            </fieldset>

                            <div className="mt-7 flex items-center justify-between border-t border-[#f1eee8] pt-5">
                              <span className="text-xs text-[#a29a90]">Leva menos de 1 minuto</span>
                              <button
                                className="inline-flex items-center gap-2 rounded-full bg-[#78669f] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#655489] disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={!answers.styles.length || !answers.pace}
                                onClick={() => setStep(2)}
                                type="button"
                              >
                                Continuar <ArrowRight size={15} />
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="momento" {...stepMotion}>
                            <button
                              className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-[#8d8378] transition hover:text-[#655489]"
                              onClick={() => setStep(1)}
                              type="button"
                            >
                              <ArrowLeft size={14} /> Voltar
                            </button>
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a09284]">
                              Agora, olhe para dentro
                            </span>
                            <h2 className="mt-2 font-display text-[25px] leading-tight text-[#322f2b]">
                              Como você está se sentindo?
                            </h2>
                            <p className="mt-2 text-sm text-[#898279]">
                              {recommendationSource === "shelf"
                                ? "Vamos encontrar uma história que combine com você entre os livros da sua estante."
                                : "O que você sente também merece uma boa história."}
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                              {moods.map((mood) => (
                                <button
                                  key={mood.id}
                                  className={`choice-card flex min-h-[78px] flex-col items-start justify-center gap-2 rounded-2xl p-3.5 text-left ${answers.mood === mood.id ? "selected" : ""}`}
                                  onClick={() =>
                                    setAnswers((current) => ({ ...current, mood: mood.id }))
                                  }
                                  type="button"
                                  aria-pressed={answers.mood === mood.id}
                                >
                                  <span
                                    className={`grid h-8 w-8 place-items-center rounded-xl text-lg text-[#736554] ${mood.color}`}
                                  >
                                    {mood.emoji}
                                  </span>
                                  <span className="text-[11px] font-semibold leading-tight text-[#5a554e]">
                                    {mood.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                            {error && (
                              <p
                                className="mt-4 rounded-xl bg-[#fbefed] px-4 py-3 text-xs text-[#a3443e]"
                                role="alert"
                              >
                                {error}
                              </p>
                            )}
                            <div className="mt-7 flex items-center justify-between border-t border-[#f1eee8] pt-5">
                              <span className="text-xs text-[#a29a90]">
                                Seu sentimento fica só com você.
                              </span>
                              <button
                                className="inline-flex items-center gap-2 rounded-full bg-[#78669f] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#655489] disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={
                                  !answers.mood ||
                                  isLoading ||
                                  (recommendationSource === "shelf" && !shelfBooks.length)
                                }
                                onClick={getRecommendation}
                                type="button"
                              >
                                {isLoading ? "Encontrando seu livro..." : "Encontrar meu livro"}{" "}
                                {isLoading ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                ) : (
                                  <Sparkles size={14} />
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>
                ) : (
                  <section className="overflow-hidden rounded-[24px] border border-[#eeeae2] bg-white">
                    <div className="relative overflow-hidden bg-[#f2eef6] p-6 sm:p-8">
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
                          onClick={restart}
                          type="button"
                        >
                          <RotateCcw size={14} strokeWidth={2} />
                          Refazer minha curadoria
                        </button>
                      </div>
                      <div className="relative mt-5 grid items-center gap-7 sm:grid-cols-[minmax(0,1fr)_180px]">
                        <div>
                          <p className="text-xs text-[#82788b]">
                            {selectedMood
                              ? `Para quando você está ${selectedMood.label.toLocaleLowerCase("pt-BR")}`
                              : "Uma leitura escolhida para você"}
                          </p>
                          <h2 className="mt-2 font-display text-3xl leading-tight tracking-[-0.03em] text-[#342f3b]">
                            {recommendations[0].title}
                          </h2>
                          <p className="mt-1 text-sm text-[#786f7e]">
                            {recommendations[0].author}{" "}
                            <span className="mx-1.5 text-[#b8afbf]">·</span>{" "}
                            {recommendations[0].genre}
                          </p>
                          <p className="mt-4 max-w-lg text-sm leading-6 text-[#6f6877]">
                            {recommendations[0].description}
                          </p>
                          {recommendations[0].descriptionEnglish && (
                            <div className="mt-3 max-w-lg rounded-2xl border border-[#e9e3ef] bg-white/70 p-4">
                              <p className="text-xs font-semibold text-[#736583]">
                                Descrição em inglês
                              </p>
                              <p className="mt-1.5 text-sm leading-6 text-[#81798a]">
                                {recommendations[0].descriptionEnglish}
                              </p>
                            </div>
                          )}
                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <StoreLinks book={recommendations[0]} />
                            <button
                              className={`grid h-10 w-10 place-items-center rounded-full border transition ${savedIds.has(recommendations[0].id) ? "border-[#d8bbc0] bg-[#f8e9e9] text-[#b16470]" : "border-[#ded8e5] bg-white/70 text-[#887d98] hover:text-[#b16470]"}`}
                              onClick={() => toggleSaved(recommendations[0])}
                              aria-label={
                                savedIds.has(recommendations[0].id)
                                  ? "Remover da estante"
                                  : "Adicionar à estante"
                              }
                              type="button"
                            >
                              <Heart
                                size={17}
                                fill={savedIds.has(recommendations[0].id) ? "currentColor" : "none"}
                              />
                            </button>
                          </div>
                        </div>
                        <BookCover
                          book={recommendations[0]}
                          className="mx-auto w-36 sm:w-[155px]"
                        />
                      </div>
                    </div>
                    {recommendations.length > 1 && (
                      <div className="p-6 sm:px-8">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[#423e38]">
                              Outras histórias que podem combinar
                            </h3>
                            <p className="mt-1 text-xs text-[#a09990]">
                              Mais caminhos para seguir no seu ritmo.
                            </p>
                          </div>
                          <button
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#78669f] hover:text-[#594879]"
                            onClick={() => setView("descobrir")}
                            type="button"
                          >
                            Ver todas <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 sm:gap-6">
                          {recommendations.slice(1).map((book) => (
                            <MiniBook key={book.id} book={book} onClick={() => chooseBook(book)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section className="mt-8">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a09487]">
                        Uma boa história espera
                      </p>
                      <h2 className="mt-1 font-display text-xl text-[#36322d]">
                        Um pouco de inspiração
                      </h2>
                    </div>
                    <button
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#78669f] hover:text-[#594879]"
                      onClick={() => setView("descobrir")}
                      type="button"
                    >
                      Explorar livros <ChevronRight size={14} />
                    </button>
                  </div>
                  {bookResults.length ? (
                    <div className="grid grid-cols-4 gap-3 sm:gap-5">
                      {bookResults.slice(0, 4).map((book) => (
                        <MiniBook key={book.id} book={book} onClick={() => chooseBook(book)} />
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
              </motion.div>
            )}

            {view !== "inicio" && (
              <motion.div key={view} {...stepMotion}>
                <div className="mb-7">
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
                {filteredBooks.length ? (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredBooks.map((book) => (
                      <div key={book.id} className="group min-w-0">
                        <button
                          className="block w-full text-left"
                          onClick={() => chooseBook(book)}
                          type="button"
                          aria-label={`Ver recomendação de ${book.title}`}
                        >
                          <BookCover
                            book={book}
                            className="w-full transition duration-300 group-hover:-translate-y-1"
                          />
                        </button>
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <button
                            className="min-w-0 text-left"
                            onClick={() => chooseBook(book)}
                            type="button"
                          >
                            <span className="block truncate text-xs font-semibold text-[#34312d]">
                              {book.title}
                            </span>
                            <span className="mt-1 block truncate text-[11px] text-[#938b82]">
                              {book.author}
                            </span>
                          </button>
                          <button
                            className={`mt-0.5 shrink-0 transition ${savedIds.has(book.id) ? "text-[#b16470]" : "text-[#b9b1a7] hover:text-[#b16470]"}`}
                            onClick={() => toggleSaved(book)}
                            type="button"
                            aria-label={
                              savedIds.has(book.id)
                                ? `Remover ${book.title} da estante`
                                : `Adicionar ${book.title} à estante`
                            }
                          >
                            <Heart
                              size={16}
                              fill={savedIds.has(book.id) ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                        <span className="mt-2 inline-block rounded-full bg-[#f2eee8] px-2.5 py-1 text-[10px] text-[#82796f]">
                          {book.genre}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : isSearching ? (
                  <div
                    className="rounded-[24px] border border-[#eeeae2] bg-white px-6 py-16 text-center"
                    role="status"
                  >
                    <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#d9d0e5] border-t-[#78669f]" />
                    <p className="mt-4 text-sm text-[#81796f]">
                      Buscando livros no Google Books...
                    </p>
                  </div>
                ) : searchError ? (
                  <div
                    className="rounded-[24px] border border-[#f0d7d2] bg-[#fff9f7] px-6 py-10 text-center"
                    role="alert"
                  >
                    <p className="text-sm font-semibold text-[#8f4e47]">
                      A busca não está disponível agora.
                    </p>
                    <p className="mt-2 text-sm text-[#a06b63]">{searchError}</p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[#ded7ce] bg-white/60 px-6 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f0eaf6] text-[#78669f]">
                      <Library size={21} />
                    </span>
                    <h2 className="mt-4 font-display text-xl text-[#403b35]">
                      {view === "estante"
                        ? "Sua estante começa com uma história."
                        : "Nenhum livro encontrado."}
                    </h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#928a81]">
                      {view === "estante"
                        ? "Guarde por aqui os livros que despertarem alguma coisa em você."
                        : "Tente buscar por outro título, autor ou gênero."}
                    </p>
                    {view === "estante" && (
                      <button
                        className="mt-5 rounded-full bg-[#78669f] px-5 py-3 text-xs font-semibold text-white hover:bg-[#655489]"
                        onClick={() => setView("descobrir")}
                        type="button"
                      >
                        Encontrar um livro
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-10 flex items-center justify-between border-t border-[#eeeae2] pt-5 text-[10px] text-[#aaa197]">
            <span>
              Livroteria <span className="mx-1">·</span> um capítulo de cada vez
            </span>
            <span>feito para ler com calma</span>
          </footer>
        </section>

        <aside className="right-rail">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a09588]">
                Um lugar para você
              </p>
              <h2 className="mt-1 font-display text-xl text-[#403a34]">Pausa para ler</h2>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#a18ebd]">
              <BookOpen size={17} />
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-[20px] border border-[#ebe6dc] bg-white">
            <div className="h-1.5 bg-gradient-to-r from-[#8d7bb5] via-[#d4a08b] to-[#e6cb8d]" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f2edf7] text-[#8772ad]">
                  <Sparkles size={18} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#4d4841]">Seu momento importa</p>
                  <p className="mt-1 text-[10px] text-[#9b938a]">Uma leitura de cada vez.</p>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-[1.7] text-[#8b8379]">
                Não existe sentimento certo ou errado. Às vezes, tudo o que a gente precisa é de uma
                história que entenda.
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-[#f1eee8] pt-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#eee8df] text-sm">
                  ☕
                </span>
                <span className="text-[10px] text-[#9a9288]">
                  Puxe uma cadeira. Fique à vontade.
                </span>
              </div>
            </div>
          </div>

          {selectedMood && (
            <div className="mt-5 rounded-[20px] bg-[#eee9f4] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#83749d]">
                Seu momento de hoje
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-2xl text-lg text-[#736554] ${selectedMood.color}`}
                >
                  {selectedMood.emoji}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#514a5c]">{selectedMood.label}</p>
                  <p className="mt-0.5 text-[10px] text-[#8f859b]">Um bom lugar para começar.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#514b44]">Pequenos lembretes</h3>
              <span className="text-[10px] text-[#a49c91]">para hoje</span>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: "🌿", text: "Você não precisa terminar um livro que não te encontra." },
                { icon: "🕯️", text: "Uma página também já é um começo." },
                { icon: "☁️", text: "Mude de ideia. Mude de história. Tudo bem." },
              ].map((note) => (
                <div
                  key={note.text}
                  className="flex items-start gap-2.5 rounded-2xl border border-[#eeeae2] bg-white/80 p-3"
                >
                  <span className="text-sm">{note.icon}</span>
                  <p className="text-[10px] leading-[1.6] text-[#81796f]">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            className="mt-6 flex w-full items-center justify-between rounded-2xl border border-[#eae5dd] bg-white px-4 py-3 text-left transition hover:border-[#d3c8dc]"
            onClick={() => setView("estante")}
            type="button"
          >
            <span className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#f3eee6] text-[#937d63]">
                <Bookmark size={15} />
              </span>
              <span>
                <span className="block text-[11px] font-semibold text-[#5b554d]">
                  Minha estante
                </span>
                <span className="mt-0.5 block text-[10px] text-[#a29a90]">
                  {shelfBooks.length} {shelfBooks.length === 1 ? "livro salvo" : "livros salvos"}
                </span>
              </span>
            </span>
            <ChevronRight size={15} className="text-[#a49a8c]" />
          </button>

          <div className="mt-8 rounded-[20px] bg-[#e8e2d9] p-4">
            <p className="font-display text-lg leading-tight text-[#4a443d]">
              “Leia o que te faz sentir.”
            </p>
            <p className="mt-2 text-[10px] text-[#8b8176]">E deixe o resto para depois.</p>
            <span className="mt-3 block text-[10px] font-semibold text-[#8b8176]">
              com carinho, Livroteria
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
