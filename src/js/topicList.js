var topicList = {
	config: {},
	ignoredUsers: [],
	ignoredKeywords: [],
	highlightedKeywords: {},
	highlightedTags: {},		
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
		
		ignorator_topiclist: function(tr) {
			if (!topicList.ignoredUsers) {
				return;
			}
			
			else {
				var td = tr.getElementsByTagName('td')[1];
				
				for (var f = 0, len = topicList.ignoredUsers.length; f < len; f++) {
					var ignoredUser = topicList.ignoredUsers[f];
					
					if (!td || td.innerHTML.indexOf('<td>Human</td>') > -1) {											
						return;
					}
					
					else {
						var username = td.getElementsByTagName('a')[0];
						
						if (username && username.innerHTML.toLowerCase() == ignoredUser.toLowerCase()) {
							
							tr.classList.add('ignorated');			
							
							topicList.ignorated.total_ignored++;
							
							if (!topicList.ignorated.data.users[ignoredUser]) {
								topicList.ignorated.data.users[ignoredUser] = {};
								topicList.ignorated.data.users[ignoredUser].total = 1;
							} 
							
							else {
								topicList.ignorated.data.users[ignoredUser].total++;
							}
							
						}
					}				
				}
			}
		},
		
		ignore_keyword: function(tr, i) {
			if (!topicList.config.ignore_keyword_list) {
				return;
			}
			
			else {			
				var ignoredKeywords = topicList.ignoredKeywords;
						
				var titleElement = tr.getElementsByTagName('td')[0];
				var title = titleElement.getElementsByTagName('a')[0].innerHTML.toLowerCase();
				
				for (var f = 0, len = ignoredKeywords.length; f < len; f++) {		
					var ignoredKeyword = ignoredKeywords[f];
					
					if (title.indexOf(ignoredKeyword.toLowerCase()) != -1) {
						
						titleElement.parentNode.classList.add('ignorated_keyword');
						
						topicList.ignorated.total_ignored++;
						
						if (!topicList.ignorated.data.keywords[ignoredKeyword]) {
							topicList.ignorated.data.keywords[ignoredKeyword] = {};
							topicList.ignorated.data.keywords[ignoredKeyword].total = 1;
						} 
						
						else {
							topicList.ignorated.data.keywords[ignoredKeyword].total++;
						}				
					}
				}
			}
		},
		
		page_jump_buttons: function(tr, i) {
			var inbox;
			
			if (window.location.href.indexOf('inbox.php') > -1) {
				// Page jump buttons are appended to page slightly differently inside PM inbox
				inbox = true;
			}

			var td = tr.getElementsByTagName('td')[0];
			
			if (td) {
				var insert = document.createElement('span');
				
				if (inbox) {
					insert.style.cssFloat = 'right';
				}
				
				var jumpWindow = document.createElement('a');
				jumpWindow.href = '##' + i;
				jumpWindow.id = 'jumpWindow';
				jumpWindow.innerHTML = '#';
				
				var jumpLast = document.createElement('a');
				jumpLast.href = '##' + i;
				jumpLast.id = 'jumpLast';
				jumpLast.innerHTML = '&gt;';
				
				insert.appendChild(jumpWindow);
				insert.appendChild(document.createTextNode(' '));
				insert.appendChild(jumpLast);
				
				if (inbox) {
					td.appendChild(insert);				
				}
				else {
					td.getElementsByClassName('fr')[0].appendChild(insert);
				}
			}
		},
		
		fix_new_post_jump: function(tr) {
			//Check each topic to see if the last seen post was the end of the page
			//If it was, change the link to goto the next page

			//dont run on PM page
			if (window.location.href.includes('inbox.php')) {
				return;
			}
			var msgs = tr.childNodes[2].textContent.split(' ');
			var msgCount = msgs[0];
			if ( msgs.length > 1 ) {
				var newPosts = msgs[1].match(/[0-9]+/)[0];
				var link = tr.childNodes[2].querySelector('a');
				var lastSeen = msgCount-newPosts;
				var topic = link.href.match(/([0-9]+)/)[0];
				if (lastSeen % 50 === 0) {
					var newPage = lastSeen/50 + 1;
					link.href = "//boards.endoftheinter.net/showmessages.php?topic=" + topic +"&page=" +  newPage;
				}
			}   
		},
		enable_keyword_highlight: function(tr) {
			var title;
			var keys = topicList.highlightedKeywords;
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
			var highlightTags = topicList.highlightedTags;
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
				this.ignoredUsers[0] = this.config.ignorator_list;
			}
			else {
				// split comma separated list into array
				var ignore_users = this.config.ignorator_list.split(',');
				for (var i = 0, len = ignore_users.length; i < len; i++) {
					this.ignoredUsers[i] = ignore_users[i].trim();
				}
			}
		}
		if (this.config.ignore_keyword_list) {
			if (this.config.ignore_keyword_list.indexOf(',') == -1) {
				this.ignoredKeywords[0] = this.config.ignore_keyword_list;
			}
			else {
				var ignore_words = this.config.ignore_keyword_list.split(',');		
				for (var i = 0, len = ignore_words.length; i < len; i++) {
					this.ignoredKeywords[i] = ignore_words[i]
							.toLowerCase().trim();
				}
			}
		}
		for (var i = 0; this.config.keyword_highlight_data[i]; i++) {
			this.highlightedKeywords[i] = {};
			this.highlightedKeywords[i].bg = this.config.keyword_highlight_data[i].bg;
			this.highlightedKeywords[i].color = this.config.keyword_highlight_data[i].color;
			this.highlightedKeywords[i].match = this.config.keyword_highlight_data[i].match
					.split(',');
		}
		for (var i = 0; this.config.tag_highlight_data[i]; i++) {
			this.highlightedTags[i] = {};	
			this.highlightedTags[i].bg = this.config.tag_highlight_data[i].bg;
			this.highlightedTags[i].color = this.config.tag_highlight_data[i].color;	
			this.highlightedTags[i].match = this.config.tag_highlight_data[i].match.split(',');
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
	addListeners: function() {
		document.addEventListener('click', (evt) => {
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
						
						if (msg.type === 'user') {
							
							var ignoredTopics = document.getElementsByClassName('ignorated');
							var topicsToShow = [];							
							
							for (var i = 0, len = ignoredTopics.length; i < len; i++) {
								var ignoredTopic = ignoredTopics[i];
								var usernameElement = ignoredTopic.getElementsByTagName('td')[1]
										.getElementsByTagName('a')[0];
								
								if (msg.value.toLowerCase() == usernameElement.innerHTML.toLowerCase()) {										
									topicsToShow.push(ignoredTopic);
								}								
							}
							
							for (var i = topicsToShow.length - 1; i >= 0; i--) {
								var topicToShow = topicsToShow[i];										
								topicToShow.classList.remove('ignorated');
								// ignorated_topic_peek sets opacity to 0.7							
								topicToShow.classList.add('ignorated_topic_peek');
								
								if (i === 0) {
									$.scrollTo(topicToShow);
								}
							}
						}
						
						else if (msg.type === 'keyword') {
							
							var ignoredTopics = document.getElementsByClassName('ignorated_keyword');
							var topicsToShow = [];
							
							for (var i = 0, len = ignoredTopics.length; i < len; i++) {
								var ignoredTopic = ignoredTopics[i];
								var titleElement = ignoredTopic.getElementsByTagName('td')[0].getElementsByTagName('a')[0];
								var title = titleElement.innerHTML.toLowerCase();
								
								if (title.indexOf(msg.value.toLowerCase()) > -1) {										
									topicsToShow.push(ignoredTopic);
								}								
							}
							
							for (var i = topicsToShow.length - 1; i >= 0; i--) {
								var topicToShow = topicsToShow[i];										
								topicToShow.classList.remove('ignorated_keyword');
								// ignorated_topic_peek sets opacity to 0.7							
								topicToShow.classList.add('ignorated_topic_peek');
								
								if (i === 0) {
									$.scrollTo(topicToShow);
								}
							}						
						}
						
						break;
						
					default:
						break;
				}
			}
		},
		pageJump: function(evt) {
			var td, history, inbox;
			
			if (window.location.href.indexOf('history.php') > -1) {
				history = true;
				td = evt.target.parentNode.parentNode.parentNode.parentNode
						.parentNode.getElementsByTagName('td')[2];
			}
			
			else if (window.location.href.indexOf('inbox.php') > -1) {
				inbox = true;
				td = evt.target.parentNode.parentNode.nextSibling.nextSibling;
			}
			
			else {
				td = evt.target.parentNode.parentNode.parentNode.parentNode
						.getElementsByTagName('td')[2];
			}
			
			// Remove unread messages count and work out position of last page
			var postCount = td.innerHTML.split('(')[0];
			postCount = postCount.split('<')[0];
			var lastPage = Math.ceil(postCount / 50);
			
			
			if (evt.target.id == 'jumpWindow') {
				page = prompt("Page Number (" + lastPage + " total)", "Page");
				if (page == undefined || page == "Page") {
					return 0;
				}
			} else {
				page = lastPage;
			}
			
			
			if (history) {
				var topic = evt.target.parentNode.parentNode.parentNode.getElementsByTagName('a')[0];
				return topic.href + '&page=' + page;
			}
			
			else if (inbox) {						
				var thread = evt.target.parentNode.parentNode.firstChild;
				
				// Threads with new posts are wrapped in b tags
				if (thread.tagName === 'B') {
					thread = thread.firstChild;
				}
								
				return thread.href + '&page=' + page;
			}
			
			else {
				var topic = evt.target.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[0].getElementsByTagName('a')[0];
				return topic.href + '&page=' + page;
			}
		}
	},
	applyDomModifications: function(pm) {
		var grids = document.getElementsByClassName('grid');
		var functions = this.functions;
		var config = this.config;
								
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
					for (var k in functions) {
						
						if (config[k + pm]) {
							functions[k](tr, j);
						}
					}
				}
			}
		}
		
		if (this.config.dramalinks && !window.location.href.match(/[inbox|main].php/)) {
			var element = document.getElementsByTagName('h1')[0];
			dramalinks.appendTo(element);
			
			// Modify existing margin-top value (-39px) of pascal so that it appears above ticker
			var offset = -39 - document.getElementById('dramalinks_ticker').getBoundingClientRect().height;
			document.styleSheets[0].insertRule("img[src='//static.endoftheinter.net/pascal.png'] { margin-top: " + offset + "px !important; }", 1);
		}
		
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
			this.globalPort.postMessage({
				action: 'ignorator_update',
				ignorator: this.ignorated,
				scope: "topicList"
			});
		}
	},
	
	waitForAsyncContent: function() {
		// We need to wait for async stuff on page to load before we can call topic list functions						
		var melonwolfObserver = new MutationObserver((mutations) => {
			topicList.applyDomModifications(topicList.pm);
			melonwolfObserver.disconnect();
		});
		
		if (document.getElementsByClassName('oh').length === 0) {		
			var table = document.getElementsByTagName('table')[0];
			
			melonwolfObserver.observe(table, {
				childList: true,
				subtree: true
			});
		}
		
		else {
			topicList.applyDomModifications(topicList.pm);
		}
	},
	
	init: function(config) {
		this.config = config.data;	
		this.prepareArrays();
		this.globalPort = chrome.runtime.connect();
		this.globalPort.onMessage.addListener(this.handle.message);
		
		if (window.location.href.match(/topics|history/)) {
			
			if (this.config.dramalinks) {
				
				chrome.runtime.sendMessage({ need : "dramalinks" }, (response) => {
					
					dramalinks.html = response.data;
					dramalinks.config = topicList.config;
					
				});
			}
		}
		else if (window.location.href.match(/inbox.php/)) {
			this.pm = "_pm";
		}
		
		if (document.readyState == 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				
				if (window.location.pathname === "/main.php") {
					topicList.waitForAsyncContent();
				}
				
				else {					
					topicList.applyDomModifications(topicList.pm);
				}
				
			});
		}
		
		else {
			// DOM was already loaded
			if (window.location.pathname === "/main.php") {
				this.waitForAsyncContent();
			}
			
			else {					
				this.applyDomModifications(this.pm);
			}
		}
	}
};

chrome.runtime.sendMessage({ need: "config" }, (config) => {
	topicList.init.call(topicList, config);
});
