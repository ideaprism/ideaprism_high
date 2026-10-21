'use client'

import { createContext, useContext } from 'react'
import type { SchoolProfile } from '@/config/schools'

const SchoolContext = createContext<SchoolProfile | null>(null)

export function SchoolProvider({
  school,
  children,
}: {
  school: SchoolProfile | null
  children: React.ReactNode
}) {
  return <SchoolContext.Provider value={school}>{children}</SchoolContext.Provider>
}

export function useSchool() {
  return useContext(SchoolContext)
}
