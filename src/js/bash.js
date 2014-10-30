var bash_functions = {
	addListeners : function() {
		// cache target element of contextmenu event in case
		// user selects ETI Bash function
		var top, container, quotes, selection_text;
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
				// check that selection_text exists in message/quoted message
				var bash_data = bash_functions.createArray(quotes, container, top, selection_text);
				// respond with username and url (or null value if no match was found)
				sendResponse({"data": bash_data});
			}
		});	
	},
	createArray : function(quotes, container, top, selection_text) {
		var bash_data = [];
		var quote, tops, message;
		if (quotes.length > 0) {
			for (var i = 0, len = quotes.length; i < len; i++) {
				quote = quotes[i];
				tops = quote.getElementsByClassName('message-top');
				message = bash_functions.getMessage(quote, quotes, tops, i);
				if (message.indexOf(selection_text) > -1) {
					// get username from message-top of quoted-message
					bash_data[0] = bash_functions.getUsername(quote.getElementsByClassName('message-top')[0]);
					bash_data[1] = bash_functions.getURL(top);
					return bash_data;
				}
				else {
					bash_data[0] = null;	
				}						
			}
			// get outermost post last
			quote = container.getElementsByClassName('message')[0];
			// pass -1 to make sure that all quoted posts are removed
			message = bash_functions.getMessage(quote, quotes, tops, -1);
			if (message.indexOf(selection_text) > -1) {
				// get username from message-top of message-container
				bash_data[0] = bash_functions.getUsername(top);
				bash_data[1] = bash_functions.getURL(top);				
				return bash_data;
			}
			else {
				bash_data[0] = null;							
			}
		}
		else if (quotes.length === 0) {
			// get username and post content belonging to first message-top
			message = bash_functions.getMessage(container);
			if (message.indexOf(selection_text) > -1) {
				bash_data[0] = bash_functions.getUsername(top);	
				bash_data[1] = bash_functions.getURL(top);				
				return bash_data;
			}
			else {
				bash_data[0] = null;							
			}						
		}
		// no matches
		return bash_data;
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
	getMessage : function(quote, quotes, tops, index) {
		// takes message/quoted-message HTML and returns text
		var sig;
		if (!quotes) {
			var message = quote.innerText;
			sig = message.lastIndexOf('---');
			if (sig > -1) {
				message = message.substring(0, sig);
			}
		}
		else {
			var message = quote.innerText;
			var top, other_quote;
			for (var i = 0, len = tops.length; i < len; i++) {
				top = tops[i];
				message = message.replace(top.innerText, '');
				if (i !== index) {
					other_quote = quotes[i].innerText.replace(top.innerText, '');
					message = message.replace(other_quote, '');
				}
			}
			sig = message.lastIndexOf('---');
			if (sig > -1) {
				message = message.substring(0, sig);
			}		
		}
		message = message.replace('[quoted text omitted]', '');
		return message.trim();
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