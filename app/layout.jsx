import './globals.css';

export const metadata = {
  title: 'Empy TV 🌸',
  description: "Empy's magical world of games, movies, and messages to Dad",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
};

export const viewport = {
  themeColor: '#FF2D8B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="empytv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-hidden">
        {children}
        <SWRegistration />
      </body>
    </html>
  );
}

function SWRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                console.log('[SW] registered:', reg.scope);
                navigator.serviceWorker.addEventListener('message', function(e) {
                  window.dispatchEvent(new CustomEvent('sw-message', { detail: e.data }));
                });
              }).catch(function(e) { console.warn('[SW] registration failed:', e); });
            });
          }
        `,
      }}
    />
  );
}
