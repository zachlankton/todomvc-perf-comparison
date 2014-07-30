app.footer = function(ctrl) {
	var count = ctrl.list.countCompleted()
	return m('footer#footer', [
		m('span#todo-count', [
			m('strong', ctrl.list.items.length), ' item' + (ctrl.list.items.length > 1 ? 's' : '') + ' left'
		]),
		m('ul#filters', [
			m('li', m('a[href=/]', app.selectedIf(ctrl.filter, ''), 'All')),
			m('li', m('a[href=/active]', app.selectedIf(ctrl.filter, 'active'), 'Active')),
			m('li', m('a[href=/completed]', app.selectedIf(ctrl.filter, 'completed'), 'Completed'))
		]),
		count == 0 ? '' : m('button#clear-completed', {
			onclick: ctrl.list.clearCompleted
		}, 'Clear completed (' + count + ')')
	]);
}
app.selectedIf = function(filter, value) {
	return {config: m.route, class: filter == value ? 'selected' : ''}
}