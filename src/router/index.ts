import { createRouter, createWebHistory } from 'vue-router'
import { routes as autoRoutes } from 'vue-router/auto-routes'

// 添加重定向规则
const routes = [
  {
    path: '/',
    redirect: '/home', // 将根路径重定向到 /home
  },
  ...autoRoutes, // 保留自动生成的路由
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 导航守卫：检查 token 并重定向
router.beforeEach((to, from, next) => {
  // 判断路径是否为多级路径
  const isMultiLevelPath = to.path.split('/').filter(Boolean).length > 1

  // 获取 cookie 中的 token
  const token = getCookie('token')

  // 如果有 token 且访问的是 /login，则重定向到 /dashboard/home
  if (token && to.path === '/login') {
    return next('/dashboard/home')
  }

  // 如果是多级路径且没有 token，则重定向到 /login
  if (isMultiLevelPath && !token) {
    return next('/login')
  }

  // 否则继续导航
  next()
})

// 辅助函数：获取 cookie 中的值
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const result = parts.pop()?.split(';').shift()
    return result || null // 确保返回值不为 undefined
  }
  return null
}

export default router
