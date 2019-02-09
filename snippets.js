function locate_item(name) {
	for(var i=0;i<42;i++) {
		if(character.items[i] && character.items[i].name==name) return i;
	}
	return -1;
}

function return_item_quantity(item) {
	idx = locate_item(item);
	return character.items[idx].q
}

function give_all_of_single_item(item) {
	number_of_items = return_item_quantity(item);
	if(number_of_items> 0) {
		send_item("Dutch", locate_item(item), number_of_items);
	}
}
give_all_of_single_item("scroll0");