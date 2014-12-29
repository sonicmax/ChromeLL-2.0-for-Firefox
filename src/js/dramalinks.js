var dramalinks = {
	html: '',
	config: [],
	append : function() {
		var title;
		var ticker = document.createElement("center");
		ticker.id = "dramalinks_ticker";
		ticker.innerHTML = dramalinks.html;
		if (this.config.hide_dramalinks) {
			ticker.style.display = "none";
		}
		// TODO - pass required element directly from messageList/topicList script
		if (document.getElementsByTagName('h2')[0]) {
			title = document.getElementsByTagName('h2')[0];
		}
		else {
			title = document.getElementsByTagName('h1')[0];
		}
		title.parentNode.insertBefore(ticker, title.nextSibling);
		if (this.config.hide_dramalinks) {
			title.addEventListener('doubleclick', this.switchDrama);
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
	init: function() {
		if (this.config.hide_dramalinks_topiclist 
				&& !window.location.href.match(/topics|history/i)) {
			return;
		}
		else {
			this.append();
		}
	}
};