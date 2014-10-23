var config = {};
var ticker;
var dramas;
var dramalinksFunctions = {
	insertTicker : function() {
		var h1 = document.getElementsByTagName('h1')[0];
		if (config.dramalinks_below_topic 
				&& document.getElementsByTagName('h2')[0]) {
			h1 = document.getElementsByTagName('h2')[0];
		}
		h1.parentNode.insertBefore(ticker, h1.nextSibling);	
		dramalinksFunctions.updateDramaTicker(config.hide_dramalinks);
		if (config.hide_dramalinks) {
			dramalinksFunctions.hideDrama();
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
		chrome.runtime.sendMessage({
			need: "dramalinks"
		}, function(response) {
			dramas = response.data;
			document.getElementById("dramalinks_ticker").innerHTML = dramas;
			if (dramas == '<a id="retry" href="javascript:void(0)">Error loading Dramalinks. Click to retry...</a>') {
				var retry = document.getElementById('retry');
				retry.addEventListener('click', dramalinksFunctions.updateDramaTicker);
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
			ticker = document.createElement("center");
			ticker.id = "dramalinks_ticker";
			if (config.hide_dramalinks) {
				ticker.style.display = "none";
			}
			document.addEventListener('DOMContentLoaded', function() {
				console.log('domcontentloaded listener triggered');
				dramalinksFunctions.insertTicker();
			});
			// set up listener to update ticker with xhr data
			console.log('adding onMessage listener');
			console.log(document.readyState);	
			chrome.runtime.onMessage.addListener(function(msg, sender) {
				if (msg.action == 'updatedrama') {
					if (config.hide_dramalinks_topiclist 
							&& !window.location.href.match(/topics/i)) {
						return;
					}
					else if (document.getElementById('dramalinks_ticker')) {
						dramalinksFunctions.updateDramaTicker();
					}
					else {
						console.log(document.readyState);			
					}
				}
			});
			// request dramalinks and handle response from bg script
			console.log('requesting dramalinks');
			console.log(document.readyState);
			chrome.runtime.sendMessage({
				need : "dramalinks"
			}, function(response) {
				// bg script only responds if returning cached dramalinks
				dramas = response.data;
				// ticker.innerHTML = dramas;
			});						
		});
	}
}

console.log('init');
console.log(document.readyState);	
dramalinksFunctions.init();