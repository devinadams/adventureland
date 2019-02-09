game_log("-----------------------")
game_log("MERCHANT SCRIPT STARTED");
game_log("-----------------------")


// Define our state variables
var state = "walking_to_town";
var new_state = "";

var bank_at_empty_slots = 1; // Bank at this many empty slots

var have_stuff_to_sell = false; // Doesnt merchant have anything to sell?
var saySomething = false; // Should merchant say something?
var phrase = ""; // What merchant should say

var item_name = "staff";
var gold_limit = 350000; // stop upgrading at this number - also starts upgrading above this number

var hasBeenToBank = false;
var inTown = false;
var upgrade_status = false;
var hasUpgraded = false;

// This function calls our state controller every 3 seconds.
// Our state controller returns a state then based on that state
// We preform a function such as banking or upgrading
setInterval(function () {
    
    //Determine what state we should be in.
    state_controller();
	
    //Switch statement decides what we should do based on the value of 'state'
switch(state)
	{
	case "upgrading":
	if(!isAtBlacksmith()) {
		moveTo(-190, -140); // blacksmith coords
	}
	break;
					
	case "walking_to_town":
	if(!isInsideBank()) {
		moveTo(0, 0);
	} else {
		smart_move({to:"town"});
	}
	break;
					
	case "banking":
	goToBank();
	break;
			
	case "merching":
	break;
			
	case "at_town":
	break;

	}
	
}, 6000);//Execute every 6 seconds?

var loops = 0;
// This is where state values are returned based on conditionals
function state_controller() {
	if (loops < 51) {
		loops += 1;
	}
	if (loops === 1) {
		game_log("current state: " + state);
		if(saySomething == true) {
			say(phrase);
		}
		loops = 0;
	}
//	game_log("current state: " + state);

	// Check if we're already upgrading
	if(upgrade_status === true) { //  && hasUpgraded === false
		new_state = "upgrading";
	}
	
	if (state === "at_town" && character.gold > gold_limit && upgrade_status === false) {
	new_state = "upgrading";
	upgradeStatus = true;
}
	// If we're not at town or doing anything else, set state walking to town
	if(state != "at_town" && state != "upgrading" && state != "banking" && state != "merching") {
		new_state = "walking_to_town";
	}
	
	// Set state to new state
	if(state != new_state) {
		state = new_state;
	}
	
		if(state === "merching" && isMerchStandActive() === false) 
	{
		openMerchStand();
	}
	
	// If character inventory empty spaces are less than or equal to 39
	// and character has upgraded - set state banking
if(character.esize <= bank_at_empty_slots && state != "upgrading") {
	new_state = "banking";
}

if(state === "at_town" && state != "upgrading" && state != "merching") {
	if(isMerchStandActive() === false && have_stuff_to_sell == true) {
		moveTo(33, 49);
		new_state = "merching";
		state = "merching";
	}
}
if(state != "merching" && isMerchStandActive() ) {
	closeMerchStand();
}
	
if(!isAtTown() && state === "at_town" && state != "banking" && state != "upgrading") {
	new_state = "walking_to_town";
}
if(isAtTown() && state === "walking_to_town") {
	new_state = "at_town";
}
if(state === "walking_to_town" && isInsideBank() === true) {
		smart_move({to:"town"});
}
	
	// If chracter has been to bank and has more than 30 empty spaces
	// walk to town
if (hasBeenToBank === true && character.esize >= 30 && upgrade_status === false) {
	new_state = "walking_to_town";
	hasBeenToBank = false;
}
	
	// If in town and not upgrading set state at town
if (isAtTown() && upgrade_status === false && state != "upgrading") {
	new_state = "at_town";
		//inTown = false;
}
if(character.gold < gold_limit && state === "upgrading") {
	new_state = "walking_to_town";
}	
	
if (upgrade_status === false && hasUpgraded === true && state === "upgrading") {
	new_state = "walking_to_town";
	hasUpgraded = false;
}
	
if (hasUpgraded === true) {
	upgrade_status = false;
}
if (state != new_state) {
		state = new_state;
	}
	
}
// Move to function
function moveTo(x, y) {
	//if (!smart.moving && !isAtTown()) {
	if(x === character.real_x && y == character.real_y) {
		return;
	} else {
            smart_move({ x:x, y:y});
    }
}


var upgradeMaxLevel = 8; //Max level it will stop upgrading items at if enabled
var upgradeWhitelist = 
	{
		//ItemName, Max Level
		pyjamas: upgradeMaxLevel,
		bunnyears: upgradeMaxLevel,
		carrotsword: upgradeMaxLevel,
		firestaff: 7,
		fireblade: 7,
		staff: 7,
		sshield: 7,
		shield: 7,
		gloves: 7,
		coat: 7,
		helmet: 7,
		pants: 7,
		gloves1: 7,
		coat1: 7,
		helmet1: 7,
		pants1: 7,
		shoes1: 7,
		harbringer: 5,
		oozingterror: 5,
		bataxe: 7,
		spear: 7,
		xmaspants: 7,
		xmassweater: 7,
		xmashat: 7,
		xmasshoes: 7,
		mittens: 7,
		ornamentstaff: 7,
		candycanesword: 7,
		warmscarf: 7,
		t2bow: 7,
		pmace: 7,
		basher: 7,
		harmor: 5,
		hgloves: 5,
		wingedboots: 7
	};

