(function (window) {
	'use strict';

	var itemsLeft = 0;
	var itemsCompleted = 0;
	var itemsLeftElement = document.querySelector("[name=itemsLeft]");
	var itemsCompletedElement = document.querySelector("[name=itemsCompleted]");

	//object with helper methods
	var todo = window.todo = {};

	todo.update = function(event){
		if (event.key == "Enter" || event.type == "blur"){
			event.preventDefault();
			var dDataElement = dData.findNearestDDataParent(event.target);
			dDataElement.value.todo = event.target.value;
			dDataElement.classList.remove("editing");
		}
	}

	todo.add = function(event){
		if (event.key == "Enter"){
			var value = event.target.value;
			if (value != ""){
				adjustItemsLeft(1);	
				dData.TodoList.add("TodoItem", {todo: value});	
				event.target.value = "";
			}
		}
	}

	todo.edit = function(event){
		var dDataElement = dData.findNearestDDataParent(event.target);
		dDataElement.classList.add("editing");
		dDataElement.querySelector(".edit").value = event.target.innerHTML;
	}

	todo.remove = function(event){
		var parent = dData.findNearestDDataParent(event.target);
		if (!parent.classList.contains("completed")){
			adjustItemsLeft(-1);
		}else{
			itemsCompleted -= 1;
		}
		parent.remove();
	}

	todo.toggleComplete = function(event){
		event.target.checked ? adjustComplete(1) : adjustComplete(-1);
	}

	todo.toggleAll = function(){
		var tglAll = document.getElementById("toggle-all");
		var items = document.querySelectorAll("[name=TodoItem]");
		for (var i=0; i<items.length; i++){
			items[i].value.completed = tglAll.checked;
			tglAll.checked ? items[i].classList.add("completed") : items[i].classList.remove("completed"); 
		}
		itemsLeft 	  = tglAll.checked ? 0 : items.length;
		itemsCompleted = tglAll.checked ? items.length : 0;
	}

	todo.clearComplete = function(){
		var items = dData.TodoList.TodoItem;
		for (var i=items.length-1; i>-1; i--){
			if (items[i].completed){
				items.remove(i);
			}
			itemsCompleted = 0;
		}
	}

	todo.hasTodoItems = function(){
		if (document.querySelector("[name=TodoItem]")){return false}else{return true;}
	}

	todo.showSingle = function(){ return itemsLeft == 1 ? true : false; }
	todo.showClear = function(){ 
		return itemsCompleted > 0 ? false : true; }

	function adjustComplete(num){
		itemsLeft -= num;
		itemsCompleted += num;
		dData.itemsLeft = itemsLeft;
		dData.itemsCompleted = itemsCompleted;
		updateToggleAll();
	}

	function adjustItemsLeft(num){
			itemsLeft += num;
			dData.itemsLeft = itemsLeft;
			updateToggleAll();
	}

	function updateToggleAll(){
		var tglAll = document.getElementById("toggle-all");
		if ( itemsLeft == "0" ){
			tglAll.checked = true;	
		} else {
			tglAll.checked = false;
		}
	}

	// router functionality
	function router () {
        // Current route url (getting rid of '#' in hash as well):
        var url = location.hash.slice(1) || '/';
        var filter = document.getElementById("filter");
        if (url == "/completed"){filter.value = "true";}
        if (url == "/active"){filter.value = "false";}
        if (url == "/") {filter.value = "";}
        filter.dispatchEvent(new Event("keyup"));
		document.querySelector(".selected").className = "";
		document.querySelector("[href='#"+url+"']").className = "selected";
    }
    
    // Listen on hash change and page load:
    window.addEventListener('hashchange', router);
    window.addEventListener('dDataRendered', router);

	// persistence
	function storeTodos(){
			var items = dData.TodoList.TodoItem;
			if (items != undefined && items.length > 0){
				localStorage["todos-dom-data-mirror"] = JSON.stringify(dData.TodoList);	
			}else{
				localStorage.removeItem("todos-dom-data-mirror");
			}
	}

	setInterval(storeTodos, 100);

	function loadTodos(){
		var data = localStorage["todos-dom-data-mirror"]
		if (data != undefined && data != ""){
			dData.TodoList = JSON.parse( localStorage["todos-dom-data-mirror"] );
			itemsLeft = Number(dData.TodoList.itemsLeft);
			itemsCompleted = Number(dData.TodoList.itemsCompleted);	
			document.dispatchEvent(new Event("dDataRendered"));
		}else{
			dData.TodoList = {}; // Init an empty list;
		}
	}

	window.addEventListener('load', loadTodos);

})(window);
