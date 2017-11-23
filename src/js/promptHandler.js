/**
 *  "Firefox does not support using alert(), confirm(), or prompt() from background pages."
 *  https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Chrome_incompatibilities
 *
 *  The "Rename and transload" feature requires a prompt to get the desired filename, so we
 *  need to inject a small script into every page to give us that capability.
 */
 
(function() {
	
	browser.runtime.onMessage.addListener(msg => {
		
		if (msg.action === 'openRenamePrompt') {
			
			return new Promise((resolve, reject) => {
		
				var newFilename = window.prompt('Enter new filename:', msg.placeholder);

				if (newFilename === null) {
					// User pressed cancel. Resolve with false to cancel upload
					resolve(false);
				}
				
				else if (!/\S/.test(newFilename)) {
					// User entered blank filename, but presumably still wanted to upload something. 
					// Resolve with null to cancel rename
					resolve();
				}				
				
				else {
					resolve(newFilename);
				}
			
			});
		}
		
	});

})();