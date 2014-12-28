var dramalinks = {
	html: '',
	config: [],
	append : function(ticker) {
		var title;
		if (document.getElementsByTagName('h2')[0]) {
			title = document.getElementsByTagName('h2')[0];
		}
		else {
			title = document.getElementsByTagName('h1')[0];
		}
		title.parentNode.insertBefore(ticker, title.nextSibling);
		if (dramalinks.html) {
			// update ticker with cached response from background page
			ticker.innerHTML = dramalinks.html;
			if (this.config.hide_dramalinks) {
				title.addEventListener('doubleclick', this.switchDrama);
			}
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
					retry.addEventListener('click', messageList.dramalinks.updateTicker);
				}
			}
			else {				
				console.log('error in updateDramaTicker');
				console.log(document.readyState);
			}
		});
	},
	listenForUpdates : function() {
		var that = this;
		chrome.runtime.onMessage.addListener(function(msg, sender) {
			if (msg.action == 'update_drama') {
				if (document.getElementById('dramalinks_ticker')) {
					that.updateTicker();
				}
				else if (document.readyState == 'loading') {						
					document.addEventListener('DOMContentLoaded', function() {
						that.updateTicker();
					});
				}
				else {
					console.log('error in onMessage listener');
					console.log('readystate:', document.readyState);
				}
			}
		});
	},
	init: function() {		
		var config = this.config;
		if (!config.dramalinks 
				|| config.hide_dramalinks_topiclist 
						&& !window.location.href.match(/topics|history/i)) {
			return;
		}
		else {
			this.listenForUpdates();
			chrome.runtime.sendMessage({
				need : "dramalinks"
			}, function(response) {
				if (response.data) {
					// cache data so that we dont have to wait for response
					// from background page	once DOMContentLoaded has fired
					dramalinks.html = response.data;
				}
			});
			// create ticker & wait for DOMContentLoaded to fire
			ticker = document.createElement("center");
			ticker.id = "dramalinks_ticker";
			if (config.hide_dramalinks) {
				ticker.style.display = "none";
			}
			if (document.readyState == 'loading') {
				var that = this;
				document.addEventListener('DOMContentLoaded', function() {
					that.append(ticker);
				});
			}
			else {
				this.append(ticker);
			}
		}
	}
};