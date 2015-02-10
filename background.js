var background = {
	cfg: {},
	board: [],
	drama: {},
	tabPorts: {},
	ignoratorInfo: {},
	scopeInfo: {},
	imagemapCache: {},
	// currentTab: '',
	noIgnores: true,
	init: function() {
		var that = this;
		this.getDefaultConfig(function(defaultConfig) {
			// populate local storage with default config values on fresh install,
			// or check for new values & upgrade existing config
			that.upgradeConfig(defaultConfig);	
			if (that.cfg.history_menubar_classic) {
				if (that.cfg.sort_history) {
					boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php?b';
				} else {
					boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php';
				}
			}
			if (that.cfg.saved_tags) {
				boards['Tags'] = that.cfg.saved_tags;
			}
			if (that.cfg.context_menu) {
				that.buildContextMenu();
			}
			for (var i in allBg.activeListeners) {
				// sets listeners for force_https, batch_uploader, etc
				allBg.activeListeners[i] = that.cfg[i];
				console.log('setting listener: ' + i + " " + allBg.activeListeners[i]);
			}	
			allBg.init_listener(that.cfg);	
			that.addListeners();
			that.checkVersion();
			that.omniboxSearch();
			that.clipboardHandler();	
			that.getUserID();
			that.getDrama();
		});
	},
	getDefaultConfig: function(callback) {
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
	},
	upgradeConfig: function(defaultConfig) {
		if (localStorage['ChromeLL-Config'] == undefined) {
			localStorage['ChromeLL-Config'] = defaultConfig;
			background.cfg = defaultConfig;
		}
		if (localStorage['ChromeLL-TCs'] == undefined) {
			localStorage['ChromeLL-TCs'] = "{}";
		}
		var configJS = JSON.parse(defaultConfig);
		background.cfg = JSON.parse(localStorage['ChromeLL-Config']);
		for (var i in configJS) {
			// if this variable does not exist, set it to the default
			if (background.cfg[i] === undefined) {
				background.cfg[i] = configJS[i];
				if (background.cfg.debug) {
					console.log("upgrade diff!", i, background.cfg[i]);
				}
			}
		}
		// beta versions stored TC cache in the global config. Delete if found
		if (background.cfg.tcs) {
			delete background.cfg.tcs;
		}
		// save the config, just in case it was updated
		localStorage['ChromeLL-Config'] = JSON.stringify(background.cfg);
	},
	checkVersion: function() {
		var app = chrome.app.getDetails();
		// notify user if chromeLL has been updated
		if (localStorage['ChromeLL-Version'] != app.version 
				&& localStorage['ChromeLL-Version'] != undefined 
				&& this.cfg.sys_notifications) {
			console.log('ChromeLL updated! Old v: ' + localStorage['ChromeLL-Version'] 
					+ " New v: " + app.version);
			chrome.notifications.create(
				'popup', {
					type: "basic",
					title: "ChromeLL has been updated",
					message: "Old v: " + localStorage['ChromeLL-Version'] 
							+ " New v: " + app.version,
					buttons: [{
						title: "Click for more info",
					}],
					iconUrl: "src/images/lueshi_48.png"
				},
				function(id) {
					chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
						if (notifId === id) {
							if (btnIdx === 0) {
								window.open("http://boards.endoftheinter.net/showmessages.php?topic=8887077");
							}
						}
					});
					setTimeout(function() {
						background.clearNotification(id);
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
		setTimeout(chkSync, 90 * 1000);
		this.cfg = JSON.parse(localStorage['ChromeLL-Config']);
		if (!cfg.sync_cfg) {
			return;
		}
		// "split" these config keys from the default config save, 2048 byte limit per item
		// split object moved to allBg.js so it can be accessed from the options page
		chrome.storage.local.get('cfg', function(data) {
			if (data.cfg && data.cfg.last_saved > cfg.last_saved) {
				if (background.cfg.debug) {
					console.log('copy sync to local - local: ', background.cfg.last_saved, 'sync: ', data.cfg.last_saved);
				}
				for (var j in data.cfg) {
					background.cfg[j] = data.cfg[j];
				}
				localStorage['ChromeLL-Config'] = JSON.stringify(background.cfg);
				var bSplit = [];
				for (var k in split) {
					if (background.cfg[split[k]]) {
						bSplit.push(k);
					}
				}
				chrome.storage.local.get(bSplit, function(r) {
					for (var l in r) {
						if (background.cfg.debug) {
							console.log('setting local', l, r[l]);
						}
						background.cfg[l] = r[l];
					}
					localStorage['ChromeLL-Config'] = JSON.stringify(background.cfg);
				});
			} else if (!data.cfg || data.cfg.last_saved < background.cfg.last_saved) {
				if (background.cfg.debug) {
					console.log('copy local to sync - local: ', background.cfg.last_saved, 'sync: ');
				}
				var xCfg = JSON.parse(localStorage['ChromeLL-Config']);
				var toSet = {}
				for (var i in split) {
					if (background.cfg[split[i]]) {
						toSet[i] = xCfg[i];
					}
					delete xCfg[i];
				}
				toSet.cfg = xCfg;
				if (background.cfg.debug) {
					console.log('setting sync objects', toSet);
				}
				chrome.storage.local.set(toSet);
				for (var i in toSet) {
					var f = function(v) {
						chrome.storage.local.getBytesInUse(v, function(use) {
							console.log('%s using %d bytes', v, use);
							if (use > 2048) {
								var sp = Math.ceil(use / 2048);
								console.log('%s is too big, splitting into %d parts', v, sp);
								var c = 0;
								for (var j in toSet[v]) {
									if (!toSet[v + (c % sp)]) {
										toSet[v + (c % sp)] = {};
									}
									toSet[v + (c % sp)][j] = toSet[v][j];
									c++;
								}
								delete toSet[v];
								console.log(toSet);
							}
						});
					}
					f(i);
				}
			} else {
				if (background.cfg.debug) {
					console.log('skipping sync actions - local: ', background.cfg.last_saved, 'sync: ', data.cfg.last_saved);
				}
			}
		});
	},
	clipboardHandler: function() {
		var backgroundPage = chrome.extension.getBackgroundPage();
		var textArea = backgroundPage.document.createElement("textarea");
		var quote, clipboard;
		textArea.id = "clipboard";
		backgroundPage.document.body.appendChild(textArea);
		chrome.runtime.onMessage.addListener(
			// allows text content to be copied to clipboard from content scripts
			function(request, sender, sendResponse) {
				if (request.quote) {
					quote = request.quote;
					clipboard = document.getElementById('clipboard');
					clipboard.value = quote;
					clipboard.select();
					document.execCommand("copy");
					sendResponse({
						clipboard: "copied to clipboard"
					});
				}
			}
		);	
	},
	buildContextMenu: function() {
		this.board = null;
		this.board = [];
		var id;
		// imageTransloader is located in transloader.js
		chrome.contextMenus.create({
			"title": "Transload image",
			"onclick": imageTransloader,
			"contexts": ["image"]
		});
		chrome.contextMenus.create({
			"title": "Search LUE",
			"onclick": this.contextMenu.searchLUE,
			"contexts": ["selection"]
		});
		if (this.cfg.eti_bash) {
			chrome.contextMenus.create({
				"title": "Submit to ETI Bash",
				"onclick": this.contextMenu.bashHighlight,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*"],
				"contexts": ["selection"]
			});
		}
		if (!this.cfg.simple_context_menu) {
			chrome.contextMenus.create({
				"title": "View image map",
				"onclick": this.contextMenu.imageMap,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
				"contexts": ["image"]
			});
			if (this.cfg.copy_in_context) {
				chrome.contextMenus.create({
					"title": "Copy img code",
					"onclick": this.contextMenu.imageCopy,
					"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
					"contexts": ["image"]
				});
			}
			for (var i in boards) {
				if (boards[i] != boards[0]) {
					chrome.contextMenus.create({
						"type": "separator",
						"contexts": ["page", "image"]
					});
				}
				for (var j in boards[i]) {
					id = chrome.contextMenus.create({
						"title": j,
						"onclick": this.contextMenu.handleContext,
						"contexts": ["page", "image"]
					});
					this.board[id] = boards[i][j];
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
			if (background.cfg.imagemap_new_tab) {
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
			console.log(info, board[info.menuItemId]);
			if (!board[info.menuItemId].match('%extension%')) {
				chrome.tabs.create({
					"url": "http://boards.endoftheinter.net/topics/" + board[info.menuItemId]
				});
			} else {
				var url = board[info.menuItemId].replace("%extension%", chrome.extension.getURL("/"));
				chrome.tabs.create({
					"url": url
				});
			}
		}
	},
	getDrama: function() {
		if (background.cfg.debug) {
			console.log('fetching dramalinks from wiki...');
		}
		// use base64 string (eww...) instead of external URL to avoid insecure content warnings for HTTPS users
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
				
				// TODO - decide whether to keep the 'update in all tabs' behaviour
				// or whether to scrap this entirely
				
				/*chrome.tabs.query({url: '*://*.endoftheinter.net/*'}, function(tabs) {
					var tab;
					for (var i = 0, len = tabs.length; i < len; i++) {
						tab = tabs[i];
						chrome.tabs.sendMessage(tab.id, {
							action: "update_drama"
						}, function(response) {
							// empty callback
						});
					}
				});*/
			}
			if (xhr.readyState == 4 && xhr.status == 404) {
				// 404 error usally occurs if user has logged into ETI using multiple IP addresses
				// (as wiki uses IP address as part of authentication)
				background.drama.txt = '<a id="retry" href="##retry">Error loading Dramalinks. Click to retry...</a>';
			}
		}
	},
	addListeners: function() {
		chrome.tabs.onActivated.addListener(function(tab) {
			if (!background.tabPorts[tab.tabId]) {
				// tab is not being tracked by ChromeLL
				return;
			}			
			// background.currentTab = tab.tabId;
			// update badge with number of ignorated users
			background.tabPorts[tab.tabId].postMessage({
				action: 'ignorator_update'
			});
		});
		chrome.tabs.onRemoved.addListener(function(tab) {
			if (background.tabPorts[tab]) {
				// remove closed tab from background objects
				delete background.tabPorts[tab];
				delete background.ignoratorInfo[tab];
				delete background.scopeInfo[tab];
			}
		});
		chrome.runtime.onConnect.addListener(function(port) {
			// add to tabPorts object and check status of ignorator
			background.tabPorts[port.sender.tab.id] = {};
			background.tabPorts[port.sender.tab.id] = port;
			background.tabPorts[port.sender.tab.id].onMessage.addListener(function(msg) {
				background.handleIgnoratorMsg(port.sender.tab.id, msg);
			});
		});
		chrome.runtime.onMessage.addListener(
			function(request, sender, sendResponse) {
				switch(request.need) {
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
								background.clearNotification(id);
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
						sendResponse({
							// no response needed
						});
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
						if (background.cfg.debug) {
							console.log("Error in request listener - undefined parameter?", request);
						}
						break;
				}
			}
		);
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
				} else {
					var user = html.getElementsByClassName('userbar')[0]
						.getElementsByTagName('a')[0].href
						.match(/\?user=([0-9]+)/)[1];
					config.user_id = user;
					localStorage['ChromeLL-Config'] = JSON.stringify(config);
					background.scrapeUserProfile(user);
				}
			}
		}
		xhr.send();
	},
	scrapeUserProfile: function(user) {
		var config = JSON.parse(localStorage['ChromeLL-Config']);
		var url = "http://endoftheinter.net/profile.php?user=" + user;
		var xhr = new XMLHttpRequest();
		console.log("User Profile = " + url);
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var tds, td, adminTags, modTags, isAdmin, isMod, tag;
				var html = document.createElement('html');
				html.innerHTML = xhr.responseText;
				var adminArray = [];
				var modArray = [];
				var tagArray = [];
				tds = html.getElementsByTagName("td");
				for (var i = 0; i < tds.length; i++) {
					td = tds[i];
					if (td.innerText.indexOf("Administrator of") > -1) {
						adminTags = tds[i + 1].getElementsByTagName('a');
						isAdmin = true;
					}
					if (td.innerText.indexOf("Moderator of") > -1) {
						modTags = tds[i + 1].getElementsByTagName('a');
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
					tag = tagArray[i].innerText;
					tagArray[i] = tag;
				}
				console.log(tagArray);
				delete config.tag_admin;
				config.tag_admin = tagArray;
				localStorage['ChromeLL-Config'] = JSON.stringify(config);
				console.log("scraped profile for tag information");
			}
		}
		xhr.send();
	},
	clearNotification: function(ID) {
		chrome.notifications.clear(ID,
			function() {
				// empty callback
			}
		);
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
	},
	handleIgnoratorMsg: function(tab, msg) {
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
};

background.init();
