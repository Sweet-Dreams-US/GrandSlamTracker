import type { Metadata } from 'next'
import { Anton, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-heading' })
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Grand Slam Tracker | Sweet Dreams US',
  description: 'Client performance tracking and fee management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try { if(localStorage.getItem('theme')==='light') document.documentElement.classList.add('light') } catch(e){}
        `}} />
      </head>
      <body className={`${anton.variable} ${ibmPlexMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
