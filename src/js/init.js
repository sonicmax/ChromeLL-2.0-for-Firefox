var CHROMELL = {};

CHROMELL.config = {};

// Set up globalPort so content scripts can communicate with background page.
CHROMELL.globalPort = chrome.runtime.connect();

CHROMELL.whenDOMReady = function(callback) {
	// Safely init scripts where "run_at" value in manifest is set to "document_start"
	if (document.readyState == 'loading') {
		document.addEventListener('DOMContentLoaded', callback);
	}
	else {
		callback();
	}
};

CHROMELL.getConfig = function(callback) {
	
	chrome.runtime.sendMessage({
			need: "config"
		},
		function(response) {
			// Set config before executing callback function
			CHROMELL.config = response.data;
			callback(response.data);
		}
		
	);
	
};