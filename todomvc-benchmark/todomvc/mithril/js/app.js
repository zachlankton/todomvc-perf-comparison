app.ENTER_KEY = 13;
app.ESC_KEY = 27;

m.route(document.getElementById('todoapp'), '/', {
	'/': app,
	'/:filter': app
});
