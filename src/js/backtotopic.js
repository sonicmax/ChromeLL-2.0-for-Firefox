(function() {
	// Display "Back to topic" link in imagemap pages (when needed)
	var topicRegex = window.location.search.match(/(topic=)([0-9]+)/);
	if (topicRegex) {
		var topicNumber = topicRegex[0];
		// Get old page from URL
		var pageRegex = window.location.search.match(/(oldpage=)([0-9]+)/);
		var page = ''
		if (pageRegex) {
			page = '&page=' + pageRegex[2];
		}
		var infobar = document.getElementsByClassName("infobar")[0];
		var anchor = document.createElement('a');
		var divider = document.createTextNode(" | ");
		anchor.href = '/showmessages.php?' + topicNumber + page;
		anchor.innerText = 'Back to Topic';
		infobar.appendChild(divider);
		infobar.appendChild(anchor);		
	}
})();
