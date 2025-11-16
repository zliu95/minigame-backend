#!/usr/bin/env tsx

/**
 * 查看玩家数据
 * 使用方法：
 *   npm run players:view
 *   或
 *   tsx scripts/view-players.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎮 玩家数据列表')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  try {
    const players = await prisma.player.findMany({
      include: {
        game: {
          select: {
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: [
        { gameId: 'asc' },
        { score: 'desc' },
      ],
    })

    if (players.length === 0) {
      console.log('⚠️  没有找到玩家数据')
      console.log('')
      console.log('创建示例数据：')
      console.log('  npm run db:seed')
      console.log('')
      return
    }

    console.log(`找到 ${players.length} 条玩家记录：`)
    console.log('')

    // 按游戏分组显示
    const gameGroups = new Map<string, typeof players>()
    players.forEach(player => {
      const gameId = player.gameId
      if (!gameGroups.has(gameId)) {
        gameGroups.set(gameId, [])
      }
      gameGroups.get(gameId)!.push(player)
    })

    gameGroups.forEach((gamePlayers, gameId) => {
      const firstPlayer = gamePlayers[0]
      console.log(`📦 游戏: ${firstPlayer.game.name} (${firstPlayer.game.shortName})`)
      console.log('─'.repeat(60))
      
      gamePlayers.forEach((player, index) => {
        console.log(`${index + 1}. ${player.nickname}`)
        console.log(`   ID: ${player.id}`)
        console.log(`   OpenID: ${player.openid}`)
        console.log(`   平台: ${player.platform}`)
        console.log(`   分数: ${player.score}`)
        console.log(`   时长: ${player.duration}秒 (${Math.floor(player.duration / 60)}分钟)`)
        console.log(`   位置: ${player.location || '未知'}`)
        
        if (player.detailsJson) {
          console.log(`   详细数据:`)
          const details = player.detailsJson as any
          if (details.items_used) {
            console.log(`     道具使用: ${JSON.stringify(details.items_used)}`)
          }
          if (details.level_completed) {
            console.log(`     完成关卡: ${details.level_completed}`)
          }
          if (details.achievements) {
            console.log(`     成就: ${details.achievements.join(', ')}`)
          }
          if (details.combo_max) {
            console.log(`     最大连击: ${details.combo_max}`)
          }
        }
        
        console.log(`   创建时间: ${player.createdAt.toLocaleString('zh-CN')}`)
        console.log(`   更新时间: ${player.updatedAt.toLocaleString('zh-CN')}`)
        console.log('')
      })
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('统计信息：')
    
    const stats = await prisma.player.aggregate({
      _count: true,
      _avg: { score: true, duration: true },
      _max: { score: true },
      _min: { score: true },
    })
    
    console.log(`  总玩家数: ${stats._count}`)
    console.log(`  平均分数: ${stats._avg.score?.toFixed(2) || 0}`)
    console.log(`  最高分数: ${stats._max.score || 0}`)
    console.log(`  最低分数: ${stats._min.score || 0}`)
    console.log(`  平均时长: ${Math.floor((stats._avg.duration || 0) / 60)}分钟`)
    console.log('')
    
    // 按平台统计
    const platformStats = await prisma.player.groupBy({
      by: ['platform'],
      _count: true,
    })
    
    console.log('按平台统计：')
    platformStats.forEach(stat => {
      console.log(`  ${stat.platform}: ${stat._count} 人`)
    })
    console.log('')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('管理操作：')
    console.log('  查看数据: npx prisma studio')
    console.log('  创建数据: npm run db:seed')
    console.log('  重置数据: npm run db:reset')
    console.log('')

  } catch (error) {
    console.error('❌ 查询失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
