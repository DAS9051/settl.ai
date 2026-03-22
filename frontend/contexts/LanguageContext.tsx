'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, T, LANGUAGES } from '@/lib/translations'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: T
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'English',
  setLanguage: () => {},
  t: translations['English'],
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English')

  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage') as Language | null
    if (saved && LANGUAGES.includes(saved as Language)) {
      setLanguageState(saved as Language)
    }
  }, [])

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem('preferredLanguage', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
