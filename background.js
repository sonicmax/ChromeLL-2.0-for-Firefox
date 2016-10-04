var background = {
	config: {},
	board: [],
	boards: {},
	drama: {},
	tabPorts: {},
	ignoratorInfo: {},
	scopeInfo: {},
	imagemapCache: {},
	// currentTab: '',
	noIgnores: true,
	
	init: function(defaultConfig) {
		this.updateConfig(defaultConfig);
		if (this.config.history_menubar_classic) {
			this.boards['Misc.'] = {"ChromeLL Options":"%extension%options.html"};
			if (this.config.sort_history) {				
				this.boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php?b';
			} else {
				this.boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php';
			}
		}
		if (this.config.saved_tags) {
			this.boards['Tags'] = this.config.saved_tags;
		}
		if (this.config.context_menu) {
			this.buildContextMenu();
		}
		for (var i in allBg.activeListeners) {
			// sets listeners for force_https, batch_uploader, etc
			allBg.activeListeners[i] = this.config[i];
			console.log('setting listener: ' + i + " " + allBg.activeListeners[i]);
		}	
		allBg.init_listener(this.config);	
		this.addListeners();
		this.checkVersion();
		this.omniboxSearch();
		this.clipboardHandler();	
		this.getUserID();
		this.getDrama();
	},
	
	getDefaultConfig: function(callback) {
		var defaultURL = chrome.extension.getURL('/src/json/defaultconfig.json');
		var xhr = new XMLHttpRequest();
		xhr.open("GET", defaultURL, true);
		xhr.onload = function() {
			if (this.status == 200) {
				callback(JSON.parse(this.responseText));
			}
		};
		xhr.send();
	},
	updateConfig: function(defaultConfig) {
		if (localStorage['ChromeLL-Config'] === undefined) {
			localStorage['ChromeLL-Config'] = JSON.stringify(defaultConfig);
			background.config = defaultConfig;
		}
		
		else {
			background.config = JSON.parse(localStorage['ChromeLL-Config']);
			
			for (var i in defaultConfig) {
				// if this variable does not exist, set it to the default
				if (background.config[i] === undefined) {
					background.config[i] = defaultConfig[i];
					if (background.config.debug) {
						console.log("upgrade diff!", i, background.config[i]);
					}
				}
			}		
		}		
		
		if (localStorage['ChromeLL-TCs'] == undefined) {
			localStorage['ChromeLL-TCs'] = "{}";
		}
		
		// beta versions stored TC cache in the global config. Delete if found
		if (background.config.tcs) {
			delete background.config.tcs;
		}				
		
		if (this.config.image_cache_version === 1) {
			// Move image cache from chrome.storage API to indexedDB.
			database.open(database.convertCache);
			
			// Save the config, in case it was updated.
			console.log('old version:', background.config.image_cache_version);
			background.config.image_cache_version = 2;
			localStorage['ChromeLL-Config'] = JSON.stringify(background.config);
			console.log('new version:', JSON.parse(localStorage['ChromeLL-Config']).image_cache_version);			
		}
		
		else {		
			// save the config, in case it was updated
			localStorage['ChromeLL-Config'] = JSON.stringify(background.config);
		}
	},
	checkVersion: function() {
		var app = chrome.app.getDetails();
		// notify user if chromeLL has been updated
		if (localStorage['ChromeLL-Version'] != app.version 
				&& localStorage['ChromeLL-Version'] != undefined 
				&& this.config.sys_notifications) {
					
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
						chrome.notifications.clear(ID, null);
					}, 5000);
				}
			);
			
			localStorage['ChromeLL-Version'] = app.version;
		}

		if (localStorage['ChromeLL-Version'] == undefined) {
			localStorage['ChromeLL-Version'] = app.version;
		}
	},
	checkSync: function() {
		chrome.storage.sync.get('config', function(syncData) {
			if (syncData.config && syncData.config.last_saved > background.config.last_saved) {
				// synced config file is more recent than version on computer
				for (var keyName in syncData.config) {					
					background.config[keyName] = syncData.config[keyName];					
				}
				localStorage['ChromeLL-Config'] = JSON.stringify(background.config);
				var bSplit = [];
				for (var k in split) {
					if (background.config[split[k]]) {
						bSplit.push(k);
					}
				}
				chrome.storage.sync.get(bSplit, function(syncConfig) {
					for (var l in syncConfig) {
						background.config[l] = syncConfig[l];
					}
					localStorage['ChromeLL-Config'] = JSON.stringify(background.config);
				});
			}
			
			else if (!syncData.config || syncData.config.last_saved < background.config.last_saved) {
				var localConfig = JSON.parse(localStorage['ChromeLL-Config']);
				var toSet = {};
				for (var i in split) {
					if (background.config[split[i]]) {
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
	},
	clipboardHandler: function() {
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
	},
	buildContextMenu: function() {
		// imageTransloader function is located in transloader.js
		chrome.contextMenus.create({
			"title": "Transload image",
			"onclick": function(info) {
				imageTransloader(info);
			},
			"contexts": ["image"]
		});
		if (this.config.enable_image_rename) {
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
			"onclick": this.contextMenu.searchLUE,
			"contexts": ["selection"]
		});
		if (this.config.copy_in_context) {
			chrome.contextMenus.create({
				"title": "Copy img code",
				"onclick": this.contextMenu.imageCopy,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
				"contexts": ["image"]
			});
		}		
		if (!this.config.simple_context_menu) {
			chrome.contextMenus.create({
				"title": "View image map",
				"onclick": this.contextMenu.imageMap,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
				"contexts": ["image"]
			});
			for (var i in this.boards) {
				if (this.boards[i] != this.boards[0]) {
					chrome.contextMenus.create({
						"type": "separator",
						"contexts": ["page", "image"]
					});
				}
				for (var j in this.boards[i]) {
					var id = chrome.contextMenus.create({
						"title": j,
						"onclick": this.contextMenu.handleContext,
						"contexts": ["page", "image"]
					});					
					this.board[id] = this.boards[i][j];
				}
			}
		}
	},
	contextMenu: {
		imageMap: function(info) {
			var str = info.srcUrl;
			var tokens = str.split('/').slice(-2);
			var imageURL = tokens.join('/');
			var imageMap = "http://images.endoftheinter.net/imap/" + imageURL;
			if (background.config.imagemap_new_tab) {
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
		handleContext: function(info) {
			var url = background.board[info.menuItemId];			
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
	},
	getDrama: function(callback) {
		if (background.config.debug) {
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
				background.drama.txt = dramas;
				background.drama.time = parseInt(new Date().getTime() + (1800 * 1000));
				if (callback) {
					callback(background.drama);
				}
			}
			if (xhr.readyState == 4 && xhr.status == 404) {
				// 404 error occurs if user has logged into ETI using multiple IP addresses
				background.drama.txt = '<a id="retry" href="#">Error loading Dramalinks. Click to retry...</a>';
			}
		}
	},
	addListeners: function() {
		chrome.tabs.onActivated.addListener(function(tab) {
			if (!background.tabPorts[tab.tabId]) {
				return;
			}
			else {
				background.tabPorts[tab.tabId].postMessage({
					action: 'ignorator_update'
				});
			}
		});
		
		chrome.tabs.onRemoved.addListener(function(tab) {
			if (background.tabPorts[tab]) {				
				delete background.tabPorts[tab];
				delete background.ignoratorInfo[tab];
				delete background.scopeInfo[tab];
			}
		});
		
		chrome.runtime.onConnect.addListener(function(port) {
			background.tabPorts[port.sender.tab.id] = {};
			background.tabPorts[port.sender.tab.id] = port;
			background.tabPorts[port.sender.tab.id].onMessage.addListener(function(msg) {
				background.handle.ignoratorUpdate.call(background, port.sender.tab.id, msg);
			});
		});
		
		chrome.runtime.onMessage.addListener(
			function(request, sender, sendResponse) {
				
				switch(request.need) {
					
					case "xhr":		
						ajax(request, sendResponse);
						// Return true so that we can use sendResponse asynchronously 
						// (See: https://developer.chrome.com/extensions/runtime#event-onMessage)
						return true;
					
					case "config":
						// page script needs extension config.
						background.cfg = JSON.parse(localStorage['ChromeLL-Config']);
						if (request.sub) {
							sendResponse({"data": background.cfg[request.sub]});
						} else if (request.tcs) {
							var tcs = JSON.parse(localStorage['ChromeLL-TCs']);
							sendResponse({"data": background.cfg, "tcs": tcs});
						} else {
							sendResponse({"data": background.cfg});
						}
						break;
						
					case "save":
						// page script needs config save.
						if (request.name === "tcs") {
							localStorage['ChromeLL-TCs'] = JSON.stringify(request.data);
						} else {
							background.cfg[request.name] = request.data;
							background.cfg.last_saved = new Date().getTime();
							localStorage['ChromeLL-Config'] = JSON.stringify(background.cfg);
						}
						if (background.cfg.debug) {
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
							if (!background.cfg.clear_notify) {
								this.cfg.clear_notify = "5";
							}
							if (background.cfg.clear_notify === "0") {
								return;
							}
							setTimeout(function() {
								chrome.notifications.clear(ID, null);
							}, parseInt(background.cfg.clear_notify, 10) * 1000);
						});
						break;	
						
					case "dramalinks":
						var time = parseInt(new Date().getTime());
						if (background.drama.time && (time < background.drama.time)){
							if (background.cfg.debug) {
								console.log('returning cached dramalinks. cache exp: ' + background.drama.time + ' current: ' + time);
							}
							sendResponse({"data": background.drama.txt});
						} else {
							sendResponse({"data": background.drama.txt});
							background.getDrama();
						}
						break;
						
					case "insertcss":
						if (background.cfg.debug) {
							console.log('inserting css ', request.file);
						}
						chrome.tabs.insertCSS(sender.tab.id, {file: request.file});
						break;
						
					case "opentab":
						if (background.cfg.debug) {
							console.log('opening tab ', request.url);
						}
						chrome.tabs.create({url: request.url});
						break;
						
					case "noIgnores":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								sendResponse({"noignores": background.noIgnores});										
						});
						return true;
						
					case "getIgnored":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								sendResponse({
										"ignorator": background.ignoratorInfo[tabs[0].id], 
										"scope": background.scopeInfo[tabs[0].id]}
								);
						});		
						return true;
						
					case "showIgnorated":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								background.tabPorts[tabs[0].id].postMessage({action: 'showIgnorated', ids: request.ids});									
						});		
						if (background.cfg.debug) {
							console.log('showing hidden data', request);
						}
						return true;
						
					case "options":
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
								// check whether bg script can send messages to current tab
								if (background.tabPorts[tabs[0].id] && !background.cfg.options_window) {
									// Open options page in iframe
									chrome.tabs.sendMessage(tabs[0].id, {
										action: "showOptions"
									}, null);
								}
								
								else {
									// Create new tab
									chrome.runtime.openOptionsPage();						
								}
								
						});
						break;
						
					case "openDatabase":
						database.open(sendResponse);					
						return true;
						
					case "convertCacheToDb":
						database.convertCache(sendResponse);					
						return true;
						
					case "queryDb":
						database.query(request.src, sendResponse);
						return true;
						
					case "clearDatabase":
						database.clear(sendResponse);
						return true;
						
					case "updateDatabase":
						database.update(request.data, sendResponse);
						return true;
						
					case "searchDatabase":
						database.search(request.query, sendResponse);
						return true;
						
					case "getAllFromDb":
						database.getAll(sendResponse);
						return true;
						
					case "getDbSize":
						database.getSize(sendResponse);
						return true;
					
					case "getSizeInBytes":
						database.getSizeInBytes(sendResponse);
						return true;						
						
					default:
						if (background.cfg.debug) {
							console.log("Error in request listener - undefined parameter?", request);
						}
						break;
				}
			}
		);
	},
	handle: {
		ignoratorUpdate: function(tab, msg) {
			switch (msg.action) {
				case "ignorator_update":
					this.ignoratorInfo[tab] = msg.ignorator;
					this.scopeInfo[tab] = msg.scope;
					if (msg.ignorator.total_ignored > 0) {
						chrome.browserAction.setBadgeBackgroundColor({
							tabId: tab,
							color: "#ff0000"
						});
						chrome.browserAction.setBadgeText({
							tabId: tab,
							text: "" + msg.ignorator.total_ignored
						});							
						this.noIgnores = false;
					} else if (msg.ignorator.total_ignored == 0) {
						this.noIgnores = true;
					}
					break;
				default:
					console.log('no', msg);
					break;
			}
		}
	},	
	getUserID: function() {
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
					background.scrapeUserProfile(userID);
				}
			}
		}
		xhr.send();
	},
	scrapeUserProfile: function(userID) {
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
	},
	omniboxSearch: function() {
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
	}
};

