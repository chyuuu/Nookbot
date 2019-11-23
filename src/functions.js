/* eslint-disable no-param-reassign */
const moment = require('moment');
const distance = require('jaro-winkler');

module.exports = (client) => {
  client.getSettings = (guild) => {
    client.settings.ensure('default', client.config.defaultSettings);

    if (!guild) {
      return client.settings.get('default');
    }

    const guildConf = client.settings.get(guild.id) || {};
    return ({ ...client.settings.get('default'), ...guildConf });
  };

  client.permLevel = (message) => {
    let permName = 'User';
    let permlvl = 0;
    const permOrder = client.config.permLevels.slice(0)
      .sort((p, c) => (p.level < c.level ? 1 : -1));

    while (permOrder.length) {
      const currentlvl = permOrder.shift();

      if (currentlvl.check(client, message)) {
        permName = currentlvl.name;
        permlvl = currentlvl.level;
        break;
      }
    }
    return [permName, permlvl];
  };

  client.clean = async (clientParam, text) => {
    if (text && text.constructor.name === 'Promise') {
      text = await text;
    }
    if (typeof evaled !== 'string') {
      // eslint-disable-next-line global-require
      text = require('util').inspect(text, { depth: 1 });
    }

    text = text
      .replace(/`/g, `\`${String.fromCharCode(8203)}`)
      .replace(/@/g, `@${String.fromCharCode(8203)}`)
      .replace(clientParam.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0');

    return text;
  };

  client.fetchOwner = async () => {
    const owner = await client.fetchUser(client.config.ownerID);
    return owner;
  };

  client.success = (channel, suc, msg) => {
    channel.send(`${client.emoji.checkMark} **${suc}**\n${msg}`);
  };

  client.error = (channel, err, msg) => {
    channel.send(`${client.emoji.redX} **${err}**\n${msg}`);
  };

  client.humanTimeBetween = (time1, time2) => {
    if (time1 < time2) {
      const temp = time1;
      time1 = time2;
      time2 = temp;
    }
    const timeDif = moment.duration(moment(time1).diff(moment(time2)));

    const times = [
      timeDif.years(),
      timeDif.months(),
      timeDif.days(),
      timeDif.hours(),
      timeDif.minutes(),
      timeDif.seconds(),
    ];

    const units = ['year', 'month', 'day', 'hour', 'minute', 'second'];

    // Grab the top 3 units of time that aren't 0
    let outTimes = '';
    let c = 0;
    for (let t = 0; t < units.length; t++) {
      if (times[t] > 0) {
        outTimes += `${c === 1 ? '|' : ''}${c === 2 ? '=' : ''}${times[t]} ${units[t]}${times[t] === 1 ? '' : 's'}`;
        c += 1;
        if (c === 3) {
          break;
        }
      }
    }

    if (outTimes.includes('=')) {
      outTimes = outTimes.replace('|', ', ').replace('=', ', and ');
    } else {
      outTimes = outTimes.replace('|', ' and ');
    }

    return outTimes;
  };

  client.regexCount = (regexp, str) => {
    if (typeof regexp !== 'string') {
      return 0;
    }
    regexp = regexp === '.' ? `\\${regexp}` : regexp;
    regexp = regexp === '' ? '.' : regexp;
    return ((str || '').match(new RegExp(regexp, 'g')) || []).length;
  };

  client.countdown = (channel) => {
    const now = moment();
    const releaseDate = moment([2020, 2, 20]);
    const daysUntilRelease = Math.round(releaseDate.diff(now, 'days', true));

    return channel.send(`**Animal Crossing: New Horizons** releases in **${daysUntilRelease} days!**`);
  };

  client.reactPrompt = async (message, question, opt) => {
    if (!opt) {
      const confirm = await message.channel.send(question);
      await confirm.react(client.emoji.checkMark);
      await confirm.react(client.emoji.redX);

      const filter = (reaction, user) => [client.emoji.checkMark, client.emoji.redX].includes(reaction.emoji.name)
          && user.id === message.author.id;

      let decision = false;
      await confirm.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
        .then((collected) => {
          const reaction = collected.first();

          if (reaction.emoji.name === client.emoji.checkMark) {
            decision = true;
          }
        })
        .catch(() => {
          console.log('React Prompt timed out.');
        });
      confirm.delete();
      return decision;
    }
    let counter = 0x1F1E6;
    let body = question;
    opt.slice(0, 20).forEach((option) => {
      body += `\n${String.fromCodePoint(counter)} : \`${option}\``;
      counter += 1;
    });
    const confirm = await message.channel.send(body);
    counter = 0x1F1E6;
    const emojiList = [];
    await client.asyncForEach(opt.slice(0, 20), async () => {
      emojiList.push(String.fromCodePoint(counter));
      await confirm.react(String.fromCodePoint(counter));
      counter += 1;
    });
    const filter = (reaction, user) => emojiList.includes(reaction.emoji.name)
          && user.id === message.author.id;

    let decision = '';
    await confirm.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
      .then((collected) => {
        const reaction = collected.first();

        decision = opt[reaction.emoji.toString().codePointAt(0) - 0x1F1E6];
      })
      .catch(() => {
        console.log('React Prompt timed out.');
      });
    confirm.delete();
    return decision;
  };

  client.asyncForEach = async (array, callback) => {
    for (let i = 0; i < array.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await callback(array[i], i, array);
    }
  };

  client.searchMember = (name, threshold = 0.5) => {
    const rated = [];

    client.guilds.first().members.forEach((m) => {
      const score = Math.max(distance(name, m.user.username, { caseSensitive: false }), distance(name, m.displayName, { caseSensitive: false }));
      if (score > threshold) {
        rated.push({
          member: m,
          score,
        });
      }
    });

    rated.sort((a, b) => b.score - a.score);

    return rated[0].member;
  };

  // eslint-disable-next-line no-extend-native
  Object.defineProperty(String.prototype, 'toProperCase', {
    value() {
      return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    },
  });
};
