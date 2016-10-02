function imageTransloader(info, rename) {
	// Code from Milan	
	var filename = info.srcUrl.substring(info.srcUrl.lastIndexOf('/') + 1);
	// facebook id fix
	var pattern = /fbcdn\-sphotos/;
	if (pattern.test(info.srcUrl)) {
		filename = "fb.jpg";
	}
	// make sure it's not empty
	if (filename === "") {
		filename = "something.jpg";
	}
	if (rename) {
		var extension = filename.match(/\.(gif|jpg|png)$/i)[0];	
		var newFilename = prompt("Enter new filename:", filename.replace(extension, ''));
		if (newFilename === null || !/\S/.test(newFilename)) {
			// user pressed cancel or entered blank filename
			return;
		}
		else if (newFilename.match(/\.(gif|jpg|png)$/i)) {
			var newExtension = newFilename.match(/\.(gif|jpg|png)$/i)[0];
			if (newExtension != extension) {
				// make sure that new filename has correct extension
				newFilename = newFilename.replace(newExtension, extension);
				filename = newFilename;
			}
			else if (newExtension == extension) {
				filename = newFilename;
			}
		}
		else {
			filename = newFilename + extension;
		}
	}
	// fetch the image
	var fileGet = new XMLHttpRequest();
	fileGet.open("GET", info.srcUrl, true);
	fileGet.responseType = "arraybuffer";
	fileGet.onreadystatechange = function(oEvent) {
		if (fileGet.readyState === 4) {
			if (fileGet.status === 200) {
				// get necessary metadata
				var filesize = fileGet.getResponseHeader("Content-Length");
				var mimetype = fileGet.getResponseHeader("Content-Type");
				// build blob
				var dataview = new DataView(fileGet.response);
				var blob = new Blob([dataview]);
				// check if gif && > 2MB
				if (filesize > (1024 * 1024 * 2) && mimetype === "image/gif") {
					// notify user, updated for chrome.notifications api
					chrome.notifications.create('fail', {
						type: "basic",
						title: "Image transloading failed",
						message: "This gif is too big (>2MB)",
						iconUrl: "src/images/lueshi_48_i.png"
					}, function(id) {
						setTimeout(function() {
							clearNotification(id);
						}, 3000);
					});
				} else {
					// construct FormData object
					var formData = new FormData();
					formData.append("file", blob, filename);
					// open connection to ETI and set callback
					var xhr = new XMLHttpRequest();
					xhr.open("POST", "http://u.endoftheinter.net/u.php", true);
					xhr.onreadystatechange = function(xEvent) {
							if (xhr.readyState === 4) {
								if (xhr.status === 200) {
									// parse response
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
									// send img code to clipboard
									var clipboard = document
										.getElementById('clipboard');
									clipboard.value = value;
									clipboard.select();
									document.execCommand("copy");
									// notify user
									chrome.notifications.create('succeed', {
										type: "basic",
										title: "Image transloaded",
										message: "The img code is now in your clipboard",
										iconUrl: "src/images/lueshi_48.png"
									}, function(id) {
										setTimeout(function() {
											clearNotification(id);
										}, 3000);
									});
								} else {
									console.log("Error ", xhr.statusText);
								}
							}
						}
						// send FormData object to ETI
					xhr.send(formData);
				}
			} else {
				console.log("Error ", xhr.statusText);
			}
		}
	};
	fileGet.send(null);
}

function clearNotification(id) {
	chrome.notifications.clear(id,
		function() {
			// empty callback
		}
	);
}