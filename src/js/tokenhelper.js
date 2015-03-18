(function() {
	// Make sure that user's sig is removed after checking "Anonymous token" option
	var checkbox = document.getElementById('a');
	var textarea = document.getElementsByTagName('textarea')[0];	
	var sig = textarea.value;
	checkbox.addEventListener('click', checkHandler);
	function checkHandler() {
		(checkbox.checked)
				? textarea.value = textarea.value.replace(sig, '')
				: textarea.value = textarea.value + sig;		
	}
})();