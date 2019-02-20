game_log("---Script Start---");
//Put monsters you want to kill in here
// Script by Spadar
// modified by fart
//If your character has no target, it will travel to a spawn of the first monster in the list below.
load_code(3);
load_code(12);
var monster_targets = ["osnake", "snake"];

var use_skills = false; // set to true to use skills or false to not use skills
var characterClass = "ranger"; // set your character class here
var skillList = ['5shot']; // use this skill
var manaSkillThreshhold = 420; // use skills above this much mana

var attemptKite = false; // attempt to poorly kite enemies?

var merchant_character_name = "shidded";
var gold_empty_threshold = 200000;
var potion_allowance = 30000;
var exchange_item_name = "candypop";

var justRespawned = false;

var bank_at_empty_slots = 30;

var state = "farm";

var min_potions = 20; //The number of potions at which to do a resupply run.
var purchase_amount = 500;//How many potions to buy at once.
var potion_types = ["hpot0", "mpot0"];//The types of potions to keep supplied.

//Movement And Attacking
setInterval(function () {
	
	//Determine what state we should be in.
	state_controller();
	//game_log(state);
	//Switch statement decides what we should do based on the value of 'state'
	switch(state)
	{
		case "farm":
			farm();
			break;
		case "resupply_potions":
			resupply_potions();
			break;
		case "emptying_inventory":
			empty_inventory();
			break;
	}
}, 75);//Execute 10 times per second

//Potions And Looting
setInterval(function () {
    loot();
	
    //Heal With Potions if we're below 75% hp.
    if (character.hp / character.max_hp < 0.8 || character.mp / character.max_mp < 0.8) {
        use_hp_or_mp();
    }
}, 200 );//Execute 4 times per second

// Check if player is dead every 30 seconds  - weedszard
setInterval(function () {
  if (character.rip) {
    oldLocation = { x: character.real_x, y: character.real_y, map: character.map };
    respawn();
    justRespawned = true;
    return 1;
  }
	  if (justRespawned) {
		smart_move(oldLocation);
		justRespawned = false;
		oldLocation = {};
	}
}, 10000);
			
function state_controller()
{
	//Default to farming
	var new_state = "farm";
	var empty_slots = emptySlots();
	
	//Do we need potions?
	for(type_id in potion_types)
	{
		var type = potion_types[type_id];
		
		var num_potions = num_items(type);
		
		if(num_potions < min_potions)
		{
			new_state = "resupply_potions";
			break;
		}
	}
	if(empty_slots <= bank_at_empty_slots || character.gold > gold_empty_threshold) {
		new_state = "emptying_inventory";
	}
	if(empty_slots >= 40 && state === "emptying_inventory") {
		new_state = "farm";
	}
	if(state != new_state)
	{
		state = new_state;
	}
}

function emptySlots()
{
	return character.esize;
}

//This function contains our logic for when we're farming mobs
function farm()
{
	var target = find_viable_targets()[0];
	//Attack or move to target
    if (target != null) {
        if (distance_to_point(target.real_x, target.real_y) < character.range) {
            if (can_attack(target)) {
				attack(target);
				if(attemptKite === true) {
					smart_move({ x: target.real_x  - 100 , y: target.real_y - 20}); // very poor way to kite (work in progress)
				}
				if(use_skills === true) {
					if(character.mp >= manaSkillThreshhold && character.ctype === characterClass) {
						for(skill in skillList) {
							var skillName = skillList[skill]; 
						use_skill(skillName, target);
						}
						//use_hp_or_mp();
					}
				}
            }
        }
        else {
            move_to_target(target);
        }
	}
	else
	{
		if (!smart.moving) {
			game_log("finding a target");
            smart_move({ to: monster_targets[0] });
        }
	}
}

function sendAllGold() {
	if(character.gold > gold_empty_threshold) {
		send_gold(merchant_character_name, character.gold - 10000);
		//giveAllSingleItems();
	}
}
function giveAllSingleItems() {
	for (item in character.items) {
		if (item == 0) continue;
		if (!character.items[item]) continue;
		if(parent.G.items[character.items[item].name].type === "pot") continue;
		send_item(merchant_character_name, item, 1);
		//game_log(empty_slots);
	}
}

function empty_inventory()
{
	if (!smart.moving) {
		smart_move({to:"town"});
		giveAllSingleItems();
		sendAllGold();
	}
}

function locate_item(name) {
	for(var i=0;i<42;i++) {
		if(character.items[i] && character.items[i].name==name) return i;
	}
	return -1;
}

function return_item_quantity(item) {
	idx = locate_item(item);
	if(idx != -1) {
		return character.items[idx].q;
	} else {
		return 0;
	}
}

