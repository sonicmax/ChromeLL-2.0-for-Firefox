var bash_functions = {
	addListeners : function() {
		// cache target element of contextmenu event in case
		// user selects ETI Bash function
		var bash_data = [];
		var top, container, quotes, quote, quote_text, selection_text, container_text;
		document.addEventListener('contextmenu', function(evt) {
			// cache relevant DOM elements in case they are needed by background script
			selection_text = window.getSelection().toString();
			container = evt.target;
			while (container.className !== 'message-container') {
				container = container.parentNode;
			}
			top = container.firstChild;
			quotes = container.getElementsByClassName('quoted-message');			
		});
		chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
			if (msg.action == 'context_element') {
				if (quotes.length > 0) {
					container_text = container.getElementsByClassName('message')[0].innerText;
					// find original poster of selection_text
					for (var i = 0, len = quotes.length; i < len; i++) {
						quote = quotes[i];
						if (quote.getElementsByClassName('quoted-message').length > 0) {
							// contains nested quote
							quote_text = quote.innerText.replace(quotes[i + 1].innerText, '');
							container_text = container_text.replace(quote.innerText, '');
							if (quote_text.indexOf(selection_text) > -1) {
								bash_data[0] = bash_functions.getUsername(quote.getElementsByClassName('message-top')[0]);
							}
						}
						else {
							quote_text = quote.innerText;
							container_text = container_text.replace(quote_text, '');
							if (quote_text.indexOf(selection_text) > -1) {
								bash_data[0] = bash_functions.getUsername(quote.getElementsByClassName('message-top')[0]);
							}
						}
					}
					// check container for selection_text
					if (container_text.indexOf(selection_text) > -1) {
						bash_data[0] = bash_functions.getUsername(top);
					}
				}
				else {
					bash_data[0] = bash_functions.getUsername(top);
				}
				bash_data[1] = bash_functions.getURL(top);		
				// respond with username and url
				sendResponse({"data": bash_data});
			}
		});	
	},
	getUsername : function(top) {
		// returns username from message-top
		var username = top.getElementsByTagName('a')[0].innerHTML;
		if (username == 'Filter'
		 || username == '⇗') {
			// anon user
			var topHTML = top.innerHTML;
			username = topHTML.match(/(Human\s#)([0-9]+)/)[0];
		}
		return username;
	},
	getURL : function(top) {
		var anchors = top.getElementsByTagName('a');
		var anchor;
		var url;
		var message_detail;
		for (var k = 0, a_len = anchors.length; k < a_len; k++) {
			anchor = anchors[k];
			if (anchor.innerHTML.indexOf('Message Detail') > -1) {
				return anchor.href;
			}
		}
	},
	init: function() {
		chrome.runtime.sendMessage({
			need : "config"
		}, function(response) {
			config = response.data;
			if (!config.eti_bash) {
				return;
			}
			bash_functions.addListeners();
		});
	}
};

bash_functions.init();