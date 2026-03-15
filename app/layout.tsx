import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Talk to Cartoon Mike',
  description:
    'AI researcher. 100+ patents. Slightly evil. Talk to an AI-powered cartoon version of Mike Todasco.',
  openGraph: {
    title: 'Talk to Cartoon Mike',
    description: 'AI researcher. 100+ patents. Slightly evil.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talk to Cartoon Mike',
    description: 'AI researcher. 100+ patents. Slightly evil.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
