var options = (function() {
	
	var init = function() {
		var config = JSON.parse(localStorage['ChromeLL-Config']);
		
		// Iterate over relevant DOM elements and insert config values
		var checkboxes = $(":checkbox");
		for (var i in checkboxes) {
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
		
		for (var j in config.user_highlight_data) {
			document.getElementsByClassName('user_name')[document
					.getElementsByClassName('user_name').length - 1].value = j;
			document.getElementsByClassName('header_bg')[document
					.getElementsByClassName('header_bg').length - 1].value = config.user_highlight_data[j].bg;
			document.getElementsByClassName('header_color')[document
					.getElementsByClassName('header_color').length - 1].value = config.user_highlight_data[j].color;
			ui.addDiv.userHighlight();
		}
		for (var j in config.bookmark_data) {
			document.getElementsByClassName('bookmark_name')[document
					.getElementsByClassName('bookmark_name').length - 1].value = j;
			document.getElementsByClassName('bookmark_tag')[document
					.getElementsByClassName('bookmark_tag').length - 1].value = config.bookmark_data[j];
			ui.addDiv.bookmarkName();
		}
		for (var j in config.snippet_data) {
			document.getElementsByClassName('snippet_name')[document
					.getElementsByClassName('snippet_name').length - 1].value = j;
			document.getElementsByClassName('snippet')[document
					.getElementsByClassName('snippet').length - 1].value = config.snippet_data[j];
			ui.addDiv.snippetName();
		}
		
		var keywordElements = document.getElementsByClassName('keyword');
		var keywordBgElements = document.getElementsByClassName('keyword_bg');
		var keywordColorElements = document.getElementsByClassName('keyword_color');
		
		for (var keyword in config.keyword_highlight_data) {
			keywordElements[keywordElements.length - 1].value = keyword;
			keywordBgElements[keywordBgElements.length - 1].value = config.keyword_highlight_data[keyword].bg;
			keywordColorElements[keywordColorElements.length - 1].value = config.keyword_highlight_data[keyword].color;
			
			ui.addDiv.keywordHighlight();
		}
		
		var tagElements = document.getElementsByClassName('tag');
		var tagBgElements = document.getElementsByClassName('tag_bg');
		var tagColorElements = document.getElementsByClassName('tag_color');
		
		for (var tag in config.tag_highlight_data) {		
			tagElements[tagElements.length - 1].value = tag;			
			tagBgElements[tagBgElements.length - 1].value = config.tag_highlight_data[tag].bg;	
			tagColorElements[tagColorElements.length - 1].value = config.tag_highlight_data[tag].color;
					
			ui.addDiv.tagHighlight();
		}
		
		for (var j in config.post_template_data) {
			document.getElementsByClassName('template_text')[document
					.getElementsByClassName('template_text').length - 1].value = config.post_template_data[j].text;
			document.getElementsByClassName('template_title')[document
					.getElementsByClassName('template_title').length - 1].value = j;
			ui.addDiv.postTemplate();
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
					ui.addDiv.userHighlight();
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
					ui.addDiv.bookmarkName();
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
					ui.addDiv.snippetName();
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
					ui.addDiv.postTemplate();
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
					ui.addDiv.keywordHighlight();
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
					ui.addDiv.tagHighlight();
			}
		});
		
		// Show ChromeLL version
		var app = chrome.app.getDetails();
		document.getElementById('version').innerText = app.version;
		
		// Find 'Save config' button and set config blob as href
		document.getElementById('downloadcfg').href = getConfigBlob();
		
		// Show size of imagemap cache
		imageCache.open(function() {
			
			chrome.runtime.sendMessage({ need: 'getSizeInBytes' }, function(bytes) {
				var megabytes = bytes / 1048576;
				
				// Round to 2 decimal places
				document.getElementById('cache_size').innerHTML = Math.round(megabytes * 100) / 100;
				
			});
			
		});
		
		var cssBox = document.getElementById('fun_css_div');
		if (config.user_id == 13547 || config.user_id == 5599) {
			cssBox.style.display = 'block';			
		}
		
		// Add listeners, populate remaining UI elements, etc
		ui.hideUnusedMenus();
		ui.setColorPicker();
		
		listeners.addUnusedOptionListener();
		listeners.addClickListeners();
		listeners.addChangeListener();
		listeners.addLikeMenuListener();
		
		ui.populateCacheTable();
		ui.displayLBContent();
		
		saveConfig();	
	};
	
	var ignoratorCleaner = function() {
		
		var clean = function() {
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
		};
		
		return {
			rateLimitChecker: function() {
				var config = JSON.parse(localStorage['ChromeLL-Config']);
				
				if (config.ignorator_list == "") {
					document.getElementById('ignorateinfo').innerText = "no ignorator list found..."
					return;
				}
				
				var currentTime = new Date().getTime();
				var timeElapsed = currentTime - config.last_clean;
				
				if (timeElapsed > 86400000) {				
					document.getElementById('ignorateinfo').innerText = "running ignorator cleaner..."
					clean();	
				}
				
				else {
					var totalseconds = ((86400000 - timeElapsed) / 1000);
					var hours = Math.floor(totalseconds / 3600);
					var totalminutes = Math.floor(totalseconds / 60);
					var minutes = totalminutes - (hours * 60);
					var seconds = Math.floor(totalseconds - (totalminutes * 60))
					
					if (hours === 1) {
						hours = hours + " hour, ";
					} 
					else if (hours !== 1) {
						hours = hours + " hours, ";
					}
					
					if (minutes === 1) {
						minutes = minutes + " minute, and ";
					} 
					else if (minutes !== 1) {
						minutes = minutes + " minutes, and ";
					}
					
					if (seconds === 1) {
						seconds = seconds + " second.";
					} 
					else if (seconds !== 1) {
						seconds = seconds + " seconds."
					}
					
					document.getElementById('ignorateinfo').innerText = "try again in " + hours + minutes + seconds;
				}
			},
			
			restoreBackup: function() {
				var config = JSON.parse(localStorage['ChromeLL-Config']);
				var backup = config.ignorator_backup;
				
				if (confirm('Are you sure you want to restore last ignorator backup?')) {
					
					if (backup == "") {
						document.getElementById('ignorateinfo').innerHTML = "no backup found...";
						return;
					} 
					
					else if (backup == config.ignorator_list) {
						document.getElementById('ignorateinfo').innerHTML = "current list and backup are identical...";
						return;
					} 
					
					else {
						config.ignorator_list = backup;
						localStorage['ChromeLL-Config'] = JSON.stringify(config);
						document.getElementById('ignorateinfo').innerHTML = "backup restored - reloading page in 3 seconds...";
						setTimeout(function () {
							location.reload();
						}, 3000);
					}
				}
			}			
			
		};
		
	}();
		
	var clickHandlers = function() {
		
		return {
			ignorator: function() {
				var ignorator = document.getElementById('ignorator');
				document.getElementById('ignorator_messagelist').checked = ignorator.checked;
				document.getElementById('ignorator_topiclist').checked = ignorator.checked;
				saveConfig();
			},
			
			userHighlight: function() {
				var highlight = document.getElementById('enable_user_highlight');
				document.getElementById('userhl_messagelist').checked = highlight.checked;
				document.getElementById('userhl_topiclist').checked = highlight.checked;
				saveConfig();
			},
						
			configDownload: function() {
				// TODO: maybe it would be better to store config blob as data- attribute of button, 
				document.getElementById('downloadcfg').click();
			},
			
			configRestore: function() {
				document.getElementById('restorecfg').click();
			}			
		};
		
	}();
	
	var listeners = function() {
		
		return {
			addClickListeners: function() {
				// key-value pairs contain element id and method for event listener
				var elementsToCheck = {
					'ignorator': clickHandlers.ignorator,
					'enable_user_highlight': clickHandlers.userHighlight,
					'loadcfg': restoreConfigFromText,
					'resetcfg': resetConfig,
					'forceignorator': ignoratorCleaner.rateLimitChecker,
					'restoreignorator': ignoratorCleaner.restoreBackup,
					'downloadbutton': clickHandlers.configDownload,
					'restorebutton': clickHandlers.configRestore,
					'old_cfg_options': showTextarea,
					'cache_empty': imageCache.clear,
					'like_new': customLikeMenu.newEntry,
					'like_save':  customLikeMenu.saveEntry
				};
				
				document.addEventListener('click', function(evt) {
					var id = evt.target.id;
					
					if (elementsToCheck[id]) {
						var method = elementsToCheck[id];
						method.call();
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
						customLikeMenu.switchActive(evt.target.id);
						evt.preventDefault();
					}
					
					else if (evt.target.id == 'delete_custom') {
						customLikeMenu.deleteEntry(evt.target.parentNode.id);
						evt.preventDefault();
					}
				});
			},
			
			addChangeListener: function() {
				var restoreButton = document.getElementById('restorecfg');
				var cacheTable = document.getElementById('cache_contents');
				var cacheMenu = document.getElementById('cache_sort');
				var keyupTimer, cacheTimer, searchTimer;		

				restoreButton.addEventListener('change', function(evt) {
					restoreConfigFromFile(evt);
				});	
				
				cacheTable.addEventListener('keyup', function(evt) {
					var newFilename = evt.target.value;
					var id = evt.target.id;
					
					if (id !== 'imagemap_search') {
						
						if (id && newFilename) {
							imageCache.data[id] = newFilename;
						}
					}
					
					clearTimeout(cacheTimer);
					cacheTimer = setTimeout(imageCache.save, 500);				
				});
				
				cacheMenu.addEventListener('change', function(evt) {
					if (evt.target.value) {
						imageCache.sort(evt.target.value);		
					}
				});
				
				// listen for changes to checkboxes/textareas/etc
				document.addEventListener('change', saveConfig);
				
				// use debouncing to prevent script from calling event handler after each keystroke
				document.addEventListener('keyup', function(evt) {
					if (evt.target.id == 'imagemap_search') {
						clearTimeout(searchTimer);
						searchTimer = setTimeout(imageCache.search, 500);
					}
					else {
						clearTimeout(keyupTimer);
						keyupTimer = setTimeout(saveConfig, 500);
					}
				});			
			},
			
			addUnusedOptionListener: function() {
				var hiddenOptions = ['history_menubar', 'context_menu', 'dramalinks', 'user_info_popup'];
				for (var i = 0, len = hiddenOptions.length; i < len; i++) {
					// add listener to each checkbox
					var element = document.getElementById(hiddenOptions[i]);
					element.addEventListener('change', ui.hideUnusedMenus);
				}
			},
			
			addLikeMenuListener: function() {
				var likeMenu = document.getElementById('like_menu');

					likeMenu.addEventListener('click', function(evt) {
						
						if (evt.target.id == 'like_menu') {
							customLikeMenu.open();
						}
						
					});
					
					likeMenu.addEventListener('mouseleave', function() {
						ui.closeMenu();
					});				
			}			
		};
		
	}();	
	
	var ui = function() {

		var hideUnusedMenus = function() {
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
		};
		
		var closeMenu = function() {
			var menu = document.getElementById('menu_items');
			if (menu) {
				menu.remove();
			}			
		};
		
		var setColorPicker = function() {
			$('.color').ColorPicker({
				onChange : function(hsb, hex, rgb, el) {
					el.value = hex;
					saveConfig();
				},
				onSubmit : function(hsb, hex, rgb, el) {
					$(el).val(hex);
					$(el).ColorPickerHide();
					saveConfig();
				},
				livePreview : true,
				color : "",
				onBeforeShow : function() {
					$(this).ColorPickerSetColor(this.value);
				}
			});
		};
		
		var populateCacheTable = function(sortedImages) {
			var table = document.getElementById('cache_contents');
			var loadingImage = document.getElementById('loading_img');
						
			if (sortedImages && sortedImages !== 'default') {
				
				// Remove existing table rows
				var nodes = table.childNodes;
				for (var i = nodes.length - 1, limit = 1; i > limit; i--) {
					var child = nodes[i];
					table.removeChild(child);
				}
				
				// Create new table row for each result
				for (var i in sortedImages) {
					ui.createTableRow(sortedImages[i]);					
				}
				
				// Display results and hide spinner
				loadingImage.style.display = "none";
				table.style.display = "block";
			}
			
			else {
				imageCache.open(function() {
					// TODO: Get all keys, split into pages and display 1 page at a time (with option to show all)
					chrome.runtime.sendMessage({ need: 'getAllFromDb' }, function(images) {
						var table = document.getElementById('cache_contents');
						var loadingImage = document.getElementById('loading_img');
						
						if (!images) {
							var empty = document.createElement('tr');
							empty.innerHTML = 'Empty';
							table.appendChild(empty);
							return;
						}
						
						else {
							if (sortedImages == 'default') {
								table.style.display = "none";
								loadingImage.style.display = "block";								
								var table = document.getElementById('cache_contents');							
								var nodes = table.childNodes;
								for (var i = nodes.length - 1, limit = 1; i > limit; i--) {
									var child = nodes[i];
									table.removeChild(child);
								}
							}
							
							for (var i in images) {
								ui.createTableRow(images[i]);
							}
							
							loadingImage.style.display = "none";
							table.style.display = "block";
						}
					});
				});
			}
		};

		var createTableRow = function(result) {
			if (result) {
				var table = document.getElementById('cache_contents');			
				var tableRow = document.createElement('tr');				
				var filenameData = document.createElement('td');
				var urlData = document.createElement('td');								
				
				if (result.fullsize.length > 100) {
					var url = result.fullsize.substring(0, 99) + '...';
				}
				else {
					var url = result.fullsize;
				}
				
				var input = document.createElement('input');
				input.type = 'text';
				input.className = 'cache_filenames';
				input.value = result.filename;
				input.style.width = '400px';
				filenameData.appendChild(input);
						
				var anchor = document.createElement('a');
				anchor.className = 'cache_url';
				anchor.title = result.fullsize;
				anchor.href = result.data;
				anchor.innerHTML = url;
				urlData.appendChild(anchor);
				
				table.appendChild(tableRow);
				tableRow.appendChild(filenameData);
				tableRow.appendChild(urlData);
			}
			
			else {
				table.appendChild(document.createElement('tr'));
				tableRow.appendChild(document.createElement('td'));
				tableRow.appendChild(document.createElement('td'));				
			}
		};
		
		var displayLBContent = function() {
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
			
		};
		
		var addDiv = {
			userHighlight: function() {
				var ins = document.getElementById('user_highlight').getElementsByClassName(
						'user_name')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "user_highlight_data";
				ins.style.display = "block";
				document.getElementById('user_highlight').insertBefore(ins, null);
				ui.setColorPicker();
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
				ui.setColorPicker();
			},
			
			tagHighlight: function() {
				var ins = document.getElementById('tag_highlight').getElementsByClassName(
						'tag')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "tag_highlight_data";
				ins.style.display = "block";
				document.getElementById('tag_highlight').insertBefore(ins, null);
				ui.setColorPicker();	
			},
			
			postTemplate: function() {
				var ins = document.getElementById('post_template').getElementsByClassName(
						'template_text')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "post_template_data";
				ins.style.display = "block";
				document.getElementById('post_template').insertBefore(ins, null);	
			}
		};
	
		return {
			hideUnusedMenus: hideUnusedMenus,
			closeMenu: closeMenu,
			setColorPicker: setColorPicker,
			populateCacheTable: populateCacheTable,
			createTableRow: createTableRow,
			displayLBContent: displayLBContent,
			addDiv: addDiv
		};
		
	}();
	
	var customLikeMenu = function() {
		
		var newEntry = function() {
			ui.closeMenu();
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
		};
		
		var openEntry = function() {
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
		};
		
		var saveEntry = function() {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			ui.closeMenu();		
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
		};		
		
		var deleteEntry = function(id) {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var type = id.replace(/[0-9]/g, '');
			var active = document.getElementsByClassName('active_like').length;
			var inactive = document.getElementsByClassName('inactive_like').length;

			delete config.custom_like_data[id];
			cleanup(config.custom_like_data);
				
			var nodeToRemove = document.getElementById(id);
			
			if (nodeToRemove.className == 'active_like') {
				var nextActive = document.getElementsByClassName('inactive_like')[0];
				nextActive.className = 'active_like';
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
		};	
				
		var switchActive = function(ID) {
			var config = JSON.parse(localStorage['ChromeLL-Config']);
			var type = ID.replace(/[0-9]/g, '');
			var textarea = document.getElementById(type + '_ta');
			var data;

			if (type == 'like') {
				data = config.custom_like_data[ID].contents;
				textarea.value = data;
			}
		};
		
		return {
			open: open,
			deleteEntry: deleteEntry,
			switchActive: switchActive
		};
		
	}();	
	
	var imageCache = function() {
				
		var save = function() {
			// TODO: Get filename changes and replace old db entry
		};
		
		var open = function(callback) {
			chrome.runtime.sendMessage({ need: 'openDatabase' }, callback);
		};
		
		var clear = function() {
						
		};
		
		var sort = function(sortType) {
		
			if (sortType === 'default') {
				ui.populateCacheTable(sortType);
			}
			
			else {
				var filenames = [];
				var results = [];
				var duplicateCheck = {};
				var filetypes = {};
				
				chrome.runtime.sendMessage({ need: 'getAllFromDb' }, function(images) {					
				
					if (sortType === 'filetype') {						
						filetypes["none"] = [];
						filetypes[".gif"] = [];
						filetypes[".jpg"] = [];
						filetypes[".png"] = [];
						
						// Iterate over images and push filenames to appropriate array
						for (var i in images) {
							var filename = images[i].filename;
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
						// Sort by filename
						for (var i in images) {
							var filename = images[i].filename;
							filenames.push(filename);
						}
						
						filenames.sort();
						
						if (sortType === 'z_a') {
							filenames.reverse();
						}
					}
					
					// Iterate over filenames array and match with their respective src values from cache
					for (var i = 0, len = filenames.length; i < len; i++) {
						var sortedFilename = filenames[i];
						
						for (var j in images) {
							var image = images[j];
							var cacheFilename = image.filename
							var src = image.src;
							
							if (cacheFilename == sortedFilename) {
								
								if (!duplicateCheck[src]) {
									// Check that src hasn't been pushed to results array before - this ensures that
									// duplicate filenames aren't assigned the same src value
									results.push(image);
									duplicateCheck[src] = { "filename": sortedFilename, "index": i };
								}
							}
						}
					}
					
					// Now we can populate database table using sorted array as a reference
					ui.populateCacheTable(results);
					
				});
			}
		};
		
		var search = function() {			
			var table = document.getElementById('cache_contents');
			var loadingImage = document.getElementById('loading_img');				
			var query = document.getElementById('imagemap_search').value;
			
			if (/\S/.test(query)) {
				table.style.display = "none";
				loadingImage.style.display = "block";				
				
				var request = {
						need: 'searchDatabase',
						query: query			
				};
				
				chrome.runtime.sendMessage(request, function(results) {
						ui.populateCacheTable(results);			
				});
			}
			
			else {
				ui.populateCacheTable('default');
			}
		};
		
		return {
			open: open,
			save: save,
			clear: clear,
			search: search,
			sort: sort		
		};
		
	}();
	
	var getDefaultConfig = function(callback) {
		var defaultURL = chrome.extension.getURL('/src/json/defaultconfig.json');		
		
		chrome.runtime.sendMessage({ need: 'xhr' }, function(response) {
				var temp = JSON.parse(xhr.responseText);
				var defaultConfig = JSON.stringify(temp);
				callback(defaultConfig);			
		});		
		
	};
	
	var saveConfig = function() {
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
			var bookmarkData = document.getElementById('bookmarked_tags')
					.getElementsByClassName('bookmark_data');
			config.bookmark_data = {};
			for (var i = 0; bookmarkData[i]; i++) {
				name = bookmarkData[i].getElementsByClassName('bookmark_name')[0].value;
				if (name != '') {
					config.bookmark_data[name] = bookmarkData[i]
							.getElementsByClassName('bookmark_tag')[0].value;
				}
			}
			
			// get snippet data from option page, save to config
			var snippetData = document.getElementById('snippets')
					.getElementsByClassName('snippet_data');
			config.snippet_data = {};
			for (var i = 0; snippetData[i]; i++) {
				name = snippetData[i].getElementsByClassName('snippet_name')[0].value;
				name = name.trim();
				if (name != '') {
					config.snippet_data[name] = snippetData[i]
							.getElementsByClassName('snippet')[0].value;
				}
			}
			
			var keywordData = document.getElementById('keyword_highlight')
					.getElementsByClassName('keyword_highlight_data');
					
			config.keyword_highlight_data = {};
			
			for (var i = 0; keywordData[i]; i++) {
				
				name = keywordData[i].getElementsByClassName('keyword')[0].value
						.toLowerCase();
						
				if (name != '') {
					config.keyword_highlight_data[name] = {};
					
					config.keyword_highlight_data[name].bg = keywordData[i]
							.getElementsByClassName('keyword_bg')[0].value;
							
					keywordData[i].getElementsByClassName('keyword')[0].style.background = '#'
							+ config.keyword_highlight_data[name].bg;
							
					config.keyword_highlight_data[name].color = keywordData[i]
							.getElementsByClassName('keyword_color')[0].value;
							
					keywordData[i].getElementsByClassName('keyword')[0].style.color = '#'
							+ config.keyword_highlight_data[name].color;
				}
			}
			
			var tagData = document.getElementById('tag_highlight')
					.getElementsByClassName('tag_highlight_data');
			config.tag_highlight_data = {};
			
			for (var i = 0; tagData[i]; i++) {
				
				name = tagData[i].getElementsByClassName('tag')[0].value.toLowerCase();
				
				if (name != '') {
					config.tag_highlight_data[name] = {};
					
					config.tag_highlight_data[name].bg = tagData[i]
							.getElementsByClassName('tag_bg')[0].value;
							
					tagData[i].getElementsByClassName('tag')[0].style.background = '#'
							+ config.tag_highlight_data[name].bg;
							
					config.tag_highlight_data[name].color = tagData[i]
							.getElementsByClassName('tag_color')[0].value;
							
					tagData[i].getElementsByClassName('tag')[0].style.color = '#'
							+ config.tag_highlight_data[name].color;
				}
			}
			
			var templateData = document.getElementById('post_template')
					.getElementsByClassName('post_template_data');
			config.post_template_data = {};
			for (var i = 0; templateData[i]; i++) {
				name = templateData[i].getElementsByClassName('template_title')[0].value;
				if (name != '') {
					config.post_template_data[name] = {};
					config.post_template_data[name].text = templateData[i]
							.getElementsByClassName('template_text')[0].value;
				}
			}
			
			config.clear_notify = document.getElementById('clear_notify').value;
			config.last_saved = new Date().getTime();		
			localStorage['ChromeLL-Config'] = JSON.stringify(config);
	};
	
	var restoreConfigFromFile = function(evt) {
		var file = evt.target.files[0];
		if (!file.type.match('text.*')) {
			alert("Not a text file...");
			return;
		}
		else {
			var reader = new FileReader();
			
			reader.onload = (evt) => {	
				var textFile = evt.target.result;
				processConfig(textFile);			
			}
			
			reader.readAsText(file);
		}
	};
	
	var getConfigBlob = function() {
		saveConfig();
		var config = localStorage['ChromeLL-Config'];
		var blob = new Blob([config], {type: 'text/plain'})
		var blobUrl = window.URL.createObjectURL(blob);
		return blobUrl;	
	};
	
	var showTextarea = function() {
		document.getElementById('old_cfg_options').style.display = "none";
		document.getElementsByClassName('old_cfg_options')[0].style.display = "inline";			
		showConfigInTextarea();
	};
	
	var showConfigInTextarea = function() {
		document.getElementById('cfg_ta').value = localStorage['ChromeLL-Config'];
	};
		
	var processConfig = function(textfile) {
		try {
			if (typeof textfile === 'string') {
				newCfg = JSON.parse(textfile);
			}
			var myCfg = JSON.parse(localStorage['ChromeLL-Config']);
			for (var i in newCfg) {
				myCfg[i] = newCfg[i];				
			}
			myCfg.last_saved = new Date().getTime();
			localStorage['ChromeLL-Config'] = JSON.stringify(myCfg);
			location.reload();
		} catch (e) {
			alert("Couldn't parse config file.");
		}
	};
	
	var resetConfig = function() {
		var reset = confirm("Are you sure you want to reset your settings?");
		if (reset === true) {
			getDefault(function(defaultCfg) {
				localStorage['ChromeLL-Config'] = defaultCfg;
				location.reload();
			});
		}
		else {
			return;
		}
	};
	
	return { 
		init: init,
		getDefaultConfig: getDefaultConfig	
	};
	
})();

$(document).ready(function() {
	
	if (localStorage['ChromeLL-Config'] == '' || localStorage['ChromeLL-Config'] == undefined) {
		// It's possible that user clicked options page before background script finished initializing	
		options.getDefaultConfig(function(config) {
			localStorage['ChromeLL-Config'] = config;
		});

		options.init();		
	} 
	
	else {
		options.init();
	}
	
});
