import { createI18n } from 'vue-i18n'
import enMessages from './locales/en.json'
import zhMessages from './locales/zh.json'

// 从 localStorage 中读取保存的语言
const savedLocale = localStorage.getItem('locale') || 'en'

const messages = {
  en: enMessages as Record<string, string>,
  zh: zhMessages as Record<string, string>,
}

const i18n = createI18n({
  legacy: false,
  locale: savedLocale, // 默认语言从 localStorage 中读取
  fallbackLocale: 'en',
  messages,
})

export default i18n
