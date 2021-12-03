# Chat Server written with Deno & TS

![Deno Chat](./assets/images/deno-chat-one.png)

## Setup

You will need Deno installed. [Installation Guide here.](https://deno.land/#installation)

```bash
// to insall on mac with homebrew
brew install deno
```

If you have `npm` installed you can use some npm scripts below, if not the deno commands work just fine.

## Development

`deno run --allow-all --watch=./**/*.ts ./main.ts`
or with npm
`npm run dev`

## Build Executables

`deno compile --allow-all --output=./build/chat_server ./main.ts`
or with npm
`npm run build`
