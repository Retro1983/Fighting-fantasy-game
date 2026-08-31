# Game 2 adventure

This folder is isolated from the original prototype in the repository root.

It currently implements:

- unique map locations
- reusable artwork groups
- story text for each location
- between one and four choice buttons per location
- connected forward and return choices
- a two-slot inventory
- the three-item chest choice in CH1
- the torch and trip-wire outcome at SP1
- the sword and monster outcome before RA4
- an Examine button with a hidden gold-coins scene in RA4

Other combat systems, fireballs, gold effects, secrets, and additional events
are not yet implemented.

The Death ending includes a Restart Adventure button that returns to RA1.

CH1 lets the player search the chest and choose exactly two of these three
items: Glowing Torch, Sword, or Bag of Gold Coins. Restarting clears both slots.
The Clear Inventory button also empties both slots and makes the chest searchable
again, allowing the player to correct an item choice.

The Use button opens the inventory for item selection. The Glowing Torch works
at SP1 and the Sword works in the monster chamber. Elsewhere, selecting an item
reports that it will not work there.

The Examine button reports "You search but find nothing." in ordinary rooms.
Examining RA4 reveals the gold-coins artwork and gives the player a single
choice to Continue to Freedom.

Open `index.html` in a browser and select one of the story choices.

At RB1, the left door leads directly to M1, the right door leads directly to
EW1, and the third choice returns to DA1.

At EW1, the left route leads to M2, the right route leads to CH1, and the
third choice returns to RB1.

The lower route runs DA3 to RA2 to M5 to MONSTER. Using the Sword shows the
defeated-monster scene, from which the player can continue to RA4. Trying to
escape without using the Sword leads to the monster death ending.

RA4 leads to the FREEDOM ending, which reuses the freedom artwork extracted
from the original prototype.

Run the structural check with:

```sh
node test-map.js
```

## Artwork key

| Map art ID | File |
| --- | --- |
| RA | `assets/room.png` |
| RB | `assets/Room_two_doors.png` |
| M | `assets/corridor_mid.png` |
| DA | `assets/cell_door.png` |
| SP | `assets/spikes.png` |
| TRIP_WIRE | `assets/trip_wire.png` |
| P | `assets/Pit.png` |
| EW | `assets/east_west.png` |
| CH | `assets/chest_room.png` |
| MONSTER | `assets/monster.png` |
| MONSTER_DEATH | `assets/monster_death.png` |
| GOLD_COINS | `assets/gold_coins.png` |
| FREEDOM | `assets/freedom.webp` |
| DEATH | `assets/death.png` |
| DEATH2 | `assets/death_2.png` |
| DEATH3 | `assets/death_3.png` |

The location IDs and artwork IDs are separate. For example, RA1, RA2, and RA4
are different map locations but all reuse the RA artwork.

At SP1, continuing in the darkness leads to DEATH2. Using the Glowing Torch
loads the trip-wire artwork and replaces the text with the safe trip-wire
message; Continue forward then advances safely to DA3. Using the Sword or Gold
does not prevent the DEATH2 outcome if the player continues forward.

At MONSTER, using the Sword changes the artwork to `monster_death.png` and
allows the player to continue to RA4. Trying to escape without using the Sword
shows `death_3.png` and offers Restart Adventure. The monster scene also has a
visible 10-second countdown; reaching zero triggers the same death ending.
