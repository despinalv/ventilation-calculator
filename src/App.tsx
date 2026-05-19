/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calculator, 
  Mountain, 
  Search, 
  Menu, 
  X,
  ChevronRight,
  Info,
  FolderOpen,
  Settings,
  Image as ImageIcon,
  Building2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toJpeg, toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Screen } from './constants';
import ShingleVentilation from './components/ShingleVentilation';
import MetalRoofing from './components/MetalRoofing';
import IntakeLookup from './components/IntakeLookup';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('shingle');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [companyName, setCompanyName] = useState('Ventilation Calculator');
  const [companyLogo, setCompanyLogo] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  // --- LIFTED STATE ---
  // Shingle
  const [shingleState, setShingleState] = useState({
    footprint: 0,
    rule: 300 as 150 | 300,
    split: '50/50' as '50/50' | '60/40',
    intakeStatus: 'none' as 'none' | 'existing',
    existingIntakeNfa: 0,
    selectedExhaustId: ''
  });

  // Metal
  const [metalState, setMetalState] = useState({
    profile: 'standing_seam' as 'pbr' | 'standing_seam' | 'mechanical_lock',
    screwSpacing: 12,
    wasteFactor: 0,
    facets: [{ id: 'RF-1', rakeLength: 0, eaveLength: 0, panelWidth: 16 }]
  });

  // Lookup
  const [lookupState, setLookupState] = useState({
    reverseNfa: 0,
    searchQuery: '',
    calcAtticArea: 0,
    calcOverhang: 0,
    calcLength: 0,
    calcPanelNfa: 0,
    calcExposure: 0
  });

  // --- PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem('app_data_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.companyLogo) setCompanyLogo(parsed.companyLogo);
        if (parsed.shingleState) setShingleState(parsed.shingleState);
        if (parsed.metalState) setMetalState(parsed.metalState);
        if (parsed.lookupState) setLookupState(parsed.lookupState);
      } catch (e) {
        console.error('Failed to load persistence', e);
      }
    }
  }, []);

  useEffect(() => {
    const data = {
      projectName,
      companyName,
      companyLogo,
      shingleState,
      metalState,
      lookupState
    };
    localStorage.setItem('app_data_v1', JSON.stringify(data));
  }, [projectName, companyName, companyLogo, shingleState, metalState, lookupState]);

  // Handle Footprint Syncing
  useEffect(() => {
    if (shingleState.footprint !== lookupState.calcAtticArea) {
      setLookupState(prev => ({ ...prev, calcAtticArea: shingleState.footprint }));
    }
  }, [shingleState.footprint]);

  const navItems = [
    { id: 'shingle', label: 'Shingle Ventilation', icon: Calculator },
    { id: 'lookup', label: 'Intake Reference', icon: Search },
    { id: 'metal', label: 'Metal Roofing', icon: Mountain },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleExportScreenshot = async () => {
    if (!contentRef.current) return;
    
    try {
      const element = contentRef.current;
      
      // Force desktop-like width for capture to ensure horizontal layout
      const captureWidth = 1280;
      const originalWidth = element.style.width;
      const originalHeight = element.style.height;
      const originalOverflow = element.style.overflow;
      
      // Apply capture styles
      element.style.width = `${captureWidth}px`;
      element.style.height = 'auto'; // Let it expand to show everything
      element.style.overflow = 'visible';
      
      const dataUrl = await toJpeg(element, {
        backgroundColor: '#f8fafc',
        quality: 0.95,
        pixelRatio: 2,
        width: captureWidth,
        height: element.scrollHeight,
        style: {
          overflow: 'visible',
          height: `${element.scrollHeight}px`,
          width: `${captureWidth}px`
        }
      });

      // Restore original styles
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;
      
      const link = document.createElement('a');
      link.download = `Estimate_${projectName || 'Report'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate export. Please check console for details.');
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-zinc-900 flex flex-col shrink-0 border-r border-zinc-800 transition-all duration-300 ease-in-out z-30"
      >
        <div className={`p-6 border-b border-zinc-800 flex items-center gap-4 ${isSidebarOpen ? 'justify-between' : 'justify-center flex-col'}`}>
          <div className="flex items-center gap-3 min-w-max">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white p-1" />
            ) : (
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-orange-900/40">W</div>
            )}
            {isSidebarOpen && (
              <h1 className="text-white font-display font-black tracking-tight text-[13px] uppercase truncate w-32">
                {companyName}
              </h1>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-700 bg-zinc-800/50 shrink-0 ${!isSidebarOpen && 'mt-2'}`}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id as Screen)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl relative group ${
                  isActive 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                {!isSidebarOpen && isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full" 
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-800">
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-zinc-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3 md:gap-8 min-w-0">
            <h2 className="text-lg md:text-xl font-display font-black text-zinc-800 uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] md:max-w-none">
              {navItems.find(i => i.id === activeScreen)?.label}
            </h2>
            
            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 min-w-0 group">
              <FolderOpen size={16} className="text-zinc-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Enter Project Name..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-transparent border-none text-sm font-bold focus:outline-none w-32 md:w-64 text-zinc-700 placeholder:text-zinc-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <span className="hidden sm:block text-[10px] font-black px-2.5 py-1.5 bg-amber-100 text-amber-700 rounded-lg tracking-tighter border border-amber-200 uppercase">DRAFT MODE</span>
            <button 
              onClick={handleExportScreenshot}
              className="px-3 md:px-5 py-2 md:py-2.5 bg-zinc-900 text-white rounded-xl text-[11px] md:text-sm font-bold shadow-lg shadow-zinc-200 hover:bg-orange-600 transition-all flex items-center gap-2 group active:scale-95"
            >
              <Calculator size={16} className="group-hover:rotate-12 transition-transform shrink-0" /> <span className="hidden xs:inline">EXPORT REPORT</span>
            </button>
          </div>
        </header>

        {/* Content Region */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#fcfcfc]" ref={contentRef}>
          <div className="max-w-6xl mx-auto">
            {/* Branding for the PDF/Screenshot Export & UI Feedback */}
            {activeScreen !== 'settings' && (
              <div className="mb-10 border-b-4 border-orange-600 pb-6 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                   {companyLogo ? (
                     <img src={companyLogo} alt="Logo" className="h-12 w-auto object-contain" />
                   ) : (
                     <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white text-2xl font-black">W</div>
                   )}
                   <div>
                     <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">{companyName}</h1>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Project Identifier</p>
                   <p className="text-xl font-bold text-orange-700 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 min-w-[160px] inline-block">
                     {projectName || '--- ---'}
                   </p>
                 </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {activeScreen === 'shingle' && (
                  <ShingleVentilation 
                    projectName={projectName} 
                    companyName={companyName}
                    companyLogo={companyLogo}
                    state={shingleState}
                    setState={setShingleState}
                  />
                )}
                {activeScreen === 'metal' && (
                  <MetalRoofing 
                    projectName={projectName} 
                    companyName={companyName}
                    state={metalState}
                    setState={setMetalState}
                  />
                )}
                {activeScreen === 'lookup' && (
                  <IntakeLookup 
                    state={lookupState}
                    setState={setLookupState}
                    onImportToShingle={(nfa) => {
                      setShingleState(prev => ({
                        ...prev,
                        intakeStatus: 'existing',
                        existingIntakeNfa: nfa
                      }));
                      setActiveScreen('shingle');
                    }}
                  />
                )}
                {activeScreen === 'settings' && (
                  <div className="max-w-2xl mx-auto bg-white rounded-3xl p-10 shadow-xl border border-zinc-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                        <Settings size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black text-zinc-900 leading-none">General Settings</h3>
                        <p className="text-sm text-zinc-500 font-medium tracking-tight mt-1">Configure your company branding and defaults</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="grid gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          <Building2 size={14} className="text-orange-500" /> Company Name
                        </label>
                        <input 
                          type="text" 
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-zinc-800"
                          placeholder="e.g. Ventilation Calculator"
                        />
                      </div>

                      <div className="grid gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          <ImageIcon size={14} className="text-orange-500" /> Logo URL (Optional)
                        </label>
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            value={companyLogo}
                            onChange={(e) => setCompanyLogo(e.target.value)}
                            className="flex-1 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-zinc-800 font-mono"
                            placeholder="https://example.com/logo.png"
                          />
                          {companyLogo && (
                            <button 
                              onClick={() => setCompanyLogo('')}
                              className="p-4 text-zinc-400 hover:text-red-500 bg-zinc-100 rounded-2xl transition-colors"
                            >
                              <Trash2 size={24} />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium">Use a direct link to a transparent PNG for best results on PDF exports.</p>
                      </div>

                      <div className="pt-6 border-t border-zinc-100 flex justify-end">
                        <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold flex items-center gap-2 border border-emerald-100">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          Changes saved to session
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Status Bar / Footer */}
        <footer className="h-10 bg-zinc-100 border-t border-zinc-200 px-6 flex items-center justify-between shrink-0">
          <p className="text-[9px] text-zinc-400 font-medium italic">Professional Estimating Tool for Internal Use Only - Building with Precision</p>
          {projectName && (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Active File: {projectName}</span>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}
