import {
  world,
  system,
  TicksPerSecond,
  Player,
  ItemUseOnBeforeEvent,
  ItemUseOnAfterEvent,
  ItemUseBeforeEvent,
  ItemUseAfterEvent,
} from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

let fauxOperators: { [name: string]: boolean } = {};

let options: { [opt: string]: any } = {
  lava_enabled: false,
  spawners_enabled: false,
  potions_enabled: false,
  spawn_rate: 3,
  spawn_rate_limit: 20,
};

function fauxOperatorAdd(player: Player) {
  if (!(player.name in fauxOperators)) {
    fauxOperators[player.name] = true;
    system.run(() => {
      player.sendMessage(`logrief restrictions are now disabled for you`);
    });
    console.log(`Logrief: faux operator added: ${player.name}`);
  }
}

function fauxOperatorRemove(player: Player) {
  if (player.name in fauxOperators) {
    delete fauxOperators[player.name];
    system.run(() => {
      player.sendMessage(`logrief restrictions are now enabled for you`);
    });
    console.log(`Logrief: faux operator removed: ${player.name}`);
  }
}

function isOperator(player: Player) {
  if (!player) {
    return false;
  }
  if ((player as any)?.isOp?.()) {
    return true;
  }
  return fauxOperators[player.name] ?? false;
}

function isLogriefAdminEnableEvent(event: ItemUseAfterEvent | ItemUseOnAfterEvent): boolean {
  if (event.itemStack.typeId === "minecraft:command_block") {
    if (event.itemStack.nameTag === "logrief") {
      return true;
    }
  }
  return false;
}

function isLogriefAdminDisableEvent(event: ItemUseAfterEvent | ItemUseOnAfterEvent): boolean {
  if (event.itemStack.typeId === "minecraft:command_block") {
    if (event.itemStack.nameTag === "nologrief") {
      return true;
    }
  }
  return false;
}

world.beforeEvents.itemUse.subscribe((event: ItemUseBeforeEvent) => {
  if (isLogriefAdminEnableEvent(event)) {
    event.cancel = true;
    fauxOperatorAdd(event.source);
    system.run(() => {
      let form = new ModalFormData().title("Logrief controls");
      for (const [key, value] of Object.entries(options)) {
        if (typeof value === "boolean") {
          form.toggle(key, value);
        } else if (typeof value === "number") {
          form.slider(key, -1, 20, 1, value);
        }
      }
      form
        .show(event.source)
        .then((r) => {
          if (r.canceled) {
            return;
          }
          if (r.formValues) {
            let keys = Object.keys(options);
            for (let index = 0; index < r.formValues.length; ++index) {
              options[keys[index]] = r.formValues[index];
            }
          }
        })
        .catch((e) => {
          console.error(e, e.stack);
        });
    });
  } else if (isLogriefAdminDisableEvent(event)) {
    event.cancel = true;
    fauxOperatorRemove(event.source);
  }
});

// Because this is a block, without trapping this event, right clicking the command_block
// will attempt to place it, so we need to stop that happening.
world.beforeEvents.itemUseOn.subscribe((event: ItemUseOnBeforeEvent) => {
  if (isLogriefAdminEnableEvent(event) || isLogriefAdminDisableEvent(event)) {
    event.cancel = true;
  }
});

function logriefHandleSpawnEgg(event: ItemUseOnBeforeEvent) {
  const spawnRate = options["spawn_rate"];
  if (spawnRate < 0) {
    // Unlimited spawning
    return;
  }
  const player = event.source;
  if (spawnRate == 0) {
    event.cancel = true;
    system.run(() => {
      player.sendMessage(`Entity spawning is currently disabled...`);
    });
  }

  const currentTick = system.currentTick;
  const last_spawn_tick = Number(player.getDynamicProperty("last_spawn_tick") ?? currentTick);
  let spawn_count = Number(player.getDynamicProperty("spawn_count") ?? 0);
  const elapsed = (currentTick - last_spawn_tick) / TicksPerSecond;
  const earned_spawn_tokens = elapsed / spawnRate;
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

function logriefHandleLavaBucket(event: ItemUseOnBeforeEvent) {
  if (!options["lava_enabled"]) {
    event.cancel = true;
    system.run(() => {
      const player = event.source;
      player.sendMessage(`Lava placement is disabled`);
    });
  }
}

function logriefHandleSpawner(event: ItemUseOnBeforeEvent) {
  if (!options["spawners_enabled"]) {
    event.cancel = true;
    system.run(() => {
      const player = event.source;
      player.sendMessage(`Spawner placement is disabled`);
    });
  }
}

function logriefHandlePotion(event: ItemUseBeforeEvent) {
  if (!options["potions_enabled"]) {
    event.cancel = true;
    const player = event.source;
    system.run(() => {
      player.sendMessage(`Potion use is disabled`);
    });
  }
}

function logriefHandleItemUseEvent(event: ItemUseBeforeEvent) {
  if (isOperator(event.source)) {
    return;
  }
  if (event.itemStack.typeId.includes("potion")) {
    logriefHandlePotion(event);
  }
}

function logriefHandleItemUseOnEvent(event: ItemUseOnBeforeEvent) {
  if (isOperator(event.source)) {
    return;
  }

  if (event.itemStack.typeId.endsWith("_spawn_egg")) {
    logriefHandleSpawnEgg(event);
  } else if (event.itemStack.typeId.includes("spawner")) {
    logriefHandleSpawner(event);
  } else if (event.itemStack.typeId === "minecraft:lava_bucket") {
    logriefHandleLavaBucket(event);
  }
}

world.beforeEvents.itemUse.subscribe((event) => {
  logriefHandleItemUseEvent(event);
});

world.beforeEvents.itemUseOn.subscribe((event) => {
  logriefHandleItemUseOnEvent(event);
});

console.log("Logrief enabled...");
