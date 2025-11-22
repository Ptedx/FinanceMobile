import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const shadows = {
    sm: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    md: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
};

export const typography = {
    h1: {
        fontSize: 32,
        fontWeight: 'bold' as const,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: 'bold' as const,
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500' as const,
        lineHeight: 20,
    },
};

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#006C4C',
        onPrimary: '#FFFFFF',
        primaryContainer: '#89F8C7',
        onPrimaryContainer: '#002114',
        secondary: '#4C6358',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#CEE9DA',
        onSecondaryContainer: '#092017',
        tertiary: '#3E6373',
        onTertiary: '#FFFFFF',
        tertiaryContainer: '#C2E8FB',
        onTertiaryContainer: '#001F29',
        error: '#BA1A1A',
        onError: '#FFFFFF',
        errorContainer: '#FFDAD6',
        onErrorContainer: '#410002',
        background: '#FBFDF9',
        onBackground: '#191C1A',
        surface: '#FBFDF9',
        onSurface: '#191C1A',
        outline: '#707974',
        surfaceVariant: '#DCE5DD',
        onSurfaceVariant: '#404944',
        success: '#2E7D32',
        warning: '#ED6C02',
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#6DDBAC',
        onPrimary: '#003825',
        primaryContainer: '#005138',
        onPrimaryContainer: '#89F8C7',
        secondary: '#B2CCBE',
        onSecondary: '#1E352B',
        secondaryContainer: '#354B41',
        onSecondaryContainer: '#CEE9DA',
        tertiary: '#A6CCDF',
        onTertiary: '#083543',
        tertiaryContainer: '#254B5A',
        onTertiaryContainer: '#C2E8FB',
        error: '#FFB4AB',
        onError: '#690005',
        errorContainer: '#93000A',
        onErrorContainer: '#FFDAD6',
        background: '#191C1A',
        onBackground: '#E1E3DF',
        surface: '#191C1A',
        onSurface: '#E1E3DF',
        outline: '#8A938D',
        surfaceVariant: '#404944',
        onSurfaceVariant: '#C0C9C2',
        success: '#66BB6A',
        warning: '#FFA726',
    },
};

export type AppTheme = typeof lightTheme;
