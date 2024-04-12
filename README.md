# logrief

## Description

logrief is a Minecraft Bedrock add-on for multi-player games or Bedrock servers to try and reduce the amount of griefing players can inflict on one another (such as pouring Lava over another players work).

It can be used as part of the normal Minecraft Bedrock client or as part of the Minecraft Bedrock Dedicated Server.

## Features

1) Prevent use of Lava buckets.
2) Prevent placement of mob_spawners.
3) Prevent use of potions (such as invisibility).
4) Limit the rate at which mobs may be spawned by spawn eggs or disable their use entirely.
5) Operator only UI for in game configuration of the restrictions.

See [instructions](docs/Instructions.md) for further details of how to install and use the add-on.

## Pre-requisites to build the add-on

Install https://nodejs.org/en

## Building the add-on

From a command prompt/terminal browse to the repository and run:
1) `npm install`
2) `npm run mcaddon`

The add-on should be generated as dist/packages/logrief.mcaddon
