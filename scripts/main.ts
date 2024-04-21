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

let exemptedUsers: { [name: string]: boolean } = {};

let options: { [opt: string]: any } = {
  lava_enabled: false,
  spawners_enabled: false,
  potions_enabled: false,
  spawn_rate: 3,
  spawn_rate_limit: 20,
};

function exemptedUserAdd(player: Player) {
  if (!(player.name in exemptedUsers)) {
    exemptedUsers[player.name] = true;
    player.sendMessage(`logrief restrictions are now disabled for you`);
    console.log(`Logrief: ${player.name} was added to exempted users`);
  }
}

function exemptedUserRemove(player: Player) {
  if (player.name in exemptedUsers) {
    delete exemptedUsers[player.name];
    player.sendMessage(`logrief restrictions are now enabled for you`);
    console.log(`Logrief: ${player.name} was removed from exempted users`);
  }
}

function isExemptedUser(player: Player) {
  if (!player) {
    return false;
  }
  // I have no idea if this will actually work.
  // I'd rather find a compile/transpile time way to detect that
  // isOp is available and callable with zero parameters
  if ((player as any)?.isOp?.()) {
    return true;
  }
  return exemptedUsers[player.name] ?? false;
}

function logriefAdminUI(player: Player) {
  let form = new ModalFormData().title("Logrief controls");
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === "boolean") {
      form.toggle(key, value);
    } else if (typeof value === "number") {
      form.slider(key, -1, 20, 1, value);
    }
  }
  form
    .show(player)
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
}

function logriefHandleAdminEnableEvent(player: Player) {
  exemptedUserAdd(player);
  system.run(() => logriefAdminUI(player));
}

function logriefHandleAdminDisableEvent(player: Player) {
  exemptedUserRemove(player);
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

function logriefHandleAdminItemUseEvent(event: ItemUseBeforeEvent) {
  if (isLogriefAdminEnableEvent(event)) {
    event.cancel = true;
    logriefHandleAdminEnableEvent(event.source);
  } else if (isLogriefAdminDisableEvent(event)) {
    event.cancel = true;
    logriefHandleAdminDisableEvent(event.source);
  }
}

// Because this is a block, without trapping this event, right clicking the command_block
// will attempt to place it, so we need to stop that happening.
function logriefHandleAdminItemUseOnEvent(event: ItemUseOnBeforeEvent) {
  if (isLogriefAdminEnableEvent(event) || isLogriefAdminDisableEvent(event)) {
    event.cancel = true;
  }
}

function logriefHandleSpawnEgg(event: ItemUseOnBeforeEvent) {
  const spawnRate = options["spawn_rate"];
  if (spawnRate < 0) {
    // Unlimited spawning
    return;
  }
  const player = event.source;
  if (spawnRate == 0) {
    event.cancel = true;
    player.sendMessage(`Entity spawning is currently disabled...`);
  }

  const currentTick = system.currentTick;
  const last_spawn_tick = Number(player.getDynamicProperty("last_spawn_tick") ?? currentTick);
  let spawn_count = Number(player.getDynamicProperty("spawn_count") ?? 0);
  const elapsed = (currentTick - last_spawn_tick) / TicksPerSecond;
  const earned_spawn_tokens = elapsed / spawnRate;
  spawn_count = Math.max(0, spawn_count - earned_spawn_tokens);

  if (spawn_count >= options["spawn_rate_limit"]) {
    event.cancel = true;
    player.sendMessage(`Too many entities have been spawned by player. Rate limiting is now in effect...`);
  } else {
    ++spawn_count;
  }
  player.setDynamicProperty("spawn_count", spawn_count);
  player.setDynamicProperty("last_spawn_tick", currentTick);
}

function logriefHandleLavaBucket(event: ItemUseOnBeforeEvent) {
  if (!options["lava_enabled"]) {
    event.cancel = true;
    event.source.sendMessage(`Lava placement is disabled`);
  }
}

function logriefHandleSpawner(event: ItemUseOnBeforeEvent) {
  if (!options["spawners_enabled"]) {
    event.cancel = true;
    event.source.sendMessage(`Spawner placement is disabled`);
  }
}

function logriefHandlePotion(event: ItemUseBeforeEvent) {
  if (!options["potions_enabled"]) {
    event.cancel = true;
    event.source.sendMessage(`Potion use is disabled`);
  }
}

function logriefHandleItemUseEvent(event: ItemUseBeforeEvent) {
  if (isExemptedUser(event.source)) {
    return;
  }
  if (event.itemStack.typeId.includes("potion")) {
    logriefHandlePotion(event);
  }
}

function logriefHandleItemUseOnEvent(event: ItemUseOnBeforeEvent) {
  if (isExemptedUser(event.source)) {
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

function logriefRegisterEvents() {
  world.beforeEvents.itemUse.subscribe(logriefHandleAdminItemUseEvent);
  world.beforeEvents.itemUseOn.subscribe(logriefHandleAdminItemUseOnEvent);

  world.beforeEvents.itemUse.subscribe(logriefHandleItemUseEvent);
  world.beforeEvents.itemUseOn.subscribe(logriefHandleItemUseOnEvent);
}

logriefRegisterEvents();

console.log("Logrief enabled...");
