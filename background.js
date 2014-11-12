var text;
var board = [];
var cfg, currentTab;
var drama = {};
var tabPorts = {};
var ignoratorInfo = {};
var noIgnores;
var scopeInfo = {};

function init() {
	// get default config, save to local storage
	var defaultURL = chrome.extension.getURL('/src/json/defaultconfig.json');
	var temp, defaultConfig;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", defaultURL, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			temp = JSON.parse(xhr.responseText);
			defaultConfig = JSON.stringify(temp);
			if (localStorage['ChromeLL-Config'] === undefined) {
				localStorage['ChromeLL-Config'] = defaultConfig;
				cfg = defaultConfig;
			}
			if (localStorage['ChromeLL-TCs'] == undefined) {
				localStorage['ChromeLL-TCs'] = "{}";
			}			
			upgradeConfig(defaultConfig);
		}
	}
	xhr.send();	
}

function upgradeConfig(defaultConfig) {
	var configJS = JSON.parse(defaultConfig);
	cfg = JSON.parse(localStorage['ChromeLL-Config']);
	for (var i in configJS) {
		// if this variable does not exist, set it to the default
		if (cfg[i] === undefined) {
			cfg[i] = configJS[i];
			if (cfg.debug) {
				console.log("upgrade diff!", i, cfg[i]);
			}
		}
	}
	// beta versions stored TC cache in the global config. Delete if found
	if (cfg.tcs) {
		delete cfg.tcs;
	}
	// save the config, just in case it was updated
	localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
	// continue running background script functions
	handleCfg();
	checkVersion();
	clipboardTextArea();	
	getUserID();
}

function handleCfg() {
	if (cfg.history_menubar_classic) {
		if (cfg.sort_history) {
			boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php?b';
		} else {
			boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php';
		}
	}
	if (cfg.saved_tags) {
		boards['Tags'] = cfg.saved_tags;
	}
	if (cfg.context_menu) {
		buildContextMenu();
	}
	for (var i in allBg.activeListeners) {
		// sets listeners for force_https, batch_uploader, etc
		allBg.activeListeners[i] = cfg[i];
		console.log('setting listener: ' + i + " " + allBg.activeListeners[i]);
	}
	allBg.init_listener(cfg);
}

function checkVersion() {
	var app = chrome.app.getDetails();
	// notify user if chromeLL has been updated
	if (localStorage['ChromeLL-Version'] != app.version 
			&& localStorage['ChromeLL-Version'] != undefined 
			&& cfg.sys_notifications) {
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
					clearNotification(id);
				}, 5000);
			}
		);
		localStorage['ChromeLL-Version'] = app.version;
	}

	if (localStorage['ChromeLL-Version'] == undefined) {
		localStorage['ChromeLL-Version'] = app.version;
	}
}

