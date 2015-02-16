var dramalinks = {
	html: '',
	tagName: '',
	config: [],
	appendTo: function(element) {
		this.tagName = element.tagName;
		var ticker = document.createElement("center");
		ticker.id = "dramalinks_ticker";
		element.parentNode.insertBefore(ticker, element.nextSibling);
		
		if (!dramalinks.html) {			
			Object.observe(dramalinks, function() {
				dramalinks.update.call(dramalinks);
			});
		}
		else {
			this.update();
		}
	},
	update: function(data) {
		var ticker = document.getElementById('dramalinks_ticker');
		var element = document.getElementsByTagName(this.tagName)[0];
		if (data) {
			ticker.innerHTML = data;
		}
		else {
			ticker.innerHTML = dramalinks.html;		
		}
		if (this.config.hide_dramalinks) {
			ticker.style.display = "none";
			element.ondblclick = this.switchDrama;
		}		
		var retry = document.getElementById('retry');
		if (retry) {
			retry.addEventListener('click', dramalinks.retry);
		}
	},
	switchDrama: function() {
		var ticker = document.getElementById('dramalinks_ticker');
		(ticker.style.display == 'none') 
				? ticker.style.display = 'block' 
				: ticker.style.display = 'none';
		if (document.selection) {
			document.selection.empty();
		}
		else if (window.getSelection) {
			window.getSelection().removeAllRanges();
		}
	},
	retry: function() {
		chrome.runtime.sendMessage({
			need: "retrydramalinks"
		}, this.update(response.data));
	}
};