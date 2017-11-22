(() => {
	
	var oldImage;
	
	// sangreen my brothers
	document.addEventListener('keyup', evt => {
		if (evt.target.value && evt.target.value.toLowerCase() === 'sangreen') {
			oldImage = document.body.style.backgroundImage;
			document.body.style.backgroundImage = 'url("http://i.imgur.com/SVCxE.gif")';
		}
		else {
			document.body.style.backgroundImage = oldImage;
		}
	});
	
})();