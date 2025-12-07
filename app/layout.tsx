import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Base Terminal Dashboard | Powered by Cambrian',
  description: 'Terminal-style dashboard for Base blockchain tokens using Cambrian API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
