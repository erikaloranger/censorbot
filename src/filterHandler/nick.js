module.exports = async (client, oldMember, newMember) => {
  if (oldMember.guild && oldMember.guild.id == '264445053596991498') return
  if (oldMember.displayName == newMember.displayName) return
  var oldDisplayName = oldMember.displayName
  var newDisplayName = newMember.displayName
  var data = await client.rdb.getAll(oldMember.guild.id)
  if (data.role && newMember.roles.has(data.role)) return
  if (!data.censor.nick) return

  var response
  if (client.serverFilters[newMember.guild.id]) response = client.serverFilters[newMember.guild.id].test(newDisplayName, true, data.filter, data.uncensor)
  else response = await client.filter.test(newDisplayName, data.base, data.filter, data.uncensor)

  if (response.censor) {
    var error
    try {
      await newMember.setNickname('')
    } catch (err) {
      console.log(`Shard ${client.shard.id} | ${oldMember.guild.name} ${oldMember.guild.id} ${err.message}`.red)
      error = 'Error! Missing permission to change nicknames!'
    }
    console.log(`Shard ${client.shard.id} | Changed innapropriate nickname of ${newMember.user} ${newMember.user.username}: `.yellow + `${newDisplayName}`.yellow.underline)
    client.c_log(`Shard ${client.shard.id} | Deleted oldMessage from ${oldMember.user.tag} ${oldMember.user.username}: | Server: ${oldMember.guild.name} ${oldMember.guild.id}`, client.embeds.adminLog(oldDisplayName, oldMember.user, {
      arg: response.arg,
      word: response.word
    }))
    var log 
    if(data.log) {
      log = oldMember.guild.channels.get(data.log)
      if (log) log.send(client.embeds.log([oldDisplayName, newDisplayName], oldMember, response.method, 2, error, response))
    }
    if (data.punishment.on) {
      console.log('punish')
      var role = oldMember.guild.roles.get(data.punishment.role)
      if (!role) return
      var user = await client.punishdb.find({ u: oldMember.user.id, g: oldMember.guild.id })
      if (!user) if (!user) {
        user = {
          u: oldMember.user.id,
          g: oldMember.guild.id,
          a: 0
        }
        await client.punishdb.create(null, { u: oldMember.user.id, g: oldMember.guild.id, a: 0 })
      }
      if (user.a + 1 >= data.punishment.amount) {
        oldMember.roles.add(role)
        client.punishdb.delete({ u: oldMember.user.id, g: oldMember.guild.id })
        if(log) log.send(client.u.embed
          .setTitle('User Punished')
          .setDescription(`${oldMember.user} Reached the max ${data.punishment.amount} warnings.\n\nThey have received the ${role} role as punishment!`)
          .setColor('RED')
          .setFooter('This system is heavily WIP!')
        )
      } else {
        client.punishdb.add({ u: oldMember.user.id, g: oldMember.guild.id }, 'a', 1)
      }
    }
  }
}
