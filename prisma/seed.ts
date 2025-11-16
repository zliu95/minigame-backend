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
  const samplePlayers = [
    {
      gameId: game1.id,
      nickname: '玩家小明',
      playerId: 'wx_player_001',
      avatarUrl: 'https://example.com/avatar1.jpg',
      score: 1500,
      playTime: 3600,
      platform: 'WECHAT' as const,
      openId: 'wx_openid_001',
      location: {
        country: '中国',
        province: '北京市',
        city: '北京市',
      },
    },
    {
      gameId: game1.id,
      nickname: '玩家小红',
      playerId: 'dy_player_001',
      avatarUrl: 'https://example.com/avatar2.jpg',
      score: 1200,
      playTime: 2400,
      platform: 'DOUYIN' as const,
      openId: 'dy_openid_001',
      location: {
        country: '中国',
        province: '上海市',
        city: '上海市',
      },
    },
    {
      gameId: game2.id,
      nickname: 'iOS玩家',
      playerId: 'ios_player_001',
      avatarUrl: 'https://example.com/avatar3.jpg',
      score: 2000,
      playTime: 4800,
      platform: 'IOS_APP' as const,
      location: {
        country: '中国',
        province: '广东省',
        city: '深圳市',
      },
    },
  ]

  for (const playerData of samplePlayers) {
    const player = await prisma.player.upsert({
      where: {
        gameId_platform_playerId: {
          gameId: playerData.gameId,
          platform: playerData.platform,
          playerId: playerData.playerId,
        },
      },
      update: {},
      create: playerData,
    })
    console.log('创建示例玩家:', player.nickname)
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