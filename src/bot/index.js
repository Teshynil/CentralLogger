const Eris = require('eris')
const Sentry = require('@sentry/node')
const messageBatcher = require('../db/messageBatcher')
const redisLock = require('../db/interfaces/redis/redislock')
const indexCommands = require('../miscellaneous/commandIndexer')
const cacheGuildInfo = require('./utils/cacheGuildSettings')
const addBotListeners = require('./utils/addbotlisteners')
const { generateTables } = require('../miscellaneous/generateDB')
const logger = require('../miscellaneous/logger')

require('dotenv').config()

if (process.env.RAVEN_URI) {
  Sentry.init({
    dsn: process.env.RAVEN_URI,
    maxBreadcrumbs: 1
  })
} else {
  global.logger.warn('No Sentry URI provided via the RAVEN_URI env variable. Error logging will be restricted to messages only.')
}

async function init () {
  global.logger.info('Logger is starting up...')
  global.redis = require('../db/clients/redis')
  global.bot = new Eris(process.env.BOT_TOKEN, {
    allowedMentions: {
      everyone: false,
      roles: false,
      users: false
    },
    restMode: true,
    messageLimit: 0,
    autoreconnect: 'auto',
    intents: [
      'guilds',
      'guildVoiceStates',
      'guildEmojis',
      'guildInvites',
      'guildMembers',
      'guildMessages',
      'messageContent',
      'guildBans'
    ],
    defaultImageFormat: 'png'
  })

  global.bot.editStatus('dnd', {
    name: 'Bot is booting'
  })

  try {
    await generateTables()
  } catch (e) {
    logger.error(e)
    process.exit(1)
  }

  global.bot.commands = {}
  global.bot.ignoredChannels = []
  global.bot.guildSettingsCache = {}

  indexCommands() // yes, block the thread while we read commands.
  await cacheGuildInfo()

  addBotListeners()

  global.bot.connect()
}

process.on('exit', (code) => {
  global.logger.error(`The process is exiting with code ${code}. Terminating pgsql connections...`)
  const poolClient = require('../db/clients/postgres')
  poolClient.end(() => {
    global.logger.info('PostgreSQL clients returned')
  })
  if (process.env.TWILIGHT_PROXY_PORT) {
    global.bot.requestHandler.closeConn()
  }
})

process.on('SIGINT', async () => {
  global.logger.error('SIGINT caught. Cleaning up and exiting...')
  // Attempt to submit messages in batch to psql before terminating connections.
  // BUG: Sometimes this works, sometimes it doesn't. There's probably a race condition here.
  // NB: The `process.on('exit')` callback seems to be called even if we don't explicitly `process.exit`(?)
  const numToSubmit = messageBatcher.getMessageCount()
  if (numToSubmit !== 0) {
    global.logger.debug(`Submitting ${numToSubmit} messages from batch to psql...`)
    const numSubmitted = await messageBatcher.submitBatch(numToSubmit)
    // BUG: Never gets outputted, even when messages are stored. Probably due to aforementioned race condition.
    global.logger.info(`Successfully submitted ${numSubmitted} messages from the batch to psql before terminating connections.`)
    process.exit()
  } else process.exit()
})

process.on('unhandledRejection', (e) => {
  if (!e.message.includes('[50013]') && !e.message.includes('Request timed out') && !e.message.startsWith('500 INTERNAL SERVER ERROR') && !e.message.includes('503 Service Temporarily Unavailable') && !e.message.includes('global ratelimit') && !e.message.includes('hang up')) {
    global.logger.error_nosentry(e)
    // sentry catches these already, stop double reporting
    // Sentry.captureException(e.stack, { level: 'error' }) // handle when Discord freaks out
  }
})

process.on('uncaughtException', (e) => {
  if (!e.message.includes('[50013]') && !e.message.includes('Request timed out') && !e.message.startsWith('500 INTERNAL SERVER ERROR') && !e.message.includes('503 Service Temporarily Unavailable') && !e.message.includes('global ratelimit') && !e.message.includes('hang up')) {
    global.logger.error_nosentry(e)
    Sentry.captureException(e.stack, { level: 'fatal' })
  }
})

init()
