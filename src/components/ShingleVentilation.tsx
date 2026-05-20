/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Wind,
  Layers,
  Save,
  Trash2,
  RotateCcw,
  History,
  Info,
  X,
  Calculator,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';

import Tooltip from './ui/Tooltip';

interface ShingleState {
  footprint: number;
  rule: 150 | 300;
  split: '50/50' | '60/40';
  intakeStatus: 'none' | 'existing';
  existingIntakeNfa: number;
  selectedExhaustId: string;
  availableRidgeLf?: number;
}

interface SavedDraft {
  id: string;
  name: string;
  timestamp: number;
  data: ShingleState;
}

const DEFAULT_STATE: ShingleState = {
  footprint: 0,
  rule: 300,
  split: '50/50',
  intakeStatus: 'none',
  existingIntakeNfa: 0,
  selectedExhaustId: '',
  availableRidgeLf: 0,
};

export default function ShingleVentilation({ 
  projectName, 
  companyName = 'Ventilation Calculator',
  companyLogo = '',
  state,
  setState,
  lookupState
}: { 
  projectName?: string, 
  companyName?: string,
  companyLogo?: string,
  state: any,
  setState: (fn: (prev: any) => any) => void,
  lookupState?: any
}) {
  const { footprint, rule, split, intakeStatus, existingIntakeNfa, selectedExhaustId, availableRidgeLf = 0 } = state;
  
  const setFootprint = (val: number) => setState(prev => ({ ...prev, footprint: val }));
  const setRule = (val: 150 | 300) => setState(prev => ({ ...prev, rule: val }));
  const setSplit = (val: '50/50' | '60/40') => setState(prev => ({ ...prev, split: val }));
  const setIntakeStatus = (val: 'none' | 'existing') => setState(prev => ({ ...prev, intakeStatus: val }));
  const setExistingIntakeNfa = (val: number) => setState(prev => ({ ...prev, existingIntakeNfa: val }));
  const setSelectedExhaustId = (val: string) => setState(prev => ({ ...prev, selectedExhaustId: val }));
  const setAvailableRidgeLf = (val: number) => setState(prev => ({ ...prev, availableRidgeLf: val }));

  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    const draftsJson = localStorage.getItem('shingle_drafts');
    if (draftsJson) {
      try {
        setSavedDrafts(JSON.parse(draftsJson));
      } catch (e) {
        console.error('Failed to parse drafts', e);
      }
    }
  }, []);

  const handleSaveDraft = () => {
    const name = prompt("Enter a name for this estimate:", `Estimate ${new Date().toLocaleDateString()}`);
    if (!name) return;

    const newDraft: SavedDraft = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      data: {
        footprint,
        rule,
        split,
        intakeStatus,
        existingIntakeNfa,
        selectedExhaustId,
        availableRidgeLf
      }
    };

    const updatedDrafts = [newDraft, ...savedDrafts];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('shingle_drafts', JSON.stringify(updatedDrafts));
    setIsDirty(false);
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    setState(prev => ({
       ...prev,
       footprint: draft.data.footprint,
       rule: draft.data.rule,
       split: draft.data.split,
       intakeStatus: draft.data.intakeStatus,
       existingIntakeNfa: draft.data.existingIntakeNfa,
       selectedExhaustId: draft.data.selectedExhaustId || '',
       availableRidgeLf: draft.data.availableRidgeLf || 0
    }));
    setShowDrafts(false);
    setIsDirty(false);
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedDrafts = savedDrafts.filter(d => d.id !== id);
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('shingle_drafts', JSON.stringify(updatedDrafts));
  };

  const handleReset = () => {
    if (confirm("Reset all inputs to default?")) {
      setState(prev => ({
        ...prev,
        ...DEFAULT_STATE
      }));
      setIsDirty(false);
    }
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    const timestamp = new Date().toLocaleString();
    const fileName = `${projectName || 'Estimate'}_Ventilation_Report_${new Date().getTime()}.pdf`;

    // Branding & Header
    doc.setFillColor(234, 88, 12); // orange-600
    doc.rect(0, 0, 210, 45, 'F');
    
    // Add Logo if exists
    let headerTextX = 20;
    if (companyLogo) {
      try {
        const img = new Image();
        img.src = companyLogo;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        const maxWidth = 50;
        const maxHeight = 30;
        let finalWidth = 30;
        let finalHeight = 30;

        if (img.complete && img.naturalWidth) {
          const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
          finalWidth = img.naturalWidth * ratio;
          finalHeight = img.naturalHeight * ratio;
        }

        doc.addImage(companyLogo, 'PNG', 15, (45 - finalHeight) / 2, finalWidth, finalHeight);
        headerTextX = 15 + finalWidth + 8; 
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
        headerTextX = 20;
      }
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), headerTextX, 22);
    
    if (projectName) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(projectName.toUpperCase(), headerTextX, 30);
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Report Date: ${timestamp}`, headerTextX, 38);
    
    // Section: Input Specs
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("ROOF SPECIFICATIONS", 20, 55);
    doc.line(20, 58, 190, 58);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Footprint Area:`, 25, 70);
    doc.setFont('helvetica', 'bold');
    doc.text(`${footprint} SQ FT`, 70, 70);

    doc.setFont('helvetica', 'normal');
    doc.text(`Venting Code:`, 25, 78);
    doc.setFont('helvetica', 'bold');
    doc.text(`1/${rule}`, 70, 78);

    doc.setFont('helvetica', 'normal');
    doc.text(`Design Balance:`, 25, 86);
    doc.setFont('helvetica', 'bold');
    doc.text(`${split} Split`, 70, 86);

    if (availableRidgeLf > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Available Ridge:`, 25, 94);
      doc.setFont('helvetica', 'bold');
      doc.text(`${availableRidgeLf} LF`, 70, 94);
    }

    const options = [
      { 
        id: '01', 
        name: "Ridge Vent (Standard)", 
        qty: stats.options.ridge11.isLimited ? `${stats.options.ridge11.val} LF (Capped)` : `${stats.options.ridge11.val} LF`, 
        spec: "11 NFA/LF" 
      },
      { 
        id: '02', 
        name: "Ridge Vent (High Flow)", 
        qty: stats.options.ridge18.isLimited ? `${stats.options.ridge18.val} LF (Capped)` : `${stats.options.ridge18.val} LF`, 
        spec: "18 NFA/LF" 
      },
      { id: '03', name: "Box Vents (Slant Back)", qty: `${stats.options.box50.val} EA`, spec: "50 NFA/EA" },
      { id: '04', name: "Turbines (12\" Whirly)", qty: `${stats.options.whirly12.val} EA`, spec: "200 NFA/EA" },
      { id: '05', name: "Turbines (14\" Whirly)", qty: `${stats.options.whirly14.val} EA`, spec: "274 NFA/EA" },
    ];

    if (intakeStatus === 'existing') {
      const calcAtticArea = lookupState?.calcAtticArea || footprint;
      const calcOverhang = lookupState?.calcOverhang || 0;
      const calcLength = lookupState?.calcLength || 0;
      const calcPanelNfa = lookupState?.calcPanelNfa || 0;
      const calcExposure = lookupState?.calcExposure || 0;

      const requiredIntakeNfa = Math.round((calcAtticArea / 300) * 144 / 2);
      const panelsNeeded = calcLength / (Math.max(calcExposure, 1) / 12);
      const nfaOfPanels = Math.round(panelsNeeded * calcPanelNfa * (calcOverhang / 12));
      const hasDeficit = nfaOfPanels < requiredIntakeNfa;

      // Draw Intake Calculation Utility Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("INTAKE CALCULATION UTILITY", 20, 105);
      doc.line(20, 108, 190, 108);

      doc.setFontSize(10);
      
      // Left Column Inputs
      doc.setFont('helvetica', 'normal');
      doc.text(`Attic Area:`, 25, 117);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calcAtticArea} SQ FT`, 60, 117);

      doc.setFont('helvetica', 'normal');
      doc.text(`Soffit Length:`, 25, 124);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calcLength} FT`, 60, 124);

      doc.setFont('helvetica', 'normal');
      doc.text(`Soffit Overhang:`, 25, 131);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calcOverhang} IN`, 60, 131);

      // Right Column Inputs
      doc.setFont('helvetica', 'normal');
      doc.text(`Panel NFA:`, 110, 117);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calcPanelNfa} SQ IN/LF`, 145, 117);

      doc.setFont('helvetica', 'normal');
      doc.text(`Exposure Length:`, 110, 124);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calcExposure} IN`, 145, 124);

      // Calculations Results Box
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 137, 170, 16, 'F');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`Required Intake NFA:`, 25, 143);
      doc.setFont('helvetica', 'bold');
      doc.text(`${requiredIntakeNfa} SQ IN`, 65, 143);

      doc.setFont('helvetica', 'normal');
      doc.text(`Actual Panel Intake NFA:`, 25, 149);
      doc.setFont('helvetica', 'bold');
      doc.text(`${nfaOfPanels} SQ IN`, 65, 149);

      // Adequacy Status text/badge inside the box
      if (!hasDeficit) {
        doc.setFillColor(240, 253, 244); // green-50
        doc.rect(115, 137, 75, 16, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(21, 128, 61); // green-700
        doc.text("ADEQUATE INTAKE", 120, 143);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(22, 101, 52); // green-805
        doc.text("Intake meets 1/300 code min.", 118, 149);
      } else {
        doc.setFillColor(254, 242, 242); // red-50
        doc.rect(115, 137, 75, 16, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(220, 38, 38); // red-600
        doc.text("DEFICIT DETECTED", 120, 143);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(153, 27, 27); // red-800
        const deficitNfa = requiredIntakeNfa - nfaOfPanels;
        doc.text(`Deficit: ${deficitNfa} SQ IN. Add intake.`, 118, 149);
      }
      doc.setTextColor(0, 0, 0);

      // Section: Targets
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("CALCULATION TARGETS", 20, 165);
      doc.line(20, 168, 190, 168);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total NFA Needed:`, 25, 178);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(stats.totalNfaNeeded)} SQ IN`, 70, 178);

      doc.setFont('helvetica', 'normal');
      doc.text(`Intake Target:`, 25, 186);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(stats.balancedTarget)} SQ IN`, 70, 186);

      // Footer Page 1
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(`${companyName} - Page 1 of 2. For internal use only.`, 20, 282);

      // Start Page 2
      doc.addPage();

      // Draw Top decorative band on Page 2
      doc.setFillColor(234, 88, 12); // orange-600
      doc.rect(0, 0, 210, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("VENTILATION SOLUTIONS & EXHAUST SELECTION", 20, 10);
      doc.setTextColor(0, 0, 0);

      // Section: Solutions
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("RECOMMENDED SOLUTIONS", 20, 30);
      doc.line(20, 33, 190, 33);

      // Intake Result
      doc.setFontSize(12);
      doc.text("Intake (Lower Roof / Eaves)", 25, 45);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`- Existing Intake Measured: ${existingIntakeNfa} SQ IN`, 30, 53);
      if (stats.intakeDeficit > 0) {
          doc.setTextColor(220, 38, 38); // red-600
          doc.text(`- DEFICIT DETECTED: +${stats.additionalEdgeVentLf} LF additional Edge Vent recommended`, 30, 58);
          doc.setTextColor(0, 0, 0);
      } else {
          doc.setTextColor(22, 163, 74); // green-600
          doc.text("- Existing intake is sufficient for target balance", 30, 58);
          doc.setTextColor(0, 0, 0);
      }

      // Exhaust Result
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Exhaust Selection Matrix", 25, 74);
      
      // Matrix Table
      const tableHeaderY = 82;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("SYSTEM TYPE", 25, tableHeaderY);
      doc.text("QUANTITY", 100, tableHeaderY);
      doc.text("SPECIFICATION", 150, tableHeaderY);
      doc.line(25, tableHeaderY + 2, 185, tableHeaderY + 2);

      const tableStartY = tableHeaderY + 10;
      options.forEach((opt, idx) => {
        const rowY = tableStartY + (idx * 12);
        const isSelected = selectedExhaustId === opt.id;
        
        if (isSelected) {
          doc.setFillColor(255, 247, 237); // orange-50
          doc.rect(20, rowY - 8, 170, 12, 'F');
          doc.setTextColor(194, 65, 12); // orange-700
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.setFont('helvetica', isSelected ? 'bold' : 'normal');
        doc.text(opt.name, 25, rowY);
        doc.text(opt.qty, 100, rowY);
        doc.text(opt.spec, 150, rowY);
      });

      doc.setTextColor(0, 0, 0);
      if (availableRidgeLf > 0 && (selectedExhaustId === '01' || selectedExhaustId === '02')) {
        const selectedOpt = selectedExhaustId === '01' ? stats.options.ridge11 : stats.options.ridge18;
        if (selectedOpt.isLimited) {
          doc.setFillColor(254, 243, 199); // amber-100
          doc.rect(20, 148, 170, 8, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(146, 64, 14); // amber-800
          doc.text("RIDGE CONSTRAINT:", 23, 153);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 53, 4); // amber-900
          doc.text(`Perfect balance requires ${selectedOpt.balancedRequired} LF. Capped to available ${availableRidgeLf} LF. Code min: ${selectedOpt.minRequired} LF.`, 54, 153);
        } else {
          doc.setFillColor(240, 253, 244); // green-50
          doc.rect(20, 148, 170, 8, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(21, 128, 61); // green-700
          doc.text("RIDGE VERIFIED:", 23, 153);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(22, 101, 52); // green-800
          doc.text(`Required ${selectedOpt.balancedRequired} LF fits within available ${availableRidgeLf} LF of physical ridge. Code min: ${selectedOpt.minRequired} LF.`, 51, 153);
        }
      }

      // Footer Disclaimer Page 2
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${companyName} - Page 2 of 2. For internal use only.`, 20, 280);
      doc.text("Calculated values are estimates based on provided inputs. Final material counts should be verified against field measurements.", 20, 285);

    } else {
      // Original 1-page design when intakeStatus === 'none'
      // Section: Targets
      doc.setFontSize(14);
      doc.text("CALCULATION TARGETS", 20, 105);
      doc.line(20, 108, 190, 108);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total NFA Needed:`, 25, 120);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(stats.totalNfaNeeded)} SQ IN`, 70, 120);

      doc.setFont('helvetica', 'normal');
      doc.text(`Intake Target:`, 25, 128);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(stats.balancedTarget)} SQ IN`, 70, 128);

      // Section: Solutions
      doc.setFontSize(14);
      doc.text("RECOMMENDED SOLUTIONS", 20, 145);
      doc.line(20, 148, 190, 148);

      // Intake Result
      doc.setFontSize(12);
      doc.text("Intake (Lower Roof / Eaves)", 25, 160);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`- Edge Vent Required: ${Math.ceil(stats.totalEdgeVentLf)} Linear Feet`, 30, 168);
      doc.text(`  (${Math.ceil(stats.ventilationLfNeeded)} LF active venting + ${stats.taperLf} LF taper)`, 30, 173);
      doc.text(`- Standard Stocking: ${stats.edgeVentSticks} Sticks (4 LF ea)`, 30, 178);

      // Exhaust Result
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Exhaust Selection Matrix", 25, 195);
      
      // Matrix Table
      const tableHeaderY = 205;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("SYSTEM TYPE", 25, tableHeaderY);
      doc.text("QUANTITY", 100, tableHeaderY);
      doc.text("SPECIFICATION", 150, tableHeaderY);
      doc.line(25, tableHeaderY + 2, 185, tableHeaderY + 2);

      const tableStartY = tableHeaderY + 10;
      options.forEach((opt, idx) => {
        const rowY = tableStartY + (idx * 12);
        const isSelected = selectedExhaustId === opt.id;
        
        if (isSelected) {
          doc.setFillColor(255, 247, 237); // orange-50
          doc.rect(20, rowY - 8, 170, 12, 'F');
          doc.setTextColor(194, 65, 12); // orange-700
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.setFont('helvetica', isSelected ? 'bold' : 'normal');
        doc.text(opt.name, 25, rowY);
        doc.text(opt.qty, 100, rowY);
        doc.text(opt.spec, 150, rowY);
      });

      if (availableRidgeLf > 0 && (selectedExhaustId === '01' || selectedExhaustId === '02')) {
        const selectedOpt = selectedExhaustId === '01' ? stats.options.ridge11 : stats.options.ridge18;
        if (selectedOpt.isLimited) {
          doc.setFillColor(254, 243, 199); // amber-100
          doc.rect(20, 269, 170, 8, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(146, 64, 14); // amber-800
          doc.text("RIDGE CONSTRAINT:", 23, 274);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 53, 4); // amber-900
          doc.text(`Perfect balance requires ${selectedOpt.balancedRequired} LF. Capped to available ${availableRidgeLf} LF. Code min: ${selectedOpt.minRequired} LF.`, 54, 274);
        } else {
          doc.setFillColor(240, 253, 244); // green-50
          doc.rect(20, 269, 170, 8, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(21, 128, 61); // green-700
          doc.text("RIDGE VERIFIED:", 23, 274);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(22, 101, 52); // green-805
          doc.text(`Required ${selectedOpt.balancedRequired} LF fits within available ${availableRidgeLf} LF of physical ridge. Code min: ${selectedOpt.minRequired} LF.`, 51, 274);
        }
      }

      // Footer Disclaimer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${companyName} - For internal use only.`, 20, 280);
      doc.text("Calculated values are estimates based on provided inputs. Final material counts should be verified against field measurements.", 20, 285);
    }

    doc.save(fileName);
  };

  const stats = useMemo(() => {
    const totalNfaNeeded = (footprint / rule) * 144;
    const exhaustPercent = split === '50/50' ? 0.5 : 0.4;
    const balancedTarget = totalNfaNeeded * (1 - exhaustPercent); // Intake target
    const exhaustTarget = totalNfaNeeded * exhaustPercent; // Exhaust target
    
    // Intake (Edge Vent)
    // 9 NFA per LF
    const ventilationLfNeeded = balancedTarget / 9;
    const taperLf = 8; // User specified 8 LF for two sections
    const totalEdgeVentLf = ventilationLfNeeded + taperLf;
    const edgeVentSticks = Math.ceil(totalEdgeVentLf / 4);

    // Intake Deficit Check
    const existingIntake = intakeStatus === 'existing' ? (existingIntakeNfa || 0) : 0;
    const intakeDeficit = balancedTarget - existingIntake;
    const additionalEdgeVentLf = intakeDeficit > 0 ? Math.ceil(intakeDeficit / 9) : 0;
    const actualAdditionalNfa = additionalEdgeVentLf * 9;
    
    // NEW New intake basis (what we actually have + what we're adding)
    const totalIntakeBasis = intakeStatus === 'none' 
      ? Math.ceil(ventilationLfNeeded) * 9 
      : (existingIntake + actualAdditionalNfa);

    // Exhaust Target: Match balance ratio based on actual intake provided
    // If 50/50, match intake. If 60/40, exhaust is 40/60 of intake (0.66x)
    const currentExhaustTarget = split === '50/50' ? totalIntakeBasis : (totalIntakeBasis * (40/60));

    // Helper to build a complete option details object
    const buildRidgeOption = (spec: 11 | 18) => {
      const minRequired = Math.floor(exhaustTarget / spec);
      const balancedRequired = Math.floor(currentExhaustTarget / spec);
      
      const isLimited = availableRidgeLf > 0 && balancedRequired > availableRidgeLf;
      const finalQty = isLimited ? availableRidgeLf : balancedRequired;
      const nfaProvided = finalQty * spec;
      
      // Validation against code minimum
      const ratio = nfaProvided / totalNfaNeeded;
      const isValid = ratio >= (exhaustPercent - 0.05);
      const reason = isValid ? undefined : `Insufficient Exhaust (<${exhaustPercent * 100}%)`;

      return {
        val: finalQty,
        minRequired,
        balancedRequired,
        isLimited,
        nfaProvided,
        valid: isValid,
        reason,
        spec
      };
    };

    const buildStaticOption = (spec: 50 | 200 | 274) => {
      const balancedRequired = Math.floor(currentExhaustTarget / spec);
      const nfaProvided = balancedRequired * spec;
      
      const ratio = nfaProvided / totalNfaNeeded;
      const isValid = ratio >= (exhaustPercent - 0.05);
      const reason = isValid ? undefined : `Insufficient Exhaust (<${exhaustPercent * 100}%)`;

      return {
        val: balancedRequired,
        balancedRequired,
        nfaProvided,
        valid: isValid,
        reason,
        spec
      };
    };

    const options = {
      ridge11: buildRidgeOption(11),
      ridge18: buildRidgeOption(18),
      box50: buildStaticOption(50),
      whirly12: buildStaticOption(200),
      whirly14: buildStaticOption(274),
    };

    // Recovery Calculations based on selected split
    const exhaustMultiplier = split === '50/50' ? 1.0 : (40/60);
    const rawRecoveryRidge11 = Math.floor((totalIntakeBasis * exhaustMultiplier) / 11);
    const rawRecoveryRidge18 = Math.floor((totalIntakeBasis * exhaustMultiplier) / 18);

    const recoveryExhaust = {
      ridge11: (availableRidgeLf > 0 && rawRecoveryRidge11 > availableRidgeLf) ? availableRidgeLf : rawRecoveryRidge11,
      ridge18: (availableRidgeLf > 0 && rawRecoveryRidge18 > availableRidgeLf) ? availableRidgeLf : rawRecoveryRidge18,
      box50: Math.floor((totalIntakeBasis * exhaustMultiplier) / 50),
    };
    
    // Base targets (Existing Intake Only)
    const baseExhaust = {
      ridge11: Math.floor((existingIntake * exhaustMultiplier) / 11),
      ridge18: Math.floor((existingIntake * exhaustMultiplier) / 18),
      box50: Math.floor((existingIntake * exhaustMultiplier) / 50),
    };

    return {
      totalNfaNeeded,
      balancedTarget,
      exhaustTarget,
      ventilationLfNeeded,
      taperLf,
      totalEdgeVentLf,
      edgeVentSticks,
      options,
      recoveryExhaust,
      baseExhaust,
      intakeDeficit,
      additionalEdgeVentLf,
      totalIntakeBasis
    };
  }, [footprint, rule, split, intakeStatus, existingIntakeNfa, availableRidgeLf]);

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Left Column: Inputs & Target Summary */}
      <section className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <h3 className="text-xs font-display font-bold text-zinc-500 uppercase mb-5 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Roof Specifications
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-2 uppercase tracking-tighter">Footprint Area (SQ FT)</label>
              <input 
                type="number" 
                value={footprint}
                onChange={(e) => setFootprint(Number(e.target.value))}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            
            <div>
              <label className="flex items-center text-[11px] font-bold text-zinc-600 mb-2 uppercase tracking-tighter">
                Venting Rule
                <Tooltip content="FHA standard says 1/300. Use 1/150 for balanced systems with high heat loads or low slope." />
              </label>
              <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-1 rounded-lg">
                <button 
                  onClick={() => setRule(300)}
                  className={`py-2 text-[11px] font-bold rounded transition-all ${rule === 300 ? 'bg-white shadow-sm text-orange-700' : 'text-zinc-500'}`}
                >
                  1/300 (STD)
                </button>
                <button 
                  onClick={() => setRule(150)}
                  className={`py-2 text-[11px] font-bold rounded transition-all ${rule === 150 ? 'bg-white shadow-sm text-orange-700' : 'text-zinc-500'}`}
                >
                  1/150 (LOW)
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center text-[11px] font-bold text-zinc-600 mb-2 uppercase tracking-tighter">
                Exhaust Split
                <Tooltip content="Specifies the ratio of Intake to Exhaust. 50/50 is the gold standard for perfect balance." />
              </label>
              <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-1 rounded-lg">
                <button 
                  onClick={() => setSplit('50/50')}
                  className={`py-2 text-[11px] font-bold rounded transition-all ${split === '50/50' ? 'bg-white shadow-sm text-orange-700' : 'text-zinc-500'}`}
                >
                  50/50 Balanced
                </button>
                <button 
                  onClick={() => setSplit('60/40')}
                  className={`py-2 text-[11px] font-bold rounded transition-all ${split === '60/40' ? 'bg-white shadow-sm text-orange-700' : 'text-zinc-500'}`}
                >
                  60/40 Intake
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-2 uppercase tracking-tighter">Intake Status</label>
              <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-1 rounded-lg">
                <button 
                  onClick={() => setIntakeStatus('none')}
                  className={`py-2 text-[11px] font-bold rounded transition-all ${intakeStatus === 'none' ? 'bg-white shadow-sm text-orange-700' : 'text-zinc-500'}`}
                >
                  NO INTAKE
                </button>
                <button 
                  onClick={() => setIntakeStatus('existing')}
                  className={`py-2 text-[11px] font-bold rounded transition-all ${intakeStatus === 'existing' ? 'bg-white shadow-sm text-orange-700' : 'text-zinc-500'}`}
                >
                  HAS INTAKE
                </button>
              </div>
            </div>

            {intakeStatus === 'existing' && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                <label className="block text-[11px] font-bold text-zinc-600 mb-2 uppercase tracking-tighter">Existing Intake (SQ IN)</label>
                <input 
                  type="number" 
                  value={existingIntakeNfa === 0 ? '' : existingIntakeNfa}
                  onChange={(e) => setExistingIntakeNfa(Number(e.target.value))}
                  placeholder="Enter NFA..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-zinc-800 placeholder:text-zinc-300"
                />
              </div>
            )}

            <div>
              <label className="flex items-center text-[11px] font-bold text-zinc-600 mb-2 uppercase tracking-tighter">
                Available Ridge (LF)
                <Tooltip content="Physical length of highest ridge available. If the required length for excessive intake exceeds this, we will max out the installation to this length and verify against code maximums." />
              </label>
              <input 
                type="number" 
                value={availableRidgeLf === 0 ? '' : availableRidgeLf}
                onChange={(e) => setAvailableRidgeLf(Number(e.target.value))}
                placeholder="Optional (e.g. 55)..."
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-zinc-800 placeholder:text-zinc-300"
              />
            </div>
          </div>
        </div>

        {/* Target Summary Dark Card */}
        <div className="bg-orange-950 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-500">
            <Wind size={80} />
          </div>
          <h3 className="text-[10px] font-bold text-orange-300 uppercase mb-4 tracking-widest relative z-10">Target Summary</h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end border-b border-orange-900 pb-2">
              <span className="text-[11px] font-medium text-orange-400">Total NFA Needed</span>
              <span className="text-xl font-mono font-bold tracking-tighter">{Math.round(stats.totalNfaNeeded).toLocaleString()} <span className="text-[10px] font-normal uppercase opacity-60">SQ IN</span></span>
            </div>
            <div className="flex justify-between items-end border-b border-orange-900 pb-2">
              <span className="text-[11px] font-medium text-orange-400">Intake Target ({100 - (split === '50/50' ? 50 : 40)}%)</span>
              <span className="text-xl font-mono font-bold tracking-tighter">{Math.round(stats.balancedTarget).toLocaleString()} <span className="text-[10px] font-normal uppercase opacity-60">SQ IN</span></span>
            </div>
            
            <div className="mt-6 bg-orange-900/50 rounded-xl p-4 border border-orange-800 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Edge Vent Input</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${intakeStatus === 'none' ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                  {intakeStatus === 'none' ? 'REQUIRED' : 'SKIPPED'}
                </span>
              </div>
              {intakeStatus === 'none' ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black tracking-tighter">{Math.ceil(stats.totalEdgeVentLf)}</span>
                    <span className="text-xs font-bold text-orange-400 uppercase">Total LF</span>
                  </div>
                  <p className="text-[10px] text-orange-300 mt-2 font-medium italic">
                    {Math.ceil(stats.ventilationLfNeeded)} LF Ventilation + {stats.taperLf} LF Taper. Use {stats.edgeVentSticks} sticks (4 LF).
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-orange-400/80 leading-relaxed">
                    System utilizing measured {existingIntakeNfa} SQ IN intake area.
                  </p>
                  {stats.intakeDeficit > 0 && (
                    <div className="pt-3 border-t border-orange-800 flex items-start gap-3">
                      <AlertCircle size={14} className="text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Intake Deficit Flag</p>
                        <p className="text-[11px] text-white/90 leading-snug mt-1">
                          Deficit: {Math.ceil(stats.intakeDeficit)} SQ IN. Install <span className="font-mono font-bold text-orange-300">{stats.additionalEdgeVentLf} LF</span> more Edge Vent to achieve target.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Results Matrix */}
      <section className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm border border-zinc-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white">
          <h3 className="text-xs font-display font-black text-zinc-500 uppercase tracking-widest">Exhaust Solution Matrix</h3>
          <p className="text-[10px] text-zinc-400 italic">Choose one based on ridge availability</p>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-6 bg-zinc-50/20">
          {intakeStatus === 'existing' && stats.intakeDeficit > 0 && (
            <div className="bg-white p-6 rounded-xl border-2 border-orange-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-orange-500" />
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recommended Recovery Action</h4>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-orange-900 uppercase tracking-tight">Supplemental Intake Required</p>
                  <p className="text-[10px] text-orange-800 font-medium">Add Edge Vent to resolve ventilation deficit and enable full exhaust potential.</p>
                </div>
                <div className="text-center px-6 py-2 bg-white rounded-lg border border-orange-200 shadow-sm whitespace-nowrap">
                  <p className="text-[10px] font-black text-orange-400 uppercase mb-1">ADDITIONAL</p>
                  <p className="text-2xl font-mono font-black text-orange-700">+{stats.additionalEdgeVentLf} LF</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <CompactValue label="Ridge 11" value={stats.recoveryExhaust.ridge11} unit="LF" />
                <CompactValue label="Ridge 18" value={stats.recoveryExhaust.ridge18} unit="LF" />
                <CompactValue label="Box 50" value={stats.recoveryExhaust.box50} unit="EA" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MatrixOption 
              id="01" 
              label="Ridge Vent (Standard)" 
              spec="11 NFA / LF" 
              value={stats.options.ridge11.val} 
              unit="LIN. FT" 
              note="Lomanco LOM30 (30' Rolls)" 
              desc="Low profile shingle-over vent."
              pro
              valid={stats.options.ridge11.valid}
              reason={stats.options.ridge11.reason}
              selected={selectedExhaustId === '01'}
              onClick={() => stats.options.ridge11.val > 0 && setSelectedExhaustId(selectedExhaustId === '01' ? '' : '01')}
              isLimited={stats.options.ridge11.isLimited}
              balancedRequired={stats.options.ridge11.balancedRequired}
              minRequired={stats.options.ridge11.minRequired}
              availableRidgeLf={availableRidgeLf}
            />
            <MatrixOption 
              id="02" 
              label="Ridge Vent (High Flow)" 
              spec="18 NFA / LF" 
              value={stats.options.ridge18.val} 
              unit="LIN. FT" 
              note="Lomanco LOM20 (20' Rolls)" 
              desc="Max airflow for steep pitch."
              valid={stats.options.ridge18.valid}
              reason={stats.options.ridge18.reason}
              selected={selectedExhaustId === '02'}
              onClick={() => stats.options.ridge18.val > 0 && setSelectedExhaustId(selectedExhaustId === '02' ? '' : '02')}
              isLimited={stats.options.ridge18.isLimited}
              balancedRequired={stats.options.ridge18.balancedRequired}
              minRequired={stats.options.ridge18.minRequired}
              availableRidgeLf={availableRidgeLf}
            />
            <MatrixOption 
              id="03" 
              label="Box Vents / Slant Back" 
              spec="50 NFA / EA" 
              value={stats.options.box50.val} 
              unit="UNITS" 
              note="Space 8-10' apart per code" 
              desc="Static exhaust for non-ridge areas."
              valid={stats.options.box50.valid}
              reason={stats.options.box50.reason}
              selected={selectedExhaustId === '03'}
              onClick={() => stats.options.box50.val > 0 && setSelectedExhaustId(selectedExhaustId === '03' ? '' : '03')}
            />
            <MatrixOption 
              id="04" 
              label='12" Turbine (Whirlybird)' 
              spec="200 NFA / EA" 
              value={stats.options.whirly12.val} 
              unit="UNITS" 
              note="Wind-driven active aspiration" 
              desc="Best for maximum heat evacuation."
              valid={stats.options.whirly12.valid}
              reason={stats.options.whirly12.reason}
              selected={selectedExhaustId === '04'}
              onClick={() => stats.options.whirly12.val > 0 && setSelectedExhaustId(selectedExhaustId === '04' ? '' : '04')}
            />
            <MatrixOption 
              id="05" 
              label='14" Turbine (Whirlybird)' 
              spec="274 NFA / EA" 
              value={stats.options.whirly14.val} 
              unit="UNITS" 
              note="Maximum Extraction" 
              desc="Largest residential turbine available."
              valid={stats.options.whirly14.valid}
              reason={stats.options.whirly14.reason}
              selected={selectedExhaustId === '05'}
              onClick={() => stats.options.whirly14.val > 0 && setSelectedExhaustId(selectedExhaustId === '05' ? '' : '05')}
            />
          </div>

          {intakeStatus === 'existing' && stats.intakeDeficit <= 0 && (
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 border-dashed animate-in fade-in">
              <div className="flex items-center gap-2 mb-2">
                 <CheckCircle2 size={16} className="text-emerald-500" />
                 <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Intake System Verified</h4>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                The existing {existingIntakeNfa} SQ IN of intake is sufficient to support the calculated exhaust systems above. No supplemental intake is required for this balance.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              <span className="text-[10px] text-white font-bold tracking-widest">
                {isDirty ? 'UNSAVED CHANGES' : 'ALL CHANGES SAVED'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black hidden md:inline">CODE: SHV-{footprint}-{rule}-{intakeStatus === 'none' ? 'NI' : 'HI'}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDrafts(!showDrafts)}
              className={`px-3 py-1 text-[10px] font-black rounded flex items-center gap-2 transition-all ${showDrafts ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              <History size={12} />
              {savedDrafts.length > 0 ? `HISTORY (${savedDrafts.length})` : 'HISTORY'}
            </button>
            <button 
              onClick={handleReset}
              className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-black rounded hover:text-white flex items-center gap-2 transition-colors"
            >
              <RotateCcw size={12} />
              RESET
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-3 py-1 bg-zinc-800 text-zinc-100 text-[10px] font-black rounded hover:bg-zinc-700 flex items-center gap-2 transition-colors"
            >
              <FileDown size={12} />
              EXPORT PDF
            </button>
            <button 
              onClick={handleSaveDraft}
              className="px-3 py-1 bg-orange-600 text-white text-[10px] font-black rounded hover:bg-orange-700 flex items-center gap-2 transition-colors"
            >
              <Save size={12} />
              SAVE DRAFT
            </button>
          </div>
        </div>

        {/* History / Drafts Overlay */}
        {showDrafts && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-8 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-8 border-b border-zinc-200 pb-4">
                <div>
                <h2 className="text-2xl font-display font-black text-zinc-900 tracking-tight">Saved Estimates</h2>
                  <p className="text-sm text-zinc-500">Resume previous work or refer to historic field data</p>
                </div>
                <button 
                  onClick={() => setShowDrafts(false)}
                  className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {savedDrafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <History size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">No saved drafts yet</p>
                  <p className="text-xs">Your saved ventilation estimates will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedDrafts.map((draft) => (
                    <div 
                      key={draft.id}
                      onClick={() => handleLoadDraft(draft)}
                      className="group p-5 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-orange-500 hover:bg-white hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                             <Calculator size={16} />
                           </div>
                           <div>
                             <h4 className="font-bold text-zinc-900 truncate max-w-[180px]">{draft.name}</h4>
                             <p className="text-[10px] text-zinc-500 font-mono">
                               {new Date(draft.timestamp).toLocaleString()}
                             </p>
                           </div>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          className="p-2 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/50 p-2 rounded border border-zinc-100">
                          <p className="text-[9px] font-black text-zinc-400 uppercase">SQ FT</p>
                          <p className="text-xs font-mono font-bold text-zinc-700">{draft.data.footprint}</p>
                        </div>
                        <div className="bg-white/50 p-2 rounded border border-zinc-100">
                          <p className="text-[9px] font-black text-zinc-400 uppercase">RULE</p>
                          <p className="text-xs font-mono font-bold text-zinc-700">1/{draft.data.rule}</p>
                        </div>
                        <div className="bg-white/50 p-2 rounded border border-zinc-100">
                          <p className="text-[9px] font-black text-zinc-400 uppercase">INTAKE</p>
                          <p className="text-xs font-mono font-bold text-zinc-700 truncate">{draft.data.intakeStatus === 'none' ? 'NONE' : `${draft.data.existingIntakeNfa} IN`}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function MatrixOption({ 
  id, 
  label, 
  spec, 
  value, 
  unit, 
  note, 
  desc, 
  pro = false, 
  valid = true, 
  reason, 
  selected, 
  onClick,
  isLimited = false,
  balancedRequired,
  minRequired,
  availableRidgeLf = 0
}: { 
  id: string, 
  label: string, 
  spec: string, 
  value: number, 
  unit: string, 
  note: string, 
  desc: string, 
  pro?: boolean, 
  valid?: boolean, 
  reason?: string, 
  selected?: boolean, 
  onClick?: () => void,
  isLimited?: boolean,
  balancedRequired?: number,
  minRequired?: number,
  availableRidgeLf?: number
}) {
  return (
    <button 
      onClick={onClick}
      className={`text-left group border-2 rounded-xl p-5 transition-all duration-300 relative ${!valid ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] cursor-pointer'} ${selected ? 'border-orange-600 bg-orange-50/80 shadow-lg shadow-orange-100 ring-2 ring-orange-500/20' : pro ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-zinc-100 hover:border-orange-200 shadow-sm'}`}
    >
      {!valid && (
        <div className="absolute inset-0 bg-red-50/60 z-10 rounded-xl flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="text-red-600 mb-2" size={24} />
          <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">{reason || 'OPTION BLOCKED'}</p>
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-tighter ${selected ? 'bg-orange-600 text-white' : pro ? 'bg-orange-200 text-orange-800' : 'bg-zinc-100 text-zinc-400'}`}>
          {selected ? 'SELECTED SYSTEM' : pro ? 'PRO CHOICE' : `OPT ${id}`}
        </span>
        <span className={`text-[10px] font-bold ${selected ? 'text-orange-700' : pro ? 'text-orange-600' : 'text-zinc-400'}`}>{spec}</span>
      </div>
      <h4 className="text-sm font-bold text-zinc-800 leading-tight">{label}</h4>
      <p className="text-[11px] text-zinc-500 mt-1 mb-6 leading-snug">{desc}</p>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-mono font-black tracking-tighter ${pro ? 'text-orange-700' : 'text-zinc-700 group-hover:text-orange-700'}`}>
          {value}
        </span>
        <span className="text-xs font-bold text-zinc-400 pb-1.5 uppercase">{unit}</span>
      </div>
      <p className={`text-[9px] mt-4 uppercase font-black tracking-widest ${pro ? 'text-orange-600' : 'text-zinc-300 group-hover:text-zinc-400'}`}>
        {note}
      </p>

      {isLimited && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-lg p-2.5 text-[10px] leading-normal font-semibold">
          <div className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
            <AlertCircle size={12} className="shrink-0 text-amber-600" /> Maxed Out to Available Physical Ridge ({value} LF)
          </div>
          Perfect balance requires <span className="font-mono font-bold text-amber-950">{balancedRequired} LF</span>. 
          Code minimum is <span className="font-mono font-bold text-amber-950">{minRequired} LF</span>.
        </div>
      )}
      {!isLimited && availableRidgeLf > 0 && (label.toLowerCase().includes('ridge')) && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-lg p-2.5 text-[10px] leading-normal font-semibold">
           <div className="font-bold flex items-center gap-1 text-emerald-950 mb-0.5">
             <CheckCircle2 size={12} className="shrink-0 text-emerald-600" /> Fits Available Ridge ({availableRidgeLf} LF)
           </div>
           Installing perfectly balanced {value} LF (Code minimum {minRequired} LF).
        </div>
      )}
    </button>
  );
}

function CompactValue({ label, value, unit }: { label: string, value: number, unit: string }) {
  return (
    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 group hover:border-orange-200 transition-colors">
      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1 tracking-tighter">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-mono font-bold text-zinc-800 group-hover:text-orange-700">{value}</span>
        <span className="text-[10px] font-bold text-zinc-400 uppercase">{unit}</span>
      </div>
    </div>
  );
}

