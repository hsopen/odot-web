import { defineStore } from 'pinia'

const savedLocale = localStorage.getItem('locale') || 'en'

export const useLocaleStore = defineStore('i18n', {
  state: () => ({
    locale: savedLocale,
  }),
  actions: {
    setLocale(locale: string) {
      this.locale = locale
      localStorage.setItem('locale', locale)
    },
  },
})
