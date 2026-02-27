import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Jobapp',
    template: '%s | Jobapp',
  },
  description: 'AI-powered job application tracker and resume builder. Tailor your resume for every job, maximize your ATS score, and land more interviews.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Jobapp',
    description: 'Land your dream job, one tailored resume at a time.',
    siteName: 'Jobapp',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobapp',
    description: 'Land your dream job, one tailored resume at a time.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
