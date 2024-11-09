const sa = require('superagent')
const { EMBED_COLORS, displayUsername } = require('../utils/constants.js')
const { buildEmbedFooterField, buildEmbedAuthorField } = require('../utils/embeds.js')

module.exports = {
  name: 'archive',
  botPerms: ['readMessageHistory'],
  userPerms: ['readMessageHistory', 'manageMessages'],
  func: async interaction => {
    if (!process.env.PASTE_SITE_ROOT_URL) return interaction.createMessage({
      embeds: [{
        title: 'Unsuccessful',
        description: 'The bot owner hasn\'t yet configured the paste site, so this command is unavailable.',
        thumbnail: {
          url: interaction.member.user.dynamicAvatarURL(null, 64)
        },
        color: EMBED_COLORS.RED,
        author: buildEmbedAuthorField(interaction.member.user),
        footer: buildEmbedFooterField(global.bot.user)
      }]
    }).catch(() => {})
    if (!interaction.data.options || !interaction.data.options[0] || interaction.data.options[0].value > 1000 || interaction.data.options[0].value < 5) {
      interaction.createMessage({
        embeds: [{
          title: 'Unsuccessful',
          description: 'Amount must be 5 <= amount < 1000',
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          color: EMBED_COLORS.RED,
          author: buildEmbedAuthorField(interaction.member.user),
          footer: buildEmbedFooterField(global.bot.user)
        }]
      }).catch(() => {})
    }
    const fetchedMessages = await global.bot.getChannel(interaction.channel.id).getMessages({ limit: interaction.data.options[0].value })
    const pasteString = fetchedMessages.reverse().filter(m => !m.applicationID).map(m => `${displayUsername(m.author)} (${m.author.id}) | ${new Date(m.timestamp)}: ${m.content ? m.content : ''} | ${m.embeds.length === 0 ? '' : `{"embeds": [${m.embeds.map(e => JSON.stringify(e))}]}`} | ${m.attachments.length === 0 ? '' : ` =====> Attachment: ${m.attachments[0].filename}:${m.attachments[0].url}`}`).join('\r\n')
    try {
      await interaction.createMessage({
        embeds: [{ // make sure followup message is created before doing any more work
          title: 'Processing',
          description: `Processing request from ${displayUsername(interaction.member)} for an archive of ${interaction.data.options[0].value} messages`,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          color: EMBED_COLORS.YELLOW_ORANGE,
          author: buildEmbedAuthorField(interaction.member.user),
          footer: buildEmbedFooterField(global.bot.user)
        }]
      })
    } catch (_) {}
    sa
      .post(`${process.env.PASTE_SITE_ROOT_URL.endsWith("/") ? process.env.PASTE_SITE_ROOT_URL.slice(0, -1) : process.env.PASTE_SITE_ROOT_URL}/documents`)
      .set('Authorization', process.env.PASTE_SITE_TOKEN ?? '')
      .set('Content-Type', 'text/plain')
      .send(pasteString || 'No messages were able to be archived')
      .end((err, res) => {
        if (!err && res.statusCode === 200 && res.body.key) {
          interaction.editOriginalMessage({
            embeds: [{
              title: 'Success',
              description: `Archived ${fetchedMessages.length} messages: ${process.env.PASTE_SITE_ROOT_URL.endsWith("/") ? process.env.PASTE_SITE_ROOT_URL.slice(0, -1) : process.env.PASTE_SITE_ROOT_URL}/${res.body.key}.txt`,
              thumbnail: {
                url: interaction.member.user.dynamicAvatarURL(null, 64)
              },
              color: EMBED_COLORS.GREEN,
              author: buildEmbedAuthorField(interaction.member.user),
              footer: buildEmbedFooterField(global.bot.user)
            }]
          }).catch(() => {})
        } else {
          interaction.editOriginalMessage({
            embeds: [{
              title: 'Error',
              description: 'The archive service returned an error, please try again later!',
              thumbnail: {
                url: interaction.member.user.dynamicAvatarURL(null, 64)
              },
              color: EMBED_COLORS.RED,
              footer: buildEmbedFooterField(global.bot.user)
            }]
          }).catch(() => {})
          global.logger.error(err, res.body)
          global.webhook.error('An error has occurred while posting to the paste website. Check logs for more.')
        }
      })
  }
}
