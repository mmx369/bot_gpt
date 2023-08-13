import { unlink } from 'fs'

export async function removeFile(path: string) {
  try {
    await unlink(path, () => {})
  } catch (err) {
    if (err instanceof Error) {
      console.log('Error while removing file: ', err.message)
    } else {
      console.log('Unexpected error', err)
    }
  }
}
