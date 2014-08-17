app.footer = function(ctrl) {
	var completed = ctrl.list.countCompleted()
	var remaining = ctrl.list.items.length - completed
	return m('footer#footer', [
		m('span#todo-count', [
			m('strong', remaining), ' item' + (remaining > 1 ? 's' : '') + ' left'
		]),
		m('ul#filters', [
			m('li', m('a[href=/]', app.selectedIf(ctrl.filter, ''), 'All')),
			m('li', m('a[href=/active]', app.selectedIf(ctrl.filter, 'active'), 'Active')),
			m('li', m('a[href=/completed]', app.selectedIf(ctrl.filter, 'completed'), 'Completed'))
		]),
		completed == 0 ? '' : m('button#clear-completed', {
			onclick: ctrl.list.clearCompleted
		}, 'Clear completed (' + completed + ')')
	]);
}
app.selectedIf = function(filter, value) {
	return {config: m.route, class: filter == value ? 'selected' : ''}
}