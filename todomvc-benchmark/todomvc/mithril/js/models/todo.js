var app = {};

app.Todo = function(data) {
	this.title = data.title || '';
	this.completed = data.completed || false;
};

// List of Todos
app.TodoList = function() {
	var storageKey = "todos-mithril"
	var tmp = window.localStorage.getItem(storageKey)
	var items = tmp ? JSON.parse(tmp).map(function(data) { return new app.Todo(data) }) : [];
	
	var add = function(item) {
		items.push(item)
		save()
	}
	var setStatusAt = function(index, status) {
		items[index].completed = status
		save()
	}
	var removeAt = function(index) {
		items.splice(index, 1)
		save()
	}
	var clearCompleted = function() {
		for (var i = 0; i < items.length; i++) {
			if (items[i].completed)
				items.splice(index, 1)
		}
		save()
	}
	var countCompleted = function() {
		var amount = 0;
		
		for (var i = 0; i < items.length; i++)
			if (items[i].completed)
				amount++

		return amount
	}
	
	var lock
	var save = function() {
		//batch I/O
		clearTimeout(lock)
		lock = setTimeout(function() {
			window.localStorage.setItem(storageKey, JSON.stringify(items))
		}, 0)
	}
	
	return {items: items, add: add, setStatusAt: setStatusAt, removeAt: removeAt, clearCompleted: clearCompleted, countCompleted: countCompleted}
}