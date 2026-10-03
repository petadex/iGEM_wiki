/**
 * Spawn `gatsby develop` from the repo root (so it works from any cwd),
 * passing through extra CLI args and the exit code.
 */
const path = require('path')
const { spawn } = require('child_process')

const root = path.join(__dirname, '..')
process.chdir(root)

const cli = path.join(root, 'node_modules', 'gatsby', 'cli.js')
const extraArgs = process.argv.slice(2).filter(a => a.length > 0)
const child = spawn(process.execPath, [cli, 'develop', ...extraArgs], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('error', err => {
  console.error(err)
  process.exit(1)
})

child.on('exit', code => {
  process.exit(code ?? 1)
})
