<script setup lang="ts">
import instance from '@/utils/axios'
import { NButton, NFlex, NInput, NInputGroup, NLayout, NLayoutContent, NLayoutHeader, NLayoutSider, NMenu, useMessage } from 'naive-ui'
import { onBeforeMount, ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

// 当前选中的菜单项
const activeKey = ref('avatar')
const avatarLink = ref('') // 旧头像 URL
const fileInput = ref<HTMLInputElement | null>(null)
const displayImage = ref<string | null>(null) // 控制裁剪框内的图片
const cropper = ref<any>(null)
const message = useMessage()

// 用户名相关
const username = ref('') // 当前用户名
const newUsername = ref('') // 新用户名

// 邮箱相关
const email = ref('') // 当前邮箱
const newEmail = ref('') // 新邮箱
const emailVerificationCode = ref('') // 邮箱验证码
const isEmailCodeSent = ref(false) // 是否已发送邮箱验证码
const emailCountdown = ref(0) // 邮箱验证码倒计时
const emailCountdownInterval = ref<any>(null) // 邮箱验证码倒计时定时器

// 密码相关
const newPassword = ref('') // 新密码
const passwordVerificationCode = ref('') // 密码验证码
const isPasswordCodeSent = ref(false) // 是否已发送密码验证码
const passwordCountdown = ref(0) // 密码验证码倒计时
const passwordCountdownInterval = ref<any>(null) // 密码验证码倒计时定时器

// 菜单项
const menuOptions = [
  { label: '头像', key: 'avatar' },
  { label: '基本信息', key: 'info' },
]

// 加载当前头像（打开页面时调用）
async function loadAvatar() {
  try {
    const response = await instance.get(`${import.meta.env.VITE_API_HOST}/api/v1/user/getAvatar`)
    const newAvatarUrl = response.data?.data?.url || ''
    avatarLink.value = newAvatarUrl
    displayImage.value = `${newAvatarUrl}#t=${Date.now()}` // ✅ 使用 # 而不是 ?
  }
  catch (error) {
    console.error('获取头像失败:', error)
  }
}

// 加载用户名
async function loadUsername() {
  try {
    const response = await instance.get(`${import.meta.env.VITE_API_HOST}/api/v1/user/getNickname`)
    username.value = response.data?.data?.nickname || ''
    newUsername.value = username.value
  }
  catch (error) {
    console.error('获取用户名失败:', error)
  }
}

// 加载邮箱
async function loadEmail() {
  try {
    const response = await instance.get(`${import.meta.env.VITE_API_HOST}/api/v1/user/getUserEmail`)
    email.value = response.data?.data?.email || ''
    newEmail.value = email.value
  }
  catch (error) {
    console.error('获取邮箱失败:', error)
  }
}

// 修改用户名
async function updateUsername() {
  if (!newUsername.value.trim()) {
    message.error('用户名不能为空')
    return
  }

  try {
    await instance.put(`${import.meta.env.VITE_API_HOST}/api/v1/user/modifyNickname`, {
      nickname: newUsername.value,
    })
    message.success('用户名修改成功')
    username.value = newUsername.value
  }
  catch (error) {
    console.error('修改用户名失败:', error)
    message.error('修改用户名失败')
  }
}

// 发送邮箱验证码
async function sendEmailVerificationCode() {
  if (!newEmail.value.trim()) {
    message.error('邮箱不能为空')
    return
  }

  if (newEmail.value === email.value) {
    message.error('新邮箱不能与旧邮箱相同')
    return
  }

  try {
    await instance.post(`${import.meta.env.VITE_API_HOST}/api/v1/auth/sendAnEmailVerificationCode`, {
      email: newEmail.value,
    })
    message.success('验证码已发送')
    isEmailCodeSent.value = true
    startEmailCountdown()
  }
  catch (error) {
    console.error('发送验证码失败:', error)
    message.error('发送验证码失败')
  }
}

// 修改邮箱
async function updateEmail() {
  if (!emailVerificationCode.value.trim()) {
    message.error('验证码不能为空')
    return
  }

  try {
    await instance.put(`${import.meta.env.VITE_API_HOST}/api/v1/user/changeEmailAddress`, {
      email: newEmail.value,
      code: emailVerificationCode.value,
    })
    message.success('邮箱修改成功')
    email.value = newEmail.value
    isEmailCodeSent.value = false
    emailVerificationCode.value = ''
  }
  catch (error) {
    console.error('修改邮箱失败:', error)
    message.error('修改邮箱失败')
  }
}

// 发送密码验证码
async function sendPasswordVerificationCode() {
  if (!email.value.trim()) {
    message.error('请先加载邮箱地址')
    return
  }

  try {
    await instance.post(`${import.meta.env.VITE_API_HOST}/api/v1/auth/sendAnEmailVerificationCode`, {
      email: email.value,
    })
    message.success('验证码已发送')
    isPasswordCodeSent.value = true
    startPasswordCountdown()
  }
  catch (error) {
    console.error('发送验证码失败:', error)
    message.error('发送验证码失败')
  }
}

// 修改密码
async function updatePassword() {
  if (!newPassword.value.trim() || !passwordVerificationCode.value.trim()) {
    message.error('密码和验证码不能为空')
    return
  }

  try {
    await instance.post(`${import.meta.env.VITE_API_HOST}/api/v1/user/changePassword`, {
      password: newPassword.value,
      code: passwordVerificationCode.value,
    })
    message.success('密码修改成功')

    // 清除所有 Cookie
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.split('=')
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    // 清除本地存储缓存
    localStorage.clear()
    sessionStorage.clear()

    // 跳转到登录页面
    window.location.href = '/login'
  }
  catch (error) {
    console.error('修改密码失败:', error)
    message.error('修改密码失败')
  }
}

// 开始邮箱验证码倒计时
function startEmailCountdown() {
  emailCountdown.value = 60
  emailCountdownInterval.value = setInterval(() => {
    if (emailCountdown.value > 0) {
      emailCountdown.value--
    }
    else {
      clearInterval(emailCountdownInterval.value)
      isEmailCodeSent.value = false
    }
  }, 1000)
}

// 开始密码验证码倒计时
function startPasswordCountdown() {
  passwordCountdown.value = 60
  passwordCountdownInterval.value = setInterval(() => {
    if (passwordCountdown.value > 0) {
      passwordCountdown.value--
    }
    else {
      clearInterval(passwordCountdownInterval.value)
      isPasswordCodeSent.value = false
    }
  }, 1000)
}

// 页面加载时获取数据
onBeforeMount(async () => {
  await loadAvatar()
  await loadUsername()
  await loadEmail()
})

// 处理文件选择
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        displayImage.value = e.target.result as string // 更新裁剪框为新图片
      }
    }
    reader.readAsDataURL(file)
  }
}

