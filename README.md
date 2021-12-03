# Chat Server written with Deno & TS

## Setup

You will need Deno installed. [Installation Guide here.](https://deno.land/#installation)

```bash
// if on mac
brew install deno
```

If you have `npm` installed you can use some npm scripts below, if not the deno commands work just fine.

## Development

`deno run --allow-all --watch=./**/*.ts ./main.ts`
or with npm
`npm run dev`

## Build Executable

`deno compile --allow-all --output=./build/chat_server ./main.ts`
or with npm
`npm run prod`


