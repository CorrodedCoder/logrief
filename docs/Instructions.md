# logrief 1.0.1

## Installing on a Bedrock client

To install you should just be able to unpack the zip file and double click on "logrief.mcaddon". This should launch Minecraft and install the add-on.

Then either create a new world and enable this behaviour pack add-on or just enable it in an existing world. It shouldn't cause any trouble, but I could not swear to it.

## Testing the restrictions

You will want to change your world to creative so that you can test the add-on in action. Then give yourself the following items for a test:

- A spawn egg of some kind.
- A "mob_spawner".
- A "lava_bucket".
- A potion (just a regular potion without any effect should be fine).

Attempting to use any of the last three items above should be blocked and a message should appear on your display. If you attempt to use the spawn egg you should find you can spawn ~20 in quick succession until the rate limiting kicks in and you'll only be able to spawn one every 3 seconds.

## Testing the admin functionality

Start by giving yourself a command block and an anvil. Use the anvil to name the command block `logrief`.

Selecting the `logrief` command block and right clicking will bring up the admin panel which allows configuration of the various elements and can also enable/disable the restrictions for your player. Obviously in a single player world this latter point is not relevant, but for a server it is what will allow admins to disable restrictions for themselves only. You could invite someone to your single player world to demonstrate.

Now use the `logrief` command block again and you should be able to change the behaviour by enabling/disabling three of the restrictions and controlling the spawn rate allowed by spawn eggs. The idea is that _spawns_per_minute_ controls the number of entities that you can spawn before the rate limiting kicks in. i.e. if you spawn about 20 creatures then you should start to see messages popping up saying you can't spawn any more.

The ability to spawn additional entities recharges at a rate of 60/_spawns_per_minute_. So if _spawns_per_minute_ is 20 then number of seconds to recharge a spawn is 3. i.e. you spawn 20 animals, wait 3 seconds then you can spawn another... every 3 seconds. Or you could wait 20 \* 3 seconds and then spawn another 20. Well, I'm no UI guy...

Setting the _spawns_per_minute_ to `0` will prevent any use of spawn eggs. Setting it to `-1` will remove any restrictions and allow folks to spawn as many entities as they wish.

## Installing on a Bedrock server

To install this on a Bedrock server takes a little more work, but roughly:

1.  Using some unzip tool extract the contents of "logrief.mcaddon", this will produce the file "logrief.bp.mcpack".
2.  Using some unzip tool extract the contents of "logrief.bp.mcpack".
3.  In your bedrock server under "development_behavior_packs" create a subdirectory called "logrief" and copy the extracted contents there such that your layout looks like:
    development_behavior_packs\logrief\manifest.json
    development_behavior_packs\logrief\pack_icon.png
    development_behavior_packs\logrief\scripts
    development_behavior_packs\logrief\scripts\main.js
4.  Run your server and after it has started shut it down.
5.  Open "valid_known_packs.json" in the root of your server directory and you should now see an entry at the top for logrief. Make a note of the uuid and version.
6.  Under your "worlds\Bedrock level" directory (you might have renamed "Bedrock level" or have more than one world there) you need to create or edit a file called "world_behavior_packs.json". It should include the following:

         [

             {
                 "pack_id" : "f939258b-12b5-4efc-962d-d59785525dfb",
                 "version" : [ 1, 0, 1 ]
             }
         ]

    The `pack_id` should match the uuid you noted earlier in step 5 and the version should also match that in step 5. At the time of typing, the above is correct.

7.  Restart your server. If all went well you should see the following in your server log:

         [Scripting] Logrief enabled...
