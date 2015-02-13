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
	index: 1,
	pm: '',
	functions: {
		ignorator_topiclist: function(tr, i) {
			var ignores = topicList.ignore.users;
			if (!ignores) {
				return;
			}
			var td = tr.getElementsByTagName('td')[1];
			for (var f = 0, len = ignores.length; f < len; f++) {
				if (!td || td.innerHTML.indexOf('<td>Human</td>') > -1) {
					console.log(tr);
					return;
				}
				else {
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
							topicList.ignorated.data.users[ignores[f]].trs = [i];
						} else {
							topicList.ignorated.data.users[ignores[f]].total++;
							topicList.ignorated.data.users[ignores[f]].trs.push(i);
						}
						if (!topicList.config.hide_ignorator_badge) {
							topicList.globalPort.postMessage({
								action: 'ignorator_update',
								ignorator: topicList.ignorated,
								scope: "topicList"
							});
						}						
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
						if (!topicList.config.hide_ignorator_badge) {
							topicList.globalPort.postMessage({
								action: 'ignorator_update',
								ignorator: topicList.ignorated,
								scope: "topicList"
							});
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
							node.setAttribute('highlighted', true);
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
							node.setAttribute('highlighted', true);
							node.style.background = '#' + highlightTags[k].bg;
							node.style.color = '#' + highlightTags[k].color;							
							for (var n = 0, anchorLen = nodeAnchors.length; n < anchorLen; n++) {
								nodeAnchor = nodeAnchors[n];
								nodeAnchor.style.color = '#' + highlightTags[k].color;
							}
							if (topicList.config.debug) {
								console.log('highlight topic ' + tr
										+ ' tag ' + highlightTags[k].match[l]);
							}					
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
		if (this.config.ignorator_list) {
			if (this.config.ignorator_list.indexOf(',') == -1) {
				// ignorator list only has one user
				this.ignore.users[0] = this.config.ignorator_list.toLowerCase()
			}
			else {
				// split comma separated list into array
				var ignore_users = this.config.ignorator_list.split(',');
				for (var i = 0, len = ignore_users.length; i < len; i++) {
					this.ignore.users[i] = ignore_users[i].toLowerCase().trim();
				}
			}
		}
		if (this.config.ignore_keyword_list) {
			if (this.config.ignore_keyword_list.indexOf(',') == -1) {
				this.ignore.keywords[0] = this.config.ignore_keyword_list;
			}
			else {
				var ignore_words = this.config.ignore_keyword_list.split(',');		
				for (var i = 0, len = ignore_words.length; i < len; i++) {
					this.ignore.keywords[i] = ignore_words[i]
							.toLowerCase().trim();
				}
			}
		}
		for (var i = 0; this.config.keyword_highlight_data[i]; i++) {
			this.highlight.keywords[i] = {};
			this.highlight.keywords[i].bg = this.config.keyword_highlight_data[i].bg;
			this.highlight.keywords[i].color = this.config.keyword_highlight_data[i].color;
			this.highlight.keywords[i].match = this.config.keyword_highlight_data[i].match
					.split(',');
		}
		for (var i = 0; this.config.tag_highlight_data[i]; i++) {
			this.highlight.tags[i] = {};	
			this.highlight.tags[i].bg = this.config.tag_highlight_data[i].bg;
			this.highlight.tags[i].color = this.config.tag_highlight_data[i].color;	
			this.highlight.tags[i].match = this.config.tag_highlight_data[i].match.split(',');
		}
	},
	checkTags: function() {
		var atags = document.getElementById('bookmarks')
				.getElementsByTagName('span');
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
		var functions = topicList.functions;
		var config = topicList.config;
		// iterate over trs and pass tr nodes to topicList functions
		// (ignoring trs[0] as it's not a topic)
		for (j = 1, len = trs.length; j < len; j++) {
		 tr = trs[j];
			for (var i in functions) {
				if (config[i + pm]) {
					functions[i](tr, j);
				}
			}
		}
		var element = document.getElementsByTagName('h1')[0];
		dramalinks.appendTo(element);
		if (this.config['page_jump_buttons' + this.pm]) {
			this.addListeners();
		}		
		try {
			topicList.checkTags();
		} catch (e) {
			console.log("Error finding tags");
		}
		if (!this.config.hide_ignorator_badge) {
			// send ignorator data to background script
			topicList.globalPort.postMessage({
				action: 'ignorator_update',
				ignorator: topicList.ignorated,
				scope: "topicList"
			});
		}
	},
	addListeners: function() {
		document.addEventListener('click', function(evt) {
			if (evt.target.id.match(/(jump)([Last|Window])/)) {
				evt.preventDefault();
				var url = topicList.handle.pageJump(evt);
				if (url === 0) {
					return;
				}
				if (evt.which == 1) {
					// left click - open in same tab
					window.location.href = url;
				}
				else if (evt.which == 2) {
					// middle click - open new tab
					window.open(url);
				}
			}
		});
	},
	handle: {
		message: function(msg) {
			if (msg.action !== 'ignorator_update') {
				switch (msg.action) {
					case "showIgnorated":
						if (this.config.debug) {
							console.log("showing hidden trs", msg.ids);
						}
						var tr = document.getElementsByTagName('tr');
						for (var i; i = msg.ids.pop();) {
							tr[i].style.display = '';
							tr[i].style.opacity = '.7';
						}
						break;
					default:
						if (this.config.debug) {
							console.log('invalid action', msg);
						}
						break;
				}
			}
		},
		loadEvent: function() {			
			if (this.config['page_jump_buttons' + this.pm]) {
				this.addListeners();
			}
		},
		pageJump: function(evt) {
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
		}
	},
	passToFunctions: function(tr) {
		var functions = this.functions;
		var config = this.config;
		var index = this.index;
		var pm = this.pm;
		for (var functionName in functions) {
			if (config[functionName + pm]) {
				functions[functionName](tr, index);
			}
		}
		this.index++;
	},
	initObserver: new MutationObserver(function(mutations) {
		for (var i = 0, len = mutations.length; i < len; i++) {
			var mutation = mutations[i];
			if (mutation.addedNodes.length > 0) {
				if (mutation.addedNodes[0].tagName == 'TR'
						&& mutation.previousSibling) {
					topicList.passToFunctions(mutation.addedNodes[0]);
				}
				else if (mutation.addedNodes[0].tagName
						&& mutation.addedNodes[0].tagName.match('H1')
						&& topicList.config.dramalinks
						&& window.location.href.match('topic')) {
					dramalinks.appendTo(mutation.addedNodes[0]);	
				}
				else if (mutation.target.id == 'bookmarks' 
						&& mutation.addedNodes[0].innerHTML == '[+]') {
					topicList.checkTags();
				}
			}
		}
	}),
	init: function(config) {
		this.config = config.data;	
		this.prepareArrays();
		this.globalPort = chrome.runtime.connect();
		this.globalPort.onMessage.addListener(this.handle.message);
		
		if (window.location.href.match('inbox.php')) {
			this.pm = "_pm";
		}
		
		if (window.location.href.match('topic')) {
			if (this.config.dramalinks) {
				chrome.runtime.sendMessage({
						need : "dramalinks"
				}, function(response) {
					dramalinks.html = response.data;
					dramalinks.config = topicList.config;
				});
			}
		}

		if (document.readyState == 'loading') {
			// apply DOM modifications as elements are parsed by browser
			this.initObserver.observe(document.documentElement, {
					childList: true,
					subtree: true
			});
			document.addEventListener('DOMContentLoaded', 
					this.handle.loadEvent.call(topicList)
			);
		}
		else {
			// DOM was already loaded
			// (user pressed back button to reach topic list)
			this.callFunctions(this.pm);
		}
	}
};

chrome.runtime.sendMessage({
	need: "config"
}, function(config) {
	topicList.init.call(topicList, config);
});