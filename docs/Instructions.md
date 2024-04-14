# logrief 1.0.0

## Installing on a Bedrock client

To install you should just be able to unpack the zip file and double click on "logrief.mcaddon". This should launch Minecraft and install the add-on.

Then either create a new world and enable this behaviour pack add-on or just enable it in an existing world. It shouldn't cause any trouble, but I could not swear to it.

## Testing the restrictions

You will want to change your world to creative so that you can test the add-on in action. Then give yourself the following items for a test:

* A spawn egg of some kind.
* A "mob_spawner".
* A "lava_bucket".
* A potion (just a regular potion without any effect should be fine).

Attempting to use any of the last three items above should be blocked and a message should appear on your display. If you attempt to use the spawn egg you should find you can spawn ~20 in quick succession until the rate limiting kicks in and you'll only be able to spawn one every 3 seconds.

## Testing the admin functionality

Start by giving yourself two command blocks and an anvil. Use the anvil to name the two command blocks `logrief` and `nologrief`.

Selecting the `logrief` command block and right clicking will bring up the admin panel which allows configuration of the various elements and also will disable the add-on for you. Obviously in a single player world this latter point is not relevant, but for a server it is what will allow admins to not have such restrictions in place, whilst others will. You could invite someone to your single player world to demonstrate.

Don't change any of the settings but click submit or cancel and you should now be able to see that the restrictions are lifted for you and you can use the relevant functionality as per usual.

Select the `nologrief` command block and right click and you should now find that the restrictions are re-enabled.

Now use the `logrief` command block again and you should be able to change the behaviour by enabling/disabling three of the restrictions and controlling the spawn rate allowed by spawn eggs. The values aren't very intuitive but the idea is that *spawn_rate_limit* controls the number of elements that you can spawn before the *rate_limit* kicks in. i.e. if you spawn about 20 creatures then you should start to see messages popping up saying you can't spawn any more.

The *rate_limit* is the number of seconds to recharge a spawn. i.e. you spawn 20 animals, wait 3 seconds then you can spawn another... every 3 seconds. Or you could wait 20 * 3 seconds and then spawn another 20. Well, I'm no UI guy...

Setting the *spawn_rate* to `0` will prevent any use of spawn eggs. Setting it to `-1` will remove any restrictions and allow folks to spawn as many creatures as they wish.

## Installing on a Bedrock server

To install this on a Bedrock server takes a little more work, but roughly:

1) Using some unzip tool extract the contents of "logrief.mcaddon", this will produce the file "logrief.bp.mcpack".
2) Using some unzip tool extract the contents of "logrief.bp.mcpack".
3) In your bedrock server under "development_behavior_packs" create a subdirectory called "logrief" and copy the extracted contents there such that your layout looks like:
    development_behavior_packs\logrief\manifest.json
    development_behavior_packs\logrief\pack_icon.png
    development_behavior_packs\logrief\scripts
    development_behavior_packs\logrief\scripts\main.js
4) Run your server and after it has started shut it down.
5) Open "valid_known_packs.json" in the root of your server directory and you should now see an entry at the top for logrief. Make a note of the uuid and version.
6) Under your "worlds\Bedrock level" directory (you might have renamed "Bedrock level" or have more than one world there) you need to create or edit a file called "world_behavior_packs.json". It should include the following:

        [
            
            {
                "pack_id" : "f939258b-12b5-4efc-962d-d59785525dfb",
                "version" : [ 1, 0, 0 ]
            }
        ]

    The `pack_id` should match the uuid you noted earlier in step 5 and the version should also match that in step 5. At the time of typing, the above is correct.

7) Restart your server. If all went well you should see the following in your server log:

        [Scripting] Logrief enabled...
