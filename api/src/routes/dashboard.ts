import { Router } from 'express';
import { AIConfigManager } from '../services/ai-config-manager';
import { TokenManager } from '../services/token-manager';
import { getMongoDb } from '../database';
import { logger } from '../utils/logger';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const db = getMongoDb();
    const aiConfigManager = req.app.get('aiConfigManager') as AIConfigManager;
    const tokenManager = req.app.get('tokenManager') as TokenManager;

    // 获取上游数量
    const upstreamCount = await aiConfigManager.getUpstreamCount();
    
    // 获取Token数量
    const tokenCount = await tokenManager.getTokenCount();
    
    // 获取今日调用数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCalls = await db.collection('chatlogs').countDocuments({
      created_at: { $gte: today }
    });
    
    // 获取活跃告警数（警告和错误）
    const activeAlerts = await db.collection('system_logs').countDocuments({
      level: { $in: ['warn', 'error'] },
      createdAt: { $gte: today }
    });

    // 获取变化数据（与昨天相比）
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 获取昨天的调用数
    const yesterdayCalls = await db.collection('chatlogs').countDocuments({
      created_at: { 
        $gte: yesterday,
        $lt: today
      }
    });

    const callsChange = todayCalls - yesterdayCalls;
    
    // 获取24小时前的数据进行对比
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // 获取24小时前的告警数
    const alertsLast24h = await db.collection('system_logs').countDocuments({
      level: { $in: ['warn', 'error'] },
      createdAt: { 
        $gte: new Date(last24h.getTime() - 24 * 60 * 60 * 1000),
        $lt: last24h
      }
    });

    const [
      upstreamLast24h,
      tokenLast24h
    ] = await Promise.all([
      aiConfigManager.getUpstreamCountBefore(last24h),
      tokenManager.getTokenCountBefore(last24h)
    ]);

    res.json({
      stats: {
        upstream: {
          current: upstreamCount,
          change: upstreamCount - upstreamLast24h,
          changeType: upstreamCount >= upstreamLast24h ? 'increase' : 'decrease'
        },
        tokens: {
          current: tokenCount,
          change: tokenCount - tokenLast24h,
          changeType: tokenCount >= tokenLast24h ? 'increase' : 'decrease'
        },
        calls: {
          current: todayCalls,
          change: callsChange,
          changeType: callsChange >= 0 ? 'increase' : 'decrease'
        },
        alerts: {
          current: activeAlerts,
          change: Math.abs(activeAlerts - alertsLast24h),
          changeType: activeAlerts <= alertsLast24h ? 'decrease' : 'increase'
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats'
    });
  }
});

// 获取趋势数据
router.get('/trends/:days', async (req, res) => {
  try {
    const db = getMongoDb();
    const days = parseInt(req.params.days);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ error: 'Invalid days parameter' });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 根据时间范围确定时间粒度
    let interval: 'hour' | '4hour' | 'day' | 'week' | 'month';
    if (days <= 1) {
      interval = 'hour';
    } else if (days <= 7) {
      interval = '4hour';
    } else if (days <= 30) {
      interval = 'day';
    } else if (days <= 180) {
      interval = 'week';
    } else {
      interval = 'month';
    }

    // 构建聚合管道
    const pipeline = [
      {
        $match: {
          created_at: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: (() => {
            switch (interval) {
              case 'hour':
                return {
                  year: { $year: '$created_at' },
                  month: { $month: '$created_at' },
                  day: { $dayOfMonth: '$created_at' },
                  hour: { $hour: '$created_at' }
                };
              case '4hour':
                return {
                  year: { $year: '$created_at' },
                  month: { $month: '$created_at' },
                  day: { $dayOfMonth: '$created_at' },
                  fourHour: {
                    $multiply: [
                      { $floor: { $divide: [{ $hour: '$created_at' }, 4] } },
                      4
                    ]
                  }
                };
              case 'day':
                return {
                  year: { $year: '$created_at' },
                  month: { $month: '$created_at' },
                  day: { $dayOfMonth: '$created_at' }
                };
              case 'week':
                return {
                  year: { $year: '$created_at' },
                  week: { $week: '$created_at' }
                };
              case 'month':
                return {
                  year: { $year: '$created_at' },
                  month: { $month: '$created_at' }
                };
              default:
                return {
                  year: { $year: '$created_at' },
                  month: { $month: '$created_at' },
                  day: { $dayOfMonth: '$created_at' }
                };
            }
          })(),
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ];

    const data = await db.collection('chatlogs').aggregate(pipeline).toArray();

    // 格式化数据
    const formattedData = data.map(item => {
      let date: Date;
      const { year, month, day, hour, fourHour, week } = item._id;

      switch (interval) {
        case 'hour':
          date = new Date(year, month - 1, day, hour);
          break;
        case '4hour':
          date = new Date(year, month - 1, day, fourHour);
          break;
        case 'day':
          date = new Date(year, month - 1, day);
          break;
        case 'week':
          date = new Date(year, 0, 1);
          date.setDate(date.getDate() + (week * 7));
          break;
        case 'month':
          date = new Date(year, month - 1, 1);
          break;
        default:
          date = new Date(year, month - 1, day || 1);
      }

      return {
        date: date.toISOString(),
        count: item.count
      };
    });

    // 填充空缺的时间点
    const result = {
      dates: [] as string[],
      calls: [] as number[]
    };

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString();
      const dataPoint = formattedData.find(d => {
        const pointDate = new Date(d.date);
        switch (interval) {
          case 'hour':
            return pointDate.getTime() === currentDate.getTime();
          case '4hour':
            return Math.floor(pointDate.getHours() / 4) === Math.floor(currentDate.getHours() / 4) &&
                   pointDate.getDate() === currentDate.getDate() &&
                   pointDate.getMonth() === currentDate.getMonth() &&
                   pointDate.getFullYear() === currentDate.getFullYear();
          case 'day':
            return pointDate.getDate() === currentDate.getDate() &&
                   pointDate.getMonth() === currentDate.getMonth() &&
                   pointDate.getFullYear() === currentDate.getFullYear();
          case 'week':
            const weekDiff = Math.floor((pointDate.getTime() - currentDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            return weekDiff === 0;
          case 'month':
            return pointDate.getMonth() === currentDate.getMonth() &&
                   pointDate.getFullYear() === currentDate.getFullYear();
          default:
            return false;
        }
      });

      result.dates.push(dateStr);
      result.calls.push(dataPoint ? dataPoint.count : 0);

      // 增加时间间隔
      switch (interval) {
        case 'hour':
          currentDate.setHours(currentDate.getHours() + 1);
          break;
        case '4hour':
          currentDate.setHours(currentDate.getHours() + 4);
          break;
        case 'day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch trend data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trend data'
    });
  }
});

export const dashboardRoutes = router; 