function chkSync() {
	setTimeout(chkSync, 90 * 1000);
	cfg = JSON.parse(localStorage['ChromeLL-Config']);
	if (!cfg.sync_cfg) {
		return;
	}
	// "split" these config keys from the default config save, 2048 byte limit per item
	// split object moved to allBg.js so it can be accessed from the options page
	chrome.storage.local.get('cfg', function(data) {
		if (data.cfg && data.cfg.last_saved > cfg.last_saved) {
			if (cfg.debug) {
				console.log('copy sync to local - local: ', cfg.last_saved, 'sync: ', data.cfg.last_saved);
			}
			for (var j in data.cfg) {
				cfg[j] = data.cfg[j];
			}
			localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
			var bSplit = [];
			for (var k in split) {
				if (cfg[split[k]]) {
					bSplit.push(k);
				}
			}
			chrome.storage.local.get(bSplit, function(r) {
				for (var l in r) {
					if (cfg.debug) {
						console.log('setting local', l, r[l]);
					}
					cfg[l] = r[l];
				}
				localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
			});
		} else if (!data.cfg || data.cfg.last_saved < cfg.last_saved) {
			if (cfg.debug) {
				console.log('copy local to sync - local: ', cfg.last_saved, 'sync: ');
			}
			var xCfg = JSON.parse(localStorage['ChromeLL-Config']);
			var toSet = {}
			for (var i in split) {
				if (cfg[split[i]]) {
					toSet[i] = xCfg[i];
				}
				delete xCfg[i];
			}
			toSet.cfg = xCfg;
			if (cfg.debug) {
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
			if (cfg.debug) {
				console.log('skipping sync actions - local: ', cfg.last_saved, 'sync: ', data.cfg.last_saved);
			}
		}
	});
}

function clipboardTextArea() {
	var background = chrome.extension.getBackgroundPage();
	var textArea = background.document.createElement("textarea");
	var quote, clipboard;
	textArea.id = "clipboard";
	background.document.body.appendChild(textArea);
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
}

function buildContextMenu() {
	board = null;
	board = [];
	var id;
	chrome.contextMenus.create({
		"title": "Transload image",
		"onclick": imageTransloader,
		"contexts": ["image"]
	});
	chrome.contextMenus.create({
		"title": "Search LUE",
		"onclick": searchLUE,
		"contexts": ["selection"]
	});
	if (cfg.eti_bash) {
		chrome.contextMenus.create({
			"title": "Submit to ETI Bash",
			"onclick": bashHighlight,
			"documentUrlPatterns": ["*://boards.endoftheinter.net/*"],
			"contexts": ["selection"]
		});
	}
	if (!cfg.simple_context_menu) {
		chrome.contextMenus.create({
			"title": "View image map",
			"onclick": imageMap,
			"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
			"contexts": ["image"]
		});
		if (cfg.copy_in_context) {
			chrome.contextMenus.create({
				"title": "Copy img code",
				"onclick": imageCopy,
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
					"onclick": handleContext,
					"contexts": ["page", "image"]
				});
				board[id] = boards[i][j];
			}
		}
	}
}

function imageMap(info) {
	var str = info.srcUrl,
	tokens = str.split('/').slice(-2),
	imageURL = tokens.join('/'),
	imageMap = "http://images.endoftheinter.net/imap/" + imageURL;
	if (cfg.imagemap_new_tab) {
		chrome.tabs.create({
				url: imageMap
		});
	} else {
		chrome.tabs.update({
				url: imageMap
		});
	}
}

function imageCopy(info) {
	var imgURL = info.srcUrl.replace("dealtwith.it", "endoftheinter.net")
	imgCode = '<img src="' + imgURL + '"/>';
	clipboard = document.getElementById('clipboard');
	clipboard.value = imgCode;
	clipboard.select();
	document.execCommand("copy");
}


function searchLUE(info) {
	chrome.tabs.create({
			url: "http://boards.endoftheinter.net/topics/LUE?q=" + info.selectionText
	});
}

function bashHighlight(info) {
	var selection_text = info.selectionText;
	var bash_data, formData, xhr;
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {
			action: "get_bash"
		}, function(response) {
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
				console.log('bash_data array contains null value', bash_data);
			}
		});
	});
}

function handleContext(info) {
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

function getDrama() {
	if (cfg.debug) {
		console.log('fetching dramalinks from wiki...');
	}
	var externalpng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAFVBMVEVmmcwzmcyZzP8AZswAZv////////'
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
					"<a href=\"$1\" style=\"padding-left: 0px\"><img src=\"" + externalpng + "\"></a>");
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
			// update dramalinks ticker in all relevant tabs
			chrome.tabs.query({url: '*://*.endoftheinter.net/*'}, function(tabs) {
				var tab;
				for (var i = 0, len = tabs.length; i < len; i++) {
					tab = tabs[i];
					chrome.tabs.sendMessage(tab.id, {
						action: "update_drama"
					}, function(response) {
						// empty callback
					});
				}
			});
		}
		if (xhr.readyState == 4 && xhr.status == 404) {
			// 404 errors usually occur if getDrama runs while user
			// is logged in using a different IP address (work, mobile, etc)
			drama.txt = '<a id="retry" href="javascript:void(0)">Error loading Dramalinks. Click to retry...</a>';
			chrome.tabs.query({url: '*://*.endoftheinter.net/*'}, function(tabs) {
				var tab;
				for (var i = 0, len = tabs.length; i < len; i++) {
					tab = tabs[i];
					chrome.tabs.sendMessage(tab.id, {
						action: "updatedrama"
					}, function(response) {
						// empty callback
					});
				}
			});
		}
	}
}

