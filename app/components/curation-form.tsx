"use client";

import { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Compass, Library } from "lucide-react";
import { Book, moods } from "@/lib/books";

export type Answers = { styles: string[]; pace: string; mood: string };
export type RecommendationSource = "catalog" | "shelf";

type CurationFormProps = {
  answers: Answers;
  error: string;
  isLoading: boolean;
  onRecommend: () => void;
  recommendationSource: RecommendationSource;
  setAnswers: Dispatch<SetStateAction<Answers>>;
  setRecommendationSource: (source: RecommendationSource) => void;
  setStep: (step: 1 | 2) => void;
  shelfBooks: Book[];
  step: 1 | 2;
};

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

export function CurationForm({
  answers,
  error,
  isLoading,
  onRecommend,
  recommendationSource,
  setAnswers,
  setRecommendationSource,
  setStep,
  shelfBooks,
  step,
}: CurationFormProps) {
  function toggleStyle(id: string) {
    setAnswers((current) => ({
      ...current,
      styles: current.styles.includes(id)
        ? current.styles.filter((style) => style !== id)
        : [...current.styles, id],
    }));
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#eeeae2] bg-white">
      <div className="flex items-center justify-between border-b border-[#f0ede7] px-6 py-4">
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
      <div className="p-5 sm:p-7">
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

              <fieldset className="mt-5">
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

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {styleChoices.map((choice) => {
                  const isSelected = answers.styles.includes(choice.id);
                  return (
                    <button
                      key={choice.id}
                      className={`choice-card flex min-h-[78px] items-center gap-3 rounded-2xl p-4 text-left ${isSelected ? "selected" : ""}`}
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

              <fieldset className="mt-6">
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
                      onClick={() => setAnswers((current) => ({ ...current, pace: pace.id }))}
                    >
                      {pace.title}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 flex items-center justify-between border-t border-[#f1eee8] pt-4">
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
              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    className={`choice-card flex min-h-[78px] flex-col items-start justify-center gap-2 rounded-2xl p-3.5 text-left ${answers.mood === mood.id ? "selected" : ""}`}
                    onClick={() => setAnswers((current) => ({ ...current, mood: mood.id }))}
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
              <div className="mt-6 flex items-center justify-between border-t border-[#f1eee8] pt-4">
                <span className="text-xs text-[#a29a90]">Seu sentimento fica só com você.</span>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[#78669f] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#655489] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    !answers.mood ||
                    isLoading ||
                    (recommendationSource === "shelf" && !shelfBooks.length)
                  }
                  onClick={onRecommend}
                  type="button"
                >
                  {isLoading ? "Encontrando seu livro..." : "Encontrar meu livro"}{" "}
                  {isLoading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
