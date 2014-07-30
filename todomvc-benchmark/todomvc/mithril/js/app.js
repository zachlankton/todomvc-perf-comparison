m.route(document.getElementById('todoapp'), '/', {
	'/': app,
	'/:filter': app
});
