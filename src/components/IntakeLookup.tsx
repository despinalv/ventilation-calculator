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
  CheckCircle2,
  Camera,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { INTAKE_PROFILES } from '../constants';

type SortType = 'name-asc' | 'name-desc' | 'nfa-asc' | 'nfa-desc';

// Compress and resize images client-side before storing to avoid localStorage QuotaExceededError
const resizeImage = (file: File, maxWidth = 160, maxHeight = 160): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG to make it incredibly lightweight
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export default function IntakeLookup({ state, setState, onImportToShingle, isExporting = false }: { 
  state: any, 
  setState: (fn: (prev: any) => any) => void,
  onImportToShingle?: (nfa: number) => void,
  isExporting?: boolean
}) {
  const { 
    reverseNfa, 
    searchQuery, 
    calcAtticArea, 
    calcOverhang, 
    calcLength, 
    calcPanelNfa, 
    calcExposure,
    selectedProfileName = '',
    uploadedImages = {}
  } = state;

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const setReverseNfa = (val: number) => setState(prev => ({ ...prev, reverseNfa: val }));
  const setSearchQuery = (val: string) => setState(prev => ({ ...prev, searchQuery: val }));
  const setCalcAtticArea = (val: number) => setState(prev => ({ ...prev, calcAtticArea: val }));
  const setCalcOverhang = (val: number) => setState(prev => ({ ...prev, calcOverhang: val }));
  const setCalcLength = (val: number) => setState(prev => ({ ...prev, calcLength: val }));
  const setCalcPanelNfa = (val: number) => setState(prev => ({ ...prev, calcPanelNfa: val }));
  const setCalcExposure = (val: number) => setState(prev => ({ ...prev, calcExposure: val }));
  const setSelectedProfileName = (val: string) => setState(prev => ({ ...prev, selectedProfileName: val }));

  const setUploadedImage = (profileName: string, base64: string) => {
    setState(prev => ({
      ...prev,
      uploadedImages: {
        ...(prev.uploadedImages || {}),
        [profileName]: base64
      }
    }));
  };

  const removeUploadedImage = (profileName: string) => {
    setState(prev => {
      const rest = { ...(prev.uploadedImages || {}) };
      delete rest[profileName];
      return {
        ...prev,
        uploadedImages: rest
      };
    });
  };

  // Sort state stays local as it's just a view preference
  const [sortBy, setSortBy] = useState<SortType>('name-asc');

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

  // Selected Profile details for clean logic
  const selectedProfile = useMemo(() => {
    return INTAKE_PROFILES.find(p => p.name === selectedProfileName);
  }, [selectedProfileName]);

  // Intake Calculation Results
  const calcResults = useMemo(() => {
    const requiredIntakeNfa = Math.round((calcAtticArea / 300) * 144 / 2);
    
    // Logic: (Length / (Exposure / 12)) * PanelNFA * (Overhang / 12)
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

      {/* Conditionally render: Single selected specifications card during export, or search grid normally */}
      {isExporting && selectedProfile ? (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-md p-6 flex flex-col md:flex-row items-center gap-6 animate-in fade-in">
          <div className="w-20 h-20 rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
            {uploadedImages[selectedProfile.name] ? (
              <img 
                src={uploadedImages[selectedProfile.name]} 
                alt={selectedProfile.name} 
                className="w-full h-full object-cover rounded-lg" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <ImageIcon size={32} className="text-zinc-350" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 uppercase tracking-widest">
              Selected Intake Profile
            </span>
            <h3 className="text-lg font-black text-zinc-900 mt-2 uppercase tracking-tight">{selectedProfile.name}</h3>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-1 flex items-center gap-1.5 justify-center md:justify-start">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> VERIFIED MANUFACTURER SPEC
            </p>
          </div>
          <div className="text-center md:text-right shrink-0">
            <p className="text-4xl font-mono font-black text-orange-600">
              {selectedProfile.nfa}
            </p>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">SQ IN / LF RATING</p>
          </div>
        </div>
      ) : (
        /* Main Grid with Search and Sort */
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
            <div className="col-span-8 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Manufacturer Profile (Click to Upload Photo)</div>
            <div className="col-span-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest text-right">NFA / LF Rating</div>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
            {filteredProfiles.length > 0 ? filteredProfiles.map((profile, i) => (
              <div 
                key={i} 
                className={`grid grid-cols-12 px-6 py-4 items-center transition-all group cursor-default border-l-4 ${
                  selectedProfileName === profile.name 
                    ? 'border-orange-600 bg-orange-50/20' 
                    : 'border-transparent hover:bg-orange-50/10'
                }`}
              >
                <div className="col-span-8">
                  <div className="flex items-center gap-4">
                    {/* Visual Image Uploader Box */}
                    <div className="relative w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm group/thumb">
                      {uploadedImages[profile.name] ? (
                        <>
                          <img 
                            src={uploadedImages[profile.name]} 
                            alt={profile.name} 
                            className="w-full h-full object-cover rounded-lg" 
                            referrerPolicy="no-referrer"
                          />
                          {/* Hover Action Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-200">
                            <label className="p-1 px-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer transition-colors" title="Change Photo">
                              <Camera size={13} />
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const base64 = await resizeImage(file);
                                      setUploadedImage(profile.name, base64);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                }} 
                              />
                            </label>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUploadedImage(profile.name);
                              }}
                              className="p-1 px-1.5 rounded bg-zinc-800 hover:bg-red-600 text-white transition-colors" 
                              title="Remove Photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 hover:text-orange-600 hover:bg-orange-50/40 cursor-pointer transition-all duration-200">
                          <Camera size={18} className="text-zinc-400 group-hover/thumb:text-orange-500" />
                          <span className="text-[8px] font-black uppercase tracking-tighter mt-1 text-zinc-400">Add Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                  try {
                                    const base64 = await resizeImage(file);
                                    setUploadedImage(profile.name, base64);
                                  } catch (err) {
                                    console.error(err);
                                  }
                              }
                            }} 
                          />
                        </label>
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="font-bold text-zinc-800 group-hover:text-orange-900 transition-colors uppercase tracking-tight text-sm truncate">{profile.name}</h4>
                      <p className="text-[10px] font-black tracking-wider flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedProfileName === profile.name ? 'bg-orange-500' : 'bg-zinc-300'}`}></span>
                        {selectedProfileName === profile.name ? (
                          <span className="text-orange-600 font-extrabold uppercase">Selected System Input</span>
                        ) : (
                          <span className="text-zinc-400 uppercase">Manufacturer SPEC Rating</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-4 flex items-center justify-end gap-3 text-right">
                  <div className="flex flex-col items-end mr-1 shrink-0">
                    <p className={`text-xl font-mono font-black ${selectedProfileName === profile.name ? 'text-orange-600' : 'text-zinc-800'}`}>
                      {profile.nfa}
                    </p>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">SQ IN / LF</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        setCalcPanelNfa(profile.nfa);
                        setSelectedProfileName(profile.name);
                        const el = document.getElementById('calc-utility');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      title="Select Profile"
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm flex items-center gap-1.5 ${
                        selectedProfileName === profile.name 
                          ? 'bg-orange-600 text-white shadow-orange-100 hover:bg-orange-500' 
                          : 'bg-zinc-900 text-white hover:bg-orange-600'
                      }`}
                    >
                      <Calculator size={13} /> {selectedProfileName === profile.name ? 'SELECTED' : 'SELECT'}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(profile.nfa.toString(), i)}
                      className={`p-2 rounded-lg transition-all border ${copiedIndex === i ? 'bg-orange-600 border-orange-500 text-white shadow-lg scale-110' : 'bg-white border-zinc-200 text-zinc-400 hover:text-orange-600 hover:border-orange-200 shadow-sm'}`}
                    >
                      <Copy size={13} />
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
      )}

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
