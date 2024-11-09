const disableEvent = require('../../db/interfaces/postgres/update').disableEvent
const { buildEmbedAuthorField, buildEmbedFooterField } = require('../utils/embeds')
const eventList = require('../utils/constants').ALL_EVENTS

module.exports = {
  func: async (message, suffix) => {
    const split = suffix.split(' ')
    if (!eventList.includes(split[0])) {
      return message.channel.createMessage({
        embeds: [{
          description: `The provided argument is invalid. Valid events: ${eventList.join(', ')}`,
          color: 16711680,
          timestamp: new Date(),
          author: buildEmbedAuthorField(message.author),
          footer: buildEmbedFooterField(global.bot.user)
        }]
      })
    }
    const disabled = await disableEvent(message.channel.guild.id, split[0])
    const respStr = `${!disabled ? 'Enabled' : 'Disabled'} ${split[0]}.`
    message.channel.createMessage({
      embeds: [{
        description: respStr,
        color: 3553599,
        timestamp: new Date(),
        author: buildEmbedAuthorField(message.author),
        footer: buildEmbedFooterField(global.bot.user)
      }]
    })
  },
  name: 'togglemodule',
  quickHelp: `[DEPRECATED]\nIgnore any event provided after this command. You should have no need for this command when you can stop an event from logging by using ${process.env.GLOBAL_BOT_PREFIX}stoplogging.`,
  examples: 'Unneccesary, this command is deprecated.',
  type: 'custom',
  perm: 'manageChannels',
  category: 'Logging'
}
