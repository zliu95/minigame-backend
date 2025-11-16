import { z } from 'zod';

// 安全的字符串验证（防止XSS和注入攻击）
const safeStringSchema = (maxLength: number) => z.string()
  .max(maxLength)
  .refine(
    (val) => !/<script|javascript:|data:|vbscript:|on\w+=/i.test(val),
    { message: '包含不安全的内容' }
  )
  .refine(
    (val) => !/[<>'"&]/.test(val) || val === val.replace(/[<>'"&]/g, ''),
    { message: '包含特殊字符' }
  );

// 游戏相关验证模式
export const GameSchema = z.object({
  name: safeStringSchema(100).min(1, '游戏名称不能为空'),
  shortName: z.string()
    .min(1, '英文简称不能为空')
    .max(20, '英文简称不能超过20个字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '英文简称只能包含字母、数字、下划线和连字符'),
  description: safeStringSchema(500).optional(),
});

export const UpdateGameSchema = GameSchema.extend({
  isActive: z.boolean().optional(),
}).partial();

// 玩家认证相关验证模式
export const PlayerAuthSchema = z.object({
  gameId: z.string().cuid({ message: '无效的游戏ID' }),
  platform: z.enum(['WECHAT', 'DOUYIN', 'IOS_APP', 'ANDROID_APP'], {
    message: '无效的平台类型',
  }),
  code: z.string().max(1000).optional(), // 限制code长度
  playerId: safeStringSchema(100).min(1, '玩家ID不能为空'),
  nickname: safeStringSchema(50).min(1, '昵称不能为空'),
  avatarUrl: z.string()
    .url({ message: '无效的头像URL' })
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: '头像URL必须使用HTTP或HTTPS协议' }
    )
    .optional(),
  location: z.object({
    country: safeStringSchema(50).optional(),
    province: safeStringSchema(50).optional(),
    city: safeStringSchema(50).optional(),
  }).optional(),
});

// 分值更新相关验证模式
export const UpdateScoreSchema = z.object({
  token: z.string().min(1, 'Token不能为空').max(1000, 'Token过长'),
  score: z.number()
    .int({ message: '分值必须是整数' })
    .min(0, '分值不能为负数')
    .max(999999999, '分值过大'), // 限制最大分值
  duration: z.number()
    .int({ message: '游戏时长必须是整数' })
    .min(0, '游戏时长不能为负数')
    .max(86400 * 365, '游戏时长不能超过一年'), // 限制最大游戏时长
  detailsJson: z.record(z.string(), z.any())
    .refine(
      (obj) => {
        const str = JSON.stringify(obj);
        return str.length <= 10000; // 限制details JSON大小
      },
      { message: '详情数据过大' }
    )
    .optional(),
});

// 管理员登录验证模式
export const AdminLoginSchema = z.object({
  username: z.string()
    .min(1, '用户名不能为空')
    .max(50, '用户名过长')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
  password: z.string()
    .min(1, '密码不能为空')
    .max(100, '密码过长'),
});

// 通用ID验证
export const IdSchema = z.string().cuid({ message: '无效的ID格式' });

// 分页参数验证
export const PaginationSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// 排行榜查询参数验证
export const LeaderboardQuerySchema = z.object({
  platform: z.enum(['WECHAT', 'DOUYIN', 'IOS_APP', 'ANDROID_APP']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).max(10000).default(0),
});

// 错误类型定义
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}

// 输入清理函数
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, '') // 移除危险字符
    .trim() // 移除首尾空格
    .slice(0, 1000); // 限制长度
}

// 验证辅助函数
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues;
      const firstError = issues[0];
      return { 
        success: false, 
        error: firstError?.message || '数据验证失败' 
      };
    }
    return { success: false, error: '数据验证失败' };
  }
}

// 类型导出
export type GameInput = z.infer<typeof GameSchema>;
export type UpdateGameInput = z.infer<typeof UpdateGameSchema>;
export type PlayerAuthInput = z.infer<typeof PlayerAuthSchema>;
export type UpdateScoreInput = z.infer<typeof UpdateScoreSchema>;
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type LeaderboardQueryInput = z.infer<typeof LeaderboardQuerySchema>;