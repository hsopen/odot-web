<script setup lang="ts">
import I18nConfig from '@/components/globalConfiguration/i18nConfig.vue'
import axios from 'axios'
import {
  NA,
  NButton,
  NCard,
  NCheckbox,
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const form = ref({
  email: '',
  password: '',
  remember: false,
})

const touched = ref({
  email: false,
  password: false,
})

const message = useMessage()
const formRef = ref<any>(null)

function validateEmail(value: string): { status: 'error' | 'success' | 'warning' | undefined, message: string } {
  if (!value)
    return { status: 'error', message: t('theMailboxCannotBeEmpty') }
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  if (!emailRegex.test(value))
    return { status: 'error', message: t('pleaseEnterTheValidEmailAddress') }
  return { status: 'success', message: t('theMailboxFormatIsCorrect') }
}

function validatePassword(value: string): { status: 'error' | 'success' | 'warning' | undefined, message: string } {
  if (!value)
    return { status: 'error', message: t('thePasswordCannotBeEmpty') }
  if (value.length < 6)
    return { status: 'error', message: t('passwordMustBeAtLeast_6Digits') }
  return { status: 'success', message: t('passwordFormatCorrect') }
}

const emailValidation = computed(() => {
  return form.value.email ? validateEmail(form.value.email) : { status: undefined, message: '' }
})

const passwordValidation = computed(() => {
  return form.value.password ? validatePassword(form.value.password) : { status: undefined, message: '' }
})

const isFormValid = computed(() => {
  return emailValidation.value.status === 'success' && passwordValidation.value.status === 'success'
})

function handleLogin() {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      try {
        const result = await axios.post(`${import.meta.env.VITE_API_HOST}/api/v1/auth/login`, form.value, { withCredentials: true })
        if (!result.data.status) {
          message.error(t('emailOrPasswordError'))
          return
        }
        message.success(t('successfulLogin'))
        router.push('/dashboard/home')
      }
      catch {
        message.error(t('loginFailed'))
      }
    }
    else {
      message.error(t('formVerificationFailedPleaseCheckTheInput'))
    }
  })
}

function handleRegister() {
  router.push('/register')
}
</script>

<template>
  <NMessageProvider>
    <NLayout>
      <NLayoutContent>
        <NSpace justify="center" align="center" class="login-container">
          <NCard class="login-card">
            <NH1 class="login-title">
              ODOT
            </NH1>
            <NForm ref="formRef" @submit.prevent="handleLogin" @keydown.enter="handleLogin">
              <NFormItem
                :label="t('email')"
                path="email"
                :validation-status="touched.email ? emailValidation.status : undefined"
                :feedback="touched.email ? emailValidation.message : ''"
              >
                <NInput
                  v-model:value="form.email"
                  :placeholder="t('pleaseEnterTheMailbox')"
                  @blur="touched.email = true"
                />
              </NFormItem>
              <NFormItem
                :label="t('password')"
                path="password"
                :validation-status="touched.password ? passwordValidation.status : undefined"
                :feedback="touched.password ? passwordValidation.message : ''"
              >
                <NInput
                  v-model:value="form.password"
                  type="password"
                  :placeholder="t('pleaseEnterThePassword')"
                  @blur="touched.password = true"
                />
              </NFormItem>
              <NSpace justify="space-between" class="login-options">
                <NCheckbox v-model:checked="form.remember">
                  {{ $t('rememberToLogIn') }}
                </NCheckbox>
                <NA href="#">
                  {{ $t('forgetThePassword') }}
                </NA>
              </NSpace>
              <NButton
                type="primary"
                block
                class="login-button"
                attr-type="submit"
                :disabled="!isFormValid"
              >
                {{ $t('login') }}
              </NButton>
              <NButton block class="register-button" @click="handleRegister">
                {{ $t('register') }}
              </NButton>
            </NForm>
            <div class="config-container">
              <I18nConfig />
            </div>
          </NCard>
        </NSpace>
      </NLayoutContent>
    </NLayout>
  </NMessageProvider>
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

.login-options {
  margin-bottom: 20px;
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

.n-form-item {
  margin-bottom: 5px; /* 确保与注册页面一致 */
}
</style>