background.getDefaultConfig(function(config) {
	background.init.call(background, config);
});

var database = (function() {
	const DB_NAME = 'ChromeLL-Imagemap';
	const DB_VERSION = 1;
	const IMAGE_DB = 'images';
	const READ_WRITE = 'readwrite';
	var debouncerId;
	var db;	
	
	var getStorageApiCache = function(callback) {
		chrome.storage.local.get("imagemap", function(cache) {
			console.log(cache);
			if (typeof cache !== "object" && Object.keys(cache.imagemap).length === 0) {
				callback();
			}
			
			else {
				callback(cache.imagemap);
			}				
		});
	};		
	
	return {
		open: function(callback) {
			var request = window.indexedDB.open(DB_NAME, DB_VERSION);
			
			request.onsuccess = function(event) {
				db = event.target.result;
				callback();
			};
			
			request.onupgradeneeded = function(event) {
				var db = event.target.result;
				
				// Use src for keyPath
				var objectStore = db.createObjectStore(IMAGE_DB, { keyPath: "src" });

				// Create an index to search by filename.
				objectStore.createIndex("filename", "filename", { unique: false, multiEntry: true });	
			};						
		},
		
		clear: function(callback) {
		
			this.open(() => {
				
				var request = db.transaction(IMAGE_DB, READ_WRITE).objectStore(IMAGE_DB).clear();
				callback();
				
			});
			
		},
		
		/**
		 *	Adds objects from chrome.storage cache to current database.
		 */
		convertCache: function(callback) {
			
			getStorageApiCache(function(imagemap) {
				console.log(imagemap);
				if (imagemap && Object.keys(imagemap).length > 0) {
					var imageObjectStore = db.transaction(IMAGE_DB, READ_WRITE).objectStore(IMAGE_DB);	
					
					for (var src in imagemap) {
						var record = imagemap[src];
						
						// We need to manually add src property to object before adding to database
						record.src = src;
						imageObjectStore.add(record);
					}
																
					// At this point we can safely clear chrome.storage
					chrome.storage.local.clear();						
				}
				
			});
		},	
		
		query: function(src, callback) {
			var request = db.transaction(IMAGE_DB)
					.objectStore(IMAGE_DB)
					.get(src);		
						
			request.onsuccess = function(event) {
				if (event.target.result) {
					callback(event.target.result);
				}
				else {				
					callback(false);
				}
			};
			
			request.onerror = function(event) {
				// Couldn't find src in database.
				callback(false);
			};
		},
		
		update: function(cacheData) {
			var transaction = db.transaction([IMAGE_DB], READ_WRITE);

			transaction.onerror = function(event) {
				// Can't use add() method if src already exists in databse. 
				console.log(event.target.error.message);
			};

			var objectStore = transaction.objectStore(IMAGE_DB);
			
			for (var src in cacheData) {
				var request = objectStore.add(cacheData[src]);
			}
		},
		
		search: function(query, callback) {
			var results = [];
			var transaction = db.transaction(IMAGE_DB);
			var objectStore = transaction.objectStore(IMAGE_DB);							
			
			// TODO: Maybe we should open cursor after checking whether index returns any exact matches		
			var request = objectStore.openCursor();
			
			request.onsuccess = function(event) {
					var cursor = event.target.result;
					
					if (cursor) {							
							if (cursor.key.indexOf(query) !== -1) {
									results.push(cursor.value);
							}

							cursor.continue();          
					}
					
					else {
						// TODO: We should probably return results as we find them
						// Reached end of db
						callback(results, query);
					}
			};
		},
		
		getAll: function(callback) {
			var objectStore = db.transaction(IMAGE_DB).objectStore(IMAGE_DB);
			// Note: getAll() method isn't part of IndexedDB standard and may disappear in future.
			if (objectStore.getAll != null) {
				var request = objectStore.getAll();
				
				request.onsuccess = function(event) {
					// TODO: Need to test what happens if database exists but is empty
					callback(event.target.result);
				};
				
				request.onerror = function(event) {
					callback(false);
				};
			}
			
			else {				
				var cache = [];
				objectStore.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;
					if (cursor) {
						cache.push(cursor.value);
						cursor.continue();
					}
					else {
						callback(cache);
					}
				};								
			}
		},
		
		getSize: function(callback) {
			var objectStore = db.transaction(IMAGE_DB).objectStore(IMAGE_DB);
			var size = 0;
			// TODO: Maybe it would be faster to use a key cursor here
			objectStore.openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {					
					size++;
					cursor.continue();
				}
				else {
					callback(cache);
				}
			};			
		},
		
		getSizeInBytes: function(callback) {
			var size = 0;

			var transaction = db.transaction([IMAGE_DB])
					.objectStore(IMAGE_DB)
					.openCursor();

			transaction.onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					var storedObject = cursor.value;
					var json = JSON.stringify(storedObject);
					size += json.length;
					cursor.continue();
				}
				else {
					callback(size);
				}
			};
			
			transaction.onerror = function(err) {
				callback(-1048576);
			};
		},
		
		db: db
	
	};
	
})();

var ajaxCache = {};

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
