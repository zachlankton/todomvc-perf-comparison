//view model
var vm = {}
vm.title = m.prop("");
vm.filter = ""

vm.addTodo = function() {
	if (vm.title()) {
		model.todos.push(new model.Todo({title: vm.title()}));
		vm.title("");
		model.save()
	}
};

vm.isVisible = function(todo) {
	if (vm.filter == "")
		return true;
	if (vm.filter == "active")
		return !todo.completed();
	if (vm.filter == "completed")
		return todo.completed();
}

vm.setTodosStatus = function(status) {
	for (var i = 0; i < model.todos.length; i++) vm.setTodoStatus(i, status)
}
vm.setTodoStatus = function(index, status) {
	model.todos[index].completed(status)
	model.save()
}
vm.removeTodo = function(index) {
	model.todos.splice(index, 1)
	model.save()
}
vm.clearCompletedTodos = function() {
	for (var i = model.todos.length - 1; i > -1; i--) {
		if (model.todos[i].completed())
			model.todos.splice(i, 1)
	}
	model.save()
}
vm.countCompletedTodos = function() {
	var amount = 0;
	
	for (var i = 0; i < model.todos.length; i++)
		if (model.todos[i].completed())
			amount++

	return amount
}

vm.edit = {
	todo: m.prop(),
	title: m.prop(""),
	attach: function(todo) {
		vm.edit.todo(todo)
		vm.edit.title(todo.title())
	},
	save: function() {
		vm.edit.todo().title(vm.edit.title())
		vm.edit.todo(null)
		model.save()
	},
	cancel: function() {
		vm.edit.todo(null)
	}
}

//model
var model = {}
model.Todo = function(data) {
	this.title = m.prop(data.title || "");
	this.completed = m.prop(data.completed || false);
};

model.storageKey = "todos-mithril"
model.todos = new function() {
	var tmp = localStorage.getItem(model.storageKey)
	return tmp ? JSON.parse(tmp).map(function(data) { return new model.Todo(data) }) : [];
}
model.save = new function(lock) {
	return function() {
		//batch I/O
		clearTimeout(lock)
		lock = setTimeout(function() {
			localStorage.setItem(model.storageKey, JSON.stringify(model.todos))
		}, 0)
	}
}
