(function(CHROMELL) {
	
	CHROMELL.topicList = function() {
		var globalPort = CHROMELL.globalPort;
		
		// pm variable is added to method name to determine config setting for PM inbox
		// eg. userhl_topiclist and userhl_topiclist_pm
		var pm = '';	
		
		/** Initialise script after config has been loaded, but before DOMContentLoaded fires */
		var init = function() {
			globalPort.onMessage.addListener(eventHandlers.message);
			buildArraysFromConfig();
			
			if (CHROMELL.config.dramalinks && window.location.href.match(/topics/)) {								
				chrome.runtime.sendMessage({ 
						need: 'insertcss', 
						file: 'src/css/dramalinks.css' 
				});						
				
				chrome.runtime.sendMessage({
						need : "dramalinks"
				}, function(response) {
					dramalinks.html = response;
				});				
			}
			
			cssHandler();
						
			CHROMELL.whenDOMReady(DOM.init);
		};
		
		/**
		  *  Method to check whether config has changed and regenerate CSS rules if necessary.
		  *  Otherwise, inserts CSS file from localStorage (or generates rules if undefined)
		  */
		var cssHandler = function() {
			if (CHROMELL.config.last_saved > new Date().getTime()) {
				CHROMELL.injectCss(DOM.generateCss);
			}
			
			else if (localStorage['ChromeLL-topicList-CSS'] !== undefined) {
				chrome.runtime.sendMessage({
						need: 'insertcss',
						code: localStorage['ChromeLL-topicList-CSS']
				});				
			}
			
			else {
				CHROMELL.injectCss(DOM.generateCss);
			}
			
		};		
		
		var buildArraysFromConfig = function() {
			// Convert strings from ignorator config values into arrays of lowercase usernames.
			if (CHROMELL.config.ignorator_list) {
				if (CHROMELL.config.ignorator_list.indexOf(',') == -1) {
					// ignorator list only has one user
					ignore.users[0] = CHROMELL.config.ignorator_list.toLowerCase()
				}
				else {
					// split comma separated list into array
					var ignore_users = CHROMELL.config.ignorator_list.split(',');
					for (var i = 0, len = ignore_users.length; i < len; i++) {
						ignore.users[i] = ignore_users[i].toLowerCase().trim();
					}
				}
			}
			if (CHROMELL.config.ignore_keyword_list) {
				if (CHROMELL.config.ignore_keyword_list.indexOf(',') == -1) {
					ignore.keywords[0] = CHROMELL.config.ignore_keyword_list;
				}
				else {
					var ignore_words = CHROMELL.config.ignore_keyword_list.split(',');		
					for (var i = 0, len = ignore_words.length; i < len; i++) {
						ignore.keywords[i] = ignore_words[i]
								.toLowerCase().trim();
					}
				}
			} 
		};
		
		var checkTags = function() {
			var atags = document.getElementById('bookmarks')
					.getElementsByTagName('span');
			var ctags = {};
			for (var i = 0, len = atags.length; i < len; i++) {
				var tag = atags[i];
				if (!atags[i].className) {
					var name = atags[i].getElementsByTagName('a')[0].innerHTML;
					tag = atags[i].getElementsByTagName('a')[0].href
							.match('\/topics\/(.*)$')[1];
					ctags[name] = tag;
				}
			}
			chrome.runtime.sendMessage({
				need: "save",
				name: "saved_tags",
				data: ctags
			});
		};		
		
		var ignore = {
			users: [],
			keywords: []
		};
		
		var ignorated = {
			total_ignored: 0,
			data: {
				users: {},
				keywords: {}
			}
		};			
		
		var DOM = function() {
			var currentUser;
			
			var init = function() {
				if (CHROMELL.config.dramalinks && !window.location.href.match(/[inbox|main].php/)) {
					var element = document.getElementsByTagName('h1')[0];
					dramalinks.appendTo(element);
				}	
				
				var grids = document.getElementsByClassName('grid');
				
				for (var i = 0, gridLen = grids.length; i < gridLen; i++) {
					var trs = grids[i].getElementsByTagName('tr');
					
					// iterate over trs and pass tr nodes to topicList functions
					// (ignoring trs[0] as it's not a topic)
					for (var j = 1, trsLen = trs.length; j < trsLen; j++) {
						var tr = trs[j];
						
						if (tr.innerText && tr.innerText == 'See More') {
							// ignore these elements (found only on main.php)	
							return;
						}
												
						var nodeToCheck = tr.getElementsByTagName('td')[1].getElementsByTagName('a')[0];
						
						if (nodeToCheck) {
							currentUser = nodeToCheck.innerHTML.toLowerCase();
						}
						
						else {
							// Anonymous topic
							currentUser = false;
						}

						for (var k in methods) {
							if (CHROMELL.config[k + pm]) {
								methods[k](tr, j);
							}
							else {
								// Delete method from object so we don't have to check it again
								delete methods[k];
							}
						}
					}
				}
				
				document.addEventListener('click', eventHandlers.clickEvent);
				
				try {
					checkTags();
				} catch (e) {
					console.log("Error finding tags");
				}
				
				if (!CHROMELL.config.hide_ignorator_badge) {
					// send ignorator data to background script
					globalPort.postMessage({
						action: 'ignorator_update',
						ignorator: ignorated,
						scope: "topicList"
					});
				}
			};			
			
			var removeDisallowedCssChars = function(string) {
				return string.replace(/[^a-zA-Z0-9]/g, '');
			};
			
			var convertHexToRGB = function(hex, alpha) {
				// Takes hex triplet and returns values of colour in RGB form (or RGBA, if alpha value is provided)
				var rgb;
				(typeof alpha == 'number') ? rgb = 'rgba(' : rgb = 'rgb(';
				// Parse each byte of hex triplet and add to rgb string
				rgb += parseInt(hex.substring(0, 2), 16) + ', ';
				rgb += parseInt(hex.substring(2, 4), 16) + ', ';
				rgb += parseInt(hex.substring(4, 6), 16);
				// Append alpha value
				if (typeof alpha == 'number') {
					rgb += ', ' + alpha;
				}	
				
				rgb += ')';

				return rgb;
			};
			
			var generateCss = function() {
				var style = document.createElement("style");				
				document.head.appendChild(style);

				var styleSheet = style.sheet;
				
				if (CHROMELL.config.zebra_tables) {
					var rule;
					
					if (CHROMELL.config.fast_zebras || !CHROMELL.config.zebra_tables_color) {
						rule = 'opacity: .75';
					}
					
					else {
						rule = 'background: #' + CHROMELL.config.zebra_tables_color;
					}
					
					styleSheet.addRule('table.grid tr:nth-child(odd) td', rule);
				}
				
				if (CHROMELL.config.enable_keyword_highlight) {
					
					for (var keyword in CHROMELL.config.keyword_highlight_data) {
						var entry = CHROMELL.config.keyword_highlight_data[keyword];	
						var bg = entry.bg;
						var color = entry.color;							
						var rgbaStart = convertHexToRGB(bg, 0.4);
						var rgbaEnd = convertHexToRGB(bg, 0.4);						
						var cssKeyword = removeDisallowedCssChars(keyword);
						
						// Highlight td element containing tags to be highlighted (can be overridden by tag highlight)
						styleSheet.addRule('table.grid td.oh.' + cssKeyword, 'background: #' + bg);
						styleSheet.addRule('table.grid td.oh.' + cssKeyword, 'color: #' + color);
						styleSheet.addRule('table.grid td.oh.' + cssKeyword + ' a', 'color: #' + color);
					}
				}

				if (CHROMELL.config.enable_tag_highlight) {
					
					for (var tag in CHROMELL.config.tag_highlight_data) {
						var entry = CHROMELL.config.tag_highlight_data[tag];
						var bg = entry.bg;
						var color = entry.color;
						var rgbaStart = convertHexToRGB(bg, 0.8);
						var rgbaEnd = convertHexToRGB(bg, 0);					
						var cssTag = removeDisallowedCssChars(tag);
						
						// Highlight td element containing tags to be highlighted (can be overridden by username highlight)
						styleSheet.addRule('table.grid td.oh.' + cssTag, 'background: #' + bg);
						styleSheet.addRule('table.grid td.oh.' + cssTag, 'color: #' + color);
						styleSheet.addRule('table.grid td.oh.' + cssTag + ' a', 'color: #' + color);
					}		
				}		
			
				if (CHROMELL.config.enable_user_highlight) {
					
					for (var username in CHROMELL.config.user_highlight_data) {						
						var entry = CHROMELL.config.user_highlight_data[username];
						var bg = entry.bg;
						var color = entry.color;
						var cssUser = makeCssDatasetAttribute(username);
						
						// User highlights are allowed to override any other type of highlight										
						styleSheet.addRule('table.grid tr.' + cssUser + ' td', 'background: #' + bg + ' !important');
						styleSheet.addRule('table.grid tr.' + cssUser + ' td', 'color: #' + color + ' !important');
						styleSheet.addRule('table.grid tr.' + cssUser + ' a', 'background: #' + bg);
						styleSheet.addRule('table.grid tr.' + cssUser + ' a', 'color: #' + color);
					}
				}
				
				var cssString = '';
				
				for (var rule in styleSheet.cssRules) {		
					var cssText = styleSheet.cssRules[rule].cssText;
					
					if (cssText) {
						cssString += cssText + '\n';						
					}
				}

				localStorage['ChromeLL-topicList-CSS'] = cssString;
				
			};
			
			var handlePopupClick = function(methodName, element, index) {
				methods[methodName](element, index);
			};
			
			var methods = {};
			
			methods.ignorator_topiclist = function(tr, i) {
				var ignores = ignore.users;
				if (!ignores) {
					return;
				}
				else {
					var td = tr.getElementsByTagName('td')[1];
					for (var f = 0, len = ignores.length; f < len; f++) {
						if (!td || td.innerHTML.indexOf('<td>Human</td>') > -1) {					
							// ignore anonymous topics
							return;
						}
						else {					
							if (currentUser == ignores[f]) {
												
								tr.setAttribute('ignored', true);
								
								ignorated.total_ignored++;
								
								if (!ignorated.data.users[ignores[f]]) {
									ignorated.data.users[ignores[f]] = {};
									ignorated.data.users[ignores[f]].total = 1;
									ignorated.data.users[ignores[f]].trs = [i];
								}
								
								else {
									ignorated.data.users[ignores[f]].total++;
									ignorated.data.users[ignores[f]].trs.push(i);
								}				
							}
						}
					}
				}
			};
			
			methods.ignore_keyword = function(tr, i) {
				if (CHROMELL.config.ignore_keyword_list) {
					var re = false;
					var keywords = ignore.keywords;
					var title;
					var match = false;
					var reg;
					if (tr.getElementsByTagName('td')[0]) {
						title = tr.getElementsByTagName('td')[0];
						username = title.getElementsByTagName('a')[0].innerHTML;
						for (var f = 0, len = keywords.length; f < len; f++) {
							
							if (re) {
								if (keywords[f].substring(0, 1) == '/') {
									reg = new RegExp(keywords[f].substring(1,
											keywords[f].lastIndexOf('/')), keywords[f]
											.substring(
													keywords[f].lastIndexOf('/') + 1,
													keywords[f].length));
								} 
								else {
									reg = keywords[f];
								}
								
								match = username.match(reg);
							} 
							
							else {
								
								match = username.toLowerCase().indexOf(
												keywords[f].toLowerCase()) != -1;
							}
							
							if (match) {
								
								tr.setAttribute('ignored', true);				
								
								ignorated.total_ignored++;
								if (!ignorated.data.keywords[keywords[f]]) {
									ignorated.data.keywords[keywords[f]] = {};
									ignorated.data.keywords[keywords[f]].total = 1;
									ignorated.data.keywords[keywords[f]].trs = [ i ];
								} else {
									ignorated.data.keywords[keywords[f]].total++;
									ignorated.data.keywords[keywords[f]].trs.push(i);
								}				
							}
						}
					}
				}
			};
			
			methods.page_jump_buttons = function(tr, i) {
				var inbox;
				if (window.location.href.indexOf('inbox.php') > -1) {				
					inbox = true;
				}
				var td = tr.getElementsByTagName('td')[0];
				if (td) {
					var fr = td.getElementsByClassName('fr')[0];
					var insert = document.createElement('span');
					if (inbox) {
						insert.style.cssFloat = 'right';
					}
					topic = td.getElementsByTagName('a');
					var space = document.createTextNode(' ');
					var jumpWindow = document.createElement('a');
					jumpWindow.href = '##' + i;
					jumpWindow.id = 'jumpWindow';
					jumpWindow.innerHTML = '#';
					var jumpLast = document.createElement('a');
					jumpLast.href = '##' + i;
					jumpLast.id = 'jumpLast';
					jumpLast.innerHTML = '&gt;';
					insert.appendChild(jumpWindow);
					insert.appendChild(space);
					insert.appendChild(jumpLast);
					if (inbox) {
						td.appendChild(insert);				
					}
					else {
						fr.appendChild(insert);
					}
					var span = td.getElementsByTagName('span')[0];
					if (span) {
						var topic = span.getElementsByTagName('a');
						
						match = topic[0].href.match(/(topic|thread)=([0-9]+)/)
						if (match) {
							var tmp = match[2];						
							insert.innerHTML = '<a href="##' + tmp
									+ '" id="jumpWindow">#</a> <a href="##' + tmp
									+ '" id="jumpLast">&gt;</a>';
							fr.insertBefore(insert, null);
						}
					}
				}
			};
			
			methods.enable_keyword_highlight = function(tr) {
				var td = tr.getElementsByTagName('td')[0];
				var title = td.getElementsByTagName('a')[0];
				for (var keyword in CHROMELL.config.keyword_highlight_data) {
					// Only match whole word					
					var regex = new RegExp('\\b' + keyword + '\\b', 'g');
					if (title.innerHTML.match(regex)) {
						// Set dataset attributes for CSS
						title.dataset.keyword = keyword;
						td.dataset.keyword = keyword;						
						td.dataset.highlighted = true;
					}
				}
			};
			
			methods.enable_tag_highlight = function(tr) {
				var td = tr.getElementsByTagName('td')[0];
				var fr = td.getElementsByClassName('fr')[0]
				var tagsToCheck = fr.getElementsByTagName('a');
						
				for (var j = 0, len = tagsToCheck.length; j < len; j++) {
					var tagAnchor = tagsToCheck[j];
					var tagName = tagAnchor.innerHTML.toLowerCase();
					if (CHROMELL.config.tag_highlight_data[tagName]) {
						tagAnchor.dataset.tag = tagName;
						td.dataset.tag = tagName;						
						td.dataset.highlighted = true;				
					}
				}
			};
			
			methods.userhl_topiclist = function(tr) {
				if (CHROMELL.config.user_highlight_data[currentUser]) {		
					tr.dataset.user = currentUser;
					tr.dataset.highlighted = true;					
				}
			};
			
			methods.user_info_popup = function(tr) {
				// Add listeners to username anchors for user info popup
				var td = tr.getElementsByTagName('td')[1];
				var anchor = td.getElementsByTagName('a')[0];			
				// Anchor will be undefined if topic is anonymous
				if (anchor) {
					anchor.className = 'username_anchor';
					anchor.addEventListener('mouseenter', eventHandlers.mouseenter);
					anchor.addEventListener('mouseleave', eventHandlers.mouseleave);
				}
			};
			
			return {
				init: init,
				generateCss: generateCss,
				handlePopupClick: handlePopupClick
			};
			
		}();

		var eventHandlers = function() {
			var handlers = {};
			var popupDebouncer = '';
			
			handlers.clickEvent = function(evt) {
				if (evt.target.id.match(/(jump)([Last|Window])/)) {
					evt.preventDefault();
					var url = eventHandlers.pageJump(evt);
					if (url === 0) {
						return;
					}
					if (evt.which == 1) {
						// Left click - open in same tab
						window.location.href = url;
					}
					else if (evt.which == 2) {
						// Middle click - open new tab
						window.open(url);
					}
				}	
			};
			
			handlers.mouseenter = function(evt) {
				// Store reference to allPages.utils.popup to access from popupDebouncer anon function
				var popupMenu = CHROMELL.allPages.utils.popup;
				
				CHROMELL.allPages.cacheEvent(evt);
				
				popupDebouncer = setTimeout(function() {
						popupMenu.init();
						document.getElementsByClassName('body')[0].style.opacity = 0.7;
				}, 750);
				
			};
			
			handlers.mouseleave = function(evt) {
				clearTimeout(popupDebouncer);
			};
			
			handlers.message = function(msg) {
				switch (msg.action) {
					case 'showIgnorated':
						var ignoredTopics = document.querySelectorAll('[ignored]');
						for (var i = 0, len = ignoredTopics.length; i < len; i++) {
							ignoredTopics[i].style.display = '';
							ignoredTopics[i].style.opacity = '.7';	
						}
						break;
						
					default:
						if (CHROMELL.config.debug) {
							console.log('invalid action', msg);
						}
						break;
				}
			};
			
			handlers.pageJump = function(evt) {
				var a, history, inbox;
				
					// Find element containing post count so we can work out last page number
				if (window.location.href.indexOf('history.php') > -1) {
					history = true;
					a = evt.target.parentNode.parentNode.parentNode.parentNode
							.parentNode.getElementsByTagName('td')[2];
				}
				else if (window.location.href.indexOf('inbox.php') > -1) {
					inbox = true;
					a = evt.target.parentNode.parentNode.nextSibling.nextSibling;
				}
				else {
					a = evt.target.parentNode.parentNode.parentNode.parentNode
							.getElementsByTagName('td')[2];
				}
				
				
				var last = Math.ceil(a.innerHTML.split('<')[0] / 50);	
				
				if (evt.target.id == 'jumpWindow') {
					pg = prompt("Page Number (" + last + " total)", "Page");
					
					if (pg == undefined || pg == "Page") {
						return 0;
					}
					
				} 
				
				else {
					pg = last;
				}
				
				
				if (history) {
					return evt.target.parentNode.parentNode.parentNode.getElementsByTagName('a')[0].href
							+ '&page=' + pg;
				}
				
				else if (inbox) {
						if (evt.target.parentNode.parentNode.firstChild.firstChild.href) {
							return evt.target.parentNode.parentNode.firstChild.firstChild.href 
									+ '&page=' + pg;
						}
						else {
							return evt.target.parentNode.parentNode.firstChild.href 
									+ '&page=' + pg;							
						}
				}
				
				else {
					return evt.target.parentNode.parentNode.parentNode.parentNode
							.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href
							+ '&page=' + pg;
				}
			};
			
			return handlers;
			
		}();		
		
		// Get config from background page and call init method
		CHROMELL.getConfig(init);
		
		return {
			DOM: DOM,
			buildArraysFromConfig: buildArraysFromConfig,
			eventHandlers: eventHandlers
		};
		
	}();
	
	return CHROMELL;
	
})( CHROMELL || {} );
