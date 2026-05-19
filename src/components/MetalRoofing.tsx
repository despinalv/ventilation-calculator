/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, 
  Settings, 
  Hammer,
  Hash,
  Ruler,
  Plus,
  Trash2,
  Info,
  Scale
} from 'lucide-react';

import Tooltip from './ui/Tooltip';

interface Facet {
  id: string;
  rakeLength: number;
  eaveLength: number;
  panelWidth: number;
}

type MetalProfile = 'pbr' | 'standing_seam' | 'mechanical_lock';

export default function MetalRoofing({ 
  projectName, 
  companyName,
  state,
  setState
}: { 
  projectName?: string, 
  companyName?: string,
  state: any,
  setState: (fn: (prev: any) => any) => void
}) {
  const { profile, screwSpacing, wasteFactor, facets } = state;

  const setProfile = (val: MetalProfile) => setState(prev => ({ ...prev, profile: val }));
  const setScrewSpacing = (val: number) => setState(prev => ({ ...prev, screwSpacing: val }));
  const setWasteFactor = (val: number) => setState(prev => ({ ...prev, wasteFactor: val }));
  const setFacets = (val: Facet[] | ((prev: Facet[]) => Facet[])) => {
    if (typeof val === 'function') {
      setState(prev => ({ ...prev, facets: val(prev.facets) }));
    } else {
      setState(prev => ({ ...prev, facets: val }));
    }
  };

  // Sync default screw spacing when profile changes
  useEffect(() => {
    if (profile === 'mechanical_lock') setScrewSpacing(18);
    else setScrewSpacing(12);
  }, [profile]);

  // Sync panel widths when profile changes if they are defaults
  useEffect(() => {
    setFacets(prev => prev.map(f => ({
      ...f,
      panelWidth: profile === 'pbr' ? 36 : 16
    })));
  }, [profile]);

  const addFacet = () => {
    const nextId = `RF-${facets.length + 1}`;
    setFacets([...facets, { 
      id: nextId, 
      rakeLength: 0, 
      eaveLength: 0, 
      panelWidth: profile === 'pbr' ? 36 : 16 
    }]);
  };

  const removeFacet = (index: number) => {
    if (facets.length <= 1) return;
    setFacets(facets.filter((_, i) => i !== index));
  };

  const updateFacet = (index: number, field: keyof Facet, value: number) => {
    const newFacets = [...facets];
    newFacets[index] = { ...newFacets[index], [field]: value };
    setFacets(newFacets);
  };

  const facetCalculations = useMemo(() => {
    return facets.map(f => {
      // Logic for panel count:
      // Mechanical Lock uses Useful Width (typically Panel Width - 2 for 16" panels to reach 14" coverage)
      // Standing Seam/PBR usually 16" or 36" coverage
      const usefulWidth = profile === 'mechanical_lock' ? (f.panelWidth - 2) : f.panelWidth;
      const panelsNeeded = Math.ceil(f.eaveLength / (usefulWidth / 12));
      
      const clipsPerPanel = f.rakeLength / (screwSpacing / 12);
      // User formula: roundup(# of panels * # of clips x panel) + eave length
      const totalClipsNeeded = Math.ceil(panelsNeeded * clipsPerPanel) + f.eaveLength;
      
      // User formula: round(rake length * # of panels)
      const masticTapeLength = Math.round(panelsNeeded * f.rakeLength);
      
      return {
        ...f,
        panelsNeeded,
        clipsPerPanel,
        totalClipsNeeded,
        masticTapeLength
      };
    });
  }, [facets, profile, screwSpacing]);

  const totals = useMemo(() => {
    const rawTotals = facetCalculations.reduce((acc, curr) => ({
      panels: acc.panels + curr.panelsNeeded,
      clips: acc.clips + curr.totalClipsNeeded,
      mastic: acc.mastic + curr.masticTapeLength
    }), { panels: 0, clips: 0, mastic: 0 });

    const multiplier = 1 + (wasteFactor / 100);

    return {
      panels: Math.ceil(rawTotals.panels * multiplier),
      clips: Math.ceil(rawTotals.clips * multiplier),
      mastic: Math.ceil(rawTotals.mastic * multiplier)
    };
  }, [facetCalculations, wasteFactor]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Profile Selector */}
      <section className="bg-zinc-900 p-1.5 rounded-2xl flex gap-1 shadow-2xl border border-zinc-800">
        {[
          { id: 'standing_seam', label: 'Standing Seam', icon: Wrench },
          { id: 'pbr', label: 'PBR / TuffRib', icon: Hammer },
          { id: 'mechanical_lock', label: 'Mechanical Lock', icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setProfile(item.id as MetalProfile)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
              profile === item.id 
                ? 'bg-orange-600 text-white shadow-lg scale-[1.02] z-10' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </section>

      {/* Global Settings - Full Width below profiles */}
      <section className="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings size={14} className="text-orange-500" /> 
                  Screw/Clip Spacing
                  <Tooltip content="Horizontal spacing between fasteners. Standard is 12 inches for standing seam." />
               </h3>
               <div className="grid grid-cols-3 gap-1 bg-zinc-800 p-1 rounded-xl">
                  {[12, 18, 24].map((s) => (
                    <button 
                      key={s}
                      onClick={() => setScrewSpacing(s)}
                      className={`py-2 text-[10px] font-black rounded-lg transition-all ${screwSpacing === s ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {s}"
                    </button>
                  ))}
               </div>
            </div>

            <div>
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Hash size={14} className="text-orange-500" /> 
                  Waste & Safety (%)
                  <Tooltip content="Additional percentage added to totals to account for cutting, damage, and field errors." />
               </h3>
               <div className="relative">
                  <input 
                    type="number"
                    value={wasteFactor}
                    onChange={(e) => setWasteFactor(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl outline-none font-mono font-black text-white focus:ring-2 focus:ring-orange-500/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-zinc-500 text-[10px]">FIXED OVERAGE</span>
               </div>
            </div>

            <div className="flex flex-col justify-center">
               <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4 flex gap-4 items-center">
                  <Info size={18} className="text-orange-500 shrink-0" />
                  <p className="text-[10px] text-orange-200/70 font-medium leading-tight">
                    Waste factor is applied to all totals (Fasteners, Panels, and Mastic).
                  </p>
               </div>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Col: Facet Inputs */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-3">
                   <Ruler size={18} className="text-orange-600" />
                   <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Facet Specific Measurements</h3>
                </div>
                <button 
                  onClick={addFacet}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
                >
                  <Plus size={14} /> Add Facet
                </button>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-zinc-100/50">
                         <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">ID</th>
                         <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rake (FT)</th>
                         <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Eave (FT)</th>
                         <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Width (IN)</th>
                         <th className="px-6 py-4 text-center"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-100">
                      {facets.map((f, i) => (
                        <tr key={i} className="group hover:bg-orange-50/30 transition-colors">
                           <td className="px-6 py-4 font-mono font-black text-zinc-400 text-xs">{f.id}</td>
                           <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={f.rakeLength}
                                onChange={(e) => updateFacet(i, 'rakeLength', Number(e.target.value))}
                                className="w-24 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                              />
                           </td>
                           <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={f.eaveLength}
                                onChange={(e) => updateFacet(i, 'eaveLength', Number(e.target.value))}
                                className="w-24 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                              />
                           </td>
                           <td className="px-6 py-4">
                              <input 
                                type="number" 
                                value={f.panelWidth}
                                onChange={(e) => updateFacet(i, 'panelWidth', Number(e.target.value))}
                                className="w-24 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                              />
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => removeFacet(i)}
                                className="p-2 text-zinc-300 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Facet Detail Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {facetCalculations.map((calc, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                   <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-50">
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">{calc.id} Raw Results</span>
                      <span className="text-[10px] font-bold text-zinc-400">{calc.panelsNeeded} Panels</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Clips / Panel</p>
                         <p className="text-sm font-mono font-bold text-zinc-800">{calc.clipsPerPanel.toFixed(2)}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Mastic Needed</p>
                         <p className="text-sm font-mono font-bold text-zinc-800">{calc.masticTapeLength} LF</p>
                      </div>
                   </div>
                   <div className="mt-4 pt-3 bg-zinc-50 rounded-lg px-4 py-2 border border-zinc-100 flex justify-between items-center">
                      <span className="text-[9px] font-black text-zinc-500 uppercase">Clips for Facet</span>
                      <span className="text-sm font-mono font-black text-orange-700">
                        {Number.isInteger(calc.totalClipsNeeded) ? calc.totalClipsNeeded : calc.totalClipsNeeded.toFixed(2)}
                      </span>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right Col: Totals */}
        <div className="col-span-12 lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
             <div className="flex items-center gap-3 mb-6">
                <Scale size={18} className="text-orange-500" />
                <h4 className="text-[10px] font-display font-black text-white uppercase tracking-widest">Total Project Takeoff</h4>
             </div>
             <div className="space-y-4">
                <TakeoffRow label="Total Panels" value={totals.panels} unit="PCS" />
                <TakeoffRow label={`Total ${profile === 'standing_seam' ? 'Screws' : 'Clips'}`} value={totals.clips} unit="PCS" highlight />
                <TakeoffRow label="Total Mastic" value={totals.mastic} unit="LF" />
                <div className="pt-2">
                   <p className="text-[9px] font-black text-zinc-500 uppercase text-center tracking-widest">
                     Inc. {wasteFactor}% waste factor
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
             <div className="flex gap-4">
                <Info size={24} className="text-orange-600 shrink-0" />
                <div>
                   <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">Calculation Logic</p>
                   <p className="text-xs text-orange-700/80 leading-relaxed font-medium">
                      {profile === 'mechanical_lock' 
                        ? 'Mechanical Lock assumes a 2" rib loss for panel coverage. Clip count is derived from Rake Length / Spacing.' 
                        : 'PBR and Standing Seam assume full width coverage. Calculated per facet with configured spacing.'}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TakeoffRow({ label, value, unit, highlight = false }: { label: string, value: number, unit: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl flex justify-between items-center transition-all ${highlight ? 'bg-orange-600 shadow-lg scale-105' : 'bg-zinc-800/50'}`}>
       <span className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-orange-100' : 'text-zinc-500'}`}>{label}</span>
       <div className="flex items-baseline gap-2">
          <span className={`text-xl font-mono font-black ${highlight ? 'text-white' : 'text-zinc-300'}`}>{value}</span>
          <span className={`text-[10px] font-bold uppercase ${highlight ? 'text-orange-300' : 'text-zinc-600'}`}>{unit}</span>
       </div>
    </div>
  );
}


