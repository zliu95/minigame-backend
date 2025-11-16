/**
 * 外部API集成服务
 * 处理微信、抖音、iOS Game Center等平台的API调用
 */

import { Platform } from '@prisma/client';
import { logger } from './logger';

// 微信API相关类型
interface WeChatUserInfo {
  openid: string;
  nickname: string;
  headimgurl: string;
  country?: string;
  province?: string;
  city?: string;
}

interface WeChatTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
}

// 抖音API相关类型
interface DouyinUserInfo {
  open_id: string;
  union_id?: string;
  nickname: string;
  avatar: string;
  country?: string;
  province?: string;
  city?: string;
}

interface DouyinTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  open_id: string;
  scope: string;
}

// iOS Game Center相关类型
interface GameCenterPlayerInfo {
  playerId: string;
  displayName: string;
  alias?: string;
}

// 统一的玩家信息接口
export interface ExternalPlayerInfo {
  playerId: string;
  nickname: string;
  avatarUrl?: string;
  location?: {
    country?: string;
    province?: string;
    city?: string;
  };
}

// API错误类型
export class ExternalApiError extends Error {
  constructor(
    message: string,
    public platform: Platform,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

/**
 * 微信API服务
 */
export class WeChatApiService {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor() {
    this.appId = process.env.WECHAT_APP_ID || '';
    this.appSecret = process.env.WECHAT_APP_SECRET || '';

    if (!this.appId || !this.appSecret) {
      throw new Error('WeChat API credentials not configured');
    }
  }

  /**
   * 通过code获取access_token和openid
   */
  private async getAccessToken(code: string): Promise<WeChatTokenResponse> {
    const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
    const params = new URLSearchParams({
      appid: this.appId,
      secret: this.appSecret,
      code,
      grant_type: 'authorization_code',
    });

    const startTime = Date.now();
    logger.info('WeChat API: Getting access token', { code: code.slice(0, 8) + '...' });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        logger.externalApi('WeChat', 'access_token', response.status, duration);
        throw new ExternalApiError(
          `WeChat API request failed: ${response.status}`,
          Platform.WECHAT,
          response.status
        );
      }

      const data = await response.json();

      if (data.errcode) {
        logger.externalApi('WeChat', 'access_token', data.errcode, duration, new Error(data.errmsg));
        throw new ExternalApiError(
          `WeChat API error: ${data.errmsg}`,
          Platform.WECHAT,
          data.errcode,
          data
        );
      }

      logger.externalApi('WeChat', 'access_token', 200, duration);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error instanceof ExternalApiError) {
        throw error;
      }
      logger.externalApi('WeChat', 'access_token', undefined, duration, error as Error);
      throw new ExternalApiError(
        `WeChat API network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Platform.WECHAT,
        undefined,
        error
      );
    }
  }

  /**
   * 获取用户信息
   */
  private async getUserInfo(accessToken: string, openid: string): Promise<WeChatUserInfo> {
    const url = 'https://api.weixin.qq.com/sns/userinfo';
    const params = new URLSearchParams({
      access_token: accessToken,
      openid,
      lang: 'zh_CN',
    });

    const startTime = Date.now();
    logger.info('WeChat API: Getting user info', { openid: openid.slice(0, 8) + '...' });

    try {
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        logger.externalApi('WeChat', 'userinfo', response.status, duration);
        throw new ExternalApiError(
          `WeChat userinfo request failed: ${response.status}`,
          Platform.WECHAT,
          response.status
        );
      }

      const data = await response.json();

      if (data.errcode) {
        logger.externalApi('WeChat', 'userinfo', data.errcode, duration, new Error(data.errmsg));
        throw new ExternalApiError(
          `WeChat userinfo error: ${data.errmsg}`,
          Platform.WECHAT,
          data.errcode,
          data
        );
      }

      logger.externalApi('WeChat', 'userinfo', 200, duration);
      logger.info('WeChat user info retrieved', { nickname: data.nickname });
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error instanceof ExternalApiError) {
        throw error;
      }
      logger.externalApi('WeChat', 'userinfo', undefined, duration, error as Error);
      throw new ExternalApiError(
        `WeChat userinfo network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Platform.WECHAT,
        undefined,
        error
      );
    }
  }

  /**
   * 验证微信用户并获取用户信息
   */
  async verifyUser(code: string): Promise<ExternalPlayerInfo> {
    try {
      // 获取access_token
      const tokenResponse = await this.getAccessToken(code);

      // 获取用户信息
      const userInfo = await this.getUserInfo(tokenResponse.access_token, tokenResponse.openid);

      return {
        playerId: userInfo.openid,
        nickname: userInfo.nickname,
        avatarUrl: userInfo.headimgurl,
        location: {
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city,
        },
      };
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }
      throw new ExternalApiError(
        `WeChat verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Platform.WECHAT,
        undefined,
        error
      );
    }
  }
}/**
 * 抖音
API服务
 */
export class DouyinApiService {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor() {
    this.appId = process.env.DOUYIN_APP_ID || '';
    this.appSecret = process.env.DOUYIN_APP_SECRET || '';

    if (!this.appId || !this.appSecret) {
      throw new Error('Douyin API credentials not configured');
    }
  }

  /**
   * 通过code获取access_token和open_id
   */
  private async getAccessToken(code: string): Promise<DouyinTokenResponse> {
    const url = 'https://developer.toutiao.com/api/apps/v2/jscode2session';

    const body = {
      appid: this.appId,
      secret: this.appSecret,
      code,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new ExternalApiError(
          `Douyin API request failed: ${response.status}`,
          Platform.DOUYIN,
          response.status
        );
      }

      const data = await response.json();

      if (data.err_no !== 0) {
        throw new ExternalApiError(
          `Douyin API error: ${data.err_tips}`,
          Platform.DOUYIN,
          data.err_no,
          data
        );
      }

      return {
        access_token: data.session_key,
        expires_in: 7200,
        refresh_token: '',
        open_id: data.openid,
        scope: '',
      };
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }
      throw new ExternalApiError(
        `Douyin API network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Platform.DOUYIN,
        undefined,
        error
      );
    }
  }

  /**
   * 获取用户信息（抖音小程序通常需要前端传递用户信息）
   */
  async verifyUser(code: string, userInfo?: Partial<DouyinUserInfo>): Promise<ExternalPlayerInfo> {
    try {
      // 获取session_key和openid
      const tokenResponse = await this.getAccessToken(code);

      // 抖音小程序的用户信息通常由前端提供
      return {
        playerId: tokenResponse.open_id,
        nickname: userInfo?.nickname || '抖音用户',
        avatarUrl: userInfo?.avatar,
        location: {
          country: userInfo?.country,
          province: userInfo?.province,
          city: userInfo?.city,
        },
      };
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }
      throw new ExternalApiError(
        `Douyin verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Platform.DOUYIN,
        undefined,
        error
      );
    }
  }
}

/**
 * iOS Game Center服务
 */
export class GameCenterService {
  /**
   * 验证iOS Game Center玩家
   * 注意：实际的Game Center验证需要Apple的验证服务器
   * 这里提供基础的验证框架
   */
  async verifyPlayer(
    playerId: string,
    publicKeyUrl?: string,
    signature?: string,
    salt?: string,
    timestamp?: number
  ): Promise<ExternalPlayerInfo> {
    try {
      // 基础验证：检查playerId格式
      if (!playerId || typeof playerId !== 'string') {
        throw new ExternalApiError(
          'Invalid Game Center player ID',
          Platform.IOS_APP
        );
      }

      // 在实际应用中，这里应该：
      // 1. 验证Apple提供的签名
      // 2. 检查公钥证书
      // 3. 验证时间戳
      // 4. 调用Apple的验证服务

      // 目前返回基础的玩家信息
      return {
        playerId,
        nickname: `iOS玩家_${playerId.slice(-6)}`, // 使用playerId后6位作为默认昵称
        avatarUrl: undefined, // Game Center不提供头像URL
        location: undefined, // Game Center不提供位置信息
      };
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }
      throw new ExternalApiError(
        `Game Center verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Platform.IOS_APP,
        undefined,
        error
      );
    }
  }
}

