var styles = document.getElementsByTagName('style');
if (styles) {
	var style;
	// iterate backwards as we are removing nodes
	for (var i = styles.length; i--;) {
		style = styles[i];
		if (style.innerHTML == '@import "/skins/monobook/KHTMLFixes.css";') {
			// remove this element as it breaks the search bar
			style.remove();
		}
	}
}
