const send = require('../modules/webhooksender')
const { displayUsername } = require('../utils/constants')
const { buildEmbedAuthorField, buildEmbedFooterField } = require('../utils/embeds')

module.exports = {
  name: 'guildBanRemove',
  type: 'on',
  handle: async (guild, user) => {
    const userUsername = displayUsername(user)

    const guildBanRemoveEvent = {
      guildID: guild.id,
      eventName: 'guildBanRemove',
      embeds: [{
        author: buildEmbedAuthorField(user),
        description: `${userUsername} was unbanned`,
        fields: [{
          name: 'User Information',
          value: `${userUsername} (${user.id}) ${user.mention} ${user.bot ? '\nIs a bot' : ''}`
        }, {
          name: 'Reason',
          value: 'None provided'
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = Unknown\`\`\``
        }],
        color: 3553599
      }]
    }
    const logs = await guild.getAuditLog({ limit: 5, actionType: 23 }).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === user.id && Date.now() - ((e.id / 4194304) + 1420070400000) < 3000)
    if (log && log.user && log.user.username) { // if the audit log is less than 3 seconds off
      const perp = log.user
      if (log.reason) guildBanRemoveEvent.embeds[0].fields[1].value = log.reason
      guildBanRemoveEvent.embeds[0].fields[2].value = `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${perp.id}\`\`\``
      guildBanRemoveEvent.embeds[0].footer = buildEmbedFooterField(perp)
      await send(guildBanRemoveEvent)
    } else {
      await send(guildBanRemoveEvent)
    }
  }
}
