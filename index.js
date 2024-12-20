const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const SpotifyWebApi = require('spotify-web-api-node');
const ytdl = require('ytdl-core');
require('dotenv').config();

// Spotify API Setup
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let player;

// Login Discord Bot
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Command Handling
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!')) return;

    const [command, ...args] = message.content.slice(1).split(' ');

    if (command === 'play') {
        const query = args.join(' ');

        // Get Spotify Track Information
        try {
            const tokenResponse = await spotifyApi.clientCredentialsGrant();
            spotifyApi.setAccessToken(tokenResponse.body.access_token);

            const searchResult = await spotifyApi.searchTracks(query);
            const track = searchResult.body.tracks.items[0];

            if (!track) {
                return message.reply('No tracks found.');
            }

            const youtubeQuery = `${track.name} ${track.artists[0].name}`;
            const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

            // Fetch YouTube Audio Stream
            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            player = createAudioPlayer();
            const resource = createAudioResource(ytdl(youtubeUrl, { filter: 'audioonly', quality: 'highestaudio' }));

            connection.subscribe(player);
            player.play(resource);

            message.reply(`Now playing: **${track.name}** by **${track.artists[0].name}**`);
        } catch (error) {
            console.error(error);
            message.reply('Error fetching track.');
        }
    } else if (command === 'stop') {
        if (player) player.stop();
        message.reply('Stopped playing music.');
    }
});

// Login with Token
client.login(process.env.DISCORD_TOKEN);
