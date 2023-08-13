import config from 'config'
import { Telegraf } from 'telegraf'
import { code } from 'telegraf/format'
import { ogg } from './ogg.js'
import { openai } from './openai.js'

const bot = new Telegraf(config.get('TELRGRAM_TOKEN'))

bot.launch()

bot.on('voice', async (ctx) => {
  try {
    await ctx.reply(code('Waiting response from server...'))
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    const oggPath = (await ogg.create(link.href, userId)) as string
    const mp3Path = (await ogg.toMp3(oggPath, userId)) as string

    const text = (await openai.transcription(mp3Path)) as string
    await ctx.reply(code(text))
    const messages = [{ role: openai.roles.USER, content: text }]
    //@ts-ignore
    const response = await openai.chat(messages)
    //@ts-ignore
    await ctx.reply(response?.content)
  } catch (err) {
    if (err instanceof Error) {
      console.log('Error: ', err.message)
    } else {
      console.log('Unexpected error', err)
    }
  }
})

bot.command('start', async (ctx) => {
  await ctx.reply(JSON.stringify(ctx.message, null, 2))
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
