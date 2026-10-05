/**
 * Configuración de Tokens de Diseño - Universidad Tecnológica Indoamérica (UTI)
 * Sistema de Diseño: Agente IA Cruce de Horarios Docentes
 */

export const LIGHT_THEME = {
    bg: '#f4f0f9',
    bgSoft: '#eae3f4',
    surface: '#ffffff',
    text: '#2c1547',
    textMuted: '#6e5987',
    border: '#e2d9ee',
    brand: '#2c1547',
    brandSoft: 'rgba(44, 21, 71, 0.12)',
    highlight: '#f57021',
    highlightSoft: 'rgba(245, 112, 33, 0.16)',
} as const;

export const DARK_THEME = {
    bg: '#150b24',
    bgSoft: '#211336',
    surface: '#26163d',
    text: '#f5f0fb',
    textMuted: '#b7a7cc',
    border: '#3b2259',
    brand: '#8a4ed9',
    brandSoft: 'rgba(138, 78, 217, 0.2)',
    highlight: '#f57021',
    highlightSoft: 'rgba(245, 112, 33, 0.25)',
} as const;

export const BRAND_CONFIG = {
    institution: 'Universidad Tecnológica Indoamérica',
    shortName: 'UTI',
    systemTitle: 'Agente de IA — Cruce de Horarios Docentes',
    subTitle: 'Modelo Educativo 2026',
    logoPath: '/logo-uti.png',
    faviconPath: '/favicon.svg',
} as const;

export type ThemeType = 'light' | 'dark';
