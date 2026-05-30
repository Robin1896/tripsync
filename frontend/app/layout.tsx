import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { PageTracker } from './components/PageTracker'

export const viewport: Viewport = {
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fffdf9',
}

export const metadata: Metadata = {
  title: 'TripSync.',
  description: 'Kies samen de perfecte vakantiebestemming via realtime matching en een interactieve wereldbol.',
  keywords: ['vakantie', 'reizen', 'groep', 'matching', 'bestemming'],
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'TripSync.' },
  openGraph: {
    title: 'TripSync.',
    description: 'Stop discussiëren. Begin reizen.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <PageTracker />
        <div className="page-scroll">
          {children}
        </div>
      </body>
    </html>
  )
}