function give_all_of_single_item(item) {
	number_of_items = return_item_quantity(item);
	if(number_of_items> 0) {
		send_item(merchant_character_name, locate_item(item), number_of_items);
	}
}

//This function contains our logic during resupply runs
function resupply_potions()
{
	var potion_merchant = get_npc("fancypots");
	
	var distance_to_merchant = null;
	
	if(potion_merchant != null) 
	{
		distance_to_merchant = distance_to_point(potion_merchant.position[0], potion_merchant.position[1]);
	}
	
	if (!smart.moving 
		&& (distance_to_merchant == null || distance_to_merchant > 250)) {
			smart.use_town = true;
			giveAllSingleItems();
			smart_move({to:"town"});
            smart_move({ to:"potions"});
    }
	
	if(distance_to_merchant != null 
	   && distance_to_merchant < 250)
	{
	if(return_item_quantity(exchange_item_name) > 0) {
		give_all_of_single_item(exchange_item_name);
	}
	if(character.gold > gold_empty_threshold) {
		send_gold(merchant_character_name, character.gold - 10000);
		//giveAllSingleItems();
	}
		//giveAllSingleItems();
		buy_potions();
	}
}

//Buys potions until the amount of each potion_type we defined in the start of the script is above the min_potions value.
function buy_potions()
{
	if(empty_slots() > 0)
	{
		for(type_id in potion_types)
		{
			var type = potion_types[type_id];
			
			var item_def = parent.G.items[type];
			
			if(item_def != null)
			{
				var cost = item_def.g * purchase_amount;

				if(character.gold >= cost)
				{
					var num_potions = num_items(type);

					if(num_potions < min_potions)
					{
						buy(type, purchase_amount);
					}
				}
				else
				{
					game_log("Not Enough Gold!");
				}
			}
		}
	}
	else
	{
		game_log("Inventory Full!");
	}
}

//Returns the number of items in your inventory for a given item name;
function num_items(name)
{
	var item_count = character.items.filter(item => item != null && item.name == name).reduce(function(a,b){ return a + (b["q"] || 1);
	}, 0);
	
	return item_count;
}

//Returns how many inventory slots have not yet been filled.
function empty_slots()
{
	return character.esize;
}

//Gets an NPC by name from the current map.
function get_npc(name)
{
	var npc = parent.G.maps[character.map].npcs.filter(npc => npc.id == name);
	
	if(npc.length > 0)
	{
		return npc[0];
	}
	
	return null;
}

//Returns the distance of the character to a point in the world.
function distance_to_point(x, y) {
    return Math.sqrt(Math.pow(character.real_x - x, 2) + Math.pow(character.real_y - y, 2));
}

//This function will ether move straight towards the target entity,
//or utilize smart_move to find their way there.
function move_to_target(target) {
    if (can_move_to(target.real_x, target.real_y)) {
        smart.moving = false;
        smart.searching = false;
        move(
            character.real_x + (target.real_x - character.real_x) / 2,
            character.real_y + (target.real_y - character.real_y) / 2
        );
    }
    else {
        if (!smart.moving) {
            smart_move({ x: target.real_x, y: target.real_y });
        }
    }
}

//Returns an ordered array of all relevant targets as determined by the following:
////1. The monsters' type is contained in the 'monsterTargets' array.
////2. The monster is attacking you or a party member.
////3. The monster is not targeting someone outside your party.
//The order of the list is as follows:
////Monsters attacking you or party members are ordered first.
////Monsters are then ordered by distance.
function find_viable_targets() {
    var monsters = Object.values(parent.entities).filter(
        mob => (mob.target == null
                    || parent.party_list.includes(mob.target)
                    || mob.target == character.name)
                && (mob.type == "monster"
                    && (parent.party_list.includes(mob.target)
                        || mob.target == character.name))
                    || monster_targets.includes(mob.mtype));

    for (id in monsters) {
        var monster = monsters[id];

        if (parent.party_list.includes(monster.target)
                    || monster.target == character.name) {
            monster.targeting_party = 1;
        }
        else {
            monster.targeting_party = 0;
        }
    }

    //Order monsters by whether they're attacking us, then by distance.
    monsters.sort(function (current, next) {
        if (current.targeting_party > next.targeting_party) {
            return -1;
        }
        var dist_current = distance(character, current);
        var dist_next = distance(character, next);
        // Else go to the 2nd item
        if (dist_current < dist_next) {
            return -1;
        }
        else if (dist_current > dist_next) {
            return 1
        }
        else {
            return 0;
        }
    });
    return monsters;
}