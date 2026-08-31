# Confirmed design decisions

## Interface

- The game is a first-person interactive story, not WASD movement.
- Each location shows artwork and a short passage of text.
- The player is offered between one and four clearly labelled choices.
- Examine is always available in playable rooms.
- Map codes and artwork codes remain internal and are not shown to the player.

## RB1 route

- Left door: M1
- Right door: EW1
- Return the way the player came: DA1

## EW1 route

- Left route: M2
- Right route: CH1
- Return the way the player came: RB1

## Lower route

- DA3 -> RA2 -> M5 -> MONSTER
- Use Sword -> MONSTER_DEATH -> RA4 -> FREEDOM
- Try to escape without using Sword -> DEATH3
- RA4 returns to the defeated-monster scene, not to a living monster.
- RA5 is not a playable stop in this route.

## Ending

- RA4 leads to FREEDOM.
- Examining RA4 reveals GOLD_COINS; that scene continues to FREEDOM.
- The freedom artwork is reused from the original prototype.

## Examine

- In RA4, Examine loads `assets/gold_coins.png` and offers Continue to Freedom.
- In every other playable room, Examine displays "You search but find nothing."
- Examine is disabled on completed and death endings.

## P1 pit choice

- Attempt to jump the pit: DEATH ending.
- Return the way the player came: M1.
- The Death ending uses `assets/death.png` supplied by the user.
- The Death ending has a Restart Adventure button that returns to RA1.

## Inventory and CH1

- The interface has a collapsible inventory with two item slots.
- CH1 choices are: enter the next corridor, search the chest, or return to EW1.
- The chest contains a Glowing Torch, Sword, and Bag of Gold Coins.
- The player must choose exactly two of those three items.
- After choosing two items, the chest choice is removed.
- Restart Adventure empties the inventory and resets the chest.
- Clear Inventory empties both slots and makes the chest searchable again.
- Use opens the inventory and makes occupied slots selectable.
- Using an item without a defined location effect displays that it will not work.
- On desktop, the scene remains locked to the viewport while the story panel
  scrolls independently, preventing artwork from shifting as choices change.
- Story text, headings, choices, and inventory controls cannot shrink over one
  another; the panel scrolls instead when its contents exceed the available room.

## Deferred gameplay

Full combat, fireballs, gold effects, secrets, and other consequences are still
deliberately excluded. The pit, trip-wire, and sword-versus-monster outcomes are
defined as story choices rather than combat systems.

## SP1 darkness and trip wire

- Text: "The passage is getting extremely dark."
- Continue forward without using the torch: DEATH2.
- Use Sword or Gold and then continue: DEATH2.
- Use Glowing Torch: remain on SP1, load `assets/trip_wire.png`, and replace all
  text with "You see a trip wire and safely continue on your adventure."
- Continue forward after using the torch: advance to DA3.
- Turn back: M3.
- DEATH2 uses `assets/death_2.png` and offers Restart Adventure.

## Monster encounter

- Text: "A monster stands before you, and it looks hungry!!!"
- A visible timer counts down from 10 seconds on entering the scene.
- If the timer reaches zero, the player is sent to DEATH3.
- Use Sword: show `assets/monster_death.png`, then allow the player to continue
  to RA4 and stop the timer immediately.
- Try to escape without using Sword: show `assets/death_3.png` with the text
  "You were not quick enough to escape."
- The monster death scene offers Restart Adventure.
