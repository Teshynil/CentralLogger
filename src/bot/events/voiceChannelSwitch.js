const send = require('../modules/webhooksender')
const { displayUsername } = require('../utils/constants')

module.exports = {
  name: 'voiceChannelSwitch',
  type: 'on',
  handle: async (member, channel, oldChannel) => {
    if (global.bot.guildSettingsCache[channel.guild.id].isChannelIgnored(channel.id)) return

    const memberUsername = displayUsername(member)

    await send({
      guildID: channel.guild.id,
      eventName: 'voiceChannelSwitch',
      embeds: [{
        author: {
          name: `${memberUsername} ${member.nick ? `(${member.nick})` : ''}`,
          icon_url: member.avatarURL
        },
        description: `**${memberUsername}** ${member.nick ? `(${member.nick})` : ''} moved from <#${oldChannel.id}> (${oldChannel.name}) to <#${channel.id}> (${channel.name}).`,
        fields: [{
          name: 'Current channel they are in',
          value: `<#${channel.id}> (${channel.name})`
        }, {
          name: 'Previously occupied channel',
          value: `<#${oldChannel.id}> (${oldChannel.name})`
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${member.id}\nNew = ${channel.id}\nOld = ${oldChannel.id}\`\`\``
        }],
        color: 3553599
      }]
    })
  }
}
