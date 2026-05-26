// === PlantQuiz — Bilder-Quiz mit Runden + Auswertung (v1.10.2) ===
// (Pflanzen-Bild-Quiz: wähle Rundenlänge 5/10/20 → spiele → Auswertung mit
//  Bewertungs-Note und Bestwert/Statistik pro Länge.)
//
// State-Machine: choose → playing → result → (Neue Runde) → playing | choose
// Logik isoliert in `@/lib/quizLogic` (TDD-getestet, 20 Tests).

import { useState, useEffect, useMemo } from 'react';
import type { Plant, Locale } from '@/lib/types';
import {
  gradeScore,
  pickQuestionsForRound,
  updateStats,
  type RoundLength,
  type QuizGrade,
  type QuizQuestion,
  type QuizStats,
  type LengthStats,
} from '@/lib/quizLogic';

// === 1. PROPS + KONSTANTEN ===

interface Props {
  plants: Plant[];
  locale: Locale;
}

const STORAGE_KEY = 'donum_dei_quiz_stats_v2';
const ROUND_LENGTHS: RoundLength[] = [5, 10, 20];

type Phase = 'choose' | 'playing' | 'result';

// === 2. i18n ===

const labels = {
  de: {
    title: 'Pflanzen-Quiz',
    subtitle: 'Welche Pflanze ist auf dem Foto zu sehen?',
    choose_heading: 'Wie viele Fragen?',
    choose_btn: (n: number) => `${n} Fragen`,
    no_stats: 'Noch nie gespielt',
    best: 'Bestes',
    rounds_played: (n: number) => n === 1 ? '1 Runde' : `${n} Runden`,
    avg: 'Ø',
    question_of: (cur: number, total: number) => `Frage ${cur} / ${total}`,
    correct_so_far: (n: number) => `${n} richtig`,
    next: 'Nächste Frage',
    correct: 'Richtig!',
    wrong: 'Leider falsch.',
    correct_was: 'Die richtige Antwort wäre',
    result_heading: 'Runde beendet',
    new_best: 'Neuer Bestwert! 🎉',
    matches_best: 'Bestwert eingestellt 👏',
    your_best: 'Bestwert',
    play_again: (n: number) => `Nochmal ${n} Fragen`,
    other_length: 'Andere Länge',
    not_enough: 'Nicht genug Pflanzen mit Foto für ein Quiz.',
    grade: {
      pro: '🌿 Botanik-Profi!',
      very_good: '👍 Sehr gut!',
      solid: '🌱 Solide Basis',
      practice: '📚 Übung macht den Meister',
      room: '🤔 Da ist Luft nach oben',
    } as Record<QuizGrade, string>,
  },
  en: {
    title: 'Plant Quiz',
    subtitle: 'Which plant is shown in the photo?',
    choose_heading: 'How many questions?',
    choose_btn: (n: number) => `${n} questions`,
    no_stats: 'Not played yet',
    best: 'Best',
    rounds_played: (n: number) => n === 1 ? '1 round' : `${n} rounds`,
    avg: 'avg',
    question_of: (cur: number, total: number) => `Question ${cur} / ${total}`,
    correct_so_far: (n: number) => `${n} correct`,
    next: 'Next question',
    correct: 'Correct!',
    wrong: 'Wrong.',
    correct_was: 'The correct answer was',
    result_heading: 'Round finished',
    new_best: 'New best! 🎉',
    matches_best: 'Matched your best 👏',
    your_best: 'Best',
    play_again: (n: number) => `${n} more questions`,
    other_length: 'Choose length',
    not_enough: 'Not enough plants with photos for a quiz.',
    grade: {
      pro: '🌿 Botany pro!',
      very_good: '👍 Very good!',
      solid: '🌱 Solid basics',
      practice: '📚 Practice makes perfect',
      room: '🤔 Room to grow',
    } as Record<QuizGrade, string>,
  },
};

// === 3. COMPONENT ===

