import './globals.css';

const SITE_URL = 'https://gw-phonne.vercel.app';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'GW Phone — Assistência técnica e iPhones em Botucatu',
  description:
    'GW Phone: venda de iPhones novos e seminovos e assistência técnica especializada em Apple. Rua Brás de Assis, 58 — Sala C, Botucatu-SP.',
  icons: { icon: '/assets/logo.png' },
  openGraph: {
    title: 'GW Phone — Assistência técnica e iPhones em Botucatu',
    description:
      'Venda de iPhones novos e seminovos e assistência técnica especializada em Apple, em Botucatu-SP.',
    url: SITE_URL,
    siteName: 'GW Phone',
    images: ['/assets/logo.png'],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'GW Phone — Assistência técnica e iPhones em Botucatu',
    description:
      'Venda de iPhones novos e seminovos e assistência técnica especializada em Apple, em Botucatu-SP.',
    images: ['/assets/logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500;1,600&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
