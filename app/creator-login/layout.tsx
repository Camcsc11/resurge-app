import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creator Login | OFM Pro',
  description: 'Creator portal login',
};

export default function CreatorLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