export default function PlantQuiz({ plants, locale }: Props) {
  const l = labels[locale];
  const plantsWithImage = useMemo(() => plants.filter(p => p.image?.filename), [plants]);

  // === 3.1 State ===
  const [phase, setPhase] = useState<Phase>('choose');
  const [roundLength, setRoundLength] = useState<RoundLength>(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctInRound, setCorrectInRound] = useState(0);
  const [stats, setStats] = useState<QuizStats>({});
  /** Bestwert VOR dieser Runde — für 'Neuer Bestwert' Vergleich im Result-Screen. */
  const [bestBeforeRound, setBestBeforeRound] = useState(0);

  // === 3.2 Stats aus localStorage laden ===
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setStats(parsed as QuizStats);
        }
      }
    } catch {
      // ignore — localStorage kann blockiert sein
    }
  }, []);

  // === 3.3 Phase-Übergänge ===
  function startRound(length: RoundLength) {
    if (plantsWithImage.length < length + 3) return; // braucht 3 Distraktoren
    const qs = pickQuestionsForRound(plantsWithImage, length);
    setRoundLength(length);
    setQuestions(qs);
    setCurrentIdx(0);
    setPicked(null);
    setCorrectInRound(0);
    setBestBeforeRound(stats[String(length) as '5' | '10' | '20']?.best ?? 0);
    setPhase('playing');
  }

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === questions[currentIdx].correctIndex) {
      setCorrectInRound(c => c + 1);
    }
  }

  function nextQuestion() {
    const isLast = currentIdx === questions.length - 1;
    if (isLast) {
      // Runde fertig — Stats updaten + zum Result-Screen wechseln.
      const finalScore = correctInRound; // bereits inkrementiert in pick()
      const nextStats = updateStats(stats, roundLength, finalScore);
      setStats(nextStats);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStats));
      } catch {
        // ignore
      }
      setPhase('result');
    } else {
      setCurrentIdx(i => i + 1);
      setPicked(null);
    }
  }

  function backToChoose() {
    setPhase('choose');
  }

  // === 3.4 Guard: nicht genug Pflanzen ===
  if (plantsWithImage.length < 8) {
    // Minimum: kleinste Runde (5) + 3 Distraktoren.
    return <p className="text-slate-600">{l.not_enough}</p>;
  }

  // === 3.5 Render je nach Phase ===
  return (
    <div className="max-w-2xl mx-auto">
      {phase === 'choose' && (
        <ChooseScreen
          stats={stats}
          maxLength={Math.min(20, plantsWithImage.length - 3) as RoundLength}
          onStart={startRound}
          l={l}
        />
      )}

      {phase === 'playing' && (
        <PlayingScreen
          question={questions[currentIdx]}
          currentIdx={currentIdx}
          total={questions.length}
          correctSoFar={correctInRound}
          picked={picked}
          locale={locale}
          onPick={pick}
          onNext={nextQuestion}
          l={l}
        />
      )}

      {phase === 'result' && (
        <ResultScreen
          score={correctInRound}
          length={roundLength}
          bestBefore={bestBeforeRound}
          stats={stats}
          onPlayAgain={() => startRound(roundLength)}
          onChooseLength={backToChoose}
          l={l}
        />
      )}
    </div>
  );
}

// === 4. CHOOSE-SCREEN ===

