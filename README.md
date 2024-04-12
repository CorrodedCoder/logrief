# logrief

## Description

logrief is a Minecraft Bedrock add-on for multi-player games or Bedrock servers to try and reduce the amount of griefing players can inflict on one another (such as pouring Lava over another players work).

It can be used as part of the normal Minecraft Bedrock client or as part of the Minecraft Bedrock Dedicated Server.

## Features

1) (Optionally) Prevent use of Lava buckets.
2) (Optionally) Prevent placement of mob_spawners.
3) (Optionally) Prevent use of potions (such as invisibility).
4) (Optionally) Limit the rate at which mobs may be spawned by spawn eggs or disable their use entirely.
5) Operator only UI for in game configuration of the restrictions.

See [instructions](docs/Instructions.md) for further details of how to install and use the add-on.

## Pre-requisites to build the add-on

[Install NodeJS](https://nodejs.org/en)

## Building the add-on

From a command prompt/terminal browse to the repository and run:

1) `npm install`
2) `npm run mcaddon`

The add-on should be generated as dist/packages/logrief.mcaddon

Note: On Windows, you might need to run the following command under PowerShell in the repository directory before the NPM steps:
`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

## Developer convenience

The infrastructure to build/deploy this add-on was taken from Microsoft's minecraft-scripting-samples and so the [instructions for it](https://github.com/microsoft/minecraft-scripting-samples/blob/main/ts-starter/README.md) may be used here as well.

Specifically you can also run the following command to on Windows to have the add-on build and deliver to your Minecraft client:
`npm run local-deploy`

This is a better option than creating and installing the logrief.mcaddon file directly if you plan to be developing with it since it will update the logrief add-on. If you're going to do this and have already installed the add-on using the logrief.mcaddon file then you may want to remove that from your Minecraft client first before using the local deploy.
