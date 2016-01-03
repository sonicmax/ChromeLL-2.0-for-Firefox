(function(CHROMELL) {
	
	CHROMELL.topicList = function() {
		
		var globalPort = CHROMELL.globalPort;
		
		var pm = '';	
		
		var init = function() {
			globalPort.onMessage.addListener(eventHandlers.message);
			prepareArrays();
			
			if (window.location.href.match(/topics/)) {
				if (CHROMELL.config.dramalinks) {
					chrome.runtime.sendMessage({
							need : "dramalinks"
					}, function(response) {
						dramalinks.html = response.data;
					});
				}
			}
			else if (window.location.href.match(/inbox.php/)) {
				pm = "_pm";
			}
				
			CHROMELL.whenDOMReady(DOM.init);
		};	
		
		var prepareArrays = function() {
			// Convert strings from ignorator config values into arrays of lowercase usernames.
			// (this can be done before DOM has loaded)
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

		var addListeners = function() {
			document.addEventListener('click', eventHandlers.clickEvent);	
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
			// Keep track of highlight data 
			var tagsToHighlight = {};
			var keywordsToHighlight = {};
			var usersToHighlight = {};
			
			var makeCSSAttributeName = function(value, type) {
				// Takes value to be used for CSS attribute and type of attribute (user, keyword, etc), returns CSS atribute name				
				var suffix = type || '';
				var valueToReturn = value.replace(/[^a-zA-Z0-9]/g, '');
				return suffix += valueToReturn;
			};
			
			var convertHexToRGB = function(hex, alpha) {
				// Takes hex triplet and returns values of colour in RGB form (or RGBA, if alpha value is provided)
				var rgb;
				(typeof alpha == 'number') ? rgb = 'rgba(' : rgb = 'rgb(';
				// Convert each byte of hex triplet and add to rgb string
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
			
			var addCSSRules = function() {
				var styleSheet = document.styleSheets[0];	
				
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
					var data = CHROMELL.config.keyword_highlight_data;
					for (var i in data) {
						var keyword = data[i];						
						var bg = keyword.bg;
						var color = keyword.color;							
						var rgbaStart = convertHexToRGB(bg, 0.4);
						var rgbaEnd = convertHexToRGB(bg, 0.4);
						
						keywordsToHighlight[keyword.match] = true;
						var keywordAttribute = makeCSSAttributeName(keyword.match, 'keyword_');			
						
						// Highlight anchor tag containing match.
						
						// Use flat gradient for background, using alpha of 0.9 - this allows us to highlight <mark> elements 
						// in the anchor tag innerHTML without changing the colour scheme (as matched keyword will have brighter
						// background)
						
						styleSheet.addRule('a[' + keywordAttribute + ']', 'background: linear-gradient(to right, ' 
								+ rgbaStart + ' 0%, '
								+ rgbaEnd + ' 100%) !important');
								
						styleSheet.addRule('a[' + keywordAttribute + ']', 'color: #' + color + ' !important');

						// Highlight matched keyword.						
						styleSheet.addRule('mark[' + keywordAttribute + ']', 'background: #' + bg + ' !important');
						styleSheet.addRule('mark[' + keywordAttribute + ']', 'color: #' + color + ' !important');						
						
					}
				}

				if (CHROMELL.config.enable_tag_highlight) {
					var data = CHROMELL.config.tag_highlight_data;
					for (var i in data) {
						var tag = data[i];
						var bg = tag.bg;
						var color = tag.color;
						var rgbaStart = convertHexToRGB(bg, 0.8);
						var rgbaEnd = convertHexToRGB(bg, 0);						
						tagsToHighlight[tag.match] = true;
						var tagAttribute = makeCSSAttributeName(tag.match, 'tag_');
						
						// Highlight td element containing tags to be highlighted (can be overridden by user highlight)
						styleSheet.addRule('table.grid td.oh[' + tagAttribute + ']', 'background: #' + bg);
						styleSheet.addRule('table.grid td.oh[' + tagAttribute + ']', 'color: #' + color);
						styleSheet.addRule('table.grid td.oh[' + tagAttribute + '] a', 'color: #' + color);
						
						// Use !important radial gradient for background of tag anchor (in case td highlight has been overridden)
						styleSheet.addRule('a[' + tagAttribute + ']', 'background: radial-gradient(ellipse at center, ' 
								+ rgbaStart + ' 0%, '
								+ rgbaStart + ' 70%, '
								+ rgbaEnd + ' 100%) !important');
								
						styleSheet.addRule('a[' + tagAttribute + ']', 'color: ' + color);
							
					}		
				}		
			
				if (CHROMELL.config.enable_user_highlight) {
					var data = CHROMELL.config.user_highlight_data;
					for (var name in data) {						
						var user = data[name];
						var bg = user.bg;
						var color = user.color;
						usersToHighlight[name] = true;
						var userAttribute = makeCSSAttributeName(name, 'user_');
						
						// User highlights are allowed to override any other type of highlight, with exception of anchor tags																
						styleSheet.addRule('table.grid tr[' + userAttribute + '] td', 'background: #' + bg + ' !important');
						styleSheet.addRule('table.grid tr[' + userAttribute + '] td', 'color: #' + color + ' !important');
						styleSheet.addRule('table.grid tr[' + userAttribute + '] a', 'background: #' + bg);
						styleSheet.addRule('table.grid tr[' + userAttribute + '] a', 'color: #' + color);						
					
						styleSheet.addRule('table.grid tr[' + userAttribute + '] a.username_anchor', 'background: #' + bg + ' !important');
						styleSheet.addRule('table.grid tr[' + userAttribute + '] a.username_anchor', 'color: #' + color + ' !important');
					}	
				}

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
				/*if (!CHROMELL.config.ignore_keyword_list) {
					return;
				}
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
				}*/
			};
			
			/*methods.append_tags = function(tr) {
				for (var i = 0; i < tags.length; i++) {
					var tag_children = tags[i].children;
					for (var j = 0; j < tag_children.length; j++) {
						if (tag_children[j].textContent.indexOf('NWS') != -1
								|| tag_children[j].textContent.indexOf('NLS') != -1) {
							var temp_link = tag_children[j];
							tags[i].removeChild(temp_link);
							var temp_tag_name = temp_link.textContent;
							var text_color = document.createElement("font");
							text_color.setAttribute("color", "red");
							tags[i].previousSibling.appendChild(temp_link);
							tags[i].previousSibling.lastChild.textContent = " ";
							tags[i].previousSibling.lastChild.appendChild(text_color);
							tags[i].previousSibling.lastChild.lastChild.textContent = "   "
									+ temp_tag_name + "";

						}
					}
				}
			};*/
			
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
				for (var word in keywordsToHighlight) {
					// Only match whole word					
					var regex = new RegExp('\\b' + word + '\\b', 'g');
					if (title.innerHTML.match(regex)) {
						var htmlString = '<mark keyword_' + word + '="true">' + word + '</mark>';						
						// Wrap matches with tags so we can highlight individual words in title
						title.innerHTML = title.innerHTML.replace(regex, htmlString);
						var keywordAttribute = makeCSSAttributeName(word, 'keyword_');
						td.setAttribute('highlighted', true);
						td.setAttribute(keywordAttribute, true);
						title.setAttribute(keywordAttribute, true);
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
					if (tagsToHighlight[tagName]) {
						var tagAttribute = makeCSSAttributeName(tagName, 'tag_');
						td.setAttribute('highlighted', true);
						td.setAttribute(tagAttribute, true);							
						tagAnchor.setAttribute(tagAttribute, true);						
					}
				}
			};
			
			methods.userhl_topiclist = function(tr) {
				if (usersToHighlight[currentUser]) {
					var userAttribute = makeCSSAttributeName(currentUser, 'user_');
					tr.setAttribute('highlighted', true);
					tr.setAttribute(userAttribute, true);
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
				init: function() {
					addCSSRules();
					
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
							
							// Check that anchor tag is located here, so we know it's not an anonymous topic
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
							}
						}
					}
					
					if (CHROMELL.config['page_jump_buttons' + pm]) {
						addListeners();
					}		
					
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
				}		
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
				CHROMELL.allPages.cacheEvent(evt);
				// Store reference to allPages.utils.popup, as we can't access it from setTimeout
				var popupMenu = CHROMELL.allPages.utils.popup;
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
					case 'ignorator_update':
						// Do nothing - handled elsewhere (included here to prevent unnecessary debug logs)
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
				} else {
					pg = last;
				}
				if (history) {
					return evt.target.parentNode.parentNode.parentNode.getElementsByTagName('a')[0].href
							+ '&page=' + pg;
				}
				else if (inbox) {
					return evt.target.parentNode.parentNode.firstChild.href 
							+ '&page=' + pg;
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
			eventHandlers: eventHandlers
		};
		
	}();
	
	return CHROMELL;
	
})( CHROMELL || {} );
