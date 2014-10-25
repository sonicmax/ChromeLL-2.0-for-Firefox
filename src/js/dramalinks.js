var config = {};
var dramalinks;
var dramalinksFunctions = {
	insertTicker : function(ticker) {
		var h1;
		if (document.getElementsByTagName('h2')[0]) {
			h1 = document.getElementsByTagName('h2')[0];
		}
		else {
			h1 = document.getElementsByTagName('h1')[0];
		}
		h1.parentNode.insertBefore(ticker, h1.nextSibling);
		if (config.hide_dramalinks) {
			dramalinksFunctions.hideDrama();
		}
		if (dramalinks) {
			ticker.innerHTML = dramalinks;
		}
		else {
			// wait for update_drama message from bg script
		}
	},
	hideDrama : function() {
		var title = document.getElementsByTagName('h1')[0];
		title.ondblclick = dramalinksFunctions.switchDrama;
	},
	switchDrama : function() {
		var ticker = document.getElementById('dramalinks_ticker');
		ticker.style.display == 'none' 
				? ticker.style.display = 'block'
				: ticker.style.display = 'none';
		if (document.selection) {
			document.selection.empty();
		}
		else if (window.getSelection) {
			window.getSelection().removeAllRanges();
		}
	},
	updateDramaTicker: function() {
		// called after update_drama message is passed from bg script
		chrome.runtime.sendMessage({
			need: "dramalinks"
		}, function(response) {
			var dramalinks_ticker = document.getElementById('dramalinks_ticker');
			dramalinks = response.data;	
			if (dramalinks_ticker) {
				dramalinks_ticker.innerHTML = dramalinks;
				if (dramalinks == '<a id="retry" href="javascript:void(0)">Error loading Dramalinks. Click to retry...</a>') {
					var retry = document.getElementById('retry');
					retry.addEventListener('click', dramalinksFunctions.updateDramaTicker);
				}
			}
			else {
				console.log('error in updateDramaTicker');
				console.log(document.readyState);			
			}
		});
	},
	addListener : function() {
		chrome.runtime.onMessage.addListener(function(msg, sender) {
			if (msg.action == 'update_drama') {
				if (document.getElementById('dramalinks_ticker')) {
					dramalinksFunctions.updateDramaTicker();
				}
				else if (document.readyState == 'loading') {
					document.addEventListener('DOMContentLoaded', function() {
						dramalinksFunctions.updateDramaTicker();
					});
				}
				else {
					console.log('error in onMessage listener');
					console.log(document.readyState);
				}
			}
		});
	},
	init: function() {
		chrome.runtime.sendMessage({
			need : "config"
		}, function(response) {
			config = response.data;
			if (config.hide_dramalinks_topiclist
					&& !window.location.href.match(/topics|history/i)) {
				return;
			}			
			// set up listener to update ticker
			dramalinksFunctions.addListener();
			// request dramalinks
			chrome.runtime.sendMessage({
				need : "dramalinks"
			}, function(response) {
				// cache response from bg script
				dramalinks = response.data;
				if (dramalinks) {
					var dramalinks_ticker = document.getElementById('dramalinks_ticker');
					if (dramalinks_ticker) {
						dramalinks_ticker.innerHTML = dramalinks;
					}
					else {
						// wait for insertTicker to handle cached response
					}
				}
			});
			// create ticker element
			ticker = document.createElement("center");
			ticker.id = "dramalinks_ticker";
			if (config.hide_dramalinks) {
				ticker.style.display = "none";
			}
			// append ticker if/when DOM is ready
			if (document.readyState == 'loading') {
				document.addEventListener('DOMContentLoaded', function() {
					dramalinksFunctions.insertTicker(ticker);
				});
			}
			else if (document.readyState != 'loading') {
				dramalinksFunctions.insertTicker(ticker);
			}
		});
	}
}

dramalinksFunctions.init();