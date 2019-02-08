game_log("MERCHANT SCRIPT STARTED");

// DEFINE OUT STATE VALUES
var state = "walking_to_town";
var new_state = "";

var item_name = "helmet";

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
					moveTo(-190, -140); // blacksmith coords
					break;
					
        case "walking_to_town":
          moveTo(0, 0);
					break;
					
				case "banking":
					goToBank();
					break;

				case "at_town":
					break;
    }
}, 3000);//Execute every 3 seconds?

var loops = 0;
// This is where state values are returned based on conditionals
function state_controller() {
	if (loops < 6) {
		loops += 1;
	}
	if (loops === 5) {
		game_log("current state: " + state);
		loops = 0;
	}
//	game_log("current state: " + state);

	// Check if we're already upgrading
	if(upgrade_status === true && hasUpgraded === false) {
		new_state = "upgrading";
	}
	
	// If we're not at town or doing anything else, set state walking to town
	if(state != "at_town" && state != "upgrading" && state != "banking") {
		new_state = "walking_to_town";
	}
	
	// Set state to new state
	if(state != new_state) {
		state = new_state;
	}
	
	// If character inventory empty spaces are less than or equal to 39
	// and character has upgraded - set state banking
if(character.esize <= 39 && hasUpgraded === true) {
	new_state = "banking";
}
	
if(!isAtTown() && state === "at_town") {
	new_state = "walking_to_town";
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
	
	// If at town and can upgrade(enough gold, hasn't already), set state 			//upgrade
if (state === "at_town" && character.gold > 500000 && upgrade_status === false) {
	new_state = "upgrading";
	state = "upgrading";
	upgradeStatus = true;
}
	
	
if (upgrade_status === false && hasUpgraded === true && state === "upgrading") {
	new_state = "walking_to_town";
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
	if (!smart.moving) {
            smart_move({ x:x, y:y});
    }
}

// Main Upgrading function
setInterval(function() {
		if(state === "upgrading" && !smart.moving && character.gold > 250000) {
				if(locate_item("scroll0")==-1) buy("scroll0",200);
				if(locate_item("scroll1")==-1) buy("scroll1",20);
				if(locate_item(item_name)==-1  ) buy(item_name,1);
			for(var i=0;i<42;i++)
			{
				if(!character.items[i]) continue;
				var item=character.items[i];
				var def=G.items[item.name];
				if(!def.upgrade) continue; // check whether the item is upgradeable
				if(item_grade(item) === 2) {
				   	hasUpgraded = true;
					game_log(hasUpgraded);
					break;
				}// rare item
				if(item_grade(item)==0) upgrade(i,locate_item("scroll0"));
				if(item_grade(item)==1) upgrade(i,locate_item("scroll1"));
				break;
			}
	}
},125);

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
	if(character.real_x >= -15 && character.real_y >= 15) {
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
