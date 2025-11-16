import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AdminLoginSchema, validateAndSanitize, sanitizeInput } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  try {
    const body = await request.json();
    
    // 验证和清理输入数据
    const validationResult = validateAndSanitize(AdminLoginSchema, body);
    if (!validationResult.success) {
      logger.warn('登录验证失败', {
        ip: clientIP,
        error: validationResult.error,
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        {
          success: false,
          message: validationResult.error,
        },
        { status: 400 }
      );
    }

    const { username, password } = validationResult.data;
    
    // 清理用户名（额外的安全措施）
    const cleanUsername = sanitizeInput(username);

    // 查找管理员用户
    const admin = await prisma.admin.findUnique({
      where: {
        username: cleanUsername,
      },
    });

    if (!admin) {
      logger.warn('登录失败 - 用户不存在', {
        username: cleanUsername,
        ip: clientIP,
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        {
          success: false,
          message: "用户名或密码错误",
        },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      logger.warn('登录失败 - 密码错误', {
        username: cleanUsername,
        ip: clientIP,
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        {
          success: false,
          message: "用户名或密码错误",
        },
        { status: 401 }
      );
    }

    // 登录成功
    logger.info('管理员登录成功', {
      username: cleanUsername,
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json({
      success: true,
      message: "登录成功",
      user: {
        id: admin.id,
        username: admin.username,
      },
    });

  } catch (error) {
    logger.error('登录API错误', {
      error: error instanceof Error ? error.message : String(error),
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
    });
    
    return NextResponse.json(
      {
        success: false,
        message: "服务器内部错误",
      },
      { status: 500 }
    );
  }
}