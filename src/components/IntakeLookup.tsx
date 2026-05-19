/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Dna, 
  Search, 
  HelpCircle,
  Copy,
  ChevronRight,
  Calculator,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { INTAKE_PROFILES } from '../constants';

type SortType = 'name-asc' | 'name-desc' | 'nfa-asc' | 'nfa-desc';

export default function IntakeLookup({ state, setState, onImportToShingle }: { 
  state: any, 
  setState: (fn: (prev: any) => any) => void,
  onImportToShingle?: (nfa: number) => void
}) {
  const { reverseNfa, searchQuery, calcAtticArea, calcOverhang, calcLength, calcPanelNfa, calcExposure } = state;
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const setReverseNfa = (val: number) => setState(prev => ({ ...prev, reverseNfa: val }));
  const setSearchQuery = (val: string) => setState(prev => ({ ...prev, searchQuery: val }));
  const setCalcAtticArea = (val: number) => setState(prev => ({ ...prev, calcAtticArea: val }));
  const setCalcOverhang = (val: number) => setState(prev => ({ ...prev, calcOverhang: val }));
  const setCalcLength = (val: number) => setState(prev => ({ ...prev, calcLength: val }));
  const setCalcPanelNfa = (val: number) => setState(prev => ({ ...prev, calcPanelNfa: val }));
  const setCalcExposure = (val: number) => setState(prev => ({ ...prev, calcExposure: val }));
  
  // Sort state can stays local as it's just a view preference
  const [sortBy, setSortBy] = useState<SortType>('name-asc');

  const reverseArea = (reverseNfa * 2 * 2) / 12;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filtered and Sorted Profiles
  const filteredProfiles = useMemo(() => {
    let result = [...INTAKE_PROFILES].filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'nfa-asc': return a.nfa - b.nfa;
        case 'nfa-desc': return b.nfa - a.nfa;
        default: return 0;
      }
    });

    return result;
  }, [searchQuery, sortBy]);

  // Intake Calculation Results
  const calcResults = useMemo(() => {
    const requiredIntakeNfa = Math.round((calcAtticArea / 300) * 144 / 2);
    
    // Logic: (Length / (Exposure / 12)) * PanelNFA * (Overhang / 12)
    // Assuming standard panel depth is 12" as inferred from Lomanco tools
    const panelsNeeded = calcLength / (Math.max(calcExposure, 1) / 12);
    const nfaOfPanels = Math.round(panelsNeeded * calcPanelNfa * (calcOverhang / 12));

    return {
      required: requiredIntakeNfa,
      actual: nfaOfPanels,
      isAdequate: nfaOfPanels >= requiredIntakeNfa
    };
  }, [calcAtticArea, calcOverhang, calcLength, calcPanelNfa, calcExposure]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Header Info */}
      <section className="bg-zinc-900 text-white p-8 rounded-xl relative overflow-hidden border border-zinc-800 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Dna size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight uppercase">Soffit Intake Reference</h2>
          </div>
          <p className="text-zinc-400 text-xs max-w-lg leading-relaxed uppercase tracking-widest font-semibold opacity-70">
            Verify existing ventilation profiles against manufacturer specifications. 
            All values indicated are Net Free Area (NFA) per linear foot.
          </p>
        </div>
        <div className="absolute -top-4 -right-4 p-8 opacity-5">
          <Search size={160} />
        </div>
      </section>

      {/* Main Grid with Search and Sort */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search profiles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-orange-500/10"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <div className="flex bg-white border border-zinc-200 rounded-lg p-1">
                <button 
                  onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                   className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${sortBy.startsWith('name') ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                   A-Z {sortBy === 'name-asc' ? <ArrowUp size={12} /> : sortBy === 'name-desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} />}
                </button>
                <button 
                   onClick={() => setSortBy(sortBy === 'nfa-asc' ? 'nfa-desc' : 'nfa-asc')}
                   className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${sortBy.startsWith('nfa') ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                   NFA {sortBy === 'nfa-asc' ? <ArrowUp size={12} /> : sortBy === 'nfa-desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} />}
                </button>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-12 bg-zinc-100/50 border-b border-zinc-200 px-6 py-4">
          <div className="col-span-8 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Manufacturer Profile</div>
          <div className="col-span-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest text-right">NFA / LF Rating</div>
        </div>
        <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
          {filteredProfiles.length > 0 ? filteredProfiles.map((profile, i) => (
            <div key={i} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-orange-50/30 transition-all group cursor-default">
              <div className="col-span-8">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="font-bold text-zinc-800 group-hover:text-orange-900 transition-colors uppercase tracking-tight text-sm">{profile.name}</h4>
                    <p className="text-[10px] font-black text-zinc-400 tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span> VERIFIED SPEC
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span-4 flex items-center justify-end gap-4 text-right">
                <div className="flex flex-col items-end mr-2">
                  <p className="text-xl font-mono font-black text-zinc-800 group-hover:text-orange-700 transition-colors">
                    {profile.nfa}
                  </p>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">SQ IN / LF</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setCalcPanelNfa(profile.nfa);
                      const el = document.getElementById('calc-utility');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    title="Load into Calculator"
                    className="p-2 rounded-lg bg-zinc-900 text-white hover:bg-orange-600 transition-all shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase"
                  >
                    <Calculator size={14} /> SELECT
                  </button>
                  <button 
                    onClick={() => copyToClipboard(profile.nfa.toString(), i)}
                    className={`p-2 rounded-lg transition-all border ${copiedIndex === i ? 'bg-orange-600 border-orange-500 text-white shadow-lg scale-110' : 'bg-white border-zinc-200 text-zinc-400 hover:text-orange-600 hover:border-orange-200 shadow-sm'}`}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center">
               <Search className="mx-auto text-zinc-200 mb-4" size={48} />
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No matching profiles found</p>
            </div>
          )}
        </div>
      </div>

      {/* Intake Calculation Tool */}
      <section id="calc-utility" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="bg-zinc-900 text-white p-6 border-b border-zinc-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Calculator size={20} className="text-orange-500" />
              <h3 className="text-sm font-black uppercase tracking-widest">Intake Calculation Utility</h3>
           </div>
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Based on Lomanco Logic</span>
        </div>
        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div>
                    <label className="block text-[11px] font-black text-zinc-500 uppercase mb-2 tracking-tight">Attic Area (SQ FT)</label>
                    <input 
                       type="number" 
                       value={calcAtticArea || ''} 
                       onChange={(e) => setCalcAtticArea(Number(e.target.value))}
                       className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none font-bold text-zinc-800 focus:ring-2 focus:ring-orange-500/20"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[11px] font-black text-zinc-500 uppercase mb-2 tracking-tight">Overhang (IN)</label>
                       <input 
                          type="number" 
                          value={calcOverhang || ''} 
                          onChange={(e) => setCalcOverhang(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none font-bold text-zinc-800 focus:ring-2 focus:ring-orange-500/20"
                       />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-zinc-500 uppercase mb-2 tracking-tight">Soffit Length (FT)</label>
                       <input 
                          type="number" 
                          value={calcLength || ''} 
                          onChange={(e) => setCalcLength(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none font-bold text-zinc-800 focus:ring-2 focus:ring-orange-500/20"
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[11px] font-black text-zinc-500 uppercase mb-2 tracking-tight">Panel NFA (SQ IN)</label>
                       <input 
                          type="number" 
                          value={calcPanelNfa || ''} 
                          onChange={(e) => setCalcPanelNfa(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none font-bold text-zinc-800 focus:ring-2 focus:ring-orange-500/20 border-orange-200"
                       />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-zinc-500 uppercase mb-2 tracking-tight">Exposure (IN)</label>
                       <input 
                          type="number" 
                          value={calcExposure || ''} 
                          onChange={(e) => setCalcExposure(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none font-bold text-zinc-800 focus:ring-2 focus:ring-orange-500/20"
                       />
                    </div>
                 </div>
              </div>

              <div className="flex flex-col justify-center gap-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-zinc-100 border border-zinc-200">
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Required NFA</p>
                       <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-mono font-black text-zinc-800">{calcResults.required}</span>
                          <span className="text-xs font-black text-zinc-400">SQ IN</span>
                       </div>
                    </div>
                    <div className={`p-6 rounded-2xl border ${calcResults.isAdequate ? 'bg-zinc-900 border-zinc-800' : 'bg-orange-50 border-orange-200'}`}>
                       <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${calcResults.isAdequate ? 'text-zinc-500' : 'text-orange-400'}`}>Panel Intake</p>
                       <div className="flex items-baseline gap-2">
                          <span className={`text-3xl font-mono font-black ${calcResults.isAdequate ? 'text-white' : 'text-orange-700'}`}>{calcResults.actual}</span>
                          <span className={`text-xs font-black ${calcResults.isAdequate ? 'text-zinc-600' : 'text-orange-400'}`}>SQ IN</span>
                       </div>
                    </div>
                 </div>

                 <div className={`p-5 rounded-xl flex items-center gap-4 border ${calcResults.isAdequate ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {calcResults.isAdequate ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <div>
                       <p className="text-xs font-black uppercase tracking-widest">Calculated Status</p>
                       <p className="text-sm font-medium">
                          {calcResults.isAdequate 
                            ? 'Adequate intake ventilation is provided based on info supplied.' 
                            : `Deficit of ${calcResults.required - calcResults.actual} SQ IN. Add supplemental intake.`}
                       </p>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    {onImportToShingle && calcResults.actual > 0 && (
                      <button 
                         onClick={() => onImportToShingle(calcResults.actual)}
                         className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] shadow-lg shadow-orange-200 hover:bg-orange-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95 group"
                      >
                         <Calculator size={18} className="group-hover:rotate-12 transition-transform" /> 
                         <span>Import Result to Calculator</span>
                      </button>
                    )}
                    <button 
                       onClick={() => setCalcAtticArea(0)}
                       className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-zinc-200 transition-all active:scale-95 border border-zinc-200"
                    >
                      Reset Calc
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
