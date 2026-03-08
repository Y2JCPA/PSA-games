import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dragon Park Tycoon',
  description: 'Build your own fantasy creature theme park!',
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
          href="https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dragon-dark text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
