#!/usr/bin/env tsx

/**
 * 列出所有管理员账户
 * 使用方法：
 *   npm run admin:list
 *   或
 *   tsx scripts/list-admins.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👥 管理员账户列表')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  try {
    const admins = await prisma.admin.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (admins.length === 0) {
      console.log('⚠️  没有找到管理员账户')
      console.log('')
      console.log('创建管理员账户：')
      console.log('  npm run admin:create')
      console.log('  或')
      console.log('  npm run db:seed')
      console.log('')
      return
    }

    console.log(`找到 ${admins.length} 个管理员账户：`)
    console.log('')

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username}`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   创建时间: ${admin.createdAt.toLocaleString('zh-CN')}`)
      console.log(`   更新时间: ${admin.updatedAt.toLocaleString('zh-CN')}`)
      console.log('')
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('管理操作：')
    console.log('  创建新管理员: npm run admin:create')
    console.log('  删除管理员: npm run admin:delete')
    console.log('  修改密码: npm run admin:password')
    console.log('')

  } catch (error) {
    console.error('❌ 查询失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