function handleHttpsRedirect(dest) {
	return {
		redirectUrl: dest.url.replace(/^http:/i, "https:")
	}
}

chrome.tabs.onActivated.addListener(function(tab) {
	if (!tabPorts[tab.tabId]) {
		return;
	}
	currentTab = tab.tabId;
	tabPorts[tab.tabId].postMessage({
		action: 'ignorator_update'
	});
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
		messagePort.handleIgnoratorMsg(port.sender.tab.id, msg);
	});
});

var messagePort = {
	handleIgnoratorMsg: function(tab, msg) {
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
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.need) {
			case "config":
				// page script needs extension config.
				cfg = JSON.parse(localStorage['ChromeLL-Config']);
				if (request.sub) {
					sendResponse({"data": cfg[request.sub]});
				} else if (request.tcs) {
					var tcs = JSON.parse(localStorage['ChromeLL-TCs']);
					sendResponse({"data": cfg, "tcs": tcs});
				} else {
					sendResponse({"data": cfg});
				}
				break;
			case "save":
				// page script needs config save.
				if (request.name === "tcs") {
					localStorage['ChromeLL-TCs'] = JSON.stringify(request.data);
				} else {
					cfg[request.name] = request.data;
					cfg.last_saved = new Date().getTime();
					localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
				}
				if (cfg.debug) {
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
					if (!cfg.clear_notify) {
						cfg.clear_notify = "5";
					}
					if (cfg.clear_notify === "0") {
						return;
					}
					setTimeout(function() {
						clearNotification(id);
					}, parseInt(cfg.clear_notify, 10) * 1000);
				});
				break;	
			case "dramalinks":
				var time = parseInt(new Date().getTime());
				if (drama.time && (time < drama.time)){
					if (cfg.debug) {
						console.log('returning cached dramalinks. cache exp: ' + drama.time + ' current: ' + time);
					}
					sendResponse({"data": drama.txt});
				} else {
					getDrama();
				}
				break;
			case "insertcss":
				if (cfg.debug) {
					console.log('inserting css ', request.file);
				}
				chrome.tabs.insertCSS(sender.tab.id, {file: request.file});
				sendResponse({
					// empty response
				});
				break;
			case "opentab":
				if (cfg.debug) {
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
						sendResponse({"ignorator": ignoratorInfo[tabs[0].id], "scope": scopeInfo[tabs[0].id]});
				});		
				return true;									
			case "showIgnorated":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
						tabPorts[tabs[0].id].postMessage({action: 'showIgnorated', ids: request.ids});									
				});		
				if (cfg.debug) {
					console.log('showing hidden data', request);
				}
				return true;
			case "options":
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
						// check whether bg script can send messages to current tab
						if (tabPorts[tabs[0].id] && !cfg.options_window) {
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
				if (cfg.debug) {
					console.log("Error in request listener - undefined parameter?", request);
				}
				break;
		}
	}
);

function getUserID() {
	var cfg = JSON.parse(localStorage['ChromeLL-Config']);
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
				var me = html.getElementsByClassName('userbar')[0]
					.getElementsByTagName('a')[0].href
					.match(/\?user=([0-9]+)/)[1];
				cfg.user_id = me;
				localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
				scrapeUserProf(me);
			}
		}
	}
	xhr.send();
}

function scrapeUserProf(me) {
	var cfg = JSON.parse(localStorage['ChromeLL-Config']);
	var url = "http://endoftheinter.net/profile.php?user=" + me;
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
			delete cfg.tag_admin;
			cfg.tag_admin = tagArray;
			//localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
			console.log("scraped profile for tag information");
		}
	}
	xhr.send();
}

function clearNotification(id) {
	chrome.notifications.clear(id,
		function() {
			// empty callback
		}
	);
}

function omniboxSearch() {
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

omniboxSearch();

init();