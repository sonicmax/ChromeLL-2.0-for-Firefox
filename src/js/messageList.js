var messageList = {
	posts: {
		// live is undefined unless these functions are called 
		// from messageList.livelinks
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
			var top, username, top_index;
			messageList.tops_total += tops.length;
			for (var j = 0, len = tops.length; j < len; j++) {
				top = tops[j];
				if (top) {
					username = top.getElementsByTagName('a')[0].innerHTML.toLowerCase();
					for (var f = 0, len = messageList.ignores.length; f < len; f++) {
						if (username == messageList.ignores[f]) {
							// calculate equivalent index of message-top for
							// show_ignorator function
							if (j == 0 && messageList.tops_total > 0) {
								top_index = messageList.tops_total - tops.length; 
							}
							else {
								top_index = messageList.tops_total - j;
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
								messageList.ignorated.data.users[messageList.ignores[f]].trs = [ top_index ];
							} else {
								messageList.ignorated.data.users[messageList.ignores[f]].total++;
								messageList.ignorated.data.users[messageList.ignores[f]].trs
										.push(top_index);
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
			notebook.innerHTML = (messageList.config.usernote_notes[tempID] != undefined && messageList.config.usernote_notes[tempID] != '') ? 'Notes*'
					: 'Notes';
			notebook.href = "##note" + tempID;
			top.appendChild(notebook);
		},
		like_button: function(msg, index) {
			if (!window.location.href.match("archives")) {		
				var top = msg.getElementsByClassName('message-top')[0];
				var anchor = document.createElement('a');
				var divider = document.createTextNode(" | ");
				anchor.setAttribute('onclick', 'like(this);');
				anchor.innerText = 'Like';
				anchor.href = '##like' + index;
				top.appendChild(divider);
				top.appendChild(anchor);
			}
		},	
		number_posts: function(msg, index) {
			var top = msg.getElementsByClassName('message-top')[0];
			var page, id, postnum;
			if (!window.location.href.match(/page=/)) {
				page = 1;
			} else {
				page = window.location.href.match(/page=(\d+)/)[1];
			}
			id = ((index + 1) + (50 * (page - 1)));
			if (id < 1000)
				id = "0" + id;
			if (id < 100)
				id = "0" + id;
			if (id < 10)
				id = "0" + id;
			postnum = document.createTextNode(' | #' + id);
			top.appendChild(postnum);
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
			var top, anchors, anchor;
			var user;	
			if (!messageList.config.no_user_highlight_quotes) {
				try {
					for (var k = 0; k < tops.length; k++) {
						top = tops[k];			
							user = top.getElementsByTagName('a')[0].innerHTML
									.toLowerCase();
						if (messageList.config.user_highlight_data[user]) {
							if (messageList.config.debug) {
								console.log('highlighting post by ' + user);
							}
							top.style.background = '#'
									+ messageList.config.user_highlight_data[user].bg;
							top.style.color = '#'
									+ messageList.config.user_highlight_data[user].color;
							anchors = top.getElementsByTagName('a');
							for (var j = 0, len = anchors.length; j < len; j++) {
								anchor = anchors[j];
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
									need : "notify",
									message : document.title.replace(
											/End of the Internet - /i,
											''),
									title : "Post by "
											+ msg
													.getElementsByClassName('message-top')[0]
													.getElementsByTagName('a')[0].innerHTML
								}, function(data) {
									console.log(data);
								});
							}
						}
					}
				} catch (e) {
					// if (messageList.config.debug) console.log(e);
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
							need : "notify",
							message : document.title.replace(
									/End of the Internet - /i, ''),
							title : "Post by "
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
		hide_deleted: function(msg) {
			if (msg.getElementsByClassName('message-top')[0]
					.getElementsByTagName('em')[0]
					&& msg.getElementsByClassName('message-top')[0]
							.getElementsByTagName('em')[0].innerHTML !== 'Moderator') {
				msg.getElementsByClassName('message-body')[0].style.display = 'none';
				var a = document.createElement('a');
				a.href = 'javascript.void(0)';
				a.innerHTML = 'Show Message';
				a.addEventListener('click', function(evt) {
					var hiddenMsg = evt.target.parentNode.parentNode
							.getElementsByClassName('message-body')[0];
					console.log(evt.target);
					hiddenMsg.style.display === 'none' ? hiddenMsg.style.display = 'block'
							: hiddenMsg.style.display = 'none';
				});
				msg.getElementsByClassName('message-top')[0].innerHTML += ' | ';
				msg.getElementsByClassName('message-top')[0].insertBefore(
						a, null);
			}
		},
		click_expand_thumbnail: function(container) {
			// rewritten by xdrvonscottx
			// find all the placeholders before the images are loaded
			var msg = container.getElementsByClassName('message')[0];
			var pholds = msg.getElementsByClassName('img-placeholder');
			var phold;
			for (var i = 0, len = pholds.length; i < len; i++) {
				phold = pholds[i];
				messageList.imgObserver.observe(phold, {
					attributes : true,
					childList: true
				});
			}
		},	
		autoscroll: function(mutation, index, live) {
			if (live) {
				if (document.hidden 
						&& messageList.autoscrollCheck(mutation) ) {
					// autoscrollCheck returns true if user has scrolled to bottom of page
					$.scrollTo(mutation);
				}
			}
		},
		autoscroll_active: function(mutation, index, live) {
			if (live) {
				if (!document.hidden 
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
						need : "notify",
						title : "Quoted by "
								+ mutation.getElementsByClassName('message-top')[0]
										.getElementsByTagName('a')[0].innerHTML,
						message : document.title.replace(/End of the Internet - /i, '')
					}, function(data) {
						console.log(data);
					});
				}
			}	
		}
	},
	page: {
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
		filter_me: function() {
			var infobar = document.getElementsByClassName('infobar')[0];
			var tops = document.getElementsByClassName('message-top');
			// handle anonymous topic
			if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
				// anonymous topic - check quickpost-body for human number
				if (window.location.hostname == 'archives.endoftheinter.net') {
					// archived anon topics don't have quickpost-body element
					return;
				}
				if (document.getElementsByClassName('quickpost-body')) {
					var human = document.getElementsByClassName('quickpost-body')[0]
						.getElementsByTagName('a')[0].innerText.replace('Human #', '');
					if (isNaN(human)) {
						// user hasn't posted in topic
						return;
					}
					var me = '&u=-' + human;
				}
			}
			else {
				// handle non anonymous topics
				if (messageList.config.user_id) {
					// use cached user id
					var me = '&u=' + messageList.config.user_id;
				} else {
					// fallback
					var me = '&u=' + document.getElementsByClassName('userbar')[0]
						.getElementsByTagName('a')[0].href
						.match(/\?user=([0-9]+)/)[1];
				}
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
		},
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
			var color, tc, span, b, text, divider;
			if (messageList.config.tc_label_color && messageList.config.tc_label_color != '') {
				color = true;
			}
			for (var i = 0, len = tcs.length; i < len; i++) {
				tc = tcs[i];
				span = document.createElement('span');
				b = document.createElement('b');
				text = document.createTextNode('TC');
				divider = document.createTextNode(' | ');
				b.appendChild(text);
				if (color) {
					b.style.color = '#' + messageList.config.tc_label_color;
				}
				span.appendChild(divider);
				span.appendChild(b);			
				username = tc.getElementsByTagName('a')[0];
				username.outerHTML += span.innerHTML;
			}
		}
	},
	misc: {
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
		post_title_notification: function() {
			document.addEventListener('visibilitychange', messageList.clearUnreadPosts);
			document.addEventListener('scroll', messageList.clearUnreadPosts);
			document.addEventListener('mousemove', messageList.clearUnreadPosts);
		},
		quickpost_on_pgbottom: function() {
			chrome.runtime.sendMessage({
				need : "insertcss",
				file : "src/css/quickpost_on_pgbottom.css"
			});
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
		load_next_page: function() {
			document.getElementById('u0_3').addEventListener('dblclick',
					messageList.loadNextPage);
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
	gfycat: {
		loader: function() {
			var gfycats = document.getElementsByClassName('gfycat');
			var gfycat, position, height;
			height = window.innerHeight;
			for (var i = 0, len = gfycats.length; i < len; i++) {
				gfycat = gfycats[i];			
				position = gfycat.getBoundingClientRect();
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
		getAPIData: function (url, callback) {
			var splitURL = url.split('/').slice(-1);
			var code = splitURL.join('/');
			var xhrURL = 'http://gfycat.com/cajax/get/' + code;
			var https;
			if (window.location.protocol == 'https:') {
				https = true;
				xhrURL = xhrURL.replace('http', 'https');
			}
			var xhr = new XMLHttpRequest();
			var apiData = {};
			var width, height, webm;
			var response;
			xhr.open("GET", xhrURL, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					// gfycat api provides width, height, & webm url
					response = JSON.parse(xhr.responseText);
					if (!response.gfyItem) {
						callback("error");
					}
					width = response.gfyItem.width;
					height = response.gfyItem.height;
					if (messageList.config.resize_gfys 
							&& width > messageList.config.gfy_max_width) {
						// scale video size to match gfy_max_width value
						height = (height / (width / messageList.config.gfy_max_width));
						width = messageList.config.gfy_max_width;
					}					
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
			}
			xhr.send();
		},
		placeholder: function(gfyLink) {
			var placeholder, url, position;
			url = gfyLink.getAttribute('href');
			this.getAPIData(url, function(data) {
				if (data === "error") {
					// revert class name to stop loader from detecting link
					gfyLink.className = 'l';
					return;
				}
				// create placeholder
				placeholder = document.createElement('div');
				placeholder.className = 'gfycat';
				placeholder.id = data.webm;
				placeholder.setAttribute('name', 'placeholder');
				placeholder.innerHTML = '<video width="' + data.width + '" height="' + data.height + '" loop >'
						+ '</video>'
						+ '<span style="display:none">' + url + '</span>';
				// prevent "Cannot read property 'replaceChild' of null" error
				if (gfyLink.parentNode) {
					gfyLink.parentNode.replaceChild(placeholder, gfyLink);
					// check if placeholder is visible (some placeholders will be off screen)
					position = placeholder.getBoundingClientRect();
					if (position.top > window.innerHeight) {
						return;
					} else {
						// pass placeholder video element to embed function
						messageList.gfycat.embed(placeholder);
					}
				}
			});
		},
		thumbnail: function(gfyLink) {
			var placeholder, url, splitURL, code, thumbnail;
			url = gfyLink.getAttribute('href');
			splitURL = url.split('/').slice(-1);
			code = splitURL.join('/');
			thumbnail = 'http://thumbs.gfycat.com/' + code + '-poster.jpg';
			this.getAPIData(url, function(data) {
				if (data === "error") {
					// revert class name to stop loader from detecting link
					gfyLink.className = 'l';
					return;
				}
				placeholder = document.createElement('div');
				placeholder.className = 'gfycat';
				placeholder.id = data.webm;
				placeholder.innerHTML = '<img src="' + thumbnail 
						+ '" width="' + data.width + '" height="' + data.height + '">'
						+ '</img>'
						+ '<span style="display:none">' + url + '</span>';
				if (gfyLink.parentNode) {
					gfyLink.parentNode.replaceChild(placeholder, gfyLink);
					// add click listener to replace img with video
					img = placeholder.getElementsByTagName('img')[0];
					img.title = "Click to play";
					img.addEventListener('click', function(ev) {
						ev.preventDefault();
						placeholder.innerHTML = '<video width="' + data.width 
								+ '" height="' + data.height 
								+ '" loop >'
								+ '</video>'
								+ '<span style="display:none">' + url + '</span>';
						video = placeholder.getElementsByTagName('video')[0];
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
			});
		},
		embed: function(placeholder) {
			var video = placeholder.getElementsByTagName('video')[0];
			placeholder.setAttribute('name', 'embedded');
			// placeholder id is webm url
			video.src = placeholder.id;
			video.play();
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
									+ "<a id='" + anchor.id + "' class='hide' href='javascript:void(0)'>&nbsp<b>[Hide]</b></a></span>" 
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
					// manually move caret to end of pasted snippet
					// as replacing message.value moves caret to end of input
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
					messageLists.bash.reset(bashes);
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
					message = messageLists.bash.getMessage(message_to_quote, quotes, tops, -1);
					if (!message) {
						// do nothing
					}
					else {
						username = messageLists.bash.getUsername(top);
						user_array.push(username);
						message_array.push(message);	
					}
				}
				else if (quotes.length === 0) {
					top = bash.parentNode.parentNode.getElementsByClassName('message-top')[0];
					// get username and post content belonging to first message-top
					message = messageLists
							.bash.getMessage(top.nextSibling.lastChild.lastChild.firstChild);
					if (!message) {
						messageLists.bash.reset(bashes);
						return;
					}
					username = messageLists.bash.getUsername(top);
					user_array.push(username);
					message_array.push(message);
				}
				if (i === 0) {
					first_top = bash.parentNode.parentNode.getElementsByClassName('message-top')[0];
					url = messageLists.bash.getURL(first_top, len);
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
			if (el.id == 'notebook') {
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
					page.value = (note == undefined) ? "" : note;
					page.style.width = "100%";
					page.style.opacity = '.6';
					el.parentNode.appendChild(page);
				}
			}
		},
		save: function() {
			chrome.runtime.sendMessage({
				need : "save",
				name : "usernote_notes",
				data : messageList.config.usernote_notes
			}, function(rsp) {
				console.log(rsp);
			});
		}
	},
	archiveQuote: {
		handler: function() {
			var _this = this;
			// get childNodes from quoted message
			var nodes = document.querySelector('[msgid="' + _this.id + '"]').childNodes;
			var spoiler = {};
			var quote = {};
			var output = ''; 
			var tagName, nestedQuote, quoteArray, quoteOutput;
			for (var i = 0, len = nodes.length; i < len; i++) {
				// iterate over childNodes and add relevant parts to output string
				node = nodes[i];
				if (node.nodeType === 3) {
					output += node.nodeValue;
				}
				if (node.tagName) {
					if (node.tagName == 'B' || node.tagName == 'I' || node.tagName == 'U') {
						tagName = node.tagName.toLowerCase(); 
						output += '<' + tagName + '>' + node.innerText + '</' + tagName + '>';
					}
					if (node.tagName === 'A') {
						output += node.href;
					}
				}
				if (node.className == 'pr') {
					output += '<pre>' + node.innerHTML.replace(/<br>/g, '') + '</pre>';								
				}	
				if (node.className == 'imgs') {
					imgNodes = node.getElementsByTagName('A');
					for (var l = 0, img_len = imgNodes.length; l < img_len; l++) {
						imgNode = imgNodes[l];
						output += '<img imgsrc="' + imgNode.getAttribute('imgsrc') + '" />' + '\n';
					}
				}				
				if (node.className == 'spoiler_closed') {
					spoiler.caption = node.getElementsByClassName('caption')[0]
							.innerText.replace(/<|\/>/g, '');
					spoiler.nodes = node.getElementsByClassName('spoiler_on_open')[0].childNodes;
					output += messageLists.archiveQuote.returnSpoiler(spoiler.caption, spoiler.nodes);
				}	
				if (node.className == 'quoted-message') {
					quoteOutput = '';
					quote.msgid = node.attributes.msgid.value;
					quote.nested = node.getElementsByClassName('quoted-message');
					if (quote.nested.length > 0) {
						// iterate over nested quotes in reverse order
						for (var m = quote.nested.length; m--;) {
							nestedQuote = quote.nested[m];					
							quoteArray = messageList.archiveQuote.returnQuotes(nestedQuote.childNodes, 
									nestedQuote.attributes.msgid.value);
							quoteOutput = quoteArray[0] + quoteOutput + quoteArray[1];
						}
						quoteArray = messageList.archiveQuote.returnQuotes(node.childNodes, quote.msgid);
						quoteOutput = quoteArray[0] + quoteOutput + quoteArray[1];
						output += quoteOutput;
					}
					else {
						quoteArray = messageList.archiveQuote.returnQuotes(node.childNodes, quote.msgid);					
						quoteOutput = quoteArray[0] + quoteArray[1];
						output += quoteOutput;
					}
				}
			}
			// remove sig from output
			if (output.indexOf('---') > -1) {
				output = '<quote msgid="' + _this.id + '">' + output.substring(0, (output.lastIndexOf('---'))) + '</quote>';
			} else {
				output = '<quote msgid="' + _this.id + '">' + output + '</quote>';
			}
			var json = {
				"quote": ""
			};
			json.quote = output;
			// copy quote to clipboard via background page
			chrome.runtime.sendMessage(json, function(response) {
				if (messageList.config.debug) console.log(response.clipboard);
			});
			// alert user
			messageList.quotes.notify(_this);
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
				if (node.tagName) {	
					if (node.tagName == 'B' || node.tagName == 'I' || node.tagName == 'U') {
						tagName = node.tagName.toLowerCase(); 
						output[1] += '<' + tagName + '>' + node.innerText + '</' + tagName + '>';
					}
					if (node.tagName === 'A') {
						output += node.href;
					}
				}
				if (node.className == 'pr') {
					output[1] += '<pre>' + node.innerHTML + '</pre>';								
				}
				if (node.className == 'imgs') {
					imgNodes = node.getElementsByTagName('A');
					for (var l = 0, img_len = imgNodes.length; l < img_len; l++) {
						imgNode = imgNodes[l];
						output[1] += '<img imgsrc="' + imgNode.getAttribute('imgsrc') + '" />' + '\n';
					}
				}
				if (node.className == 'spoiler_closed') {
					var spoiler = {};
					spoiler.caption = node.getElementsByClassName('caption')[0]
							.innerText.replace(/<|\/>/g, '');
					spoiler.nodes = node.getElementsByClassName('spoiler_on_open')[0].childNodes;
					output[1] += messageList.archiveQuote.returnSpoiler(spoiler.caption, spoiler.nodes);
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
				if (childNode.tagName) {
					if (childNode.tagName == 'B' || childNode.tagName == 'I' || childNode.tagName == 'U') {
						tagName = childNode.tagName.toLowerCase(); 
						output += '<' + tagName + '>' + childNode.innerText + '</' + tagName + '>';
					}
					if (childNode.tagName === 'A') {
						output += childNode.innerText;
					}
				}
				if (childNode.className == 'imgs') {
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
		notify: function(_this) {
			var bgColor = $(_this.parentNode)
				.css('background-color');
			// create hidden notification so we can use fadeIn() later
			$(_this)
				.append($('<span id="copied"' 
						+ 'style="display: none; position: absolute; z-index: 1; left: 100; '
						+ 'background: ' + bgColor 
						+ ';">&nbsp<b>[copied to clipboard]</b></span>'));
			$("#copied")
				.fadeIn(200);
			setTimeout(function() {
				$(_this)
					.find("span:last")
					.fadeOut(400);
			}, 1500);
			setTimeout(function() {
				$(_this)
					.find("span:last")
					.remove();
			}, 2000);
		},
		addButtons: function() {
			var hostname = window.location.hostname;
			var topicId = window.location.search.replace("?topic=", "");
			var links;
			var msgs;
			var containers;
			var container;
			var tops = [];
			var msgID;
			var quote;
			if (hostname.indexOf("archives") > -1) {
				links = document.getElementsByTagName("a");
				msgs = document.getElementsByClassName("message");
				containers = document.getElementsByClassName("message-container");
				for (var i = 0, len = containers.length; i < len; i++) {
					container = containers[i];
					tops[i] = container.getElementsByClassName("message-top")[0];
					msgID = msgs[i].getAttribute("msgid");
					quote = document.createElement("a");
					quoteText = document.createTextNode("Quote");
					space = document.createTextNode(" | ");
					quote.appendChild(quoteText);
					quote.href = "#";
					quote.id = msgID;
					quote.className = "archivequote";
					tops[i].appendChild(space);
					tops[i].appendChild(quote);
				}
			}
			$("div.message-top").on("click", "a.archivequote", messageList.archiveQuote.handler);
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
				if (messageList.config.debug) {
					console.log('resizing:', el);
				}
				el.height = (el.height / (el.width / messageList.config.img_max_width));
				el.parentNode.style.height = el.height + 'px';
				el.width = messageList.config.img_max_width;
				el.parentNode.style.width = messageList.config.img_max_width + 'px';
			}
		}
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
					.replace('closed', 'opened') : obj.className.replace('opened',
					'closed');
			return false;
		},	
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
											+ "' class='embed' href='javascript:void(0)'>&nbsp<b>[Embed]</b></a></span>"));
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
			var tcs = Array();
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
				need : "save",
				name : "tcs",
				data : messageList.config.tcs
			});
		}	
	},
	imgObserver: new MutationObserver(function(mutations) {
		var mutation;
			for (var i = 0, len = mutations.length; i < len; i++) {
				mutation = mutations[i];
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
						if(messageList.config.debug) console.log("found thumbnail");
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
	}),
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
			for ( var i in messageList.config.post_template_data) {
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
			d.text = messageList.config.post_template_data[evt.parentNode.className].text;
			cdiv.innerText = JSON.stringify(d);
			cdiv.dispatchEvent(messageList.postEvent);
		}
	},
	clearUnreadPosts: function(evt) {
		if (!document.title.match(/\(\d+\+?\)/)
				|| messageList.scrolling == true
				|| document.hidden) {
			// do nothing
			return;
		}
		if (document.title.match(/\(\d+\+?\)/)) {
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
	ignores: {},
	scrolling: false,
	tops_total: 0,
	config: [],
	ignorated: {
		total_ignored : 0,
		data : {
			users : {}
		}
	},
	addListeners: function() {
		var body = document.body;
		body.addEventListener('click', function(ev) {
			if (messageList.config.user_notes) {
				messageList.usernotes.open(ev.target);
			}
			if (messageList.config.post_templates) {
				messageList.postTemplateAction(ev.target);
			}
			if (ev.target.title.indexOf("/index.php") == 0) {
				// TODO - this should point to links.fix
				messageList.links.fix(ev.target, "wiki");
				ev.preventDefault();
			}
			else if (ev.target.title.indexOf("/imap/") == 0) {
				// TODO - this should point to links.fix
				messageList.links.fix(ev.target, "imagemap");					
				ev.preventDefault();
			}
			else if (ev.target.className == 'youtube'
					&& ev.target.tagName == 'DIV') {
				// prevent youtube divs from acting as anchor tags
				ev.preventDefault();
			}
			else if (ev.target.className == 'bash' && ev.target.getAttribute('ignore') !== 'true') {
				ev.target.className = 'bash_this';			
				ev.target.style.fontWeight = 'bold';
				ev.target.innerHTML = '&#9745;';
				messageList.bash.checkSelection(ev.target);
				messageList.bash.showPopup();		
			}
			else if (ev.target.className == 'bash_this') {
				ev.target.className = 'bash';
				ev.target.style.fontWeight = 'initial';
				ev.target.innerHTML = '&#9744;';
				messageList.bash.checkSelection(ev.target);
			}
			else if (ev.target.parentNode) {
				if (ev.target.parentNode.className == 'embed') {
					messageList.youtube.embed(ev.target.parentNode);
				}
				else if (ev.target.parentNode.className == 'hide') {
					messageList.youtube.hide(ev.target.parentNode);			
				}
				else if (ev.target.parentNode.id == 'submitbash') {
					messageList.bash.handler();
				}
			}			
		});
	},
	appendScripts: function() {
		var head = document.getElementsByTagName("head")[0];
		if (messageList.config.like_button) {
			var like = document.createElement("script");
			like.type = "text/javascript";
			like.src = chrome.extension.getURL("src/js/like.js");
			head.appendChild(like);
		}
		if (messageList.config.post_templates) {
			var templates = document.createElement('script');
			templates.type = 'text/javascript';
			templates.src = chrome.extension.getURL('src/js/topicPostTemplate.js');
			head.appendChild(templates);
		}
	},	
	callFunctions: function(pm) {
		var t0 = performance.now();
		// iterate over objects & call function if messageList.config value is true
		var msgs = document.getElementsByClassName('message-container');
		var msg, len;
		// cache objects
		var pageFunctions = this.page;
		var postFunctions = this.posts;
		var miscFunctions = this.misc;
		for (var k in pageFunctions) {
			if (messageList.config[k + pm]) {
					pageFunctions[k]();
			}
		}
		// add archive quote buttons before highlights/post numbers are added
		messageList.archiveQuote.addButtons();
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
				if (messageList.config[k + pm]) {
					// pass msg and index value to function
					postFunctions[k](msg, j);
				}
			}
		}
		// page will appear to have been fully loaded by this point
		if (len == 4) {
			// iterate over rest of messages
			for (j = len; msg = msgs[j]; j++) {
				for (var k in postFunctions) {
					if (messageList.config[k + pm]) {
						postFunctions[k](msg, j);
					}
				}
			}		
		}
		// send ignorator data to background script
		messageList.globalPort.postMessage({
			action : 'ignorator_update',
			ignorator : messageList.ignorated,
			scope : "messageList"
		});
		// call functions that dont modify DOM
		for (var i in miscFunctions) {
			if (messageList.config[i + pm]) {
				miscFunctions[i]();
			}
		}
		var t1 = performance.now();
		console.log("Processed in " + (t1 - t0) + " milliseconds.");
		// call functions that dont exist in posts/page/misc objects
		messageList.links.check();
		messageList.addListeners();
		messageList.appendScripts();
		if (messageList.config.new_page_notify) {
			if (messageList.config.debug) {
				console.log('listening for new page');
			}
			// set up observer to watch for mutations to 'nextpage' element
			var target = document.getElementById('nextpage');
			var mutation;
			var observer = new MutationObserver(function(mutations) {
				for (var i = 0, mutation; mutation = mutations[i]; i++) {
					if (mutation.type === 'attributes' && target.style.display === 'block') {
						chrome.runtime.sendMessage({
							need: "notify",
							title: "New Page Created",
							message: document.title
						});
					}
				}
			});
			var obsconfig = {
				attributes: true
			};
			observer.observe(target, obsconfig);
		}	
		// set up observer to watch for new livelinks posts
		var livelinks = new MutationObserver(function(mutations) {
			var mutation;
			for (var i = 0, len = mutations.length; i < len; i++) {
				mutation = mutations[i];
				if (!mutation.target.lastChild 
						|| !mutation.target.lastChild.firstChild 
						|| !mutation.target.lastChild.firstChild.className) {
					return;
				}
				if (mutation.target.lastChild.firstChild.getAttribute('class') == 'message-container') {
					// send new message container to livelinks method
					messageList.livelinks(mutation.target.lastChild.firstChild);
				}
			}
		});
		livelinks.observe(document.getElementById('u0_1'), {
				subtree: true,
				childList: true
		});				
	},	
	livelinks: function(mutation) {
		var index = document.getElementsByClassName('message-container').length - 1;
		var live = true;
		var pm = '';
		if (window.location.href.match('inboxthread')) {
			pm = "_pm";
		}
		for (var i in messageList.posts) {
			if (messageList.config[i + pm]) {
					messageList.posts[i](mutation, index, live);
			}
		}
		messageList.links.check(mutation);
		// send ignorator data to background script
		messageList.globalPort.postMessage({
			action : 'ignorator_update',
			ignorator : messageList.ignorated,
			scope : "messageList"
		});
	},	
	init: function() {
		// handle background script message passing (etc) before DOM is ready
		chrome.runtime.sendMessage({
			need : "config",
			tcs : true
		}, function(conf) {
			// set up globalPort so we can communicate with background script
			messageList.globalPort = chrome.runtime.connect();
			messageList.config = conf.data;
			messageList.config.tcs = conf.tcs;
			// turn ignorator list into array before running messageList functions
			messageList.ignores = messageList.config.ignorator_list.split(',');
			var ignore;
			for (var r = 0, len = messageList.ignores.length; r < len; r++) {
				ignore = messageList.ignores[r].toLowerCase().trim();
				messageList.ignores[r] = ignore;
			}
			var pm = '';
			if (window.location.href.match('inboxthread')) {
				pm = "_pm";
			}
			// add listener to handle showIgnorated request from popup menu
			messageList.globalPort.onMessage.addListener(function(msg) {
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
			});
			if (document.readyState == 'loading') {
				// wait for DOMContentLoaded to fire before calling messageList functions
				document.addEventListener('DOMContentLoaded', function() {
					messageList.callFunctions(pm);
				});
			}
			else {
				messageList.callFunctions(pm);
			}
		});
	}
}

messageList.init();