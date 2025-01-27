const { toggleLogBots } = require('../../db/interfaces/postgres/update')
const { buildEmbedAuthorField, buildEmbedFooterField } = require('../utils/embeds')

module.exports = {
  func: async message => {
    const state = await toggleLogBots(message.channel.guild.id)
    await message.channel.createMessage({
      embeds: [{
        title: `${state ? 'I am now logging bot activity.' : 'I am no longer logging bot activity.'}`,
        color: 16711680,
        timestamp: new Date(),
        author: buildEmbedAuthorField(message.author),
        footer: buildEmbedFooterField(global.bot.user),
        fields: []
      }]
    })
  },
  name: 'logbots',
  quickHelp: 'Use this to toggle whether I log actions done by bots or not (DEFAULT: disabled). Does NOT ignore bots deleting messages!',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}logbots\` <- toggle whether bot actions are logged, current status will be returned (ignoring or actively logging)`,
  type: 'admin',
  category: 'Logging'
}
