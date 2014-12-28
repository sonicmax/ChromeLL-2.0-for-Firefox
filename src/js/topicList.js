var topicList = {
	ignore: {
		users: [],
		keywords: []
	},
	highlight: {
		keywords: {},
		tags: {}
	},
	config: {},
	ignorated: {
		total_ignored: 0,
		data: {
			users: {},
			keywords: {}
		}
	},
	mainFunctions: {
		ignorator_topiclist: function(tr, i) {
			var ignores = topicList.ignore.users;
			if (!ignores) {
				return;
			}
			var td = tr.getElementsByTagName('td')[1];	
			for (var f = 0, len = ignores.length; f < len; f++) {
				if (td.innerHTML.indexOf('<td>Human</td>') > -1) {
					return;
				}
				var username = td.getElementsByTagName('a')[0];
				if (td.getElementsByTagName('a')[0]
						&& td.getElementsByTagName('a')[0].innerHTML
								.toLowerCase() == ignores[f]) {
					if (topicList.config.debug) {
						console
								.log('found topic to remove: \"'
										+ tr.getElementsByTagName('td')[0]
												.getElementsByTagName('a')[0].innerHTML
												.toLowerCase()
										+ "\" author: " + ignores[f]
										+ " topic: " + i);
					}
					tr.style.display = 'none';
					topicList.ignorated.total_ignored++;
					if (!topicList.ignorated.data.users[ignores[f]]) {
						topicList.ignorated.data.users[ignores[f]] = {};
						topicList.ignorated.data.users[ignores[f]].total = 1;
						topicList.ignorated.data.users[ignores[f]].trs = [ i ];
					} else {
						topicList.ignorated.data.users[ignores[f]].total++;
						topicList.ignorated.data.users[ignores[f]].trs.push(i);
					}
				}
			}
		},
		ignore_keyword: function(tr, i) {
			if (!topicList.config.ignore_keyword_list) {
				return;
			}
			var re = false;
			var keywords = topicList.ignore.keywords;
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
						if (topicList.config.debug) {
							console
									.log('found topic to remove: \"'
											+ tr.getElementsByTagName('td')[0]
													.getElementsByTagName('a')[0].innerHTML
													.toLowerCase()
											+ "\" keyword: " + keywords[f]
											+ " topic: " + i);
						}
						title.parentNode.style.display = 'none';
						topicList.ignorated.total_ignored++;
						if (!topicList.ignorated.data.keywords[keywords[f]]) {
							topicList.ignorated.data.keywords[keywords[f]] = {};
							topicList.ignorated.data.keywords[keywords[f]].total = 1;
							topicList.ignorated.data.keywords[keywords[f]].trs = [ i ];
						} else {
							topicList.ignorated.data.keywords[keywords[f]].total++;
							topicList.ignorated.data.keywords[keywords[f]].trs.push(i);
						}
					}
				}
			}
		},
		/*append_tags: function(tr) {
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
		},*/
		page_jump_buttons: function(tr, i) {
			var inbox;
			if (window.location.href.indexOf('inbox.php') > -1) {
				if (!topicList.config.page_jump_buttons_pm) {
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
					if (topicList.config.debug) {
						console.log('locked topic?');
					}
					topic = td.getElementsByTagName('span')[0]
							.getElementsByTagName('a');
					tmp = topic[0].href.match(/(topic|thread)=([0-9]+)/)[2];
					insert.innerHTML = '<a href="##' + tmp
							+ '" id="jumpWindow">#</a> <a href="##' + tmp
							+ '" id="jumpLast">&gt;</a>';
					td.getElementsByClassName('fr')[0].insertBefore(
							insert, null);
				}
			}
		},
		enable_keyword_highlight: function(tr) {
			var title;
			var keys = topicList.highlight.keywords;
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
							node.style.background = '#' + keys[j].bg;
							node.style.color = '#' + keys[j].color;
							for (var m = 0, anchorLen = nodeAnchors.length; m < anchorLen; m++) {
								var nodeAnchor = nodeAnchors[m];
								nodeAnchor.style.color = '#' + keys[j].color;
							}
							if (topicList.config.debug) {
								console.log('highlight topic ' + title
										+ ' keyword ' + reg);
							}
						}
					}
				}
		},
		enable_tag_highlight: function(tr) {
			var highlightTags = topicList.highlight.tags;
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
							node.style.background = '#' + highlightTags[k].bg;
							node.style.color = '#' + highlightTags[k].color;							
							for (var n = 0, anchorLen = nodeAnchors.length; n < anchorLen; n++) {
								nodeAnchor = nodeAnchors[n];
								nodeAnchor.style.color = '#' + highlightTags[k].color;
							}
						}
						if (topicList.config.debug) {
							console.log('highlight topic ' + tr
									+ ' tag ' + highlightTags[k].match[l]);
						}
					}
				}
			}
		},
		userhl_topiclist: function(tr) {
			if (!topicList.config.enable_user_highlight) {
				return;
			}
			var user;
			var highlightData = topicList.config.user_highlight_data;
			if (tr.getElementsByTagName('td')[1]
					.getElementsByTagName('a')[0]) {
				user = tr.getElementsByTagName('td')[1]
						.getElementsByTagName('a')[0].innerHTML.toLowerCase();
				if (highlightData[user]) {
					if (topicList.config.debug) {
						console.log('highlighting topic by ' + user);
					}
					var tds = tr.getElementsByTagName('td');
					for (var j = 0, tdsLen = tds.length; j < tdsLen; j++) {
						var td = tds[j];
						var tdAnchors = td.getElementsByTagName('a');
						td.style.background = '#'	+ highlightData[user].bg;
						td.style.color = '#' + highlightData[user].color;
						for (var k = 0, anchorLen = tdAnchors.length; k < anchorLen; k++) {
							var anchor = tdAnchors[k];
							anchor.style.color = '#' + highlightData[user].color;
						}				
					}
				}
			}
		},
		zebra_tables: function(tr, i) {
			if (i % 2 === 0) {
				for (var j = 0; tr.getElementsByTagName('td')[j]; j++) {
					if (tr.getElementsByTagName('td')[j].style.background === '') {
						tr.getElementsByTagName('td')[j].style.background = '#'
								+ topicList.config.zebra_tables_color;
					}
				}
			}
		}
	},
	prepareArrays: function() {
		// prepare ignorator arrays for topicList functions
		if (topicList.config.ignorator_list) {
			if (topicList.config.ignorator_list.indexOf(',') == -1) {
				// ignorator list only has one user
				topicList.ignore.users[0] = topicList.config.ignorator_list.toLowerCase()
			}
			else {
				// split comma separated list into array
				var ignore_users = topicList.config.ignorator_list.split(',');
				for (var i = 0, len = ignore_users.length; i < len; i++) {
					topicList.ignore.users[i] = ignore_users[i].toLowerCase().trim();
				}
			}
		}
		if (topicList.config.ignore_keyword_list) {
			if (topicList.config.ignore_keyword_list.indexOf(',') == -1) {
				topicList.ignore.keywords[0] = topicList.config.ignore_keyword_list;
			}
			else {
				var ignore_words = topicList.config.ignore_keyword_list.split(',');		
				for (var i = 0, len = ignore_words.length; i < len; i++) {
					topicList.ignore.keywords[i] = ignore_words[i]
							.toLowerCase().trim();
				}
			}
		}
		for (var i = 0; topicList.config.keyword_highlight_data[i]; i++) {
			topicList.highlight.keywords[i] = {};
			topicList.highlight.keywords[i].bg = topicList.config.keyword_highlight_data[i].bg;
			topicList.highlight.keywords[i].color = topicList.config.keyword_highlight_data[i].color;
			topicList.highlight.keywords[i].match = topicList.config.keyword_highlight_data[i].match
					.split(',');
		}
		for (var i = 0; topicList.config.tag_highlight_data[i]; i++) {
			topicList.highlight.tags[i] = {};	
			topicList.highlight.tags[i].bg = topicList.config.tag_highlight_data[i].bg;
			topicList.highlight.tags[i].color = topicList.config.tag_highlight_data[i].color;	
			topicList.highlight.tags[i].match = topicList.config.tag_highlight_data[i].match.split(',');
		}
	},
	jumpHandlerTopic: function(ev) {
		var a, history, inbox;
		if (window.location.href.indexOf('history.php') > -1) {
			history = true;
			a = ev.target.parentNode.parentNode.parentNode.parentNode
					.parentNode.getElementsByTagName('td')[2];
		}
		else if (window.location.href.indexOf('inbox.php') > -1) {
			inbox = true;
			a = ev.target.parentNode.parentNode.nextSibling.nextSibling;
		}
		else {
			a = ev.target.parentNode.parentNode.parentNode.parentNode
					.getElementsByTagName('td')[2];
		}
		var last = Math.ceil(a.innerHTML.split('<')[0] / 50);
		if (ev.target.id == 'jumpWindow') {
			pg = prompt("Page Number (" + last + " total)", "Page");
			if (pg == undefined || pg == "Page") {
				return 0;
			}
		} else {
			pg = last;
		}
		if (history) {
			return ev.target.parentNode.parentNode.parentNode.getElementsByTagName('a')[0].href
					+ '&page=' + pg;
		}
		else if (inbox) {
			return ev.target.parentNode.parentNode.firstChild.href 
					+ '&page=' + pg;
		}
		else {
			return ev.target.parentNode.parentNode.parentNode.parentNode
					.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href
					+ '&page=' + pg;
		}
	},
	checkTags: function() {
		var atags = document.getElementById('bookmarks').getElementsByTagName(
				'span');
		var ctags = {};
		var tag, name;
		for (var i = 0, len = atags.length; i < len; i++) {
			tag = atags[i];
			if (!atags[i].className) {
				name = atags[i].getElementsByTagName('a')[0].innerHTML;
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
	},
	callFunctions: function(pm) {
		var trs = document.getElementsByClassName('grid')[0]
				.getElementsByTagName('tr');
		var tr;
		var functions = topicList.mainFunctions;
		var config = topicList.config;
		// iterate over trs and pass tr nodes to topicList functions
		// (ignoring trs[0] as it's not a topic)
		for (j = 1, len = trs.length; j < len; j++) {
		 tr = trs[j];
			for (var i in functions) {
				if (config[i + pm]) {
					// pass tr node & index to function
					functions[i](tr, j);
				}
			}
		}
		// scrape bookmarked tags from page
		try {
			topicList.checkTags();
		} catch (e) {
			console.log("Error finding tags");
		}
		// send ignorator data to background script
		topicList.globalPort.postMessage({
			action: 'ignorator_update',
			ignorator: topicList.ignorated,
			scope: "topicList"
		});		
	},
	addListeners: function() {
		document.body.addEventListener('click', function(ev) {
			if (ev.target.id.match(/(jump)([Last|Window])/)) {
				ev.preventDefault();
				var url = topicList.jumpHandlerTopic(ev);
				if (url === 0) {
					return;
				}
				if (ev.which == 1) {
					// left click - open in same tab
					window.location.href = url;
				}
				else if (ev.which == 2) {
					// middle click - open new tab
					window.open(url);
				}
			}
		});
	},
	init: function() {
		// connect to background page
		topicList.globalPort = chrome.runtime.connect();
		// request config
		chrome.runtime.sendMessage({
			need: "config"
		}, function(conf) {
			topicList.config = conf.data;
			// set up ignorator/highlighter arrays
			topicList.prepareArrays();
			if (topicList.config.dramalinks) {
				dramalinks.config = topicList.config;
				dramalinks.init();
			}				
			var pm = '';
			if (window.location.href.match('inbox.php'))
				pm = "_pm";
			// add listener to handle showIgnorated request from popup menu
			topicList.globalPort.onMessage.addListener(function(msg) {
				if (msg.action !== 'ignorator_update') {
					switch (msg.action) {
						case "showIgnorated":
							if (topicList.config.debug) {
								console.log("showing hidden trs", msg.ids);
							}
							var tr = document.getElementsByTagName('tr');
							for (var i; i = msg.ids.pop();) {
								tr[i].style.display = '';
								tr[i].style.opacity = '.7';
							}
							break;
						default:
							if (topicList.config.debug) {
								console.log('invalid action', msg);
							}
							break;
					}
				}
			});
			if (document.readyState == 'loading') {
				// wait for DOM to load before calling topicList functions
				document.addEventListener('DOMContentLoaded', function() {
					topicList.callFunctions(pm);					
					if (topicList.config.page_jump_buttons 
							|| topicList.config.page_jump_buttons_pm) {
						topicList.addListeners();
					}
				});
			} else {
				// DOM is ready - call topicList functions
				topicList.callFunctions(pm);					
				if (topicList.config.page_jump_buttons 
						|| topicList.config.page_jump_buttons_pm) {
					topicList.addListeners();
				}
			}
		});
	}
};

topicList.init();
