var styles = document.getElementsByTagName('style');
if (styles) {
	for (var i = 0, len = style.length; i < len; i++) {
		var style = styles[i];
		if (style.innerHTML == '@import "/skins/monobook/KHTMLFixes.css";') {
			// remove this element as it breaks the search bar
			style.remove();
		}
	}
}