// 上传裁剪后的头像
async function uploadAvatar() {
  if (!cropper.value)
    return

  const { canvas } = cropper.value.getResult()
  if (!canvas) {
    message.error('请先选择并裁剪图片')
    return
  }

  canvas.toBlob(async (blob: Blob | null) => {
    if (!blob) {
      message.error('图片转换失败')
      return
    }

    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.webp')

    try {
      await instance.put(`${import.meta.env.VITE_API_HOST}/api/v1/user/uploadAvatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      message.success('头像上传成功')

      // **重新获取新的头像**
      await loadAvatar() // ✅ 直接调用 loadAvatar 重新获取头像 URL
    }
    catch (error) {
      console.error('上传头像失败:', error)
      message.error('上传头像失败')
    }
  }, 'image/webp')
}

// 注销相关
const deactivatePassword = ref('') // 注销密码
const deactivateVerificationCode = ref('') // 注销验证码
const isDeactivateCodeSent = ref(false) // 是否已发送注销验证码
const deactivateCountdown = ref(0) // 注销验证码倒计时
const deactivateCountdownInterval = ref<any>(null) // 注销验证码倒计时定时器

// 发送注销验证码
async function sendDeactivateVerificationCode() {
  if (!email.value.trim()) {
    message.error('请先加载邮箱地址')
    return
  }

  try {
    await instance.post(`${import.meta.env.VITE_API_HOST}/api/v1/auth/sendAnEmailVerificationCode`, {
      email: email.value,
    })
    message.success('验证码已发送')
    isDeactivateCodeSent.value = true
    startDeactivateCountdown()
  }
  catch (error) {
    console.error('发送验证码失败:', error)
    message.error('发送验证码失败')
  }
}

// 开始注销验证码倒计时
function startDeactivateCountdown() {
  deactivateCountdown.value = 60
  deactivateCountdownInterval.value = setInterval(() => {
    if (deactivateCountdown.value > 0) {
      deactivateCountdown.value--
    }
    else {
      clearInterval(deactivateCountdownInterval.value)
      isDeactivateCodeSent.value = false
    }
  }, 1000)
}

// 注销账户
async function deactivateUser() {
  if (!deactivatePassword.value.trim() || !deactivateVerificationCode.value.trim()) {
    message.error('密码和验证码不能为空')
    return
  }

  try {
    await instance.delete(`${import.meta.env.VITE_API_HOST}/api/v1/user/deactivateUser`, {
      data: {
        password: deactivatePassword.value,
        code: deactivateVerificationCode.value,
      },
    })
    message.success('账户注销成功')

    // 清除所有 Cookie
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.split('=')
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    // 清除本地存储缓存
    localStorage.clear()
    sessionStorage.clear()

    // 跳转到登录页面
    window.location.href = '/login'
  }
  catch (error) {
    console.error('注销账户失败:', error)
    message.error('注销账户失败')
  }
}
function redirectToDashboard() {
  window.location.href = '/dashboard/home'
}
</script>

<template>
  <NFlex justify="center" class="container">
    <NLayout class="layout">
      <NLayoutHeader class="header">
        <h1>个人信息</h1>
        <NButton type="default" @click="redirectToDashboard">
          退出设置
        </NButton>
      </NLayoutHeader>
      <NLayout has-sider>
        <NLayoutSider bordered class="sider">
          <NMenu v-model:value="activeKey" :options="menuOptions" class="menu" />
        </NLayoutSider>

        <!-- 内容区域 -->
        <NLayoutContent class="content">
          <div v-if="activeKey === 'avatar'" class="avatar-section">
            <h2>头像设置</h2>
            <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="handleFileChange">

            <!-- 裁剪框始终可见 -->
            <Cropper
              ref="cropper"
              :src="displayImage"
              class="cropper"
              :stencil-props="{ aspectRatio: 1 }"
            />

            <!-- 按钮居中 -->
            <NFlex justify="center" class="button-group">
              <NButton type="primary" @click="fileInput?.click()">
                选择图片
              </NButton>
              <NButton type="primary" @click="uploadAvatar">
                上传头像
              </NButton>
            </NFlex>
          </div>

          <div v-else-if="activeKey === 'info'" class="info-section">
            <h2>基本信息</h2>
            <div class="form-group">
              <!-- 用户名 -->
              <NInputGroup>
                <NInput v-model:value="newUsername" placeholder="用户名" />
                <NButton type="primary" @click="updateUsername">
                  修改
                </NButton>
              </NInputGroup>

              <!-- 修改邮箱 -->
              <NInputGroup class="input-group">
                <NInput v-model:value="newEmail" placeholder="邮箱" />
                <NInput v-model:value="emailVerificationCode" placeholder="验证码" :disabled="!isEmailCodeSent" />
                <NButton
                  v-if="!isEmailCodeSent"
                  type="primary"
                  :disabled="newEmail === email"
                  @click="sendEmailVerificationCode"
                >
                  获取验证码
                </NButton>
                <NButton v-else type="primary" :disabled="emailCountdown > 0" @click="sendEmailVerificationCode">
                  {{ emailCountdown > 0 ? `${emailCountdown}秒后重试` : '重新获取' }}
                </NButton>
                <NButton type="primary" :disabled="!isEmailCodeSent" @click="updateEmail">
                  修改邮箱
                </NButton>
              </NInputGroup>

              <!-- 修改密码 -->
              <NInputGroup class="input-group">
                <NInput v-model:value="newPassword" type="password" placeholder="新密码" />
                <NInput v-model:value="passwordVerificationCode" placeholder="验证码" :disabled="!isPasswordCodeSent" />
                <NButton
                  v-if="!isPasswordCodeSent"
                  type="primary"
                  @click="sendPasswordVerificationCode"
                >
                  获取验证码
                </NButton>
                <NButton v-else type="primary" :disabled="passwordCountdown > 0" @click="sendPasswordVerificationCode">
                  {{ passwordCountdown > 0 ? `${passwordCountdown}秒后重试` : '重新获取' }}
                </NButton>
                <NButton type="primary" :disabled="!isPasswordCodeSent" @click="updatePassword">
                  修改密码
                </NButton>
              </NInputGroup>

              <!-- 注销账户 -->
              <NInputGroup class="input-group">
                <NInput v-model:value="deactivatePassword" type="password" placeholder="密码" />
                <NInput v-model:value="deactivateVerificationCode" placeholder="验证码" :disabled="!isDeactivateCodeSent" />
                <NButton
                  v-if="!isDeactivateCodeSent"
                  type="warning"
                  @click="sendDeactivateVerificationCode"
                >
                  获取验证码
                </NButton>
                <NButton v-else type="warning" :disabled="deactivateCountdown > 0" @click="sendDeactivateVerificationCode">
                  {{ deactivateCountdown > 0 ? `${deactivateCountdown}秒后重试` : '重新获取' }}
                </NButton>
                <NButton type="warning" :disabled="!isDeactivateCodeSent" @click="deactivateUser">
                  注销账户
                </NButton>
              </NInputGroup>
            </div>
          </div>
        </NLayoutContent>
      </NLayout>
    </NLayout>
  </NFlex>
</template>

<style scoped>
.container {
  padding: 20px;
}

.layout {
  width: 60%;
  max-width: 800px;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
}

.sider {
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
}

.menu {
  margin-top: 20px;
}

.content {
  padding: 20px;
  background-color: #ffffff;
}

.avatar-section {
  text-align: center;
}

.file-input {
  display: none;
}

.cropper {
  margin-top: 20px;
  margin-bottom: 20px;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
}

.button-group {
  gap: 16px;
}

.info-section {
  text-align: left;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
