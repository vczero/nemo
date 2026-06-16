import axios from 'axios'

const request = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    const res = response.data

    if (!res.success) {
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    // 分页结果: ResultDto<PageResultDto<T>>，value 中包含 list、total、pageNum、pageSize
    // 普通结果: ResultDto<T>，value 直接是数据
    const isPageResult = res.value && typeof res.value === 'object' && 'list' in res.value
    return {
      code: 0,
      data: isPageResult ? res.value.list : res.value,
      msg: res.message,
      total: isPageResult ? res.value.total : undefined,
      pageNum: isPageResult ? res.value.pageNum : undefined,
      pageSize: isPageResult ? res.value.pageSize : undefined,
    }
  },
  error => {
    console.error('Request error:', error)

    // 401 Unauthorized - token过期或无效，跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }

    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default request
