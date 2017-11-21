var topicList = {
	config: {},
	ignoredUsers: [],
	ignoredKeywords: [],
	highlightedKeywords: [],
	highlightedTags: [],		
	ignorated: {
		total_ignored: 0,
		data: {
			users: {},
			keywords: {}
		}
	},
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
				jumpWindow.href = '#';
				jumpWindow.id = 'jumpWindow';
				jumpWindow.innerHTML = '#';
				
				var jumpLast = document.createElement('a');
				jumpLast.href = '#';
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
			if (window.location.pathname === '/inbox.php') {
				return;
			}
			
			var msgsNode;
			
			if (window.location.pathname === '/history.php') {
				// Message history page adds text nodes between each td
				msgsNode = tr.childNodes[5];				
			}
			
			else {
				msgsNode = tr.childNodes[2];				
			}
			
			var msgs = msgsNode.textContent.split(' ');
			
			if (msgs.length > 1) {			
				var newPosts = msgs[1].match(/[0-9]+/)[0];
				var link = msgsNode.getElementsByTagName('a')[0];
				var lastSeen = msgs[0] - newPosts;
				var topic = link.href.match(/([0-9]+)/)[0];
				if (lastSeen % 50 === 0) {
					var newPage = lastSeen / 50 + 1;
					link.href = "//boards.endoftheinter.net/showmessages.php?topic=" + topic + "&page=" +  newPage;
				}
			}
		},
		
		enable_keyword_highlight: function(tr) {
			var highlights = topicList.highlightedKeywords;
			if (!highlights || highlights.length === 0) {
				return;
			}
			
			var td = tr.getElementsByTagName('td')[0];
			var topicTitle = td.getElementsByTagName('a')[0].innerText.toLowerCase();
					
			for (var i = 0, len = highlights.length; i < len; i++) {
				var highlight = highlights[i];
				var keyword = highlight.match; 
				var match;
								
				// Check for regex (do people even use this??)
				if (keyword.substring(0, 1) == '/') {
					var reg = new RegExp(keys[j].match[k].substring(1, keyword.lastIndexOf('/')), 
							keyword.substring(keyword.lastIndexOf('/') + 1, keyword.length)
					);
					
					match = topicTitle.match(reg);				
				}
				
				else {
					match = topicTitle.toLowerCase().indexOf(keyword.toLowerCase()) != -1;
				}
				
				if (match) {
					var nodeAnchors = td.getElementsByTagName('a');
					td.setAttribute('highlighted', true);
					td.style.background = '#' + highlight.bg;
					td.style.color = '#' + highlight.color;
					
					for (var m = 0, anchorLen = nodeAnchors.length; m < anchorLen; m++) {
						nodeAnchors[m].style.color = '#' + highlight.color;
					}
				}
			}
		},
		
		enable_tag_highlight: function(tr) {
			var highlightTags = topicList.highlightedTags;
			
			if (highlightTags.length === 0) {
				return;
			}
			
			var frElement = tr.getElementsByTagName('td')[0].getElementsByClassName('fr')[0];
			var htmlString = frElement.innerHTML.toLowerCase();		
			var needsHighlight = false;
						
			for (var i = 0, len = highlightTags.length; i < len; i++) {
				var keyword = highlightTags[i].match;
				if (htmlString.indexOf(keyword) > -1) {
					needsHighlight = true;
					break;
				}
			}
			
			if (needsHighlight) {
				var tagsToCheck = frElement.getElementsByTagName('a');
					
				for (var i = 0, len = tagsToCheck.length; i < len; i++) {
					var tagToCheck = tagsToCheck[i];	
					for (var j = 0, highlightLen = highlightTags.length; j < highlightLen; j++) {
						var highlight = highlightTags[j];
						
						if (tagToCheck.innerHTML.toLowerCase() === highlight.match) {
							var node = tr.getElementsByTagName('td')[0];
							var nodeAnchors = node.getElementsByTagName('a');
							
							node.setAttribute('highlighted', true);
							node.style.background = '#' + highlight.bg;
							node.style.color = '#' + highlight.color;
							
							for (var n = 0, anchorLen = nodeAnchors.length; n < anchorLen; n++) {
								nodeAnchor = nodeAnchors[n];
								nodeAnchor.style.color = '#' + highlight.color;
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

			var highlightData = topicList.config.user_highlight_data;
			var userElement = tr.getElementsByTagName('td')[1].getElementsByTagName('a')[0];
			
			if (userElement) {
				var user = userElement.innerHTML.toLowerCase();
				if (highlightData[user]) {
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
		},
		
		highlight_serious: function(tr) {
			var frElement = tr.getElementsByTagName('td')[0].getElementsByClassName('fr')[0];
			
			if (frElement.innerHTML.indexOf('Serious') === -1) {
				return;
			}
			
			var tagsToCheck = frElement.getElementsByTagName('a');
			
			for (var i = 0, len = tagsToCheck.length; i < len; i++) {
				var tagToCheck = tagsToCheck[i];
				if (tagToCheck.innerHTML === 'Serious') {
					tagToCheck.style.color = '#' + topicList.config.serious_color;
					break;
				}
			}
		}
	},
	
	/**
	 *  Prepares arrays for ignorator/highlighter methods.	 
	 */ 
	
	prepareArrays: function() {
		if (this.config.ignorator_list) {
			this.ignoredUsers = this.config.ignorator_list.split(',').map((user) => {
				return user.trim();
			});
			
			if (this.config.ignorator_allow_topics && this.config.ignorator_topic_whitelist) {
				
				var whitelist = this.config.ignorator_topic_whitelist.split(',').map((user) => { 
					return user.trim().toLowerCase(); 
				});
				
				this.ignoredUsers = this.ignoredUsers.filter((user) => {		
					return (whitelist.indexOf(user.toLowerCase()) === -1);				
				});
			}	
		}
		
		if (this.config.ignore_keyword_list) {
			if (this.config.ignore_keyword_list.indexOf(',') == -1) {
				this.ignoredKeywords[0] = this.config.ignore_keyword_list;
			}
			else {
				var ignore_words = this.config.ignore_keyword_list.split(',');		
				for (var i = 0, len = ignore_words.length; i < len; i++) {
					this.ignoredKeywords[i] = ignore_words[i].toLowerCase().trim();
				}
			}
		}
		
		// Convert weird keyword_highlight_data object to plain array.
		// TODO: modify way that keyword highlights are stored
		
		for (var i = 0; this.config.keyword_highlight_data[i]; i++) {
			var highlight = {};			
			highlight.bg = this.config.keyword_highlight_data[i].bg;
			highlight.color = this.config.keyword_highlight_data[i].color;
			highlight.match = this.config.keyword_highlight_data[i].match;
			this.highlightedKeywords.push(highlight);
		}
		
		// Convert weird tag_highlight_data object to plain array.
		// TODO: modify way that tag highlights are stored
		
		for (var i = 0; this.config.tag_highlight_data[i]; i++) {
			var highlight = {};			
			highlight.bg = this.config.tag_highlight_data[i].bg;
			highlight.color = this.config.tag_highlight_data[i].color;
			highlight.match = this.config.tag_highlight_data[i].match.toLowerCase();
			this.highlightedTags.push(highlight);
		}
	},
	
	checkTags: function() {
		var bookmarks = document.getElementById('bookmarks').getElementsByTagName('span');
		var savedTags = {};
		
		for (var i = 0, len = bookmarks.length; i < len; i++) {
			var bookmark = bookmarks[i];
			if (!bookmark.className) {
				var anchor = bookmark.getElementsByTagName('a')[0];
				var name = anchor.innerHTML;
				var tag = anchor.href.match('\/topics\/(.*)$')[1];
				savedTags[name] = tag;
			}
		}
		
		chrome.runtime.sendMessage({
			need: "save",
			name: "saved_tags",
			data: savedTags
		});
	},
	
	addListeners: function() {
		const LEFT_CLICK = 0;
		const MIDDLE_CLICK = 1;
		
		document.addEventListener('click', (evt) => {

			if (evt.target.id === 'jumpWindow') {
				var url = topicList.createPageJumpUrl(evt.target);
				
				if (url) {										
					window.location.href = url;					
				}
				
				evt.preventDefault();
			}
		});
	
		// Populate href with last page url after user mouses over element
		document.addEventListener('mouseover', (evt) => {
			
			if (evt.target.id === 'jumpLast' && evt.target.href !== '#') {
				evt.target.href = topicList.createPageJumpUrl(evt.target);
			}
			
		});
		
	},
	
	createPageJumpUrl: function(target) {
		var td, history, inbox;
		
		if (window.location.href.indexOf('history.php') > -1) {
			history = true;
			td = target.parentNode.parentNode.parentNode.parentNode
					.parentNode.getElementsByTagName('td')[2];
		}
		
		else if (window.location.href.indexOf('inbox.php') > -1) {
			inbox = true;
			td = target.parentNode.parentNode.nextSibling.nextSibling;
		}
		
		else {
			td = target.parentNode.parentNode.parentNode.parentNode
					.getElementsByTagName('td')[2];
		}
		
		// Remove unread messages count and work out position of last page
		var postCount = td.innerHTML.split('(')[0];
		postCount = postCount.split('<')[0];
		var lastPage = Math.ceil(postCount / 50);
		
		
		if (target.id == 'jumpWindow') {
			page = prompt("Page Number (" + lastPage + " total)", "Page");
			if (page == undefined || page == "Page") {
				return 0;
			}
		} else {
			page = lastPage;
		}
		
		
		if (history) {
			var topic = target.parentNode.parentNode.parentNode.getElementsByTagName('a')[0];
			return topic.href + '&page=' + page;
		}
		
		else if (inbox) {						
			var thread = target.parentNode.parentNode.firstChild;
			
			// Threads with new posts are wrapped in b tags
			if (thread.tagName === 'B') {
				thread = thread.firstChild;
			}
							
			return thread.href + '&page=' + page;
		}
		
		else {
			var topic = target.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[0].getElementsByTagName('a')[0];
			return topic.href + '&page=' + page;
		}
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
		}
	},
	
	/**
	 *  Kludgy fix for missing PM inbox config flags.
	 *  Need to fix this properly in future update
	 */
	
	fixPmConfigFlags: function() {
		if (this.config.ignorator_topiclist) {
			this.config.ignorator_topiclist_pm = true;
		}
		
		if (this.config.ignore_keyword) {
			this.config.ignore_keyword_pm = true;
		}
		
		if (this.config.enable_keyword_highlight) {
			this.config.enable_keyword_highlight_pm = true;
		}
	},
	
	applyDomModifications: function(pm) {	
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
					for (var k in this.functions) {
						
						if (this.config[k + pm]) {
							this.functions[k](tr, j);
						}
					}
				}
			}
		}
		
		if (this.config.dramalinks && !window.location.href.match(/[inbox|main].php/)) {
			var element = document.getElementsByTagName('h1')[0];
			dramalinks.appendTo(element);
			
			// Modify existing margin-top value (-39px) of pascal so that it appears above ticker.
			
			// The Chrome version appends to the existing ETI stylesheet - this throws a DOMException (insecure operation)
			// in Firefox, so we have to create the rule from scratch
			
			var style = document.createElement("style");
			document.head.append(style);
			
			var offset = -39 - document.getElementById('dramalinks_ticker').getBoundingClientRect().height;
			var cssString = "img[src='//static.endoftheinter.net/pascal.png'] { margin-top: " + offset + "px !important; }";
			style.sheet.insertRule(cssString, 0);
		}
		
		if (this.config['page_jump_buttons' + pm]) {
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
		
		if (this.config.browse_from_date) {	
		this.createDatePicker();
		}
	},
	
	createDatePicker: function() {
		if (window.location.pathname === '/history.php' || window.location.pathname === '/main.php') {
			// ts parameter doesn't affect these pages
			return;
		}
		
		else {
			var infobar = document.getElementsByClassName('infobar')[0];
			var pickerButton = document.createElement('span');
			pickerButton.className = 'clickable_span';
			pickerButton.id = 'picker_button';
			pickerButton.innerHTML = 'Browse From Date';
			
			infobar.appendChild(document.createTextNode(' | '));
			infobar.appendChild(pickerButton);
			
			// Note: ETI dates are in MM/DD/YYYY format
			var month, day, year;
			
			if (window.location.pathname.indexOf('Posted') > -1) {
				// Searching user's own posts - use account creation date as minimum date for picker
				var accountCreationDate = this.config.creation_date.split('/');			
				month = '0' + (accountCreationDate[0] - 1); // Month in Date constructor is zero-indexed
				day = accountCreationDate[1];
				year = accountCreationDate[2];
			}
			
			else {
				// First topic on ETI was made on May 11th 2004				
				month = 4; // Zero-indexed
				day = 11;
				year = 2004;
			}
			
			var picker = new Pikaday({
				field: pickerButton,
				firstDay: 1,
				minDate: new Date(year, month, day),
				maxDate: new Date(),
				yearRange: [year, new Date().getFullYear()],
				onSelect: function() {
					topicList.handleDateSelection(this.getMoment());
				}
			});
		}
	},
	
	handleDateSelection: function(date) {
		const DATE_CONSTRUCTOR_FORMAT = 'YYYY/MM/DD';
		const MILLISECONDS_IN_ONE_SECOND = 1000;
		const TIMESTAMP_PARAM = '?ts=';
		
		var formattedDateArray = date.format(DATE_CONSTRUCTOR_FORMAT).split('/');
		
		var year = formattedDateArray[0];
		var month = formattedDateArray[1] - 1;	// Month in Date constructor is zero-based
		var day = formattedDateArray[2];
		
		// Topics are displayed in reverse order, so we want to start from the latest possible time on the provided date
		var dateToView = new Date(Date.UTC(year, month, day, 23, 59, 59));
		var timestamp = dateToView.getTime() / MILLISECONDS_IN_ONE_SECOND;
		
		var oldParams = new URLSearchParams(window.location.search);
		var newParams = TIMESTAMP_PARAM + timestamp;						
	
		// Make sure we preserve any search parameters.
		if (oldParams.has('q')) {			
			newParams += '&q=' + oldParams.get('q');
		}
		else if (oldParams.has('qt')) {
			newParams += '&qt=' + oldParams.get('qt');
		}
		
		window.location.href = window.location.origin + window.location.pathname + newParams;
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
		
		this.fixPmConfigFlags();
		
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
