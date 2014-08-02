app.ENTER_KEY = 13;
app.ESC_KEY = 27;

app.watchInput = function(onenter, onescape) {
	return function(e) {
		if (e.keyCode == app.ENTER_KEY && onenter) onenter()
		if (e.keyCode == app.ESC_KEY && onescape) onescape()
	}
};
app.focus = function(element, init) {
	if (!init) element.focus()
}

app.view = function(ctrl) {
	return [
		m('header#header', [
			m('h1', 'todos'),
			m('input#new-todo[placeholder="What needs to be done?"]', { 
				oninput: m.withAttr('value', ctrl.title),
				onkeypress: app.watchInput(ctrl.add),
				value: ctrl.title()
			})
		]),
		m('section#main', [
			m('input#toggle-all[type=checkbox]'),
			m('ul#todo-list', [
				ctrl.list.items.filter(ctrl.isVisible).map(function(task, index) {
					return m('li', {class: (task.completed() ? 'completed' : '') + " " + (app.edit.task() == task ? 'editing' : '')}, [
						app.edit.task() != task ? 
						m('.view', {}, [
							m('input.toggle[type=checkbox]', {
								onclick: m.withAttr('checked', ctrl.list.setStatusAt.bind(this, index)),
								checked: task.completed()
							}),
							m('label', {ondblclick: app.edit.attach.bind(this, task)}, task.title()),
							m('button.destroy', { onclick: ctrl.list.removeAt.bind(this, index)})
						]) :
						m('input.edit', {
							oninput: m.withAttr("value", app.edit.title),
							onkeypress: app.watchInput(app.edit.save, app.edit.cancel),
							value: app.edit.title(),
							config: app.focus
						})
					])
				 })
			])
		]),
		ctrl.list.length == 0 ? '' : app.footer(ctrl)
	];
};
