import './globals.css'

export const metadata = {
  title: 'cutplane',
  description: 'cutplane',
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