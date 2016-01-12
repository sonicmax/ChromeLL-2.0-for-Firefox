var CHROMELL = {};

CHROMELL.config = {};

// Set up globalPort so content scripts can communicate with background page.
CHROMELL.globalPort = chrome.runtime.connect();

/**
 *	Safely runs DOM modifying code in scripts where "run_at" value in manifest is set to "document_start"
 */
CHROMELL.whenDOMReady = function(callback) {	
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', callback);
	}
	else {
		callback();
	}
};

/**
 *	Attempts to load CSS before first render
 */
CHROMELL.injectCss = function(callback) {
	if (document.readyState === 'loading') {
		requestAnimationFrame(callback);
	}
	else {
		callback();
	}
}

CHROMELL.getConfig = function(callback) {
	
	if (Object.keys(CHROMELL.config).length === 0) {
	
		chrome.runtime.sendMessage({
				need: "config"
			}, function(response) {		
				// Set config before executing callback function
				CHROMELL.config = response.data;
				callback();
			}	
		);	
	}
	
	else {
		callback();
	}
	
};

CHROMELL.configObserver = function() {
	
	Object.observe(CHROMELL.config, function(changes) {
		
		console.log(changes);
		localStorage['ChromeL-Config'] = JSON.stringify(CHROMELL.config);
		
	});		
	
}