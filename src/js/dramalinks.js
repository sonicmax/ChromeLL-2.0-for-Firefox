var config = {};
var dramas;
var dramalinksFunctions = {
	insertTicker : function(ticker) {
		var h1 = document.getElementsByTagName('h1')[0];
		if (config.dramalinks_below_topic 
				&& document.getElementsByTagName('h2')[0]) {
			h1 = document.getElementsByTagName('h2')[0];
		}
		h1.parentNode.insertBefore(ticker, h1.nextSibling);
		if (config.hide_dramalinks) {
			dramalinksFunctions.hideDrama();
		}
		if (dramas) {
			ticker.innerHTML = dramas;
		}
		else {
			// wait for update_drama action
		}
	},
	hideDrama : function() {
		var t = document.getElementById("dramalinks_ticker");
		var color = t.getElementsByTagName('div')[0].style.background;
		var hone = document.getElementsByTagName('h1')[0];
		hone.style.color = color;
		hone.ondblclick = dramalinksFunctions.switchDrama;
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
			dramas = response.data;	
			if (dramalinks_ticker) {
				dramalinks_ticker.innerHTML = dramas;
				if (dramas == '<a id="retry" href="javascript:void(0)">Error loading Dramalinks. Click to retry...</a>') {
					var retry = document.getElementById('retry');
					retry.addEventListener('click', dramalinksFunctions.updateDramaTicker);
				}
			}
			else {
				console.log('problem with updateDramaTicker');
				console.log(document.readyState);
			}
		});
	},
	addListener : function() {
		chrome.runtime.onMessage.addListener(function(msg, sender) {
			if (msg.action == 'update_drama') {
				if (config.hide_dramalinks_topiclist 
						&& !window.location.href.match(/topics/i)) {
					return;
				}
				else if (document.getElementById('dramalinks_ticker')) {
					dramalinksFunctions.updateDramaTicker();
				}
				else {
					// do nothing
					console.log('problem with onMessage listener');
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
					&& !window.location.href.match(/topics/i)) {
				return;
			}
			// set up listener to update ticker
			dramalinksFunctions.addListener();
			// request dramalinks and handle response from bg script
			chrome.runtime.sendMessage({
				need : "dramalinks"
			}, function(response) {
				// bg script only responds if returning cached dramalinks
				dramas = response.data;
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