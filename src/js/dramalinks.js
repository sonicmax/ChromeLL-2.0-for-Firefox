var dramalinks = {
	html: '',
	config: [],
	append : function(element) {
		var ticker = document.createElement("center");
		ticker.id = "dramalinks_ticker";
		element.parentNode.insertBefore(ticker, element.nextSibling);
		if (!dramalinks.html) {					
			Object.observe(dramalinks, function() {
				dramalinks.updateTicker.call(dramalinks, null)
			});
		}
		else {
			this.updateTicker();
		}		
	},
	updateTicker: function(data) {
		var ticker = document.getElementById('dramalinks_ticker');
		if (data) {
			ticker.innerHTML = data;
			dramalinks.html = data;
		}
		else {
			ticker.innerHTML = dramalinks.html;		
		}
		if (this.config.hide_dramalinks) {
			ticker.style.display = "none";
			element.addEventListener('doubleclick', this.switchDrama);
		}
		var retry = document.getElementById('retry');
		if (retry) {
			retry.addEventListener('click', this.retry);
		}
	},
	switchDrama: function() {
		var ticker = document.getElementById('dramalinks_ticker');
		ticker.style.display == 'none' ? ticker.style.display = 'block' : ticker.style.display = 'none';
		if (document.selection) {
			document.selection.empty();
		}
		else if (window.getSelection) {
			window.getSelection().removeAllRanges();
		}
	},
	retry: function() {
		chrome.runtime.sendMessage({
			need: "dramalinks"
		}, this.updateTicker(response.data));
	},
	init: function(element) {
		if (this.config.hide_dramalinks_topiclist 
				&& !window.location.href.match(/topics|history/i)) {
			return;
		}
		else {
			dramalinks.append(element);
		}
	}
};