import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type AccentColor = 
  | 'caramel' | 'purple' | 'blue' | 'green' | 'orange' | 'pink' 
  | 'red' | 'yellow' | 'teal' | 'indigo' | 'rose' | 'cyan'
  | 'lime' | 'amber' | 'violet' | 'emerald' | 'fuchsia' | 'sky' 
  | 'slate' | 'stone' | 'crimson' | 'coral' | 'lavender' | 'mint'
  | 'peach' | 'navy' | 'burgundy' | 'gold' | 'chocolate' | 'olive'

interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight?: string
  accent: string
  background: string
  surface: string
  border: string
  text: string
  textSecondary: string
}

const colorSchemes: Record<AccentColor, { light: ThemeColors; dark: ThemeColors }> = {
  caramel: {
    light: {
      primary: '#8B5A3C',
      primaryLight: '#A0653E',
      primaryDark: '#6B4423',
      secondaryLight: '#F5B342',
      secondaryLight: '#F7C563',
      accent: '#E89F3C',
      background: 'linear-gradient(to bottom right, #E8C896, #D4A574, #C9A05F)',
      surface: '#F5E6D3',
      border: '#B8925A',
      text: '#8B5A3C',
      textsecondaryLight: '#A0653E',
    },
    dark: {
      primary: '#D4A574',
      primaryLight: '#E8C896',
      primaryDark: '#8B5A3C',
      secondaryLight: '#F5B342',
      secondaryLight: '#F7C563',
      accent: '#E89F3C',
      background: 'linear-gradient(to bottom right, #1a1410, #2d1f16, #3d2a1c)',
      surface: '#2d1f16',
      border: '#6B4423',
      text: '#E8C896',
      textsecondaryLight: '#B8925A',
    },
  },
  purple: {
    light: {
      primary: '#9333EA',
      primaryLight: '#A855F7',
      primaryDark: '#7E22CE',
      secondaryLight: '#C084FC',
      secondaryLight: '#D8B4FE',
      accent: '#A78BFA',
      background: 'linear-gradient(to bottom right, #FAF5FF, #F3E8FF, #E9D5FF)',
      surface: '#FAF5FF',
      border: '#C084FC',
      text: '#7E22CE',
      textsecondaryLight: '#9333EA',
    },
    dark: {
      primary: '#A855F7',
      primaryLight: '#C084FC',
      primaryDark: '#7E22CE',
      secondaryLight: '#C084FC',
      secondaryLight: '#D8B4FE',
      accent: '#A78BFA',
      background: 'linear-gradient(to bottom right, #1a0b2e, #2d1458, #3d1a6f)',
      surface: '#2d1458',
      border: '#7E22CE',
      text: '#E9D5FF',
      textsecondaryLight: '#C084FC',
    },
  },
  blue: {
    light: {
      primary: '#2563EB',
      primaryLight: '#3B82F6',
      primaryDark: '#1E40AF',
      secondaryLight: '#60A5FA',
      secondaryLight: '#93C5FD',
      accent: '#93C5FD',
      background: 'linear-gradient(to bottom right, #EFF6FF, #DBEAFE, #BFDBFE)',
      surface: '#EFF6FF',
      border: '#60A5FA',
      text: '#1E40AF',
      textsecondaryLight: '#2563EB',
    },
    dark: {
      primary: '#3B82F6',
      primaryLight: '#60A5FA',
      primaryDark: '#1E40AF',
      secondaryLight: '#60A5FA',
      secondaryLight: '#93C5FD',
      accent: '#93C5FD',
      background: 'linear-gradient(to bottom right, #0a1628, #1e3a5f, #1e40af)',
      surface: '#1e3a5f',
      border: '#1E40AF',
      text: '#BFDBFE',
      textsecondaryLight: '#60A5FA',
    },
  },
  green: {
    light: {
      primary: '#16A34A',
      primaryLight: '#22C55E',
      primaryDark: '#15803D',
      secondaryLight: '#4ADE80',
      secondaryLight: '#86EFAC',
      accent: '#86EFAC',
      background: 'linear-gradient(to bottom right, #F0FDF4, #DCFCE7, #BBF7D0)',
      surface: '#F0FDF4',
      border: '#4ADE80',
      text: '#15803D',
      textsecondaryLight: '#16A34A',
    },
    dark: {
      primary: '#22C55E',
      primaryLight: '#4ADE80',
      primaryDark: '#15803D',
      secondaryLight: '#4ADE80',
      secondaryLight: '#86EFAC',
      accent: '#86EFAC',
      background: 'linear-gradient(to bottom right, #0a1f0f, #14532d, #166534)',
      surface: '#14532d',
      border: '#15803D',
      text: '#BBF7D0',
      textsecondaryLight: '#4ADE80',
    },
  },
  orange: {
    light: {
      primary: '#EA580C',
      primaryLight: '#F97316',
      primaryDark: '#C2410C',
      secondaryLight: '#FB923C',
      secondaryLight: '#FDBA74',
      accent: '#FDBA74',
      background: 'linear-gradient(to bottom right, #FFF7ED, #FFEDD5, #FED7AA)',
      surface: '#FFF7ED',
      border: '#FB923C',
      text: '#C2410C',
      textsecondaryLight: '#EA580C',
    },
    dark: {
      primary: '#F97316',
      primaryLight: '#FB923C',
      primaryDark: '#C2410C',
      secondaryLight: '#FB923C',
      secondaryLight: '#FDBA74',
      accent: '#FDBA74',
      background: 'linear-gradient(to bottom right, #1f1108, #431407, #7c2d12)',
      surface: '#431407',
      border: '#C2410C',
      text: '#FED7AA',
      textsecondaryLight: '#FB923C',
    },
  },
  pink: {
    light: {
      primary: '#DB2777',
      primaryLight: '#EC4899',
      primaryDark: '#BE185D',
      secondaryLight: '#F472B6',
      accent: '#F9A8D4',
      background: 'linear-gradient(to bottom right, #FDF2F8, #FCE7F3, #FBCFE8)',
      surface: '#FDF2F8',
      border: '#F472B6',
      text: '#BE185D',
      textsecondaryLight: '#DB2777',
    },
    dark: {
      primary: '#EC4899',
      primaryLight: '#F472B6',
      primaryDark: '#BE185D',
      secondaryLight: '#F472B6',
      accent: '#F9A8D4',
      background: 'linear-gradient(to bottom right, #1f0a1a, #500724, #831843)',
      surface: '#500724',
      border: '#BE185D',
      text: '#FBCFE8',
      textsecondaryLight: '#F472B6',
    },
  },
  red: {
    light: {
      primary: '#DC2626',
      primaryLight: '#EF4444',
      primaryDark: '#B91C1C',
      secondaryLight: '#F87171',
      accent: '#FCA5A5',
      background: 'linear-gradient(to bottom right, #FEF2F2, #FEE2E2, #FECACA)',
      surface: '#FEF2F2',
      border: '#F87171',
      text: '#B91C1C',
      textsecondaryLight: '#DC2626',
    },
    dark: {
      primary: '#EF4444',
      primaryLight: '#F87171',
      primaryDark: '#B91C1C',
      secondaryLight: '#F87171',
      accent: '#FCA5A5',
      background: 'linear-gradient(to bottom right, #1f0a0a, #7f1d1d, #991b1b)',
      surface: '#7f1d1d',
      border: '#B91C1C',
      text: '#FECACA',
      textsecondaryLight: '#F87171',
    },
  },
  yellow: {
    light: {
      primary: '#CA8A04',
      primaryLight: '#EAB308',
      primaryDark: '#A16207',
      secondaryLight: '#FACC15',
      accent: '#FDE047',
      background: 'linear-gradient(to bottom right, #FEFCE8, #FEF9C3, #FEF08A)',
      surface: '#FEFCE8',
      border: '#FACC15',
      text: '#A16207',
      textsecondaryLight: '#CA8A04',
    },
    dark: {
      primary: '#EAB308',
      primaryLight: '#FACC15',
      primaryDark: '#A16207',
      secondaryLight: '#FACC15',
      accent: '#FDE047',
      background: 'linear-gradient(to bottom right, #1f1a08, #713f12, #854d0e)',
      surface: '#713f12',
      border: '#A16207',
      text: '#FEF08A',
      textsecondaryLight: '#FACC15',
    },
  },
  teal: {
    light: {
      primary: '#0D9488',
      primaryLight: '#14B8A6',
      primaryDark: '#0F766E',
      secondaryLight: '#2DD4BF',
      accent: '#5EEAD4',
      background: 'linear-gradient(to bottom right, #F0FDFA, #CCFBF1, #99F6E4)',
      surface: '#F0FDFA',
      border: '#2DD4BF',
      text: '#0F766E',
      textsecondaryLight: '#0D9488',
    },
    dark: {
      primary: '#14B8A6',
      primaryLight: '#2DD4BF',
      primaryDark: '#0F766E',
      secondaryLight: '#2DD4BF',
      accent: '#5EEAD4',
      background: 'linear-gradient(to bottom right, #0a1f1c, #134e4a, #115e59)',
      surface: '#134e4a',
      border: '#0F766E',
      text: '#99F6E4',
      textsecondaryLight: '#2DD4BF',
    },
  },
  indigo: {
    light: {
      primary: '#4F46E5',
      primaryLight: '#6366F1',
      primaryDark: '#4338CA',
      secondaryLight: '#818CF8',
      accent: '#A5B4FC',
      background: 'linear-gradient(to bottom right, #EEF2FF, #E0E7FF, #C7D2FE)',
      surface: '#EEF2FF',
      border: '#818CF8',
      text: '#4338CA',
      textsecondaryLight: '#4F46E5',
    },
    dark: {
      primary: '#6366F1',
      primaryLight: '#818CF8',
      primaryDark: '#4338CA',
      secondaryLight: '#818CF8',
      accent: '#A5B4FC',
      background: 'linear-gradient(to bottom right, #0f0a2e, #312e81, #3730a3)',
      surface: '#312e81',
      border: '#4338CA',
      text: '#C7D2FE',
      textsecondaryLight: '#818CF8',
    },
  },
  rose: {
    light: {
      primary: '#E11D48',
      primaryLight: '#F43F5E',
      primaryDark: '#BE123C',
      secondaryLight: '#FB7185',
      accent: '#FDA4AF',
      background: 'linear-gradient(to bottom right, #FFF1F2, #FFE4E6, #FECDD3)',
      surface: '#FFF1F2',
      border: '#FB7185',
      text: '#BE123C',
      textsecondaryLight: '#E11D48',
    },
    dark: {
      primary: '#F43F5E',
      primaryLight: '#FB7185',
      primaryDark: '#BE123C',
      secondaryLight: '#FB7185',
      accent: '#FDA4AF',
      background: 'linear-gradient(to bottom right, #1f0a0f, #881337, #9f1239)',
      surface: '#881337',
      border: '#BE123C',
      text: '#FECDD3',
      textsecondaryLight: '#FB7185',
    },
  },
  cyan: {
    light: {
      primary: '#0891B2',
      primaryLight: '#06B6D4',
      primaryDark: '#0E7490',
      secondaryLight: '#22D3EE',
      accent: '#67E8F9',
      background: 'linear-gradient(to bottom right, #ECFEFF, #CFFAFE, #A5F3FC)',
      surface: '#ECFEFF',
      border: '#22D3EE',
      text: '#0E7490',
      textsecondaryLight: '#0891B2',
    },
    dark: {
      primary: '#06B6D4',
      primaryLight: '#22D3EE',
      primaryDark: '#0E7490',
      secondaryLight: '#22D3EE',
      accent: '#67E8F9',
      background: 'linear-gradient(to bottom right, #0a1f24, #164e63, #155e75)',
      surface: '#164e63',
      border: '#0E7490',
      text: '#A5F3FC',
      textsecondaryLight: '#22D3EE',
    },
  },
  lime: {
    light: {
      primary: '#65A30D',
      primaryLight: '#84CC16',
      primaryDark: '#4D7C0F',
      secondaryLight: '#A3E635',
      accent: '#BEF264',
      background: 'linear-gradient(to bottom right, #F7FEE7, #ECFCCB, #D9F99D)',
      surface: '#F7FEE7',
      border: '#A3E635',
      text: '#4D7C0F',
      textsecondaryLight: '#65A30D',
    },
    dark: {
      primary: '#84CC16',
      primaryLight: '#A3E635',
      primaryDark: '#4D7C0F',
      secondaryLight: '#A3E635',
      accent: '#BEF264',
      background: 'linear-gradient(to bottom right, #14200a, #365314, #3f6212)',
      surface: '#365314',
      border: '#4D7C0F',
      text: '#D9F99D',
      textsecondaryLight: '#A3E635',
    },
  },
  amber: {
    light: {
      primary: '#D97706',
      primaryLight: '#F59E0B',
      primaryDark: '#B45309',
      secondaryLight: '#FBBF24',
      accent: '#FCD34D',
      background: 'linear-gradient(to bottom right, #FFFBEB, #FEF3C7, #FDE68A)',
      surface: '#FFFBEB',
      border: '#FBBF24',
      text: '#B45309',
      textsecondaryLight: '#D97706',
    },
    dark: {
      primary: '#F59E0B',
      primaryLight: '#FBBF24',
      primaryDark: '#B45309',
      secondaryLight: '#FBBF24',
      accent: '#FCD34D',
      background: 'linear-gradient(to bottom right, #1f1a0a, #78350f, #92400e)',
      surface: '#78350f',
      border: '#B45309',
      text: '#FDE68A',
      textsecondaryLight: '#FBBF24',
    },
  },
  violet: {
    light: {
      primary: '#7C3AED',
      primaryLight: '#8B5CF6',
      primaryDark: '#6D28D9',
      secondaryLight: '#A78BFA',
      accent: '#C4B5FD',
      background: 'linear-gradient(to bottom right, #F5F3FF, #EDE9FE, #DDD6FE)',
      surface: '#F5F3FF',
      border: '#A78BFA',
      text: '#6D28D9',
      textsecondaryLight: '#7C3AED',
    },
    dark: {
      primary: '#8B5CF6',
      primaryLight: '#A78BFA',
      primaryDark: '#6D28D9',
      secondaryLight: '#A78BFA',
      accent: '#C4B5FD',
      background: 'linear-gradient(to bottom right, #0f0a1f, #5b21b6, #6b21a8)',
      surface: '#5b21b6',
      border: '#6D28D9',
      text: '#DDD6FE',
      textsecondaryLight: '#A78BFA',
    },
  },
  emerald: {
    light: {
      primary: '#059669',
      primaryLight: '#10B981',
      primaryDark: '#047857',
      secondaryLight: '#34D399',
      accent: '#6EE7B7',
      background: 'linear-gradient(to bottom right, #ECFDF5, #D1FAE5, #A7F3D0)',
      surface: '#ECFDF5',
      border: '#34D399',
      text: '#047857',
      textsecondaryLight: '#059669',
    },
    dark: {
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#047857',
      secondaryLight: '#34D399',
      accent: '#6EE7B7',
      background: 'linear-gradient(to bottom right, #0a1f17, #065f46, #047857)',
      surface: '#065f46',
      border: '#047857',
      text: '#A7F3D0',
      textsecondaryLight: '#34D399',
    },
  },
  fuchsia: {
    light: {
      primary: '#C026D3',
      primaryLight: '#D946EF',
      primaryDark: '#A21CAF',
      secondaryLight: '#E879F9',
      accent: '#F0ABFC',
      background: 'linear-gradient(to bottom right, #FDF4FF, #FAE8FF, #F5D0FE)',
      surface: '#FDF4FF',
      border: '#E879F9',
      text: '#A21CAF',
      textsecondaryLight: '#C026D3',
    },
    dark: {
      primary: '#D946EF',
      primaryLight: '#E879F9',
      primaryDark: '#A21CAF',
      secondaryLight: '#E879F9',
      accent: '#F0ABFC',
      background: 'linear-gradient(to bottom right, #1f0a1f, #86198f, #a21caf)',
      surface: '#86198f',
      border: '#A21CAF',
      text: '#F5D0FE',
      textsecondaryLight: '#E879F9',
    },
  },
  sky: {
    light: {
      primary: '#0284C7',
      primaryLight: '#0EA5E9',
      primaryDark: '#0369A1',
      secondaryLight: '#38BDF8',
      accent: '#7DD3FC',
      background: 'linear-gradient(to bottom right, #F0F9FF, #E0F2FE, #BAE6FD)',
      surface: '#F0F9FF',
      border: '#38BDF8',
      text: '#0369A1',
      textsecondaryLight: '#0284C7',
    },
    dark: {
      primary: '#0EA5E9',
      primaryLight: '#38BDF8',
      primaryDark: '#0369A1',
      secondaryLight: '#38BDF8',
      accent: '#7DD3FC',
      background: 'linear-gradient(to bottom right, #0a1824, #075985, #0c4a6e)',
      surface: '#075985',
      border: '#0369A1',
      text: '#BAE6FD',
      textsecondaryLight: '#38BDF8',
    },
  },
  slate: {
    light: {
      primary: '#475569',
      primaryLight: '#64748B',
      primaryDark: '#334155',
      secondaryLight: '#94A3B8',
      accent: '#CBD5E1',
      background: 'linear-gradient(to bottom right, #F8FAFC, #F1F5F9, #E2E8F0)',
      surface: '#F8FAFC',
      border: '#94A3B8',
      text: '#334155',
      textsecondaryLight: '#475569',
    },
    dark: {
      primary: '#64748B',
      primaryLight: '#94A3B8',
      primaryDark: '#334155',
      secondaryLight: '#94A3B8',
      accent: '#CBD5E1',
      background: 'linear-gradient(to bottom right, #0f1419, #1e293b, #334155)',
      surface: '#1e293b',
      border: '#334155',
      text: '#E2E8F0',
      textsecondaryLight: '#94A3B8',
    },
  },
  stone: {
    light: {
      primary: '#57534E',
      primaryLight: '#78716C',
      primaryDark: '#44403C',
      secondaryLight: '#A8A29E',
      accent: '#D6D3D1',
      background: 'linear-gradient(to bottom right, #FAFAF9, #F5F5F4, #E7E5E4)',
      surface: '#FAFAF9',
      border: '#A8A29E',
      text: '#44403C',
      textsecondaryLight: '#57534E',
    },
    dark: {
      primary: '#78716C',
      primaryLight: '#A8A29E',
      primaryDark: '#44403C',
      secondaryLight: '#A8A29E',
      accent: '#D6D3D1',
      background: 'linear-gradient(to bottom right, #0f0e0d, #292524, #44403c)',
      surface: '#292524',
      border: '#44403C',
      text: '#E7E5E4',
      textsecondaryLight: '#A8A29E',
    },
  },
  crimson: {
    light: {
      primary: '#DC143C',
      primaryLight: '#FF1744',
      primaryDark: '#B71C1C',
      secondaryLight: '#FF5252',
      accent: '#FF8A80',
      background: 'linear-gradient(to bottom right, #FFEBEE, #FFCDD2, #EF9A9A)',
      surface: '#FFEBEE',
      border: '#FF5252',
      text: '#B71C1C',
      textsecondaryLight: '#DC143C',
    },
    dark: {
      primary: '#FF1744',
      primaryLight: '#FF5252',
      primaryDark: '#B71C1C',
      secondaryLight: '#FF5252',
      accent: '#FF8A80',
      background: 'linear-gradient(to bottom right, #1a0505, #8b0000, #b71c1c)',
      surface: '#8b0000',
      border: '#B71C1C',
      text: '#FFCDD2',
      textsecondaryLight: '#FF5252',
    },
  },
  coral: {
    light: {
      primary: '#FF6B6B',
      primaryLight: '#FF7979',
      primaryDark: '#EE5A52',
      secondaryLight: '#FFA07A',
      accent: '#FFB6A3',
      background: 'linear-gradient(to bottom right, #FFF5F5, #FFE5E5, #FFD4CC)',
      surface: '#FFF5F5',
      border: '#FFA07A',
      text: '#EE5A52',
      textsecondaryLight: '#FF6B6B',
    },
    dark: {
      primary: '#FF7979',
      primaryLight: '#FFA07A',
      primaryDark: '#EE5A52',
      secondaryLight: '#FFA07A',
      accent: '#FFB6A3',
      background: 'linear-gradient(to bottom right, #1f0a0a, #8b2e24, #b71c1c)',
      surface: '#8b2e24',
      border: '#EE5A52',
      text: '#FFD4CC',
      textsecondaryLight: '#FFA07A',
    },
  },
  lavender: {
    light: {
      primary: '#B57EDC',
      primaryLight: '#D4A5FF',
      primaryDark: '#9B59B6',
      secondaryLight: '#DDA0DD',
      accent: '#E6D5F5',
      background: 'linear-gradient(to bottom right, #FAF5FF, #F3E8FF, #E9D5FF)',
      surface: '#FAF5FF',
      border: '#DDA0DD',
      text: '#9B59B6',
      textsecondaryLight: '#B57EDC',
    },
    dark: {
      primary: '#D4A5FF',
      primaryLight: '#DDA0DD',
      primaryDark: '#9B59B6',
      secondaryLight: '#DDA0DD',
      accent: '#E6D5F5',
      background: 'linear-gradient(to bottom right, #1a0a1f, #4a1a5f, #6d28a0)',
      surface: '#4a1a5f',
      border: '#9B59B6',
      text: '#E9D5FF',
      textsecondaryLight: '#DDA0DD',
    },
  },
  mint: {
    light: {
      primary: '#3EB489',
      primaryLight: '#5FD3A6',
      primaryDark: '#2D9574',
      secondaryLight: '#7BE0B5',
      accent: '#A8F5D9',
      background: 'linear-gradient(to bottom right, #F0FFF4, #E6F9F0, #D1F5E4)',
      surface: '#F0FFF4',
      border: '#7BE0B5',
      text: '#2D9574',
      textsecondaryLight: '#3EB489',
    },
    dark: {
      primary: '#5FD3A6',
      primaryLight: '#7BE0B5',
      primaryDark: '#2D9574',
      secondaryLight: '#7BE0B5',
      accent: '#A8F5D9',
      background: 'linear-gradient(to bottom right, #0a1f17, #1a5f42, #2d9574)',
      surface: '#1a5f42',
      border: '#2D9574',
      text: '#D1F5E4',
      textsecondaryLight: '#7BE0B5',
    },
  },
  peach: {
    light: {
      primary: '#FFAB91',
      primaryLight: '#FFCCBC',
      primaryDark: '#FF8A65',
      secondaryLight: '#FFE0B2',
      accent: '#FFF3E0',
      background: 'linear-gradient(to bottom right, #FFF8F0, #FFE8D9, #FFD8C4)',
      surface: '#FFF8F0',
      border: '#FFE0B2',
      text: '#FF8A65',
      textsecondaryLight: '#FFAB91',
    },
    dark: {
      primary: '#FFCCBC',
      primaryLight: '#FFE0B2',
      primaryDark: '#FF8A65',
      secondaryLight: '#FFE0B2',
      accent: '#FFF3E0',
      background: 'linear-gradient(to bottom right, #1f1408, #8b4513, #bf6030)',
      surface: '#8b4513',
      border: '#FF8A65',
      text: '#FFD8C4',
      textsecondaryLight: '#FFE0B2',
    },
  },
  navy: {
    light: {
      primary: '#001F3F',
      primaryLight: '#1A4D7F',
      primaryDark: '#001529',
      secondaryLight: '#3B6BA5',
      accent: '#6B9BD1',
      background: 'linear-gradient(to bottom right, #E6F2FF, #CCE5FF, #B3D9FF)',
      surface: '#E6F2FF',
      border: '#3B6BA5',
      text: '#001529',
      textsecondaryLight: '#001F3F',
    },
    dark: {
      primary: '#1A4D7F',
      primaryLight: '#3B6BA5',
      primaryDark: '#001529',
      secondaryLight: '#3B6BA5',
      accent: '#6B9BD1',
      background: 'linear-gradient(to bottom right, #000814, #001f3f, #002855)',
      surface: '#001f3f',
      border: '#001529',
      text: '#B3D9FF',
      textsecondaryLight: '#3B6BA5',
    },
  },
  burgundy: {
    light: {
      primary: '#800020',
      primaryLight: '#A0152E',
      primaryDark: '#5C0011',
      secondaryLight: '#C73E4A',
      accent: '#E67382',
      background: 'linear-gradient(to bottom right, #FFF0F3, #FFE0E6, #FFD0D9)',
      surface: '#FFF0F3',
      border: '#C73E4A',
      text: '#5C0011',
      textsecondaryLight: '#800020',
    },
    dark: {
      primary: '#A0152E',
      primaryLight: '#C73E4A',
      primaryDark: '#5C0011',
      secondaryLight: '#C73E4A',
      accent: '#E67382',
      background: 'linear-gradient(to bottom right, #1a0005, #5c0011, #800020)',
      surface: '#5c0011',
      border: '#5C0011',
      text: '#FFD0D9',
      textsecondaryLight: '#C73E4A',
    },
  },
  gold: {
    light: {
      primary: '#FFD700',
      primaryLight: '#FFE44D',
      primaryDark: '#DAA520',
      secondaryLight: '#FFF176',
      accent: '#FFF9C4',
      background: 'linear-gradient(to bottom right, #FFFEF0, #FFF9D9, #FFF4C4)',
      surface: '#FFFEF0',
      border: '#FFF176',
      text: '#DAA520',
      textsecondaryLight: '#FFD700',
    },
    dark: {
      primary: '#FFE44D',
      primaryLight: '#FFF176',
      primaryDark: '#DAA520',
      secondaryLight: '#FFF176',
      accent: '#FFF9C4',
      background: 'linear-gradient(to bottom right, #1f1a08, #9d7e23, #daa520)',
      surface: '#9d7e23',
      border: '#DAA520',
      text: '#FFF4C4',
      textsecondaryLight: '#FFF176',
    },
  },
  chocolate: {
    light: {
      primary: '#7B3F00',
      primaryLight: '#A0522D',
      primaryDark: '#5C2E00',
      secondaryLight: '#CD853F',
      accent: '#DEB887',
      background: 'linear-gradient(to bottom right, #FFF8F0, #FFEEDD, #FFE4CC)',
      surface: '#FFF8F0',
      border: '#CD853F',
      text: '#5C2E00',
      textsecondaryLight: '#7B3F00',
    },
    dark: {
      primary: '#A0522D',
      primaryLight: '#CD853F',
      primaryDark: '#5C2E00',
      secondaryLight: '#CD853F',
      accent: '#DEB887',
      background: 'linear-gradient(to bottom right, #1a0f05, #5c2e00, #7b3f00)',
      surface: '#5c2e00',
      border: '#5C2E00',
      text: '#FFE4CC',
      textsecondaryLight: '#CD853F',
    },
  },
  olive: {
    light: {
      primary: '#6B8E23',
      primaryLight: '#8FBC38',
      primaryDark: '#556B2F',
      secondaryLight: '#9ACD32',
      accent: '#BFD865',
      background: 'linear-gradient(to bottom right, #F7FFF0, #EEFFD9, #E0F5C4)',
      surface: '#F7FFF0',
      border: '#9ACD32',
      text: '#556B2F',
      textsecondaryLight: '#6B8E23',
    },
    dark: {
      primary: '#8FBC38',
      primaryLight: '#9ACD32',
      primaryDark: '#556B2F',
      secondaryLight: '#9ACD32',
      accent: '#BFD865',
      background: 'linear-gradient(to bottom right, #141a08, #3a4a1a, #556b2f)',
      surface: '#3a4a1a',
      border: '#556B2F',
      text: '#E0F5C4',
      textsecondaryLight: '#9ACD32',
    },
  },
}

interface ThemeContextType {
  accentColor: AccentColor
  colors: ThemeColors
  darkMode: boolean
  setAccentColor: (color: AccentColor) => void
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('accentColor')
    return (saved as AccentColor) || 'caramel'
  })

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true'
  })

  const colors: ThemeColors = {
    ...(darkMode ? colorSchemes[accentColor].dark : colorSchemes[accentColor].light),
    // Fallback for secondaryLight if missing
    secondaryLight: (darkMode ? colorSchemes[accentColor].dark : colorSchemes[accentColor].light).secondaryLight || 
                    (darkMode ? colorSchemes[accentColor].dark : colorSchemes[accentColor].light).secondary
  }

  useEffect(() => {
    // Apply CSS variables to document root
    const root = document.documentElement
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-light', colors.primaryLight)
    root.style.setProperty('--color-primary-dark', colors.primaryDark)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-text', colors.text)
    root.style.setProperty('--color-text-secondary', colors.textSecondary)
    
    // Toggle dark class
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [colors, darkMode])

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem('accentColor', color)
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
  }

  return (
    <ThemeContext.Provider value={{ accentColor, colors, darkMode, setAccentColor, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

