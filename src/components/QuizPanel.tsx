import React, { useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { DepartmentMeta, TextAcceptMode } from '../data/departmentsMeta';

export type QuizScope = 'all' | 'metro' | 'drom';
export type QuizLength = 10 | 20 | 'all';
export type MapPromptMode = 'both' | 'name' | 'code';

export interface RoundFeedback {
  type: 'correct' | 'wrong' | 'revealed';
  message: string;
  detail?: string;
}

export interface QuizSummaryItem {
  dept: DepartmentMeta;
  outcome: 'correct' | 'hinted' | 'missed';
}

interface QuizPanelProps {
  mode: 'map-click' | 'text-guess';
  scope: QuizScope;
  lengthChoice: QuizLength;
  mapPromptMode: MapPromptMode;
  textAcceptMode: TextAcceptMode;
  muted: boolean;
  onToggleMute: () => void;
  onScopeChange: (scope: QuizScope) => void;
  onLengthChange: (len: QuizLength) => void;
  onMapPromptModeChange: (m: MapPromptMode) => void;
  onTextAcceptModeChange: (m: TextAcceptMode) => void;
  // Active round state
  currentIndex: number;
  totalQuestions: number;
  score: number;
  streak: number;
  bestStreak: number;
  elapsedSeconds: number;
  currentTarget: DepartmentMeta | null;
  attemptsOnCurrent: number;
  hintLevel: number;
  textInput: string;
  onTextInputChange: (val: string) => void;
  onSubmitText: (e: React.FormEvent) => void;
  onRequestHint: () => void;
  onSkipQuestion: () => void;
  awaitingNext: boolean;
  onAdvanceNext: () => void;
  feedback: RoundFeedback | null;
  isFinished: boolean;
  summaryItems: QuizSummaryItem[];
  onRestart: () => void;
  onRetryMissed: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({
  mode,
  scope,
  lengthChoice,
  mapPromptMode,
  textAcceptMode,
  muted,
  onToggleMute,
  onScopeChange,
  onLengthChange,
  onMapPromptModeChange,
  onTextAcceptModeChange,
  currentIndex,
  totalQuestions,
  score,
  streak,
  bestStreak,
  elapsedSeconds,
  currentTarget,
  attemptsOnCurrent,
  hintLevel,
  textInput,
  onTextInputChange,
  onSubmitText,
  onRequestHint,
  onSkipQuestion,
  awaitingNext,
  onAdvanceNext,
  feedback,
  isFinished,
  summaryItems,
  onRestart,
  onRetryMissed,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'text-guess' && !isFinished && !awaitingNext) {
      inputRef.current?.focus();
    }
  }, [mode, currentIndex, isFinished, awaitingNext]);

  const progressPercent =
    totalQuestions > 0
      ? Math.round(((isFinished ? totalQuestions : currentIndex) / totalQuestions) * 100)
      : 0;

  const missedCount = summaryItems.filter((i) => i.outcome === 'missed' || i.outcome === 'hinted').length;
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getMapPromptDisplay = (target: DepartmentMeta) => {
    if (mapPromptMode === 'name') {
      return { primary: target.nom, secondary: null };
    }
    if (mapPromptMode === 'code') {
      return { primary: target.code, secondary: 'Numéro de département' };
    }
    return { primary: target.nom, secondary: `Département ${target.code}` };
  };

  const getTextPlaceholder = () => {
    if (textAcceptMode === 'code') return 'Numéro (ex : 29, 2A, 971)…';
    if (textAcceptMode === 'name') return 'Nom (ex : Finistère, Corse-du-Sud)…';
    return 'Nom ou numéro (ex : Finistère ou 29)…';
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Configuration Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">Paramètres de la partie</span>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Activer les sons' : 'Couper les sons'}
            title={muted ? 'Activer les sons' : 'Couper les sons'}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Scope Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-500">Territoire</span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                ['all', 'Tout (101)'],
                ['metro', 'Métropole (96)'],
                ['drom', 'DROM (5)'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onScopeChange(val)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                  scope === val
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Length & Criterion Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500">Série</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  [10, '10'],
                  [20, '20'],
                  ['all', 'Tout'],
                ] as const
              ).map(([val, label]) => {
                const disabled = scope === 'drom' && val !== 'all';
                return (
                  <button
                    key={String(val)}
                    type="button"
                    disabled={disabled}
                    onClick={() => onLengthChange(val)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      lengthChoice === val
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    } disabled:opacity-40 disabled:pointer-events-none`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === 'map-click' ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-500">Affichage</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    ['both', 'Nom+N°'],
                    ['name', 'Nom'],
                    ['code', 'N°'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onMapPromptModeChange(val)}
                    className={`px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                      mapPromptMode === val
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-500">Réponse attendue</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    ['both', 'Nom/N°'],
                    ['name', 'Nom'],
                    ['code', 'N°'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onTextAcceptModeChange(val)}
                    className={`px-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                      textAcceptMode === val
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Active Question OR Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 flex-1">
        {/* Clean Unboxed Progress & Tabular Metrics */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
            <span>
              {isFinished
                ? `Terminé · ${totalQuestions} / ${totalQuestions}`
                : `Question ${currentIndex + 1} / ${totalQuestions}`}
            </span>
            <div className="flex items-center gap-2">
              <span>
                Score <strong className="text-slate-900">{score}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Série <strong className="text-slate-900">{streak}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{formatDuration(elapsedSeconds)}</span>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {!isFinished && currentTarget ? (
          <>
            {mode === 'map-click' ? (
              /* MODE 1: MAP CLICK */
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Cliquez sur le département correspondant sur la carte
                  </p>
                  {(() => {
                    const disp = getMapPromptDisplay(currentTarget);
                    return (
                      <div className="mt-2">
                        <h2 className="font-display text-3xl font-semibold text-slate-900 tracking-tight text-balance">
                          {disp.primary}
                        </h2>
                        {disp.secondary && (
                          <p className="font-mono-tabular text-sm font-medium text-blue-700 mt-1">
                            {disp.secondary}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Hint Display */}
                {hintLevel > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                    <div>
                      <span className="font-semibold">Région :</span> {currentTarget.region}
                    </div>
                    <div>
                      <span className="font-semibold">Préfecture :</span> {currentTarget.prefecture}
                    </div>
                  </div>
                )}

                {/* Attempts Info */}
                <div className="text-xs text-slate-500 tabular-nums">
                  {attemptsOnCurrent > 0
                    ? `Essais sur ce département : ${attemptsOnCurrent} / 3`
                    : 'Premier essai'}
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-2 pt-1">
                  {awaitingNext ? (
                    <button
                      type="button"
                      onClick={onAdvanceNext}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span>Département suivant</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onRequestHint}
                        disabled={hintLevel > 0}
                        className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-45 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Indice</span>
                      </button>
                      <button
                        type="button"
                        onClick={onSkipQuestion}
                        className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Révéler et passer</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* MODE 2: TEXT GUESS */
              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Département mis en surbrillance sur la carte
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-slate-900 mt-1.5 text-balance">
                    Quel est ce département ?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {textAcceptMode === 'both'
                      ? 'Saisissez son nom complet ou son code officiel (ex : 33 ou Gironde).'
                      : textAcceptMode === 'name'
                      ? 'Saisissez le nom du département (les accents et tirets sont optionnels).'
                      : 'Saisissez le numéro du département (ex : 01, 2A, 974).'}
                  </p>
                </div>

                <form onSubmit={onSubmitText} className="flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={textInput}
                      disabled={awaitingNext}
                      onChange={(e) => onTextInputChange(e.target.value)}
                      placeholder={getTextPlaceholder()}
                      autoComplete="off"
                      autoCapitalize="words"
                      spellCheck={false}
                      className="flex-1 min-w-0 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    {!awaitingNext ? (
                      <button
                        type="submit"
                        disabled={!textInput.trim()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:pointer-events-none text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Valider
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onAdvanceNext}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <span>Suivant</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Progressive Hints */}
                {hintLevel > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                    <div>
                      <span className="font-semibold">Région :</span> {currentTarget.region} ·{' '}
                      <span className="font-semibold">Préfecture :</span> {currentTarget.prefecture}
                    </div>
                    {hintLevel >= 2 && (
                      <div>
                        <span className="font-semibold">Début :</span>{' '}
                        <span className="font-mono-tabular">
                          {currentTarget.nom.slice(0, 2)}… ({currentTarget.nom.length} caractères)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!awaitingNext && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRequestHint}
                      disabled={hintLevel >= 2}
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-45 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{hintLevel === 0 ? 'Indice (région)' : 'Indice (lettres)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onSkipQuestion}
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Passer</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Explicit Non-Hue-Only Feedback Banner */}
            {feedback && (
              <div
                role="status"
                className={`mt-auto p-3.5 rounded-lg border text-sm flex items-start gap-2.5 ${
                  feedback.type === 'correct'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : feedback.type === 'revealed'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {feedback.type === 'correct' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      feedback.type === 'revealed' ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  />
                )}
                <div className="min-w-0">
                  <div className="font-semibold">{feedback.message}</div>
                  {feedback.detail && <div className="text-xs opacity-85 mt-0.5">{feedback.detail}</div>}
                </div>
              </div>
            )}
          </>
        ) : (
          /* SUMMARY VIEW */
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h2 className="font-display text-2xl font-semibold text-slate-900">Bilan de la série</h2>
              <p className="text-sm text-slate-600 mt-1">
                {accuracy >= 90
                  ? 'Excellente maîtrise de la géographie française.'
                  : accuracy >= 70
                  ? 'Très bon résultat, quelques départements restent à consolider.'
                  : 'Continuez à pratiquer pour mémoriser chaque département.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100 tabular-nums">
              <div>
                <div className="text-xs text-slate-500">Score</div>
                <div className="text-xl font-semibold text-slate-900 mt-0.5">
                  {score} / {totalQuestions}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Précision</div>
                <div className="text-xl font-semibold text-blue-700 mt-0.5">{accuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Meilleure série</div>
                <div className="text-xl font-semibold text-slate-900 mt-0.5">{bestStreak}</div>
              </div>
            </div>

            {missedCount > 0 && (
              <div className="flex flex-col gap-1.5 min-h-0 flex-1">
                <div className="text-xs font-semibold text-slate-600">
                  À réviser ({missedCount})
                </div>
                <div className="overflow-y-auto max-h-[180px] divide-y divide-slate-100 border border-slate-100 rounded-lg px-2.5">
                  {summaryItems
                    .filter((i) => i.outcome !== 'correct')
                    .map((item) => (
                      <div
                        key={item.dept.code}
                        className="py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-mono-tabular font-semibold text-slate-700">
                            {item.dept.code}
                          </span>
                          <span className="font-medium text-slate-900 truncate">
                            {item.dept.nom}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 font-medium ${
                            item.outcome === 'missed' ? 'text-rose-700' : 'text-amber-700'
                          }`}
                        >
                          {item.outcome === 'missed' ? 'Manqué' : 'Avec aide'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onRestart}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rejouer</span>
              </button>
              {missedCount > 0 && (
                <button
                  type="button"
                  onClick={onRetryMissed}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Réviser les {missedCount} erreurs
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
