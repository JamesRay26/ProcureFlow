'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              const themeColor = localStorage.getItem('theme-color');
              if (themeColor && themeColor !== 'default') {
                document.documentElement.setAttribute('data-theme-color', themeColor);
              }
            } catch (e) {}
          `,
        }}
      />
      {children}
    </ThemeProvider>
  );
}
