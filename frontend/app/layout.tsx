import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'VoiceAgent — AI Sales Calling Platform',
  description: 'Create your AI sales agent, call leads automatically, book meetings.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
