import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Providers from '@/components/Providers';
import { STORAGE_KEY } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pulse · Personalized Content Dashboard',
  description: 'News, movie recommendations and social posts in one customizable dashboard.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Applies the saved theme before first paint so there is no light/dark flash.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'null');var t=s&&s.preferences&&s.preferences.theme;if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
