// We have to set up separate namespaces for background and content scripts.
var CHROMELL = {};

CHROMELL.config = {};

CHROMELL.background = (function() {
	
	var board = [];
	var boards = {};
	var drama = {};
	var tabPorts = {};
	var ignoratorInfo = {};
	var scopeInfo = {};
	var imagemapCache = {};
	// var currentTab = '';
	var noIgnores = true;	

	var init = function(defaultConfig) {
		updateConfig(defaultConfig);
		
		if (CHROMELL.config.history_menubar_classic) {
			boards['Misc.'] = {"ChromeLL Options":"%extension%options.html"};
			if (CHROMELL.config.sort_history) {				
				boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php?b';
			} else {
				boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php';
			}
		}
		
		if (CHROMELL.config.saved_tags) {
			boards['Tags'] = CHROMELL.config.saved_tags;
		}
		
		if (CHROMELL.config.context_menu) {
			buildContextMenu();
		}
		
		for (var i in allBg.activeListeners) {
			// sets listeners for force_https, batch_uploader, etc
			allBg.activeListeners[i] = CHROMELL.config[i];
			console.log('setting listener: ' + i + " " + allBg.activeListeners[i]);
		}	
		
		allBg.init_listeners(CHROMELL.config);
		
		addListeners();
		
		checkVersion();
		omniboxSearch();
		clipboardHandler();	
		getUserID();
		getDrama();
		/*if (CHROMELL.config.sync_cfg) {
			checkSync();
		}*/
	};	
	
	var getDefaultConfig = function(callback) {
		var defaultURL = chrome.extension.getURL('/src/json/defaultconfig.json');
		var xhr = new XMLHttpRequest();
		xhr.open("GET", defaultURL, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var temp = JSON.parse(xhr.responseText);
				var defaultConfig = JSON.stringify(temp);
				callback(defaultConfig);
			}
		}
		xhr.send();	
	};
	
	var updateConfig = function(defaultConfig) {
		if (localStorage['ChromeLL-Config'] == undefined) {
			localStorage['ChromeLL-Config'] = defaultConfig;
			config = defaultConfig;
		}
		if (localStorage['ChromeLL-TCs'] == undefined) {
			localStorage['ChromeLL-TCs'] = "{}";
		}
		var configJS = JSON.parse(defaultConfig);
		config = JSON.parse(localStorage['ChromeLL-Config']);
		for (var i in configJS) {
			// if this variable does not exist, set it to the default
			if (config[i] === undefined) {
				config[i] = configJS[i];
				if (config.debug) {
					console.log("upgrade diff!", i, config[i]);
				}
			}
		}
		// beta versions stored TC cache in the global config. Delete if found
		if (config.tcs) {
			delete config.tcs;
		}
		// save the config, just in case it was updated
		localStorage['ChromeLL-Config'] = JSON.stringify(config);
	};
	
	var checkVersion = function() {
		var app = chrome.app.getDetails();
		// notify user if chromeLL has been updated
		if (localStorage['ChromeLL-Version'] != app.version 
				&& localStorage['ChromeLL-Version'] != undefined 
				&& CHROMELL.config.sys_notifications) {
			chrome.notifications.create('popup', {
					type: "basic",
					title: "ChromeLL has been updated",
					message: "Old v: " + localStorage['ChromeLL-Version'] 
							+ ", New v: " + app.version,
					buttons: [{
						title: "Click for more info",
					}],
					iconUrl: "src/images/lueshi_48.png"
				}, function(id) {
					chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
						if (notifId === id && btnIdx === 0) {
							// link user to topic containing patch notes & other info
							window.open("http://boards.endoftheinter.net/showmessages.php?topic=8887077");	
						}
					});
					setTimeout(function() {
						clearNotification(id);
					}, 5000);
				}
			);
			localStorage['ChromeLL-Version'] = app.version;
		}

		if (localStorage['ChromeLL-Version'] == undefined) {
			localStorage['ChromeLL-Version'] = app.version;
		}
	};
	
	var checkSync = function() {
		chrome.storage.sync.get('config', function(syncData) {
			if (syncData.config && syncData.config.last_saved > config.last_saved) {
				// synced config file is more recent than version on computer
				for (var keyName in syncData.config) {					
					config[keyName] = syncData.config[keyName];					
				}
				localStorage['ChromeLL-Config'] = JSON.stringify(config);
				var bSplit = [];
				for (var k in split) {
					if (config[split[k]]) {
						bSplit.push(k);
					}
				}
				chrome.storage.sync.get(bSplit, function(syncConfig) {
					for (var l in syncConfig) {
						config[l] = syncConfig[l];
					}
					localStorage['ChromeLL-Config'] = JSON.stringify(config);
				});
			}
			
			else if (!syncData.config || syncData.config.last_saved < config.last_saved) {
				var localConfig = JSON.parse(localStorage['ChromeLL-Config']);
				var toSet = {};
				for (var i in split) {
					if (config[split[i]]) {
						toSet[i] = localConfig[i];
					}
					delete localConfig[i];
				}
				toSet.config = localConfig;
				for (var i in toSet) {
					var f = function(v) {
						chrome.storage.sync.getBytesInUse(v, function(use) {
							// chrome.storage api allows 8,192 bytes per item
							if (use > 8192) {
								var sp = Math.ceil(use / 8192);
								var c = 0;
								for (var j in toSet[v]) {
									if (!toSet[v + (c % sp)]) {
										toSet[v + (c % sp)] = {};
									}
									toSet[v + (c % sp)][j] = toSet[v][j];
									c++;
								}
								delete toSet[v];
							}
						});
					}
					f(i);
				}
				chrome.storage.sync.set(toSet);				
			}
		});
	};
	
	var clipboardHandler = function() {
		var backgroundPage = chrome.extension.getBackgroundPage();
		var textArea = backgroundPage.document.createElement("textarea");
		textArea.id = "clipboard";
		backgroundPage.document.body.appendChild(textArea);
		chrome.runtime.onMessage.addListener(
			// allows text content to be copied to clipboard from content scripts
			function(request, sender, sendResponse) {
				if (request.quote) {
					var quote = request.quote;
					var clipboard = document.getElementById('clipboard');
					clipboard.value = quote;
					clipboard.select();
					document.execCommand("copy");
					sendResponse({
						clipboard: "Copied to clipboard."
					});
				}
			}
		);	
	};
	
	var buildContextMenu = function() {
		// imageTransloader function is located in transloader.js
		chrome.contextMenus.create({
			"title": "Transload image",
			"onclick": function(info) {
				imageTransloader(info);
			},
			"contexts": ["image"]
		});
		
		if (CHROMELL.config.enable_image_rename) {
			chrome.contextMenus.create({
				"title": "Rename and transload image",
				"onclick": function(info) {
					imageTransloader(info, true);
				},
				"contexts": ["image"]
			});
		}
		
		chrome.contextMenus.create({
			"title": "Search LUE",
			"onclick": contextMenu.searchLUE,
			"contexts": ["selection"]
		});
		
		if (CHROMELL.config.eti_bash) {
			chrome.contextMenus.create({
				"title": "Submit to ETI Bash",
				"onclick": contextMenu.bashHighlight,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*"],
				"contexts": ["selection"]
			});
		}
		
		if (CHROMELL.config.copy_in_context) {
			chrome.contextMenus.create({
				"title": "Copy IMG code",
				"onclick": contextMenu.imageCopy,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
				"contexts": ["image"]
			});
		}		
		
		if (!CHROMELL.config.simple_context_menu) {
			chrome.contextMenus.create({
				"title": "View image map",
				"onclick": contextMenu.imageMap,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
				"contexts": ["image"]
			});
			for (var i in boards) {
				
				if (boards[i] != boards[0]) {
					chrome.contextMenus.create({
						"type": "separator",
						"contexts": ["page", "image"]
					});
				}
				
				for (var j in boards[i]) {
					var id = chrome.contextMenus.create({
						"title": j,
						"onclick": contextMenu.handleContext,
						"contexts": ["page", "image"]
					});					
					board[id] = boards[i][j];
				}
			}
		}
	};
	
	var contextMenu = {
		imageMap: function(info) {
			var str = info.srcUrl;
			var tokens = str.split('/').slice(-2);
			var imageURL = tokens.join('/');
			var imageMap = "http://images.endoftheinter.net/imap/" + imageURL;
			if (config.imagemap_new_tab) {
				chrome.tabs.create({
						url: imageMap
				});
			} else {
				chrome.tabs.update({
						url: imageMap
				});
			}
		},
		imageCopy: function(info) {
			var imgURL = info.srcUrl.replace("dealtwith.it", "endoftheinter.net")
			var imgCode = '<img src="' + imgURL + '"/>';
			var clipboard = document.getElementById('clipboard');
			clipboard.value = imgCode;
			clipboard.select();
			document.execCommand("copy");
		},
		searchLUE: function(info) {
			chrome.tabs.create({
					url: "http://boards.endoftheinter.net/topics/LUE?q=" + info.selectionText
			});
		},
		bashHighlight: function(info) {
			var selection_text = info.selectionText;
			var bash_data, formData, xhr;
			chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					action: "get_bash"
				}, function(response) {
					console.log(response);
					bash_data = response.data;
					if (bash_data[0] !== null) {
						// create formData
						formData = new FormData();
						formData.append('quotes_user', bash_data[0]);
						formData.append('quotes_topic', bash_data[1]);
						formData.append('quotes_content', selection_text);
						// send formData to ETI Bash
						xhr = new XMLHttpRequest;
						xhr.open('POST', 'http://fuckboi.club/bash/submit-quote.php', true);
						xhr.send(formData);
					}
					else {
						console.log('bash_data array contains null value: ', bash_data);
					}
				});
			});
		},
		handleContext: function(info) {
			var url = board[info.menuItemId];			
			if (!url.match('%extension%')) {
				if (url.match('history.php')) {		
					// no changes necessary
				}
				else {
					url = "http://boards.endoftheinter.net/topics/" + url;	
				}
			}
			else {
			  url = url.replace("%extension%", chrome.extension.getURL("/"));
			}
			
			chrome.tabs.create({
				"url": url
			});			
		}
	};
	
	var getDrama = function(callback) {
		if (config.debug) {
			console.log('fetching dramalinks from wiki...');
		}
		// use base64 string instead of external URL to avoid insecure content warnings for HTTPS users
		var png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAFVBMVEVmmcwzmcyZzP8AZswAZv////////'
				+ '9E6giVAAAAB3RSTlP///////8AGksDRgAAADhJREFUGFcly0ESAEAEA0Ei6/9P3sEcVB8kmrwFyni0bOeyyDpy9JTLEaOhQq7Ongf5FeMhHS/4AVnsAZubx'
				+ 'DVmAAAAAElFTkSuQmCC';
		var dramas;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "http://wiki.endoftheinter.net/index.php?title=Dramalinks/current&action=raw&section=0&maxage=30", true);
		xhr.withCredentials = "true";
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var t = xhr.responseText;
				t = t.replace(/\[\[(.+?)(\|(.+?))\]\]/g, 
						"<a href=\"http://wiki.endoftheinter.net/index.php/$1\">$3</a>");
				t = t.replace(/\[\[(.+?)\]\]/g, 
						"<a href=\"http://wiki.endoftheinter.net/index.php/$1\">$1</a>");
				t = t.replace(/\[(.+?)\]/g, 
						"<a href=\"$1\" style=\"padding-left: 0px\"><img src=\"" + png + "\"></a>");
				t = t.replace(/href="\/index\.php/g, 
						"href=\"http://wiki.endoftheinter.net/index.php");
				t = t.replace(/style=/gi, "");
				t = t.replace(/<script/gi, "<i");
				t = t.replace(/(on)([A-Za-z]*)(=)/gi, "");
				t = t.slice(t.indexOf("<!--- NEW STORIES GO HERE --->") + 29);
				dramas = t.slice(0, t.indexOf("<!--- NEW STORIES END HERE --->"));
				t = t.slice(t.indexOf("<!--- CHANGE DRAMALINKS COLOR CODE HERE --->"));
				t = t.slice(t.indexOf("{{") + 2);
				var bgcol = t.slice(0, t.indexOf("}}"));
				var col;
				var kermit = false;
				var other = false;
				var error = false;
				switch (bgcol.toLowerCase()) {
					case "kermit":
						document.getElementById("dramalinks_ticker").style.border = "2px solid #990099";
						bgcol = "black";
						kermit = true;
					case "black":
					case "blue":
					case "green":
						col = "white";
						break;
					case "lovelinks":
					case "yellow":
					case "orange":
					case "red":
						col = "black";
						break;
					case "errorlinks":
						bgcol = "blue";
						col = "white";
						error = true;
						break;
					default:
						other = true;
						break;
				}
				if (kermit) {
					dramas = "Current Dramalinks Level: <blink><font color='" + bgcol
							+ "'>CODE KERMIT</font></blink><div style='background-color: " + bgcol + "; color: " + col + ";'>" 
							+ dramas.slice(2).replace(/\*/g, "&nbsp;&nbsp;&nbsp;&nbsp;") + "</div>";			
				}
				else if (error) {
					dramas = "<font face='Lucida Console'>"
							+ "<div style='background-color: " + bgcol + "; color: " + col + ";'>" 
							+ "A problem has been detected and ETI has been shut down to prevent damage to your computer."
							+ "<br><br> Technical information: </font>" + dramas.slice(2).replace(/\*/g, "&nbsp;&nbsp;&nbsp;&nbsp;") 
							+ "</div></font>";	
				} 
				else if (other) {
					dramas = "<span style='text-transform:capitalize'>Current Dramalinks Level: <font color='" + bgcol + "'>" + bgcol 
							+ "</font></span><div>" + dramas.slice(2).replace(/\*/g, "&nbsp;&nbsp;&nbsp;&nbsp;") + "</div>";				
				} else {
					dramas = "<span style='text-transform:capitalize'>Current Dramalinks Level: <font color='" + bgcol + "'>" + bgcol 
						+ "</font></span><div style='background-color: " + bgcol + "; color: " + col + ";'>" 
						+ dramas.slice(2).replace(/\*/g, "&nbsp;&nbsp;&nbsp;&nbsp;") + "</div>";	
				}	
				drama.txt = dramas;
				drama.time = parseInt(new Date().getTime() + (1800 * 1000));
				if (callback) {
					callback(drama);
				}
			}
			if (xhr.readyState == 4 && xhr.status == 404) {
				// 404 error occurs if user has logged into ETI using multiple IP addresses
				drama.txt = '<a id="retry" href="#">Error loading Dramalinks. Click to retry...</a>';
			}
		}
	};
	
	var addListeners = function() {
		chrome.tabs.onActivated.addListener(function(tab) {
			if (!tabPorts[tab.tabId]) {
				return;
			}
			else {
				tabPorts[tab.tabId].postMessage({
					action: 'ignorator_update'
				});
			}
		});
		
		chrome.tabs.onRemoved.addListener(function(tab) {
			if (tabPorts[tab]) {				
				delete tabPorts[tab];
				delete ignoratorInfo[tab];
				delete scopeInfo[tab];
			}
		});
		
		chrome.runtime.onConnect.addListener(function(port) {
			tabPorts[port.sender.tab.id] = {};
			tabPorts[port.sender.tab.id] = port;
			tabPorts[port.sender.tab.id].onMessage.addListener(function(msg) {
				eventHandlers.ignoratorUpdate(port.sender.tab.id, msg);
			});
		});
		
		// Create XHR object outside of function so it can be reused
		var xhr = new XMLHttpRequest();
		
		chrome.runtime.onMessage.addListener(
			function(request, sender, sendResponse) {				
				switch(request.need) {
					case "xhr":
						// Use GET for default value
						var type = request.type || 'GET';
						
						xhr.open(type, request.url, true);		
						
						if (request.auth) {
							xhr.setRequestHeader('Authorization', request.auth);
						}
						
						xhr.onload = function() {
							if (status === 200) {
								sendResponse(responseText);
							}					
						};
						
						xhr.send();
						// return true to prevent bug with sendResponse (See: https://code.google.com/p/chromium/issues/detail?id=343007)
						return true;
						break;
					case "config":
						// page script needs extension config.
						CHROMELL.config = JSON.parse(localStorage['ChromeLL-Config']);
						if (request.sub) {
							sendResponse({"data": CHROMELL.config[request.sub]});
						} else if (request.tcs) {
							var tcs = JSON.parse(localStorage['ChromeLL-TCs']);
							sendResponse({"data": CHROMELL.config, "tcs": tcs});
						} else {
							sendResponse({"data": CHROMELL.config});
						}
						break;
					case "save":
						// page script needs config save.
						if (request.name === "tcs") {
							localStorage['ChromeLL-TCs'] = JSON.stringify(request.data);
						} else {
							CHROMELL.config[request.name] = request.data;
							CHROMELL.config.last_saved = new Date().getTime();
							localStorage['ChromeLL-Config'] = JSON.stringify(CHROMELL.config);
						}
						if (CHROMELL.config.debug) {
							console.log('saving ', request.name, request.data);
						}
						break;
					case "notify":
						chrome.notifications.create('popup', {
							type: "basic",
							title: request.title,
							message: request.message,
							iconUrl: "src/images/lueshi_48.png"
						},
						function (id) {
							if (!CHROMELL.config.clear_notify) {
								CHROMELL.config.clear_notify = "5";
							}
							if (CHROMELL.config.clear_notify === "0") {
								return;
							}
							setTimeout(function() {
								clearNotification(id);
							}, parseInt(CHROMELL.config.clear_notify, 10) * 1000);
						});
						break;	
					case "dramalinks":
						var time = parseInt(new Date().getTime());
						if (drama.time && (time < drama.time)){
							if (CHROMELL.config.debug) {
								console.log('returning cached dramalinks. cache exp: ' + drama.time + ' current: ' + time);
							}
							sendResponse({"data": drama.txt});
						} else {
							sendResponse({"data": drama.txt});
							getDrama();
						}
						break;
					case "insertcss":
						if (CHROMELL.config.debug) {
							console.log('inserting css ', request.file);
						}
						chrome.tabs.insertCSS(sender.tab.id, {file: request.file});
						sendResponse({
							// no response needed
						});
						break;
					case "opentab":
						if (CHROMELL.config.debug) {
							console.log('opening tab ', request.url);
						}
						chrome.tabs.create({url: request.url});
						break;
					case "noIgnores":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								sendResponse({"noignores": noIgnores});										
						});
						return true;								
					case "getIgnored":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								sendResponse({
										"ignorator": ignoratorInfo[tabs[0].id], 
										"scope": scopeInfo[tabs[0].id]}
								);
						});		
						return true;									
					case "showIgnorated":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								tabPorts[tabs[0].id].postMessage({action: 'showIgnorated', ids: request.ids});									
						});		
						if (CHROMELL.config.debug) {
							console.log('showing hidden data', request);
						}
						return true;
					case "options":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								// check whether bg script can send messages to current tab
								if (tabPorts[tabs[0].id] && !CHROMELL.config.options_window) {
									// open options in same tab
									chrome.tabs.sendMessage(tabs[0].id, {
										action: "showOptions"
									}, function(response) {
										// empty callback
									});
								}
								else {
									// open options in new tab
									chrome.tabs.create({
											url: chrome.extension.getURL('options.html')
									});							
								}
						});	
						break;
					default:
						if (CHROMELL.config.debug) {
							console.log("Error in request listener - undefined parameter?", request);
						}
						break;
				}
			}
		);
	};
	
	var eventHandlers = {
		ignoratorUpdate: function(tab, msg) {
			switch (msg.action) {
				case "ignorator_update":
					ignoratorInfo[tab] = msg.ignorator;
					scopeInfo[tab] = msg.scope;
					if (msg.ignorator.total_ignored > 0) {
						chrome.browserAction.setBadgeBackgroundColor({
							tabId: tab,
							color: "#ff0000"
						});
						chrome.browserAction.setBadgeText({
							tabId: tab,
							text: "" + msg.ignorator.total_ignored
						});							
						noIgnores = false;
					} else if (msg.ignorator.total_ignored == 0) {
						noIgnores = true;
					}
					break;
				default:
					console.log('no', msg);
					break;
			}
		}
	};
	
	var getUserID = function() {
		var config = JSON.parse(localStorage['ChromeLL-Config']);
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "http://boards.endoftheinter.net/topics/LUE", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var html = document.createElement('html');
				html.innerHTML = xhr.responseText;
				if (html.getElementsByTagName('title')[0]
						.innerText.indexOf("Das Ende des Internets") > -1) {
					// user is logged out
					return;
				} 
				else {
					var userID = html.getElementsByClassName('userbar')[0]
						.getElementsByTagName('a')[0].href
						.match(/\?user=([0-9]+)/)[1];
					config.user_id = userID;
					localStorage['ChromeLL-Config'] = JSON.stringify(config);
					scrapeUserProfile(userID);
				}
			}
		}
		xhr.send();
	};
	
	var scrapeUserProfile = function(userID) {
		var config = JSON.parse(localStorage['ChromeLL-Config']);
		var url = "http://endoftheinter.net/profile.php?user=" + userID;
		var xhr = new XMLHttpRequest();
		console.log("User Profile = " + url);
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var adminTags, modTags, isAdmin, isMod;
				var html = document.createElement('html');
				html.innerHTML = xhr.responseText;
				var adminArray = [];
				var modArray = [];
				var tagArray = [];
				var tds = html.getElementsByTagName("td");
				for (var i = 0; i < tds.length; i++) {
					var td = tds[i];
					if (td.innerText.indexOf("Administrator of") > -1) {
						var adminTags = tds[i + 1].getElementsByTagName('a');
						isAdmin = true;
					}
					if (td.innerText.indexOf("Moderator of") > -1) {
						var modTags = tds[i + 1].getElementsByTagName('a');
						isMod = true;
					}
				}
				if (isAdmin) {
					adminArray = Array.prototype.slice.call(adminTags);
				}
				if (isMod) {
					modArray = Array.prototype.slice.call(modTags);
				}
				tagArray = adminArray.concat(modArray);
				for (var i = 0, len = tagArray.length; i < len; i++) {
					var tag = tagArray[i].innerText;
					tagArray[i] = tag;
				}
				console.log(tagArray);
				config.tag_admin = tagArray;
				localStorage['ChromeLL-Config'] = JSON.stringify(config);
				console.log("scraped profile for tag information");
			}
		}
		xhr.send();
	};
	
	var clearNotification = function(ID) {
		chrome.notifications.clear(ID,
			function() {
				// empty callback - method requires function to be passed as 2nd parameter,
				// but we just want to clear the notification
			}
		);
	};
	
	var omniboxSearch = function() {
		var arrayForSearch = [];
		var tags, tag; 
		var tagsForSearch = '';
		var query;
		var searchURL;
		chrome.omnibox.onInputEntered.addListener(function(data) {
			arrayForSearch = data.split('>');
			if (!arrayForSearch[1] && data !== '') {
				query = data;
				searchURL = 'http://boards.endoftheinter.net/topics/?q=' + query;
				chrome.tabs.update({
						url: searchURL
				});
			}
			else {
				tags = arrayForSearch[0].split(',');
				query = arrayForSearch[1];
				if (tags.length === 1) {
					tagsForSearch = tags[0];
				}
				else {
					for (var i = 0, len = tags.length; i < len; i++) {
						tag = tags[i];
						tagsForSearch += tag;
						if (i !== tags.length - 1) {
							// add hex character for plus sign
							tagsForSearch += '%2B';
						}
					}
				}
				searchURL = '	http://boards.endoftheinter.net/topics/' + tagsForSearch + '?q=' + query;
				chrome.tabs.update({
						url: searchURL
				});
			}
		});
	};
		
	getDefaultConfig(function(config) {
		init(config);
	});
	
})();
