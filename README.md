# logrief

## Description

logrief is a Minecraft Bedrock add-on for multi-player games or Bedrock servers to try and reduce the amount of griefing players can inflict on one another (such as pouring Lava over another players work).

It can be used as part of the normal Minecraft Bedrock client or as part of the Minecraft Bedrock Dedicated Server.

## Demonstration

A demonstration of the features can be seen at https://youtu.be/SmusZ_KXlik

## Features

1. (Optionally) Prevent use of Lava buckets.
2. (Optionally) Prevent placement of mob_spawners.
3. (Optionally) Prevent use of potions (such as invisibility).
4. (Optionally) Limit the rate at which mobs may be spawned by spawn eggs or disable their use entirely.
5. Operator only UI for in game configuration of the restrictions.

See [instructions](docs/Instructions.md) for further details of how to install and use the add-on.

## Pre-requisites to build the add-on

[Install NodeJS](https://nodejs.org/en)

## Building the add-on

From a command prompt/terminal browse to the repository and run:

1. `npm install`
2. `npm run mcaddon`

The add-on should be generated as dist/packages/logrief.mcaddon

**Note**: On Windows, you might need to run the following command under PowerShell in the repository directory before the NPM steps:
`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

## Building and development

This project uses a lightweight `esbuild`-based build script instead of the older Microsoft scripting starter workflow.

For local development, use:

- `npm install`
- `npm run build` to generate the bundled script in `dist/scripts`
- `npm run dev` to watch for source changes and rebuild automatically
- `npm run mcaddon` to produce the final Bedrock package at `dist/packages/logrief.mcaddon`

For end users wanting to experiment in a single player world, import the generated `.mcaddon` file from `dist/packages/logrief.mcaddon`.
