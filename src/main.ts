#!/usr/bin/env node
import { Command } from 'commander'
import figlet from 'figlet'
import { handleUpload } from './utils/utils.js'
import chalk from 'chalk'

const program = new Command()
console.log(chalk.bgBlue(chalk.white(figlet.textSync('DISCORD PRISM'))))

program
  .version('1.0')
  .description('Uploads all files in the current directory to a Discord webhook')
  .option('-w, --webhook <char>', 'discord webhook URL')
  .option('-a, --all', 'upload all files in the current directory including nested files')
  .option('-s, --skip  <number>', 'skip the first n files in the current directory')

program
  .command('upload')
  .alias('u')
  .description('upload files to discord')
  .action(async () => {
    await handleUpload(program.opts())
  })

program.parse(process.argv)
