import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { ValidateUpload } from '../validator.js'
import { ZodError } from 'zod'
import mime from 'mime'
import chalk from 'chalk'
import { exit } from 'process'

let totalLength: number = 0
let currentIndex: number = 0

export function humanFileSize(size: number) {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
  return (size / Math.pow(1024, i)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
}

export async function validateWebhookURL(webhookURL: string) {
  try {
    const response = await axios.head(webhookURL)
    return response.status === 200 ? true : false
  } catch (error) {
    return false
  }
}

export function getFiles(dir: string, files: string[] = [], recursive: boolean = false) {
  const entries = fs.readdirSync(dir)

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const fileStats = fs.statSync(fullPath)

    if (fileStats.isDirectory()) {
      // Recursively call function for subdirectories
      if (recursive) getFiles(fullPath, files)
    } else {
      // Add file path to the files array
      files.push(fullPath)
    }
  }
  return files
}
export function handleError(error: any) {
  if (error instanceof ZodError) {
    const errors = JSON.parse(error.message)
    errors.forEach((error: any) => {
      console.log(error.message)
    })
  } else console.log(error.message)
}

export async function sendFile(index: number, files: string[], webhookUrl: string) {
  const file = files[index]

  const fileInfo = {
    name: path.basename(file),
    extension: path.extname(file),
    size: fs.statSync(file).size,
    formattedSize: humanFileSize(fs.statSync(file).size),
    type: mime.getType(file),
    content: fs.readFileSync(file),
  }

  if (fileInfo.size > 20000000) {
    const progress = chalk.blueBright(`[${index + 1}/${totalLength}]`)
    const info = chalk.magentaBright(`${fileInfo.name}(${fileInfo.formattedSize})`)
    console.log(
      chalk.redBright(`${progress} ${info} - ${chalk.redBright('Error: File size is too large! Skipping...')}`),
    )
    if (currentIndex < totalLength - 1) sendFile(++currentIndex, files, webhookUrl)
    else {
      console.log(chalk.greenBright('Done!'))
      exit(0)
    }
  }

  const contentBlob = new Blob([fileInfo.content])

  // Create a FormData object and append the file
  const formData = new FormData()
  formData.append('file', contentBlob, fileInfo.name)

  // Make a POST request to the webhook URL with the file
  const resp = await axios.post(webhookUrl, formData)

  const progress = chalk.blueBright(`[${index + 1}/${totalLength}]`)
  const info = chalk.magentaBright(`${fileInfo.name}(${fileInfo.formattedSize})`)
  const status = resp.status === 200 ? chalk.greenBright(resp.status) : chalk.redBright(resp.status)

  console.log(`${progress} ${info} - ${status}`)
  if (resp.status == 200) {
    if (currentIndex < totalLength - 1) sendFile(++currentIndex, files, webhookUrl)
    else {
      console.log(chalk.greenBright('Done!'))
      exit(0)
    }
  } else if (resp.status == 429) {
    console.log(chalk.redBright('Rate limited, waiting 2 seconds...'))
    setTimeout(() => {
      sendFile(currentIndex, files, webhookUrl)
    }, 2000)
  } else console.log(chalk.bgRedBright('Error: ' + resp.statusText))
}

export async function handleUpload(options: any) {
  try {
    // Validate the data
    ValidateUpload(options)

    // Check if the provided webhook URL is valid
    const isWebhookURLValid = await validateWebhookURL(options.webhook)

    // Throw an error if the webhook URL is invalid
    if (!isWebhookURLValid) throw new Error('Invalid webhook URL')
    else console.log(chalk.greenBright('Webhook URL is valid'))

    // Fetch all files from the current directory
    const files = getFiles('./images', [], options.all ? true : false)
    totalLength = files.length

    console.log(chalk.blueBright(`Found ${totalLength} files.`))

    sendFile(0, files, options.webhook)
  } catch (error: any) {
    handleError(error)
  }
}
