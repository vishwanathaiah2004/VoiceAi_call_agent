import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'CallMind — AI Voice Sales Platform',
  description: 'Deploy your AI voice agent, automate outreach, and book more meetings on autopilot.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
