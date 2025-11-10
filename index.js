require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
// Use dynamic import for node-fetch to ensure compatibility with CommonJS
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const client = new Client({ checkUpdate: false });

const prefix = process.env.PREFIX || '!';
const token = process.env.TOKEN;
const weatherstackKey = process.env.WEATHERSTACK_KEY || null;

// Validate token
if (!token) {
  console.error('Error: No TOKEN provided in .env file.');
  process.exit(1);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}! Self-bot is online with enhanced features.`);
  client.user.setPresence({ status: 'online', activities: [{ name: 'with 100+ commands', type: 'PLAYING' }] });
});

client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return; // Only respond to your own commands
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    // 1-10: Utility Commands
    if (command === 'ping') return message.reply(`Pong! Latency: ${client.ws.ping}ms`);
    if (command === 'uptime') return message.reply(`Uptime: ${Math.floor(process.uptime() / 60)} minutes`);
    if (command === 'userinfo') return message.reply(`ID: ${client.user.id}\nTag: ${client.user.tag}\nCreated: ${client.user.createdAt}`);
    if (command === 'serverinfo') return message.reply(`Name: ${message.guild?.name || 'DM'}\nMembers: ${message.guild?.memberCount || 'N/A'}\nOwner: ${message.guild?.ownerId || 'N/A'}`);
    if (command === 'avatar') return message.reply({ files: [client.user.displayAvatarURL({ dynamic: true })] });
    if (command === 'banner') return message.reply(client.user.bannerURL() ? { files: [client.user.bannerURL()] } : 'No banner set.');
    if (command === 'channelinfo') return message.reply(`Name: ${message.channel.name || 'DM'}\nID: ${message.channel.id}\nType: ${message.channel.type}`);
    if (command === 'rolelist') return message.reply(`Roles: ${message.guild?.roles.cache.map(r => r.name).join(', ').slice(0, 1900) || 'N/A'}`);
    if (command === 'emojilist') return message.reply(`Emojis: ${message.guild?.emojis.cache.map(e => e.toString()).join(' ').slice(0, 1900) || 'N/A'}`);
    if (command === 'invite') {
      if (!message.guild) return message.reply('Cannot create invite in DMs.');
      const invite = await message.channel.createInvite({ maxAge: 0 });
      return message.reply(`Invite: ${invite.url}`);
    }

    // 11-20: Fun Commands (API-integrated)
    if (command === '8ball') {
      const responses = ['Yes', 'No', 'Maybe', 'Definitely', 'Ask again later', 'Outlook good', 'Signs point to yes', 'Very doubtful'];
      return message.reply(responses[Math.floor(Math.random() * responses.length)]);
    }
    if (command === 'coinflip') return message.reply(Math.random() > 0.5 ? 'Heads!' : 'Tails!');
    if (command === 'dice') return message.reply(`Rolled: ${Math.floor(Math.random() * 6) + 1}`);
    if (command === 'joke') {
      const res = await fetch('https://sv443.net/jokeapi/v2/joke/Any?format=txt');
      const joke = await res.text();
      return message.reply(joke || 'Failed to fetch joke.');
    }
    if (command === 'meme') {
      try {
        const res = await fetch('https://api.imgflip.com/get_memes');
        const data = await res.json();
        // Check if the API response is valid and contains memes
        if (!data.success || !data.data || !data.data.memes || data.data.memes.length === 0) {
          console.error('Meme API error: Invalid response structure', data);
          return message.reply('Failed to fetch meme: Invalid API response.');
        }
        // Select a random meme
        const meme = data.data.memes[Math.floor(Math.random() * data.data.memes.length)];
        // Ensure the meme has a valid URL and name
        if (!meme.url || !meme.name) {
          console.error('Meme API error: Missing meme data', meme);
          return message.reply('Failed to fetch meme: Missing meme data.');
        }
        // Try sending as an embed first
        try {
          return await message.reply({
            embeds: [{
              title: meme.name || 'Random Meme',
              description: 'Here’s your meme!',
              image: { url: meme.url },
              color: 0x0099ff,
              footer: { text: 'Powered by Imgflip' }
            }]
          });
        } catch (embedError) {
          console.error('Embed send failed:', embedError);
          // Fallback to sending the meme URL as a plain text message
          return await message.reply(`Meme: ${meme.name}\n${meme.url}`);
        }
      } catch (fetchError) {
        console.error('Meme fetch error:', fetchError);
        return message.reply('Failed to fetch meme: API request failed.');
      }
    }
    if (command === 'catfact') {
      const res = await fetch('https://catfact.ninja/fact');
      const data = await res.json();
      return message.reply(data.fact || 'Failed to fetch cat fact.');
    }
    if (command === 'dogfact') {
      const res = await fetch('https://dog-api.kinduff.com/api/facts');
      const data = await res.json();
      return message.reply(data.facts[0] || 'Failed to fetch dog fact.');
    }
    if (command === 'quote') {
      const res = await fetch('https://api.quotable.io/random');
      const data = await res.json();
      return message.reply(data.content ? `"${data.content}" - ${data.author}` : 'Failed to fetch quote.');
    }
    if (command === 'riddle') {
      const res = await fetch('https://riddles-api.vercel.app/random');
      const data = await res.json();
      return message.reply(data.riddle ? `Riddle: ${data.riddle}\nAnswer: ||${data.answer}||` : 'Failed to fetch riddle.');
    }
    if (command === 'fortunecookie') {
      const res = await fetch('https://api.chucknorris.io/jokes/random');
      const data = await res.json();
      return message.reply(data.value ? `Fortune: ${data.value} (Chuck Norris style!)` : 'Failed to fetch fortune.');
    }

    // 21-30: Text Manipulation Commands
    if (command === 'reverse') return message.reply(args.join(' ').split('').reverse().join(''));
    if (command === 'uppercase') return message.reply(args.join(' ').toUpperCase());
    if (command === 'lowercase') return message.reply(args.join(' ').toLowerCase());
    if (command === 'leet') return message.reply(args.join(' ').replace(/a/gi, '4').replace(/e/gi, '3').replace(/i/gi, '1').replace(/o/gi, '0').replace(/s/gi, '5').replace(/t/gi, '7'));
    if (command === 'emojify') {
      const emojified = args.join(' ').toLowerCase().replace(/[a-z]/g, c => `:regional_indicator_${c}:`).replace(/\s/g, '   ');
      return message.reply(emojified);
    }
    if (command === 'vaporwave') return message.reply(args.join(' ').split('').map(c => c === ' ' ? '　' : c.charCodeAt(0) < 128 ? String.fromCharCode(c.charCodeAt(0) + 65248) : c).join(''));
    if (command === 'mock') return message.reply(args.join(' ').split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''));
    if (command === 'clap') return message.reply(args.join(' 👏 '));
    if (command === 'space') return message.reply(args.join('　'));
    if (command === 'binary') return message.reply(args.join(' ').split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '));

    // 31-40: Automation Commands
    if (command === 'afkon') { client.afk = true; return message.reply('AFK mode enabled.'); }
    if (command === 'afkoff') { client.afk = false; return message.reply('AFK mode disabled.'); }
    if (command === 'autoreplyon') { client.autoreply = args.join(' ') || 'Auto-reply active!'; return message.reply('Auto-reply enabled.'); }
    if (command === 'autoreplyoff') { client.autoreply = null; return message.reply('Auto-reply disabled.'); }
    if (command === 'copycaton') { client.copycat = message.channel.id; return message.reply('Copycat mode on.'); }
    if (command === 'copycatoff') { client.copycat = null; return message.reply('Copycat mode off.'); }
    if (command === 'statusonline') { client.user.setStatus('online'); return message.reply('Status: Online'); }
    if (command === 'statusidle') { client.user.setStatus('idle'); return message.reply('Status: Idle'); }
    if (command === 'statusdnd') { client.user.setStatus('dnd'); return message.reply('Status: DND'); }
    if (command === 'statusinvisible') { client.user.setStatus('invisible'); return message.reply('Status: Invisible'); }

    // 41-50: Info Commands
    if (command === 'weather') {
      if (!weatherstackKey) return message.reply('Weather API disabled. Add WEATHERSTACK_KEY to .env.');
      if (!args[0]) return message.reply('Usage: !weather [city]');
      const res = await fetch(`http://api.weatherstack.com/current?access_key=${weatherstackKey}&query=${args.join(' ')}`);
      const data = await res.json();
      if (data.error) return message.reply('Error: ' + data.error.info);
      const current = data.current;
      return message.reply(`Weather in ${data.location.name}: ${current.temperature}°C, ${current.weather_descriptions[0]}. Humidity: ${current.humidity}%.`);
    }
    if (command === 'time') return message.reply(new Date().toLocaleTimeString('en-US', { timeZone: args.join(' ') || 'UTC' }));
    if (command === 'date') return message.reply(new Date().toLocaleDateString());
    if (command === 'botversion') return message.reply('Version 2.0 - Enhanced with APIs');
    if (command === 'help') {
      const commandsList = 'Utility: ping, uptime, userinfo...\nFun: 8ball, joke, meme...\nText: reverse, uppercase...\nAnd more! Total 100+ commands.';
      return message.reply(commandsList);
    }
    if (command === 'cpu') return message.reply(`CPU Usage: ${(process.cpuUsage().user / 1000000).toFixed(2)}%`);
    if (command === 'memory') return message.reply(`Memory Used: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    if (command === 'os') return message.reply(`OS: ${process.platform}`);
    if (command === 'nodeversion') return message.reply(`Node: ${process.version}`);
    if (command === 'discordversion') return message.reply(`discord.js-selfbot-v13: ${require('discord.js-selfbot-v13/package.json').version}`);

    // 51-60: Game Commands
    if (command === 'rps') {
      const choice = args[0]?.toLowerCase();
      const botChoice = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
      if (!choice) return message.reply('Usage: !rps [rock/paper/scissors]');
      const result = (choice === botChoice) ? 'Tie!' : ((choice === 'rock' && botChoice === 'scissors') || (choice === 'paper' && botChoice === 'rock') || (choice === 'scissors' && botChoice === 'paper')) ? 'You win!' : 'I win!';
      return message.reply(`You: ${choice}, Me: ${botChoice}. ${result}`);
    }
    if (command === 'hangman') return message.reply('Hangman: Guess the word! (Implement full logic with states if needed)');
    if (command === 'tictactoe') return message.reply('Tic-Tac-Toe board: Use commands to play (basic display only)');
    if (command === 'sudoku') return message.reply('Sudoku puzzle: [1 2 3 ...] Solve it manually!');
    if (command === 'trivia') {
      const res = await fetch('https://the-trivia-api.com/v2/questions?limit=1');
      const data = await res.json();
      const q = data[0];
      return message.reply(q.question ? `Trivia: ${q.question.text}\nAnswer: ||${q.correctAnswer}||` : 'Failed to fetch trivia.');
    }
    if (command === 'guessnumber') {
      client.guessNumber = Math.floor(Math.random() * 100) + 1;
      return message.reply('Guess a number between 1-100! Use !guess [number]');
    }
    if (command === 'guess') {
      if (!client.guessNumber) return message.reply('Start with !guessnumber');
      const guess = parseInt(args[0]);
      if (isNaN(guess)) return message.reply('Invalid number.');
      if (guess === client.guessNumber) { client.guessNumber = null; return message.reply('Correct!'); }
      return message.reply(guess < client.guessNumber ? 'Higher!' : 'Lower!');
    }
    if (command === 'wordscramble') {
      const words = ['apple', 'banana', 'computer', 'discord'];
      const word = words[Math.floor(Math.random() * words.length)];
      const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
      return message.reply(`Unscramble: ${scrambled} (Hint: Fruit or tech)`);
    }
    if (command === 'mathquiz') {
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      return message.reply(`What is ${num1} * ${num2}? Answer: ||${num1 * num2}||`);
    }
    if (command === 'flagquiz') {
      const flags = { '🇺🇸': 'USA', '🇯🇵': 'Japan', '🇫🇷': 'France' };
      const flag = Object.keys(flags)[Math.floor(Math.random() * Object.keys(flags).length)];
      return message.reply(`What country is ${flag}? Answer: ||${flags[flag]}||`);
    }

    // 61-70: More Fun Variations
    if (command === 'pun') {
      const res = await fetch('https://sv443.net/jokeapi/v2/joke/Pun?format=txt');
      const pun = await res.text();
      return message.reply(pun || 'Failed to fetch pun.');
    }
    if (command === 'dadjoke') {
      const res = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'text/plain' } });
      const joke = await res.text();
      return message.reply(joke || 'Failed to fetch dad joke.');
    }
    if (command === 'knockknock') return message.reply("Knock knock! Who's there? Interrupting cow. Interrupting cow wh-MOO!");
    if (command === 'horoscope') {
      const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      return message.reply(`${args[0] && signs.includes(args[0]) ? args[0] : 'Your'} horoscope: Good things are coming!`);
    }
    if (command === 'magictrick') return message.reply('Think of a number between 1-10. Add 5, multiply by 2, subtract 10. Your number is ' + (Math.floor(Math.random() * 10) + 1) + '!');
    if (command === 'superhero') return message.reply(`Your superhero name: ${args.join(' ') ? 'Super ' + args.join(' ') : 'Invisible Man'}`);
    if (command === 'bandname') return message.reply(`Band name idea: The ${args.join(' ') || 'Discord'} Rebels`);
    if (command === 'passwordgen') {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
      let pass = '';
      for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
      return message.reply(`Generated password: ${pass}`);
    }
    if (command === 'colorhex') return message.reply('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
    if (command === 'randomfact') {
      const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
      const data = await res.json();
      return message.reply(data.text || 'Failed to fetch random fact.');
    }

    // 71-80: Text Variations
    if (command === 'bold') return message.reply(`**${args.join(' ')}**`);
    if (command === 'italic') return message.reply(`*${args.join(' ')}*`);
    if (command === 'underline') return message.reply(`__${args.join(' ')}__`);
    if (command === 'strikethrough') return message.reply(`~~${args.join(' ')}~~`);
    if (command === 'code') return message.reply(`\`\`\`js\n${args.join(' ')}\n\`\`\``);
    if (command === 'spoiler') return message.reply(`||${args.join(' ')}||`);
    if (command === 'block') return message.reply(`\`\`\`${args.join(' ')}\`\`\``);
    if (command === 'zalgo') {
      const zalgoChars = ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈́', '̓', '̕', '̛', '̀', '́', '̃', '̂', '̌', '͐', '̀', '́', '̋', '̏', '̒', '̓', '̈', '̉', '͛', '͆', '͊', '͋', '͌', '̃', '̂', '̄', '̀', '́', '̆', '̇', '̈', '̊', '̋', '̌', '̍', '̎', '̏', '̐', '̑', '̒', '̔', '̕', '̚', '̛', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '̣'];
      return message.reply(args.join(' ').split('').map(c => c + Array.from({length: Math.floor(Math.random() * 5) + 1}, () => zalgoChars[Math.floor(Math.random() * zalgoChars.length)]).join('')).join(''));
    }
    if (command === 'rot13') return message.reply(args.join(' ').replace(/[a-z]/gi, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13))));
    if (command === 'morse') {
      const morseCode = { 'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/' };
      return message.reply(args.join(' ').toLowerCase().split('').map(c => morseCode[c] || c).join(' '));
    }

    // 81-90: Status & Presence Variations
    if (command === 'playing') { client.user.setActivity(args.join(' '), { type: 'PLAYING' }); return message.reply('Status set!'); }
    if (command === 'watching') { client.user.setActivity(args.join(' '), { type: 'WATCHING' }); return message.reply('Status set!'); }
    if (command === 'listening') { client.user.setActivity(args.join(' '), { type: 'LIagSTENING' }); return messe.reply('Status set!'); }
    if (command === 'streaming') { client.user.setActivity(args.join(' '), { type: 'STREAMING', url: args[args.length - 1].startsWith('http') ? args.pop() : 'https://twitch.tv/example' }); return message.reply('Status set!'); }
    if (command === 'competing') { client.user.setActivity(args.join(' '), { type: 'COMPETING' }); return message.reply('Status set!'); }
    if (command === 'clearstatus') { client.user.setActivity(null); return message.reply('Status cleared!'); }
    if (command === 'nickname') await message.member.setNickname(args.join(' ')), message.reply('Nickname updated!');
    if (command === 'bio') return message.reply('Bio updates not directly supported; edit profile manually.');
    if (command === 'hypesquadbravery') return message.reply('HypeSquad changes require manual app settings.');
    if (command === 'hypesquadbrilliance') return message.reply('HypeSquad changes require manual app settings.');

    // 91-100: Miscellaneous Commands
    if (command === 'qrgen') {
      const text = args.join(' ');
      return message.reply(`QR Code for "${text}": https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=200x200`);
    }
    if (command === 'geoip') {
      const ip = args[0] || '8.8.8.8';
      const res = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await res.json();
      return message.reply(data.status === 'success' ? `Location for ${ip}: ${data.city}, ${data.country} (Lat: ${data.lat}, Lon: ${data.lon})` : 'Failed to fetch GeoIP data.');
    }
    if (command === 'tts') return message.reply('Text-to-speech not supported in self-bots; use external tools.');
    if (command === 'calc') {
      try { return message.reply(`Result: ${eval(args.join(' '))}`); } catch { return message.reply('Invalid expression.'); }
    }
    if (command === 'remindme') {
      const time = parseInt(args[0]);
      const msg = args.slice(1).join(' ');
      if (isNaN(time)) return message.reply('Usage: !remindme [minutes] [message]');
      setTimeout(() => message.channel.send(`Reminder: ${msg}`), time * 60000);
      return message.reply(`Reminder set for ${time} minutes.`);
    }
    if (command === 'note') {
      client.notes = client.notes ? client.notes + '\n' + args.join(' ') : args.join(' ');
      return message.reply('Note saved!');
    }
    if (command === 'notes') return message.reply(client.notes || 'No notes.');
    if (command === 'poll') {
      const pollMsg = await message.reply(`Poll: ${args.join(' ')}`);
      await pollMsg.react('👍');
      await pollMsg.react('👎');
    }
    if (command === 'embed') return message.channel.send({ embeds: [{ title: args[0], description: args.slice(1).join(' '), color: 'BLUE' }] });
    if (command === 'react') await message.react(args[0]), message.reply('Reacted!');

    // 101: Extra - Shutdown
    if (command === 'shutdown') { message.reply('Shutting down...'); process.exit(0); }

    // Unknown
    message.reply('Unknown command. Use !help for info.');
  } catch (error) {
    console.error('Command error:', error);
    message.reply(`Error: ${error.message}`);
  }
});

// Additional Event Handlers
client.on('messageCreate', async (message) => {
  if (message.author.id === client.user.id) return;
  if (client.afk && message.mentions.users.has(client.user.id)) message.reply('I am AFK right now.');
  if (client.autoreply && message.mentions.users.has(client.user.id)) message.reply(client.autoreply);
  if (client.copycat === message.channel.id) message.channel.send(message.content);
});

client.login(token);