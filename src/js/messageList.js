var messageList = {
	config: [],
	ignoredUsers: {},
	autoscrolling: false,
	imagemapDebouncer: '',
	menuDebouncer: '',
	zoomLevel: 1,
	ignorated: {
		total_ignored: 0,
		data: {
			users: {}
		}
	},
	pm: '',
	
	init: function(config) {
		this.config = config.data;
		this.config.tcs = config.tcs;		
		this.prepareIgnoratorArray();
		
		// set up globalPort so we can interact with background page
		this.globalPort = chrome.runtime.connect();
		this.globalPort.onMessage.addListener(this.handleEvent.ignoratorUpdate);
		
		if (window.location.href.match('inboxthread.php')) {
			this.pm = "_pm";
		}
		
		// check whether we need to display dramalinks ticker
		if (this.config.dramalinks && !this.pm) {
			
			chrome.runtime.sendMessage({
					need : "dramalinks"
			}, function(response) {
				dramalinks.html = response.data;					
				dramalinks.config = messageList.config;
			});
		}
		
		if (document.readyState == 'loading') {
			// wait for DOMContentLoaded to fire before attempting to modify DOM
			document.addEventListener('DOMContentLoaded', function() {
				messageList.applyDomModifications.call(messageList, messageList.pm);
			});
		}
		else {
			this.applyDomModifications.call(this, this.pm);
		}
	},
	functions: {
		messagecontainer: {
			ignorator_messagelist: function(msg) {
				if (!messageList.config.ignorator) {
					// User enabled ignorator, but didn't populate list with usernames
					return;
				}
				
				var tops = msg.getElementsByClassName('message-top');
				
				for (var j = 0; j < tops.length; j++) {
					var top = tops[j];
				
					if (top) {	
						var username = top.getElementsByTagName('a')[0].innerHTML.toLowerCase();
						
						for (var f = 0, len = messageList.ignoredUsers.length; f < len; f++) {
							var ignoredUser = messageList.ignoredUsers[f];
							
							if (username == ignoredUser.toLowerCase()) {
								
								top.parentNode.classList.add('ignorated');
								
								messageList.ignorated.total_ignored++;
								
								// Keep track of any users that have been ignored (and the number of posts they made)
								if (!messageList.ignorated.data.users[ignoredUser]) {
									messageList.ignorated.data.users[ignoredUser] = {};
									messageList.ignorated.data.users[ignoredUser].total = 1;
								} 
								
								else {
									messageList.ignorated.data.users[ignoredUser].total++;
								}
								
								if (!messageList.config.hide_ignorator_badge) {
									messageList.globalPort.postMessage({
										action: 'ignorator_update',
										ignorator: messageList.ignorated,
										scope: "messageList"
									});
								}
							}
						}
					}
				}
			},
			user_notes: function(msg) {
				if (!messageList.config.usernote_notes) {
					messageList.config.usernote_notes = {};
				}	
				var top = msg.getElementsByClassName('message-top')[0];
				if (!top.getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
					return;
				}
				var notebook = document.createElement('a');	
				notebook.id = 'notebook';
				var divider = document.createTextNode(' | ');
				var top, tempID;
				top.appendChild(divider);
				tempID = top.getElementsByTagName('a')[0].href
						.match(/user=(\d+)$/i)[1];
				notebook.innerHTML = (messageList.config.usernote_notes[tempID] != undefined 
						&& messageList.config.usernote_notes[tempID] != '') 
								? 'Notes*' : 'Notes';
				notebook.href = "##note" + tempID;
				top.appendChild(notebook);
			},
			like_button: function(msg, index) {
				if (!window.location.href.match("archives")) {		
					var top = msg.getElementsByClassName('message-top')[0];
					var anchor = document.createElement('a');
					var divider = document.createTextNode(" | ");
					anchor.innerText = 'Like';
					anchor.className = 'like_button';
					anchor.href = '##like';
					top.appendChild(divider);
					top.appendChild(anchor);
					anchor.addEventListener('mouseenter', messageList.handleEvent.mouseenter.bind(messageList));
					anchor.addEventListener('mouseleave', messageList.handleEvent.mouseleave.bind(messageList));					
				}
			},	
			number_posts: function(msg, index, live) {
				var top = msg.getElementsByClassName('message-top')[0];
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
				top.appendChild(postNumber);
			},
			post_templates: function(msg, index) {
				var top = msg.getElementsByClassName('message-top')[0];
				var sep, sepIns, qr;
				var cDiv = document.createElement('div');
				cDiv.style.display = 'none';
				cDiv.id = 'cdiv';
				document.body.appendChild(cDiv, null);
				messageList.postEvent = document.createEvent('Event');
				messageList.postEvent.initEvent('postTemplateInsert', true, true);
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
				top.appendChild(sep);
			},	
			userhl_messagelist: function(msg, index, live) {
				if (!messageList.config.enable_user_highlight) {
					return;
				}
				var tops = msg.getElementsByClassName('message-top');
				var first_top = msg.getElementsByClassName('message-top')[0];
				if (!messageList.config.no_user_highlight_quotes) {
					try {
						for (var k = 0; k < tops.length; k++) {
							var top = tops[k];			
								var user = top.getElementsByTagName('a')[0].innerHTML
										.toLowerCase();
							if (messageList.config.user_highlight_data[user]) {
								if (messageList.config.debug) {
									console.log('highlighting post by ' + user);
								}
								top.setAttribute('highlighted', true);								
								top.style.background = '#'
										+ messageList.config.user_highlight_data[user].bg;
								top.style.color = '#'
										+ messageList.config.user_highlight_data[user].color;
								var anchors = top.getElementsByTagName('a');
								for (var j = 0, len = anchors.length; j < len; j++) {
									var anchor = anchors[j];
									anchor.style.color = '#'
											+ messageList.config.user_highlight_data[user].color;
								}
								if (live && messageList.config.notify_userhl_post 
										&& k == 0
										&& msg.getElementsByClassName('message-top')[0]
												.getElementsByTagName('a')[0].innerHTML != document
												.getElementsByClassName('userbar')[0]
												.getElementsByTagName('a')[0].innerHTML
												.replace(/ \((\d+)\)$/, "")) {
									chrome.runtime.sendMessage({
										need: "notify",
										message: document.title
												.replace(/End of the Internet - /i, ''),
										title: "Post by " + user
									}, function(data) {
										console.log(data);
									});
								}
							}
						}
					} catch (e) {
						if (messageList.config.debug) {
							console.log(e);
						}
					}
				}
				else {
					user = first_top.getElementsByTagName('a')[0]
							.innerHTML.toLowerCase();
					if (messageList.config.user_highlight_data[user]) {
						if (messageList.config.debug) {
							console.log('highlighting post by ' + user);
						}
						first_top.style.background = '#'
								+ messageList.config.user_highlight_data[user].bg;
						first_top.style.color = '#'
								+ messageList.config.user_highlight_data[user].color;
						anchors = first_top.getElementsByTagName('a');
						for (var j = 0, len = anchors.length; j < len; j++) {
							anchor = anchors[j];
							anchor.style.color = '#'
									+ messageList.config.user_highlight_data[user].color;
						}
						if (live && messageList.config.notify_userhl_post
								&& msg.getElementsByClassName('message-top')[0]
										.getElementsByTagName('a')[0].innerHTML != document
										.getElementsByClassName('userbar')[0]
										.getElementsByTagName('a')[0].innerHTML
										.replace(/ \((\d+)\)$/, "")) {
							chrome.runtime.sendMessage({
								need: "notify",
								message: document.title.replace(
										/End of the Internet - /i, ''),
								title: "Post by " + user
							}, function(data) {
								console.log(data);
							});
						}				
					}
				}
			},
			foxlinks_quotes: function(msg) {
				var color = "#" + messageList.config['foxlinks_quotes_color'];
				var quotes = msg.getElementsByClassName('quoted-message');
				if (!quotes.length) {
					return;
				}
				var quote, top;
				for (var i = 0, len = quotes.length; i < len; i++) {
					quote = quotes[i];
					quot_msg_style = quote.style;
					quot_msg_style.borderStyle = 'solid';
					quot_msg_style.borderWidth = '2px';
					quot_msg_style.borderRadius = '5px';
					quot_msg_style.marginRight = '30px';
					quot_msg_style.marginLeft = '10px';
					quot_msg_style.paddingBottom = '10px';
					quot_msg_style.marginTop = '0px';
					quot_msg_style.borderColor = color;
					top = quote.getElementsByClassName('message-top')[0];
					if (top) {
						if (top.style.background == '') {
							top.style.background = color;
						} else {
							quot_msg_style.borderColor = top.style.background;
						}
						top.style.marginTop = '0px';
						top.style.paddingBottom = '2px';
						top.style.marginLeft = '-6px';
					}
				}
			},		
			label_self_anon: function(msg) {
				var tagList = document.getElementsByTagName('h2')[0];
				if (tagList.innerHTML.indexOf('/topics/Anonymous') > -1) {
					// skip archived topics as they don't have the quickpost-body element
					if (!window.location.href.match('archives')) {
						var tops = msg.getElementsByClassName('message-top');
						if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {				
							var self = document.getElementsByClassName('quickpost-body')[0]
									.getElementsByTagName('a')[0].innerHTML;
							if (self.indexOf('Human #') == -1) {
								// user hasn't posted in topic yet
								return;
							}
							else {
								for (var i = 0, len = tops.length; i < len; i++) {
									var top = tops[i];
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
			},
			autoscroll_livelinks: function(mutation, index, live) {
				if (live && document.hidden 
						&& messageList.autoscrollCheck(mutation) ) {
					$.scrollTo(mutation);
				}
			},
			autoscroll_livelinks_active: function(mutation, index, live) {
				if (live && !document.hidden 
						&& messageList.autoscrollCheck(mutation)) {
							
					// trigger after 10ms delay to prevent undesired behaviour in post_title_notification
					setTimeout(() => {						
						// set autoscrolling to true to prevent clearUnreadPosts from being triggered
						messageList.autoscrolling = true;
						$.scrollTo((mutation), 800);						
					}, 10);
					
					setTimeout(() => {
						messageList.autoscrolling = false;	
					}, 850);
				}
			},
			post_title_notification: function(mutation, index, live) {
				if (live) {
					if (mutation.style.display === "none") {
						if (messageList.config.debug) {
							console.log('not updating for ignorated post');
						}
						return;
					}
					if (mutation.getElementsByClassName('message-top')[0]
							.getElementsByTagName('a')[0].innerHTML == document
							.getElementsByClassName('userbar')[0].getElementsByTagName('a')[0].innerHTML
							.replace(/ \((\d+)\)$/, "")) {
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
			},
			notify_quote_post: function(mutation, index, live) {
				if (live) {
					if (!mutation.getElementsByClassName('quoted-message')) {
						return;
					}
					if (mutation.getElementsByClassName('message-top')[0]
							.getElementsByTagName('a')[0].innerHTML == document
							.getElementsByClassName('userbar')[0].getElementsByTagName('a')[0].innerHTML
							.replace(/ \((\d+)\)$/, "")) {
						// dont notify when quoting own posts
						return;
					}
					var notify = false;
					var msg = mutation.getElementsByClassName('quoted-message');
					for (var i = 0, len = msg.length; i < len; i++) {
						if (msg[i].getElementsByClassName('message-top')[0]
								.getElementsByTagName('a')[0].innerHTML == document
								.getElementsByClassName('userbar')[0]
								.getElementsByTagName('a')[0].innerHTML.replace(
								/ \((.*)\)$/, "")) {
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
			}
		},
		infobar: {
			imagemap_on_infobar: function() {
				// Adds link to imagemap for current topic on infobar
				var regex = window.location.search.match(/(topic=)([0-9]+)/);
				if (regex) {
					var topicNumber = regex[0];			
					var infobar = document.getElementsByClassName("infobar")[0];
					var pageRegex = window.location.search.match(/(page=)([0-9]+)/);
					var currentPage = ''
					if (pageRegex) {
						// Keep track of current page in case user decides to navigate back
						currentPage = '&oldpage=' + pageRegex[2];
					}
					var anchor = document.createElement('a');
					var divider = document.createTextNode(" | ");
					anchor.href = '/imagemap.php?' + topicNumber + currentPage;
					anchor.innerText = 'Imagemap';
					infobar.appendChild(divider);
					infobar.appendChild(anchor);
				}
			},
			expand_spoilers: function() {
				var infobar = document.getElementsByClassName('infobar')[0];
				var ains = document.createElement('span');
				var anchor = document.createElement('a');
				var divider = document.createTextNode(' | ');
				anchor.id = 'chromell_spoilers';
				anchor.href = '##';
				anchor.innerText = 'Expand Spoilers';
				infobar.appendChild(divider);
				infobar.appendChild(anchor);
				anchor.addEventListener('click', messageList.spoilers.find);		
			}
		},
		quickpostbody: {
			filter_me: function() {
				// even though element is appended to infobar, we need quickpost-body
				// so we can check for human number in anonymous topics
				var quickpostElement = document.getElementsByClassName('quickpost-body')[0];				
				var infobar = document.getElementsByClassName('infobar')[0];
				var tops = document.getElementsByClassName('message-top');
				if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
					// anonymous topic - check quickpost-body for human number
					if (window.location.hostname == 'archives.endoftheinter.net') {
						// archived anon topics don't have quickpost-body element
						return;
					}
					else if (quickpostElement.getElementsByTagName('a')) {
						var human = quickpostElement.getElementsByTagName('a')[0]
								.innerText.replace('Human #', '');
						if (isNaN(human)) {
							// user hasn't posted in topic
							return;
						}
						else {
							var me = '&u=-' + human;
						}
					}
				}
				else {
					// handle non anonymous topics
					var me = '&u=' + document.getElementsByClassName('userbar')[0]
							.getElementsByTagName('a')[0].href
							.match(/\?user=([0-9]+)/)[1];
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
				infobar.appendChild(divider);
				infobar.appendChild(anchor);
			},		
			quick_imagemap: function() {
				var quickpost = document.getElementsByClassName('quickpost-body')[0];
				if (quickpost) {
					var button = document.createElement('button');
					var divider = document.createTextNode(' ');
					var search = document.createElement('input');
					button.textContent = "Browse Imagemap";					
					button.id = "quick_image";
					search.placeholder = "Search Imagemap...";
					search.id = "image_search";
					quickpost.appendChild(divider);
					quickpost.appendChild(button);
					quickpost.appendChild(divider);
					quickpost.appendChild(search);
				}
			},
			post_before_preview: function() {
				var inputs = document.getElementsByClassName('quickpost-body')[0]
						.getElementsByTagName('input');
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
			},	
			batch_uploader: function() {
				var quickpost_body = document.getElementsByClassName('quickpost-body')[0];
				var ulBox = document.createElement('input');
				var ulButton = document.createElement('input');		
				ulBox.type = 'file';
				ulBox.multiple = true;
				ulBox.id = "batch_uploads";
				ulButton.type = "button";
				ulButton.value = "Batch Upload";
				ulButton.addEventListener('click', messageList.startBatchUpload);
				quickpost_body.insertBefore(ulBox, null);
				quickpost_body.insertBefore(ulButton, ulBox);
			},
			quickpost_on_pgbottom: function() {
				chrome.runtime.sendMessage({
					need: "insertcss",
					file: "src/css/quickpost_on_pgbottom.css"
				});
			},
			quickpost_tag_buttons: function() {
				if (!window.location.href.match('archives')) {
					var m = document.getElementsByClassName('quickpost-body')[0];
					var txt = document.getElementById('u0_13');
					var insM = document.createElement('input');
					insM.value = 'Mod';
					insM.name = 'Mod';
					insM.type = 'button';
					insM.id = 'mod';
					insM.addEventListener("click", messageList.qpTagButton, false);
					var insA = document.createElement('input');
					insA.value = 'Admin';
					insA.name = 'Admin';
					insA.type = 'button';
					insA.addEventListener("click", messageList.qpTagButton, false);
					insA.id = 'adm';
					var insQ = document.createElement('input');
					insQ.value = 'Quote';
					insQ.name = 'Quote';
					insQ.type = 'button';
					insQ.addEventListener("click", messageList.qpTagButton, false);
					insQ.id = 'quote';
					var insS = document.createElement('input');
					insS.value = 'Spoiler';
					insS.name = 'Spoiler';
					insS.type = 'button';
					insS.addEventListener("click", messageList.qpTagButton, false);
					insS.id = 'spoiler';
					var insP = document.createElement('input');
					insP.value = 'Preformated';
					insP.name = 'Preformated';
					insP.type = 'button';
					insP.addEventListener("click", messageList.qpTagButton, false);
					insP.id = 'pre';
					var insU = document.createElement('input');
					insU.value = 'Underline';
					insU.name = 'Underline';
					insU.type = 'button';
					insU.addEventListener("click", messageList.qpTagButton, false);
					insU.id = 'u';
					var insI = document.createElement('input');
					insI.value = 'Italic';
					insI.name = 'Italic';
					insI.type = 'button';
					insI.addEventListener("click", messageList.qpTagButton, false);
					insI.id = 'i';
					var insB = document.createElement('input');
					insB.value = 'Bold';
					insB.name = 'Bold';
					insB.type = 'button';
					insB.addEventListener("click", messageList.qpTagButton, false);
					insB.id = 'b';
					m.insertBefore(insM, m.getElementsByTagName('textarea')[0]);
					m.insertBefore(insQ, insM);
					m.insertBefore(insS, insQ);
					m.insertBefore(insP, insS);
					m.insertBefore(insU, insP);
					m.insertBefore(insI, insU);
					m.insertBefore(insB, insI);
					m.insertBefore(document.createElement('br'), insB);
				}
			},
			drop_batch_uploader: function() {
				if (window.location.href.indexOf('postmsg.php') > -1 
				|| window.location.hostname.indexOf("archives") > -1) {
					return;
				}
				var quickreply = document.getElementsByTagName('textarea')[0];
				quickreply
						.addEventListener(
								'drop',
								function(evt) {
									evt.preventDefault();
									if (evt.dataTransfer.files.length == 0) {
										console.log(evt);
										return;
									}
									document.getElementsByClassName('quickpost-body')[0]
											.getElementsByTagName('b')[0].innerHTML += " (Uploading: 1/"
											+ evt.dataTransfer.files.length + ")";
									allPages.asyncUpload(evt.dataTransfer.files);
								});
			},
			
			snippet_listener: function() {
				
				if (window.location.hostname.indexOf("archives") == -1) {
					
					var ta = document.getElementsByName('message')[0];
					
					ta.addEventListener('keydown', (event) => {
						
						if (messageList.config.snippet_alt_key) {
							if (event.shiftKey == true
									&& event.key == 'Tab') {
								event.preventDefault();
								messageList.snippet.handler(ta.value, ta.selectionStart);				
							}
						}
						
						else {
							if (event.key == 'Tab') {
								event.preventDefault();
								messageList.snippet.handler(ta.value, ta.selectionStart);
							}
						}
						
					});
				}
			}			
		},
		
		misc: {
			highlight_tc: function() {
				var tcs = messageList.tcs.getMessages();
				var tc;
				if (!tcs) {
					return;
				}
				for (var i = 0, len = tcs.length; i < len; i++) {
					tc = tcs[i];
					if (messageList.config.tc_highlight_color) {
						tc.getElementsByTagName('a')[0].style.color = '#'
								+ messageList.config.tc_highlight_color;
					}
				}
			},
			label_tc: function() {
				var tcs = messageList.tcs.getMessages();
				if (!tcs) {
					return;
				}
				var color = false;
				if (messageList.config.tc_label_color 
						&& messageList.config.tc_label_color != '') {
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
						b.style.color = '#' + messageList.config.tc_label_color;
					}
					span.appendChild(divider);
					span.appendChild(b);			
					username = tc.getElementsByTagName('a')[0];
					username.outerHTML += span.innerHTML;
				}
			},
			pm_title: function() {
				if (window.location.href.indexOf('inboxthread.php') == -1) {
					return;
				}
				var me = document.getElementsByClassName('userbar')[0]
						.getElementsByTagName('a')[0].innerText;
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
			},
			post_title_notification: function() {
				document.addEventListener('visibilitychange', messageList.clearUnreadPosts);
				document.addEventListener('scroll', messageList.clearUnreadPosts);
				document.addEventListener('mousemove', messageList.clearUnreadPosts);
			},
			click_expand_thumbnail: function(newPost) {
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
						messageList.image.observer.observe(phold, {
							attributes: true,
							childList: true
						});
					}
				}
			},				
			loadquotes: function() {
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
			},
			load_next_page: function() {
				document.getElementById('u0_3').addEventListener('dblclick',
						messageList.loadNextPage);
			}
		}
	},
	handleEvent: {
		ignoratorUpdate: function(msg) {		
			if (msg.action !== 'ignorator_update') {				
				switch (msg.action) {
					case "showIgnorated":
						var ignoratedPosts = document.getElementsByClassName('ignorated');
						var postsToShow = [];
						
						for (var i = 0, len = ignoratedPosts.length; i < len; i++) {
							var ignoratedPost = ignoratedPosts[i];
							var usernameElement = ignoratedPost.getElementsByTagName('a')[0];
							
							if (msg.value.toLowerCase() == usernameElement.innerHTML.toLowerCase()) {
								postsToShow.push(ignoratedPost);
							}							
						}
						
						// Iterate backwards so we can swap classes
						for (var i = postsToShow.length - 1; i >= 0; i--) {
							var postToShow = postsToShow[i];														
							postToShow.classList.remove('ignorated');
							// ignorated_post_peek sets display to "block" and opacity to 0.7
							postToShow.classList.add('ignorated_post_peek');
							
							if (i === 0) {
								$.scrollTo(postToShow);
							}
						}
						
						break;
						
					default:
						break;
				}
			}
		},
		load: function() {
			this.parseObserver.disconnect();
			if (window.location.hostname == 'archives.endoftheinter.net') {
				// quickpost-body element doesnt exist in archived topics - call filter_me method manually
				this.functions.quickpostbody.filter_me();
			}
			this.passToFunctions('misc');
			this.quote.addButtons();
			this.addListeners();
			this.appendScripts();
			this.addCSSRules();	
			this.livelinks.observe(document.getElementById('u0_1'), {
					subtree: true,
					childList: true
			});
			if (this.config.new_page_notify) {
				this.newPage.observe(document.getElementById('nextpage'), {
						attributes: true
				});
			}
		},
		newPost: function(container) {
			var index = document.getElementsByClassName('message-container').length;
			var functions = this.functions.messagecontainer;
			var live = true;
			var pm = '';
			if (window.location.href.match('inboxthread')) {
				pm = "_pm";
			}
			for (var i in functions) {
				if (this.config[i + pm]) {
						functions[i](container, index, live);
				}
			}
			
			this.addListeners(container);
			this.links.check(container);
			
			if (this.config.click_expand_thumbnail) {
				this.functions.misc.click_expand_thumbnail(container);
			}
			
			var usernameElement = container.getElementsByClassName('message-top')[0].getElementsByTagName('a')[0];			
			if (usernameElement.innerHTML != 'Filter') {
				usernameElement.className = 'username_anchor';
			}
					
			if (!this.config.hide_ignorator_badge) {
				// send updated ignorator data to background script
				this.globalPort.postMessage({
					action: 'ignorator_update',
					ignorator: this.ignorated,
					scope: "messageList"
				});
			}
		},
		mouseclick: function(evt) {
			// TODO - reorganise this using switch statements
			if (this.config.post_templates) {
				this.postTemplateAction(evt.target);
			}
			if (evt.target.id == 'notebook') {
				this.usernotes.open(evt.target);
				evt.preventDefault();
			}
			else if (evt.target.id == 'quick_image') {
				// imagemap object located in imagemap.js
				imagemap.init();
				evt.preventDefault();
			}
			else if (evt.target.className == 'like_button') {
				this.likeButton.process(evt.target);
				evt.preventDefault();
			}
			else if (evt.target.className == 'like_button_custom') {
				var templateNumber = evt.target.id;
				for (var i = 0, len = evt.path.length; i < len; i++) {
					var pathNode = evt.path[i];
					if (pathNode.className == 'like_button') {
						this.likeButton.process(pathNode, templateNumber);			
						break;
					}
				}
				evt.preventDefault();	
			}
			// Fix for relative URLs for LUEpedia (note that index === 0)
			else if (evt.target.title.indexOf("/index.php") === 0) {
				this.links.fixRelativeUrls(evt.target, "wiki");
				evt.preventDefault();
			}
			// Fix relative URLs for imagemap
			else if (evt.target.title.indexOf("/imap/") === 0) {
				this.links.fixRelativeUrls(evt.target, "imagemap");					
				evt.preventDefault();
			}
			else if (evt.target.className.match(/youtube|gfycat/)
					&& evt.target.tagName == 'DIV') {
				evt.preventDefault();
			}
			else if (evt.target.className == 'archivequote') {
				this.quote.handler(evt);
				evt.preventDefault();
			}
			else if (evt.target.parentNode) {
				if (evt.target.parentNode.className == 'embed') {
					this.youtube.embed(evt.target.parentNode);
					evt.preventDefault();
				}
				else if (evt.target.parentNode.className == 'hide') {
					this.youtube.hide(evt.target.parentNode);
					evt.preventDefault();
				}
				else if (evt.target.parentNode.className == 'embed_nws_gfy') {
					var gfycatID = evt.target.parentNode.id.replace('_embed', '');
					this.gfycat.embed(document.getElementById(gfycatID));
					evt.preventDefault();
				}
			}
		},
		mouseenter: function(evt) {
			if (evt.target.className == 'like_button' && this.config.custom_like_button) {
				this.cachedEvent = evt;
				this.menuDebouncer = setTimeout(
						this.likeButton.showOptions.call(this.likeButton), 250);
				// evt.preventDefault();
			}
			else if (evt.target.className == 'username_anchor' && this.config.user_info_popup) {
				allPages.cachedEvent = evt;
				this.popupDebouncer = setTimeout(allPages.popup.handler.bind(allPages.popup), 750);
			}
		},
		mouseleave: function(evt) {
			clearTimeout(this.menuDebouncer);
			clearTimeout(this.popupDebouncer);
			if (document.getElementById('hold_menu')) {
				this.likeButton.hideOptions();
				evt.preventDefault();
			}
		},
		keydown: function(evt) {
			if (evt.keyCode === 13 && document.activeElement.id === 'image_search') {
				imagemap.search.init.call(imagemap.search);
				evt.preventDefault();
			}
		},
		search: function() {
			clearTimeout(this.imagemapDebouncer);
			
			this.imagemapDebouncer = setTimeout(() => {
				
				if (document.getElementById('search_results')) {			
					imagemap.search.init.call(imagemap.search);
				}
				
			}, 250);
		}
	},
	gfycat: {
		loader: function() {
			var gfycats = document.getElementsByClassName('gfycat');
			var height = window.innerHeight;
						
			for (var i = 0, len = gfycats.length; i < len; i++) {
				var gfycat = gfycats[i];			
				var position = gfycat.getBoundingClientRect();
				// use window height + 200 to increase visibility of gfycatLoader
				if (position.top > height + 200 || position.bottom < 0) {
							
					if (gfycat.getAttribute('name') == 'embedded'
						|| gfycat.getAttribute('name') == 'embedded_thumb') {
							
						if (!gfycat.getElementsByTagName('video')[0].paused) {
							// pause hidden video elements to reduce CPU load
							gfycat.getElementsByTagName('video')[0].pause();	
						}
					}
				}
				
				else if (gfycat.tagName == 'A') {
					if (gfycat.getAttribute('name') == 'gfycat_thumb') {
						messageList.gfycat.thumbnail(gfycat);
					} else {
						messageList.gfycat.placeholder(gfycat);
					}
				}
				
				else if (gfycat.getAttribute('name') == 'placeholder') {
					messageList.gfycat.embed(gfycat);
				}
				
				else if (gfycat.getAttribute('name') == 'embedded'
						&& gfycat.getElementsByTagName('video')[0].paused) {
					gfycat.getElementsByTagName('video')[0].play();
				}
			}
		},
		checkAPI: function (url, callback) {
			var splitURL = url.split('/').slice(-1);
			var code = splitURL.join('/');
			var xhr = new XMLHttpRequest();
			xhr.open("GET", window.location.protocol + '//gfycat.com/cajax/get/' + code, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					var apiData = {};
					// gfycat api provides width, height, & webm url
					var response = JSON.parse(xhr.responseText);
					
					if (!response.gfyItem) {
						callback("error");
					}
					
					var width = response.gfyItem.width;
					var height = response.gfyItem.height;
					
					if (messageList.config.resize_gfys 
							&& width > messageList.config.gfy_max_width) {
						// scale video size to match gfy_max_width value
						height = (height / (width / messageList.config.gfy_max_width));
						width = messageList.config.gfy_max_width;
					}

					apiData.nsfw = response.gfyItem.nsfw;
					apiData.height = height;
					apiData.width = width;
					apiData.webm = response.gfyItem.webmUrl;
					callback(apiData);
				}
			};
			xhr.send();
		},
		placeholder: function(gfycatLink) {
			var url = gfycatLink.getAttribute('href');
			
			this.checkAPI(url, function(data) {
				
				if (data === "error") {
					// revert class name to stop gfycat loader from detecting link
					gfycatLink.className = 'l';
					return;
				}
				
				else if (messageList.config.hide_nws_gfycat) {
					if (document.getElementsByTagName('h2')[0].innerHTML.match(/N[WL]S/)) {						
						gfycatLink.className = "l";
						return;
					}
				}
				
				else {
					messageList.gfycat.workSafe(gfycatLink, data.nsfw, function(safe) {
						
						if (!safe) {
							
							if (messageList.config.hide_nws_gfycat) {
								gfycatLink.className = "l";
								return;
							}
							else {
								messageList.gfycat.embedOnHover(gfycatLink, data.webm, data.width, data.height);
								return;
							}
						}
						
						else {
							// create placeholder
							var placeholder = document.createElement('div');
							placeholder.className = 'gfycat';
							placeholder.id = data.webm;
							placeholder.setAttribute('name', 'placeholder');
							placeholder.innerHTML = '<video width="' + data.width + '" height="' + data.height + '" loop >'
									+ '</video>'
									+ '<span style="display:none"><br><br>' + url + '</span>';
									
							// prevent "Cannot read property 'replaceChild' of null" error
							if (gfycatLink.parentNode) {
								
								gfycatLink.parentNode.replaceChild(placeholder, gfycatLink);
								// check if placeholder is visible (some placeholders will be off screen)
								var position = placeholder.getBoundingClientRect();
								
								if (position.top > window.innerHeight) {
									return;
								} 
								
								else {
									// pass placeholder video element to embed function
									messageList.gfycat.embed(placeholder);
								}
							}
						}			
					});
				}
			});
		},
		thumbnail: function(gfycatLink) {
			var display;
			(messageList.config.show_gfycat_link)
					? display = 'inline'
					: display = 'none';
			var url = gfycatLink.getAttribute('href');
			var splitURL = url.split('/').slice(-1);
			var code = splitURL.join('/');
			var thumbnail = 'http://thumbs.gfycat.com/' + code + '-poster.jpg';
			this.checkAPI(url, function(data) {
				if (data === "error") {
					// revert class name to stop loader from detecting link
					gfycatLink.className = 'l';
					return;
				}
				else if (messageList.config.hide_nws_gfycat) {
					if (document.getElementsByTagName('h2')[0].innerHTML.match(/N[WL]S/)) {
						//console.log('NWS topic', gfycatLink);
						messageList.gfycat.embedOnHover(gfycatLink, data.webm, data.width, data.height);						
						return;
					}
				}
				else {
					messageList.gfycat.workSafe(gfycatLink, data.nsfw, function(safe) {
						if (!safe) {
							if (messageList.config.hide_nws_gfycat) {
								gfycatLink.className = "l";
								return;
							}
							else {
								messageList.gfycat.addHoverLink(gfycatLink, data.webm, data.width, data.height);
								return;
							}
						}
						else {
							// create placeholder element
							var placeholder = document.createElement('div');
							placeholder.className = 'gfycat';
							placeholder.id = data.webm;
							placeholder.innerHTML = '<img src="' + thumbnail 
									+ '" width="' + data.width + '" height="' + data.height + '">'
									+ '</img>'
									+ '<span style="display:' + display + '"><br><br>' + url + '</span>';
							if (gfycatLink.parentNode) {
								gfycatLink.parentNode.replaceChild(placeholder, gfycatLink);
								// add click listener to replace img with video
								var img = placeholder.getElementsByTagName('img')[0];
								img.title = "Click to play";
								img.addEventListener('click', function(ev) {
									ev.preventDefault();
									placeholder.innerHTML = '<video width="' + data.width 
											+ '" height="' + data.height 
											+ '" loop >'
											+ '</video>'
											+ '<span style="display:' + display + '"><br><br>' + url + '</span>';
									var video = placeholder.getElementsByTagName('video')[0];
									placeholder.setAttribute('name', 'embedded_thumb');
									video.src = placeholder.id;
									video.title = "Click to pause";
									video.play();
									video.addEventListener('click', function(ev) {
										video.title = "Click to play/pause";
										if (!video.paused) {
											video.pause();
										}
										else {
											video.play();
										}
									});
								});
							}	
						}
					});
				}
			});
		},
		workSafe: function(gfycatLink, nsfw, callback) {
			// check whether link is nws using gfycat api & post content
			var userbar = document.getElementsByTagName('h2')[0];
			var postHTML = gfycatLink.parentNode.innerHTML;
			// only check topics without NWS/NLS tags
			if (!userbar.innerHTML.match(/N[WL]S/)) {				
				if (nsfw === '1' || postHTML.match(/(n[wl]s)/i)) {
					gfycatLink.className = 'nws_gfycat';
					callback(false);
				}
				else {
					callback(true);
				}
			}
			else {
				callback(true);
			}
		},
		embedOnHover: function(gfycatLink, url, width, height) {
			// handle NWS videos
			gfycatLink.className = 'nws_gfycat';
			gfycatLink.id = url;
			gfycatLink.setAttribute('w', width);
			gfycatLink.setAttribute('h', height);		
			$(gfycatLink).hoverIntent(
				function() {
					// var that = this;
					var color = $("table.message-body tr td.message").css("background-color");
					if (this.className == "nws_gfycat") {
						$(this).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; " 
								+ "background: " + color 
								+ ";'><a id='" + url + '_embed'
								+ "'class='embed_nws_gfy' href='##'>&nbsp<b>[Embed NWS Gfycat]</b></a></span>"));
					}
				}, function() {
					// var that = this;
					if (this.className == "nws_gfycat") {
						$(this).find("span").remove();
					}
				}
			);
		},
		embed: function(placeholder) {
			if (placeholder.className === 'gfycat') {
				// use placeholder element to embed gfycat video
				var video = placeholder.getElementsByTagName('video')[0];
				if (messageList.config.show_gfycat_link) {
					placeholder.getElementsByTagName('span')[0].style.display = 'inline';
				}
				placeholder.setAttribute('name', 'embedded');
				// placeholder id is webm url
				video.src = placeholder.id;
				video.play();
			}
			else if (placeholder.className === 'nws_gfycat') {
				// create video element & embed gfycat
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
		},
		pause: function() {
			// pause all gfycat videos if document is hidden
			if (document.hidden) {
				var videos = document.getElementsByTagName('video');
				var video;
				for (var i = 0, len = videos.length; i < len; i++) {
					video = videos[i];
					if (video.src &&
							!video.paused) {
						video.pause();
					}
				}
			}
			else {
				// call gfycatLoader so that only visible gfycat videos are played
				// if document visibility changes from hidden to !hidden
				messageList.gfycat.loader();
			}
		}
	},
	youtube: {
		embed: function(anchor) {
			var toEmbed = document.getElementById(anchor.id);
			if (toEmbed.className == "youtube") {
				var color = $("table.message-body tr td.message").css("background-color");		
				var videoCode;
				var embedHTML;
				var href = toEmbed.href;
				var timeEquals = href.match(/(\?|\&|#)(t=)/);
				if (timeEquals) {
					var substring = href.substring(timeEquals.index, href.length);
					var time = substring.match(/([0-9])+([h|m|s])?/g);
				}
				var regExp = /^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/;
				var match = anchor.id.match(regExp);
				if (match && match[2].length == 11) {
					videoCode = match[2];
				} else {
					videoCode = match;
				}
				if (time) {
					// convert into seconds
					var splitTime, temp;
					var seconds = 0;
					for (var i = 0, len = time.length; i < len; i++) {
						splitTime = time[i];
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
					videoCode += "?start=" + seconds + "'";
				}				
				embedHTML = "<span style='display: inline; position: absolute; z-index: 1; left: 100; background: " + color + ";'>" 
									+ "<a id='" + anchor.id + "' class='hide' href='#hide'>&nbsp<b>[Hide]</b></a></span>" 
									+ "<br><div class='youtube'>" 
									+ "<iframe id='" + "yt" + anchor.id + "' type='text/html' width='640' height='390'" 
									+ "src='https://www.youtube.com/embed/" + videoCode 
									+ "'?autoplay='0' frameborder='0' allowfullscreen='allowfullscreen'/>" 
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
	},
	snippet: {
		handler: function(ta, caret) {
			// detects keyword & replaces with snippet
			var text = ta.substring(0, caret);			
			var message = document.getElementsyName('message')[0];
			
			var words, word;
			
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
			
			
			for (var key in messageList.config.snippet_data) {
				if (key === word) {
					var snippet = messageList.config.snippet_data[key];
					var index = text.lastIndexOf(word);
					var temp = text.substring(0, index);
					var ta = ta.replace(text, temp + snippet);
					message.value = ta;
					// manually move caret to end of pasted snippet as changing
					// message.value property moves caret to end of input)
					var newCaret = ta.lastIndexOf(snippet) + snippet.length;
					message.setSelectionRange(newCaret, newCaret);
				}
			}
		}	
	},
	usernotes: {
		open: function(el) {
			var userID = el.href.match(/note(\d+)$/i)[1];
			if (document.getElementById("notepage")) {
				var pg = document.getElementById('notepage');
				userID = pg.parentNode.getElementsByTagName('a')[0].href
						.match(/user=(\d+)$/i)[1];
				messageList.config.usernote_notes[userID] = pg.value;
				pg.parentNode.removeChild(pg);
				messageList.usernotes.save();
			} else {
				var note = messageList.config.usernote_notes[userID];
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
				data: messageList.config.usernote_notes
			}, function(rsp) {
				console.log(rsp);
			});
		}
	},
	quote: {
		depth: 0,
		handler: function(evt) {
			
			if (evt.likeButton) {
				var msgId = evt.id;
			}
			else {
				var msgId = evt.target.id;
			}
			
			var messageContainer = document.querySelector('[msgid="' + msgId + '"]');
			
			var markup = '<quote msgid="' + msgId + '">' + this.getMarkup(messageContainer) + '</quote>';
			
			
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
				
				this.notify(evt.target);
			}
		},
		
		notify: function(node) {
			var bgColor = $(node.parentNode).css('background-color');
			// create hidden notification so we can use fadeIn() later
			$(node).append(
					$('<span id="copied"' 
							+ 'style="display: none; position: absolute; z-index: 1; left: 100; '
							+ 'background: ' + bgColor 
							+ ';">&nbsp<b>[copied to clipboard]</b></span>')
			);
						
			$("#copied").fadeIn(200);
				
			setTimeout(() => {
				
				$(node).find("span:last")
						.fadeOut(400);
						
			}, 1500);
			
			setTimeout(function() {
				
				$(node).find("span:last")
						.remove();
						
			}, 2000);
		},
		
		addButtons: function() {
			var hostname = window.location.hostname;
			var topicId = window.location.search.replace("?topic=", "");
			var container;
			var tops = [];
			if (hostname === "archives.endoftheinter.net") {
				var links = document.getElementsByTagName("a");
				var msgs = document.getElementsByClassName("message");
				var containers = document.getElementsByClassName("message-container");
				for (var i = 0, len = containers.length; i < len; i++) {
					var container = containers[i];
					tops[i] = container.getElementsByClassName("message-top")[0];
					var msgID = msgs[i].getAttribute("msgid");
					var quote = document.createElement("a");
					var quoteText = document.createTextNode("Quote");
					var space = document.createTextNode(" | ");
					quote.appendChild(quoteText);
					quote.href = "#";
					quote.id = msgID;
					quote.className = "archivequote";
					tops[i].appendChild(space);
					tops[i].appendChild(quote);
				}
			}
		},
		
		getMarkup: function(parentElement) {
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
							var imgNodes = node.getElementsByTagName('A');
							for (var l = 0, img_len = imgNodes.length; l < img_len; l++) {
								var imgNode = imgNodes[l];
								output += '<img imgsrc="' + imgNode.getAttribute('imgsrc') + '" />' + '\n';
							}				
							break;
							
						case 'spoiler_closed':
							output += this.getMarkupFromSpoiler(node);
							break;
							
						case 'quoted-message':
							// getMarkup() is called recursively from inside getMarkupFromQuote(),
							// so this.depth can increase beyond 1 (depending on the level of nesting)
							this.depth++;
							output += this.getMarkupFromQuote(node);
							this.depth--;
							break;
						
						default:
							// If child node doesn't fit into any of these cases, we can just ignore it
							break;
					}
				}
			}
			
			return output;
		},
		
		getMarkupFromQuote: function(node) {
			var openQuote = '<quote>';
			var closeQuote = '</quote>';
			var msgId = node.attributes.msgid.value;
			if (msgId) {
				openQuote = '<quote msgid="' + msgId + '">';
			}						
			
			if (this.depth >= 2 && msgId) {
				// To match ETI behaviour when building markup, we have to omit quoted text if the quote depth 
				// reaches three levels of nesting. We should only do this if quote is attributed to another user
				return openQuote + closeQuote;	
			}
			
			else {
				return openQuote + this.getMarkup(node) + closeQuote;	
			}						
		},
				
		getMarkupFromSpoiler: function(node) {
			var openSpoiler = '<spoiler>';
			var closeSpoiler = '</spoiler>';					
			var spoiler = node.getElementsByClassName('spoiler_on_open')[0];					
			var caption = node.getElementsByClassName('caption')[0].innerText.replace(/<|\/>/g, '');
			// Caption element contains an added whitespace character at end
			caption = caption.slice(0, -1);
			
			// We only need to include caption if it doesn't match the default text
			if (caption && caption !== 'spoiler') {
				openSpoiler = '<spoiler caption="' + caption + '">';
			}

			// First and last elements of node list are part of the UI and should not be included in markup
			spoiler.removeChild(spoiler.firstChild);
			spoiler.removeChild(spoiler.lastChild);
			
			return openSpoiler + this.getMarkup(spoiler) + closeSpoiler;
		}		
		
	},
	image: {
		expand: function(evt) {
			var num_children = evt.target.parentNode.parentNode.childNodes.length;
			// first time expanding - only span
			if (num_children == 1) {
				if (messageList.config.debug)
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
				if (messageList.config.debug)
					console.log("not first time expanding - toggle display status");

				// toggle their display statuses
				var children = evt.target.parentNode.parentNode.childNodes
				for (var i = 0; i < children.length; i++) {
					if (children[i].style.display == "none") {
						children[i].style.display = '';
					} else {
						children[i].style.display = "none";
					}
				}
			} else if (messageList.config.debug)
				console
						.log("I don't know what's going on with this image - weird number of siblings");
		},
		resize: function(el) {	
			var width = el.width;			
			if ((width * messageList.zoomLevel) > messageList.config.img_max_width) {
				// take zoom level into account when resizing images
				el.height = (el.height / (el.width / messageList.config.img_max_width) / messageList.zoomLevel);
				el.parentNode.style.height = el.height + 'px';
				el.width = messageList.config.img_max_width / messageList.zoomLevel;
				el.parentNode.style.width = el.width + 'px';
			}
		},
		observer: new MutationObserver(function(mutations) {
			for (var i = 0; i < mutations.length; i++) {
				var mutation = mutations[i];
				if (messageList.config.resize_imgs) {
					messageList.image.resize(mutation.target.childNodes[0]);
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
								messageList.image.expand);
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
	},
	spoilers: {
		find: function(el) {
			var spans = document.getElementsByClassName('spoiler_on_close');
			var node;
			for (var i = 0; spans[i]; i++) {
				node = spans[i].getElementsByTagName('a')[0];
				messageList.spoilers.toggle(node);
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
	},
	links: {
		check: function(msg) {
			var target = msg || document;
			var links = target.getElementsByClassName("l");
			var checkedLinks = {};
			var i = links.length;
			var ytRegex = /youtube|youtu.be/;
			var videoCodeRegex = /^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			// iterate backwards to prevent errors when modifying class of elements
			while (i--) {
				var link = links[i];
				
				if (messageList.config.embed_on_hover && link.href.match(ytRegex) && link.href.match(videoCodeRegex)) {						
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
				}
				else if (link.href.indexOf('://lue.link/') > -1
						&& messageList.config.full_link_names) {
					// make sure that we only make 1 request for each unique url on page
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
				}
				else if (link.title.indexOf("gfycat.com/") > -1) {			
					if (messageList.config.embed_gfycat || messageList.config.embed_gfycat_thumbs) {
						link.className = "gfycat";
						if (messageList.config.embed_gfycat_thumbs 
								|| link.parentNode.className == "quoted-message") {
							link.setAttribute('name', "gfycat_thumb");
						}
					}
				}
			}
			
			if (messageList.config.embed_gfycat || messageList.config.embed_gfycat_thumbs) {
				// call gfycat.loader to embed links which are visible in viewport
				messageList.gfycat.loader();				
				window.addEventListener('scroll', messageList.gfycat.loader);
				document.addEventListener('visibilitychange', messageList.gfycat.pause);
			}
		},
		fixRelativeUrls: function(anchor, type) {
			// fixes problem where wiki/imagemap links redirect incorrectly
			if (type === "wiki") {
				window.open(anchor.href.replace("boards", "wiki"));
			}
			else if (type === "imagemap") {				
				window.open(anchor.href.replace("boards", "images"));
			}
		}
	},
	tcs: {
		getMessages: function() {
			if (!messageList.config.tcs)
				messageList.config.tcs = {};
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
				if (!messageList.config.tcs[topic]) {
					console.log('Unknown TC!');
					return;
				}
				tc = messageList.config.tcs[topic].tc;
			}
			if (!messageList.config.tcs[topic]) {
				messageList.config.tcs[topic] = {};
				messageList.config.tcs[topic].tc = tc;
				messageList.config.tcs[topic].date = new Date().getTime();
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
			messageList.tcs.save();
			return tcs;
		},
		save: function() {
			var max = 40;
			var lowest = Infinity;
			var lowestTc;
			var numTcs = 0;
			for ( var i in messageList.config.tcs) {
				if (messageList.config.tcs[i].date < lowest) {
					lowestTc = i;
					lowest = messageList.config.tcs[i].date;
				}
				numTcs++;
			}
			if (numTcs > max)
				delete messageList.config.tcs[lowestTc];
			chrome.runtime.sendMessage({
				need: "save",
				name: "tcs",
				data: messageList.config.tcs
			});
		}	
	},
	likeButton: {
		process: function(node, templateNumber) {
			var anonymous;
			var container = node.parentNode.parentNode;
			var message = node.parentNode.parentNode.getElementsByClassName('message')[0];
			var nub = document.getElementsByClassName('quickpost-nub')[0];
			var quickreply = document.getElementsByTagName('textarea')[0];
			
			
			// Get names of user and quoted poster
			if (document.getElementsByTagName('h2')[0].innerHTML.match(/\/topics\/Anonymous/)) {
				anonymous = true;
				var user = "Human";
				var poster = "this";
			}
			
			else {
				var user = document.getElementsByClassName('userbar')[0]
						.getElementsByTagName('a')[0].innerHTML.replace(/ \((-?\d+)\)$/, "");
				var poster = container.getElementsByTagName('a')[0].innerHTML;
			}
			
			
			// Create like message
			var likeMessage;
			if (templateNumber) {
				likeMessage = messageList.config.custom_like_data[templateNumber].contents;
				likeMessage = likeMessage.replace('[user]', user);
				likeMessage = likeMessage.replace('[poster]', poster);
				
				if (anonymous) {
					// Kludgy grammar fix
					likeMessage = likeMessage.replace("this's", "this");
				}
			}
			
			else {				
				var img = '<img src="http://i4.endoftheinter.net/i/n/f818de60196ad15c888b7f2140a77744/like.png" />';
				if (anonymous) {
					likeMessage = img + ' Human likes this post';
				}
				else {
					likeMessage = img + ' ' + user + ' likes ' + poster + "'s post"; 
				}
			}
			
			// Generate markup from selected post and format text to insert
			var msgID = message.getAttribute('msgid');
			var quotedMessage = messageList.quote.handler({'id': msgID, 'likeButton': true});								
			var textToInsert = quotedMessage + '\n' + likeMessage;
			
			// Insert like message at caret position
			var caret = quickreply.selectionStart;
			
			quickreply.value = quickreply.value.substring(0, caret) 
					+ textToInsert 
					+ quickreply.value.substring(caret, quickreply.value.length);						
			
			// Move caret to end of inserted text.
			var endOfInsertion = caret + textToInsert.length;
			
			// We have to call setSelectionRange from inside setTimeout because of weird Chrome bug
			setTimeout(() => {
				quickreply.focus();
				quickreply.setSelectionRange(endOfInsertion, endOfInsertion);
			}, 0);
			
			if (document.getElementsByClassName('regular quickpost-expanded').length == 0) {
				// quickpost area is hidden - click nub element to open
				nub.click();
			}
		},
		showOptions: function() {
			if (!document.getElementById('hold_menu')) {
				var likeData = messageList.config.custom_like_data;
				var menuElement = document.createElement('span');
				menuElement.id = 'hold_menu';	
				menuElement.style.position = 'absolute';
				menuElement.style.overflow = 'auto';
				menuElement.style.padding = '3px 3px';
				menuElement.style.borderStyle = 'solid';
				menuElement.style.borderWidth = '2px';
				menuElement.style.borderRadius = '3px';
				menuElement.style.backgroundColor = $(document.body).css('background-color');
				for (var id in likeData) {
					var name = likeData[id].name;					
					populateMenu.call(this, name, id, menuElement);
				}
				messageList.cachedEvent.target.appendChild(menuElement);
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
	},
	autoscrollCheck: function(mutation) {
		// checks whether user has scrolled to bottom of page
		var position = mutation.getBoundingClientRect();
		if (mutation.style.display == 'none'
				|| position.top > window.innerHeight) {
			return false;
		} else {
			return true;
		}
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
		allPages.asyncUpload(chosen.files, 0);
	},
	postTemplateAction: function(evt) {
		if (evt.className === "expand_post_template") {
			var ins = evt.parentNode;
			ins.removeChild(evt);
			var ia = document.createElement('a');
			ia.innerHTML = "&lt;"
			ia.className = "shrink_post_template";
			ia.href = '##';
			ins.innerHTML = '[';
			ins.insertBefore(ia, null);
			for ( var i in this.config.post_template_data) {
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
		}
		if (evt.className === "shrink_post_template") {
			var ins = evt.parentNode;
			evt.parentNode.removeChild(evt);
			var ia = document.createElement('a');
			ia.innerHTML = "&gt;"
			ia.className = "expand_post_template";
			ia.href = '##';
			ins.innerHTML = '[';
			ins.insertBefore(ia, null);
			ins.innerHTML += ']';
		}
		if (evt.className === "post_template_title") {
			evt.id = 'post_action';
			var cdiv = document.getElementById('cdiv');
			var d = {};
			d.text = this.config.post_template_data[evt.parentNode.className].text;
			cdiv.innerText = JSON.stringify(d);
			cdiv.dispatchEvent(this.postEvent);
		}
	},
	clearUnreadPosts: function(evt) {
		if (!document.title.match(/\(\d+\+?\)/)
				|| this.autoscrolling == true
				|| document.hidden) {
			// do nothing
			return;
		}
		else if (document.title.match(/\(\d+\+?\)/)) {
			var newTitle = document.title.replace(/\(\d+\+?\) /, "");
			document.title = newTitle;
		}
	},
	loadNextPage: function() {
		var page = 1;
		if (window.location.href.match('asyncpg')) {
			page = parseInt(window.location.href.match('asyncpg=(\d+)')[1]);
		} else if (window.location.href.match('page')) {
			page = parseInt(window.location.href.match('page=(\d+)')[1]);
		}
		page++;
		var topic = window.location.href.match('topic=(\d+)')[1];
	},
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
	addListeners: function(newPost) {
		// make sure that these listeners are only added once
		if (!newPost) {
			document.body.addEventListener('click', this.handleEvent.mouseclick.bind(this));
			
			var searchBox = document.getElementById('image_search');			
			if (searchBox) {
				searchBox.addEventListener('keyup', this.handleEvent.search.bind(this));		
				document.addEventListener('keydown', this.handleEvent.keydown.bind(this));
			}
		}
		// these listeners should be added to every new post
		if (this.config.user_info_popup) {
			var tops;
			if (newPost) {
				tops = newPost.getElementsByClassName('message-top');
			} else {
				tops = document.getElementsByClassName('message-top');
			}
			for (var i = 0, len = tops.length; i < len; i++) {
				var top = tops[i];				
				var anchor = top.getElementsByTagName('a')[0];
				// ignore users in anon topics
				if (anchor.href.indexOf('http://endoftheinter.net/profile.php?user=') > -1) {
					anchor.className = 'username_anchor';
					anchor.addEventListener('mouseenter', this.handleEvent.mouseenter.bind(this));
					anchor.addEventListener('mouseleave', this.handleEvent.mouseleave.bind(this));
				}
			}
		}
	},
	appendScripts: function() {
		var head = document.getElementsByTagName("head")[0];
		if (messageList.config.post_templates) {
			var templates = document.createElement('script');
			templates.type = 'text/javascript';
			templates.src = chrome.extension.getURL('src/js/topicPostTemplate.js');
			head.appendChild(templates);
		}
	},	
	newPage: new MutationObserver(function(mutations) {
		for (var i = 0, len = mutations.length; i < len; i++) {
			var mutation = mutations[i];
			if (mutation.type === 'attributes' 
					&& mutation.target.style.display === 'block') {
				chrome.runtime.sendMessage({
					need: "notify",
					title: "New Page Created",
					message: document.title
				});
			}
		}
	}),
	livelinks: new MutationObserver(function(mutations) {
		for (var i = 0, len = mutations.length; i < len; i++) {
			var mutation = mutations[i];
			if (mutation.addedNodes.length > 0
					&& mutation.addedNodes[0].childNodes.length > 0) {
				if (mutation.addedNodes[0].childNodes[0].className == 'message-container') {
					// send new message container to livelinks method
					messageList.handleEvent.newPost.call(messageList, mutation.addedNodes[0]);
				}
			}
		}
	}),
	applyDomModifications: function(pm) {
		var msgs = document.getElementsByClassName('message-container');
		var pageFunctions = this.functions.infobar;
		var postFunctions = this.functions.messagecontainer;
		var quickpostFunctions = this.functions.quickpostbody;
		var miscFunctions = this.functions.misc;
		var config = this.config;
		
		// crude method to detect zoom level for image resizing - we don't need to be completely accurate
		var screenWidth = window.screen.width;
		var documentWidth = document.documentElement.clientWidth;
		this.zoomLevel = screenWidth / documentWidth;	
		
		// call functions which modify infobar element
		for (var k in pageFunctions) {
			if (config[k + pm]) {
					pageFunctions[k]();
			}
		}
		
		// add archive quote buttons before highlights/post numbers are added
		this.quote.addButtons();
		
		// iterate over first 5 message-containers (or fewer)
		var len;
		if (msgs.length < 4) {
			len = msgs.length;
		}
		else {
			len = 4;
		}
		for (var j = 0; j < len; j++) {
			var msg = msgs[j];
			// iterate over functions in messageList
			for (var k in postFunctions) {
				if (config[k + pm]) {
					// pass msg and index value to function
					postFunctions[k](msg, j + 1);
				}
			}
		}
		var element = document.getElementsByTagName('h2')[0];
		if (config.dramalinks && !config.hide_dramalinks_topiclist) {
			dramalinks.appendTo(element);
			
			// Modify existing margin-top value (-39px) of pascal so that it appears above ticker
			var offset = -39 - document.getElementById('dramalinks_ticker').getBoundingClientRect().height;
			document.styleSheets[0].insertRule("img[src='//static.endoftheinter.net/pascal.png'] { margin-top: " + offset + "px !important; }", 1);			
		}
		
		// page will appear to have been fully loaded by this point
		if (len == 4) {
			// iterate over rest of messages
			for (var j = 4; msg = msgs[j]; j++) {
				for (var k in postFunctions) {
					if (config[k + pm]) {
						postFunctions[k](msg, j + 1);
					}
				}
			}
		}
		
		// pass updated ignorator data to background page
		if (!this.config.hide_ignorator_badge) {
			this.globalPort.postMessage({
				action: 'ignorator_update',
				ignorator: this.ignorated,
				scope: "messageList"
			});
		}
		
		// call functions which modify quickpost area
		for (var i in quickpostFunctions) {
			if (config[i + pm]) {
				quickpostFunctions[i]();
			}
		}
		
		this.addCSSRules();			
		
		// call functions that dont modify DOM
		for (var i in miscFunctions) {
			if (config[i + pm]) {
				miscFunctions[i]();
			}
		}
		
		// call functions that dont exist in posts/page/misc objects
		this.links.check();
		this.addListeners();
		this.appendScripts();
		
		// add livelinks listeners 
		this.livelinks.observe(document.getElementById('u0_1'), {
				subtree: true,
				childList: true
		});		
		if (this.config.new_page_notify) {
			this.newPage.observe(document.getElementById('nextpage'), {
					attributes: true
			});
		}
	},
	prepareIgnoratorArray: function() {
		this.ignoredUsers = this.config.ignorator_list.split(',');
		for (var r = 0, len = this.ignoredUsers.length; r < len; r++) {
			this.ignoredUsers[r] = this.ignoredUsers[r].trim();
		}	
	},
	addCSSRules: function() {
		var sheet = document.styleSheets[0];
		sheet.insertRule(".like_button_custom { opacity: 0.5; }", 1);
		sheet.insertRule(".like_button_custom:hover { opacity: 1.0; }", 1);
		sheet.insertRule("#loading_image { -webkit-animation:spin 2s linear infinite; }", 1);
		sheet.insertRule("@-webkit-keyframes spin { 100% { -webkit-transform:rotate(360deg); } }", 1);
		sheet.insertRule("#map_div img:hover { opacity: 0.7; }", 1);
	}
};

chrome.runtime.sendMessage({
	need: "config",
	tcs: true
}, function(config) {
	messageList.init.call(messageList, config);
});