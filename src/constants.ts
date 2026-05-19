/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Screen = 'shingle' | 'metal' | 'lookup' | 'settings';

export interface IntakeProfile {
  name: string;
  nfa: number;
}

export const INTAKE_PROFILES: IntakeProfile[] = [
  { name: 'Gibraltar 2.75" x 96" Louvered Strip', nfa: 9.0 },
  { name: 'Air Vent Inc Continuous Soffit', nfa: 9.0 },
  { name: 'Rollex Lanced Vented (12")', nfa: 9.72 },
  { name: 'Rollex Lanced Vented (16")', nfa: 12.96 },
  { name: 'LP® SmartSide® Vented Soffit', nfa: 10.0 },
  { name: 'Rollex Center Vented (16")', nfa: 6.48 },
  { name: 'Certainteed Triple 4" Fully Vented', nfa: 5.9 },
  { name: 'Certainteed Double 5" Fully Vented', nfa: 6.4 },
  { name: 'HardieSoffit Continuous', nfa: 5.0 },
  { name: 'Hardie VentSoft Lanced', nfa: 5.0 },
  { name: 'Rollex Center Vented (12")', nfa: 3.24 },
  { name: 'Certainteed Triple 4" Center Vented', nfa: 2.0 },
  { name: 'Gibraltar 2.75" x 2.5" Rectangular (8 LF)', nfa: 8.5 },
  { name: 'Gibraltar 16" x 7" Rectangular', nfa: 56.0 },
  { name: 'Gibraltar 16" x 5" Rectangular', nfa: 42.0 },
  { name: 'Gibraltar 16" x 3" Rectangular', nfa: 28.0 },
  { name: 'Master Flow 2" Circular Mini', nfa: 1.5 },
];

export const METAL_PROFILES = [
  { id: 'pbr', name: 'PBR / TuffRib' },
  { id: 'standing_seam', name: 'Standing Seam' },
  { id: 'mechanical_lock', name: 'Mechanical Lock' },
];
