import { world, system, TicksPerSecond, Player, ItemUseOnBeforeEvent, ItemUseBeforeEvent, ItemUseAfterEvent } from "@minecraft/server";
import { ModalFormData, ActionFormData, ActionFormResponse } from "@minecraft/server-ui";

let faux_operators: { [name: string]: boolean } = {};

let options: { [opt: string]: any } = {
  lava_enabled: false,
  spawners_enabled: false,
  potions_enabled: false,
  spawn_rate: 3,
  spawn_rate_limit: 20,
};

function add_faux_operator(player: Player) {
  if( !(player.name in faux_operators)){
    faux_operators[player.name]=true;
    system.run(() => {
      player.sendMessage(`logrief restrictions are now disabled for you`);
    });
    console.log(`Logrief: faux operator added: ${player.name}`)
  }
}

function remove_faux_operator(player: Player) {
  if( player.name in faux_operators){
    delete faux_operators[player.name];
    system.run(() => {
      player.sendMessage(`logrief restrictions are now enabled for you`);
    });
    console.log(`Logrief: faux operator removed: ${player.name}`)
  }
}

function is_operator(player: Player) {
  if( !player ){
    return false;
  }
  if( (player as any)?.isOp?.()){
    return true;
  }
  return faux_operators[player.name] ?? false;
}

world.beforeEvents.itemUse.subscribe((event: ItemUseBeforeEvent) => {
  if (event.itemStack.typeId === "minecraft:command_block"){
    if(event.itemStack.nameTag === "logrief" ) {
      event.cancel = true;
      add_faux_operator(event.source);
      system.run(() => {
        let form = new ModalFormData()
        form.title("Logrief controls");
        for (const [key, value] of Object.entries(options)) {
          if(typeof value === "boolean"){
            form.toggle(key, value);
          } else if (typeof value === "number"){
            form.slider(key, -1, 20, 1, value);
          }
        }
        form.show(event.source).then(r => {
          if(r.canceled) {
            return;
          }
          if(r.formValues){
            let keys = Object.keys(options);
            for(let index=0; index < r.formValues.length; ++index){
              options[keys[index]] = r.formValues[index];
            }
          }
        }).catch((e) => {
          console.error(e, e.stack);
        });
      });
    } else if (event.itemStack.nameTag === "nologrief" ) {
      event.cancel = true;
      remove_faux_operator(event.source);
    }
  }
});

world.beforeEvents.itemUseOn.subscribe((event: ItemUseOnBeforeEvent) => {
  if (event.itemStack.typeId === "minecraft:command_block"){
    if(event.itemStack.nameTag === "logrief" ) {
      event.cancel = true;
    } else if (event.itemStack.nameTag === "nologrief" ) {
      event.cancel = true;
    }
  }
});

world.afterEvents.itemUse.subscribe((event: ItemUseAfterEvent) => {
  if (event.itemStack.typeId === "minecraft:stick"){
    if(event.itemStack.nameTag === "tpme" ) {
      const player: Player = event.source;
      const loc = world.getDefaultSpawnLocation();
      if( loc.y !== 32767){
        player.sendMessage("Your wish is my command...");
        player.teleport(world.getDefaultSpawnLocation());
      }
    } else if(event.itemStack.nameTag === "tpto" ) {
      const player: Player = event.source;
      const other_players: Player[] = world.getAllPlayers();
      if(other_players.length !== 1) {
        const form = new ActionFormData()
        .title('Teleport')
        .body('Choose the player you would like to teleport to');
        for(const other of other_players){
          form.button(other.name);
        }
        form.show(player).then((response: ActionFormResponse) => {
          if(response.selection !== undefined){
            player.sendMessage("Your wish is my command...");
            const loc = other_players[response.selection].location;
            player.teleport(loc);
          }
        });        
      }
    }
  }
});


function logrief_handle_spawn_egg(event: ItemUseOnBeforeEvent){
  const spawn_rate = options["spawn_rate"];
  if(spawn_rate < 0){
    // Unlimited spawning
    return;
  }
  const player = event.source;
  if(spawn_rate == 0){
    event.cancel = true;
    system.run(() => {
      player.sendMessage(`Entity spawning is currently disabled...`);
    });
  }

  const currentTick = system.currentTick;
  const last_spawn_tick = Number(player.getDynamicProperty("last_spawn_tick") ?? currentTick);
  let spawn_count = Number(player.getDynamicProperty("spawn_count") ?? 0);
  const elapsed = (currentTick - last_spawn_tick) / TicksPerSecond;
  const earned_spawn_tokens = elapsed / spawn_rate;
  spawn_count = Math.max(0, spawn_count - earned_spawn_tokens);

  if (spawn_count >= options["spawn_rate_limit"]) {
    event.cancel = true;
    system.run(() => {
      player.sendMessage(`Too many entities have been spawned by player. Rate limiting is now in effect...`);
    });
  } else {
    ++spawn_count;
  }
  player.setDynamicProperty("spawn_count", spawn_count);
  player.setDynamicProperty("last_spawn_tick", currentTick);
}

function logrief_handle_lava_bucket(event: ItemUseOnBeforeEvent){
  if(!options["lava_enabled"]){
    event.cancel = true;
    system.run(() => {
      const player = event.source;
      player.sendMessage(`Lava placement is disabled`);
    });
  }
}

function logrief_handle_spawner(event: ItemUseOnBeforeEvent){
  if(!options["spawners_enabled"]){
    event.cancel = true;
    system.run(() => {
      const player = event.source;
      player.sendMessage(`Spawner placement is disabled`);
    });
  }
}

function logrief_handle_potion(event: ItemUseBeforeEvent){
  if(!options["potions_enabled"]){
    event.cancel = true;
    const player = event.source;
    system.run(() => {
      player.sendMessage(`Potion use is disabled`);
    });
  }
}

world.beforeEvents.itemUse.subscribe((event) => {
  if (is_operator(event.source)) {
    return;
  }
  if (event.itemStack.typeId.includes("potion") ) {
    logrief_handle_potion(event);
  }
});

world.beforeEvents.itemUseOn.subscribe((event) => {
  if (is_operator(event.source)) {
    return;
  }

  if (event.itemStack.typeId.endsWith("_spawn_egg") ) {
    logrief_handle_spawn_egg(event);
  } else if (event.itemStack.typeId.includes("spawner")) {
    logrief_handle_spawner(event);
  } else if (event.itemStack.typeId === "minecraft:lava_bucket") {
    logrief_handle_lava_bucket(event);
  }
});

console.log("Logrief enabled...");
