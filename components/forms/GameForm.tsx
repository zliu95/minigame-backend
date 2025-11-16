'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GameInput } from '@/lib/validations';

interface GameFormProps {
  initialData?: Partial<GameInput> & { id?: string };
  onSubmit: (data: GameInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GameForm({ initialData, onSubmit, onCancel, isLoading }: GameFormProps) {
  const [formData, setFormData] = useState<GameInput>({
    name: initialData?.name || '',
    shortName: initialData?.shortName || '',
    description: initialData?.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error: any) {
      if (error.details) {
        setErrors(error.details);
      } else {
        setErrors({ general: error.message || '提交失败，请重试' });
      }
    }
  };

  const handleChange = (field: keyof GameInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {errors.general}
        </div>
      )}

      <Input
        label="游戏名称"
        value={formData.name}
        onChange={handleChange('name')}
        error={errors.name}
        placeholder="请输入游戏名称"
        required
      />

      <Input
        label="英文简称"
        value={formData.shortName}
        onChange={handleChange('shortName')}
        error={errors.shortName}
        placeholder="请输入英文简称（只能包含字母、数字、下划线和连字符）"
        helperText="用于API调用和URL路径，创建后不建议修改"
        required
      />

      <div className="space-y-1">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          游戏描述
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={handleChange('description')}
          className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="请输入游戏描述（可选）"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          type="submit"
          loading={isLoading}
        >
          {initialData?.id ? '更新游戏' : '创建游戏'}
        </Button>
      </div>
    </form>
  );
}