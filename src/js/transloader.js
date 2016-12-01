// Original code from Milan
function imageTransloader(info, rename) {
	var url = info.srcUrl;
	
	// Remove query parameters
	url = url.split('?')[0];	
	
	var filename = url.substring(url.lastIndexOf('/') + 1);	
	
	// Make sure that filename isn't empty
	if (!filename) {
		filename = "untitled.jpg";
	}
	
	// Facebook id fix
	if (/fbcdn\-sphotos/.test(url)) {
		filename = "fb.jpg";
	}
	
	// We need to do some extra work to handle Wikia URLs
	if (/vignette[0-9].wikia.nocookie.net/.test(url)) {
	
		// We want to make sure that we transload the full size image
		if (/scale-to-width-down\/\d+/.test(url)) {
			var match = url.match(/scale-to-width-down\/\d+/)[0];
			url = url.replace(match, '');
		}
		
		// Wikia image URL paths can be weird (eg filename.jpg/revision/latest), so the filename is probably incorrect
		var splitUrl = url.split('/');
		for (var i = 0, len = splitUrl.length; i < len; i++) {
			var segment = splitUrl[i];
			if (/.(gif|jpg|png)/.test(segment)) {
				filename = segment;
				break;
			}
		}
	}
	
	// Check whether user requested to rename image
	if (rename) {
	
		var extensionCheck = filename.match(/\.(gif|jpg|png)$/i);
			
		var originalExtension;
				
		if (extensionCheck) {
			originalExtension = extensionCheck[0];
			filename = filename.replace(originalExtension, '');
		}
		
		var newFilename = prompt("Enter new filename:", filename);
		
		if (newFilename === null) {
			// User pressed cancel
			return;
		}
		
		else if (!/\S/.test(newFilename)) {
			// User entered blank filename, but presumably still wanted to upload something
			filename = 'untitled.jpg';
		}
		
		else if (newFilename.match(/\.(gif|jpg|png)$/i)) {
			
			var newExtension = newFilename.match(/\.(gif|jpg|png)$/i)[0];
			
			// Make sure that new filename has correct extension			
			if (originalExtension && newExtension != originalExtension) {
				newFilename = newFilename.replace(newExtension, originalExtension);
				filename = newFilename;
			}
			
			else {
				filename = newFilename;
			}
			
		}
		
		else {
			// If originalExtension is undefined, we let ETI handle the file extension.
			if (originalExtension) {
				filename = newFilename + originalExtension;
			}
			else {
				filename = newFilename;
			}
		}
	}
	
	// Fetch the image
	var fileGet = new XMLHttpRequest();
	fileGet.open("GET", url, true);
	fileGet.responseType = "arraybuffer";
	
	fileGet.onload = () => {
		if (fileGet.status === 200) {
			// Get metadata
			var filesize = fileGet.getResponseHeader("Content-Length");
			var mimetype = fileGet.getResponseHeader("Content-Type");
			
			// Create blob
			var dataview = new DataView(fileGet.response);
			var blob = new Blob([dataview]);
			
			// GIFs larger than 2MB will not upload to ETI correctly
			if (filesize > (1024 * 1024 * 2) && mimetype === "image/gif") {

				chrome.notifications.create('fail', {
					
					type: "basic",
					title: "Image transloading failed",
					message: "This gif is too big (>2MB)",
					iconUrl: "src/images/lueshi_48_i.png"
					
				}, (id) => {
					
					setTimeout(() => {
						chrome.notifications.clear(id, null);
					}, 3000);
					
				});
				
			} 
			
			else {
				// Construct FormData object containing image blob
				var formData = new FormData();
				formData.append("file", blob, filename);
				
				// Upload to ETI
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "http://u.endoftheinter.net/u.php", true);
				
				xhr.onload = () => {
					
					if (xhr.status === 200) {
						var responseText = xhr.responseText;
						var value;
						
						try {
							// Spooky HTML regex. The 1st group contains the string we are looking for
							var valueRegex = /<input value="(<img src=&quot;+.+&quot;\s\/>)"/;
							var matches = responseText.match(valueRegex);
							value = matches[1].replace(/&quot;/g, '"');
							
						} catch (e) {
							console.log('Error in spooky HTML regex:', e);
							
							try {
								// This method is not ideal as Chrome will try to load these images using the
								// chrome-extension: protocol, throwing multiple errors. But it's preferable 
								// to doing nothing
								
								var html = document.createElement('html');
								html.innerHTML = responseText;
								value = html.getElementsByClassName('img')[0].getElementsByTagName('input')[0].value;
								
							} catch (e2) {
								console.log('Error parsing HTML:', e2);
								return;
							}
						}
						
						// Copy img code to clipboard
						var clipboard = document.getElementById('clipboard');
						clipboard.value = value;
						clipboard.select();
						document.execCommand("copy");
						
						// Notify user
						chrome.notifications.create('succeed', {
							
							type: "basic",
							title: "Image transloaded",
							message: "The img code is now in your clipboard",
							iconUrl: "src/images/lueshi_48.png"
							
						}, (id) => {
							
							setTimeout(() => {
								chrome.notifications.clear(id, null);	
							}, 3000);
							
						});
						
					} else {
						console.log("Error ", xhr.statusText);
					}
				}
					// send FormData object to ETI
				xhr.send(formData);
			}
		} else {
			console.log("Error ", fileGet.statusText);
		}
	};
	
	fileGet.send(null);
}