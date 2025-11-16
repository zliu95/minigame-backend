#!/usr/bin/env tsx

/**
 * 创建管理员账户脚本
 * 使用方法：
 *   npm run admin:create
 *   或
 *   tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// 提示输入
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

// 隐藏密码输入
function questionPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin
    const stdout = process.stdout
    
    stdout.write(prompt)
    
    // 隐藏输入
    if ((stdin as any).setRawMode) {
      (stdin as any).setRawMode(true)
    }
    
    let password = ''
    
    stdin.on('data', function onData(char: Buffer) {
      const str = char.toString('utf-8')
      
      switch (str) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.removeListener('data', onData)
          if ((stdin as any).setRawMode) {
            (stdin as any).setRawMode(false)
          }
          stdout.write('\n')
          resolve(password)
          break
        case '\u0003': // Ctrl+C
          process.exit()
          break
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1)
            stdout.write('\b \b')
          }
          break
        default:
          password += str
          stdout.write('*')
          break
      }
    })
  })
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 创建管理员账户')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  try {
    // 获取用户名
    const username = await question('请输入用户名: ')
    
    if (!username || username.trim().length < 3) {
      console.error('❌ 用户名至少需要 3 个字符')
      process.exit(1)
    }

    // 检查用户名是否已存在
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: username.trim() },
    })

    if (existingAdmin) {
      console.log('')
      console.log('⚠️  用户名已存在！')
      const overwrite = await question('是否覆盖现有账户？(y/n): ')
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ 已取消')
        process.exit(0)
      }
    }

    // 获取密码
    console.log('')
    const password = await questionPassword('请输入密码（至少 6 个字符）: ')
    
    if (!password || password.length < 6) {
      console.error('❌ 密码至少需要 6 个字符')
      process.exit(1)
    }

    const confirmPassword = await questionPassword('请再次输入密码: ')
    
    if (password !== confirmPassword) {
      console.error('❌ 两次输入的密码不一致')
      process.exit(1)
    }

    console.log('')
    console.log('🔐 正在加密密码...')
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('💾 正在保存到数据库...')
    
    // 创建或更新管理员
    const admin = await prisma.admin.upsert({
      where: { username: username.trim() },
      update: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
      create: {
        username: username.trim(),
        password: hashedPassword,
      },
    })

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 管理员账户创建成功！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('账户信息：')
    console.log(`  用户名: ${admin.username}`)
    console.log(`  ID: ${admin.id}`)
    console.log(`  创建时间: ${admin.createdAt.toLocaleString('zh-CN')}`)
    console.log(`  更新时间: ${admin.updatedAt.toLocaleString('zh-CN')}`)
    console.log('')
    console.log('🚀 现在可以使用此账户登录：')
    console.log('   http://localhost:3000/login')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('')
    console.error('❌ 创建失败:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()
