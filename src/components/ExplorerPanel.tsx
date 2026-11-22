import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, MapPin, Search } from 'lucide-react';
import {
  DEPARTMENTS_META,
  ORDERED_DEPARTMENT_CODES,
  normalizeText,
} from '../data/departmentsMeta';

interface ExplorerPanelProps {
  activeScope: 'all' | 'metro' | 'drom';
  onScopeChange: (scope: 'all' | 'metro' | 'drom') => void;
  selectedCode: string | null;
  onSelectCode: (code: string) => void;
  showAllLabels: boolean;
  onToggleLabels: () => void;
}

export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
  activeScope,
  onScopeChange,
  selectedCode,
  onSelectCode,
  showAllLabels,
  onToggleLabels,
}) => {
  const [query, setQuery] = useState('');

  const filteredDepartments = useMemo(() => {
    const q = normalizeText(query);
    return ORDERED_DEPARTMENT_CODES.map((c) => DEPARTMENTS_META[c]).filter((d) => {
      if (activeScope === 'metro' && d.isDrom) return false;
      if (activeScope === 'drom' && !d.isDrom) return false;
      if (!q) return true;
      return (
        normalizeText(d.nom).includes(q) ||
        d.code.toLowerCase().includes(q) ||
        normalizeText(d.prefecture).includes(q) ||
        normalizeText(d.region).includes(q)
      );
    });
  }, [activeScope, query]);

  const selectedDept = selectedCode ? DEPARTMENTS_META[selectedCode] : null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Selected Department Detail Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {selectedDept ? (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                {selectedDept.nom}
              </h2>
              <span className="font-mono-tabular text-lg font-semibold text-blue-700 shrink-0">
                {selectedDept.code}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Préfecture</div>
                <div className="font-medium text-slate-800 mt-0.5">{selectedDept.prefecture}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Région</div>
                <div className="font-medium text-slate-800 mt-0.5">{selectedDept.region}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {selectedDept.isDrom ? "Département et région d'outre-mer (DROM)" : 'France métropolitaine'}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">Mode explorateur</p>
              <p className="text-slate-500 mt-1">
                Cliquez sur n’importe quel département de la carte ou sélectionnez-le dans la liste
                ci-dessous pour consulter son numéro, sa préfecture et sa région.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                ['all', 'Tous (101)'],
                ['metro', 'Métropole (96)'],
                ['drom', 'DROM (5)'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onScopeChange(val)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeScope === val
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleLabels}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              showAllLabels
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {showAllLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Numéros</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher nom, code ou préfecture..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between px-1">
          <span>Répertoire</span>
          <span className="tabular-nums">{filteredDepartments.length} départements</span>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto flex-1 max-h-[320px] lg:max-h-[380px] divide-y divide-slate-100 pr-1">
          {filteredDepartments.map((dept) => {
            const isSelected = selectedCode === dept.code;
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => onSelectCode(dept.code)}
                className={`w-full text-left px-2.5 py-2 rounded-md flex items-center justify-between gap-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 font-medium'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-baseline gap-2.5 min-w-0">
                  <span className="font-mono-tabular text-xs font-semibold text-blue-700 w-8 shrink-0">
                    {dept.code}
                  </span>
                  <span className="truncate">{dept.nom}</span>
                </div>
                <span className="text-xs text-slate-500 truncate max-w-[120px] shrink-0">
                  {dept.prefecture}
                </span>
              </button>
            );
          })}
          {filteredDepartments.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              Aucun département ne correspond à « {query} ».
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
