var CHROMELL = {};

CHROMELL.config = {};

CHROMELL.getConfig = function(callback) {
	// Check whether CHROMELL.config is empty
	if (Object.keys(CHROMELL.config).length === 0) {
		chrome.runtime.sendMessage({
				need: "config"
			},
			function(response) {
				// Set config before executing callback function
				CHROMELL.config = response.data;
				callback(CHROMELL.config);
			}
		);
	}
	else {
		callback(CHROMELL.config);
	}
};