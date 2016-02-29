function imageTransloader(info, rename) {
	// Code from Milan	
	var filename = info.srcUrl.substring(info.srcUrl.lastIndexOf('/') + 1);
	
	// Facebook image fix
	var pattern = /fbcdn\-sphotos/;
	if (pattern.test(info.srcUrl)) {
		filename = "fb.jpg";
	}
		
	if (filename === "") {
		filename = "something.jpg";
	}
		
	// Check if user requested to rename the file before uploading
	if (rename) {
		var extension = filename.match(/\.(gif|jpg|png)$/i)[0];	
		var newFilename = prompt("Enter new filename:", filename.replace(extension, ''));
		
		// User pressed cancel or entered blank username
		if (newFilename === null || !/\S/.test(newFilename)) {			
			return;
		}
		
		// User included file extension in new filename 
		else if (newFilename.match(/\.(gif|jpg|png)$/i)) {
			var newExtension = newFilename.match(/\.(gif|jpg|png)$/i)[0];
			
			// Make sure that new extension matches original file
			if (newExtension !== extension) {				
				newFilename = newFilename.replace(newExtension, extension);
				filename = newFilename;
			}
			
			else if (newExtension === extension) {
				filename = newFilename;
			}
			
		}
		
		// User didn't specify extension
		else {
			filename = newFilename + extension;
		}
	}
	
	// Fetch image
	var fileGet = new XMLHttpRequest();
	fileGet.open("GET", info.srcUrl, true);
	fileGet.responseType = "arraybuffer";
	
	fileGet.onload = function(oEvent) {
		
		if (fileGet.status === 200) {
			
			// Get metadata
			var filesize = fileGet.getResponseHeader("Content-Length");
			var mimetype = fileGet.getResponseHeader("Content-Type");
			
			// Create blob
			var dataview = new DataView(fileGet.response);
			var blob = new Blob([dataview]);
			
			// Cannot upload GIFs where filesize > 2MB
			if (filesize > (1024 * 1024 * 2) && mimetype === "image/gif") {				
			
				// Notify user
				chrome.notifications.create('fail', {
					type: "basic",
					title: "Image transloading failed",
					message: "This gif is too big (>2MB)",
					iconUrl: "src/images/lueshi_48_i.png"
				}, function(id) {
					setTimeout(function() {
						chrome.notifications.clear(id, null);
					}, 3000);
				});
			}
			
			else {
				// Construct FormData object
				var formData = new FormData();
				formData.append("file", blob, filename);
				
				// Open connection to ETI and set callback
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "http://u.endoftheinter.net/u.php", true);
				xhr.onload = function(xEvent) {
					if (xhr.status === 200) {
						// Parse response
						var html = document.createElement('html');
						html.innerHTML = xhr.responseText;
						
						try {
							var value = html
								.getElementsByClassName('img')[0]
								.getElementsByTagName('input')[0].value;
						} catch (e) {
							console.log("Error in response", html.innerHTML);
							return;
						}
						
						// Send img code to clipboard
						var clipboard = document
							.getElementById('clipboard');
						clipboard.value = value;
						clipboard.select();
						document.execCommand("copy");
						
						// Notify user
						chrome.notifications.create('succeed', {
							type: "basic",
							title: "Image transloaded",
							message: "The img code is now in your clipboard",
							iconUrl: "src/images/lueshi_48.png"
						}, function(id) {
							setTimeout(function() {
								chrome.notifications.clear(id, null);
							}, 3000);
						});
					} 
					
					else {
						console.log("Error ", xhr.statusText);
					}
				}

				xhr.send(formData);
			}
		}
		
		else {
			console.log("Error ", xhr.statusText);
		}
	};
	
	fileGet.send();
}