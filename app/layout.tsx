import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jobapp',
  description: 'AI-powered job application tracker and resume builder',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
