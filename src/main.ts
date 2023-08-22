/* eslint-disable @typescript-eslint/ban-ts-comment */
import config from 'config'
import { Telegraf, session } from 'telegraf'
import { code } from 'telegraf/format'
import { ogg } from './ogg.js'
import { openai } from './openai.js'

console.log(config.get('TEST_ENV'))

const INITIAL_SESSION = {
  messages: [],
}

const bot = new Telegraf(config.get('TELRGRAM_TOKEN'))

bot.use(session())

bot.command('new', async (ctx) => {
  //@ts-ignore
  ctx.session = INITIAL_SESSION
  await ctx.reply('Waiting for your messages...')
})

bot.command('start', async (ctx) => {
  //@ts-ignore
  ctx.session = INITIAL_SESSION
  await ctx.reply('Waiting for your messages...')
})

bot.on('voice', async (ctx) => {
  //@ts-ignore
  ctx.session ??= INITIAL_SESSION
  //@ts-ignore
  try {
    await ctx.reply(code('Waiting response from server...'))
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    const oggPath = (await ogg.create(link.href, userId)) as string
    const mp3Path = (await ogg.toMp3(oggPath, userId)) as string

    const text = (await openai.transcription(mp3Path)) as string
    await ctx.reply(code(text))
    //@ts-ignore
    ctx.session.messages.push({ role: openai.roles.USER, content: text })
    //@ts-ignore
    const response = await openai.chat(ctx.session.messages)
    //@ts-ignore
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response?.content,
    })
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

bot.on('text', async (ctx) => {
  //@ts-ignore
  ctx.session ??= INITIAL_SESSION
  //@ts-ignore
  try {
    await ctx.reply(code('Waiting response from server...'))
    //@ts-ignore
    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text,
    })
    //@ts-ignore
    const response = await openai.chat(ctx.session.messages)
    //@ts-ignore
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response?.content,
    })
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

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
