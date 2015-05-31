var CHROMELL = {};

CHROMELL.config = {};

chrome.runtime.sendMessage(
		{
				need: "config"
		}, 
				function(response) {
					// NOTE: if this causes problems, we can access config synchronously using localStorage
					CHROMELL.config = response.data;
				}
);