'use client';

import { useState, useEffect } from 'react';
import { UpstreamAPI } from '@/services/api';
import Navbar from '@/app/components/navigation/Navbar';
import { 
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { AuthAPI } from '@/services/api';
import ModelProviderSelector from './components/ModelProviderSelector';
import { useTranslations } from 'next-intl';

export default function UpstreamConfig() {
  const t = useTranslations('app.upstream');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProviderSelector, setShowProviderSelector] = useState(false);

  // 加载所有模型配置
  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await UpstreamAPI.getAllModels();
      setModels(Object.entries(data).map(([name, config]) => ({
        name,
        ...config
      })));
      setError('');
    } catch (err) {
      setError('加载配置失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 检查用户权限
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const user = await AuthAPI.getCurrentUser();
        setIsAdmin(user?.role === 'admin');
      } catch (err) {
        console.error('获取用户信息失败:', err);
      }
    };
    checkUserRole();
  }, []);

  useEffect(() => {
    loadModels();
  }, []);

  // 创建新模型配置的模板
  const newModelTemplate = {
    name: '',
    type: 'openai',
    capabilities: ['chat'],
    load_balance: 'round_robin',
    endpoints: [{
      name: '',
      upstream_url: '',
      api_key: '',
      weight: 1,
      format: 'openai',
      status: true
    }]
  };

  // 处理添加新模型
  const handleAdd = () => {
    setShowProviderSelector(true);
  };

  // 处理供应商选择
  const handleProviderSelect = (provider) => {
    setSelectedModel({
      name: '',
      type: provider.name.toLowerCase(),
      capabilities: provider.capabilities.map(cap => cap.toLowerCase()),
      load_balance: 'round_robin',
      endpoints: [{
        name: '',
        upstream_url: provider.baseUrl,
        api_key: '',
        weight: 1,
        format: provider.name.toLowerCase(),
        status: true
      }]
    });
    setIsEditing(true);
  };

  // 处理编辑模型
  const handleEdit = (model) => {
    setSelectedModel(model);
    setIsEditing(true);
  };

  // 处理删除模型
  const handleDelete = async (modelName) => {
    if (!window.confirm(`确定要删除模型 ${modelName} 吗？`)) return;
    
    try {
      setLoading(true);
      await UpstreamAPI.deleteModel(modelName);
      setSuccess('模型已删除');
      loadModels();
    } catch (err) {
      setError('删除失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理保存模型配置
  const handleSave = async (modelData) => {
    try {
      setLoading(true);
      await UpstreamAPI.updateModel(modelData.name, modelData);
      setSuccess('配置已保存');
      setIsEditing(false);
      loadModels();
    } catch (err) {
      setError('保存失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 模型编辑表单组件
  const ModelForm = ({ model, onSave, onCancel }) => {
    const [formData, setFormData] = useState(model);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium mb-1">模型名称</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="请输入模型名称（curl发送至上游的模型名称）"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">类型</label>
          <input
            type="text"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">负载均衡</label>
          <select
            value={formData.load_balance}
            onChange={(e) => setFormData({...formData, load_balance: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="round_robin">Round Robin</option>
            <option value="random">Random</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">模型</label>
          {formData.endpoints.map((endpoint, index) => (
            <div key={index} className="p-4 border rounded mb-2">
              <input
                type="text"
                placeholder="负载名称（可任意填写如： gpt-4o-1， gpt-4o-2）等"
                value={endpoint.name}
                onChange={(e) => {
                  const newEndpoints = [...formData.endpoints];
                  newEndpoints[index] = {...endpoint, name: e.target.value};
                  setFormData({...formData, endpoints: newEndpoints});
                }}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="上游URL"
                value={endpoint.upstream_url}
                onChange={(e) => {
                  const newEndpoints = [...formData.endpoints];
                  newEndpoints[index] = {...endpoint, upstream_url: e.target.value};
                  setFormData({...formData, endpoints: newEndpoints});
                }}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="API Key"
                value={endpoint.api_key}
                onChange={(e) => {
                  const newEndpoints = [...formData.endpoints];
                  newEndpoints[index] = {...endpoint, api_key: e.target.value};
                  setFormData({...formData, endpoints: newEndpoints});
                }}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({
              ...formData,
              endpoints: [...formData.endpoints, {
                name: '',
                upstream_url: '',
                api_key: '',
                weight: 1,
                format: 'openai',
                status: true
              }]
            })}
            className="mt-2 px-4 py-2 bg-secondary text-secondary-foreground rounded"
          >
            添加模型
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            保存
          </button>
        </div>
      </form>
    );
  };

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* 标题栏 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={loadModels}
                disabled={loading}
                className="p-2 rounded hover:bg-accent"
                title={t('refresh')}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              {isAdmin && (
                <button
                  onClick={handleAdd}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  {t('actions.addModel')}
                </button>
              )}
            </div>
          </div>

          {/* 模型供应商选择器弹窗 */}
          <ModelProviderSelector
            isOpen={showProviderSelector}
            onClose={() => setShowProviderSelector(false)}
            onSelect={handleProviderSelect}
          />

          {/* 模型列表 */}
          {!isEditing && (
            <div className="bg-card rounded-lg shadow-sm border">
              <div className="grid grid-cols-1 gap-4 p-4">
                {models.map((model) => (
                  <div key={model.name} className="p-4 border rounded flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {model.type} - {t('modelCount', { count: model.endpoints.length })}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(model)}
                          className="p-2 rounded hover:bg-accent"
                          title={t('actions.edit')}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(model.name)}
                          className="p-2 rounded hover:bg-accent text-destructive"
                          title={t('actions.delete')}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 编辑表单 */}
          {isAdmin && isEditing && selectedModel && !showProviderSelector && (
            <div className="bg-card rounded-lg shadow-sm border">
              <ModelForm
                model={selectedModel}
                onSave={handleSave}
                onCancel={() => {
                  setIsEditing(false);
                  setSelectedModel(null);
                }}
              />
            </div>
          )}

          {/* 提示消息 */}
          {error && (
            <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
              {success}
            </div>
          )}
        </div>
      </main>
    </>
  );
} 