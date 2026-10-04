import {
  Container,
  world,
  system,
  TicksPerSecond,
  Player,
  EntityInventoryComponent,
  ItemStack,
  PlayerInteractWithBlockBeforeEvent,
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

  const permissionLevel = player.playerPermissionLevel;
  if (typeof permissionLevel === "number" && permissionLevel >= 2) {
    return true;
  }

  return exemptedUsers.has(player.name);
}

function addFormOption(form: ModalFormData, key: string, value: boolean | number | string) {
  if (typeof value === "boolean") {
    form.toggle(key, { defaultValue: value });
  } else if (typeof value === "number") {
    form.slider(key, -1, 60, { defaultValue: value, valueStep: 1 });
  } else if (typeof value === "string") {
    form.textField(key, "", { defaultValue: value });
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
  form.toggle("No restrictions for me", { defaultValue: isExemptedUser(player) });
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

function isLogriefAdminEvent(player: Player, itemStack: ItemStack | undefined): boolean {
  if (!itemStack || !isExemptedUser(player)) {
    return false;
  }

  const isLogriefTool =
    (itemStack.typeId === "minecraft:command_block" || itemStack.typeId === "minecraft:stick") &&
    itemStack.nameTag === "logrief";

  return isLogriefTool;
}

function logriefHandleAdminItemUseEvent(event: ItemUseBeforeEvent) {
  if (isLogriefAdminEvent(event.source, event.itemStack)) {
    event.cancel = true;
    system.run(() => logriefAdminUI(event.source));
  }
}

// Because this is a block, without trapping this event, right clicking the command_block
// will attempt to place it, so we need to stop that happening.
function logriefHandleAdminItemUseOnEvent(event: PlayerInteractWithBlockBeforeEvent) {
  if (isLogriefAdminEvent(event.player, event.itemStack)) {
    event.cancel = true;
  }
}

function logriefHandleSpawnEgg(event: PlayerInteractWithBlockBeforeEvent) {
  const spawnsPerMinute = options["spawns_per_minute"];
  if (spawnsPerMinute < 0) {
    // Unlimited spawning
    return;
  }
  const player = event.player;
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

function logriefHandleLavaBucket(event: PlayerInteractWithBlockBeforeEvent) {
  if (!options["lava_enabled"]) {
    event.cancel = true;
    event.player.sendMessage(`Lava placement is disabled`);
  }
}

function logriefHandleSpawner(event: PlayerInteractWithBlockBeforeEvent) {
  if (!options["spawners_enabled"]) {
    event.cancel = true;
    event.player.sendMessage(`Spawner placement is disabled`);
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

function logriefHandleItemUseOnEvent(event: PlayerInteractWithBlockBeforeEvent) {
  if (isExemptedUser(event.player)) {
    return;
  }

  const itemTypeId = event.itemStack?.typeId;
  if (!itemTypeId) {
    return;
  }

  if (itemTypeId.endsWith("_spawn_egg")) {
    logriefHandleSpawnEgg(event);
  } else if (itemTypeId.includes("spawner")) {
    logriefHandleSpawner(event);
  } else if (itemTypeId === "minecraft:lava_bucket") {
    logriefHandleLavaBucket(event);
  }
}

function findLogriefInInventory(inventory: Container): number {
  for (let slot = 0; slot < inventory.size; slot++) {
    const item = inventory.getItem(slot);
    if (item?.typeId === "minecraft:stick" && item.nameTag === "logrief") {
      return slot;
    }
  }
  return -1;
}

function findEmptySlotInInventory(inventory: Container): number {
  for (let slot = 0; slot < inventory.size; slot++) {
    if (!inventory.getItem(slot)) {
      return slot;
    }
  }
  return -1;
}

function createLogriefStick() {
  const logriefStick = new ItemStack("minecraft:stick");
  logriefStick.nameTag = "logrief";
  return logriefStick;
}

function addLogriefToInventory(player: Player) {
  if (!isExemptedUser(player)) {
    return;
  }

  const inventoryComponent = player.getComponent(EntityInventoryComponent.componentId) as
    | EntityInventoryComponent
    | undefined;
  const inventory = inventoryComponent?.container;
  if (!inventory) {
    return;
  }

  if (findLogriefInInventory(inventory) !== -1) {
    return;
  }

  const emptySlot = findEmptySlotInInventory(inventory);
  if (emptySlot === -1) {
    return;
  }

  inventory.setItem(emptySlot, createLogriefStick());
}

function logriefRegisterEvents() {
  world.beforeEvents.itemUse.subscribe(logriefHandleAdminItemUseEvent);
  world.beforeEvents.playerInteractWithBlock.subscribe(logriefHandleAdminItemUseOnEvent);

  world.beforeEvents.itemUse.subscribe(logriefHandleItemUseEvent);
  world.beforeEvents.playerInteractWithBlock.subscribe(logriefHandleItemUseOnEvent);

  world.afterEvents.playerSpawn.subscribe((event) => {
    if (event.initialSpawn) {
      addLogriefToInventory(event.player);
    }
  });
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
