var dramalinks = {
	html: '',
	config: [],
	append : function(element) {
		var ticker = document.createElement("center");
		ticker.id = "dramalinks_ticker";
		ticker.innerHTML = dramalinks.html;
		if (this.config.hide_dramalinks) {
			ticker.style.display = "none";
		}
		element.parentNode.insertBefore(ticker, element.nextSibling);
		if (this.config.hide_dramalinks) {
			element.addEventListener('doubleclick', this.switchDrama);
		}
		var retry = document.getElementById('retry');
		if (retry) {
			retry.addEventListener('click', this.updateTicker);
		}		
	},
	switchDrama : function() {
		var ticker = document.getElementById('dramalinks_ticker');
		ticker.style.display == 'none' ? ticker.style.display = 'block' 
				: ticker.style.display = 'none';
		if (document.selection) {
			document.selection.empty();
		}
		else if (window.getSelection) {
			window.getSelection().removeAllRanges();
		}
	},
	updateTicker: function() {
		chrome.runtime.sendMessage({
			need: "dramalinks"
		}, function(response) {
			var ticker = document.getElementById('dramalinks_ticker');
			if (ticker) {
				ticker.innerHTML = response.data;
				var retry = document.getElementById('retry');
				if (retry) {
					retry.addEventListener('click', dramalinks.updateTicker);
				}
			}
			else {		
				console.log('Error in updateTicker: required element not found');
				console.log(document.readyState);
			}
		});
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