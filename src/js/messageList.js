var messageList = {
	init: function(config) {
		this.config = config.data;
		this.config.tcs = config.tcs;		
		this.prepareIgnoratorArray();
		// set up globalPort so we can interact with background page
		this.globalPort = chrome.runtime.connect();
		this.globalPort.onMessage.addListener(this.handleEvent.ignoratorUpdate);
		
		// check whether we need to display dramalinks ticker
		if (this.config.dramalinks && !window.location.href.match('inboxthread.php')) {						
			chrome.runtime.sendMessage({
					need : "dramalinks"
			}, function(response) {
				dramalinks.html = response.data;					
				dramalinks.config = messageList.config;
			});
		}
		else {
			// (user is in PM inbox)
			this.pm = "_pm";		
		}
				
		if (document.readyState == 'loading') {
			// pass elements to functions as they are parsed by browser			
			this.parseObserver.observe(document, {
					childList: true,
					subtree: true
			});
			// after DOMContentLoaded fires, listen for new posts
			document.addEventListener('DOMContentLoaded', this.handleEvent.load.bind(this));
		}
		else {
			// DOM already loaded - use getElementBy... methods to pass elements to functions
			this.callFunctions(this.pm);
		}
	},
	functions: {		
		messagecontainer: {
			eti_bash: function(msg, index) {
				var top = msg.getElementsByClassName('message-top')[0];
				anchor = document.createElement('a');
				anchor.style.cssFloat = 'right';
				anchor.href = '##bash';
				anchor.className = 'bash';
				anchor.id = "bash_" + index;
				anchor.innerHTML = '&#9744;';
				anchor.style.textDecoration = 'none';
				top.appendChild(anchor);
			},
			ignorator_messagelist: function(msg, index) {
				if (!messageList.config.ignorator) {
					return;
				}
				var tops = msg.getElementsByClassName('message-top');
				var top, username, currentIndex;
				messageList.topsTotal += tops.length;
				for (var j = 0; j < tops.length; j++) {
					top = tops[j];
					if (top) {
						username = top.getElementsByTagName('a')[0].innerHTML.toLowerCase();
						for (var f = 0, len = messageList.ignores.length; f < len; f++) {
							if (username == messageList.ignores[f]) {
								// calculate equivalent index of message-top for
								// show_ignorator function
								if (j == 0 && messageList.topsTotal > 0) {
									currentIndex = messageList.topsTotal - tops.length; 
								}
								else {
									currentIndex = messageList.topsTotal - j;
								}
								top.parentNode.style.display = 'none';
								if (messageList.config.debug) {
									console.log('removed post by '
											+ messageList.ignores[f]);
								}
								messageList.ignorated.total_ignored++;
								if (!messageList.ignorated.data.users[messageList.ignores[f]]) {
									messageList.ignorated.data.users[messageList.ignores[f]] = {};
									messageList.ignorated.data.users[messageList.ignores[f]].total = 1; 
									messageList.ignorated.data.users[messageList.ignores[f]].trs = [ currentIndex ];
								} else {
									messageList.ignorated.data.users[messageList.ignores[f]].total++;
									messageList.ignorated.data.users[messageList.ignores[f]].trs
											.push(currentIndex);
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
			number_posts: function(msg, index) {
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
								/*if (live && messageList.config.notify_userhl_post 
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
												+ msg
														.getElementsByClassName('message-top')[0]
														.getElementsByTagName('a')[0].innerHTML
									}, function(data) {
										console.log(data);
									});
								}*/
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
								title: "Post by "
										+ msg.getElementsByClassName('message-top')[0]
												.getElementsByTagName('a')[0].innerHTML
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
				var tags = document.getElementsByTagName('h2')[0].innerHTML;
				if (tags.indexOf('/topics/Anonymous') > -1) {
					if (!window.location.href.match('archives')) {
						var tops = msg.getElementsByClassName('message-top');
						if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {				
							var self = document.getElementsByClassName('quickpost-body')[0]
									.getElementsByTagName('a')[0].innerHTML;
							if (self.indexOf('Human') == -1) {
								return;
							}
							var top, humanToCheck, span;
							for (var i = 0, len = tops.length; i < len; i++) {
								top = tops[i];
								humanToCheck = top.getElementsByTagName('a')[0];
								if (humanToCheck.innerHTML.indexOf('Filter') > -1) {
									// handle livelinks post
									humanToCheck = top.getElementsByTagName('b')[0].nextSibling;
									if (!humanToCheck.innerHTML 
											&& humanToCheck.nodeValue.indexOf(self) > -1) {
										span = document.createElement('span');
										span.innerHTML = '<b>(Me)</b> | ';
										top.insertBefore(span, humanToCheck.nextSibling);		
									}
								}
								else if (humanToCheck.innerHTML == self) {
										span = document.createElement('span');
										span.innerHTML = ' | <b>(Me)</b>';
										top.insertBefore(span, humanToCheck.nextSibling);
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
					// trigger after 10ms delay to prevent undesired 
					// behaviour in post_title_notification
					setTimeout(function() {
						messageList.scrolling = true;
						$.scrollTo((mutation), 800);
					}, 10);
					setTimeout(function() {
						messageList.scrolling = false;	
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
					if (document.getElementsByClassName('message-container')[50]) {
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
				var regex = window.location.search.match(/(topic=)([0-9]+)/);
				if (regex) {
					var topicNumber = regex[0];
				}
				else {
					return;
				}
				var infobar = document.getElementsByClassName("infobar")[0];
				var page = location.pathname;
				var anchor = document.createElement('a');
				var divider = document.createTextNode(" | ");
				if (page == "/imagemap.php" && topicNumber) {
					anchor.href = '/showmessages.php?' + topicNumber;
					anchor.innerText = 'Back to Topic';
					infobar.appendChild(divider);
					infobar.appendChild(anchor);
				} else if (page == "/showmessages.php") {
					anchor.href = '/imagemap.php?' + topicNumber;
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
									commonFunctions.asyncUpload(evt.dataTransfer.files);
								});
			},
			snippet_listener: function() {
				if (window.location.hostname.indexOf("archives") == -1) {
					var ta = document.getElementsByName('message')[0];
					var caret;
					ta.addEventListener('keydown', 
						function(event) {
							if (messageList.config.snippet_alt_key) {
								if (event.shiftKey == true
										&& event.keyIdentifier == 'U+0009') {
									event.preventDefault();
									caret = messageList.snippet.findCaret(ta);
									messageList.snippet.handler(ta.value, caret);				
								}
							}
							else if (!messageList.config.snippet_alt_key) {
								if (event.keyIdentifier == 'U+0009') {
									event.preventDefault();
									caret = messageList.snippet.findCaret(ta);
									messageList.snippet.handler(ta.value, caret);
								}
							}		
						}
					);
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
			click_expand_thumbnail: function() {
				var messages = document.getElementsByClassName('message');
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
						if (messageList.config.debug) {
							console.log("showing hidden msg", msg.ids);
						}
						var tops = document.getElementsByClassName('message-top');
						for (var i = 0; i < msg.ids.length; i++) {
							if (messageList.config.debug) {
								console.log(tops[msg.ids[i]]);
							}
							tops[msg.ids[i]].parentNode.style.display = 'block';
							tops[msg.ids[i]].parentNode.style.opacity = '.7';
						}
						break;
					default:
						if (messageList.config.debug)
							console.log('invalid action', msg);
						break;
				}
			}
		},
		load: function() {
			this.parseObserver.disconnect();
			this.passToFunctions('misc');
			this.quote.addButtons();
			this.addListeners();
			this.appendScripts();
			this.addCSSRules();	
			this.livelinks.observe(document.getElementById('u0_1'), {
					subtree: true,
					childList: true
			});
			this.globalPort.postMessage({
				action: 'ignorator_update',
				ignorator: this.ignorated,
				scope: "messageList"
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
			this.addListeners(true);
			this.links.check(container);
			// send updated ignorator data to background script
			this.globalPort.postMessage({
				action: 'ignorator_update',
				ignorator: this.ignorated,
				scope: "messageList"
			});
		},
		mouseclick: function(evt) {
			if (this.config.post_templates) {
				this.postTemplateAction(evt.target);
			}
			if (evt.target.id == 'notebook') {
				this.usernotes.open(evt.target);
				evt.preventDefault();
			}
			else if (evt.target.id == 'quick_image') {
				this.image.map.init(evt.target.id);
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
						return;
					}
				}
				evt.preventDefault();	
			}
			else if (evt.target.title.indexOf("/index.php") === 0) {
				this.links.fix(evt.target, "wiki");
				evt.preventDefault();
			}
			else if (evt.target.title.indexOf("/imap/") === 0) {
				this.links.fix(evt.target, "imagemap");					
				evt.preventDefault();
			}
			else if (evt.target.className.match(/youtube|gfycat/)
					&& evt.target.tagName == 'DIV') {
				evt.preventDefault();
			}
			else if (evt.target.className == 'bash' && evt.target.getAttribute('ignore') !== 'true') {
				evt.target.className = 'bash_this';			
				evt.target.style.fontWeight = 'bold';
				evt.target.innerHTML = '&#9745;';
				this.bash.checkSelection(evt.target);
				this.bash.showPopup();	
				evt.preventDefault();				
			}
			else if (evt.target.className == 'bash_this') {
				evt.target.className = 'bash';
				evt.target.style.fontWeight = 'initial';
				evt.target.innerHTML = '&#9744;';
				this.bash.checkSelection(evt.target);
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
				else if (evt.target.parentNode.id == 'submitbash') {
					this.bash.handler();
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
			if (evt.target.className == 'like_button') {
				this.cachedEvent = evt;
				this.menuDebouncer = setTimeout(
						this.likeButton.showOptions.bind(this.likeButton), 250);
				evt.preventDefault();	
			}
			else if (evt.target.className == 'username_anchor') {			
				commonFunctions.cachedEvent = evt;
				this.popupDebouncer = setTimeout(function() {
						commonFunctions.handlePopup
								.call(commonFunctions, commonFunctions.cachedEvent);							
				}, 1000);
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
		search: function() {
			// perform search after 500ms of no keyboard activity
			clearTimeout(this.imagemapDebouncer);
			this.imagemapDebouncer = setTimeout(function() {
				messageList.image.map.search.init
					.call(messageList.image.map.search);
			}, 500);
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
				if (position.top > height + 200 
						|| position.bottom < 0) {
					if (gfycat.getAttribute('name') == 'embedded'
						|| gfycat.getAttribute('name') == 'embedded_thumb')
						if (!gfycat.getElementsByTagName('video')[0].paused) {
						// pause hidden video elements to reduce CPU load
						gfycat.getElementsByTagName('video')[0].pause();
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
			var xhrURL = 'http://gfycat.com/cajax/get/' + code;
			var https;
			if (window.location.protocol == 'https:') {
				https = true;
				xhrURL = xhrURL.replace('http', 'https');
			}
			var xhr = new XMLHttpRequest();
			xhr.open("GET", xhrURL, true);
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
					var webm;
					if (https) {
						webm = response.gfyItem.webmUrl.replace('http', 'https');
					}
					else {
						webm = response.gfyItem.webmUrl;
					}
					apiData.nsfw = response.gfyItem.nsfw;
					apiData.height = height;
					apiData.width = width;
					apiData.webm = webm;
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
								} else {
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
			console.log('workSafe');
			console.log(gfycatLink);
			console.log(gfycatLink.parentNode);
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
	},
	snippet: {
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
			for (var key in messageList.config.snippet_data) {
				if (key === word) {
					snippet = messageList.config.snippet_data[key];
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
	},
	bash: {
		showPopup: function() {
			var popup = document.getElementById('bash_popup');
			if (popup) {
				return;
			}
			var bottomColor = $('body, table.classic tr td').css('background-color');
			var div = document.createElement('div');
			div.style.background = bottomColor;
			div.style.boxShadow = "5px 5px 1.2em black";
			div.style.position = 'fixed';
			div.style.width = 100;
			div.style.top = 0;
			div.style.marginTop = '-100%';
			div.id = 'bash_popup';
			div.innerHTML = '<div>'
				+ '<a id ="submitbash" href="##submitbash"><b>[Submit quote to ETI Bash]</b></a>' 
				+ '</div>';
			$('body').append(div);
			$(div).animate({'margin-top': '0'}, {
				queue: false,
				duration: 200
			});
		},
		checkSelection: function(target) {
			var popup = document.getElementById('bash_popup');
			var bashes = document.getElementsByClassName('bash_this');
			var len = bashes.length;	
			if (target) {
				// check whether target contains quoted messages
				var unchecked = document.getElementsByClassName('bash');
				var posts = document.getElementsByClassName('message-container');
				var bash, post_number, uncheck, container;		
				post_number = target.id.match(/[0-9]+/)[0];
				quotes = posts[post_number].getElementsByClassName('quoted-message');
				if (quotes.length > 0) {
					// prevent user from selecting other posts
					for (var j = 0, u_len = unchecked.length; j < u_len; j++) {
						uncheck = unchecked[j];					
						uncheck.setAttribute('ignore', 'true');
						uncheck.style.opacity = 0.2;
					}
				}
				else if (quotes.length == 0) {
					// prevent user from selecting posts containing quoted messages
					for (var j = 0, u_len = unchecked.length; j < u_len; j++) {
						uncheck = unchecked[j];
						container = uncheck.parentNode.parentNode;
						if (container.getElementsByClassName('quoted-message').length > 0) {
							uncheck.setAttribute('ignore', 'true');
							uncheck.style.opacity = 0.2;			
						}
					}				
				}
			}
			if (popup) {
				if (len > 1) {
					popup.getElementsByTagName('a')[0].innerHTML = '<b>[Submit quotes to ETI Bash]</b>';
				}
				else if (len === 1) {
					popup.getElementsByTagName('a')[0].innerHTML = '<b>[Submit quote to ETI Bash]</b>';
				}
				else if (len === 0) {
					messageList.bash.reset(bashes);
				}
			}
		},
		reset: function(bashes) {
			var unchecked = document.getElementsByClassName('bash');
			var bash, uncheck;
			for (var i = bashes.length; i--;) {
				bash = bashes[i];
				bash.className = 'bash';
				bash.className = 'bash';
				bash.style.fontWeight = 'initial';
				bash.innerHTML = '[&nbsp&nbsp]';			
			}
			for (var i = 0, len = unchecked.length; i < len; i++) {
				uncheck = unchecked[i];
				uncheck.removeAttribute('ignore');
				uncheck.style.opacity = 1;
			}
			messageList.bash.closePopup();
		},
		closePopup: function() {
			var div = document.getElementById('bash_popup');
			$(div).animate({'margin-top': '-100%'}, {
				queue: false,
				duration: 200
			});
			$(div).remove();
		},
		handler: function() {
			var bashes = document.getElementsByClassName('bash_this');
			var bash, tops, top, first_top, quotes, quote, username;
			var message_array = [];
			var user_array = [];
			var url;
			for (var i = 0, len = bashes.length; i < len; i++) {
				bash = bashes[i];
				// check for quoted-message elements
				quotes = bash.parentNode.parentNode.getElementsByClassName('quoted-message');
				if (quotes.length > 0) {
					// get username & post content from each quoted-message.
					// loop backwards so that oldest post is pushed first
					for (var k = quotes.length; k--;) {
						quote = quotes[k];
						tops = quote.getElementsByClassName('message-top');
						message = messageList.bash.getMessage(quote, quotes, tops, k);
						if (!message) {
							// do nothing
						}
						else {
							// push username/post with content to array
							username = messageList.bash.getUsername(quote.firstChild);
							user_array.push(username);
							message_array.push(message);
						}
					}
					// get outermost post last 
					top = bash.parentNode.parentNode.getElementsByClassName('message-top')[0];
					message_to_quote = top.nextSibling.lastChild.lastChild.firstChild;
					// pass -1 to make sure that all quoted posts are removed
					message = messageList.bash.getMessage(message_to_quote, quotes, tops, -1);
					if (!message) {
						// do nothing
					}
					else {
						username = messageList.bash.getUsername(top);
						user_array.push(username);
						message_array.push(message);	
					}
				}
				else if (quotes.length === 0) {
					top = bash.parentNode.parentNode.getElementsByClassName('message-top')[0];
					// get username and post content belonging to first message-top
					message = messageList
							.bash.getMessage(top.nextSibling.lastChild.lastChild.firstChild);
					if (!message) {
						messageList.bash.reset(bashes);
						return;
					}
					username = messageList.bash.getUsername(top);
					user_array.push(username);
					message_array.push(message);
				}
				if (i === 0) {
					first_top = bash.parentNode.parentNode.getElementsByClassName('message-top')[0];
					url = messageList.bash.getURL(first_top, len);
				}
			}
			// pass values to submitBash function
			messageList.bash.submit(url, user_array, message_array)
			// reset bash elements and close popup
			messageList.bash.reset(bashes);
		},
		getURL: function(top, len) {
			var anchors = top.getElementsByTagName('a');
			var anchor;
			var url;
			var message_detail;
			for (var k = 0, a_len = anchors.length; k < a_len; k++) {
				anchor = anchors[k];
				if (anchor.innerHTML.indexOf('Message Detail') > -1) {
					if (len === 1) {
						// return message detail href
						url = anchor.href;							
					}
					else if (len > 1) {
						// return equivalent of jump-arrow href
						message_detail = anchor.href;
						var regex = message_detail.match(/(topic=)([0-9]+)/);
						var topic_number = regex[0];
						regex = message_detail.match(/(id=)([0-9]+)/);
						var id = regex[2];
						url = 'http://' + window.location.hostname + '/showmessages.php?' + topic_number + '#m' + id;
					}
				}
			}
			return url;
		},
		getUsername: function(top) {
			// returns username from message-top
			var username = top.getElementsByTagName('a')[0].innerHTML;
			if (username == 'Filter'
			 || username == '⇗') {
				// anon user
				var topHTML = top.innerHTML;
				username = topHTML.match(/(Human\s#)([0-9]+)/)[0];
			}
			return username;
		},
		getMessage: function(quote, quotes, tops, index) {
			// takes message/quoted-message HTML and returns text
			var sig;
			if (!quotes) {
				var message = quote.innerText;
				sig = message.lastIndexOf('---');
				if (sig > -1) {
					message = message.substring(0, sig);
				}
			}
			else {
				var message = quote.innerText;
				var top, other_quote;
				for (var i = 0, len = tops.length; i < len; i++) {
					top = tops[i];
					message = message.replace(top.innerText, '');
					if (i !== index) {
						other_quote = quotes[i].innerText.replace(top.innerText, '');
						message = message.replace(other_quote, '');
					}
				}
				sig = message.lastIndexOf('---');
				if (sig > -1) {
					message = message.substring(0, sig);
				}		
			}
			message = message.replace('[quoted text omitted]', '');
			return message.trim();
		},
		submit: function (url, user_array, message_array) {
			console.log(url, user_array, message_array);
			if (user_array.length !== message_array.length) {
				console.log('Error in submitBash function');
				console.log(url, user_array, message_array);
				return;
			}
			else {
				// create formData
				var formData = new FormData();
				var content = '';
				formData.append('quotes_topic', url);
				formData.append('quotes_user', user_array[0]);
				if (user_array.length > 1) {
					// format message_array into ETI Bash format
					for (var i = 0, len = user_array.length; i < len; i++) {
						if (i > 0) {
							content += '<user>' + user_array[i] + '</user>' + '\n';					
							content += '<quote>' + '\n';
						}
						content += message_array[i] + '\n';
						content += '</quote>' + '\n';
					}
					formData.append('quotes_content', content);
				}
				else if (user_array.length === 1) {
					formData.append('quotes_content', message_array[0]);
				}
				// send formData to ETI Bash
				var xhr = new XMLHttpRequest;
				xhr.open('POST', 'http://fuckboi.club/bash/submit-quote.php', true);
				xhr.send(formData);
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
		handler: function(evt) {
			if (evt.likeButton) {
				var msgID = evt.id;
			}
			else {
				var msgID = this.id;
			}
			var nodes = document.querySelector('[msgid="' + msgID + '"]').childNodes;
			var spoiler = {};
			var quote = {};
			var output = '';
			for (var i = 0, len = nodes.length; i < len; i++) {
				// iterate over childNodes and add required data to output string				
				node = nodes[i];
				if (node.nodeType === 3) {					
					output += node.nodeValue;
				}
				else if (node.tagName) {
					if (node.tagName == 'B' || node.tagName == 'I' || node.tagName == 'U') {
						var tagName = node.tagName.toLowerCase(); 
						output += '<' + tagName + '>' + node.innerText + '</' + tagName + '>';
					}
					if (node.tagName === 'A') {
						output += node.href;
					}
				}
				else if (node.className == 'pr') {
					output += '<pre>' + node.innerHTML.replace(/<br>/g, '') + '</pre>';								
				}	
				else if (node.className == 'imgs') {
					imgNodes = node.getElementsByTagName('A');
					for (var l = 0, img_len = imgNodes.length; l < img_len; l++) {
						imgNode = imgNodes[l];
						output += '<img imgsrc="' + imgNode.getAttribute('imgsrc') + '" />' + '\n';
					}
				}				
				else if (node.className == 'spoiler_closed') {
					spoiler.caption = node.getElementsByClassName('caption')[0]
							.innerText.replace(/<|\/>/g, '');
					spoiler.nodes = node.getElementsByClassName('spoiler_on_open')[0].childNodes;
					output += messageList.quote.returnSpoiler(spoiler.caption, spoiler.nodes);
				}	
				else if (node.className == 'quoted-message') {
					var quoteOutput = '';
					quote.msgid = node.attributes.msgid.value;
					quote.nested = node.getElementsByClassName('quoted-message');
					if (quote.nested.length > 0) {
						// iterate backwards - oldest quote should be first
						for (var m = quote.nested.length; m--;) {
							var nestedQuote = quote.nested[m];					
							var quoteArray = messageList.quote.returnQuotes(nestedQuote.childNodes, 
									nestedQuote.attributes.msgid.value);
							quoteOutput = quoteArray[0] + quoteOutput + quoteArray[1];
						}
						quoteArray = messageList.quote.returnQuotes(node.childNodes, quote.msgid);
						quoteOutput = quoteArray[0] + quoteOutput + quoteArray[1];
						output += quoteOutput;
					}
					else {
						var quoteArray = messageList.quote.returnQuotes(node.childNodes, quote.msgid);					
						quoteOutput = quoteArray[0] + quoteArray[1];
						output += quoteOutput;
					}
				}
			}
			
			// remove sig from output
			if (output.indexOf('---') > -1) {
				output = '<quote msgid="' + msgID + '">' 
						+ output.substring(0, (output.lastIndexOf('---'))) + '</quote>';
			} 
			else {
				output = '<quote msgid="' + msgID + '">' + output + '</quote>';
			}
			
			if (evt.likeButton) {
				return output;			
			}	
			else {
				var json = {
					"quote": ""
				};
				json.quote = output;				
				chrome.runtime.sendMessage(json);				
				messageList.quote.notify(this);
			}
		},
		returnQuotes: function(nodes, msgid) {
			var node;
			var output = [];
			if (!msgid) {
				output[0] = '<quote>';
			} else {
				output[0] = '<quote msgid="' + msgid + '">';
			}
			output[1] = '';
			for (var i = 0, len = nodes.length; i < len; i++) {
				// iterate over childNodes of quoted message and add relevant parts to output string
				node = nodes[i];
				if (node.nodeType === 3) {
					output[1] += node.nodeValue;
				}
				else if (node.tagName) {	
					if (node.tagName == 'B' || node.tagName == 'I' || node.tagName == 'U') {
						tagName = node.tagName.toLowerCase(); 
						output[1] += '<' + tagName + '>' + node.innerText + '</' + tagName + '>';
					}
					else if (node.tagName === 'A') {
						output += node.href;
					}
				}
				else if (node.className == 'pr') {
					output[1] += '<pre>' + node.innerHTML + '</pre>';								
				}
				else if (node.className == 'imgs') {
					imgNodes = node.getElementsByTagName('A');
					for (var l = 0, img_len = imgNodes.length; l < img_len; l++) {
						imgNode = imgNodes[l];
						output[1] += '<img imgsrc="' + imgNode.getAttribute('imgsrc') + '" />' + '\n';
					}
				}
				else if (node.className == 'spoiler_closed') {
					var spoiler = {};
					spoiler.caption = node.getElementsByClassName('caption')[0]
							.innerText.replace(/<|\/>/g, '');
					spoiler.nodes = node.getElementsByClassName('spoiler_on_open')[0].childNodes;
					output[1] += messageList.quote.returnSpoiler(spoiler.caption, spoiler.nodes);
				}			
			}
			output[1] += '</quote>'
			return output;
		},
		returnSpoiler: function(caption, nodes) {
			var output = '';
			var childNode, imgNodes, imgNode;
			// iterate over childNodes (ignoring first & last elements)
			for (var k = 1, k_len = nodes.length; k < k_len - 1; k++) {
				childNode = nodes[k];
				if (childNode.nodeType === 3) {
					output += childNode.nodeValue;
				}
				else if (childNode.tagName) {
					if (childNode.tagName == 'B' || childNode.tagName == 'I' || childNode.tagName == 'U') {
						tagName = childNode.tagName.toLowerCase(); 
						output += '<' + tagName + '>' + childNode.innerText + '</' + tagName + '>';
					}
					else if (childNode.tagName === 'A') {
						output += childNode.innerText;
					}
				}
				else if (childNode.className == 'imgs') {
					imgNodes = childNode.getElementsByTagName('A');
					for (var l = 0, img_len = imgNodes.length; l < img_len; l++) {
						imgNode = imgNodes[l];
						output += '<img imgsrc="' + imgNode.getAttribute('imgsrc') + '" />' + '\n';
					}
				}
			}
			if (caption) {
				return '<spoiler caption="' + caption + '">' + output + '</spoiler>';	
			} 
			else {
				return '<spoiler>' + output + '</spoiler>';	
			}
		},
		notify: function(node) {
			var bgColor = $(node.parentNode)
				.css('background-color');
			// create hidden notification so we can use fadeIn() later
			$(node)
				.append($('<span id="copied"' 
						+ 'style="display: none; position: absolute; z-index: 1; left: 100; '
						+ 'background: ' + bgColor 
						+ ';">&nbsp<b>[copied to clipboard]</b></span>'));
			$("#copied")
				.fadeIn(200);
			setTimeout(function() {
				$(node)
					.find("span:last")
					.fadeOut(400);
			}, 1500);
			setTimeout(function() {
				$(node)
					.find("span:last")
					.remove();
			}, 2000);
		},
		addButtons: function() {
			var hostname = window.location.hostname;
			var topicId = window.location.search.replace("?topic=", "");
			var container;
			var tops = [];
			if (hostname.indexOf("archives") > -1) {
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
			$("div.message-top").on("click", "a.archivequote", messageList.quote.handler);
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
			if (width > messageList.config.img_max_width) {
				// console.log('resizing:', el);
				el.height = (el.height / (el.width / messageList.config.img_max_width));
				el.parentNode.style.height = el.height + 'px';
				el.width = messageList.config.img_max_width;
				el.parentNode.style.width = messageList.config.img_max_width + 'px';
			}
		},
		map: {
			cacheData: {},
			currentPage: 1,
			lastPage: '?',			
			init: function() {
				this.getImagemap(this.process);
			},
			getImagemap: function(callback) {
				var that = this;
				var page;
				(this.currentPage === 1)
						? page = ''
						: page = '?page=' + this.currentPage;
				var url = "http://images.endoftheinter.net/imagemap.php" + page;
				if (window.location.protocol == 'https:') {
					url = url.replace('http', 'https');
				}
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4 && xhr.status == 200) {
						var html = document.createElement('html');
						html.innerHTML = xhr.responseText;						
						callback.call(that, html);
					}
				}
				xhr.send();
			},			
			process: function(imagemap) {
				var imageGrid = this.scrape(imagemap);
				var infobar = imagemap.getElementsByClassName('infobar')[1];
				var anchors = infobar.getElementsByTagName('a');					
				this.lastPage = anchors[anchors.length - 1].innerHTML;
				this.createPopup.call(this, imageGrid);
				this.iterateOverImages(imageGrid);
			},
			scrape: function(imagemap) {
				var imageGrid = imagemap.getElementsByClassName('image_grid')[0];
				this.restore(function(cached) {
					var imgs = imageGrid.getElementsByTagName('img');
					for (var i = 0, len = imgs.length; i < len; i++) {
						var img = imgs[i];
						var src = img.src;
						if (cached.imagemap 
								&& cached.imagemap[src]) {
							// replace img src with cached base64 strings
							img.setAttribute('oldsrc', img.src);
							img.src = cached.imagemap[src].data;							
						}
					}
				});
				var blockDescs = imageGrid.getElementsByClassName('block_desc');
				var gridBlocks = imageGrid.getElementsByClassName('grid_block');
				for (var i = 0, len = blockDescs.length; i < len; i++) {
					var blockDesc = blockDescs[i];
					blockDesc.style.display = 'none';
				}
				for (var i = 0, len = gridBlocks.length; i < len; i++) {
					var gridBlock = gridBlocks[i];
					gridBlock.title = "Click here to copy image code to clipboard";
				}
				return imageGrid;
			},			
			createPopup: function(imageGrid, searchResults) {
				var that = this;
				var div = document.createElement('div');
				var width = window.innerWidth;
				var height = window.innerHeight;
				var bodyClass = document.getElementsByClassName('body')[0];
				var anchorHeight;	
				div.id = "map_div";
				div.style.position = "fixed";				
				div.style.width = (width * 0.95) + 'px';
				div.style.height = (height * 0.95) / 2 + 'px';
				div.style.left = (width - (width * 0.975)) + 'px';
				div.style.top = (height - (height * 0.975)) + 'px';
				div.style.boxShadow = "5px 5px 7px black";		
				div.style.borderRadius = '6px';	
				div.style.opacity = 1;
				div.style.backgroundColor = 'white';
				div.style.overFlow = 'scroll';
				if (searchResults) {
					var header = document.createElement('div');
					var text = document.createTextNode('Displaying results for query "' + query + '" :');
					header.appendChild(text);
					header.style.color = 'black';
					header.style.position = 'relative';
					header.style.left = '15px';
					header.style.right = '15px';
					header.style.top = '15px';
					header.style.cssFloat = 'left';
					header.style.textAlign = 'left';
					header.style.width = '100%';
					header.style.fontSize = '16px';
					div.appendChild(header);				
					// account for header's style properties
					imageGrid.style.maxHeight = ((height * 0.95) / 2) - 51 + 'px';
					imageGrid.style.maxWidth = (width * 0.95) - 21 + 'px';
				}
				else {
					// subtract 6px from each end of scroll bar to prevent it from overlapping
					// rounded corners of don't overlap rounded corners
					imageGrid.style.maxWidth = (width * 0.95) - 6 + 'px';
					imageGrid.style.maxHeight = ((height * 0.95) / 2)  - 6 + 'px';
				}
				imageGrid.style.position = 'relative';
				imageGrid.style.top = '5px';
				imageGrid.style.overflow = 'scroll';
				imageGrid.style.overflowX = 'hidden';
				bodyClass.style.opacity = 0.3;
				if (searchResults) {
					header.appendChild(imageGrid);
				}
				else {
					div.appendChild(imageGrid);
				}
				document.body.appendChild(div);
				document.body.style.overflow = 'hidden';
				bodyClass.addEventListener('mousewheel', preventScroll);
				bodyClass.addEventListener('click', this.closePopup);
				div.addEventListener('click', function(evt) {
					that.clickHandler(evt);
					evt.preventDefault();
				});
				if (!searchResults) {
					imageGrid.addEventListener('scroll', function() {
						that.scrollHandler.call(that, imageGrid);
					});
				}
			},			
			iterateOverImages: function(imageGrid) {
				var imgs = imageGrid.getElementsByTagName('img');
				for (var i = 0, len = imgs.length; i < len; i++) {
					var img = imgs[i];
					var src = img.src;			
					if (img.parentNode.className === 'img-loaded') {
						var href = img.parentNode.parentNode.href;
					}
					else {
						var href = img.parentNode.href;
					}
					this.convertToBase64(src, href, i, imgs);
				}
			},						
			convertToBase64: function(src, href, i, imgs) {
				var that = this;
				var canvas = document.createElement('CANVAS');
				var context = canvas.getContext('2d');
				var img = new Image;
				img.crossOrigin = "Anonymous";
				img.onload = function() {
					var dataURI;
					canvas.height = img.height;
					canvas.width = img.width;
					context.drawImage(img, 0, 0);
					dataURI = canvas.toDataURL();
					var imageData = 
					{
							'dataURI': dataURI, 
							'src': src, 
							'href': href, 
							'index': i
					};
					that.prepareData.call(that, imageData, imgs);
					canvas = null;
				};
				img.src = 'http://cors-for-chromell.herokuapp.com/' + src;
			},			
			prepareData: function(imageData, imgs) {
				var dataURI = imageData.dataURI;
				var href = imageData.href;
				var src = imageData.src;
				var i = imageData.index;
				// thumbnails are always jpgs - fullsize image could have 
				// a different file format (found in href)			
				var extension = href.match(/\.(gif|jpg|png)$/i)[0];
				var fullsize = src.replace('.jpg', extension);
				fullsize = fullsize.replace('dealtwith.it/i/t', 'endoftheinter.net/i/n');
				var filename = fullsize.match(/\/([^/]*)$/)[1];						
				filename = decodeURIComponent(filename);
				
				if (!filename || !fullsize || !dataURI) {
					console.log('Error while caching image: ', '\n', src, filename, fullsize, dataURI);
					return;
				}
				else {					
					this.cacheData[src] = {"filename": filename, "fullsize": fullsize, "data": dataURI};
					if (i === imgs.length - 1) {
						// convertToBase64 has finished encoding images - update cache
						this.restore(this.updateCache);
					}
				}
			},
			updateCache: function(old) {
				var dataToCache = messageList.image.map.cacheData;
				if (!old.imagemap) {
					// first time caching
					var cache = dataToCache;
				}
				else {
					// add current page to existing data
					for (var i in dataToCache) {
						old.imagemap[i] = dataToCache[i];							
					}
					var cache = old.imagemap;
				}
				chrome.storage.local.set({"imagemap": cache}, function() {
					messageList.image.map.cacheData = {};
				});
			},
			restore: function(callback) {
				chrome.storage.local.get("imagemap", function(cache) {
					if (cache === {}) {
						callback(false);
					}
					else if (cache) {
						callback(cache);
					}
				});
			},
			scrollHandler: function(imageGrid) {
				var that = this;
				// check whether user is at end of current page
				// (minus 5 pixels from clientHeight to account for large zoom levels - just in case!)
				if (imageGrid.scrollTop >= imageGrid.scrollHeight - imageGrid.clientHeight - 5) {			
					if (this.currentPage === this.lastPage) {
						// no more pages to load
						return;
					}
					else {
						// load next page and append to current grid
						this.currentPage++;
						this.getImagemap(function(imagemap) {
							var newGrid = that.scrape(imagemap);
							imageGrid.appendChild(newGrid);
							that.iterateOverImages(newGrid);
						});
					}
				}
			},
			clickHandler: function(evt) {
				// get img code & copy to clipboard via background page
				var that = this;
				var clipboard = {};				
				if (evt.target.getAttribute('searchresult')) {
					var src = evt.target.getAttribute('oldsrc'); 
				}
				else {
					if (evt.target.getAttribute('oldsrc')) {
						var src = evt.target.getAttribute('oldsrc'); 
					}
					else {
						var src = evt.target.src;
					}
					var href = evt.target.parentNode.href;					
					var regex = /\.(gif|jpg|png)$/i;
					var extension = href.match(regex);
					var extensionToReplace = src.match(regex);
					// replace thumbnail file extension with file extension of fullsize image
					src = src.replace(extensionToReplace[0], extension[0]);
				}
				// replaces thumbnail location with location of fullsize image
				clipboard.quote =  '<img src="' + src.replace('dealtwith.it/i/t', 'endoftheinter.net/i/n') + '" />';
				chrome.runtime.sendMessage(clipboard, function(response) {
					if (document.getElementById('search_results')) {
						that.search.closePopup.bind(that);
					}
					else {
						that.closePopup.bind(that);
					}
				});
			},
			closePopup: function() {
				var div = document.getElementById('map_div');
				if (!div) {
					div = document.getElementById('search_results');				
				}
				var bodyClass = document.getElementsByClassName('body')[0];
				document.body.removeChild(div);
				bodyClass.style.opacity = 1;
				document.body.style.overflow = 'initial';
				bodyClass.removeEventListener('mousewheel', preventScroll);
			},
			search: {
				init: function() {
					var that = this;
					var query = document.getElementById('image_search').value;
					// make sure that query isnt empty
					if (/\S/.test(query)) {
						this.lookup(query, function(results, query) {
							if (!document.getElementById('search_results')) {
								that.createPopup(query);
							} else {
								that.updatePopup(results, query);
							}
						});
					}
					else {
						if (document.getElementById('search_results')) {
							messageList.image.map.closePopup();
						}
					}
				},
				lookup: function(query, callback) {
					var results = [];
					messageList.image.map.restore(function(cached) {
						var cache = cached.imagemap;
						for (var i in cache) {
							var filename = cache[i].filename;
							if (filename.indexOf(query) > -1) {
								results.push(i);
							}
						}
						callback(results, query);
					});				
				},
				prepareResults: function(results, query) {
					var that = this;
					var resultsToShow = results;
					if (results.length === 0) {
						this.display(false, query);
					}
					else {
						messageList.image.map.restore(function(cached) {
							var cache = cached.imagemap;
							var data = {};
							for (var i = 0, len = results.length; i < len; i++) {
								var result = results[i];
								data[result] = cache[result];
							}
							that.display(data, query);
						});
					}
				},
				display: function(data, query) {
					if (!data) {
						this.updatePopup(data, query);
					}
					else {
						var grid = document.createElement('div');	
						grid.className = 'image_grid';
						grid.id = 'results_grid';
						grid.style.clear = 'left';		
						for (var i in data) {
							var block = document.createElement('div');
							block.className = 'grid_block';
							var img = document.createElement('img');
							img.setAttribute('oldsrc', data[i].fullsize);
							img.setAttribute('searchresult', true);
							img.src = data[i].data;
							block.className = 'grid_block';
							block.style.display = 'inline';
							block.appendChild(img);
							grid.appendChild(block);						
						}
						this.updatePopup(grid, query);
					}
				},
				createPopup: function(query) {
					var header = document.createElement('div');
					header.innerHTML = 'Displaying results for query "<span id="query">' + query + '</span>" :';					
					var div = document.createElement('div');
					var width = window.innerWidth;
					var height = window.innerHeight;
					var bodyClass = document.getElementsByClassName('body')[0];		
					div.id = "search_results";
					div.style.position = "fixed";				
					div.style.width = (width * 0.95) + 'px';
					div.style.height = (height * 0.95) / 2 + 'px';
					div.style.left = (width - (width * 0.975)) + 'px';
					div.style.top = (height - (height * 0.975)) + 'px';
					div.style.boxShadow = "5px 5px 7px black";		
					div.style.borderRadius = '6px';	
					div.style.backgroundColor = 'white';
					div.style.overFlow = 'scroll';
					header.style.color = 'black';
					header.style.position = 'relative';
					header.style.left = '15px';
					header.style.right = '15px';
					header.style.top = '15px';
					header.style.cssFloat = 'left';
					header.style.textAlign = 'left';
					header.style.width = '100%';
					header.style.fontSize = '16px';
					header.id = 'results_header';
					div.appendChild(header);
					document.body.appendChild(div);
					document.body.style.overflow = 'hidden';
					bodyClass.addEventListener('mousewheel', preventScroll);
					bodyClass.addEventListener('click', this.closePopup);
					div.addEventListener('click', function(ev) {
						messageList.image.map.clickHandler(ev);
						ev.preventDefault();
					});
				},
				updatePopup: function(results, query) {
					var popup = document.getElementById('search_results');
					var oldGrid = document.getElementById('results_grid') || document.getElementById('no_results_grid');
					var header = document.getElementById('results_header');	
					var querySpan = document.getElementById('query');
					var width = window.innerWidth;
					var height = window.innerHeight;					
					if (querySpan.innerHTML != query) {							
							querySpan.innerHTML = query;
					}
					if (!results) {					
						var textDiv = document.createElement('div');
						var text = document.createTextNode('No matches found.');
						textDiv.id = 'no_results_grid'
						textDiv.style.position = 'relative';
						textDiv.style.top = '5px';
						textDiv.appendChild(text);
						if (oldGrid) {
							if (oldGrid.id === 'no_results_grid') {
								return;
							}
							else {
								oldGrid.remove();	
								header.appendChild(textDiv);
								return;
							}
						}
						else {
							header.appendChild(textDiv);
							return;
						}
					}
					else {
						results.style.maxHeight = ((height * 0.95) / 2) - 51 + 'px';
						results.style.maxWidth = (width * 0.95) - 21 + 'px';
						results.style.position = 'relative';
						results.style.top = '5px';
						results.style.overflow = 'scroll';
						results.style.overflowX = 'hidden';
						if (oldGrid) {
							oldGrid.remove();
						}
						header.appendChild(results);
					}
				}
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
			if (msg) {
				var links = msg.getElementsByClassName("l");
			}
			else {
				var links = document.getElementsByClassName("l");
			}
			var link;
			// iterate backwards to prevent errors
			// when modifying class of elements
			var i = links.length;
			var ytRegex = /youtube|youtu.be/;
			var videoCodeRegex = /^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			while (i--) {
				link = links[i];
				if (messageList.config.embed_on_hover) {
					if (link.href.match(ytRegex)
							&& link.href.match(videoCodeRegex)) {
						link.className = "youtube";
						// give each video link a unique id for embed/hide functions
						link.id = link.href + "&" + Math.random().toString(16).slice(2);			
						// attach event listener
						$(link).hoverIntent(
							function() {
								var _this = this;
								var color = $("table.message-body tr td.message").css("background-color");
								if (_this.className == "youtube") {
									$(_this).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; " 
											+ "background: " + color 
											+ ";'><a id='" + _this.id 
											+ "' class='embed' href=#embed'>&nbsp<b>[Embed]</b></a></span>"));
								}
							}, function() {
								var _this = this;
								if (_this.className == "youtube") {
									$(_this).find("span").remove();
								}
							}
						);
					}
				}
				if (messageList.config.embed_gfycat || messageList.config.embed_gfycat_thumbs) {
					if (link.title.indexOf("gfycat.com/") > -1) {
						link.className = "gfycat";
						if (messageList.config.embed_gfycat_thumbs 
								|| link.parentNode.className == "quoted-message") {
							link.setAttribute('name', "gfycat_thumb");
						}
					}
				}
			}
			// call gfycatLoader after loop has finished
			if (messageList.config.embed_gfycat || messageList.config.embed_gfycat_thumbs) {
				messageList.gfycat.loader();
				window.addEventListener('scroll', messageList.gfycat.loader);
				document.addEventListener('visibilitychange', messageList.gfycat.pause);
			}
		},	
		fix: function(anchor, type) {
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
			var container = node.parentNode.parentNode;
			var message = node.parentNode.parentNode.getElementsByClassName('message')[0];
			var nub = document.getElementsByClassName('quickpost-nub')[0];
			var quickreply = document.getElementsByTagName('textarea')[0];
			if (document.getElementsByTagName('h2')[0].innerHTML.match('Anonymous')) {
				var username = "Human";
				var poster = "this";
			}
			else {
				var username = document.getElementsByClassName('userbar')[0]
						.getElementsByTagName('a')[0].innerHTML.replace(/ \((-?\d+)\)$/, "");
				var poster = container.getElementsByTagName('a')[0].innerHTML + "'s";
			}		
			if (templateNumber) {
				var ins = messageList.config.custom_like_data[templateNumber].contents;
				ins = ins.replace('[user]', username);
				ins = ins.replace('[poster]', poster);
			}
			else {
				var img = '<img src="http://i3.endoftheinter.net/i/n/698e5d838cd094148836a3a07168aca0/jameis thumbs up.png" />';	
				var ins = img + ' ' + username + ' likes ' + poster + ' post';
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
			var quotedMessage = messageList.quote.handler({'id': msgID, 'likeButton': true});
			quickreply.value = quotedMessage + '\n' + newtxt;
			if (document.getElementsByClassName('regular quickpost-expanded').length == 0) {
				// quickpost area is hidden - click nub element to open
				nub.click();
			}
		},
		showOptions: function() {
			if (!document.getElementById('hold_menu')) {
				var scriptData = messageList.config.custom_like_data;
				var menuElement = document.createElement('span');
				menuElement.id = 'hold_menu';	
				menuElement.setAttribute
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
		commonFunctions.asyncUpload(chosen.files, 0);
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
				|| this.scrolling == true
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
	addListeners: function() {
		document.body.addEventListener('click', this.handleEvent.mouseclick.bind(this));		
		var searchBox = document.getElementById('image_search');			
		if (searchBox) {
			searchBox.addEventListener('keyup', this.handleEvent.search.bind(this));
		}		
		if (this.config.user_info_popup) {	
			var tops = document.getElementsByClassName('message-top');
			for (var i = 0, len = tops.length; i < len; i++) {
				var top = tops[i];
				var usernameAnchor = top.getElementsByTagName('a')[0];
				usernameAnchor.className = 'username_anchor';
				if (usernameAnchor.href.indexOf('http://endoftheinter.net/profile.php?user=') > -1) {
					usernameAnchor.addEventListener('mouseenter', this.handleEvent.mouseenter.bind(this));
					usernameAnchor.addEventListener('mouseleave', this.handleEvent.mouseleave.bind(this));
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
	parseObserver: new MutationObserver(function(mutations) {
		for (var i = 0, len = mutations.length; i < len; i++) {
			var mutation = mutations[i];
			if (mutation.addedNodes.length > 0) {
				if (mutation.addedNodes[0].className == 'message-container') {
					messageList.passToFunctions(mutation.addedNodes[0]);
					messageList.links.check(mutation.addedNodes[0]);
				}
				else if (mutation.addedNodes[0].tagName
						&& mutation.addedNodes[0].tagName.match('H2')
						&& messageList.config.dramalinks
						&& !messageList.config.hide_dramalinks_topiclist
						&& !this.pm) {
					dramalinks.appendTo(mutation.addedNodes[0]);	
				}
				else if (mutation.target.className == 'infobar'
					&& mutation.addedNodes[0].textContent.match('There')) {					
					messageList.passToFunctions(mutation.target);					
				}
				else if (mutation.addedNodes[0].value == 'Upload Image') {
					messageList.passToFunctions(mutation.target);
				}
			}
		}	
	}),
	callFunctions: function(pm) {
		var msgs = document.getElementsByClassName('message-container');
		var msg, len;
		var pageFunctions = this.functions.infobar;
		var postFunctions = this.functions.messagecontainer;
		var quickpostFunctions = this.functions.quickpostbody;
		var miscFunctions = this.functions.misc;
		var config = this.config;
		for (var k in pageFunctions) {
			if (config[k + pm]) {
					pageFunctions[k]();
			}
		}
		// add archive quote buttons before highlights/post numbers are added
		this.quote.addButtons();
		// iterate over first 5 message-containers (or fewer)
		if (msgs.length < 4) {
			len = msgs.length;
		}
		else {
			len = 4;
		}
		for (var j = 0; j < len; j++) {
			msg = msgs[j];
			// iterate over functions in messageList
			for (var k in postFunctions) {
				if (config[k + pm]) {
					// pass msg and index value to function
					postFunctions[k](msg, j);
				}
			}
		}
		var element = document.getElementsByTagName('h2')[0];
		if (config.dramalinks && !config.hide_dramalinks_topiclist) {
			dramalinks.appendTo(element);
		}
		// page will appear to have been fully loaded by this point
		if (len == 4) {
			// iterate over rest of messages
			for (j = len; msg = msgs[j]; j++) {
				for (var k in postFunctions) {
					if (config[k + pm]) {
						postFunctions[k](msg, j);
					}
				}
			}		
		}
		// send ignorator data to background script
		this.globalPort.postMessage({
			action: 'ignorator_update',
			ignorator: this.ignorated,
			scope: "messageList"
		});
		for (var i in quickpostFunctions) {
			if (config[i + pm]) {
				quickpostFunctions[i]();
			}
		}
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
	},
	passToFunctions: function(element) {
		var config = this.config;
		var pm = this.pm;
		var elementName;
		if (element.className) {		
			elementName = element.className.replace('-', '');
			if (elementName == 'messagecontainer') {
				this.containersTotal++;
			}
		}
		else {
			elementName = element;
		}
		
		var functions = this.functions[elementName];
		for (var i in functions) {
			if (config[i + pm]) {
				functions[i](element, this.containersTotal);
			}
		}		
	},
	prepareIgnoratorArray: function() {
		this.ignores = this.config.ignorator_list.split(',');
		for (var r = 0, len = this.ignores.length; r < len; r++) {
			var ignore = this.ignores[r].toLowerCase().trim();
			this.ignores[r] = ignore;
		}	
	},
	addCSSRules: function() {
		var sheet = document.styleSheets[0];		
		sheet.insertRule(".like_button_custom:hover { background-color: yellow; }", 1);
	},
	// 'global' vars
	config: [],
	ignores: {},
	scrolling: false,
	topsTotal: 0,
	containersTotal: 0,
	imagemapDebouncer: '',
	menuDebouncer: '',
	ignorated: {
		total_ignored: 0,
		data: {
			users: {}
		}
	},
	pm: '',
};

chrome.runtime.sendMessage({
	need: "config",
	tcs: true
}, function(config) {
	messageList.init.call(messageList, config);
});