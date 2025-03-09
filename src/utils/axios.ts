import axios from 'axios'
import Cookies from 'js-cookie' // 引入 js-cookie

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_HOST, // 你的后端 API 地址
  withCredentials: true, // 允许携带 Cookie
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') // 获取 token
    if (token) {
      config.headers.Authorization = `Bearer ${token}` // 设置 Authorization 头
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default instance
