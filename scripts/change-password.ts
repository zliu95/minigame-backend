#!/usr/bin/env tsx

/**
 * 修改管理员密码
 * 使用方法：
 *   npm run admin:password
 *   或
 *   tsx scripts/change-password.ts [username]
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function questionPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin
    const stdout = process.stdout
    
    stdout.write(prompt)
    
    if ((stdin as any).setRawMode) {
      (stdin as any).setRawMode(true)
    }
    
    let password = ''
    
    stdin.on('data', function onData(char: Buffer) {
      const str = char.toString('utf-8')
      
      switch (str) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.removeListener('data', onData)
          if ((stdin as any).setRawMode) {
            (stdin as any).setRawMode(false)
          }
          stdout.write('\n')
          resolve(password)
          break
        case '\u0003':
          process.exit()
          break
        case '\u007f':
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
  console.log('🔑 修改管理员密码')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  try {
    // 获取用户名（从命令行参数或提示输入）
    let username = process.argv[2]
    
    if (!username) {
      // 列出所有管理员
      const admins = await prisma.admin.findMany({
        select: { username: true },
      })

      if (admins.length === 0) {
        console.error('❌ 没有找到管理员账户')
        console.log('请先创建管理员: npm run admin:create')
        process.exit(1)
      }

      console.log('现有管理员:')
      admins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.username}`)
      })
      console.log('')

      username = await question('请输入要修改密码的用户名: ')
    }

    if (!username || username.trim().length === 0) {
      console.error('❌ 用户名不能为空')
      process.exit(1)
    }

    // 检查用户是否存在
    const admin = await prisma.admin.findUnique({
      where: { username: username.trim() },
    })

    if (!admin) {
      console.error(`❌ 用户 "${username}" 不存在`)
      process.exit(1)
    }

    console.log(`✅ 找到用户: ${admin.username}`)
    console.log('')

    // 获取新密码
    const newPassword = await questionPassword('请输入新密码（至少 6 个字符）: ')
    
    if (!newPassword || newPassword.length < 6) {
      console.error('❌ 密码至少需要 6 个字符')
      process.exit(1)
    }

    const confirmPassword = await questionPassword('请再次输入新密码: ')
    
    if (newPassword !== confirmPassword) {
      console.error('❌ 两次输入的密码不一致')
      process.exit(1)
    }

    console.log('')
    console.log('🔐 正在加密密码...')
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log('💾 正在更新数据库...')
    
    // 更新密码
    await prisma.admin.update({
      where: { username: admin.username },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 密码修改成功！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log(`用户 "${admin.username}" 的密码已更新`)
    console.log('')
    console.log('🚀 现在可以使用新密码登录：')
    console.log('   http://localhost:3000/login')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ 修改失败:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()
