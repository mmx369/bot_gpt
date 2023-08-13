import config from 'config'
import { createReadStream } from 'fs'
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  }
  private openai: OpenAIApi
  constructor(apiKey: string) {
    const configuration = new Configuration({
      apiKey,
    })
    this.openai = new OpenAIApi(configuration)
  }

  async chat(messages: Array<ChatCompletionRequestMessage>) {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      })
      return response.data.choices[0].message
    } catch (err) {
      if (err instanceof Error) {
        console.log('Error: ', err.message)
      } else {
        console.log('Unexpected error', err)
      }
    }
  }

  async transcription(filePath: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const response = await this.openai.createTranscription(
        createReadStream(filePath),
        'whisper-1'
      )
      return response.data.text
    } catch (err) {
      if (err instanceof Error) {
        console.log('Error while transcription: ', err.message)
      } else {
        console.log('Unexpected error', err)
      }
    }
  }
}

export const openai = new OpenAI(config.get('OPENAI_KEY'))
