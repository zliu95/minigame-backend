import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始种子数据创建...')

  // 创建默认管理员账户
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  })

  console.log('创建管理员账户:', admin)

  // 创建示例游戏
  const game1 = await prisma.game.upsert({
    where: { shortName: 'puzzle-game' },
    update: {},
    create: {
      name: '益智拼图',
      shortName: 'puzzle-game',
      description: '经典益智拼图游戏',
    },
  })

  const game2 = await prisma.game.upsert({
    where: { shortName: 'racing-game' },
    update: {},
    create: {
      name: '极速赛车',
      shortName: 'racing-game',
      description: '刺激的赛车竞速游戏',
    },
  })

  console.log('创建示例游戏:', { game1, game2 })

  // 创建示例玩家数据
  console.log('创建示例玩家数据...')
  
  const samplePlayers = [
    {
      gameId: game1.id,
      openid: 'wx_openid_001',
      nickname: '玩家小明',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      score: 1500.5,
      duration: 3600,
      platform: 'WECHAT' as const,
      location: '中国-北京市-北京市',
      detailsJson: {
        items_used: { hint: 3, skip: 1, boost: 2 },
        level_completed: 15,
        achievements: ['first_win', 'speed_master'],
        combo_max: 50,
      },
    },
    {
      gameId: game1.id,
      openid: 'dy_openid_001',
      nickname: '玩家小红',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong',
      score: 1200.0,
      duration: 2400,
      platform: 'DOUYIN' as const,
      location: '中国-上海市-上海市',
      detailsJson: {
        items_used: { hint: 5, skip: 0, boost: 1 },
        level_completed: 12,
        achievements: ['first_win'],
        combo_max: 35,
      },
    },
    {
      gameId: game2.id,
      openid: 'ios_openid_001',
      nickname: 'iOS玩家',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=iosplayer',
      score: 2000.8,
      duration: 4800,
      platform: 'IOS_APP' as const,
      location: '中国-广东省-深圳市',
      detailsJson: {
        items_used: { hint: 2, skip: 2, boost: 3 },
        level_completed: 20,
        achievements: ['first_win', 'speed_master', 'perfect_score'],
        combo_max: 80,
        accuracy: 0.95,
      },
    },
  ]

  for (const playerData of samplePlayers) {
    const player = await prisma.player.upsert({
      where: {
        gameId_openid_platform: {
          gameId: playerData.gameId,
          openid: playerData.openid,
          platform: playerData.platform,
        },
      },
      update: {
        nickname: playerData.nickname,
        avatarUrl: playerData.avatarUrl,
        score: playerData.score,
        duration: playerData.duration,
        location: playerData.location,
        detailsJson: playerData.detailsJson,
      },
      create: playerData,
    })
    console.log(`✓ 创建玩家: ${player.nickname} (${player.platform}) - 分数: ${player.score}`)
  }

  console.log('种子数据创建完成!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })