import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import {
  DEPARTMENTS_META,
  ORDERED_DEPARTMENT_CODES,
  TextAcceptMode,
  checkDepartmentAnswer,
} from './data/departmentsMeta';
import { DeptVisualStatus, FranceMap } from './components/FranceMap';
import { ExplorerPanel } from './components/ExplorerPanel';
import {
  MapPromptMode,
  QuizLength,
  QuizPanel,
  QuizScope,
  QuizSummaryItem,
  RoundFeedback,
} from './components/QuizPanel';
import { playFeedbackSound } from './utils/sound';

type AppMode = 'map-click' | 'text-guess' | 'explorer';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQueue(scope: QuizScope, lengthChoice: QuizLength): string[] {
  const pool = ORDERED_DEPARTMENT_CODES.filter((code) => {
    const meta = DEPARTMENTS_META[code];
    if (scope === 'metro') return !meta.isDrom;
    if (scope === 'drom') return meta.isDrom;
    return true;
  });
  const shuffled = shuffleArray(pool);
  if (scope === 'drom' || lengthChoice === 'all') return shuffled;
  return shuffled.slice(0, Math.min(lengthChoice, shuffled.length));
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('map-click');
  const [scope, setScope] = useState<QuizScope>('all');
  const [lengthChoice, setLengthChoice] = useState<QuizLength>(20);
  const [mapPromptMode, setMapPromptMode] = useState<MapPromptMode>('both');
  const [textAcceptMode, setTextAcceptMode] = useState<TextAcceptMode>('both');
  const [muted, setMuted] = useState(false);

  // Quiz round state
  const [queue, setQueue] = useState<string[]>(() => buildQueue('all', 20));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, DeptVisualStatus>>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptsOnCurrent, setAttemptsOnCurrent] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [feedback, setFeedback] = useState<RoundFeedback | null>(null);
  const [summaryItems, setSummaryItems] = useState<QuizSummaryItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Wrong flash on map click
  const [wrongFlashCode, setWrongFlashCode] = useState<string | null>(null);
  const [wrongFlashLabel, setWrongFlashLabel] = useState<string | null>(null);

  // Explorer state
  const [explorerScope, setExplorerScope] = useState<QuizScope>('all');
  const [selectedExplorerCode, setSelectedExplorerCode] = useState<string | null>('75');
  const [showExplorerLabels, setShowExplorerLabels] = useState(false);

  const advanceTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const clearPendingTimers = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPendingTimers();
  }, [clearPendingTimers]);

  // Elapsed seconds clock
  useEffect(() => {
    if (mode === 'explorer' || isFinished) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, isFinished]);

  const startRound = useCallback(
    (customCodes?: string[], nextScope: QuizScope = scope, nextLength: QuizLength = lengthChoice) => {
      clearPendingTimers();
      const nextQueue = customCodes ? shuffleArray(customCodes) : buildQueue(nextScope, nextLength);
      setQueue(nextQueue);
      setCurrentIndex(0);
      setStatuses({});
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setElapsedSeconds(0);
      setAttemptsOnCurrent(0);
      setHintLevel(0);
      setTextInput('');
      setAwaitingNext(false);
      setFeedback(null);
      setSummaryItems([]);
      setIsFinished(false);
      setWrongFlashCode(null);
      setWrongFlashLabel(null);
    },
    [clearPendingTimers, lengthChoice, scope]
  );

  const handleModeSwitch = (nextMode: AppMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    if (nextMode !== 'explorer') {
      startRound(undefined, scope, lengthChoice);
    } else {
      clearPendingTimers();
    }
  };

  const handleScopeChange = (nextScope: QuizScope) => {
    const nextLength = nextScope === 'drom' ? 'all' : lengthChoice;
    setScope(nextScope);
    if (nextScope === 'drom') setLengthChoice('all');
    startRound(undefined, nextScope, nextLength);
  };

  const handleLengthChange = (nextLen: QuizLength) => {
    setLengthChoice(nextLen);
    startRound(undefined, scope, nextLen);
  };

  const currentTargetCode = !isFinished && currentIndex < queue.length ? queue[currentIndex] : null;
  const currentTarget = currentTargetCode ? DEPARTMENTS_META[currentTargetCode] : null;

  const advanceQuestion = useCallback(() => {
    clearPendingTimers();
    setWrongFlashCode(null);
    setWrongFlashLabel(null);
    setAwaitingNext(false);
    setAttemptsOnCurrent(0);
    setHintLevel(0);
    setTextInput('');
    setFeedback(null);

    setCurrentIndex((prev) => {
      if (prev + 1 >= queue.length) {
        setIsFinished(true);
        playFeedbackSound('complete', muted);
        return prev;
      }
      return prev + 1;
    });
  }, [clearPendingTimers, muted, queue.length]);

  const recordOutcome = useCallback(
    (code: string, outcome: 'correct' | 'hinted' | 'missed') => {
      const meta = DEPARTMENTS_META[code];
      setStatuses((prev) => ({ ...prev, [code]: outcome }));
      setSummaryItems((prev) => [...prev, { dept: meta, outcome }]);
      if (outcome === 'correct') {
        setScore((s) => s + 1);
        setStreak((st) => {
          const next = st + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setStreak(0);
      }
    },
    []
  );

  // Handle clicking a department on the map (Mode 1: Map Click OR Mode 3: Explorer)
  const handleSelectDepartment = (clickedCode: string) => {
    if (mode === 'explorer') {
      setSelectedExplorerCode(clickedCode);
      return;
    }

    if (mode !== 'map-click' || isFinished || awaitingNext || !currentTarget) return;

    // Ignore clicks on departments already resolved in this round unless it's somehow the current target
    const existingStatus = statuses[clickedCode];
    if (existingStatus && clickedCode !== currentTarget.code) {
      return;
    }

    if (clickedCode === currentTarget.code) {
      const cleanFirstTry = attemptsOnCurrent === 0 && hintLevel === 0;
      const outcome: 'correct' | 'hinted' = cleanFirstTry ? 'correct' : 'hinted';
      recordOutcome(currentTarget.code, outcome);
      playFeedbackSound('correct', muted);
      setFeedback({
        type: 'correct',
        message: cleanFirstTry
          ? `Exact · ${currentTarget.code} ${currentTarget.nom}`
          : `Trouvé · ${currentTarget.code} ${currentTarget.nom}`,
        detail: `Préfecture : ${currentTarget.prefecture} · ${currentTarget.region}`,
      });
      setAwaitingNext(true);
      advanceTimerRef.current = window.setTimeout(() => {
        advanceQuestion();
      }, 900);
    } else {
      const clickedMeta = DEPARTMENTS_META[clickedCode];
      const nextAttempts = attemptsOnCurrent + 1;
      setAttemptsOnCurrent(nextAttempts);
      setStreak(0);
      playFeedbackSound('wrong', muted);

      // Flash clicked department on map
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
      setWrongFlashCode(clickedCode);
      setWrongFlashLabel(`${clickedMeta.code} · ${clickedMeta.nom}`);
      flashTimerRef.current = window.setTimeout(() => {
        setWrongFlashCode(null);
        setWrongFlashLabel(null);
      }, 1300);

      if (nextAttempts >= 3) {
        recordOutcome(currentTarget.code, 'missed');
        setFeedback({
          type: 'revealed',
          message: `Révélé · ${currentTarget.code} ${currentTarget.nom}`,
          detail: `Préfecture : ${currentTarget.prefecture} · ${currentTarget.region}`,
        });
        setAwaitingNext(true);
      } else {
        setFeedback({
          type: 'wrong',
          message: `Ce n'est pas ${currentTarget.nom}`,
          detail: `Vous avez cliqué sur ${clickedMeta.code} · ${clickedMeta.nom}. Il vous reste ${
            3 - nextAttempts
          } essai${3 - nextAttempts > 1 ? 's' : ''}.`,
        });
      }
    }
  };

  // Handle submitting text guess (Mode 2: Text Guess)
  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'text-guess' || isFinished || awaitingNext || !currentTarget) return;
    if (!textInput.trim()) return;

    const result = checkDepartmentAnswer(textInput, currentTarget, textAcceptMode);
    if (result.isCorrect) {
      const cleanFirstTry = attemptsOnCurrent === 0 && hintLevel === 0;
      const outcome: 'correct' | 'hinted' = cleanFirstTry ? 'correct' : 'hinted';
      recordOutcome(currentTarget.code, outcome);
      playFeedbackSound('correct', muted);
      setFeedback({
        type: 'correct',
        message: `Exact · ${currentTarget.code} ${currentTarget.nom}`,
        detail:
          result.matchedBy === 'approx'
            ? `Orthographe exacte : ${currentTarget.nom} · Préfecture : ${currentTarget.prefecture}`
            : `Préfecture : ${currentTarget.prefecture} · ${currentTarget.region}`,
      });
      setAwaitingNext(true);
      advanceTimerRef.current = window.setTimeout(() => {
        advanceQuestion();
      }, 950);
    } else {
      setAttemptsOnCurrent((a) => a + 1);
      setStreak(0);
      playFeedbackSound('wrong', muted);
      setFeedback({
        type: 'wrong',
        message: `« ${textInput.trim()} » ne correspond pas`,
        detail: 'Vérifiez votre réponse, demandez un indice ou passez au suivant.',
      });
      setTextInput('');
    }
  };

  const handleRequestHint = () => {
    if (!currentTarget || awaitingNext || isFinished) return;
    setHintLevel((h) => Math.min(2, h + 1));
  };

  const handleSkipQuestion = () => {
    if (!currentTarget || awaitingNext || isFinished) return;
    recordOutcome(currentTarget.code, 'missed');
    playFeedbackSound('wrong', muted);
    setFeedback({
      type: 'revealed',
      message: `Réponse · ${currentTarget.code} ${currentTarget.nom}`,
      detail: `Préfecture : ${currentTarget.prefecture} · ${currentTarget.region}`,
    });
    setAwaitingNext(true);
  };

  const handleRetryMissed = () => {
    const missedCodes = summaryItems
      .filter((i) => i.outcome === 'missed' || i.outcome === 'hinted')
      .map((i) => i.dept.code);
    if (missedCodes.length > 0) {
      startRound(missedCodes);
    }
  };

  const handleNewGameCTA = () => {
    if (mode === 'explorer') {
      setMode('map-click');
    }
    startRound(undefined, scope, lengthChoice);
  };

  const activeMapScope = mode === 'explorer' ? explorerScope : scope;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FA] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8 shrink-0">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleModeSwitch('map-click');
          }}
          className="font-display text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Atlas des Départements
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav aria-label="Modes de jeu" className="hidden md:flex items-center gap-7 text-sm font-medium">
          {(
            [
              ['map-click', 'Cliquer sur la carte'],
              ['text-guess', 'Nommer par texte'],
              ['explorer', 'Explorateur'],
            ] as const
          ).map(([val, label]) => {
            const active = mode === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleModeSwitch(val)}
                className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleNewGameCTA}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Nouvelle partie
          </button>
        </div>
      </header>

      {/* Mobile Mode Switcher (since header nav hides on small screens) */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              ['map-click', 'Sur carte'],
              ['text-guess', 'Par texte'],
              ['explorer', 'Explorer'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => handleModeSwitch(val)}
              className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                mode === val ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Zone Workspace */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch h-full">
          {/* Left Stage: Interactive France Map (~67%) */}
          <section aria-label="Carte interactive de France" className="lg:col-span-8 flex flex-col">
            <FranceMap
              mode={mode}
              activeScope={activeMapScope}
              targetCode={mode === 'text-guess' && !isFinished ? currentTargetCode : null}
              statuses={mode === 'explorer' ? {} : statuses}
              wrongFlashCode={wrongFlashCode}
              wrongFlashLabel={wrongFlashLabel}
              selectedExplorerCode={mode === 'explorer' ? selectedExplorerCode : null}
              showAllLabels={mode === 'explorer' && showExplorerLabels}
              onSelectDepartment={handleSelectDepartment}
            />
          </section>

          {/* Right Deck: Quiz Controls OR Explorer (~33%) */}
          <aside className="lg:col-span-4 flex flex-col">
            {mode === 'explorer' ? (
              <ExplorerPanel
                activeScope={explorerScope}
                onScopeChange={setExplorerScope}
                selectedCode={selectedExplorerCode}
                onSelectCode={setSelectedExplorerCode}
                showAllLabels={showExplorerLabels}
                onToggleLabels={() => setShowExplorerLabels((v) => !v)}
              />
            ) : (
              <QuizPanel
                mode={mode}
                scope={scope}
                lengthChoice={lengthChoice}
                mapPromptMode={mapPromptMode}
                textAcceptMode={textAcceptMode}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                onScopeChange={handleScopeChange}
                onLengthChange={handleLengthChange}
                onMapPromptModeChange={setMapPromptMode}
                onTextAcceptModeChange={setTextAcceptMode}
                currentIndex={currentIndex}
                totalQuestions={queue.length}
                score={score}
                streak={streak}
                bestStreak={bestStreak}
                elapsedSeconds={elapsedSeconds}
                currentTarget={currentTarget}
                attemptsOnCurrent={attemptsOnCurrent}
                hintLevel={hintLevel}
                textInput={textInput}
                onTextInputChange={setTextInput}
                onSubmitText={handleSubmitText}
                onRequestHint={handleRequestHint}
                onSkipQuestion={handleSkipQuestion}
                awaitingNext={awaitingNext}
                onAdvanceNext={advanceQuestion}
                feedback={feedback}
                isFinished={isFinished}
                summaryItems={summaryItems}
                onRestart={() => startRound(undefined, scope, lengthChoice)}
                onRetryMissed={handleRetryMissed}
              />
            )}
          </aside>
        </div>
      </main>

      <footer className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-1 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>101 départements français · Métropole et DROM</span>
        {typeof window !== 'undefined' && window.location.protocol !== 'file:' && (
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('./atlas-departements.html');
                if (!res.ok) return;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'atlas-departements.html';
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
              } catch {
                // Ignore download cancellation
              }
            }}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-700 font-medium underline underline-offset-4 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger la page en fichier HTML autonome</span>
          </button>
        )}
      </footer>
    </div>
  );
}
