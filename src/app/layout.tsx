import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SchoolProvider } from '@/components/school/SchoolProvider'
import { schoolCssVars } from '@/config/schools'
import { getSchoolSession } from '@/lib/school-session'

export const metadata: Metadata = {
  title: 'IdeaPrism High',
  description: '고등학교 전용 학생 발명 검색',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const school = await getSchoolSession()

  return (
    <html
      lang="ko"
      data-school={school?.slug}
      style={school ? (schoolCssVars(school) as CSSProperties) : undefined}
      suppressHydrationWarning
    >
      <body
        className="antialiased min-h-screen flex flex-col bg-background text-on-background"
        suppressHydrationWarning
      >
        <QueryProvider>
          <SchoolProvider school={school}>
            <AuthProvider>
              {school ? (
                <>
                  <Header />
                  <main className="flex-1 w-full">{children}</main>
                  <Footer />
                </>
              ) : (
                children
              )}
            </AuthProvider>
          </SchoolProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
