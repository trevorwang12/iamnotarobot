export interface GameData {
  id: string
  name: string
  image: string
  rating: number
  description: string
  category: string
  playCount: number
  developer: string
  releaseDate: string
  features: string[]
  viewCount: number
  addedDate: string
}

export const allGames: GameData[] = [
  {
    id: "cut-the-rope",
    name: "Cut the Rope",
    image: "/cut-the-rope-game.png",
    rating: 4.5,
    description: "Cut the Rope是一款物理益智游戏。你的目标是切断绳子，让糖果落到Om Nom的嘴里。每个关卡都有独特的挑战，需要你运用物理知识和策略思维来解决难题。",
    category: "益智解谜",
    playCount: 1200000,
    developer: "ZeptoLab",
    releaseDate: "2010",
    features: ["物理引擎", "可爱角色", "创新玩法", "关卡丰富"],
    viewCount: 850000,
    addedDate: "2024-01-15"
  },
  {
    id: "subway-surfers",
    name: "Subway Surfers",
    image: "/subway-surfers-game.png",
    rating: 4.8,
    description: "Subway Surfers是一款无尽跑酷游戏。在地铁轨道上奔跑，躲避列车和障碍物，收集金币和道具。游戏节奏紧张刺激，操作简单易上手。",
    category: "跑酷竞速",
    playCount: 2800000,
    developer: "SYBO Games",
    releaseDate: "2012",
    features: ["无尽跑酷", "角色收集", "道具升级", "全球排行榜"],
    viewCount: 1500000,
    addedDate: "2024-02-10"
  },
  {
    id: "candy-crush",
    name: "Candy Crush",
    image: "/candy-crush-game.png",
    rating: 4.3,
    description: "Candy Crush是一款经典的三消游戏。通过交换相邻的糖果来创造三个或更多相同颜色的糖果组合。游戏关卡设计精巧，挑战性十足。",
    category: "消除益智",
    playCount: 5200000,
    developer: "King",
    releaseDate: "2012",
    features: ["三消玩法", "特殊道具", "社交功能", "每日挑战"],
    viewCount: 2100000,
    addedDate: "2024-01-20"
  },
  {
    id: "temple-run",
    name: "Temple Run",
    image: "/temple-run-game.png",
    rating: 4.6,
    description: "Temple Run是一款3D无尽跑酷游戏。你需要在古老的神庙中奔跑，躲避各种陷阱和障碍，收集宝石和金币。游戏画面精美，操作流畅。",
    category: "跑酷冒险",
    playCount: 3100000,
    developer: "Imangi Studios",
    releaseDate: "2011",
    features: ["3D画面", "手势控制", "角色升级", "成就系统"],
    viewCount: 1800000,
    addedDate: "2024-03-05"
  },
  {
    id: "fruit-ninja",
    name: "Fruit Ninja",
    image: "/fruit-ninja-game.png",
    rating: 4.4,
    description: "Fruit Ninja是一款切水果游戏。用手指滑动屏幕来切开飞舞的水果，避免切到炸弹。游戏操作简单，但想要获得高分需要技巧和策略。",
    category: "休闲娱乐",
    playCount: 4500000,
    developer: "Halfbrick Studios",
    releaseDate: "2010",
    features: ["触屏切割", "连击系统", "多种模式", "水果收集"],
    viewCount: 1200000,
    addedDate: "2024-02-28"
  },
  {
    id: "angry-birds",
    name: "Angry Birds",
    image: "/angry-birds-game.png",
    rating: 4.7,
    description: "Angry Birds是一款弹弓射击游戏。使用弹弓发射愤怒的小鸟来摧毁绿猪的建筑物。每种鸟类都有不同的特殊能力，需要合理运用。",
    category: "策略射击",
    playCount: 6800000,
    developer: "Rovio",
    releaseDate: "2009",
    features: ["弹弓射击", "物理引擎", "策略思考", "关卡编辑器"],
    viewCount: 2800000,
    addedDate: "2024-01-10"
  },
  {
    id: "plants-vs-zombies",
    name: "Plants vs Zombies",
    image: "/plants-vs-zombies-game.png",
    rating: 4.9,
    description: "Plants vs Zombies是一款塔防策略游戏。在你的花园里种植各种植物来抵御僵尸的入侵。每种植物都有独特的攻击方式和特殊能力。",
    category: "塔防策略",
    playCount: 8200000,
    developer: "PopCap Games",
    releaseDate: "2009",
    features: ["塔防玩法", "植物收集", "策略布局", "剧情模式"],
    viewCount: 3200000,
    addedDate: "2024-01-05"
  },
  {
    id: "doodle-jump",
    name: "Doodle Jump",
    image: "/doodle-jump-game.png",
    rating: 4.2,
    description: "Doodle Jump是一款垂直跳跃游戏。控制可爱的小怪物不断向上跳跃，踩踏平台到达更高的地方。游戏简单有趣，容易上瘾。",
    category: "休闲跳跃",
    playCount: 2300000,
    developer: "Lima Sky",
    releaseDate: "2009",
    features: ["无尽跳跃", "道具收集", "手绘风格", "倾斜控制"],
    viewCount: 900000,
    addedDate: "2024-03-15"
  },
  // New Games
  {
    id: "burning-dog-game",
    name: "Take Care of Your Own Burning Dog",
    image: "/burning-dog-game.png",
    rating: 4.1,
    description: "一款独特的宠物照顾游戏，你需要照顾一只特别的狗狗，帮助它完成各种挑战和冒险。游戏画面精美，玩法创新。",
    category: "模拟养成",
    playCount: 120000,
    developer: "Indie Studio",
    releaseDate: "2025",
    features: ["宠物养成", "独特画风", "创新玩法", "情感体验"],
    viewCount: 85000,
    addedDate: "2025-08-20"
  },
  {
    id: "dash-hunters",
    name: "Dash Hunters",
    image: "/dash-hunters-game.png",
    rating: 4.4,
    description: "Dash Hunters是一款快节奏的动作冒险游戏。在危险的世界中奔跑和战斗，收集装备，击败强大的敌人。",
    category: "动作冒险",
    playCount: 180000,
    developer: "Action Games Co",
    releaseDate: "2025",
    features: ["快节奏战斗", "装备收集", "技能升级", "多样关卡"],
    viewCount: 95000,
    addedDate: "2025-08-15"
  },
  {
    id: "frogger",
    name: "Frogger",
    image: "/frogger-game.png",
    rating: 4.0,
    description: "经典的青蛙过河游戏重制版。帮助青蛙安全穿越马路和河流，躲避车辆和危险。简单但充满挑战性。",
    category: "街机经典",
    playCount: 250000,
    developer: "Retro Games",
    releaseDate: "2025",
    features: ["经典玩法", "现代画面", "多种模式", "排行榜"],
    viewCount: 110000,
    addedDate: "2025-08-10"
  },
  {
    id: "spear-stickman",
    name: "The Spear Stickman",
    image: "/spear-stickman-game.png",
    rating: 4.3,
    description: "火柴人投掷长矛的动作游戏。精准瞄准，投掷长矛击败敌人。游戏操作简单，但需要技巧和策略。",
    category: "动作射击",
    playCount: 320000,
    developer: "Stickman Studios",
    releaseDate: "2025",
    features: ["精准射击", "物理引擎", "关卡挑战", "技能升级"],
    viewCount: 150000,
    addedDate: "2025-08-05"
  },
  {
    id: "stickman-boy",
    name: "A Stickman Boy",
    image: "/stickman-boy-game.png",
    rating: 3.9,
    description: "跟随火柴人男孩的冒险旅程。在各种环境中跳跃、奔跑和解决谜题，体验精彩的平台游戏。",
    category: "平台冒险",
    playCount: 200000,
    developer: "Platform Games Inc",
    releaseDate: "2025",
    features: ["平台跳跃", "解谜元素", "多样场景", "流畅操作"],
    viewCount: 80000,
    addedDate: "2025-07-30"
  },
  {
    id: "stickman-clicker",
    name: "Stickman Clicker",
    image: "/stickman-clicker-game.png",
    rating: 4.2,
    description: "火柴人题材的点击游戏。通过点击屏幕获得金币，购买升级和解锁新内容。简单上瘾的放置游戏。",
    category: "点击放置",
    playCount: 400000,
    developer: "Clicker Games",
    releaseDate: "2025",
    features: ["点击玩法", "自动收益", "升级系统", "成就解锁"],
    viewCount: 200000,
    addedDate: "2025-07-25"
  },
  {
    id: "deer-adventure",
    name: "Deer Adventure",
    image: "/deer-adventure-game.png",
    rating: 4.5,
    description: "美丽的鹿冒险游戏。在森林中探索，收集物品，完成任务。游戏画面唯美，音效优秀。",
    category: "冒险探索",
    playCount: 150000,
    developer: "Nature Games",
    releaseDate: "2025",
    features: ["唯美画风", "探索玩法", "任务系统", "自然环境"],
    viewCount: 75000,
    addedDate: "2025-07-20"
  },
  {
    id: "legendary-heroes-clicker",
    name: "Legendary Heroes Clicker",
    image: "/placeholder.svg?height=120&width=120",
    rating: 4.6,
    description: "传奇英雄点击游戏。收集强大的英雄，升级装备，挑战强敌。结合RPG和点击游戏元素。",
    category: "RPG点击",
    playCount: 350000,
    developer: "RPG Studios",
    releaseDate: "2025",
    features: ["英雄收集", "装备升级", "技能树", "Boss战"],
    viewCount: 180000,
    addedDate: "2025-07-15"
  }
]

// 获取热门游戏 (按访问量排序)
export const getHotGames = (limit: number = 8) => {
  return allGames
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
    .map(game => ({
      name: game.name,
      image: game.image,
      rating: game.rating,
      slug: game.id
    }))
}

// 获取新游戏 (按添加日期排序)
export const getNewGames = (limit: number = 8) => {
  return allGames
    .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
    .slice(0, limit)
    .map(game => ({
      name: game.name,
      image: game.image,
      slug: game.id
    }))
}

// 获取游戏详情
export const getGameById = (id: string): GameData | undefined => {
  return allGames.find(game => game.id === id)
}

// 更新游戏访问量
export const updateGameViewCount = (id: string) => {
  const game = allGames.find(game => game.id === id)
  if (game) {
    game.viewCount += 1
  }
}

// 格式化播放次数显示
export const formatPlayCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  return count.toString()
}