import React, { useState, useEffect, useRef } from 'react'
import { AutoComplete, Space, Tag } from 'antd'
import { UserOutlined, CloseCircleOutlined } from '@ant-design/icons'
import request from '../utils/request'

/**
 * 统一用户搜索选择组件
 * 输入框+下拉列表，支持通过关键词实时查询用户名或邮箱
 *
 * @param {string} value - 当前选中的用户ID
 * @param {function} onChange - 选中用户的回调 (user) => void，user包含 {userId, username, email}
 * @param {string} placeholder - 输入框占位文本
 */
const UserSelect = ({ value, onChange, placeholder = '搜索用户(用户名/邮箱)' }) => {
  const [options, setOptions] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const searchTimeoutRef = useRef(null)

  // 根据value加载已选用户信息
  useEffect(() => {
    if (value && !selectedUser) {
      fetchUserById(value)
    }
  }, [value])

  // 根据ID获取用户信息
  const fetchUserById = async userId => {
    try {
      const res = await request({
        url: `/boss/api/user/${userId}`,
        method: 'get',
      })
      if (res.data) {
        setSelectedUser(res.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  // 搜索用户
  const searchUsers = async searchKeyword => {
    if (!searchKeyword.trim()) {
      setOptions([])
      return
    }
    setSearching(true)
    try {
      const res = await request({
        url: '/boss/api/user/list',
        method: 'get',
        params: {
          keyword: searchKeyword,
          pageNum: 1,
          pageSize: 20,
        },
      })
      if (res.data) {
        const userList = res.data || []
        setOptions(
          userList.map(user => ({
            value: user.userId,
            label: user.email,
            user,
          }))
        )
      }
    } catch (error) {
      console.error('搜索用户失败:', error)
    } finally {
      setSearching(false)
    }
  }

  // 输入变化时防抖搜索
  const handleSearch = val => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(val)
    }, 300)
  }

  // 选择用户
  const handleSelect = (userId, option) => {
    const user = option.user
    setSelectedUser(user)
    onChange(user)
  }

  // 清除选中
  const handleClear = e => {
    e.stopPropagation()
    setSelectedUser(null)
    setOptions([])
    onChange(null)
  }

  // 已选中用户时显示选中信息，否则显示搜索框
  if (selectedUser) {
    return (
      <Space size={4}>
        <Tag color="blue" icon={<UserOutlined />}>
          {selectedUser.username}
        </Tag>
        <span style={{ color: '#999', fontSize: 12 }}>{selectedUser.email}</span>
        <CloseCircleOutlined
          style={{ color: '#999', cursor: 'pointer' }}
          onClick={handleClear}
        />
      </Space>
    )
  }

  return (
    <AutoComplete
      style={{ width: 260 }}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      loading={searching}
      placeholder={placeholder}
      notFoundContent={null}
      allowClear
    />
  )
}

export default UserSelect
