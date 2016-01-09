var options = {
	init: function() {
		console.log('loading config');
		var config = JSON.parse(localStorage['ChromeLL-Config']);
		var checkboxes = $(":checkbox");
		for ( var i in checkboxes) {
			checkboxes[i].checked = config[checkboxes[i].id];
		}
		var textboxes = $(":text");
		for (var i in textboxes) {
			if (textboxes[i].name
					&& (textboxes[i].name.match('(user|keyword|tag)_highlight_') 
							|| textboxes[i].name.match('user_book') 
							|| textboxes[i].name.match('snippet') 
							|| textboxes[i].name.match('rep_ignore') 
							|| textboxes[i].name.match('users') 
							|| textboxes[i].name.match('token') 
							|| textboxes[i].name.match('post_template'))) {
				// console.log('found a textbox to ignore: ' + textboxes[i]);
			} else if (config[textboxes[i].id]) {
				textboxes[i].value = config[textboxes[i].id];
			}
		}
		for ( var j in config.user_highlight_data) {
			document.getElementsByClassName('user_name')[document
					.getElementsByClassName('user_name').length - 1].value = j;
			document.getElementsByClassName('header_bg')[document
					.getElementsByClassName('header_bg').length - 1].value = config.user_highlight_data[j].bg;
			document.getElementsByClassName('header_color')[document
					.getElementsByClassName('header_color').length - 1].value = config.user_highlight_data[j].color;
			options.ui.addDiv.userHighlight();
		}
		for ( var j in config.bookmark_data) {
			document.getElementsByClassName('bookmark_name')[document
					.getElementsByClassName('bookmark_name').length - 1].value = j;
			document.getElementsByClassName('bookmark_tag')[document
					.getElementsByClassName('bookmark_tag').length - 1].value = config.bookmark_data[j];
			options.ui.addDiv.bookmarkName();
		}
		for ( var j in config.snippet_data) {
			document.getElementsByClassName('snippet_name')[document
					.getElementsByClassName('snippet_name').length - 1].value = j;
			document.getElementsByClassName('snippet')[document
					.getElementsByClassName('snippet').length - 1].value = config.snippet_data[j];
			options.ui.addDiv.snippetName();
		}
		for (var j = 0; config.keyword_highlight_data[j]; j++) {
			document.getElementsByClassName('keyword')[document
					.getElementsByClassName('keyword').length - 1].value = config.keyword_highlight_data[j].match;
			document.getElementsByClassName('keyword_bg')[document
					.getElementsByClassName('keyword_bg').length - 1].value = config.keyword_highlight_data[j].bg;
			document.getElementsByClassName('keyword_color')[document
					.getElementsByClassName('keyword_color').length - 1].value = config.keyword_highlight_data[j].color;
			options.ui.addDiv.keywordHighlight();
		}
		for (var j = 0; config.tag_highlight_data[j]; j++) {
			document.getElementsByClassName('tag')[document
					.getElementsByClassName('tag').length - 1].value = config.tag_highlight_data[j].match;
			document.getElementsByClassName('tag_bg')[document
					.getElementsByClassName('tag_bg').length - 1].value = config.tag_highlight_data[j].bg;
			document.getElementsByClassName('tag_color')[document
					.getElementsByClassName('tag_color').length - 1].value = config.tag_highlight_data[j].color;
			options.ui.addDiv.tagHighlight();
		}
		for ( var j in config.post_template_data) {
			document.getElementsByClassName('template_text')[document
					.getElementsByClassName('template_text').length - 1].value = config.post_template_data[j].text;
			document.getElementsByClassName('template_title')[document
					.getElementsByClassName('template_title').length - 1].value = j;
			options.ui.addDiv.postTemplate();
		}
		document.getElementById('clear_notify').value = config.clear_notify;
		document.addEventListener('keyup', function(evt) {
			if (!evt.target.name)
				return;
			if (evt.target.name == "user_highlight_username") {
				var datas = document.getElementById('user_highlight')
						.getElementsByClassName('user_name');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					options.ui.addDiv.userHighlight();
			}

			if (evt.target.name == "user_book_name") {
				var datas = document.getElementById('bookmarked_tags')
						.getElementsByClassName('bookmark_name');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					options.ui.addDiv.bookmarkName();
			}
			
			if (evt.target.name == "user_snippet") {
				var datas = document.getElementById('snippets')
						.getElementsByClassName('snippet_name');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					options.ui.addDiv.snippetName();
			}

			if (evt.target.name == "post_template_title") {
				var datas = document.getElementById('post_template')
						.getElementsByClassName('template_title');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					options.ui.addDiv.postTemplate();
			}
			if (evt.target.name == "keyword_highlight_keyword") {
				var datas = document.getElementById('keyword_highlight')
						.getElementsByClassName('keyword');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					options.ui.addDiv.keywordHighlight();
			}
			if (evt.target.name == "tag_highlight_keyword") {
				var datas = document.getElementById('tag_highlight')
						.getElementsByClassName('tag');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					options.ui.addDiv.tagHighlight();
			}
		});
		// show version
		var app = chrome.app.getDetails();
		document.getElementById('version').innerText = app.version;
		document.getElementById('downloadcfg').href = options.download();
		// show size on disk of imagemap cache
		chrome.storage.local.getBytesInUse("imagemap", function(bytes) {
			var megabytes = bytes / 1048576;
			// round to 2 decimal places
			document.getElementById('cache_size').innerHTML = Math.round(megabytes * 100) / 100;
		});
		var cssBox = document.getElementById('fun_css_div');
		if (config.user_id == 13547 || config.user_id == 5599) {
			cssBox.style.display = 'block';			
		}		
		if (document.readyState == 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				options.ui.hideUnusedMenus();
				options.ui.setColorPicker();
				options.listeners.menuVisibility();
				options.listeners.click();
				options.listeners.change();
				options.listeners.menuButton();
				options.ui.populateCacheTable();
				// disabled for 2.30 release
				// options.ui.displayUserscripts();
				options.ui.displayLBContent();
				options.save();
			});
		} else {
			options.ui.hideUnusedMenus();
			options.ui.setColorPicker();
			options.listeners.menuVisibility();
			options.listeners.click();
			options.listeners.change();
			options.listeners.menuButton();
			options.ui.populateCacheTable();
			// disabled for 2.30 release			
			// options.ui.displayUserscripts();
			options.ui.displayLBContent();
			options.save();
		}		
	},	
	functions: {
		cleanIgnorator: function() {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			config.ignorator_backup = config.ignorator_list;
			var cleanIgnorator = config.clean_ignorator;
			var list = config.ignorator_list;
			var oldIgnorator = list.split(',');
			var xhr, url, temp, users, newIgnorator, currentTime;
			for (var i = 1; oldIgnorator[i]; i++) {
				oldIgnorator[i] = oldIgnorator[i].trim();
			}
			var json = {
					"userList": [],
					"removeBanned": ""
			}
			json.userList = oldIgnorator;
			json.removeBanned = cleanIgnorator;
			xhr = new XMLHttpRequest();
			url = 'http://eti-stats.herokuapp.com/tools/api/clean_ignorator/';
			xhr.open("POST", url, true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.onreadystatechange = function () {
				if (xhr.status == 503) {
					document.getElementById('ignorateinfo').innerText = "eti-stats is down - try again later";
					return;
				}
				if (xhr.readyState == 4 && xhr.status == 200) {
					temp = JSON.parse(xhr.responseText);
					users = temp.userList;
					newIgnorator = users.toString();
					config.ignorator_list = newIgnorator;
					localStorage['ChromeLL-Config'] = JSON.stringify(config);
					document.getElementById('ignorateinfo').innerText = "ignorator cleaned - reloading page in 3 seconds...";
					setTimeout(function () {
						location.reload();
					}, 3000);
				}
			}
			xhr.send(JSON.stringify(json));
			currentTime = new Date().getTime();
			config.last_clean = currentTime;
			localStorage['ChromeLL-Config'] = JSON.stringify(config);	
		},
		rateLimiter: function() {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			if (config.ignorator_list == "") {
				document.getElementById('ignorateinfo').innerText = "no ignorator list found..."
				return;
			}
			var currentTime = new Date().getTime();
			var timeLeft = currentTime - config.last_clean;
			if (timeLeft > 86400000) {
				document.getElementById('ignorateinfo').innerText = "running ignorator cleaner..."
				options.functions.cleanIgnorator();
			} else {
				var totalseconds = ((86400000 - timeLeft) / 1000);
				var hours = Math.floor(totalseconds / 3600);
				var totalminutes = Math.floor(totalseconds / 60);
				var minutes = totalminutes - (hours * 60);
				var seconds = Math.floor(totalseconds - (totalminutes * 60))
				if (hours === 1) {
					hours = hours + " hour, ";
				} else if (hours !== 1) {
					hours = hours + " hours, ";
				}
				if (minutes === 1) {
					minutes = minutes + " minute, and ";
				} else if (minutes !== 1) {
					minutes = minutes + " minutes, and ";
				}
				if (seconds === 1) {
					seconds = seconds + " second.";
				} else if (seconds !== 1) {
					seconds = seconds + " seconds."
				}	
				document.getElementById('ignorateinfo').innerText = "try again in " + hours + minutes + seconds;
			}
		},
		restoreIgnorator: function() {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var backup = config.ignorator_backup;
			if (confirm('Are you sure you want to restore last ignorator backup?')) {
				if (backup == "") {
					document.getElementById('ignorateinfo').innerHTML = "no backup found...";
					return;
				} else if (backup == config.ignorator_list) {
					document.getElementById('ignorateinfo').innerHTML = "current list and backup are identical...";
					return;
				} else {
					config.ignorator_list = backup;
					localStorage['ChromeLL-Config'] = JSON.stringify(config);
					document.getElementById('ignorateinfo').innerHTML = "backup restored - reloading page in 3 seconds...";
					setTimeout(function () {
						location.reload();
					}, 3000);
				}
			}
			else {
				return;
			}
		},
		ignoratorClick: function() {
			var ignorator = document.getElementById('ignorator');
			document.getElementById('ignorator_messagelist').checked = ignorator.checked;
			document.getElementById('ignorator_topiclist').checked = ignorator.checked;
			options.save();
		},
		highlightClick: function() {
			var highlight = document.getElementById('enable_user_highlight');
			document.getElementById('userhl_messagelist').checked = highlight.checked;
			document.getElementById('userhl_topiclist').checked = highlight.checked;
			options.save();
		},
		downloadClick: function() {
			document.getElementById('downloadcfg').click();
		},
		restoreClick: function() {
			document.getElementById('restorecfg').click();
		},		
		showTextarea: function() {
			document.getElementById('old_cfg_options').style.display = "none";
			document.getElementsByClassName('old_cfg_options')[0].style.display = "inline";			
			options.show();
		},		
		processConfig: function(textfile) {
			var base64;
			try {
				if (typeof textfile === 'string') {
					newCfg = JSON.parse(textfile);
				}
				else if (document.getElementById('cfg_ta').value != '') {
					newCfg = JSON.parse(document.getElementById('cfg_ta').value);
				}		
				var myCfg = JSON.parse(localStorage['ChromeLL-Config']);
				for (var i in newCfg) {
					myCfg[i] = newCfg[i];				
				}
				myCfg.last_saved = new Date().getTime();
				localStorage['ChromeLL-Config'] = JSON.stringify(myCfg);
			} catch (e) {
				console.log('This doesnt look like a config', e);
				base64 = options.functions.decodeBase64(document.getElementById('cfg_ta').value);
				options.restoreV1(base64);
			}
			location.reload();
		},
		resetConfig: function() {
			var reset = confirm("Are you sure you want to reset your settings?");
			if (reset === true) {
				options.getDefault(function(defaultCfg) {
					localStorage['ChromeLL-Config'] = defaultCfg;
					location.reload();
				});
			}
			else {
				return;
			}
		},	
		decodeBase64: function() {
			var Base64 = {
				_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
				decode: function(input) {
					var output = "";
					var chr1, chr2, chr3;
					var enc1, enc2, enc3, enc4;
					var i = 0;

					input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

					while (i < input.length) {

						enc1 = this._keyStr.indexOf(input.charAt(i++));
						enc2 = this._keyStr.indexOf(input.charAt(i++));
						enc3 = this._keyStr.indexOf(input.charAt(i++));
						enc4 = this._keyStr.indexOf(input.charAt(i++));

						chr1 = (enc1 << 2) | (enc2 >> 4);
						chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
						chr3 = ((enc3 & 3) << 6) | enc4;

						output = output + String.fromCharCode(chr1);

						if (enc3 != 64) {
							output = output + String.fromCharCode(chr2);
						}
						if (enc4 != 64) {
							output = output + String.fromCharCode(chr3);
						}

					}

					output = Base64._utf8_decode(output);

					return output;

				},
				_utf8_decode: function(utftext) {
					var string = "";
					var i = 0;
					var c = c1 = c2 = 0;

					while (i < utftext.length) {

						c = utftext.charCodeAt(i);

						if (c < 128) {
							string += String.fromCharCode(c);
							i++;
						} else if ((c > 191) && (c < 224)) {
							c2 = utftext.charCodeAt(i + 1);
							string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
							i += 2;
						} else {
							c2 = utftext.charCodeAt(i + 1);
							c3 = utftext.charCodeAt(i + 2);
							string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
							i += 3;
						}

					}

					return string;
				}
			}
			return JSON.parse(Base64.decode(config));
		},
		sortCache: function(sortType) {
			if (sortType === 'default') {
				options.ui.populateCacheTable(sortType);
			}
			else {
				var filenames = [];
				var results = [];
				var duplicateCheck = {};
				var filetypes = {};
				options.cache.restore(function(cached) {
					var cache = cached.imagemap;
					if (sortType === 'filetype') {						
						filetypes["none"] = [];
						filetypes[".gif"] = [];
						filetypes[".jpg"] = [];
						filetypes[".png"] = [];
						for (var src in cache) {
							var filename = cache[src].filename;
							var extension = filename.match(/\.(gif|jpg|png)$/i);
							if (extension) {
								filetypes[extension[0]].push(filename);
							} else {		
								filetypes["none"].push(filename);
							}
						}
						for (var filetype in filetypes) {
							if (filetypes[filetype] === []) {
								return;
							}
							else {
								filenames = filenames.concat(filetypes[filetype]);
							}
						}
					}
					else {
						// sort by filename
						for (var src in cache) {
							var filename = cache[src].filename;
							filenames.push(filename);
						}
						filenames.sort();
						if (sortType === 'z_a') {
							filenames.reverse();
						}
					}
					// iterate over filenames array and match with their respective src values from cache
					for (var i = 0, len = filenames.length; i < len; i++) {
						var sortedFilename = filenames[i];
						for (var src in cache) {
							var cacheFilename = cache[src].filename;
							if (cacheFilename == sortedFilename) {
								if (!duplicateCheck[src]) {
									// check that src hasn't been pushed to results array before - this ensures that
									// duplicate filenames aren't assigned the same src value
									results.push(src);						
									duplicateCheck[src] = {"filename": sortedFilename, "index": i};
								}
							}
						}
					}
					options.ui.populateCacheTable(results);				
				});
			}
		},
		searchCache: function() {
			var query = document.getElementById('imagemap_search').value;
			var results = [];
			var duplicateCheck = {};
			if (/\S/.test(query)) {
				options.cache.restore(function(cached) {
					var cache = cached.imagemap;
					for (var src in cache) {
						var filename = cache[src].filename;
						if (!duplicateCheck[src]) {
							if (filename.indexOf(query) > -1) {
								results.push(src);
								duplicateCheck[src] = filename;
							}
						}
					}
					options.ui.populateCacheTable(results);
				});
			}
			else {
				options.ui.populateCacheTable('default');
			}
		},
		emptyCache: function() {
			chrome.storage.local.remove('imagemap', function() {
				console.log('Cleared imagemap cache.');
				location.reload();
			});
		},
		newLike: function() {
			options.ui.closeMenu();
			var textarea = document.getElementById('like_ta');
			var activeLike = document.getElementsByClassName('active_like')[0];
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var likeData = config.custom_like_data;
			var oldID = activeLike.id.match(/[0-9]+/)[0];			
			var highest = 1;
			for (var i in likeData) {
				var current = parseInt(i.match(/[0-9]+/)[0], 10);
				if (current > highest) {
					highest = current;
				}
			}
			var newNumber = highest + 1;
			var newID = 'like' + newNumber;
			
			config.custom_like_data[newID] = {};
			config.custom_like_data[newID].name = 'Untitled ' + newNumber;
			config.custom_like_data[newID].contents = '';			
			
			var likeList = document.getElementById('like_list');
			var anchor = document.createElement('a');
			var linebreak = document.createElement('br');
			anchor.href = '#';
			anchor.id = newID;
			anchor.className = 'active_like';
			anchor.innerHTML = 'Untitled ' + newNumber;
			var close = document.createElement('a');
			close.style.cssFloat = "right";
			close.style.fontSize = "18px";
			close.href = '#';
			close.style.textDecoration = "none";
			close.id = "delete_custom";
			close.innerHTML = '&#10006;';
			anchor.appendChild(close);
			likeList.appendChild(anchor);
			likeList.appendChild(linebreak);
			activeLike.className = '';
			textarea.value = '';
			localStorage['ChromeLL-Config'] = JSON.stringify(config);			
		},	
		saveLike: function() {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			options.ui.closeMenu();		
			var activeLike = document.getElementsByClassName('active_like')[0];
			var contents = document.getElementById('like_ta').value;			
			var name = activeLike.firstChild.innerText;
			var id = activeLike.id;
			var newName = prompt("Rename?", name);
			if (!newName) {
				newName = name;
			}
			activeLike.firstChild.nodeValue = newName;
			config.custom_like_data[id] = {};
			config.custom_like_data[id].name = newName;
			config.custom_like_data[id].contents = contents;
			config.custom_like_data[id].last_saved = Date.now();
			localStorage['ChromeLL-Config'] = JSON.stringify(config);
		},
		deleteFromConfig: function(ID) {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var type = ID.replace(/[0-9]/g, '');
			// TODO - refactor this function
			var lastKeyInObject;
			var active = document.getElementsByClassName('active_' + type).length;
			var inactive = document.getElementsByClassName('inactive_' + type).length;
			if (type == 'like') {
				delete config.custom_like_data[ID];
				cleanup(config.custom_like_data);
			}
			else if (type == 'script') {
				delete config.userscript_data[ID];
				cleanup(config.userscript_data);
			}
			var nodeToRemove = document.getElementById(ID);
			if (nodeToRemove.className == 'active_' + type) {
				var nextActive = document.getElementsByClassName('inactive_' + type)[0];
				nextActive.className = 'active_' + type;
				nodeToRemove.className = '';
			}
			var closeButton = nodeToRemove.childNodes[0];
			nodeToRemove.remove();
			closeButton.remove();
			localStorage['ChromeLL-Config'] = JSON.stringify(config);
			
			function cleanup(data) {
				// rebuild object so that IDs are always in consecutive numeric order
				// (type1, type2, type3, etc)
				var newIndex = 1;
				for (var i in data) {
					data[type + newIndex] = data[i];
					if (i !== type + newIndex) {
						delete data[i];
					}
				}
			}
		}
	},
	listeners : {
		click: function() {
			// key-value pairs contain element id and function for event handler
			var elementsToCheck = {
				'ignorator': 'ignoratorClick',
				'enable_user_highlight': 'highlightClick',
				'loadcfg': 'processConfig',
				'resetcfg': 'resetConfig',
				'forceignorator': 'cleanIgnorator',
				'restoreignorator': 'restoreIgnorator',
				'downloadbutton': 'downloadClick',
				'restorebutton': 'restoreClick',
				'old_cfg_options': 'showTextarea',
				'cache_empty': 'emptyCache',
				'script_new': 'newScript',
				'script_save':  'saveScript',
				'like_new': 'newLike',
				'like_save':  'saveLike'
			};
			
			document.addEventListener('click', function(evt) {
				var elementID = evt.target.id;
				if (elementsToCheck[elementID]) {
					var functionName = elementsToCheck[elementID];
					options.functions[functionName]();
					if (evt.target.tagName !== 'INPUT') {
						evt.preventDefault();
					}
				}
				
				if (evt.target.parentNode.id.match(/_list/) && evt.target.className != 'delete') {
					var parent = evt.target.parentNode.id;
					var type = evt.target.id.replace(/[0-9]/g, '');
					var next = evt.target;
					var last = document.getElementsByClassName('active_' + type)[0];
					if (last) {
						last.className = '';
					}
					next.className = 'active_' + type;
					options.ui.switchActive(evt.target.id);
					evt.preventDefault();
				}
				
				else if (evt.target.id == 'delete_custom') {
					options.functions.deleteFromConfig(evt.target.parentNode.id);
					evt.preventDefault();
				}
			});
		},
		change: function() {
			var restoreButton = document.getElementById('restorecfg');
			var cacheTable = document.getElementById('cache_contents');
			var cacheMenu = document.getElementById('cache_sort');
			var scriptArea = document.getElementById('script_ta');
			var keyupTimer, cacheTimer, searchTimer;		

			restoreButton.addEventListener('change', function(evt) {
				options.restoreFromText(evt);
			});	
			
			cacheTable.addEventListener('keyup', function(evt) {
				var newFilename = evt.target.value;
				var src = evt.target.id;
				if (src && newFilename) {					
					options.cache.data[src] = newFilename;
				}
				clearTimeout(cacheTimer);
				cacheTimer = setTimeout(options.cache.save, 500);				
			});
			
			cacheMenu.addEventListener('change', function(evt) {
				if (evt.target.value) {
					options.functions.sortCache(evt.target.value);		
				}
			});
			
			/*scriptArea.addEventListener('keydown', function(evt) {
				if (evt.keyIdentifier == 'U+0009') {	
					var caret = options.userscripts.findCaret(scriptArea);
					options.userscripts.tabHandler(scriptArea.value, caret);
					evt.preventDefault();
				}
			});*/
			
			// listen for changes to checkboxes/textareas/etc
			document.addEventListener('change', options.save);
			
			// use debouncing to prevent script from calling event handler after each keystroke
			document.addEventListener('keyup', function(evt) {
				if (evt.target.id == 'imagemap_search') {
					clearTimeout(searchTimer);
					searchTimer = setTimeout(options.functions.searchCache, 500);
				}
				else {
					clearTimeout(keyupTimer);
					keyupTimer = setTimeout(options.save, 500);
				}
			});			
		},
		menuVisibility: function() {
			var hiddenOptions = ['history_menubar', 'context_menu', 'dramalinks', 'user_info_popup'];
			for (var i = 0, len = hiddenOptions.length; i < len; i++) {
				// add listener to each checkbox
				var element = document.getElementById(hiddenOptions[i]);
				element.addEventListener('change', options.ui.hideUnusedMenus);
			}
		},
		menuButton: function() {
			var elements = [];
			// disabled for 2.30 release			
			// elements.push(document.getElementById('script_menu'));
			elements.push(document.getElementById('like_menu'));
			
			for (var i = 0, len = elements.length; i < len; i++) {
				var element = elements[i];
				
				element.addEventListener('click', function(evt) {
					if (evt.target.id == 'script_menu') {
						options.userscriptsMenu.open();
					}
					else if (evt.target.id == 'like_menu') {
						options.customLikeMenu.open();
					}
				});
				
				element.addEventListener('mouseleave', function() {
					options.ui.closeMenu();
				});
			}
		}
	},
	ui: {
		hideUnusedMenus: function() {
			var hiddenOptions = {'history_menubar' : 'history_options', 
					'context_menu' : 'context_options', 
					'dramalinks' : 'dramalinks_options', 
					'user_info_popup' : 'doubleclick_options'};
			for (var key in hiddenOptions) {
				var box = document.getElementById(key);
				var menu = document.getElementById(hiddenOptions[key]);		
				// only display hidden menus if checkbox is ticked
				box.checked ? menu.style.display = 'initial' : menu.style.display = 'none';
			}
		},
		closeMenu: function() {
			var menu = document.getElementById('menu_items');
			if (menu) {
				menu.remove();
			}			
		},		
		setColorPicker: function() {
			$('.color').ColorPicker({
				onChange : function(hsb, hex, rgb, el) {
					el.value = hex;
					options.save();
				},
				onSubmit : function(hsb, hex, rgb, el) {
					$(el).val(hex);
					$(el).ColorPickerHide();
					options.save();
				},
				livePreview : true,
				color : "",
				onBeforeShow : function() {
					$(this).ColorPickerSetColor(this.value);
				}
			});
		},
		populateCacheTable: function(sortedCache) {
			var table = document.getElementById('cache_contents');
			var loadingImage = document.getElementById('loading_img');
			if (sortedCache && sortedCache !== 'default') {
				table.style.display = "none";
				loadingImage.style.display = "block";
				// remove cache data from table
				var nodes = table.childNodes;
				for (var i = nodes.length - 1, limit = 1; i > limit; i--) {
					var child = nodes[i];
					table.removeChild(child);
				}
				options.cache.restore(function(cached) {
					var cache = cached.imagemap;
					for (var i = 0, len = sortedCache.length; i < len; i++) {
						var srcFromArray = sortedCache[i];
						var image = cache[srcFromArray];
						var tableRow = document.createElement('tr');				
						var filenameData = document.createElement('td');
						var urlData = document.createElement('td');								
						var filename = image.filename;
						var fullsize = image.fullsize;
						if (fullsize.length > 100) {
							var url = fullsize.substring(0, 99) + '...';
						}
						else {
							var url = fullsize;
						}
						var data = image.data;
						tableRow.id = i;
						// filename table row contains input field						
						filenameData.innerHTML = '<input type="text" class="cache_filenames" id="' + i 
								+ '" value="' + filename +'" style="width:400px;">';
						urlData.innerHTML = '<a class="cache_url" title="' + fullsize + '" href="' + data + '">' + url + '</a>';
						table.appendChild(tableRow);
						tableRow.appendChild(filenameData);
						tableRow.appendChild(urlData);
					}
					loadingImage.style.display = "none";
					table.style.display = "block";
				});
			}
			else {
				// display table of imagemap cache contents
				options.cache.restore(function(cached) {
					var cachedImagemap = cached.imagemap;
					if (!cachedImagemap) {
						var empty = document.createElement('tr');
						empty.innerHTML = 'Empty';
						table.appendChild(empty);
						return;
					}
					else {
						if (sortedCache == 'default') {
							table.style.display = "none";
							loadingImage.style.display = "block";
							// remove existing cache data from table							
							var nodes = table.childNodes;
							for (var i = nodes.length - 1, limit = 1; i > limit; i--) {
								var child = nodes[i];
								table.removeChild(child);
							}
						}
						for (var i in cachedImagemap) {
							var image = cachedImagemap[i];
							var tableRow = document.createElement('tr');				
							var filenameData = document.createElement('td');
							var urlData = document.createElement('td');								
							var filename = image.filename;
							var fullsize = image.fullsize;
							if (fullsize.length > 80) {
								var url = fullsize.substring(0, 80) + '...';
							}
							else {
								var url = fullsize;
							}
							var data = image.data;
							tableRow.id = i;
							// filename table row contains input field
							filenameData.innerHTML = '<input type="text" class="cache_filenames" id="' + i 
									+ '" value="' + filename +'" style="width:400px;">';
							urlData.innerHTML = '<a class="cache_url" title="' + fullsize + '" href="' + data + '">' + url + '</a>';
							table.appendChild(tableRow);
							tableRow.appendChild(filenameData);
							tableRow.appendChild(urlData);
						}
						loadingImage.style.display = "none";
						table.style.display = "block";				
					}
				});
			}
		},
		displayLBContent: function() {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var likeData = config.custom_like_data;
			var textarea = document.getElementById('like_ta');
			var likeList = document.getElementById('like_list');
			var mostRecent = {
					'time': 0,
					'id': ''
			};
			for (var i in likeData) {
				var like = likeData[i];
				if (like.last_saved > mostRecent.time) {
					mostRecent.time = like.last_saved;
					mostRecent.id = i;
				}
				var anchor = document.createElement('a');
				var close = document.createElement('a');
				var linebreak = document.createElement('br');		
				anchor.href = '#';
				anchor.className = 'inactive_like';
				anchor.id = i;
				anchor.innerText = like.name;
				close.style.cssFloat = "right";
				close.style.fontSize = "18px";
				close.href = '#';
				close.style.textDecoration = "none";
				close.id = "delete_custom";
				close.innerHTML = '&#10006;';
				likeList.appendChild(anchor);
				anchor.appendChild(close);
				likeList.appendChild(linebreak);
			}
			if (document.getElementById(mostRecent.id)) {			
				document.getElementById(mostRecent.id).className = 'active_like';
				textarea.value = config.custom_like_data[mostRecent.id].contents;	
			}
			
		},
		/*displayUserscripts: function() {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var scriptData = config.userscript_data;
			var textarea = document.getElementById('script_ta');
			var activeScript = document.getElementsByClassName('active_script')[0];
			var scriptList = document.getElementById('script_list');
			var mostRecent = {
					'time': 0,
					'id': ''
			};
			for (var i in scriptData) {
				var script = scriptData[i];
				console.log(script);
				if (script.last_saved > mostRecent.time) {
					mostRecent.time = script.last_saved;
					mostRecent.id = i;
				}
				var anchor = document.createElement('a');
				var close = document.createElement('a');
				var linebreak = document.createElement('br');	
				anchor.href = '#';
				anchor.id = i;
				anchor.className = 'inactive_script';
				anchor.innerHTML = script.name;				
				close.style.cssFloat = "right";
				close.style.fontSize = "18px";
				close.href = '#';
				close.style.textDecoration = "none";
				close.id = "delete_custom";
				close.innerHTML = '&#10006;';		
				scriptList.appendChild(anchor);
				anchor.appendChild(close);
				scriptList.appendChild(linebreak);
			}
			document.getElementById(mostRecent.id).className = 'active_script';
			textarea.value = config.userscript_data[mostRecent.id].contents;			
		},*/
		switchActive: function(ID) {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var type = ID.replace(/[0-9]/g, '');
			var textarea = document.getElementById(type + '_ta');
			var data;
			if (type == 'script') {
				data = config.userscript_data[ID].contents;
			}
			else if (type == 'like') {
				data = config.custom_like_data[ID].contents;
			}
			
			if (script) {
				textarea.value = data;
			}
			else {
				return;
			}
		},
		addDiv: {
			userHighlight: function() {
				var ins = document.getElementById('user_highlight').getElementsByClassName(
						'user_name')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "user_highlight_data";
				ins.style.display = "block";
				document.getElementById('user_highlight').insertBefore(ins, null);
				options.ui.setColorPicker();
			},
			bookmarkName: function() {
				var ins = document.getElementById('bookmarked_tags').getElementsByClassName(
						'bookmark_name')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "bookmark_data";
				ins.style.display = "block";
				document.getElementById('bookmarked_tags').insertBefore(ins, null);		
			},
			snippetName: function() {
				var ins = document.getElementById('snippets').getElementsByClassName(
						'snippet_name')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "snippet_data";
				ins.style.display = "block";
				document.getElementById('snippets').insertBefore(ins, null);		
			},
			keywordHighlight: function() {
				var ins = document.getElementById('keyword_highlight')
						.getElementsByClassName('keyword')[0].parentNode.parentNode
						.cloneNode(true);
				ins.className = "keyword_highlight_data";
				ins.style.display = "block";
				document.getElementById('keyword_highlight').insertBefore(ins, null);
				options.ui.setColorPicker();
			},
			tagHighlight: function() {
				var ins = document.getElementById('tag_highlight').getElementsByClassName(
						'tag')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "tag_highlight_data";
				ins.style.display = "block";
				document.getElementById('tag_highlight').insertBefore(ins, null);
				options.ui.setColorPicker();	
			},
			postTemplate: function() {
				var ins = document.getElementById('post_template').getElementsByClassName(
						'template_text')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "post_template_data";
				ins.style.display = "block";
				document.getElementById('post_template').insertBefore(ins, null);	
			}
		}
	},
	cache: {
		save: function() {
			var cacheData = options.cache.data;
			options.cache.restore(function(cached) {
				var cache = cached.imagemap;
				// replace old filename value with value from cacheChanges
				for (var i in cacheData) {
					cache[i].filename = cacheData[i];
				}
				chrome.storage.local.set({"imagemap": cache}, function() {
					console.log('Cache updated:', cacheData);
				});
			});
		},
		restore: function(callback) {
			chrome.storage.local.get("imagemap", function(cache) {
				if (cache) {
					callback(cache);
				}
				else {
					// TODO - handle empty imagemap cache
				}
			});	
		},
		data: {}
	},
	customLikeMenu: {
		open: function() {
			var button = document.getElementById('like_menu');
			var menuElement = document.createElement('span');				
			var items = ['New', 'Save'];
			menuElement.id = 'menu_items';	
			menuElement.style.position = 'absolute';
			menuElement.style.overflow = 'auto';
			menuElement.style.padding = '3px 3px';
			menuElement.style.borderStyle = 'solid';
			menuElement.style.borderWidth = '2px';
			menuElement.style.borderRadius = '3px';
			for (var i = 0, len = items.length; i < len; i++) {
				var item = items[i];
				populateMenu.call(this, item, i, menuElement);
			}
			button.appendChild(menuElement);
		
			function populateMenu(item, index, menuElement) {
				var menuSpan = document.createElement('span');
				var menuItem = document.createElement('anchor');
				var lineBreak = document.createElement('br');
				menuSpan.className = 'unhigh_span';
				menuItem.innerHTML = '&nbsp' + item + '&nbsp';
				menuItem.href = '#';
				menuItem.className = 'like_menu_items';
				menuItem.id = 'like_' + item.toLowerCase();
				menuSpan.appendChild(menuItem);
				menuElement.appendChild(menuSpan);
				menuElement.appendChild(lineBreak);
			}
		}
	},
	getDefault: function(callback) {
		var defaultURL = chrome.extension.getURL('/src/json/defaultconfig.json');
		var temp, defaultConfig;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", defaultURL, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				temp = JSON.parse(xhr.responseText);
				defaultConfig = JSON.stringify(temp);
				callback(defaultConfig);
			}
		}
		xhr.send();	
	},
	save: function() {
		var config = JSON.parse(localStorage['ChromeLL-Config']);
			inputs = $(":checkbox");
			for (var i in inputs) {
				config[inputs[i].id] = inputs[i].checked;
			}
			var textboxes = $(":text");
			for (var i in textboxes) {
				var textbox = textboxes[i];
				if (textbox.className && textbox.className == ('cache_filenames')) {						
					// do nothing
				}
				else if (textbox.id && textbox.id.match(/imagemap_|script_/)) {						
					// do nothing
				}
				else {
					config[textbox.id] = textbox.value;
				}
			}
			var userhlData = document.getElementById('user_highlight')
					.getElementsByClassName('user_highlight_data');
			var name;
			config.user_highlight_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('user_name')[0].value
						.toLowerCase();
				if (name != '') {
					config.user_highlight_data[name] = {};
					config.user_highlight_data[name].bg = userhlData[i]
							.getElementsByClassName('header_bg')[0].value;
					userhlData[i].getElementsByClassName('user_name')[0].style.background = '#'
							+ config.user_highlight_data[name].bg;
					config.user_highlight_data[name].color = userhlData[i]
							.getElementsByClassName('header_color')[0].value;
					userhlData[i].getElementsByClassName('user_name')[0].style.color = '#'
							+ config.user_highlight_data[name].color;
				}
			}
			// get bookmark data from option page, save to config
			var userhlData = document.getElementById('bookmarked_tags')
					.getElementsByClassName('bookmark_data');
			config.bookmark_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('bookmark_name')[0].value;
				if (name != '') {
					config.bookmark_data[name] = userhlData[i]
							.getElementsByClassName('bookmark_tag')[0].value;
				}
			}
			// get snippet data from option page, save to config
			userhlData = document.getElementById('snippets')
					.getElementsByClassName('snippet_data');
			config.snippet_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('snippet_name')[0].value;
				name = name.trim();
				if (name != '') {
					config.snippet_data[name] = userhlData[i]
							.getElementsByClassName('snippet')[0].value;
				}
			}
			userhlData = document.getElementById('keyword_highlight')
					.getElementsByClassName('keyword_highlight_data');
			config.keyword_highlight_data = {};
			var j = 0;
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('keyword')[0].value
						.toLowerCase();
				if (name != '') {
					config.keyword_highlight_data[j] = {};
					config.keyword_highlight_data[j].match = name;
					config.keyword_highlight_data[j].bg = userhlData[i]
							.getElementsByClassName('keyword_bg')[0].value;
					userhlData[i].getElementsByClassName('keyword')[0].style.background = '#'
							+ config.keyword_highlight_data[j].bg;
					config.keyword_highlight_data[j].color = userhlData[i]
							.getElementsByClassName('keyword_color')[0].value;
					userhlData[i].getElementsByClassName('keyword')[0].style.color = '#'
							+ config.keyword_highlight_data[j].color;
					j++;
				}
			}
			userhlData = document.getElementById('tag_highlight')
					.getElementsByClassName('tag_highlight_data');
			config.tag_highlight_data = {};
			var j = 0;
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('tag')[0].value
						.toLowerCase();
				if (name != '') {
					config.tag_highlight_data[j] = {};
					config.tag_highlight_data[j].match = name;
					config.tag_highlight_data[j].bg = userhlData[i]
							.getElementsByClassName('tag_bg')[0].value;
					userhlData[i].getElementsByClassName('tag')[0].style.background = '#'
							+ config.tag_highlight_data[j].bg;
					config.tag_highlight_data[j].color = userhlData[i]
							.getElementsByClassName('tag_color')[0].value;
					userhlData[i].getElementsByClassName('tag')[0].style.color = '#'
							+ config.tag_highlight_data[j].color;
					j++;
				}
			}
			userhlData = document.getElementById('post_template')
					.getElementsByClassName('post_template_data');
			config.post_template_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('template_title')[0].value;
				if (name != '') {
					config.post_template_data[name] = {};
					config.post_template_data[name].text = userhlData[i]
							.getElementsByClassName('template_text')[0].value;
				}
			}
			config.clear_notify = document.getElementById('clear_notify').value;
			config.last_saved = new Date().getTime();		
			localStorage['ChromeLL-Config'] = JSON.stringify(config);	
			
			// Make sure that content scripts are using latest version of config
			chrome.runtime.sendMessage({
				need: "config_push"
			});				
			
			allBg.init_listeners(config);
	},
	restoreFromText: function(evt) {
		var file = evt.target.files[0];
		if (!file.type.match('text.*')) {
			alert("Not a text file...");
			return;
		}
		else {
			var reader = new FileReader();
			reader.onload = function(evt) {
				var textFile = evt.target.result;
				options.functions.processConfig(textFile);
			}
			reader.readAsText(file);
		}
	},
	restoreV1: function(oC) {
		var config = JSON.parse(localStorage['ChromeLL-Config']);
		var hls = oC.conf['chromeLL_userhighlight'].split(';');
		var hl = Array();
		config.user_highlight_data = {};
		for (var i = 0; hls[i]; i++) {
			hl = hls[i].split(':');
			console.log(hl[0]);
			config.user_highlight_data[hl[0]] = {};
			config.user_highlight_data[hl[0]].bg = hl[1];
			config.user_highlight_data[hl[0]].color = hl[3];
		}
		var boolSettings = {
			"force_https" : "chromeLL_forcehttps",
			"short_title" : "chromeLL_shorttitle",
			"float_userbar" : "chromeLL_floatbars",
			"ignorator" : "chromeLL_ignoretopicsbyon",
			"ignorator_list" : "chromeLL_ignoretopicsby",
			"enable_user_highlight" : "chromeLL_userhighlighton",
			"number_posts" : "chromeLL_numberposts",
			"enable_user_highlight" : "chromeLL_userhighlighton"
		}
		for ( var i in boolSettings) {
			if (oC.conf[i] == "true")
				config[i] = true;
		}
		config.ignorator_list = oC.conf['chromeLL_ignoretopicsby'];
		config.ignore_keyword_list = oC.conf['chromeLL_ignoretopics'];
		config.last_saved = new Date().getTime();
		console.log(config);
		localStorage['ChromeLL-Config'] = JSON.stringify(config);	
	},
	show: function() {
		document.getElementById('cfg_ta').value = localStorage['ChromeLL-Config'];
	},
	download: function(textfile) {
		options.save();
		var config = localStorage['ChromeLL-Config'];
		var data = new Blob([config], {type: 'text/plain'})
		var textfile = window.URL.createObjectURL(data);
		return textfile;	
	},
	debouncer: ''
};

$(document)
	.ready(
		function() {
			// Restore config settings
			if (localStorage['ChromeLL-Config'] == '' || localStorage['ChromeLL-Config'] == undefined) {
				console.log("Blank Config. Rebuilding");

				options.getDefault(function(defaultConfig) {
					localStorage['ChromeLL-Config'] = defaultConfig;
				});

				if (localStorage['chromeLL_userhighlight'] && localStorage['chromeLL_userhighlight'] != '') {
					// Support for people with legacy config flesthis
					// TODO: It seems safe to remove this now, after so many years
					options.restoreV1();
				} else {
					options.init();
				}
			} else {
				options.init();
			}
		}
		
	);
