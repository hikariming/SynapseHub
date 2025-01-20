'use client'

import { useState, useEffect } from 'react'
import { UserAPI } from '@/services/api'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import NavbarClient from '@/app/components/navigation/NavbarClient'
import { 
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition
} from '@headlessui/react'
import { Fragment } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// 用户表单组件
const UserForm = ({ user, onSubmit, onClose }) => {
  const t = useTranslations('app.users.form')
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
            {t('username')}
          </label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">邮箱</label>
        <input
          type="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      {!user && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('password')}
          </label>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!user}
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">
            {t('role')}
          </label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="user">{t('roles.user')}</option>
          <option value="admin">{t('roles.admin')}</option>
        </select>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('submit')}
        </button>
      </div>
    </form>
  );
};

// Token表单组件
const TokenForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    expiresAt: '',
    allowedModels: [],
    balance: 0,
    description: '',
    neverExpire: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">名称</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">过期时间</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="neverExpire"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.neverExpire}
              onChange={(e) => setFormData({ ...formData, neverExpire: e.target.checked })}
            />
            <label htmlFor="neverExpire" className="ml-2 block text-sm text-gray-900">
              永不过期
            </label>
          </div>
        </div>
        {!formData.neverExpire && (
          <input
            type="datetime-local"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            required={!formData.neverExpire}
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">余额</label>
        <input
          type="number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.balance}
          onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
          required
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">允许访问的模型</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.allowedModels.join(',')}
          onChange={(e) => setFormData({ 
            ...formData, 
            allowedModels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          })}
          placeholder="输入模型名称，用逗号分隔"
        />
        <p className="mt-1 text-sm text-gray-500">留空表示允许访问所有模型</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">描述</label>
        <textarea
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="输入Token的用途描述"
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          取消
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          创建
        </button>
      </div>
    </form>
  );
};

export default function UsersPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('app.users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userTokens, setUserTokens] = useState({});

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await UserAPI.getUsers(page);
      setUsers(response.data);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取用户的Token列表
  const fetchUserTokens = async (userId) => {
    try {
      const tokens = await UserAPI.getUserTokens(userId);
      setUserTokens(prev => ({ ...prev, [userId]: tokens }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  // 创建用户
  const handleCreateUser = async (userData) => {
    try {
      await UserAPI.createUser(userData);
      toast.success(t('messages.createSuccess'));
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 更新用户
  const handleUpdateUser = async (userData) => {
    try {
      await UserAPI.updateUser(selectedUser._id, userData);
      toast.success(t('messages.updateSuccess'));
      setIsUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId) => {
    if (!confirm(t('messages.deleteConfirm'))) return;
    
    try {
      await UserAPI.deleteUser(userId);
      toast.success(t('messages.deleteSuccess'));
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 创建Token
  const handleCreateToken = async (tokenData) => {
    try {
      await UserAPI.createToken(selectedUserId, tokenData);
      toast.success(t('messages.tokenCreateSuccess'));
      setIsTokenModalOpen(false);
      fetchUserTokens(selectedUserId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 停用Token
  const handleDeactivateToken = async (userId, tokenId) => {
    if (!confirm('确定要停用此Token吗？')) return;
    
    try {
      await UserAPI.deactivateToken(userId, tokenId);
      toast.success('Token停用成功');
      fetchUserTokens(userId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 to-white">
      <NavbarClient currentLocale={locale} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">
                {t('title')}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                管理系统用户和他们的API Token
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setIsUserModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('actions.create')}
              </button>
            </div>
          </div>

          {/* 用户列表 */}
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          {t('table.username')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('table.role')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('table.createdAt')}
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">{t('table.actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user._id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {user.username}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {t('table.roleDisplay.' + user.role)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsUserModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-2"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* 分页 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('table.prev')}
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('table.next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('table.page', { page })}，
                  {t('table.totalPages', { totalPages })}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    {t('table.prev')}
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    {t('table.next')}
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* 用户表单弹窗 */}
          <Transition appear show={isUserModalOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50"
              onClose={() => setIsUserModalOpen(false)}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <DialogTitle
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 mb-4"
                      >
                        {selectedUser ? t('actions.edit') : t('actions.create')}
                      </DialogTitle>
                      <UserForm
                        user={selectedUser}
                        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
                        onClose={() => {
                          setIsUserModalOpen(false);
                          setSelectedUser(null);
                        }}
                      />
                    </DialogPanel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          {/* Token管理弹窗 */}
          <Transition appear show={isTokenModalOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50"
              onClose={() => setIsTokenModalOpen(false)}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <DialogTitle
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 mb-4"
                      >
                        Token管理
                      </DialogTitle>
                      
                      {/* Token列表 */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-base font-medium text-gray-900">Token列表</h4>
                          <button
                            onClick={() => setIsTokenModalOpen(true)}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            创建Token
                          </button>
                        </div>
                        
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  名称
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  余额
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  过期时间
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  状态
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                  <span className="sr-only">操作</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {userTokens[selectedUserId]?.map((token) => (
                                <tr key={token._id}>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                    {token.name}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {token.balance}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {new Date(token.expires_at).toLocaleString()}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <span
                                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                        token.is_active
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {token.is_active ? '活跃' : '已停用'}
                                    </span>
                                  </td>
                                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    {token.is_active && (
                                      <button
                                        onClick={() => handleDeactivateToken(selectedUserId, token._id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        停用
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Token创建表单 */}
                      <div className="mt-6">
                        <h4 className="text-base font-medium text-gray-900 mb-4">创建新Token</h4>
                        <TokenForm
                          onSubmit={handleCreateToken}
                          onClose={() => setIsTokenModalOpen(false)}
                        />
                      </div>
                    </DialogPanel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </main>
    </div>
  );
}
