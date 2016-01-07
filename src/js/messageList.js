(function(CHROMELL) {
	
	CHROMELL.messageList = function() {
		
		var globalPort = CHROMELL.globalPort;
		var pm = '';
		var ignores;
		
		var init = function() {
			// Prepare array for ignorator feature
			ignores = CHROMELL.config.ignorator_list.split(',');
			for (var r = 0, len = ignores.length; r < len; r++) {
				var ignore = ignores[r].toLowerCase().trim();
				ignores[r] = ignore;
			}
			
			// set up globalPort so we can interact with background page
			globalPort.onMessage.addListener(eventHandlers.ignoratorUpdate);
						
			if (window.location.href.match('inboxthread.php')) {
				// pm variable is added to method name to determine config setting for PM inbox
				// eg. userhl_messagelist and userhl_messagelist_pm
				pm = "_pm";
			}
			
			// Check whether we need to display dramalinks ticker and fetch HTML
			if (CHROMELL.config.dramalinks && !pm) {				
				chrome.runtime.sendMessage({
						need : "dramalinks"
				}, function(response) {					
					dramalinks.html = response.data;					
					dramalinks.config = CHROMELL.config;
				});
			}
			
			CHROMELL.whenDOMReady(DOM.init);
		};	
		
		var DOM = function() {
			// Containers for DOM methods
			var messagecontainer = {};
			var infobar = {};
			var quickpostbody = {};
			var misc = {};
			
			// These variables are set by init method
			var infobarElement;
			var quickpostElement;
			var userbarElement;
			var messageTops;
			var firstTop;
			var currentUser;
			var currentID;
			var styleSheet;
			
			var scrolling = false;
			var replaying = false;
			var topsTotal = 0;
			var ignorated = {
				total_ignored: 0,
				data: {
					users: {}
				}
			};		
		
			var init = function() {
				var msgs = document.getElementsByClassName('message-container');				
				infobarElement = document.getElementById('u0_2');
				quickpostElement = document.getElementsByClassName('quickpost-body')[0];
				userbarElement = document.getElementsByClassName('userbar')[0];					
				currentUser = userbarElement.getElementsByTagName('a')[0].innerHTML.replace(/ \((\d+)\)$/, "").toLowerCase();
				currentID = userbarElement.getElementsByTagName('a')[0].href.match(/\?user=([0-9]+)/)[1];
				
				var title = document.getElementsByTagName('h2')[0];
				if (config.dramalinks && !config.hide_dramalinks_topiclist) {
					dramalinks.appendTo(title);
				}
				
				// Call methods which modify the infobar element
				for (var k in infobar) {
					if (CHROMELL.config[k + pm]) {
							infobar[k]();
					}
				}
				
				// Add archive quote buttons before highlights/post numbers are added
				utils.quote.addButtons();
				
				// Inject CSS rules before adding dataset attributes to elements
				addCSSRules();
				
				// Chrome seems to cache DOM changes when they are made in a loop (to minimise browser reflow/repaint).
				// Partially unrolling the loop minimises flash of unstyled content when users load topics
				var len;
				if (msgs.length < 4) {
					len = msgs.length;
				}
				else {					
					len = 4;
				}
				// Iterate over first 5 containers
				for (var j = 0; j < len; j++) {
					var msg = msgs[j];
					// Get required elements from message-container
					setActivePost(msg);
					utils.anchors.check(msg);
					// Iterate over messagecontainer methods
					for (var k in messagecontainer) {
						if (config[k + pm]) {
							// Pass message-container and index value to method
							messagecontainer[k](msg, j + 1);
						}
					}
				}
				
				if (len === 4) {
					// Iterate over rest of messages
					for (var j = 4; msg = msgs[j]; j++) {				
						setActivePost(msg);
						utils.anchors.check(msg);			
						for (var k in messagecontainer) {
							if (config[k + pm]) {
								messagecontainer[k](msg, j + 1);
							}
						}
					}
				}
								
				if (!CHROMELL.config.hide_ignorator_badge) {
					// Update ChromeLL badge with current ignorator count
					globalPort.postMessage({
						action: 'ignorator_update',
						ignorator: ignorated,
						scope: "messageList"
					});
				}
				
				// Check if we need to embed any Gfycat/Imgur videos
				utils.anchors.embedHandler();
				
				// Call methods that modify quickpost area (changes will probably not be visible to user)
				for (var i in quickpostbody) {
					if (config[i + pm]) {
						quickpostbody[i]();
					}
				}
				
				// Add listeners, set observers, etc
				for (var i in misc) {
					if (config[i + pm]) {
						misc[i]();
					}
				}
				
				addListeners();
				appendScripts();
				
				livelinksObserver.observe(document.getElementById('u0_1'), {
						subtree: true,
						childList: true
				});	
				
				var newPageNotifier = document.getElementById('nextpage');
				
				if (CHROMELL.config.new_page_notify) {
					newPageObserver.observe(newPageNotifier, {
							attributes: true
					});
				}
				
				// By this point all ChromeLL features should be working
			};
		
			var setActivePost = function(msg) {
				messageTops = msg.getElementsByClassName('message-top');
				firstTop = messageTops[0];
			};		
			
			var addCSSRules = function() {
				styleSheet = document.styleSheets[0];
				
				styleSheet.addRule('.message-container .quoted-message[foxlinks]', 'border-color: #' + CHROMELL.config.foxlinks_quotes_color);
				
				if (CHROMELL.config.userhl_messagelist) {
					var highlightData = CHROMELL.config.user_highlight_data;
					for (var name in highlightData) {
						// Remove disallowed characters from username to create CSS attribute selector
						var username = name.replace(/\s|\)|:/g, '');
						var bg = highlightData[name].bg;
						var color = highlightData[name].color;
						var datasetAttribute = makeCSSDatasetAttribute(username, 'user');
						styleSheet.addRule('.message-top[' + datasetAttribute + ']', 'background: #' + bg);
						styleSheet.addRule('.message-top[' + datasetAttribute + ']', 'color: #' + color);											
						styleSheet.addRule('.message-top[' + datasetAttribute + '] a', 'color: #' + color);
						styleSheet.addRule('.message-top[' + datasetAttribute + '] a:hover', 'opacity: 0.8');
						
						// We want this to override the default value, if user is highlighted								
						styleSheet.addRule('.quoted-message[foxlinks][' + username + ']',	'border-color: #' + bg);
					}	
				}
			};
			
			var makeCSSDatasetAttribute = function(string, type) {
				var suffix = type || '';
				// Remove disallowed chars from string
				var cleanedString = string.replace(/[^a-zA-Z0-9]/g, '');				
				var datasetAttribute = "data-" + type + "='" + cleanedString + "'"; // eg. data-user='username'
				return datasetAttribute;
			};			
			
			var appendScripts = function() {
				var head = document.getElementsByTagName("head")[0];
				if (config.post_templates) {
					var templates = document.createElement('script');
					templates.type = 'text/javascript';
					templates.src = chrome.extension.getURL('src/js/topicPostTemplate.js');
					head.appendChild(templates);
				}
			};
			
			var addListeners = function(newPost) {
				if (!newPost) {
					document.body.addEventListener('click', eventHandlers.mouseclick);				
					document.addEventListener('scroll', eventHandlers.scrollDebouncer);
					
					var searchBox = document.getElementById('image_search');			
					if (searchBox) {
						searchBox.addEventListener('keyup', eventHandlers.search);
					}										
				}
				if (CHROMELL.config.user_info_popup) {
					var tops;
					if (newPost) {
						tops = newPost.getElementsByClassName('message-top');
					} else {
						tops = document.getElementsByClassName('message-top');
					}
					for (var i = 0, len = tops.length; i < len; i++) {
						var top = tops[i];							
						if (top.parentNode.className !== 'quoted-message') {
							var anchor = top.getElementsByTagName('a')[0];						
							if (anchor.href.indexOf('endoftheinter.net/profile.php?user=') > -1) {
								// Non-anonymous user profile - add listeners for user info popup
								anchor.className = 'username_anchor';
								anchor.addEventListener('mouseenter', eventHandlers.mouseenter);
								anchor.addEventListener('mouseleave', eventHandlers.mouseleave);
							}
						}
					}
				}
			};
				
			var autoscrollCheck = function(mutation) {
				// checks whether user has scrolled to bottom of page
				var position = mutation.getBoundingClientRect();
				if (mutation.style.display == 'none'
						|| position.top > window.innerHeight) {
					return false;
				} 
				else {
					return true;
				}
			};
			
			var appendToPage = function(nextPage) {
				
				// Save reference to document.head - we will need to append some scripts later
				var head = document.getElementsByTagName('head')[0];
				var html = document.createElement('html');
				html.innerHTML = nextPage;
				console.log(html);				
				var scripts = html.querySelectorAll('script');
				var containerDiv = document.getElementById('u0_1');
				var pageList = document.getElementById('u0_3');
				var newPages = html.getElementsByClassName('infobar')[1];			
				var containers = html.querySelectorAll('.message-container');
				
				// This script creates new TopicManager object and allows us to receive livelinks posts
				var topicManager = scripts[scripts.length - 4];
				var newScript = document.createElement('script');
				newScript.text = topicManager.text;				
				head.appendChild(newScript);
				
				// Set 'replaying' flag to make sure that notifications/etc aren't called.
				replaying = true;
				
				for (var i = 0, len = containers.length; i < len; i++) {
					var container = containers[i];					
					var containerScripts = container.getElementsByTagName('script');
					for (var j = 0, scriptLen = containerScripts.length; j < scriptLen; j++) {
						var script = containerScripts[j];
						if (script) {
							if (script.text.match(/ImageLoader/)) {
								// We have to manually find the correct src for each image by checking the array of parameters 
								// used by the ImageLoader constructor.The placeholder element for each image is always script.previousSibling
								var array = script.text.split(',');
								var escapedURL = array[1];
								var url = escapedURL.replace(/\\/g, '');
								url = url.replace('"//', window.location.protocol + '//');
								url = url.substring(0, url.length - 1);
								var img = document.createElement('img');
								img.src = url;
								var placeholder = script.previousSibling;								
								placeholder.appendChild(img);															
								placeholder.className = 'img-loaded';
								script.remove();									
							}	
						}
					}
					
					if (container) {
						containerDiv.appendChild(container);
						livelinksHandler(container);
					}
					else {
						console.log(container);
					}
				}
				// We can now allow notifications/etc to be passed to user
				replaying = false;
				// Replace list of pages last (as it is located at bottom of screen);
				pageList.outerHTML = newPages.outerHTML;				
				
				
			};
			
			var newPageObserver = new MutationObserver(function(mutations) {
				for (var i = 0, len = mutations.length; i < len; i++) {
					var mutation = mutations[i];
					
					if (mutation.type === 'attributes' 
							&& mutation.target.style.display === 'block') {
						
						chrome.runtime.sendMessage({
								
								need: "notify",
								title: "New Page Created",
								
								message: document.title
						});	
						
						if (CHROMELL.config.follow_new_pages) {
							// Scrape message-containers from next page & append to current page.
							// We want function to be able to fire again when necessary.
							var newPage = mutation.target.href;
							mutation.target.style.display = 'none';
							chrome.runtime.sendMessage({
									
									need: "xhr",
									url: newPage,
							
							}, appendToPage );				
						}
												
						else {
							// Disconnect listener to prevent function from firing again
							this.disconnect();
						}
						
					}
				}
				
			});
			
			var livelinksObserver = new MutationObserver(function(mutations) {
				for (var i = 0, len = mutations.length; i < len; i++) {
					var mutation = mutations[i];
					if (mutation.addedNodes.length > 0
							&& mutation.addedNodes[0].childNodes.length > 0) {
						if (mutation.addedNodes[0].childNodes[0].className == 'message-container') {
							// send new message container to livelinks method
							livelinksHandler(mutation.addedNodes[0].childNodes[0]);
						}
					}
				}
			});	
					
			var livelinksHandler = function(container) {
				var index = document.getElementsByClassName('message-container').length;
				DOM.setActivePost(container);
				var isLivelinksPost;
				if (!replaying) {
					isLivelinksPost = true;
				}
				
				for (var i in messagecontainer) {
					if (CHROMELL.config[i + pm]) {
							messagecontainer[i](container, index, isLivelinksPost);
					}
				}		
				
				addListeners(container);
				
				utils.anchors.check(container);
				
				if (CHROMELL.config.click_expand_thumbnail) {
					misc.click_expand_thumbnail(container);
				}
				
				if (!CHROMELL.config.hide_ignorator_badge) {
					// send updated ignorator data to background script
					globalPort.postMessage({
						action: 'ignorator_update',
						ignorator: ignorated,
						scope: "messageList"
					});
				}
			};
			
			messagecontainer.eti_bash = function(msg, index) {
				anchor = document.createElement('a');
				anchor.style.cssFloat = 'right';
				anchor.href = '##bash';
				anchor.className = 'bash';
				anchor.id = "bash_" + index;
				anchor.innerHTML = '&#9744;';
				anchor.style.textDecoration = 'none';
				firstTop.appendChild(anchor);
			};	
			
			messagecontainer.ignorator_messagelist = function(msg, index) {
				if (!CHROMELL.config.ignorator) {
					return;
				}					
				var currentIndex;
				topsTotal += messageTops.length;
				for (var j = 0; j < messageTops.length; j++) {
					var top = messageTops[j];
					if (top) {
						var username = top.getElementsByTagName('a')[0].innerHTML.toLowerCase();
						for (var f = 0, len = ignores.length; f < len; f++) {
							if (username == ignores[f]) {
								// calculate equivalent index of message-top for
								// show_ignorator function
								if (j == 0 && topsTotal > 0) {
									currentIndex = topsTotal - messageTops.length; 
								}
								else {
									currentIndex = topsTotal - j;
								}
								top.parentNode.setAttribute('ignored', true);
								if (CHROMELL.config.debug) {
									console.log('removed post by '
											+ ignores[f]);
								}
								ignorated.total_ignored++;
								if (!ignorated.data.users[ignores[f]]) {
									ignorated.data.users[ignores[f]] = {};
									ignorated.data.users[ignores[f]].total = 1; 
									ignorated.data.users[ignores[f]].trs = [ currentIndex ];
								} else {
									ignorated.data.users[ignores[f]].total++;
									ignorated.data.users[ignores[f]].trs
											.push(currentIndex);
								}
								if (!CHROMELL.config.hide_ignorator_badge) {
									globalPort.postMessage({
										action: 'ignorator_update',
										ignorator: ignorated,
										scope: "messageList"
									});
								}
							}
						}
					}
				}
			};
			
			messagecontainer.user_notes = function(msg) {
				if (!CHROMELL.config.usernote_notes) {
					CHROMELL.config.usernote_notes = {};
				}
				if (!firstTop.getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
					return;
				}
				var notebook = document.createElement('a');	
				notebook.id = 'notebook';
				var divider = document.createTextNode(' | ');
				firstTop.appendChild(divider);
				var tempID = firstTop.getElementsByTagName('a')[0].href
						.match(/user=(\d+)$/i)[1];
				notebook.innerHTML = (CHROMELL.config.usernote_notes[tempID] != undefined 
						&& CHROMELL.config.usernote_notes[tempID] != '') 
								? 'Notes*' : 'Notes';
				notebook.href = "##note" + tempID;
				firstTop.appendChild(notebook);
			};
			
			messagecontainer.like_button = function(msg, index) {
					if (!window.location.href.match("archives")) {		
						var anchor = document.createElement('a');
						var divider = document.createTextNode(" | ");
						anchor.innerText = 'Like';
						anchor.className = 'like_button';
						anchor.href = '##like';
						firstTop.appendChild(divider);
						firstTop.appendChild(anchor);
						anchor.addEventListener('mouseenter', eventHandlers.mouseenter);
						anchor.addEventListener('mouseleave', eventHandlers.mouseleave);					
					}
			};
			
			messagecontainer.number_posts = function(msg, index, live) {
				var page;
				if (!window.location.href.match(/page=/)) {
					page = 1;
				}
				else {
					page = window.location.href.match(/page=(\d+)/)[1];
				}
				var id = (index + (50 * (page - 1)));
				if (id < 1000)
					id = "0" + id;
				if (id < 100)
					id = "0" + id;
				if (id < 10)
					id = "0" + id;
				var postNumber = document.createTextNode(' | #' + id);
				firstTop.appendChild(postNumber);
			};
			
			messagecontainer.post_templates = function(msg, index) {
				var sep, sepIns, qr;
				var cDiv = document.createElement('div');
				cDiv.style.display = 'none';
				cDiv.id = 'cdiv';
				document.body.appendChild(cDiv, null);
				// NOTE: This probably won't work??
				window.postEvent = document.createEvent('Event');
				window.postEvent.initEvent('postTemplateInsert', true, true);
				sep = document.createElement('span');
				sep.innerHTML = " | ";
				sep.className = "post_template_holder";
				sepIns = document.createElement('span');
				sepIns.className = 'post_template_opts';
				sepIns.innerHTML = '[';
				qr = document.createElement('a');
				qr.href = "##" + index;
				qr.innerHTML = "&gt;"
				qr.className = "expand_post_template";
				sepIns.appendChild(qr);
				sepIns.innerHTML += ']';
				sep.appendChild(sepIns);
				firstTop.appendChild(sep);
			};
			
			messagecontainer.userhl_messagelist = function(msg, index, live) {
				if (CHROMELL.config.enable_user_highlight) {
					var length = messageTops.length;
					
					if (CHROMELL.config.no_user_highlight_quotes) {
						// Only check first message-top element from message-container
						length = 1;
					}
					
					for (var k = 0; k < length; k++) {
						var top = messageTops[k];			
						var user = top.getElementsByTagName('a')[0].innerHTML.toLowerCase();
						
						if (CHROMELL.config.user_highlight_data[user]) {
							
							var userAttribute = user.replace(/\s|\)|:/g, '');			
							msg.dataset.user = userAttribute;
							top.dataset.user = userAttribute;
							top.dataset.highlighted = true;							
														
							if (CHROMELL.config.notify_userhl_post && live && k === 0 && user !== currentUser) {
							
								chrome.runtime.sendMessage({
									
									need: "notify",
									message: document.title.replace(/End of the Internet - /i, ''),
									title: "Post by " + user
									
								}, function() {
									// Do nothing - we just need to notify user
								});
								
							}
							
						}
						
					}
				}
			};
				
			messagecontainer.foxlinks_quotes = function(msg) {										
				var quotes = msg.getElementsByClassName('quoted-message');				
				for (var i = 0, len = quotes.length; i < len; i++) {
					var quote = quotes[i];
					
					// Set username as attribute to make sure that foxlinks quotes colours match user highlights
					if (msg.parentNode.className === 'message-top') {
						var anchor = messageTops[i].getElementsByTagName('a');
						if (anchor) {
							var user = anchor[0].innerHTML;
							var userAttribute = user.replace(/[^a-zA-Z0-9]/g, '');
							quote.setAttribute(userAttribute, true);
						}
					}
					
					quote.setAttribute('foxlinks', true);											
				}				
			};
			
			messagecontainer.label_self_anon = function(msg) {
				var tagList = document.getElementsByTagName('h2')[0];
				if (tagList.innerHTML.indexOf('/topics/Anonymous') > -1) {
					// skip archived topics as they don't have the quickpost-body element
					if (!window.location.href.match('archives')) {
						if (!messageTops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {				
							var self = document.getElementsByClassName('quickpost-body')[0]
									.getElementsByTagName('a')[0].innerHTML;
							if (self.indexOf('Human #') == -1) {
								// user hasn't posted in topic yet
								return;
							}
							else {
								for (var i = 0, len = messageTops.length; i < len; i++) {
									var top = messageTops[i];
									var element = top.getElementsByTagName('a')[0];
									
									if (element.innerHTML.indexOf('Filter') > -1) {
										element = top.getElementsByTagName('b')[0].nextSibling;	
										// trim nodeValue so that we can check for equality with self variable
										var humanToCheck = element.nodeValue.substring(1, element.nodeValue.length);
										humanToCheck = humanToCheck.replace(' | ', '');
										if (humanToCheck == self) {											
											var span = document.createElement('span');
											span.innerHTML = '<b>(Me)</b> | ';
											top.insertBefore(span, element.nextSibling);		
										}
									}
									
									else if (element.innerHTML == self) {
											var span = document.createElement('span');
											span.innerHTML = ' | <b>(Me)</b>';
											top.insertBefore(span, element.nextSibling);
									}
								}
							}
						}
					}
				}
			};	
			
			// NOTE: The following 4 methods are only called for livelinks posts
			
			messagecontainer.autoscroll_livelinks = function(mutation, index, isLive) {
				if (isLive && document.hidden && autoscrollCheck(mutation) ) {
					$.scrollTo(mutation);
				}
			};
			
			messagecontainer.autoscroll_livelinks_active = function(mutation, index, isLive) {
				if (isLive && !document.hidden && autoscrollCheck(mutation)) {
					// trigger after 10ms delay to prevent undesired 
					// behaviour in post_title_notification	
					setTimeout(function() {
						scrolling = true;
						$.scrollTo((mutation), 800);
					}, 10);
					
					setTimeout(function() {
						scrolling = false;	
					}, 850);
				}
			},
			
			messagecontainer.post_title_notification = function(mutation, index, isLive) {
				if (isLive) {
					if (mutation.style.display === "none") {
						if (CHROMELL.config.debug) {
							console.log('not updating for ignorated post');
						}
						return;
					}
					if (mutation.getElementsByClassName('message-top')[0]
							.getElementsByTagName('a')[0].innerHTML == currentUser) {
						return;
					}
					var posts = 1;
					var ud = '';
					if (document.getElementsByClassName('message-container')[49]) {
						ud = ud + "+";
					}
					if (document.title.match(/\(\d+\)/)) {
						posts = parseInt(document.title.match(/\((\d+)\)/)[1]);
						document.title = "(" + (posts + 1) + ud + ") "
								+ document.title.replace(/\(\d+\) /, "");
					} else {
						document.title = "(" + posts + ud + ") " + document.title;
					}
				}
			};
			
			messagecontainer.notify_quote_post = function(mutation, index, isLive) {
				if (isLive) {
					if (!mutation.getElementsByClassName('quoted-message')) {
						return;
					}
					if (mutation.getElementsByClassName('message-top')[0]
							.getElementsByTagName('a')[0].innerHTML == currentUser) {
						// dont notify when quoting own posts
						return;
					}
					var notify = false;
					var msg = mutation.getElementsByClassName('quoted-message');
					for (var i = 0, len = msg.length; i < len; i++) {
						if (msg[i].getElementsByClassName('message-top')[0]
								.getElementsByTagName('a')[0].innerHTML == currentUser) {
							if (msg[i].parentNode.className != 'quoted-message')
								// only display notification if user has been directly quoted
								notify = true;
						}
					}
					if (notify) {
						chrome.runtime.sendMessage({
							need: "notify",
							title: "Quoted by "
									+ mutation.getElementsByClassName('message-top')[0]
											.getElementsByTagName('a')[0].innerHTML,
							message: document.title.replace(/End of the Internet - /i, '')
						}, function(data) {
							console.log(data);
						});
					}
				}	
			};	
			
			/*messagecontainer.userpics = function(msg) {
				var userAnchor = messageTops[0].getElementsByTagName('a')[0];
				if (userAnchor.href.indexOf('endoftheinter.net/profile.php?user=') > -1) {
					var messageElement = msg.getElementsByClassName('message')[0];
					var username = userAnchor.innerHTML;
					var userpic = {					
						fullsize: window.location.protocol + '//pix.tiko.be/pic.php?u=' + username,
						thumbnail: window.location.protocol + '//pix.tiko.be/pic.php?u=' + username + '&t'
					};
					var image = document.createElement('img');
					image.className = 'userpic_addon';
					image.src = userpic.thumbnail;
					image.href = userpic.fullsize;
					image.title = username;
					messageElement.insertBefore(image, messageElement.firstChild);
					image.onload = function() {
						if (this.height === 1) {
							this.remove();
						}						
					}
				}
			};*/
			
			infobar.imagemap_on_infobar = function() {
				var regex = window.location.search.match(/(topic=)([0-9]+)/);
				if (regex) {
					var topicNumber = regex[0];
				}
				else {
					return;
				}
				var page = location.pathname;
				var anchor = document.createElement('a');
				var divider = document.createTextNode(" | ");
				if (page == "/imagemap.php" && topicNumber) {
					anchor.href = '/showmessages.php?' + topicNumber;
					anchor.innerText = 'Back to Topic';
					infobarElement.appendChild(divider);
					infobarElement.appendChild(anchor);
				} else if (page == "/showmessages.php") {
					anchor.href = '/imagemap.php?' + topicNumber;
					anchor.innerText = 'Imagemap';
					infobarElement.appendChild(divider);
					infobarElement.appendChild(anchor);
				}
			};
			
			infobar.expand_spoilers = function() {
				var ains = document.createElement('span');
				var anchor = document.createElement('a');
				var divider = document.createTextNode(' | ');
				anchor.id = 'chromell_spoilers';
				anchor.href = '##';
				anchor.innerText = 'Expand Spoilers';
				infobarElement.appendChild(divider);
				infobarElement.appendChild(anchor);
				anchor.addEventListener('click', utils.spoilers.find);		
			};
			
			quickpostbody.filter_me = function() {
				var tops = document.getElementsByClassName('message-top');
				if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
					// Anonymous topic - check quickpost-body for human number
					if (window.location.hostname == 'archives.endoftheinter.net') {
						// Archived anon topics don't have quickpost-body element
						return;
					}
					else if (quickpostElement.getElementsByTagName('a')) {
						var human = quickpostElement.getElementsByTagName('a')[0]
								.innerText.replace('Human #', '');
						if (isNaN(human)) {
							// Usually means the first anchor element was pulled from the tag info popups
							return;
						}
						else {
							var me = '&u=-' + human;
						}
					}
				}
				else {
					// handle non anonymous topics
					var me = '&u=' + currentID;
				}
				var topic = window.location.href.match(/topic=([0-9]+)/)[1];
				var anchor = document.createElement('a');		
				var divider = document.createTextNode(" | ");		
				if (window.location.href.indexOf(me) == -1) {
					anchor.href = window.location.href.split('?')[0] + '?topic=' + topic + me;
					anchor.innerHTML = 'Filter Me';
				} else {
					anchor.href = window.location.href.replace(me, '');
					anchor.innerHTML = 'Unfilter Me';
				}
				infobarElement.appendChild(divider);
				infobarElement.appendChild(anchor);
			};
			
			quickpostbody.quick_imagemap = function() {
				if (quickpostElement) {
					var button = document.createElement('button');
					var divider = document.createTextNode(' ');
					var search = document.createElement('input');
					button.textContent = "Browse Imagemap";					
					button.id = "quick_image";
					search.placeholder = "Search Imagemap...";
					search.id = "image_search";
					quickpostElement.appendChild(divider);
					quickpostElement.appendChild(button);
					quickpostElement.appendChild(divider);
					quickpostElement.appendChild(search);
				}
			};
			
			quickpostbody.post_before_preview = function() {
				var inputs = quickpostElement.getElementsByTagName('input');
				var input;
				var preview;
				var post;
				for (var i = 0, len = inputs.length; i < len; i++) {
					input = inputs[i];
					if (input.name == 'preview') {
						preview = input;
					}
					if (input.name == 'post') {
						post = input;
					}
				}
				post.parentNode.removeChild(post);
				preview.parentNode.insertBefore(post, preview);
			};
			
			quickpostbody.batch_uploader = function() {
				var ulBox = document.createElement('input');
				var ulButton = document.createElement('input');		
				ulBox.type = 'file';
				ulBox.multiple = true;
				ulBox.id = "batch_uploads";
				ulButton.type = "button";
				ulButton.value = "Batch Upload";
				ulButton.addEventListener('click', helpers.startBatchUpload);
				quickpostElement.insertBefore(ulBox, null);
				quickpostElement.insertBefore(ulButton, ulBox);
			};
			
			quickpostbody.quickpost_on_pgbottom = function() {
				chrome.runtime.sendMessage({
					need: "insertcss",
					file: "src/css/quickpost_on_pgbottom.css"
				});
			};
			
			quickpostbody.quickpost_tag_buttons = function() {
				if (!window.location.href.match('archives')) {
					var insM = document.createElement('input');
					insM.value = 'Mod';
					insM.name = 'Mod';
					insM.type = 'button';
					insM.id = 'mod';
					insM.addEventListener("click", helpers.qpTagButton, false);
					var insA = document.createElement('input');
					insA.value = 'Admin';
					insA.name = 'Admin';
					insA.type = 'button';
					insA.addEventListener("click", helpers.qpTagButton, false);
					insA.id = 'adm';
					var insQ = document.createElement('input');
					insQ.value = 'Quote';
					insQ.name = 'Quote';
					insQ.type = 'button';
					insQ.addEventListener("click", helpers.qpTagButton, false);
					insQ.id = 'quote';
					var insS = document.createElement('input');
					insS.value = 'Spoiler';
					insS.name = 'Spoiler';
					insS.type = 'button';
					insS.addEventListener("click", helpers.qpTagButton, false);
					insS.id = 'spoiler';
					var insP = document.createElement('input');
					insP.value = 'Preformated';
					insP.name = 'Preformated';
					insP.type = 'button';
					insP.addEventListener("click", helpers.qpTagButton, false);
					insP.id = 'pre';
					var insU = document.createElement('input');
					insU.value = 'Underline';
					insU.name = 'Underline';
					insU.type = 'button';
					insU.addEventListener("click", helpers.qpTagButton, false);
					insU.id = 'u';
					var insI = document.createElement('input');
					insI.value = 'Italic';
					insI.name = 'Italic';
					insI.type = 'button';
					insI.addEventListener("click", helpers.qpTagButton, false);
					insI.id = 'i';
					var insB = document.createElement('input');
					insB.value = 'Bold';
					insB.name = 'Bold';
					insB.type = 'button';
					insB.addEventListener("click", helpers.qpTagButton, false);
					insB.id = 'b';
					quickpostElement.insertBefore(insM, quickpostElement.getElementsByTagName('textarea')[0]);
					quickpostElement.insertBefore(insQ, insM);
					quickpostElement.insertBefore(insS, insQ);
					quickpostElement.insertBefore(insP, insS);
					quickpostElement.insertBefore(insU, insP);
					quickpostElement.insertBefore(insI, insU);
					quickpostElement.insertBefore(insB, insI);
					quickpostElement.insertBefore(document.createElement('br'), insB);
				}
			};
			
			quickpostbody.drop_batch_uploader = function() {
				if (window.location.href.indexOf('postmsg.php') > -1 
				|| window.location.hostname.indexOf("archives") > -1) {
					return;
				}
				var quickreply = quickpostElement.getElementsByTagName('textarea')[0];
				quickreply
						.addEventListener(
								'drop',
								function(evt) {
									evt.preventDefault();
									if (evt.dataTransfer.files.length == 0) {
										console.log(evt);
										return;
									}
									quickpostElement.getElementsByTagName('b')[0].innerHTML += " (Uploading: 1/" + evt.dataTransfer.files.length + ")";
									CHROMELL.allPages.utils.asyncUpload(evt.dataTransfer.files);
								});
			};
			
			quickpostbody.snippet_listener = function() {
				if (window.location.hostname.indexOf("archives") == -1) {
					var ta = document.getElementsByName('message')[0];
					var caret;
					ta.addEventListener('keydown', 
						function(event) {
							if (CHROMELL.config.snippet_alt_key) {
								if (event.shiftKey == true
										&& event.keyIdentifier == 'U+0009') {
									event.preventDefault();
									caret = utils.snippets.findCaret(ta);
									utils.snippets.handler(ta.value, caret);				
								}
							}
							else if (!CHROMELL.config.snippet_alt_key) {
								if (event.keyIdentifier == 'U+0009') {
									event.preventDefault();
									caret = utils.snippets.findCaret(ta);
									utils.snippets.handler(ta.value, caret);
								}
							}		
						}
					);
				}
			};		
				
			// TODO - find better way to categorise these functions	
			misc.highlight_tc = function() {
				var tcs = utils.tcs.getMessages();
				var tc;
				if (!tcs) {
					return;
				}
				for (var i = 0, len = tcs.length; i < len; i++) {
					tc = tcs[i];
					if (CHROMELL.config.tc_highlight_color) {
						tc.getElementsByTagName('a')[0].style.color = '#'
								+ CHROMELL.config.tc_highlight_color;
					}
				}
			};

			misc.label_tc = function() {
				var tcs = utils.tcs.getMessages();
				if (!tcs) {
					return;
				}
				var color = false;
				if (CHROMELL.config.tc_label_color 
						&& CHROMELL.config.tc_label_color != '') {
					color = true;
				}
				for (var i = 0, len = tcs.length; i < len; i++) {
					var tc = tcs[i];
					var span = document.createElement('span');
					var b = document.createElement('b');
					var text = document.createTextNode('TC');
					var divider = document.createTextNode(' | ');
					b.appendChild(text);
					if (color) {
						b.style.color = '#' + CHROMELL.config.tc_label_color;
					}
					span.appendChild(divider);
					span.appendChild(b);			
					username = tc.getElementsByTagName('a')[0];
					username.outerHTML += span.innerHTML;
				}
			};
				
			misc.pm_title = function() {
				if (window.location.href.indexOf('inboxthread.php') == -1) {
					return;
				}
				var me = userbarElement.getElementsByTagName('a')[0].innerText;
				var other = '';
				var tops = document.getElementsByClassName('message-top');
				var top;
				for (var i = 0, len = tops.length; i < len; i++) {
					top = tops[i];
					if (top.getElementsByTagName('a')[0].innerText.indexOf(me) == -1) {
						other = top.getElementsByTagName('a')[0].innerText;
						break;
					}
				}
				document.title = "PM - " + other;
			};
			
			misc.post_title_notification = function() {
				document.addEventListener('visibilitychange', helpers.clearUnreadPosts);
				document.addEventListener('mousemove', helpers.clearUnreadPosts);
			};

			misc.click_expand_thumbnail = function(newPost) {
				var messages;
				if (newPost && typeof newPost != 'string') {
					messages = newPost.getElementsByClassName('message');
				} else {
					messages = document.getElementsByClassName('message');
				}
				for (var i = 0, len = messages.length; i < len; i++) {
					var message = messages[i];
					// rewritten by xdrvonscottx
					// find all the placeholders before the images are loaded
					var pholds = message.getElementsByClassName('img-placeholder');
					for (var j = 0; j < pholds.length; j++) {
						var phold = pholds[j];
						// Pass placeholder element to mutation observer so we can resize images as necessary
						utils.image.observer.observe(phold, {
							attributes: true,
							childList: true
						});
					}
				}
			};
			
			misc.loadquotes = function() {
				// TODO: Refactor this.			
				function getElementsByClass(searchClass, node, tag) {
					var classElements = new Array();
					if (node == null)
						node = document;
					if (tag == null)
						tag = '*';
					var els = node.getElementsByTagName(tag);
					var elsLen = els.length;
					for (var i = 0, j = 0; i < elsLen; i++) {
						if (els[i].className == searchClass) {
							classElements[j] = els[i];
							j++;
						}
					}
					return classElements;
				}

				function imagecount() {
					var imgs = document.getElementsByTagName('img').length;
					return imgs;
				}

				if (document.location.href.indexOf("https") == -1) {
					var url = "http";
				} else {
					var url = "https";
				}

				function coolCursor() {
					this.style.cursor = 'pointer';
				}

				function processPage(XML, element) {
					var newPage = document.createElement("div");
					newPage.innerHTML = XML;
					var newmessage = getElementsByClass('message', newPage, null)[0];
					var scripttags = newmessage.getElementsByTagName('script');
					for (var i = 0; i < scripttags.length; i++) {
						var jsSource = scripttags[i].innerHTML
								.replace(
										/onDOMContentLoaded\(function\(\)\{new ImageLoader\(\$\("u0_1"\), "\\\/\\\//gi,
										'').replace(/\\/gi, '').replace(/\)\}\)/gi, '')
								.split(',');
						var replacement = new Image();
						replacement.src = url + '://' + jsSource[0].replace(/"$/gi, '');
						replacement.className = 'expandimagesLOL';
						scripttags[i].parentNode.replaceChild(replacement,
								scripttags[i]);
						i--;
					}
					if (newmessage.innerHTML.indexOf('---') != -1) {
						var j = 0;
						while (newmessage.childNodes[j]) {
							if (newmessage.childNodes[j].nodeType == 3
									&& newmessage.childNodes[j].nodeValue
											.indexOf('---') != -1) {
								while (newmessage.childNodes[j]) {
									newmessage.removeChild(newmessage.childNodes[j]);
								}
							}
							j++;
						}
					}
					element.parentNode.appendChild(newmessage);
				}

				function loadMessage() {
					var mssgurl = this.id;
					var newSpan = document.createElement('span');
					newSpan.innerHTML = 'Loading message...';
					var loadingImg = new Image();
					loadingImg.src = 'data:image/gif;base64,'
							+ 'R0lGODlhEAAQAPIAAP///2Zm/9ra/o2N/mZm/6Cg/rOz/r29/iH/C05FVFNDQVBFMi4wAwEAAAAh/hpD'
							+ 'cmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZ'
							+ 'nAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi6'
							+ '3P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAs'
							+ 'AAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKp'
							+ 'ZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8D'
							+ 'YlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJU'
							+ 'lIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe8'
							+ '2p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAAD'
							+ 'Mgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAA'
							+ 'LAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsR'
							+ 'kAAAOwAAAAAAAAAAAA==';
					this.parentNode.insertBefore(newSpan, this);
					this.parentNode.replaceChild(loadingImg, this);
					var ajax = new XMLHttpRequest();
					ajax.open('GET', url + '://boards.endoftheinter.net/message.php?'
							+ mssgurl, true);
					ajax.send(null);
					ajax.onreadystatechange = function() {
						if (ajax.readyState == 4) {
							if (ajax.status == 200) {
								processPage(ajax.responseText, newSpan);
								loadingImg.parentNode.removeChild(loadingImg);
								newSpan.parentNode.removeChild(newSpan);
							} else {
								alert("An error occurred loading the message. Fuck shit.");
							}
						}
					}
				}

				function findQuotes() {
					var quotes = getElementsByClass('quoted-message', document, 'div');
					for (var i = 0; i < quotes.length; i++) {
						var anchors = quotes[i].getElementsByTagName('a');
						for (var j = 0; j < anchors.length; j++) {
							if (anchors[j].innerHTML == '[quoted text omitted]') {
								anchors[j].removeAttribute('href');
								var parts = anchors[j].parentNode.getAttribute('msgid')
										.split(',');
								var secondsplit = parts[2].split('@');
								anchors[j].id = 'id=' + secondsplit[0] + '&topic='
										+ parts[1] + '&r=' + secondsplit[1];
								anchors[j].addEventListener('click', loadMessage, true);
								anchors[j].style.textDecoration = 'underline';
								anchors[j].title = 'Click to load the omitted message';
								anchors[j].addEventListener('mouseover', coolCursor,
										true);
							}
						}
					}
				}

				var currentMessages = 0;

				function checkMssgs() {
					var mssgs = getElementsByClass('message-container', document
							.getElementById('u0_1'), 'div').length;
					if (mssgs > currentMessages) {
						findQuotes();
						currentMessages = mssgs;
					}
				}
				var interval = window.setInterval(checkMssgs, 1000);
			};
			
			misc.load_next_page = function() {
				document.getElementById('u0_3').addEventListener('dblclick',
						helpers.loadNextPage);
			};
			
			return {
				init: init,
				scrolling: scrolling,
				addCSSRules: addCSSRules,
				setActivePost: setActivePost,
				appendToPage: appendToPage
			};
			
		}();

		var eventHandlers = function() {
			var imagemapDebouncer = '';
			var menuDebouncer = '';
			var popupDebouncer = '';
			var debouncer = '';
			var _cachedEvent = '';
			var _cachedScrollEvt = '';
			var embeddedVideos = false;
			
			var ignoratorUpdate = function(msg) {
				if (msg.action !== 'ignorator_update') {	
					switch (msg.action) {
						case "showIgnorated":				
							if (CHROMELL.config.debug) {
								console.log("showing hidden msg", msg.ids);
							}
							var tops = document.getElementsByClassName('message-top');
							for (var i = 0; i < msg.ids.length; i++) {
								if (CHROMELL.config.debug) {
									console.log(tops[msg.ids[i]]);
								}
								tops[msg.ids[i]].parentNode.style.display = 'block';
								tops[msg.ids[i]].parentNode.style.opacity = '.7';
							}
							break;
						default:
							if (CHROMELL.config.debug)
								console.log('invalid action', msg);
							break;
					}
				}
			};
			
			var mouseclick = function(evt) {
				
				if (evt.target.className) {
					switch (evt.target.className) {
						case 'expand_post_template':
							helpers.postTemplateExpand(evt.target);
							return;
							
						case 'shrink_post_template':
							helpers.postTemplateShrink(evt.target);
							return;
							
						case 'post_template_title':
							helpers.postTemplateExpand(evt.target);					
							return;
							
						case 'notebook':
							utils.usernotes.open(evt.target);
							evt.preventDefault();						
							return;
							
						case 'like_button':
							utils.likeButton.process(evt.target);
							evt.preventDefault();
							return;
							
						case 'like_button_custom':
							var templateNumber = evt.target.id;
							for (var i = 0, len = evt.path.length; i < len; i++) {
								var pathNode = evt.path[i];
								if (pathNode.className == 'like_button') {
									utils.likeButton.process(pathNode, templateNumber);			
									break;
								}
							}
							evt.preventDefault();					
							return;
							
						case 'youtube':
							// Prevent div containing embedded video acting as anchor tag
							if (evt.target.tagName === 'DIV') {
								evt.preventDefault();
							}
							return;
							
						case 'gfycat':
							// Prevent div containing embedded video acting as anchor tag
							if (evt.target.tagName === 'DIV') {
								evt.preventDefault();
							}
							return;
							
						case 'archivequote':
							utils.quote.handler(evt);
							evt.preventDefault();						
							return;
							
						case 'bash':
							if (!evt.target.getAttribute('ignore')) {
								evt.target.className = 'bash_this';			
								evt.target.style.fontWeight = 'bold';
								evt.target.innerHTML = '&#9745;';
								utils.bash.checkSelection(evt.target);
								utils.bash.showPopup();	
								evt.preventDefault();								
							}
							return;
							
						case 'bash_this':
							evt.target.className = 'bash';
							evt.target.style.fontWeight = 'initial';
							evt.target.innerHTML = '&#9744;';
							utils.bash.checkSelection(evt.target);
							evt.preventDefault();
							return;
							
						default:						
							break;
						
					}
				}
				
				else if (evt.target.id == 'quick_image') {
					// imagemap object located in imagemap.js
					imagemap.init();
					evt.preventDefault();					
				}
				
				else if (evt.target.title.indexOf("/index.php") === 0) {
					utils.anchors.fixRedirect(evt.target, "wiki");
					evt.preventDefault();
				}
				
				else if (evt.target.title.indexOf("/imap/") === 0) {
					utils.anchors.fixRedirect(evt.target, "imagemap");					
					evt.preventDefault();
				}
				
				else if (evt.target.parentNode) {
					if (evt.target.parentNode.className == 'embed') {
						utils.youtube.embed(evt.target.parentNode);
						evt.preventDefault();
					}
					else if (evt.target.parentNode.className == 'hide') {
						utils.youtube.hide(evt.target.parentNode);
						evt.preventDefault();
					}
					else if (evt.target.parentNode.id == 'submitbash') {
						utils.bash.handler();
						evt.preventDefault();
					}
					else if (evt.target.parentNode.className == 'embed_nws_gfy') {
						var gfycatID = evt.target.parentNode.id.replace('_embed', '');
						utils.embed('gfy', document.getElementById(gfycatID));
						evt.preventDefault();
					}
				}
			};
			
			var mouseenter = function(evt) {
				if (evt.target.className == 'like_button' && CHROMELL.config.custom_like_button) {
					eventHandlers.cacheEvent(evt);
					menuDebouncer = setTimeout(utils.likeButton.showOptions, 250);
					evt.preventDefault();	
				}
				else if (evt.target.className == 'username_anchor' && CHROMELL.config.user_info_popup) {
					CHROMELL.allPages.cacheEvent(evt);
					popupDebouncer = setTimeout(function() {
							CHROMELL.allPages.utils.popup.init();
							document.getElementsByClassName('body')[0].style.opacity = 0.7;
					}, 750);
				}
			};
			
			var mouseleave = function(evt) {
				clearTimeout(menuDebouncer);
				clearTimeout(popupDebouncer);
				if (document.getElementById('hold_menu')) {
					utils.likeButton.hideOptions();
					evt.preventDefault();
				}
			};
			
			var search = function() {
				// perform search after 250ms of no keyboard activity to improve performance
				clearTimeout(imagemapDebouncer);
				imagemapDebouncer = setTimeout(function() {
					// imagemap object located in imagemap.js
					imagemap.search.init.call(imagemap.search);
				}, 250);
			};
			
			var scrollDebouncer = function(evt){
				clearTimeout(debouncer);
				_cachedScrollEvt = evt;
				debouncer = setTimeout(scrollHandler, 25);
			};
			
			var scrollHandler = function() {
				var evt = _cachedScrollEvt;
				var nextPage = document.getElementById('nextpage');

				helpers.clearUnreadPosts();
				
				// Automatically load next page
				if (CHROMELL.config.load_after_reading 
						&& nextPage.style.display === 'block' 
						&& window.innerHeight + document.body.scrollTop >= document.body.offsetHeight - 5) {						
					
					helpers.loadNextPage();
					
				}
				
				utils.anchors.embedHandler();
			};
			
			return {
				ignoratorUpdate: ignoratorUpdate,
				mouseclick: mouseclick, 
				mouseenter: mouseenter,
				mouseleave: mouseleave,
				search: search,
				scrollDebouncer: scrollDebouncer,
				cacheEvent: function(event) {
					_cachedEvent = event;
				},
				cachedEvent: function() {					
					return _cachedEvent;
				},
				videoEmbed: function() {
					_embeddedVideos = true;
				}
			};
			
		}();
		
		var utils = function() {
			
			var checkAPI = function(api, url, callback) {
				var endpoints = {
					gfy: '//gfycat.com/cajax/get/',
					imgur: '//api.imgur.com/3/image/'				
				};
				var splitURL = url.split('/').slice(-1);	
				var code = splitURL.join('/').replace(/.gifv|.webm/, '');
				var url = window.location.protocol + endpoints[api] + code;	
				
				var auth;	
				if (api === 'imgur') {
					// Authorization header contains client ID (required for accessing Imgur API)
					var auth = 'Client-ID 6356976da2dad83';
					// All Imgur requests have to be made using HTTPS.
					url = url.replace('http:', 'https:');
				}
				
				// Make API request from background page, so we can force HTTPS
				chrome.runtime.sendMessage({
					need: "xhr",
					url: url,
					auth: auth
				}, function(response) {
						var data = JSON.parse(response);
						handleResponse(api, code, data, callback);
				});
				
			};
		
			var handleResponse = function(api, code, response, callback) {
				var data = response.gfyItem || response.data;
				if (!data) {
					callback('error');
				}
				// Documentation for the Gfycat API: http://gfycat.com/api
				// Documentation for the Imgur image data model: https://api.imgur.com/models/image						
				var apiData = {
					code: code,
					url: function() {
						var url = data.webm || data.webmUrl;
						if (window.location.protocol == 'https:') {									
							return url.replace('http:', 'https:');
						}
						else {
							return url;
						}
						
					}(),
					
					width: function() {					
						if (CHROMELL.config['resize_' + api + 's'] 
								&& data.width > CHROMELL.config[api + '_max_width']) {
							return CHROMELL.config[api + '_max_width'];
						}
						else {
							return data.width;	
						}		
						
					}(),
					
					height: function() {					
						if (CHROMELL.config['resize_' + api + 's'] 
								&& data.width > CHROMELL.config[api + '_max_width']) {
							// scale video height to match gfy_max_width value
							return (data.height / (data.width / CHROMELL.config[api + '_max_width']));
						}
						else {
							return data.height;
						}
						
					}(),			
					
					title: data.title || data.redditIdText,
					nsfw: data.nsfw

				};					

				callback(apiData);

			};
			
			var createPlaceholder = function(api, videoAnchor, needThumbnail) {
				var url = videoAnchor.getAttribute('href');
				var display;			
				(CHROMELL.config.show_gfycat_link)
						? display = 'inline' 
						: display = 'none';
						
				checkAPI(api, url, function(data) {
					if (data === "error") {
						// revert class name to stop loader from detecting link
						videoAnchor.className = 'l';
						return;
					}
					
					// For now, use hide_nws_gfycat setting for both gfycat & imgur embedding.		
					if (CHROMELL.config.hide_nws_gfycat) {
						var isWorkSafe = workSafe(api, videoAnchor, data.nsfw);
						if (document.getElementsByTagName('h2')[0].innerHTML.match(/N[WL]S/) || !isWorkSafe) {						
							videoAnchor.className = 'nws_' + api;
							embedOnHover(api, videoAnchor, data.url, data.width, data.height);
							return;
						}		
					}
						
					else {
						var placeholder = document.createElement('div');								
						placeholder.setAttribute('name', 'placeholder');
						placeholder.className = api;
						placeholder.id = data.url;
						placeholder.title = data.title || data.url;
						if (needThumbnail) {
							placeholder.setAttribute('name', 'placeholder_thumb');							
							createThumbnail(api, videoAnchor, placeholder, display, data);
							return;
						}
						else {
							placeholder.innerHTML = '<video width="' + data.width + '" height="' + data.height + '" loop >'
									+ '</video>'
									+ '<span style="display:none"><br><br>' + url + '</span>';
									
							// TODO: Fix this bug properly								
							// prevent "Cannot read property 'replaceChild' of null" error
							
							if (videoAnchor.parentNode) {
								videoAnchor.parentNode.replaceChild(placeholder, videoAnchor);
								// check if placeholder is visible (some placeholders will be off screen)
								var position = placeholder.getBoundingClientRect();
								if (position.top > window.innerHeight) {
									return;
								}
								else {
									// pass placeholder video element to embed function
									embed(api, placeholder);
								}
							}
						}
					}
				});
			};
				
			var createThumbnail = function(apiType, videoAnchor, placeholder, displayAttribute, data) {
				
				var thumbnails = {
					imgur: window.location.protocol + '//i.imgur.com/' + data.code + 'l.jpg',
					gfy: 'http://thumbs.gfycat.com/' + data.code + '-poster.jpg'
				};
				var thumbnailURL = thumbnails[apiType];		
				
				var image = new Image();		
				image.src = thumbnailURL;
				// Make thumbnails (in quoted posts) half the size of the original image.				
				image.width = data.width / 2;
				image.height = data.height / 2;
				image.title = "Click to play";

				var span = document.createElement('span');
				span.style.display = displayAttribute;
				span.innerHTMl = '<br><br>' + data.url;
				
				image.appendChild(span);
				placeholder.appendChild(image);
				
				if (videoAnchor.parentNode) {
					videoAnchor.parentNode.replaceChild(placeholder, videoAnchor);			
					var img = placeholder.getElementsByTagName('img')[0];
					
					img.addEventListener('click', function(ev) {
						
						var video = document.createElement('video');
						video.setAttribute('loop', true);												
						video.src = placeholder.id;
						video.width = this.width;
						video.height = this.height;
						placeholder.replaceChild(video, this);
						placeholder.setAttribute('name', 'embedded_thumb');
						video.play();
						
						video.addEventListener('click', function(ev) {					
							(!this.paused) ? this.pause() : this.play();					
						});
						
					});						
					
				}
				
			};
				
			var workSafe = function(api, element, nsfw) {
				// check whether link is nws using gfycat api & post content
				var userbar = document.getElementsByTagName('h2')[0];
				if (element.parentNode) {
					var postHTML = element.parentNode.innerHTML;
					// only check topics without NWS/NLS tags
					if (!userbar.innerHTML.match(/N[WL]S/)) {				
						if (postHTML.match(/(n[wl]s)/i)) {
							element.className = 'nws_' + api;
							return false;
						}
					}
				}
				
				else if (nsfw === '1') {
					element.className = 'nws_' + api;
					return false;
				}
				
				else {
					return true;
				}
			};				
				
			var embedOnHover = function(api, element, url, width, height) {
				// handle NWS videos
				element.id = url;
				element.setAttribute('w', width);
				element.setAttribute('h', height);		
				$(element).hoverIntent(
					function() {
						var color = $("table.message-body tr td.message").css("background-color");
						if (this.className.match(/nws_/)) {
							$(this).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; " 
									+ "background: " + color 
									+ ";'><a id='" + url + '_embed'
									+ "'class='embed_nws_" + api + "' href='##'>&nbsp<b>[Embed NWS Video]</b></a></span>"));
						}
					}, function() {
						if (this.className.match(/nws_/)) {
							$(this).find("span").remove();
						}
					}
				);
			};				
			
			var pauseVideos = function() {
				if (document.hidden) {
					var videos = document.getElementsByTagName('video');
					for (var i = 0, len = videos.length; i < len; i++) {
						var video = videos[i];
						if (video.src && !video.paused) {
							video.pause();
						}
					}
				}
				else {
					// Call loader methods so that only visible videos are played
					gfycat.loader();
					imgur.loader();
				}
			};
		
			var embed = function(api, placeholder) {
				
				if (placeholder.getAttribute('name') == 'placeholder') {
					var video = placeholder.getElementsByTagName('video')[0];
					if (CHROMELL.config.show_gfycat_link) {
						placeholder.getElementsByTagName('span')[0].style.display = 'inline';
					}
					placeholder.setAttribute('name', 'embedded');
					// placeholder id is webm url
					video.src = placeholder.id;
					video.play();
				}
				
				else if (placeholder.className == 'nws_' + api) {
					var video = document.createElement('video');
					var width = placeholder.getAttribute('w');
					var height = placeholder.getAttribute('h');				
					video.setAttribute('width', width);
					video.setAttribute('height', height);
					video.setAttribute('name', 'embedded');
					video.setAttribute('loop', true);
					video.src = placeholder.id;				
					placeholder.parentNode.replaceChild(video, placeholder);			
					video.play();
				}
				
			};
			
			var gfycat = function() {

				var handleAnchor = function(element) {
					if (element.getAttribute('name') == 'gfy_thumb') {
						// Pass truthy value as 3rd parameter to indicate that we need a thumbnail
						createPlaceholder('gfy', element, true);			
					}
					else {
						createPlaceholder('gfy', element);
					}
				};		
			
				return {
					loader: function() {
						var gfycats = document.getElementsByClassName('gfy');
						var height = window.innerHeight;
						for (var i = 0, len = gfycats.length; i < len; i++) {
							var gfycat = gfycats[i];
							var position = gfycat.getBoundingClientRect();

								// Check whether element is currently hidden from viewport
								if (position.top > height + 200 
										|| position.bottom < 0) {
										
									if (gfycat.getAttribute('name') == 'embedded'
											|| gfycat.getAttribute('name') == 'embedded_thumb') {
										
										if (gfycat.getElementsByTagName('video') 
													&& !gfycat.getElementsByTagName('video')[0].paused) {
											// Pause hidden video elements to reduce CPU load
											gfycat.getElementsByTagName('video')[0].pause();									
										}
										
										else if (gfycat.tagName == 'A') {
											handleAnchor(gfycat);											
										}
									}
								}
								
								else {
									// Handle visible elements							
									if (gfycat.tagName == 'A') {
										handleAnchor(gfycat);
									}
									
									else if (gfycat.getAttribute('name') == 'placeholder') {
										embed('gfy', gfycat);
									}
									
									else if (gfycat.getAttribute('name') == 'embedded'
											&& gfycat.getElementsByTagName('video')[0].paused) {									
										gfycat.getElementsByTagName('video')[0].play();								
									}
									
								}
						}
					}
				};
				
			}();
			
			var imgur = function() {
				
				return {
					loader: function() {
						var imgurElements = document.getElementsByClassName('imgur');
						var height = window.innerHeight;
						for (var i = 0, len = imgurElements.length; i < len; i++) {
							var imgurElement = imgurElements[i];			
							var position = imgurElement.getBoundingClientRect();
							// use window height + 200 to increase visibility of gfycatLoader
							// TODO: Refactor these conditionals
							if (position.top > height + 200 
									|| position.bottom < 0) {
								if (imgurElement.getAttribute('name') == 'embedded'
									|| imgurElement.getAttribute('name') == 'embedded_thumb')
									if (!imgurElement.getElementsByTagName('video')[0].paused) {
									// pause hidden video elements to reduce CPU load
									imgurElement.getElementsByTagName('video')[0].pause();
								}
							}
							else if (imgurElement.tagName == 'A') {
								if (imgurElement.getAttribute('name') == 'imgur_thumb') {
									// Pass truthy value as 3rd parameter to indicate that we need a thumbnail									
									createPlaceholder('imgur', imgurElement, true);			
								} else {
									createPlaceholder('imgur', imgurElement);
								}
							}
							else if (imgurElement.getAttribute('name') == 'placeholder') {
								embed('imgur', imgurElement);
							}
							else if (imgurElement.getAttribute('name') == 'embedded'
									&& imgurElement.getElementsByTagName('video')[0].paused) {
								imgurElement.getElementsByTagName('video')[0].play();
							}
						}
					}
				};
				
			}();
			
			var youtube = function() {
				// Contains methods for YouTube video embedding feature.
				
				var getVideoCode = function(anchor) {
					var href = anchor.href;
					var videoCode;
					var videoCodeRegex = anchor.id.match(/^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/)				
					if (videoCodeRegex && videoCodeRegex[2].length == 11) {
						videoCode = videoCodeRegex[2];
					}
					else {
						videoCode = videoCodeRegex;
					}	
					var timeCodeRegex = href.match(/(\?|\&|#)(t=)/);
					if (timeCodeRegex) {
						var substring = href.substring(timeCodeRegex.index, href.length);
						var timeCode = substring.match(/([0-9])+([h|m|s])?/g);
						var seconds = getSeconds(timeCode);
						videoCode += "?start=" + seconds + "'";						
					}
					return videoCode;
				};
				
				var getSeconds = function(timeCode) {
					var seconds = 0;
					var temp;
					for (var i = 0, len = timeCode.length; i < len; i++) {
						var splitTime = timeCode[i];
						if (!splitTime.match(/([h|m|s])/)) {
							// timecode is probably in format "#t=xx" 
							seconds += splitTime;
						}
						else if (splitTime.indexOf('h') > -1) {
							temp = Number(splitTime.replace('h', ''), 10);
							seconds += temp * 60 * 60;
						}
						else if (splitTime.indexOf('m') > -1) {
							temp = parseInt(splitTime.replace('m', ''), 10);
							seconds += temp * 60;
						}
						else if (splitTime.indexOf('s') > -1) {
							seconds += parseInt(splitTime.replace('s', ''), 10);
						}
					}
					return seconds;
				};
				
				return {
					embed: function(anchor) {
						var toEmbed = document.getElementById(anchor.id);
						if (toEmbed.className == "youtube") {
							var color = $("table.message-body tr td.message").css("background-color");		
							var code = getVideoCode(toEmbed);
							var embedHTML = "<span style='display: inline; position: absolute; z-index: 1; left: 100; background: " + color + ";'>" 
												+ "<a id='" + anchor.id + "' class='hide' href='#hide'>&nbsp<b>[Hide]</b></a></span>" 
												+ "<br><div class='youtube'>" 
												+ "<iframe id='" + "yt" + anchor.id + "' type='text/html' width='640' height='390' allowfullscreen='allowfullscreen'"
												+ "src='https://www.youtube.com/embed/" + code 
												+ "'?autoplay='0' frameborder='0'/>" 
												+ "</div>";
							$(toEmbed).find("span:last").remove();
							toEmbed.className = "hideme";
							toEmbed.innerHTML += embedHTML;
						}
					},
					hide: function(anchor) {
						var toEmbed = document.getElementById(anchor.id);
						var i = toEmbed.childNodes.length;
						var child;
						// iterate backwards as we are removing nodes
						while (i--) {
							child = toEmbed.childNodes[i];
							if (child.nodeName !== '#text'
								&& child.tagName !== 'SPAN') {
								toEmbed.removeChild(child);
							}
						}
						toEmbed.className = "youtube";
					}
				};
				
			}();
			
			var snippets = function() {
				// Contains methods for snippet feature.
				
				return {
					findCaret: function(ta) {
						var caret = 0;
						if (ta.selectionStart || ta.selectionStart == '0') {
							caret = ta.selectionStart; 
						}
						return (caret);
					},
					handler: function(ta, caret) {
						// detects keyword & replaces with snippet
						var text = ta.substring(0, caret);
						var words, word, snippet, temp, index, newCaret;
						var message = document.getElementsByName('message')[0];
						if (text.indexOf(' ') > -1) {
							words = text.split(' ');
							word = words[words.length - 1];
							if (word.indexOf('\n') > -1) {
								// makes sure that line breaks are accounted for
								words = word.split('\n');
								word = words[words.length - 1];
							}
						}
						else if (text.indexOf('\n') > -1) {
							// line break(s) in text - no spaces
							words = text.split('\n');
							word = words[words.length - 1];
						}
						else {
							// first word in post
							word = text;
						}
						for (var key in CHROMELL.config.snippet_data) {
							if (key === word) {
								snippet = CHROMELL.config.snippet_data[key];
								index = text.lastIndexOf(word);
								temp = text.substring(0, index);
								ta = ta.replace(text, temp + snippet);
								message.value = ta;
								// manually move caret to end of pasted snippet as changing
								// message.value property moves caret to end of input)
								newCaret = ta.lastIndexOf(snippet) + snippet.length;
								message.setSelectionRange(newCaret, newCaret);
							}
						}
					}
				};
				
			}();

			var usernotes = function() {
				// Contains methods for usernotes feature.
				
				return {
					open: function(el) {
						var userID = el.href.match(/note(\d+)$/i)[1];
						if (document.getElementById("notepage")) {
							var pg = document.getElementById('notepage');
							userID = pg.parentNode.getElementsByTagName('a')[0].href
									.match(/user=(\d+)$/i)[1];
							CHROMELL.config.usernote_notes[userID] = pg.value;
							pg.parentNode.removeChild(pg);
							utils.usernotes.save();
						} else {
							var note = CHROMELL.config.usernote_notes[userID];
							page = document.createElement('textarea');
							page.id = 'notepage';
							page.value = (note == undefined) ? "": note;
							page.style.width = "100%";
							page.style.opacity = '.6';
							el.parentNode.appendChild(page);
						}
					},
					save: function() {
						chrome.runtime.sendMessage({
							need: "save",
							name: "usernote_notes",
							data: CHROMELL.config.usernote_notes
						}, function(rsp) {
							console.log(rsp);
						});
					}
				};
				
			}();
			
			/*
			 *	Convert messages into ETI-formatted markup for archive quoting/like button
			 */
			var quote = function() {

				var getMarkup = function(parentElement) {
					var output = '';
					var childNodes = parentElement.childNodes;
					
					for (var i = 0, len = childNodes.length; i < len; i++) {				
						var node = childNodes[i];
						if (node.nodeType === 3) {
							if (node.nodeValue.replace(/^\s+|\s+$/g, "") != '---') {	
								output += node.nodeValue;
							}
							else {
								// Stop processing post once we reach sig belt
								break;
							}
						}
													
						if (node.tagName) {
							if (node.tagName == 'B' || node.tagName == 'I' || node.tagName == 'U') {
								var tagName = node.tagName.toLowerCase(); 
								output += '<' + tagName + '>' + node.innerText + '</' + tagName + '>';
							}
							else if (node.tagName == 'A') {
								output += node.href;
							}
						}
						
						if (node.className) {
							switch (node.className) {
								case 'pr':
									output += '<pre>' + node.innerHTML.replace(/<br>/g, '') + '</pre>';		
									break;
									
								case 'imgs':
									imgNodes = node.getElementsByTagName('A');
									for (var l = 0, img_len = imgNodes.length; l < img_len; l++) {
										var imgNode = imgNodes[l];
										output += '<img imgsrc="' + imgNode.getAttribute('imgsrc') + '" />' + '\n';
									}									
									break;
									
								case 'spoiler_closed':
									output += getMarkupFromSpoiler(node);
									break;
									
								case 'quoted_message':
									output += getMarkupFromQuote(node);
									break;
								
								default:
									// Do nothing
									break;
							}
						}
					}
					
					return output;
				};
				
				var getMarkupFromQuote = function(node) {
					var openQuote = '<quote>';
					var closeQuote = '</quote>';
					var msgId = node.attributes.msgid.value;
					if (msgId) {
						openQuote = '<quote msgid="' + msgId + '">';
					}
					
					return openQuote + getMarkup(node) + closeQuote;	
				};
				
				var getMarkupFromSpoiler = function(node) {
					var openSpoiler = '<spoiler>';
					var closeSpoiler = '</spoiler>';					
					var spoiler = node.getElementsByClassName('spoiler_on_open')[0];
					var caption = node.getElementsByClassName('caption')[0]
							.innerText.replace(/<|\/>/g, '');
							
					if (caption) {
						openSpoiler = '<spoiler caption="' + caption + '">';
					}

					// First and last elements of node list are part of the UI and should not be included in markup
					spoiler.removeChild(spoiler.firstChild);
					spoiler.removeChild(spoiler.lastChild);
					
					return openSpoiler + getMarkup(spoiler) + closeSpoiler;
				};
				
				var notifyUser = function(node) {
					var bgColor = $(node.parentNode).css('background-color');
					// create hidden notification so we can use fadeIn() later
					
					$(node)
					.append($('<span id="copied"' 
								+ 'style="display: none; position: absolute; z-index: 1; left: 100; '
								+ 'background: ' + bgColor 
								+ ';">&nbsp<b>[copied to clipboard]</b></span>'));
								
					$("#copied").fadeIn(200);
					
					setTimeout(function() {
						$(node)
							.find("#copied")
							.fadeOut(400);
					}, 1500);
					
					setTimeout(function() {
						$(node)
							.find("#copied")
							.remove();
					}, 2000);
					
				};
			
				return {
					handler: function(evt) {
						
						if (evt.likeButton) {
							var msgId = evt.id;
						}
						else {
							var msgId = evt.target.id;
						}
						
						var messageContainer = document.querySelector('[msgid="' + msgId + '"]');
						var markup = '<quote msgid="' + msgId + '">' + getMarkup(messageContainer) + '</quote>';
						
						if (evt.likeButton) {
							// Return output to likeButton.handler
							return markup;			
						}
						else {
							// Send markup to background page to be copied to clipboard
							chrome.runtime.sendMessage({
									need: "copy",
									data: markup
							});
							
							notifyUser(evt.target);
						}
					},
					
					addButtons: function() {
						var hostname = window.location.hostname;
						var topicId = window.location.search.replace("?topic=", "");
						var container;
						if (hostname.indexOf("archives") > -1) {
							var msgs = document.getElementsByClassName("message");
							var containers = document.getElementsByClassName("message-container");
							for (var i = 0, len = containers.length; i < len; i++) {
								var container = containers[i];
								var top = container.getElementsByClassName("message-top")[0];
								console.log(top);
								var msgId = msgs[i].getAttribute("msgid");
								var quote = document.createElement("a");
								var quoteText = document.createTextNode("Quote");
								var space = document.createTextNode(" | ");
								quote.appendChild(quoteText);
								quote.href = "#";
								quote.id = msgId;
								quote.className = "archivequote";
								top.appendChild(space);
								top.appendChild(quote);
							}
						}
					}
				};
				
			}();
			
			var image = function() { 
				// Contains methods for thumbnail expansion and image resizing
				
				// Crude method to detect zoom level - we don't need to be completely accurate.
				// This is used to make sure that images resize correctly, even at larger zoom levels.
				var screenWidth = window.screen.width;
				var documentWidth = document.documentElement.clientWidth;
				var zoomLevel = screenWidth / documentWidth;
				
				return {
					expandThumbnail: function(evt) {
						var num_children = evt.target.parentNode.parentNode.childNodes.length;
						// first time expanding - only span
						if (num_children == 1) {
							if (CHROMELL.config.debug)
								console.log("first time expanding - build span, load img");

							// build new span
							var newspan = document.createElement('span');
							newspan.setAttribute("class", "img-loaded");
							newspan.setAttribute("id", evt.target.parentNode.getAttribute('id')
									+ "_expanded");
							// build new img child for our newspan
							var newimg = document.createElement('img');
							// find fullsize image url
							var fullsize = evt.target.parentNode.parentNode
									.getAttribute('imgsrc');
							// set proper protocol
							if (window.location.protocol == "https:") {
								fullsize = fullsize.replace(/^http:/i, "https:");
							}
							newimg.src = fullsize;
							newspan.insertBefore(newimg, null);
							evt.target.parentNode.parentNode.insertBefore(newspan,
									evt.target.parentNode);
							evt.target.parentNode.style.display = "none"; // hide old img
						}
						// has been expanded before - just switch which node is hidden
						else if (num_children == 2) {
							if (CHROMELL.config.debug)
								console.log("not first time expanding - toggle display status");

							// toggle their display statuses
							var children = evt.target.parentNode.parentNode.childNodes;
							for (var i = 0; i < children.length; i++) {
								if (children[i].style.display == "none") {
									children[i].style.display = '';
								} else {
									children[i].style.display = "none";
								}
							}
						} else if (CHROMELL.config.debug)
							console
									.log("I don't know what's going on with this image - weird number of siblings");
					},
					resize: function(el) {	
						var width = el.width;					
						if ((width * zoomLevel) > CHROMELL.config.img_max_width) {						
							el.height = (el.height / (el.width / CHROMELL.config.img_max_width) / zoomLevel);
							el.parentNode.style.height = el.height + 'px';
							el.width = CHROMELL.config.img_max_width / zoomLevel;
							el.parentNode.style.width = el.width + 'px';
						}
					},
					observer: new MutationObserver(function(mutations) {
						for (var i = 0; i < mutations.length; i++) {
							var mutation = mutations[i];
							if (CHROMELL.config.resize_imgs) {
								utils.image.resize(mutation.target.childNodes[0]);
							}
							if (mutation.type === 'attributes') {
								// once they're loaded, thumbnails have /i/t/ in their
								// url where fullsize have /i/n/
								if (mutation.attributeName == "class"
										&& mutation.target.getAttribute('class') == "img-loaded"
										&& mutation.target.childNodes[0].src
												.match(/.*\/i\/t\/.*/)) {
									/*
									 * set up the onclick and do some dom manip that the
									 * script originally did - i think only removing href
									 * actually matters
									 */
									mutation.target.parentNode.addEventListener('click',
											utils.image.expandThumbnail);
									mutation.target.parentNode.setAttribute('class',
											'thumbnailed_image');
									mutation.target.parentNode
											.setAttribute('oldHref',
													mutation.target.parentNode
															.getAttribute('href'));
									mutation.target.parentNode.removeAttribute('href');
								}
							}
						}
					})
				};
				
			}();
			
			var spoilers = function() {
				// Contains methods to open/close any spoiler-tagged content.
				
				return {
					find: function(el) {
						var spans = document.getElementsByClassName('spoiler_on_close');
						var node;
						for (var i = 0; spans[i]; i++) {
							node = spans[i].getElementsByTagName('a')[0];
							utils.spoilers.toggle(node);
						}
					},
					toggle: function(obj) {
						while (!/spoiler_(?:open|close)/.test(obj.className)) {
							obj = obj.parentNode;
						}
						obj.className = obj.className.indexOf('closed') != -1 ? obj.className
								.replace('closed', 'opened'): obj.className.replace('opened',
								'closed');
						return false;
					}
				};
					
			}();
			
			var anchors = function() {
				var checkedLinks = {};
				var ytRegex = /youtube|youtu.be/;
				var videoCodeRegex = /^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/;
				var gfycats, imgurs;			
				
				var handleYoutube = function(link) {
					link.className = "youtube";
					// give each video link a unique id for embed/hide functions
					link.id = link.href + "&" + Math.random().toString(16).slice(2);			
					// attach event listener						
					$(link).hoverIntent(
						function() {
							var color = $("table.message-body tr td.message").css("background-color");
							if (this.className == "youtube") {
								// TODO - create this element without html strings
								$(this).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; " 
										+ "background: " + color 
										+ ";'><a id='" + this.id 
										+ "' class='embed' href=#embed'>&nbsp<b>[Embed]</b></a></span>"));
							}
						}, function() {							
							if (this.className == "youtube") {
								$(this).find("span").remove();
							}
						}
					);	
				};

				var embed = function(link, type) {
					link.className = type;
						if (CHROMELL.config['embed_' + type + '_thumbs']  
							|| link.parentNode.className == "quoted-message") {
						link.setAttribute('name', type + '_thumb');
					}
				};
				
				var unshorten = function(link) {			
					// Make sure that we only make 1 request for each unique url on page
					if (!checkedLinks[link.href]) {
						var url = 'https://jsonp.nodejitsu.com/?url=http://urlex.org/json/' + link.href;
						checkedLinks[link.href] = true;
						$.getJSON(url, function(response) {
							for (var url in response) {		
								var linksToKyvenate = $('a[href="' + url + '"]');
								for (var k = 0, len = linksToKyvenate.length; k < len; k++) {
									var kyvenLink = linksToKyvenate[k];
									kyvenLink.innerHTML = response[url];																
								}
							}	
						});
					}
				};
				
				var checkNodes = function(nodes, sig) {
					var j = sig || nodes.length - 1;
					for (j; j >= 0; j--) {
						var node = nodes[j];			
						
						if (node.className == 'l') {
								
							if (node.href.match(ytRegex) && node.href.match(videoCodeRegex)
									&& CHROMELL.config.embed_on_hover) {	
								handleYoutube(node);
							}
							
							/*else if (node.href.indexOf('://lue.link/') > -1
									&& CHROMELL.config.full_link_names) {
								unshorten(node);
							}*/
							
							else if (node.title.indexOf("gfycat.com/") > -1) {
								if (CHROMELL.config.embed_gfycat || CHROMELL.config.embed_gfycat_thumbs) {
									embed(node, 'gfy');
									gfycats = true;
								}
							}
							
							else if (node.title.indexOf('imgur.com/') > -1 && node.title.match(/.webm|.gifv/)) {
								if (CHROMELL.config.embed_gfycat || CHROMELL.config.embed_gfycat_thumbs) {
									embed(node, 'imgur');
									imgurs = true;
								}							
							}
							
						}
						
						else if (node.className == 'quoted-message' && node.getElementsByClassName('l')) {
							checkNodes(node.childNodes);
						}
					}
				};
				
				
				
				return {
					check: function(container) {
						if (!container.getElementsByClassName('l')) {
							return;
						}
						else {
							var nodes = container.getElementsByClassName('message')[0].childNodes;
							var i = nodes.length - 1;
							var messageEnd;						
							for (i; i > 0; i--) {
								var node = nodes[i];
								if (node.nodeType == 3 && node.nodeValue.replace(/^\s+|\s+$/g, "") == '---') {
									messageEnd = i - 1;
									break;
								}
							}							
							checkNodes(nodes, messageEnd);
						}
					},
					fixRedirect: function(anchor, type) {
						// fixes problem where wiki/imagemap links redirect incorrectly
						if (type === "wiki") {
							window.open(anchor.href.replace("boards", "wiki"));
						}
						else if (type === "imagemap") {				
							window.open(anchor.href.replace("boards", "images"));
						}
					},
					embedHandler: function() {
						if (gfycats) {			
							gfycat.loader();
							document.addEventListener('visibilitychange', pauseVideos);
						}							
						if (imgurs) {					
							imgur.loader();				
							document.addEventListener('visibilitychange', pauseVideos);
						}
					}
				};
				
			}();
			
			var tcs = function() {
				// Maintains a list of topic creators from last 40 visited topics
				var saveToConfig = function() {
					var max = 40;
					var lowest = Infinity;
					var lowestTc;
					var numTcs = 0;
					for ( var i in CHROMELL.config.tcs) {
						if (CHROMELL.config.tcs[i].date < lowest) {
							lowestTc = i;
							lowest = CHROMELL.config.tcs[i].date;
						}
						numTcs++;
					}
					if (numTcs > max)
						delete CHROMELL.config.tcs[lowestTc];
					chrome.runtime.sendMessage({
						need: "save",
						name: "tcs",
						data: CHROMELL.config.tcs
					});
				};		

				return {
					getMessages: function() {
						if (!CHROMELL.config.tcs)
							CHROMELL.config.tcs = {};
						var tcs = [];
						var topic = window.location.href.match(/topic=(\d+)/)[1];
						var heads = document.getElementsByClassName('message-top');
						var tc;
						var haTopic;
						if (document.getElementsByClassName('message-top')[0].innerHTML
								.indexOf("> Human") !== -1) {
							haTopic = true;
							tc = "human #1";
						} else if ((!window.location.href.match('page') || window.location.href
								.match('page=1($|&)'))
								&& !window.location.href.match(/u=(\d+)/))
							tc = heads[0].getElementsByTagName('a')[0].innerHTML.toLowerCase();
						else {
							if (!CHROMELL.config.tcs[topic]) {
								console.log('Unknown TC!');
								return;
							}
							tc = CHROMELL.config.tcs[topic].tc;
						}
						if (!CHROMELL.config.tcs[topic]) {
							CHROMELL.config.tcs[topic] = {};
							CHROMELL.config.tcs[topic].tc = tc;
							CHROMELL.config.tcs[topic].date = new Date().getTime();
						}
						for (var i = 0; i < heads.length; i++) {
							if (haTopic && heads[i].innerHTML.indexOf("\">Human") == -1) {
								heads[i].innerHTML = heads[i].innerHTML.replace(/Human #(\d+)/,
										"<a href=\"#" + i + "\">Human #$1</a>");
							}
							if (heads[i].getElementsByTagName('a')[0].innerHTML.toLowerCase() == tc) {
								tcs.push(heads[i]);
							}
						}
						saveToConfig();
						return tcs;
					}
				};
					
			}();
			
			var likeButton = function() {
				// Contains methods which display the like button menu and process click events
				
				return {
					process: function(node, templateNumber) {
						var anonymous;
						var container = node.parentNode.parentNode;
						var message = node.parentNode.parentNode.getElementsByClassName('message')[0];
						var nub = document.getElementsByClassName('quickpost-nub')[0];
						var quickreply = document.getElementsByTagName('textarea')[0];
						
						// get username/quoted username 
						if (document.getElementsByTagName('h2')[0].innerHTML.match('Anonymous')) {
							anonymous = true;
							var username = "Human";
							var poster = "this";
						}
						else {
							var username = document.getElementsByClassName('userbar')[0]
									.getElementsByTagName('a')[0].innerHTML.replace(/ \((-?\d+)\)$/, "");
							var poster = container.getElementsByTagName('a')[0].innerHTML;
						}
						
						// generate like message
						if (templateNumber) {
							// use selected custom message
							var ins = CHROMELL.config.custom_like_data[templateNumber].contents;
							ins = ins.replace('[user]', username);
							ins = ins.replace('[poster]', poster);
						}
						else {
							// use default message
							var img = '<img src="http://i4.endoftheinter.net/i/n/f818de60196ad15c888b7f2140a77744/like.png" />';
							if (anonymous) {
								var ins = img + ' Human likes this post';
							}
							else {
								var ins = img + ' ' + username + ' likes ' + poster + "'s post"; 
							}
						}
									
						var qrtext = quickreply.value;
						var oldtxt = '', newtxt = '';			
						if (qrtext.match('---')) {
							// remove sig from post
							oldtxt = qrtext.split('---');
							for (var i = 0; i < oldtxt.length - 1; i++) {
								newtxt += oldtxt[i];
							}
							newtxt += ins + '\n---' + oldtxt[oldtxt.length - 1];
						}
						else {		
							newtxt = qrtext;
							newtxt += ins;
						}
						var msgID = message.getAttribute('msgid');
						var quotedMessage = utils.quote.handler({'id': msgID, 'likeButton': true});
						quickreply.value = quotedMessage + '\n' + newtxt;
						if (document.getElementsByClassName('regular quickpost-expanded').length == 0) {
							// quickpost area is hidden - click nub element to open
							nub.click();
						}
					},
					showOptions: function() {
						if (!document.getElementById('hold_menu')) {
							var scriptData = CHROMELL.config.custom_like_data;
							var menuElement = document.createElement('span');
							menuElement.id = 'hold_menu';	
							menuElement.style.position = 'absolute';
							menuElement.style.overflow = 'auto';
							menuElement.style.padding = '3px 3px';
							menuElement.style.borderStyle = 'solid';
							menuElement.style.borderWidth = '2px';
							menuElement.style.borderRadius = '3px';
							menuElement.style.backgroundColor = $(document.body).css('background-color');
							for (var id in scriptData) {
								var name = scriptData[id].name;					
								populateMenu.call(this, name, id, menuElement);
							}
							var cachedEvent = eventHandlers.cachedEvent();
							cachedEvent.target.appendChild(menuElement);
						}
						
						function populateMenu(item, id, menuElement) {
							var menuSpan = document.createElement('span');
							var menuItem = document.createElement('anchor');
							var lineBreak = document.createElement('br');
							menuSpan.className = 'unhigh_span';
							menuItem.id = id;
							menuItem.innerHTML = '&nbsp' + item + '&nbsp';
							menuItem.href = '#like_custom_' + id;
							menuItem.className = 'like_button_custom';
							menuSpan.appendChild(menuItem);
							menuElement.appendChild(menuSpan);
							menuElement.appendChild(lineBreak);
						}
					},
					hideOptions: function() {
						var menu = document.getElementById('hold_menu');
						if (menu) {
							menu.remove();
						}
						else {
							console.log('no menu found');
						}
					}
				};
				
			}();						
			
			return {
				embed: embed,
				gfycat: gfycat,
				imgur: imgur,
				youtube: youtube,
				pauseVideos: pauseVideos,
				snippets: snippets,
				usernotes: usernotes,
				quote: quote,
				image: image,
				spoilers: spoilers,
				anchors: anchors,
				tcs: tcs,
				likeButton: likeButton
			};
			
		}();
		
		var helpers = function() {
			// TODO: Some of these methods may be better located elsewhere
			return {
				loadNextPage: function() {
					var nextPage = document.getElementById('nextpage');					
					nextPage.innerHTML = 'Loading...';
					
					var regex = window.location.href.match(/(page=)([0-9]+)/);
					// "page" parameter may not exist
					if (!regex) {
						var currentPage = 1;
					}
					else {
						var currentPage = parseInt(regex[2], 10);
					}
					
					// This regex will always find a match - no need to check.
					regex = nextPage.href.match(/(page=)([0-9]+)/);
					nextPageNumber = parseInt(regex[2], 10);						
					
					var href;			
					if (nextPageNumber > currentPage) {
						// Nextpage element should be correct
						href = nextPage.href;
					}
					else {
						// Need to modify HTML element to keep track of page changes
						nextPageNumber++;
						href = nextPage.href.replace(regex[0], 'page=' + nextPageNumber);
						nextPage.href = href;						
					}
					
					// Make sure that address bar reflects current page location.
					history.pushState(null, null, href)
					
					chrome.runtime.sendMessage({
						need: "xhr",
						url: href					
					},  function(response) {
						
						var html = document.createElement('html');
						html.innerHTML = response;
						
						var containers = html.getElementsByClassName('message');
						if (containers.length < 50) {	
							nextPage.style.display = 'none';								
						}
						else {
							nextPage.style.display = 'block';
						}
						
						DOM.appendToPage(response);		
						
					});	
					
				},
				startBatchUpload: function(evt) {
					var chosen = document.getElementById('batch_uploads');
					if (chosen.files.length == 0) {
						alert('Select files and then click "Batch Upload"');
						return;
					}
					document.getElementsByClassName('quickpost-body')[0]
							.getElementsByTagName('b')[0].innerHTML += " (Uploading: 1/"
							+ chosen.files.length + ")";
					CHROMELL.allPages.utils.asyncUpload(chosen.files, 0);
				},		
				postTemplateExpand: function(evt) {
					var ins = evt.parentNode;
					ins.removeChild(evt);
					var ia = document.createElement('a');
					ia.innerHTML = "&lt;"
					ia.className = "shrink_post_template";
					ia.href = '##';
					ins.innerHTML = '[';
					ins.insertBefore(ia, null);
					for ( var i in CHROMELL.config.post_template_data) {
						var title = document.createElement('a');
						title.href = '##' + i;
						title.className = 'post_template_title';
						title.innerHTML = i;
						var titleS = document.createElement('span');
						titleS.style.paddingLeft = '3px';
						titleS.innerHTML = '[';
						titleS.insertBefore(title, null);
						titleS.innerHTML += ']';
						titleS.className = i;
						ins.insertBefore(titleS, null);
					}
					ins.innerHTML += ']';
				},
				postTemplateShrink: function(evt) {
					var ins = evt.parentNode;
					evt.parentNode.removeChild(evt);
					var ia = document.createElement('a');
					ia.innerHTML = "&gt;"
					ia.className = "expand_post_template";
					ia.href = '##';
					ins.innerHTML = '[';
					ins.insertBefore(ia, null);
					ins.innerHTML += ']';
				},
				postTemplateTitle: function(evt) {
					evt.id = 'post_action';
					var cdiv = document.getElementById('cdiv');
					var d = {};
					d.text = CHROMELL.config.post_template_data[evt.parentNode.className].text;
					cdiv.innerText = JSON.stringify(d);
					cdiv.dispatchEvent(window.postEvent);
				},
				clearUnreadPosts: function(evt) {
					if (!document.title.match(/\(\d+\+?\)/)
							|| DOM.scrolling === true
							|| document.hidden) {
						// do nothing
						return;
					}
					else if (document.title.match(/\(\d+\+?\)/)) {
						var newTitle = document.title.replace(/\(\d+\+?\) /, "");
						document.title = newTitle;
					}
				},			
				/*loadNextPage: function() {
					var page = 1;
					if (window.location.href.match('asyncpg')) {
						page = parseInt(window.location.href.match('asyncpg=(\d+)')[1]);
					} else if (window.location.href.match('page')) {
						page = parseInt(window.location.href.match('page=(\d+)')[1]);
					}
					page++;
					var topic = window.location.href.match('topic=(\d+)')[1];
				},*/		
				qpTagButton: function(e) {
					if (e.target.tagName != 'INPUT') {
						return 0;
					}
					// from foxlinks
					var tag = e.target.id;
					var open = new RegExp("\\*", "m");
					var ta = document.getElementsByName('message')[0];
					var st = ta.scrollTop;
					var before = ta.value.substring(0, ta.selectionStart);
					var after = ta.value.substring(ta.selectionEnd, ta.value.length);
					var select = ta.value.substring(ta.selectionStart, ta.selectionEnd);

					if (ta.selectionStart == ta.selectionEnd) {
						if (open.test(e.target.value)) {
							e.target.value = e.target.name;
							var focusPoint = ta.selectionStart + tag.length + 3;
							ta.value = before + "</" + tag + ">" + after;
						} else {
							e.target.value = e.target.name + "*";
							var focusPoint = ta.selectionStart + tag.length + 2;
							ta.value = before + "<" + tag + ">" + after;
						}

						ta.selectionStart = focusPoint;
					} else {
						var focusPoint = ta.selectionStart + (tag.length * 2)
								+ select.length + 5;
						ta.value = before + "<" + tag + ">" + select + "</" + tag + ">"
								+ after;
						ta.selectionStart = before.length;
					}

					ta.selectionEnd = focusPoint;
					ta.scrollTop = st;
					ta.focus();
				},
			};
			
		}();
		
		// Get config from background page and call init method
		CHROMELL.getConfig(init);
		
		return {
			DOM: DOM,
			eventHandlers: eventHandlers,
			utils: utils,
			helpers: helpers
		};
	
	}();
	
	return CHROMELL;

})( CHROMELL || {} );
