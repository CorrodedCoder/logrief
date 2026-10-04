# logrief 1.1.0

logrief is a behavior pack for Minecraft Bedrock that lets operators configure restrictions intended to reduce griefing in shared worlds.

## Install on a Bedrock client

1. Open `logrief.mcaddon` to import the add-on into Minecraft.
2. Create a world, or edit an existing one, and enable the Logrief behavior pack.

## Use Logrief

On an operator's first join, a stick named `logrief` is added to the first empty inventory slot. If the inventory is full, no stick is added. The pack does not add a second stick if the player already has one. A player's restriction exemption does not grant access to the stick or admin controls.

Use the stick to open the operator controls. Operators can enable or disable restrictions for lava buckets, spawner placement, and potion use, and set the allowed spawn-egg rate. Operators are exempt from restrictions by default; turn off **No restrictions for me** to apply restrictions to yourself (for testing purposes). This choice lasts only for your current session and resets when you leave the world.

The spawn rate is the number of entities a player can spawn before rate limiting begins. A value of `0` disables spawn eggs; `-1` removes the limit. At a limit of `20` per minute, a spawn token recharges every three seconds.

The legacy command-block trigger is also supported: rename a command block `logrief` using an anvil, then use it as an operator to open the same controls.

## Install on a Bedrock server

1. Extract `logrief.mcaddon`. This produces `logrief.bp.mcpack`.
2. Extract `logrief.bp.mcpack`.
3. Copy the extracted behavior pack into a `logrief` directory under `development_behavior_packs`. The resulting structure should include:

   ```text
   development_behavior_packs/logrief/manifest.json
   development_behavior_packs/logrief/pack_icon.png
   development_behavior_packs/logrief/scripts/main.js
   ```

4. In the directory for your world (usually `worlds/Bedrock level`), create or update `world_behavior_packs.json`. Use the `uuid` and `version` from the behavior pack's `header` in `manifest.json`. This example is for Logrief 1.1.0:

   ```json
   [
     {
       "pack_id": "f939258b-12b5-4efc-962d-d59785525dfb",
       "version": [1, 1, 0]
     }
   ]
   ```

5. Restart the server. A successful load includes this message in the server log:

   ```text
   [Scripting] Logrief enabled...
   ```
