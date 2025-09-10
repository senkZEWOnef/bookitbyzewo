import type { Metadata } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css'

export const metadata: Metadata = {
  title: 'BookIt by Zewo - WhatsApp-First Booking',
  description: 'A Calendly built for WhatsApp. Service pros get a shareable booking link that confirms appointments, collects deposits, and sends updates via WhatsApp.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}