app.controller = function() {

	var list = new app.TodoList(); // Todo collection
	var title = m.prop('');		// Temp title placeholder
	var filter = m.route.param('filter') || '';	   // TodoList filter

	// Add a Todo 
	var add = function() {
		if (title()) {
			list.add(new app.Todo({title: title()}));
			title('');
		}
	};

	//check whether a todo is visible
	var isVisible = function(todo) {
		if (filter == '')
			return true;
		if (filter == 'active')
			return !todo.completed;
		if (filter == 'completed')
			return todo.completed;
	}
	
	var clearTitle = title.bind(this, '')
	
	return {list: list, title: title, filter: filter, add: add, isVisible: isVisible, clearTitle: clearTitle}
};