var combineWhitelist = 
	{
		//ItemName, Max Level
		wbook0: 3,
		lostearring: 2,
		hpamulet: 3,
		strearring: 3,
		intearring: 3,
		dexearring: 3,
		hpbelt: 3,
		ringsj: 3,
		strring: 3,
		intring: 3,
		dexring: 3,
		vitring: 3,
		dexamulet: 3,
		intamulet: 3,
		stramulet: 3,
		vitearring: 3,
		dexbelt: 3,
		intbelt: 3,
		strbelt: 3
	}


setInterval(function() {
	if(parent != null && parent.socket != null && state === "upgrading" && !smart.moving && character.gold > gold_limit)
	{
		upgrade();
		compound_items();
		if(character.gold < gold_limit && state == "upgrading") {
			hasUpgraded = true;
		}
	}

}, 175);

function upgrade() {
	
	if(locate_item(item_name)==-1  ) buy(item_name,1);
	for (let i = 0; i < character.items.length; i++) 
	{
		let c = character.items[i];

		if (c) {
			var level = upgradeWhitelist[c.name];
			if(level && c.level < level)
			{
				let grades = get_grade(c);
				let scrollname;
				if (c.level < grades[0])
					scrollname = 'scroll0';
				else if (c.level < grades[1])
					scrollname = 'scroll1';
				else
					scrollname = 'scroll2';

				let [scroll_slot, scroll] = find_item(i => i.name == scrollname);
				if (!scroll) {
					parent.buy(scrollname);
				return;
			  }
			
			  parent.socket.emit('upgrade', {
				item_num: i,
				scroll_num: scroll_slot,
				offering_num: null,
				clevel: c.level
			  });
			  return;
			}
    	}
  	}
}

function compound_items() {
  let to_compound = character.items.reduce((collection, item, index) => {
    if (item && combineWhitelist[item.name] != null && item.level < combineWhitelist[item.name]) {
      let key = item.name + item.level;
      !collection.has(key) ? collection.set(key, [item.level, item_grade(item), index]) : collection.get(key).push(index);
    }
    return collection;
  }, new Map());

  for (var c of to_compound.values()) {
    let scroll_name = "cscroll" + c[1];

    for (let i = 2; i + 2 < c.length; i += 3) {
      let [scroll, _] = find_item(i => i.name == scroll_name);
      if (scroll == -1) {
        parent.buy(scroll_name);
        return;
      }
		
	//	game_log(scroll_name);
	//	game_log(c[i]);
	//	game_log(c[i+1]);
	//	game_log(c[i+2]);
      parent.socket.emit('compound', {
        items: [c[i], c[i + 1], c[i + 2]],
        scroll_num: scroll,
        offering_num: null,
        clevel: c[0]
      });
	  return;
    }
  }
}

function get_grade(item) {
  return parent.G.items[item.name].grades;
}

// Returns the item slot and the item given the slot to start from and a filter.
function find_item(filter) {
  for (let i = 0; i < character.items.length; i++) {
    let item = character.items[i];

    if (item && filter(item))
      return [i, character.items[i]];
  }

  return [-1, null];
}

// Locate items by name
function locate_item(name) {
	for(var i=0;i<42;i++) {
		if(character.items[i] && character.items[i].name==name) return i;
	}
	return -1;
}

// Return items by index?
function return_item(name) {
	for(var i=0;i<42;i++) {
		if(character.items[i] && character.items[i].name==name) return character.items[i];
	}
	return -1;
}

// Check is inside bank by map
function isInsideBank() {
  //!character.bank
  return character.map === "bank";
}

// Check is inside resting coord(THESE MIGHT NEED TO BE EXPANDED) range in town.
function isAtTown() {
	if(character.real_x >= -20 && character.real_y < 20 && character.real_x <= 20 && character.real_y >= -20) {
		return true;
	} else {
  	return false;
	}
}

function isAtBlacksmith() {
	if(character.real_x >= -200 && character.real_x <= -100 && character.real_y >= -200 && character.real_y <= -100) {
		return true;
	} else {
  	return false;
	}
}

// Go to bank
function goToBank() {
	if(state != "at_town" && state != "upgrading" && state != "walking_to_town") {
		smart_move({ to: "bank" });
		if(isInsideBank()) {
			depositItems();
			hasBeenToBank = true;
		}
	}
}

// Deposit all items to bank
function depositItems() {
    if (character.esize === 42) return; //empty inventory
    for (item in character.items) {
      if (item == 0) continue;
      if (!character.items[item]) continue;
      bank_store(item);
    }
  }

function isMerchStandActive() {
  return character.stand !== false;
}

function openMerchStand() {
  if (!isMerchStandActive()) {
    parent.open_merchant(0);
  }
}

function closeMerchStand() {
  if (isMerchStandActive()) {
    parent.close_merchant(0);
  }
}

function toggleMerchStand() {
  if (isMerchStandActive()) {
    parent.close_merchant(0);
  } else {
    parent.open_merchant(0);
  }
}
