import crypto from 'crypto';

// 加密配置
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * 获取加密密钥
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY环境变量未设置');
  }
  
  // 如果密钥长度不够，使用PBKDF2派生
  if (key.length < KEY_LENGTH) {
    return crypto.pbkdf2Sync(key, 'salt', 100000, KEY_LENGTH, 'sha256');
  }
  
  return Buffer.from(key.slice(0, KEY_LENGTH));
}

/**
 * 加密敏感数据
 */
export function encryptSensitiveData(data: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // 组合IV、tag和加密数据
    const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    return result;
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('数据加密失败');
  }
}

/**
 * 解密敏感数据
 */
export function decryptSensitiveData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('无效的加密数据格式');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from('additional-data'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('数据解密失败');
  }
}

/**
 * 生成安全的随机token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 创建数据哈希
 */
export function createDataHash(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha256');
  return actualSalt + ':' + hash.toString('hex');
}

/**
 * 验证数据哈希
 */
export function verifyDataHash(data: string, hash: string): boolean {
  try {
    const parts = hash.split(':');
    if (parts.length !== 2) {
      return false;
    }
    
    const salt = parts[0];
    const originalHash = parts[1];
    const newHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha256').toString('hex');
    
    return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(newHash));
  } catch (error) {
    return false;
  }
}

/**
 * 加密JSON对象
 */
export function encryptJsonData(data: Record<string, any>): string {
  const jsonString = JSON.stringify(data);
  return encryptSensitiveData(jsonString);
}

/**
 * 解密JSON对象
 */
export function decryptJsonData(encryptedData: string): Record<string, any> {
  const jsonString = decryptSensitiveData(encryptedData);
  return JSON.parse(jsonString);
}

/**
 * 安全地比较两个字符串（防止时序攻击）
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * 生成API密钥
 */
export function generateApiKey(): string {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `ak_${timestamp}_${randomBytes}`;
}

/**
 * 验证API密钥格式
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  const pattern = /^ak_\d+_[a-f0-9]{32}$/;
  return pattern.test(apiKey);
}