(function(CHROMELL) {
	
	CHROMELL.topicList = function() {
		
		var globalPort = chrome.runtime.connect();
		
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
			
			if (document.readyState == 'loading') {
				document.addEventListener('DOMContentLoaded', function() {
					DOM.init();
				});
			}
			else {
				// DOM was already loaded			
				DOM.init();
			}		
		};	
		
		var prepareArrays = function() {
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
			for (var i = 0; CHROMELL.config.keyword_highlight_data[i]; i++) {
				highlight.keywords[i] = {};
				highlight.keywords[i].bg = CHROMELL.config.keyword_highlight_data[i].bg;
				highlight.keywords[i].color = CHROMELL.config.keyword_highlight_data[i].color;
				highlight.keywords[i].match = CHROMELL.config.keyword_highlight_data[i].match
						.split(',');
			}
			for (var i = 0; CHROMELL.config.tag_highlight_data[i]; i++) {
				highlight.tags[i] = {};	
				highlight.tags[i].bg = CHROMELL.config.tag_highlight_data[i].bg;
				highlight.tags[i].color = CHROMELL.config.tag_highlight_data[i].color;	
				highlight.tags[i].match = CHROMELL.config.tag_highlight_data[i].match.split(',');
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
		
		var highlight = {
			keywords: {},
			tags: {}
		};
		
		var ignorated = {
			total_ignored: 0,
			data: {
				users: {},
				keywords: {}
			}
		};			
		
		var DOM = function() {
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
							var username = td.getElementsByTagName('a')[0];					
							if (td.getElementsByTagName('a')[0]
									&& td.getElementsByTagName('a')[0].innerHTML
											.toLowerCase() == ignores[f]) {
								tr.setAttribute('ignored', true);
								if (CHROMELL.config.debug) {
									console
											.log('found topic to remove: \"'
													+ tr.getElementsByTagName('td')[0]
															.getElementsByTagName('a')[0].innerHTML
															.toLowerCase()
													+ "\" author: " + ignores[f]
													+ " topic: " + i);
								}
								tr.style.display = 'none';
								ignorated.total_ignored++;
								if (!ignorated.data.users[ignores[f]]) {
									ignorated.data.users[ignores[f]] = {};
									ignorated.data.users[ignores[f]].total = 1;
									ignorated.data.users[ignores[f]].trs = [i];
								} else {
									ignorated.data.users[ignores[f]].total++;
									ignorated.data.users[ignores[f]].trs.push(i);
								}				
							}
						}
					}
				}
			};
			
			methods.ignore_keyword = function(tr, i) {
				if (!CHROMELL.config.ignore_keyword_list) {
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
							} else {
								reg = keywords[f];
							}
							match = username.match(reg);
						} else {
							match = username.toLowerCase().indexOf(
											keywords[f].toLowerCase()) != -1;
						}
						if (match) {
							if (CHROMELL.config.debug) {
								console
										.log('found topic to remove: \"'
												+ tr.getElementsByTagName('td')[0]
														.getElementsByTagName('a')[0].innerHTML
														.toLowerCase()
												+ "\" keyword: " + keywords[f]
												+ " topic: " + i);
							}
							title.parentNode.style.display = 'none';
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
					if (!CHROMELL.config.page_jump_buttons_pm) {
						return;
					}
					inbox = true;
				}
				var insert;
				var tmp, topic;
				var td = tr.getElementsByTagName('td')[0];
				if (td) {
					insert = document.createElement('span');
					if (inbox) {
						insert.style.cssFloat = 'right';
					}
					try {
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
							td.getElementsByClassName('fr')[0].appendChild(insert);
						}					
					} catch (e) {
						if (CHROMELL.config.debug) {
							console.log('locked topic?');
						}
						var span = td.getElementsByTagName('span')[0];
						if (span) { 
							topic = span.getElementsByTagName('a');
							tmp = topic[0].href.match(/(topic|thread)=([0-9]+)/)[2];
							insert.innerHTML = '<a href="##' + tmp
									+ '" id="jumpWindow">#</a> <a href="##' + tmp
									+ '" id="jumpLast">&gt;</a>';
							td.getElementsByClassName('fr')[0].insertBefore(
									insert, null);
						}
					}
				}
			};
			
			methods.enable_keyword_highlight = function(tr) {
				var title;
				var keys = highlight.keywords;
				if (!keys) {
					return;
				}
				var re = false;
				title = tr.getElementsByTagName('td')[0]
						.getElementsByClassName('fl')[0].getElementsByTagName('a')[0].innerHTML;
				for (var j = 0; keys[j]; j++) {
					for (var k = 0; keys[j].match[k]; k++) {
						if (keys[j].match[k].substring(0, 1) == '/') {
							var reg = new RegExp(keys[j].match[k].substring(1,
									keys[j].match[k].lastIndexOf('/')),
									keys[j].match[k].substring(keys[j].match[k]
											.lastIndexOf('/') + 1,
											keys[j].match[k].length));
							match = title.match(reg);
						} else {
							reg = keys[j].match[k].toLowerCase();
							var match = title.toLowerCase().indexOf(reg) != -1;
						}
						if (match) {
							var node = tr.getElementsByTagName('td')[0];
							var nodeAnchors = node.getElementsByTagName('a');
							node.setAttribute('highlighted', true);
							node.style.background = '#' + keys[j].bg;
							node.style.color = '#' + keys[j].color;
							for (var m = 0, anchorLen = nodeAnchors.length; m < anchorLen; m++) {
								var nodeAnchor = nodeAnchors[m];
								nodeAnchor.style.color = '#' + keys[j].color;
							}
							if (CHROMELL.config.debug) {
								console.log('highlight topic ' + title
										+ ' keyword ' + reg);
							}							
						}
					}
				}
			};
			
			methods.enable_tag_highlight = function(tr) {
				var highlightTags = highlight.tags;
				if (!highlightTags) {
					return;
				}
				var tagsToCheck = tr.getElementsByTagName('td')[0]
						.getElementsByClassName('fr')[0].getElementsByTagName('a');			
				for (var j = 0, len = tagsToCheck.length; j < len; j++) {
					tagToCheck = tagsToCheck[j];		
					for (var k = 0; highlightTags[k]; k++) {
						for (var l = 0; highlightTags[k].match[l]; l++) {
							var highlightTag = highlightTags[k].match[l];
							if (tagToCheck.innerHTML.toLowerCase()
									.match(highlightTag)) {
								var node = tr.getElementsByTagName('td')[0];
								var nodeAnchors = node.getElementsByTagName('a');
								node.setAttribute('highlighted', true);
								node.style.background = '#' + highlightTags[k].bg;
								node.style.color = '#' + highlightTags[k].color;							
								for (var n = 0, anchorLen = nodeAnchors.length; n < anchorLen; n++) {
									nodeAnchor = nodeAnchors[n];
									nodeAnchor.style.color = '#' + highlightTags[k].color;
								}
								if (CHROMELL.config.debug) {
									console.log('highlight topic ' + tr
											+ ' tag ' + highlightTags[k].match[l]);
								}					
							}
						}
					}
				}
			};
			
			methods.userhl_topiclist = function(tr) {
				if (!CHROMELL.config.enable_user_highlight) {
					return;
				}
				var user;
				var highlightData = CHROMELL.config.user_highlight_data;
				if (tr.getElementsByTagName('td')[1]
						.getElementsByTagName('a')[0]) {
					user = tr.getElementsByTagName('td')[1]
							.getElementsByTagName('a')[0].innerHTML.toLowerCase();
					if (highlightData[user]) {
						if (CHROMELL.config.debug) {
							console.log('highlighting topic by ' + user);
						}
						tr.setAttribute('highlighted', true);
						var tds = tr.getElementsByTagName('td');
						for (var j = 0, tdsLen = tds.length; j < tdsLen; j++) {
							var td = tds[j];
							td.setAttribute('highlighted', true);
							var tdAnchors = td.getElementsByTagName('a');
							td.style.background = '#'	+ highlightData[user].bg;
							td.style.color = '#' + highlightData[user].color;
							for (var k = 0, anchorLen = tdAnchors.length; k < anchorLen; k++) {
								var anchor = tdAnchors[k];
								anchor.setAttribute('highlighted', true);
								anchor.style.color = '#' + highlightData[user].color;
							}				
						}
					}
				}
			};
			
			methods.zebra_tables = function(tr, i) {
				if (i % 2 === 0) {
					for (var j = 0; tr.getElementsByTagName('td')[j]; j++) {
						if (tr.getElementsByTagName('td')[j].style.background === '') {
							tr.getElementsByTagName('td')[j].style.background = '#'
									+ CHROMELL.config.zebra_tables_color;
						}
					}
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
							}
							else {
								for (var k in methods) {
									if (CHROMELL.config[k + pm]) {
										methods[k](tr, j);
									}
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
