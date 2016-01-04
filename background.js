// We have to set up separate namespaces for background and content scripts.
var CHROMELL = {};

CHROMELL.config = {};

CHROMELL.background = (function() {
	
	var board = [];
	var boards = {};
	var drama = {};	
	var ajaxCache = {};
	var tabPorts = {};
	var ignoratorInfo = {};
	var scopeInfo = {};
	var imagemapCache = {};
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
		var request = {
				url: chrome.extension.getURL('/src/json/defaultconfig.json')
		};
		
		ajax(request, function(response) {
				var temp = JSON.parse(response);
				var defaultConfig = JSON.stringify(temp);
				callback(defaultConfig);			
		});
		
	};
	
	var updateConfig = function(defaultConfig) {
		if (localStorage['ChromeLL-Config'] == undefined) {
			localStorage['ChromeLL-Config'] = defaultConfig;
			CHROMELL.config = defaultConfig;
		}
		if (localStorage['ChromeLL-TCs'] == undefined) {
			localStorage['ChromeLL-TCs'] = "{}";
		}
		var configJS = JSON.parse(defaultConfig);
		CHROMELL.config = JSON.parse(localStorage['ChromeLL-Config']);
		for (var i in configJS) {
			// if this variable does not exist, set it to the default
			if (CHROMELL.config[i] === undefined) {
				CHROMELL.config[i] = configJS[i];
				if (CHROMELL.config.debug) {
					console.log("upgrade diff!", i, CHROMELL.config[i]);
				}
			}
		}
		
		// beta versions stored TC cache in the global config. Delete if found
		if (CHROMELL.config.tcs) {
			delete CHROMELL.config.tcs;
		}
		
		// save the config, just in case it was updated
		localStorage['ChromeLL-Config'] = JSON.stringify(CHROMELL.config);
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
	
	var sync = function() {
		
		var splitObject = function(object) {
			var sectionSize = 0;
			var sectionIndex = 0;
			var splitKeys = {};
			var keysToSplit = [];
			
			for (var key in object) {
			
			/*	
			 *	Size of item is measured by the "JSON stringification of its value plus its key length",
			 *	so we also need to add 2 to account for quotes added by JSON.stringify method
			 *
			 *	(https://developer.chrome.com/extensions/storage#property-sync)					
			 */					
				
				var item = object[key];				
				var size = key.length + 2;
				
				if (item instanceof Object) {
					var objectString = JSON.stringify(item);
					size += objectString.length;
				}
				
				else {
					size += item.toString().length;
				}
				
				if (sectionSize + size > chrome.storage.sync.QUOTA_BYTES_PER_ITEM) {
					// Addition of key-value pair would exceed QUOTA_BYTES_PER_ITEM, so store existing values &
					// start new section of split object
					splitKeys['config_' + sectionIndex] = {};
					splitKeys['config_' + sectionIndex] = createNewSection(object, keysToSplit);

					// Start new section.
					sectionIndex++;							
					sectionSize = 0;
					keysToSplit.length = 0;								
				}
				
				// Push key to current section (or to new section, depending on whether chrome.storage.sync.QUOTA_BYTES_PER_ITEM was exceeded)
				keysToSplit.push(key);
				sectionSize += size;
			}
			
			// Check for any keys that haven't been accounted for yet
			if (keysToSplit.length > 0) {
				splitKeys['config_' + sectionIndex] = createNewSection(object, keysToSplit);
			}

			return splitKeys;
		};
		
		var createNewSection = function(source, keys) {
			// Creates new object using a source object and an array of keys to include.
			var newSection = {};			
			for (var i = 0, len = keys.length; i < len; i++) {
				var key = keys[i];
				newSection[key] = source[key];														
			}
			return newSection;
		};

		var syncLocalConfig = function() {
			var configToSync = CHROMELL.config;	
			// Delete user ID, tag admin list and bookmarks - these should always be generated from current login session
			delete configToSync.user_id;
			delete configToSync.tag_admin;
			delete configToSync.saved_tags;
			
			// Split config to make sure that we do not exceed QUOTA_BYTES_PER_ITEM value
			var splitConfig = splitObject(configToSync);			
			var currentTime = new Date().getTime();		
			
			var syncData = {
				'last_sync': currentTime
			};
			
			// Prepare to sync split config keys
			for (var key in splitConfig) {
				syncData[key] = splitConfig[key];
			}
			
			chrome.storage.sync.set(syncData);
		};
		
		var loadConfigFromSync = function(data) {
			// Iterate over each object key to find split config items
			for (var key in data) {
				if (key.match(/config/)) {
					var configSection = data[key];
					for (var key in configSection) {
						CHROMELL.config[key] = configSection[key];
					}
				}
			}
			// Update last_saved time and save config.
			CHROMELL.config.last_saved = new Date().getTime();
			localStorage['ChromeLL-Config'] = CHROMELL.config;			
		};		
			
		return {
						
			init: function() {
				// Pass null to storage.sync.get method to retrieve all synced data
				chrome.storage.sync.get(null, function(data) {
					var configFromSync = data.config;
					var lastSync = data.last_sync;			
			
					if (lastSync > CHROMELL.config.last_saved) {
						loadConfigFromSync(data);
					}
					
					else if (Object.keys(data).length === 0 || lastSync <= CHROMELL.config.last_saved) {
						// (storage api returns empty object if user hasn't synced before)
						syncLocalConfig();
					}
				});
			}
			
		};
		
	}();
	
	var clipboardHandler = function() {
		var backgroundPage = chrome.extension.getBackgroundPage();
		var textArea = backgroundPage.document.createElement("textarea");
		textArea.id = "clipboard";
		backgroundPage.document.body.appendChild(textArea);
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
		// use base64 string instead of external URL to avoid insecure content warnings for HTTPS users
		var png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAFVBMVEVmmcwzmcyZzP8AZswAZv////////'
				+ '9E6giVAAAAB3RSTlP///////8AGksDRgAAADhJREFUGFcly0ESAEAEA0Ei6/9P3sEcVB8kmrwFyni0bOeyyDpy9JTLEaOhQq7Ongf5FeMhHS/4AVnsAZubx'
				+ 'DVmAAAAAElFTkSuQmCC';
		
		var request = {
				url :	'http://wiki.endoftheinter.net/index.php?title=Dramalinks/current&action=raw&section=0&maxage=30',
				withCredentials: true,
				// Dramalinks handles its own caching
				ignoreCache: true
				
		};
		
		ajax(request, function(response, status) {
			if (response) {
				var t = response;
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
				var dramas = t.slice(0, t.indexOf("<!--- NEW STORIES END HERE --->"));
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
			}
			
			else if (status === 404) {
				// 404 error occurs if user has logged into ETI using multiple IP addresses (redirects to defunct luelinks.net URL)
				drama.txt = '<a id="retry" href="#">Error loading Dramalinks. Click to retry...</a>';
			}
			
			if (callback) {				
				callback(drama);
			}
			
		});
	};
	
	var ajax = function(request, callback) {
		// Check xhrCache before creating new XHR.
		var url = request.url;
		var currentTime = new Date().getTime();
		
		if (!request.ignoreCache && ajaxCache[url]
				&& currentTime < ajaxCache[url].refreshTime ) {
					
			// Return cached response
			callback(ajaxCache[url].data);
		}
		
		else {
			var TWENTY_FOUR_HOURS = 86400000; // 24 hours in milliseconds
			var type = request.type || 'GET';
			var xhr = new XMLHttpRequest();
			xhr.requestURL = url;
			xhr.open(type, request.url, true);
			
			if (request.noCache) {
				xhr.setRequestHeader('Cache-Control', 'no-cache');
			}
			if (request.auth) {
				xhr.setRequestHeader('Authorization', request.auth);
			}
			if (request.withCredentials) {
				xhr.withCredentials = "true";
			}
			
			xhr.onload = function() {
				if (this.status === 200) {
					if (!request.ignoreCache) {
						// Cache response and check again after 24 hours
						ajaxCache[this.requestURL] = {
							data: this.responseText,
							refreshTime: currentTime + TWENTY_FOUR_HOURS
						};
					}
					
					callback(this.responseText);
				}
				
				else {
					// Callback with false value so we know that request failed
					callback(false, this.status);
				}
				
			};
			
			xhr.send();		
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

		var messageHandler = function(request, sender, sendResponse) {
			switch(request.need) {			
					case "xhr":					
						ajax(request, function(response) {							
							sendResponse(response);
						});			
						// Return true so that we can use sendResponse asynchronously (See: https://developer.chrome.com/extensions/runtime#event-onMessage)
						return true;
						
					case "config":
						// page script needs extension config.
						var config = CHROMELL.config;
						
						if (request.sub) {
							sendResponse({"data": config[request.sub]});
						}
						
						else if (request.tcs) {
							var tcs = JSON.parse(localStorage['ChromeLL-TCs']);
							sendResponse({"data": config, "tcs": tcs});
						} 
						
						else {
							sendResponse({"data": config});
						}
						
						break;
						
					case "config_push":	
						// Updates background config object without saving to localStorage.
						CHROMELL.config = request.data;
						CHROMELL.config.last_saved = new Date().getTime();
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
								// check whether bg script can send messages to active tab
								if (tabPorts[tabs[0].id] && !CHROMELL.config.options_window) {
									// open options in iframe
									chrome.tabs.sendMessage(tabs[0].id, {
										action: "showOptions"
									}, function() {
										// Do nothing
									});
								}
								else {
									chrome.runtime.openOptionsPage();				
								}
						});	
						break;
					
					case "copy":
						var clipboard = document.getElementById('clipboard');
						clipboard.value = request.data;
						clipboard.select();
						document.execCommand("copy");
						break;
						
					default:			
						console.log("Error in request listener - undefined parameter?", request);
						break;
						
			}
			
		};
		
		chrome.runtime.onMessage.addListener(messageHandler);
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
		
		var request = {
				url: 'http://boards.endoftheinter.net/topics/LUE',
				ignoreCache: true
		};
		
		ajax(request, function(response) {
			
			var html = document.createElement('html');
			html.innerHTML = response;
			
			if (html.getElementsByTagName('title')[0]
					.innerText.indexOf("Das Ende des Internets") > -1) {
				// user is logged out
				return;
			}
			
			else {
				var userID = html.getElementsByClassName('userbar')[0]
					.getElementsByTagName('a')[0].href
					.match(/\?user=([0-9]+)/)[1];
				CHROMELL.config.user_id = userID;
				localStorage['ChromeLL-Config'] = JSON.stringify(CHROMELL.config);
				scrapeUserProfile(userID);
			}
		
		});
	};
	
	var scrapeUserProfile = function(userID) {
		
		var request = {
				url: "http://endoftheinter.net/profile.php?user=" + userID,				
				ignoreCache: true
		};
		
		console.log("User Profile = " + request.url);

		ajax(request, function(response) {
			var html = document.createElement('html');
			html.innerHTML = response;
			var adminArray = [];
			var modArray = [];
			var tagArray = [];
			var tds = html.getElementsByTagName("td");
			for (var i = 0; i < tds.length; i++) {
				var td = tds[i];
				if (td.innerText.indexOf("Administrator of") > -1) {
					var adminTags = tds[i + 1].getElementsByTagName('a');
				}
				if (td.innerText.indexOf("Moderator of") > -1) {
					var modTags = tds[i + 1].getElementsByTagName('a');
				}
			}
			if (adminTags) {
				adminArray = Array.prototype.slice.call(adminTags);
			}
			if (modTags) {
				modArray = Array.prototype.slice.call(modTags);
			}
			// Concats two empty arrays if no tags are scraped from profile
			tagArray = adminArray.concat(modArray);
			for (var i = 0, len = tagArray.length; i < len; i++) {
				var tag = tagArray[i].innerText;
				tagArray[i] = tag;
			}
			console.log(tagArray);
			CHROMELL.config.tag_admin = tagArray;
			localStorage['ChromeLL-Config'] = JSON.stringify(CHROMELL.config);
			console.log("scraped profile for tag information");
			
		});
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
		
	getDefaultConfig(init);	
	
})();
