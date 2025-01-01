<script setup lang="ts">
import DarkModeConfig from '@/components/globalConfiguration/darkModeConfig.vue'
import I18nConfig from '@/components/globalConfiguration/i18nConfig.vue'
import { useThemeStore } from '@/stores/themeStore'
import axios from 'axios'
import {
  NA,
  NButton,
  NCard,
  NConfigProvider,
  NForm,
  NFormItem,
  NH1,
  NInput,
  NLayout,
  NLayoutContent,
  NMessageProvider,
  NSpace,
  useMessage,
} from 'naive-ui'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t, locale } = useI18n()

const router = useRouter()
// 将表单变量统一到一个对象中
const form = ref({
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})

// 标记用户是否与输入框交互过
const touched = ref({
  email: false,
  code: false,
  password: false,
  confirmPassword: false,
})

const validationStatus = ref({
  email: false,
  code: false,
  password: false,
  confirmPassword: false,
})

const themeStore = useThemeStore()
const message = useMessage()
const formRef = ref<any>(null) // 绑定 NForm 的 ref
const isCodeButtonDisabled = ref(false)
const codeButtonText = ref(t('getTheVerificationCode'))
let countdownTimer: number | null = null

// 监听语言变化
watch(locale, () => {
  if (isCodeButtonDisabled.value) {
    const countdown = Number.parseInt(codeButtonText.value)
    if (!Number.isNaN(countdown)) {
      codeButtonText.value = `${countdown}${t('repeatAfterSeconds')}`
    }
    else {
      codeButtonText.value = t('getTheVerificationCode')
    }
  }
  else {
    codeButtonText.value = t('getTheVerificationCode')
  }
})

// 邮箱验证规则
function validateEmail(value: string): { status: 'error' | 'success' | 'warning' | undefined, message: string } {
  if (!value) {
    validationStatus.value.email = false
    return { status: 'error', message: t('theMailboxCannotBeEmpty') }
  }
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    validationStatus.value.email = false
    return { status: 'error', message: t('pleaseEnterTheValidEmailAddress') }
  }
  validationStatus.value.email = true
  return { status: 'success', message: t('theMailboxFormatIsCorrect') }
}

// 密码验证规则
function validatePassword(value: string): { status: 'error' | 'success' | 'warning' | undefined, message: string } {
  if (!value) {
    validationStatus.value.password = false
    return { status: 'error', message: t('thePasswordCannotBeEmpty') }
  }
  if (value.length < 6) {
    validationStatus.value.password = false
    return { status: 'error', message: t('passwordMustBeAtLeast_6Digits') }
  }
  validationStatus.value.password = true
  return { status: 'success', message: t('passwordFormatCorrect') }
}

// 确认密码验证规则
function validateConfirmPassword(value: string): { status: 'error' | 'success' | 'warning' | undefined, message: string } {
  if (!value) {
    validationStatus.value.confirmPassword = false
    return { status: 'error', message: t('confirmThatThePasswordCannotBeEmpty') }
  }
  if (value !== form.value.password) {
    validationStatus.value.confirmPassword = false
    return { status: 'error', message: t('thePasswordsInTwoInputsAreInconsistent') }
  }
  validationStatus.value.confirmPassword = true
  return { status: 'success', message: t('consistentPassword') }
}

// 获取验证码逻辑
async function handleGetCode() {
  if (!validationStatus.value.email) {
    message.error(t('pleaseEnterTheValidEmailAddress'))
    return
  }
  try {
    await axios.get(`${import.meta.env.VITE_API_HOST}/api/v1/mail/getTheRegistrationVerificationCode`, { params: { email: form.value.email } })
    validationStatus.value.code = true
  }
  catch {
    message.error(t('theVerificationCodeFailed'))
  }
  message.success(t('theVerificationCodeHasBeenSent'))
  isCodeButtonDisabled.value = true
  let countdown = 60

  countdownTimer = setInterval(() => {
    countdown--
    codeButtonText.value = `${countdown}${t('repeatAfterSeconds')}`

    if (countdown <= 0) {
      clearInterval(countdownTimer!)
      isCodeButtonDisabled.value = false
      codeButtonText.value = t('getTheVerificationCode')
    }
  }, 1000)
}

