import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resurge Agency | Content Workflow',
  description: 'Internal content production management platform by Resurge Agency',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