/**
 * 外部API服务工厂
 */
export class ExternalApiFactory {
  private static wechatService: WeChatApiService | null = null;
  private static douyinService: DouyinApiService | null = null;
  private static gameCenterService: GameCenterService | null = null;

  /**
   * 获取微信API服务实例
   */
  static getWeChatService(): WeChatApiService {
    if (!this.wechatService) {
      this.wechatService = new WeChatApiService();
    }
    return this.wechatService;
  }

  /**
   * 获取抖音API服务实例
   */
  static getDouyinService(): DouyinApiService {
    if (!this.douyinService) {
      this.douyinService = new DouyinApiService();
    }
    return this.douyinService;
  }

  /**
   * 获取Game Center服务实例
   */
  static getGameCenterService(): GameCenterService {
    if (!this.gameCenterService) {
      this.gameCenterService = new GameCenterService();
    }
    return this.gameCenterService;
  }

  /**
   * 根据平台类型验证用户
   */
  static async verifyUserByPlatform(
    platform: Platform,
    code?: string,
    playerId?: string,
    userInfo?: any
  ): Promise<ExternalPlayerInfo> {
    switch (platform) {
      case Platform.WECHAT:
        if (!code) {
          throw new ExternalApiError('WeChat code is required', platform);
        }
        return this.getWeChatService().verifyUser(code);

      case Platform.DOUYIN:
        if (!code) {
          throw new ExternalApiError('Douyin code is required', platform);
        }
        return this.getDouyinService().verifyUser(code, userInfo);

      case Platform.IOS_APP:
        if (!playerId) {
          throw new ExternalApiError('Game Center player ID is required', platform);
        }
        return this.getGameCenterService().verifyPlayer(
          playerId,
          userInfo?.publicKeyUrl,
          userInfo?.signature,
          userInfo?.salt,
          userInfo?.timestamp
        );

      case Platform.ANDROID_APP:
        // Android应用可以直接使用提供的playerId
        if (!playerId) {
          throw new ExternalApiError('Android player ID is required', platform);
        }
        return {
          playerId,
          nickname: userInfo?.nickname || `Android玩家_${playerId.slice(-6)}`,
          avatarUrl: userInfo?.avatarUrl,
          location: userInfo?.location,
        };

      default:
        throw new ExternalApiError(`Unsupported platform: ${platform}`, platform);
    }
  }
}