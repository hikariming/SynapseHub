const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3088/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? {
    ...defaultHeaders,
    'Authorization': `Bearer ${token}`
  } : defaultHeaders
}

const defaultHeaders = {
  'Content-Type': 'application/json'
}

export const AuthAPI = {
  // 检查是否存在管理员
  checkAdminExists: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/check-admin-exists`, {
      headers: defaultHeaders
    })
    if (!response.ok) throw new Error('检查管理员状态失败')
    return response.json()
  },

  // 登录
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ username, password })
    })
    
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '登录失败')
    }
    
    // 保存 token 到 localStorage
    localStorage.setItem('token', data.token)
    return data.user
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        localStorage.removeItem('token')
        return null
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      localStorage.removeItem('token')
      return null
    }
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token')
  },

  // 注册
  register: async (username, password, email) => {
    const response = await fetch(`${API_BASE_URL}/admin/register`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ username, password, email })
    })
    
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '注册失败')
    }
    
    return data.user
  }
}

export const UpstreamAPI = {
  // 获取所有模型配置
  getAllModels: async () => {
    const response = await fetch(`${API_BASE_URL}/upstream/models`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('获取模型配置失败')
    return response.json()
  },

  // 获取单个模型配置
  getModel: async (modelName) => {
    const response = await fetch(`${API_BASE_URL}/upstream/models/${modelName}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('获取模型配置失败')
    return response.json()
  },

  // 创建或更新模型配置
  updateModel: async (modelName, config) => {
    const response = await fetch(`${API_BASE_URL}/upstream/models/${modelName}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    })
    if (!response.ok) throw new Error('更新模型配置失败')
    return response.json()
  },

  // 删除模型配置
  deleteModel: async (modelName) => {
    const response = await fetch(`${API_BASE_URL}/upstream/models/${modelName}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('删除模型配置失败')
    return response.json()
  },

  // 更新模型模型状态
  updateEndpointStatus: async (modelName, endpointName, status) => {
    const response = await fetch(
      `${API_BASE_URL}/upstream/models/${modelName}/endpoints/${endpointName}/status`, 
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      }
    )
    if (!response.ok) throw new Error('更新模型状态失败')
    return response.json()
  },

  // 获取配置版本历史
  getHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/upstream/history`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('获取配置历史失败')
    return response.json()
  },

  // 重启服务
  restartService: async () => {
    const response = await fetch(`${API_BASE_URL}/upstream/config/restart`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('重启服务失败')
    return response.json()
  },

  // 获取服务状态
  getServiceStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/upstream/config/status`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('获取服务状态失败')
    return response.json()
  }
}

export const DashboardAPI = {
  // 获取统计数据
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('获取统计数据失败')
    return response.json()
  },

  // 获取趋势数据
  getTrends: async (days) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/trends/${days}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('获取趋势数据失败')
    return response.json()
  }
}

export const LogsAPI = {
  // 获取聊天日志列表
  getChatLogs: async (params) => {
    // 过滤掉 undefined 和空字符串的参数
    const validParams = Object.fromEntries(
      Object.entries({
        page: params.page || 1,
        limit: params.limit || 10,
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
        userId: params.userId,
        modelName: params.modelName,
        conversationId: params.conversationId
      }).filter(([_, value]) => value !== undefined && value !== '')
    );

    const queryString = new URLSearchParams(validParams).toString();
    const response = await fetch(`${API_BASE_URL}/logs/chat?${queryString}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取聊天日志失败');
    }
    
    return response.json();
  },

  // 获取聊天日志详情
  getChatLogDetail: async (logId) => {
    const response = await fetch(`${API_BASE_URL}/logs/chat/${logId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取聊天日志详情失败');
    }
    
    return response.json();
  },

  // 导出日志
  exportLogs: async (params) => {
    const validParams = Object.fromEntries(
      Object.entries({
        startDate: params?.startDate?.toISOString(),
        endDate: params?.endDate?.toISOString()
      }).filter(([_, value]) => value !== undefined && value !== '')
    );

    const queryString = new URLSearchParams(validParams).toString();
    const response = await fetch(`${API_BASE_URL}/logs/chat/export?${queryString}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '导出日志失败');
    }
    
    return response.json();
  },

  // 系统日志相关 API
  getSystemLogs: async (params) => {
    const validParams = Object.fromEntries(
      Object.entries({
        page: params.page || 1,
        limit: params.limit || 10,
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
        level: params.level,
        service: params.service,
        userId: params.userId
      }).filter(([_, value]) => value !== undefined && value !== '')
    );

    const queryString = new URLSearchParams(validParams).toString();
    const response = await fetch(`${API_BASE_URL}/logs/system?${queryString}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取系统日志失败');
    }
    
    return response.json();
  },

  getSystemLogDetail: async (logId) => {
    const response = await fetch(`${API_BASE_URL}/logs/system/${logId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取系统日志详情失败');
    }
    
    return response.json();
  },

  exportSystemLogs: async (params) => {
    const validParams = Object.fromEntries(
      Object.entries({
        startDate: params?.startDate?.toISOString(),
        endDate: params?.endDate?.toISOString(),
        level: params?.level
      }).filter(([_, value]) => value !== undefined && value !== '')
    );

    const queryString = new URLSearchParams(validParams).toString();
    const response = await fetch(`${API_BASE_URL}/logs/system/export?${queryString}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '导出系统日志失败');
    }
    
    return response.json();
  },

  clearSystemLogs: async (days) => {
    const response = await fetch(`${API_BASE_URL}/logs/system?days=${days}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '清理系统日志失败');
    }
    
    return response.json();
  }
}

// 用户管理 API
export const UserAPI = {
  // 管理员接口
  getUsers: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/users?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取用户列表失败');
    }
    
    return response.json();
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '创建用户失败');
    }
    
    return response.json();
  },

  updateUser: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新用户失败');
    }
    
    return response.json();
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '删除用户失败');
    }
    
    return response.status === 204 ? true : response.json();
  },

  // 用户个人接口
  getUserProfile: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取用户信息失败');
    }
    
    return response.json();
  },

  updateUserProfile: async (userId, profileData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新用户信息失败');
    }
    
    return response.json();
  },

  // Token 管理接口
  getAllTokens: async () => {
    const response = await fetch(`${API_BASE_URL}/users/tokens/all`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取所有Token失败');
    }
    
    return response.json();
  },

  getUserTokens: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/tokens`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取用户Token失败');
    }
    
    return response.json();
  },

  createToken: async (userId, tokenData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/tokens`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tokenData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '创建Token失败');
    }
    
    return response.json();
  },

  deactivateToken: async (userId, tokenId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/tokens/${tokenId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '停用Token失败');
    }
    
    return response.status === 204 ? true : response.json();
  }
};