// 注册逻辑
async function handleRegister() {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      if (form.value.password !== form.value.confirmPassword) {
        message.error(t('thePasswordsInTwoInputsAreInconsistent'))
        return
      }
      try {
        const result = await axios.post(`${import.meta.env.VITE_API_HOST}/api/v1/auth/registeredUser`, form.value)
        if (!result.data.status) {
          message.error(t('failure'))
        }
        message.success(t('registerSuccessfully'))
      }
      catch {
        message.error(t('failure'))
      }
    }
    else {
      message.error(t('formVerificationFailedPleaseCheckTheInput'))
    }
  })
}

// 登录逻辑
function handleLogin() {
  router.push('/login')
}
</script>

<template>
  <NConfigProvider :theme="themeStore.theme">
    <NMessageProvider>
      <NLayout>
        <NLayoutContent>
          <NSpace justify="center" align="center" class="login-container">
            <NCard class="login-card">
              <NH1 class="login-title">
                ODOT
              </NH1>
              <NForm ref="formRef" @submit.prevent="handleRegister" @keydown.enter="handleRegister">
                <NFormItem
                  :label="t('email')"
                  path="email"
                  :validation-status="touched.email ? validateEmail(form.email).status : undefined"
                  :feedback="touched.email ? validateEmail(form.email).message : ''"
                >
                  <NInput
                    v-model:value="form.email"
                    :placeholder="t('pleaseEnterTheMailbox')"
                    @blur="touched.email = true; validateEmail(form.email)"
                  />
                </NFormItem>
                <NFormItem :label="t('verificationCode')" path="code">
                  <div class="code-input-container">
                    <NInput
                      v-model:value="form.code"
                      :placeholder="t('pleaseEnterTheVerificationCode')"
                      @blur="touched.code = true"
                    />
                    <NButton
                      :disabled="isCodeButtonDisabled || !validationStatus.email"
                      style="width: 160px;"
                      @click="handleGetCode"
                    >
                      {{ codeButtonText }}
                    </NButton>
                  </div>
                </NFormItem>
                <NFormItem
                  :label="t('password')"
                  path="password"
                  :validation-status="touched.password ? validatePassword(form.password).status : undefined"
                  :feedback="touched.password ? validatePassword(form.password).message : ''"
                >
                  <NInput
                    v-model:value="form.password"
                    type="password"
                    :placeholder="t('pleaseEnterThePassword')"
                    @blur="touched.password = true; validatePassword(form.password)"
                  />
                </NFormItem>
                <NFormItem
                  :label="t('confirmPassword')"
                  path="confirmPassword"
                  :validation-status="touched.confirmPassword ? validateConfirmPassword(form.confirmPassword).status : undefined"
                  :feedback="touched.confirmPassword ? validateConfirmPassword(form.confirmPassword).message : ''"
                >
                  <NInput
                    v-model:value="form.confirmPassword"
                    type="password"
                    :placeholder="t('pleaseEnterThePasswordAgain')"
                    @blur="touched.confirmPassword = true; validateConfirmPassword(form.confirmPassword)"
                  />
                </NFormItem>
                <NButton
                  type="primary"
                  block
                  class="login-button"
                  attr-type="submit"
                  :disabled="!validationStatus.email || !validationStatus.code || !validationStatus.password || !validationStatus.confirmPassword"
                >
                  {{ $t('register') }}
                </NButton>
                <NButton block class="register-button" @click="handleLogin">
                  {{ $t('login') }}
                </NButton>
              </NForm>
              <!-- 主题切换和国际化组件 -->
              <div class="config-container">
                <I18nConfig />
                <DarkModeConfig />
              </div>
            </NCard>
          </NSpace>
        </NLayoutContent>
      </NLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.login-container {
  height: 100vh;
}

.login-card {
  width: 400px;
  margin-top: -100px;
}

.login-title {
  text-align: center;
}

.code-input-container {
  display: flex;
  gap: 10px;
}

.login-button {
  margin-top: 20px;
}

.register-button {
  margin-top: 10px;
}

.config-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}
</style>