function ChooseScreen({
  stats, maxLength, onStart, l,
}: {
  stats: QuizStats;
  maxLength: RoundLength;
  onStart: (n: RoundLength) => void;
  l: typeof labels.de;
}) {
  // Nur Längen anbieten für die genug Pflanzen vorhanden sind.
  const available = ROUND_LENGTHS.filter(n => n <= maxLength);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">{l.title}</h2>
        <p className="text-sm text-slate-600">{l.subtitle}</p>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-slate-700 mb-3">{l.choose_heading}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {available.map(n => {
            const s = stats[String(n) as '5' | '10' | '20'];
            return (
              <button
                key={n}
                type="button"
                onClick={() => onStart(n)}
                className="flex flex-col items-center px-6 py-4 rounded-xl border-2 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition min-w-[120px]"
              >
                <span className="text-lg font-semibold text-emerald-700">{l.choose_btn(n)}</span>
                <StatsLine stats={s} length={n} l={l} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatsLine({ stats, length, l }: { stats: LengthStats | undefined; length: number; l: typeof labels.de }) {
  if (!stats || stats.rounds === 0) {
    return <span className="text-xs text-slate-400 mt-1">{l.no_stats}</span>;
  }
  const avgPct = Math.round((stats.total_correct / stats.total_questions) * 100);
  return (
    <span className="text-xs text-slate-500 mt-1 text-center">
      {l.best}: {stats.best}/{length} · {l.rounds_played(stats.rounds)} · {l.avg} {avgPct}%
    </span>
  );
}

// === 5. PLAYING-SCREEN ===

function PlayingScreen({
  question, currentIdx, total, correctSoFar, picked, locale, onPick, onNext, l,
}: {
  question: QuizQuestion;
  currentIdx: number;
  total: number;
  correctSoFar: number;
  picked: number | null;
  locale: Locale;
  onPick: (idx: number) => void;
  onNext: () => void;
  l: typeof labels.de;
}) {
  const answered = picked !== null;
  const correctName = question.plant.names[locale];
  const isCorrect = picked === question.correctIndex;
  const isLast = currentIdx === total - 1;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">
          {l.question_of(currentIdx + 1, total)}
        </p>
        <p className="text-sm font-medium text-slate-700">
          {l.correct_so_far(correctSoFar)}
        </p>
      </div>

      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-4">
        <img
          src={`/images/plants/${question.plant.image.filename}`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {question.options.map((opt, i) => {
          let stateClass = 'bg-white border-slate-300 hover:border-emerald-500 text-slate-800';
          if (answered) {
            if (i === question.correctIndex) {
              stateClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
            } else if (i === picked) {
              stateClass = 'bg-red-50 border-red-500 text-red-900';
            } else {
              stateClass = 'bg-slate-50 border-slate-200 text-slate-500';
            }
          }
          return (
            <button
              key={opt.slug}
              type="button"
              disabled={answered}
              onClick={() => onPick(i)}
              className={`px-4 py-3 rounded-lg border-2 transition text-left ${stateClass}`}
            >
              <div>{opt.names[locale]}</div>
              <div className="text-xs italic text-slate-500 mt-0.5">({opt.names.latin})</div>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="text-center">
          <p className={`text-lg font-semibold mb-2 ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
            {isCorrect ? l.correct : l.wrong}
          </p>
          {!isCorrect && (
            <p className="text-sm text-slate-600 mb-3">
              {l.correct_was}: <span className="font-semibold">{correctName}</span>
            </p>
          )}
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            {isLast ? l.result_heading + ' →' : l.next + ' →'}
          </button>
        </div>
      )}
    </>
  );
}

// === 6. RESULT-SCREEN ===

function ResultScreen({
  score, length, bestBefore, stats, onPlayAgain, onChooseLength, l,
}: {
  score: number;
  length: RoundLength;
  bestBefore: number;
  stats: QuizStats;
  onPlayAgain: () => void;
  onChooseLength: () => void;
  l: typeof labels.de;
}) {
  const grade = gradeScore(score, length);
  const gradeLabel = l.grade[grade];
  const currentBest = stats[String(length) as '5' | '10' | '20']?.best ?? score;

  // Bestwert-Vergleich: neu gesetzt vs. eingestellt vs. drunter.
  let bestNote: string | null = null;
  if (score > bestBefore) bestNote = l.new_best;
  else if (score === bestBefore && bestBefore > 0) bestNote = l.matches_best;

  return (
    <div className="text-center space-y-6 py-6">
      <div>
        <p className="text-sm text-slate-500 mb-2">{l.result_heading}</p>
        <p className="text-5xl font-bold text-emerald-700 mb-2">
          {score} <span className="text-slate-400 font-normal">/ {length}</span>
        </p>
        <p className="text-xl font-medium text-slate-800">{gradeLabel}</p>
      </div>

      <div className="text-sm text-slate-600">
        {bestNote ? (
          <p className="font-medium text-emerald-700">{bestNote}</p>
        ) : (
          <p>{l.your_best}: {currentBest}/{length}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          {l.play_again(length)}
        </button>
        <button
          type="button"
          onClick={onChooseLength}
          className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
        >
          {l.other_length}
        </button>
      </div>
    </div>
  );
}
