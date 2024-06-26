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

let exemptedUsers = new Set<string>();

const defaultOptions: { [opt: string]: any } = {
  lava_enabled: false,
  spawners_enabled: false,
  potions_enabled: false,
  spawns_per_minute: 20,
};

let options: { [opt: string]: any } = defaultOptions;

function exemptedUserAdd(player: Player) {
  if (!exemptedUsers.has(player.name)) {
    exemptedUsers.add(player.name);
    world.setDynamicProperty("logrief_exempted_users", JSON.stringify([...exemptedUsers]));
    console.log(`Logrief: ${player.name} added to exempted users`);
  }
}

function exemptedUserRemove(player: Player) {
  if (exemptedUsers.delete(player.name)) {
    world.setDynamicProperty("logrief_exempted_users", JSON.stringify([...exemptedUsers]));
    console.log(`Logrief: ${player.name} removed from exempted users`);
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
  return exemptedUsers.has(player.name);
}

function addFormOption(form: ModalFormData, key: string, value: boolean | number | string) {
  if (typeof value === "boolean") {
    form.toggle(key, value);
  } else if (typeof value === "number") {
    form.slider(key, -1, 60, 1, value);
  } else if (typeof value === "string") {
    form.textField(key, value);
  }
}

function logriefAdminUI(player: Player) {
  let form = new ModalFormData().title("Logrief controls");
  let optionsChanged: boolean = false;
  let optionHandlers: ((value: any) => void)[] = [];
  for (const [key, value] of Object.entries(options)) {
    addFormOption(form, key, value);
    optionHandlers.push((val) => {
      if (options[key] !== val) {
        options[key] = val;
        optionsChanged = true;
      }
    });
  }
  form.toggle("No restrictions for me", isExemptedUser(player));
  optionHandlers.push((val: boolean) => {
    if (val) {
      exemptedUserAdd(player);
    } else {
      exemptedUserRemove(player);
    }
  });
  form
    .show(player)
    .then((r) => {
      if (r.canceled) {
        return;
      }
      if (r.formValues) {
        for (let index = 0; index < r.formValues.length; ++index) {
          optionHandlers[index](r.formValues[index]);
        }
        if (optionsChanged) {
          world.setDynamicProperty("logrief_options", JSON.stringify(options));
        }
      }
    })
    .catch((e) => {
      console.error(e, e.stack);
    });
}

function isLogriefAdminEvent(event: ItemUseAfterEvent | ItemUseOnAfterEvent): boolean {
  if (event.itemStack.typeId === "minecraft:command_block") {
    if (event.itemStack.nameTag === "logrief") {
      return true;
    }
  }
  return false;
}

function logriefHandleAdminItemUseEvent(event: ItemUseBeforeEvent) {
  if (isLogriefAdminEvent(event)) {
    event.cancel = true;
    system.run(() => logriefAdminUI(event.source));
  }
}

// Because this is a block, without trapping this event, right clicking the command_block
// will attempt to place it, so we need to stop that happening.
function logriefHandleAdminItemUseOnEvent(event: ItemUseOnBeforeEvent) {
  if (isLogriefAdminEvent(event)) {
    event.cancel = true;
  }
}

function logriefHandleSpawnEgg(event: ItemUseOnBeforeEvent) {
  const spawnsPerMinute = options["spawns_per_minute"];
  if (spawnsPerMinute < 0) {
    // Unlimited spawning
    return;
  }
  const player = event.source;
  if (spawnsPerMinute == 0) {
    event.cancel = true;
    player.sendMessage(`Entity spawning is currently disabled...`);
    return;
  }

  // This is sort of "the leaky bucket" strategy for rate limiting:
  // https://en.wikipedia.org/wiki/Leaky_bucket
  const currentTick = system.currentTick;
  const lastSpawnTick = Number(player.getDynamicProperty("last_spawn_tick") ?? currentTick);
  const elapsed = (currentTick - lastSpawnTick) / TicksPerSecond;
  const spawnRechargeRate = 60 / spawnsPerMinute;
  const earnedSpawnTokens = elapsed / spawnRechargeRate;
  let spawnCount = Number(player.getDynamicProperty("spawn_count") ?? 0);
  spawnCount = Math.max(0, spawnCount - earnedSpawnTokens);

  if (spawnCount >= spawnsPerMinute) {
    event.cancel = true;
    player.sendMessage(`Too many entities have been spawned by player. Rate limiting is now in effect...`);
    if (spawnCount - spawnsPerMinute > 1) {
      // If the spawnCount is greater than the spawnsPerMinute by more than 1 then the admin must
      // have reconfigured the setting to a lower value, so let's adjust their spawnCount to be no
      // more than one greater or they could be stuck waiting for a very long time.
      spawnCount = spawnsPerMinute + 1;
    }
  } else {
    ++spawnCount;
  }
  player.setDynamicProperty("spawn_count", spawnCount);
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

function logriefInit() {
  const logriefOptionProperty = world.getDynamicProperty("logrief_options");
  if (logriefOptionProperty) {
    options = JSON.parse(logriefOptionProperty as string);
    console.log(`Logrief: Loaded options as: ${logriefOptionProperty}`);
  }
  const logriefExemptedUsersProperty = world.getDynamicProperty("logrief_exempted_users");
  if (logriefExemptedUsersProperty) {
    exemptedUsers = new Set<string>(JSON.parse(logriefExemptedUsersProperty as string));
    console.log(`Logrief: Loaded exempted users as: ${[...exemptedUsers]}`);
  }
  logriefRegisterEvents();
}

logriefInit();

console.log("Logrief enabled...");
