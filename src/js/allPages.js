(function(CHROMELL) {
	
	CHROMELL.allPages = function () {
		
		var _cachedEvent = '';
		
		var init = function() {
			chrome.runtime.onMessage.addListener(messageHandler);
			CHROMELL.whenDOMReady(DOM.init);
		};
		
		var messageHandler = function(msg) {
			if (msg.action == 'showOptions') {
				utils.optionsMenu.show();
			}
			else if (msg.action == "config_push") {
				// Config has changed from options page - make sure that content scripts are using latest version
				CHROMELL.config = JSON.parse(localStorage['ChromeLL-Config']);
			}
		};
		
		var DOM = function() {
			
			var init = function() {
				
				generateCss();
				
				if (CHROMELL.config.short_title) {
					document.title = document.title.replace(/End of the Internet - /i, '');
				}			
				
				var errorCheck = function() {
					// Check for unhandled exceptions and display dialog with link to message history (useful
					// when there's a problem with the topic list, but messages/topics can still be visited).
					// 502 errors also break message history, so there's no reason to check for them.
					var bgImage = document.body.style.backgroundImage;
					if (bgImage.indexOf('errorlinks.png') > -1) {
						var dialog = document.createElement('dialog');
						var redirect = document.createElement('button');
						var close = document.createElement('button');
						var imageURL;
						document.body.style.overflow = "hidden";
						// Dialog style handled by CSS
						dialog.id = 'error_dialog';
						imageURL = chrome.extension.getURL('/src/images/popup.png');
						dialog.style.backgroundImage = "url('" + imageURL + "')";
						dialog.innerHTML = 'Error detected... redirect to history.php?' + '<br>' 
								+ '(popup generated by ChromeLL)' + '<br>' + '<br>';
						redirect.innerText = 'Redirect'
						redirect.addEventListener('click', function() {
							if (window.location.protocol == 'https:') {
								window.location.href = 'https://boards.endoftheinter.net/history.php?b';
							} else {
								window.location.href = 'http://boards.endoftheinter.net/history.php?b';
							}
						});			
						close.innerText = 'Close';
						close.addEventListener('click', function() {
							dialog.close();
						});
						dialog.appendChild(redirect);
						dialog.appendChild(close);
						document.body.appendChild(dialog);
						dialog.showModal();							
						return;
					}						
				
				}();
				
				for (var i in methods) {
					if (CHROMELL.config[i]) {
						methods[i]();
					}
				}
				
			};
		
			var generateCss = function() {
				var styleSheet = document.styleSheets[0];
				if (window.location.href.match(/\/topics\/|showmessages.php|history.php/)) {
					var customColors = getCustomColors();
					// Dynamically create rules for user info popup using ETI colour scheme (to make sure that content is readable)
					styleSheet.addRule('#user-popup-div',  'color: ' + customColors.text);			
					styleSheet.addRule('#user-popup-div',  'background: ' + customColors.message);
					styleSheet.addRule('#user-popup-div',  'border-color: ' + customColors.body);		
					styleSheet.addRule('.popup_link', 'color: ' + customColors.anchor);
					styleSheet.addRule('.popup_link', 'background: ' + customColors.userbar);	
					styleSheet.addRule('#username, #popup_uid, #namechange, #online, #punish, #popup_loading, #rep', 'color: ' + customColors.text);
					// #user-popup-div:before should be same colour as #user-popup-div background
					styleSheet.addRule('#user-popup-div:before', 'border-bottom-color: ' + customColors.body);	
					// #user-popup-div:after should be same colour as #user-popup-div border
					styleSheet.addRule('#user-popup-div:after', 'border-bottom-color: ' +   customColors.infobar);
				}
			};		
			
			var getCustomColors = function() {
				// First 'h1' element is either tag name (in topic list), or topic title (in message list)
				var header = document.getElementsByTagName('h1')[0];
				var anchor = document.getElementsByTagName('a')[0];
				var userbar = document.getElementsByClassName('userbar')[0];
				var infobar = document.getElementsByClassName('infobar')[0];
				var message = document.getElementsByClassName('message')[0] || document.getElementsByTagName('th')[0];			

				var customColors = {};
				customColors.text = window.getComputedStyle(header).getPropertyValue('color');			
				customColors.anchor = window.getComputedStyle(anchor).getPropertyValue('color');				
				customColors.body = window.getComputedStyle(document.body).getPropertyValue('background-color');
				customColors.message = window.getComputedStyle(message).getPropertyValue('background-color');
				customColors.userbar = window.getComputedStyle(userbar).getPropertyValue('background-color');
				customColors.infobar = window.getComputedStyle(infobar).getPropertyValue('background-color');
				
				return customColors;
			};
		
			var methods = {};
			
			/*methods.userscripts: function() {
				// var location = window.location;
				var head = document.getElementsByTagName('head')[0];
				var data = CHROMELL.config.userscript_data;
				for (var script in data) {
					var scriptElement = document.createElement('script');
					var contents = data[script].contents;
					scriptElement.type = 'text/javascript';
					scriptElement.innerHTML = contents;
					head.appendChild(scriptElement);
				}
			};*/
			
			methods.notify_pm = function() {
				var userbar_pms = document.getElementById('userbar_pms');
				if (!userbar_pms) {
					return;
				}
				var observer = new MutationObserver(function() {
					// we can assume that all mutations on 
					// userbar_pms element are relevant
					if (userbar_pms.style.display == 'none' && config.pms != 0) {
						// clear unread message count from config
						config.pms = 0;
						chrome.runtime.sendMessage({
								need : "save",
								name : "pms",
								data : config.pms
						});
					}
					else if (userbar_pms.style.display != 'none') {
						var pms_text = userbar_pms.innerText;
						var pm_number = parseInt(pms_text.match(/\((\d+)\)/)[1]);
						var notify_title, notify_msg;
						// compare pm_number to last known value for pm_number
						if (pm_number > config.pms) {
							// you have mail
							if (pm_number == 1) {
								notify_title = 'New PM';
								notify_msg = 'You have 1 unread private message.';
							}
							else {
								notify_title = 'New PMs';
								notify_msg = 'You have ' + pm_number 
										+ ' unread private messages.';
							}
							// notify user and save current pm_number
							chrome.runtime.sendMessage({
									need: "notify",
									title: notify_title,
									message: notify_msg
							}, function(data) {
								console.log(data);
							});
							config.pms = pm_number;
							chrome.runtime.sendMessage({
									need : "save",
									name : "pms",
									data : config.pms
							});	
						}
						else {
							// user has unread PMs, but no new PMs
							return;
						}
					}
				});
				observer.observe(userbar_pms, {
						attributes: true,
						childList: true
				});		
			};
			
			methods.history_menubar = function() {
				var link = document.createElement('a');
				link.innerHTML = 'Message History';
				if (config.history_menubar_classic)
					link.href = '//boards.endoftheinter.net/history.php';
				else
					link.href = '//boards.endoftheinter.net/topics/Posted';
				if (document.body.className === 'regular') {
					var sep = document.createElement('span');
					var menubar = document.getElementsByClassName('menubar')[0];
					sep.innerHTML = ' | ';
					menubar.insertBefore(link, menubar.getElementsByTagName('br')[0]);
					menubar.insertBefore(sep, link);
				} else if (document.body.className === 'classic') {
					var br = document.createElement('br');
					document.getElementsByClassName('classic3')[0].insertBefore(link,
							null);
					document.getElementsByClassName('classic3')[0].insertBefore(br,
							link);
				}
			};
			
			methods.float_userbar = function() {
				var id = document.createElement('div');
				var userbar = document.getElementsByClassName('userbar')[0];
				var menubar = document.getElementsByClassName('menubar')[0];
				document.getElementsByClassName('body')[0].removeChild(userbar);
				document.getElementsByClassName('body')[0].removeChild(menubar);
				id.insertBefore(menubar, null);
				id.insertBefore(userbar, null);
				id.style.position = 'fixed';
				id.style.width = '100%';
				id.style.top = '0';
				userbar.style.marginTop = '-2px';
				userbar.style.borderBottomLeftRadius = '5px';
				userbar.style.borderBottomRightRadius = '5px';
				config.remove_links ? document.getElementsByTagName('h1')[0].style.paddingTop = '20px'
						: document.getElementsByTagName('h1')[0].style.paddingTop = '40px';
				document.getElementsByClassName('body')[0].insertBefore(id, null);
			};
			
			methods.float_userbar_bottom = function() {
				var menubar = document.getElementsByClassName('menubar')[0];
				var userbar = document.getElementsByClassName('userbar')[0];
				menubar.style.position = "fixed";
				menubar.style.width = "99%";
				menubar.style.bottom = "-2px";
				userbar.style.position = "fixed";
				userbar.style.borderTopLeftRadius = '5px';
				userbar.style.borderTopRightRadius = '5px';
				userbar.style.width = "99%";
				userbar.style.bottom = "33px";
				menubar.style.marginRight = "20px";
				menubar.style.zIndex = '2';
				userbar.style.zIndex = '2';
			};
			
			methods.user_info_popup = function() {
					var links = [ "PM", "GT", "BT", "HIGHLIGHT",
							"UNHIGHLIGHT", "IGNORATE" ];					
					var popup = document.createElement('div');			
					popup.className = 'user_info_popup';
					popup.id = 'user-popup-div';
					var info = document.createElement('div');
					popup.className = 'user_info_popup';
					info.id = 'popup_info';
					var user = document.createElement('div');
					popup.className = 'user_info_popup';
					user.id = 'popup_user';

					for (var i = 0, len = links.length; i < len; i++) {
						var span = document.createElement('span');
						span.className = 'popup_link';
						span.innerHTML = links[i];
						span.addEventListener('click', utils.popup.clickHandler);
						info.appendChild(span);
					}
					
					popup.appendChild(user);
					popup.appendChild(info);
					document.body.appendChild(popup);				
					
					document.addEventListener('click', function(evt) {
						if (evt.target.className != 'popup_link') {
							utils.popup.hide();
						}
					});			
			};
			
			return {
				init: init,
				generateCss: generateCss
			};
			
		}();
		
		var utils = function() {
		
			var popup = function() {
				// Creates popup containing scraped info from user profile.
				var popupScope = CHROMELL.messageList || CHROMELL.topicList;			
				var debouncer, waiting, currentUser, currentPost, currentID;
				
				var scrapeProfile = function(responseText) {
					var html = document.createElement('html');
					html.innerHTML = responseText;
					var tds = html.getElementsByTagName('td');

					for (var i = 0, len = tds.length; i < len; i++) {
						var td = tds[i];
						if (td.innerText === 'Status') {
							var status = tds[i + 1].innerText;
						}
						else if (td.innerText === 'Formerly') {
							var aliases = tds[i + 1].innerText;
						}
						else if (td.innerText === 'Reputation') {
							var rep = tds[i + 1].innerHTML;
							// Break loop- we don't need to check any other elements
							break;
						}
					}			
					update(html, status, aliases, rep);
				};
				
				var update = function(html, status, aliases, rep) {
					var placeholderElement = document.getElementById("popup_loading");			
					var aliasesElement = document.getElementById("namechange");
					var onlineElement = document.getElementById('online');
					var statusElement = document.getElementById('punish');
					var repElement = document.getElementById('rep');
					placeholderElement.style.display = 'none';			
					rep = rep.replace(/href=/g, 'class="rep_anchor" href=');
					repElement.innerHTML = rep;			
					if (CHROMELL.config.show_old_name) {
						if (aliases) {
							aliasesElement.innerHTML = "<br>Formerly known as: <b>" + aliases + '</b>';
						}
					}	
					if (html.innerHTML.indexOf('online now') > -1) {
							onlineElement.innerHTML = '(online now)';
					}	
					if (status) {
						if (status.indexOf('Suspended') > -1) {
								statusElement.innerHTML = '<b>Suspended until: </b>' + status.substring(17);
						}
						if (status.indexOf('Banned') > -1) {
								statusElement.innerHTML = '<b>Banned</b>';
						}
					}		
				};
				
				var checkAccountAge = function(userID) {
					// Returns appropriate "GS" value for account age. Otherwise, returns empty string
					if (!CHROMELL.config.hide_gs) {
						switch (userID) {
							case (userID > 22682):
									return ' (gs)\u2076';
							case (userID > 21289):
									return ' (gs)\u2075';
							case (userID > 20176):
									return ' (gs)\u2074';
							case (userID > 15258):
									return ' (gs)\u00B3';
							case (userID > 13498):
									return ' (gs)\u00B2';
							case (userID > 10088):
									return ' (gs)';
							default:
									return '';
						}
					}
					else {				
						return '';
					}
				};
				
				var mousemoveHandler = function(evt) {
					// Close popup if user moves mouse outside of popup (triggered after 250ms delay).			
					if (evt.target.className !== 'user_info_popup'
							&& evt.target.className !== 'username_anchor'
							&& evt.target.className !== 'popup_link'
							&& evt.target.className !== 'rep_anchor') {
						if (!waiting) {
							debouncer = setTimeout(utils.popup.hide, 250);
							waiting = true;
						}
					}
					else {
						clearTimeout(debouncer);
						waiting = false;
					}
				};
			
				return {
					init: function() {
						// Use cached event as this method is called from setTimeout
						var evt = _cachedEvent;
						var usernameAnchor = evt.target;
						var boundingRect = usernameAnchor.getBoundingClientRect();
						var x = (boundingRect.left + (boundingRect.width / 2)) - document.body.scrollLeft + usernameAnchor.clientLeft;
						var y = boundingRect.top + document.body.scrollTop + usernameAnchor.clientTop;
						var profileURL = usernameAnchor.href;
						currentUser = usernameAnchor.innerHTML;
						currentPost = usernameAnchor.parentNode;
						currentID = profileURL.match(/user=(\d+)/)[1];
						var gs = checkAccountAge(currentID);

						chrome.runtime.sendMessage({
							need: "xhr",
							url: profileURL
						}, function(response) {
								scrapeProfile(response);
						});						
						
						var popup = document.getElementById('popup_user');
						// TODO: construct popup using createElement method
						popup.innerHTML = '<div id="username" class="user_info_popup">' + currentUser + " " + gs 
								+ ' <span id="popup_uid" class="user_info_popup">' + currentID + '</span></div>'					
								+ '<div id="namechange" class="user_info_popup"></div>'					
								+ '<div id="rep" class="user_info_popup"><span id="popup_loading" class="user_info_popup">loading...</span></div>'
								+ '<div id="online" class="user_info_popup"></div>' 
								+ '<div id="punish" class="user_info_popup"></div>';
						var popupContainer = document.getElementById('user-popup-div');
						// Modify coordinates so that arrow in popup points to anchor
						popupContainer.style.left = (x - 35) + "px";
						popupContainer.style.top = (y + 25) + "px";
						popupContainer.style.display = 'block';
						// Add mousemove listener to detect when popup should be closed		
						document.addEventListener('mousemove', mousemoveHandler);			
					},
					hide: function() {
						document.getElementById('user-popup-div').style.display = 'none';						
						document.getElementsByClassName('body')[0].style.opacity = 1;
						document.removeEventListener('mousemove', mousemoveHandler);
					},
					clickHandler: function(evt) {
							var user = currentUser.toLowerCase();
							var messageListExists = false;
							
							if (CHROMELL.messageList) {
								messageListExists = true;
								var containers = document.getElementsByClassName('message-container');
							}
							else if (CHROMELL.topicList) {	
								var trs = document.getElementsByTagName('tr');
							}							
							
							var target = currentPost;
							var type = evt.target.innerHTML;				
							switch (type) {
								case "IGNORATE?":
									if (!CHROMELL.config.ignorator_list || CHROMELL.config.ignorator_list == '') {
										CHROMELL.config.ignorator_list = currentUser;
									} else {
										CHROMELL.config.ignorator_list += ", " + currentUser;
									}
									chrome.runtime.sendMessage({
										need : "save",
										name : "ignorator_list",
										data : CHROMELL.config.ignorator_list
									});
									if (messageListExists) {
										for (var i = 0, len = containers.length; i < len; i++) {
											var container = containers[i];
											popupScope.ignorator_messagelist(container);
										}
									}
									else {
										topicList.createArrays();
										for (var i = 1, len = trs.length; i < len; i++) {
											var tr = trs[i];
											popupScope.ignorator_topiclist(tr, i);
										}
									}
									evt.target.innerHTML = "IGNORATE";
									this.hide();
									break;
								case "IGNORATE":
									evt.target.innerHTML = "IGNORATE?";
									break;
								case "PM":
									chrome.runtime.sendMessage({
										need : "opentab",
										url : "http://endoftheinter.net/postmsg.php?puser=" + currentID
									});
									this.hide();
									break;
								case "GT":
									chrome.runtime.sendMessage({
										need : "opentab",
										url : "http://endoftheinter.net/token.php?type=2&user=" + currentID
									});
									this.hide();
									break;
								case "BT":
									chrome.runtime.sendMessage({
										need : "opentab",
										url : "http://endoftheinter.net/token.php?type=1&user=" + currentID
									});
									this.hide();
									break;
								case "HIGHLIGHT":
									CHROMELL.config.user_highlight_data[user] = {};
									CHROMELL.config.user_highlight_data[user].bg = Math.floor(
											Math.random() * 16777215).toString(16);
									CHROMELL.config.user_highlight_data[user].color = Math.floor(
											Math.random() * 16777215).toString(16);
									chrome.runtime.sendMessage({
										need : "save",
										name : "user_highlight_data",
										data : CHROMELL.config.user_highlight_data
									});
									if (messageListExists) {
										var top;
										for (var i = 0, len = containers.length; i < len; i++) {
											var container = containers[i];
											popupScope.userhl_messagelist(container, i);
											if (CHROMELL.config.foxlinks_quotes) {
												 popupScope.foxlinks_quote(container);
											}
										}
									} else {
										for (var i = 1, len = trs.length; i < len; i++) {
											var tr = trs[i];											
											popupScope.userhl_topiclist(tr);
										}
									}				
									break;
								case "UNHIGHLIGHT":
									delete CHROMELL.config.user_highlight_data[this.currentUser
											.toLowerCase()];
									chrome.runtime.sendMessage({
										need : "save",
										name : "user_highlight_data",
										data : CHROMELL.config.user_highlight_data
									});
									if (messageListExists) {
										var message_tops = document.getElementsByClassName('message-top');
										for (var i = 0, len = message_tops.length; i < len; i++) {
											var top = message_tops[i];
											if (top.getElementsByTagName('a')[0]) {
												var userToCheck = top.getElementsByTagName('a')[0].innerHTML;
												if (userToCheck === this.currentUser) {		
													top.style.background = '';
													top.style.color = '';
													var top_atags = top.getElementsByTagName('a');
													for ( var j = 0; j < top_atags.length; j++) {
														top_atags[j].style.color = '';
													}
												}
											}
										}
									} else {
										for (var i = 1, len = trs.length; i < len; i++) {
											var tr = trs[i];
											var tds = tr.getElementsByTagName('td');
											if (tds[1].getElementsByTagName('a')[0]) {
												var userToCheck = tds[1].getElementsByTagName('a')[0].innerHTML;
												if (userToCheck === this.currentUser) {
													for (var j = 0, tds_len = tds.length; j < tds_len; j++) {
														td = tds[j];
														td.style.background = '';
														td.style.color = '';
														var tags = td.getElementsByTagName('a');
														for (var k = 0, tags_len = tags.length; k < tags_len; k++) {
															tags[k].style.color = '';
														}
													}
												}
											}
										}
											// topicList.zebra_tables();
									}
									this.hide();
									break;
							}
					}				
				};
				
			}();
		
			var optionsMenu = function() {
				// Displays options menu on top of current page inside iframe.
				
				var preventScroll = function(event) {
					event.preventDefault();
				};
				
				return {
					show: function() {
						var url = chrome.extension.getURL('options.html');
						var div = document.createElement('div');
						var iframe = document.createElement('iframe');
						var width = window.innerWidth;
						var height = window.innerHeight;
						var close = document.createElement('a');
						var bodyClass = document.getElementsByClassName('body')[0];
						var anchorHeight;	
						div.id = "options_div";
						div.style.position = "fixed";
						div.style.width = (width * 0.95) + 'px';
						div.style.height = (height * 0.95) + 'px';	
						div.style.left = (width - (width * 0.975)) + 'px';
						div.style.top = (height - (height * 0.975)) + 'px';
						div.style.boxShadow = "5px 5px 7px black";		
						div.style.borderRadius = '6px';	
						div.style.opacity = 1;
						div.style.backgroundColor = 'white';
						close.style.cssFloat = "right";
						close.style.fontSize = "18px";
						close.href = '#';
						close.style.textDecoration = "none";
						close.id = "close_options";
						close.innerHTML = '&#10006;';			
						iframe.style.width = "inherit";
						iframe.src = url;
						iframe.style.backgroundColor = "white";
						iframe.style.border = "none";
						bodyClass.style.opacity = 0.3;
						div.appendChild(close);
						div.appendChild(iframe);
						document.body.appendChild(div);
						anchorHeight = close.getBoundingClientRect().height * 2;
						iframe.style.height = ((height * 0.95) - anchorHeight) + 'px';
						bodyClass.addEventListener('click', this.hide);
						document.getElementById('close_options').addEventListener('click', this.hide);
						document.body.addEventListener('mousewheel', preventScroll);
					},
					hide: function() {
						var div = document.getElementById('options_div');
						var bodyClass = document.getElementsByClassName('body')[0];
						bodyClass.style.opacity = 1;
						document.body.removeChild(div);
						bodyClass.removeEventListener('click', this.hide);
						document.body.removeEventListener('click', this.hide);
						document.body.removeEventListener('mousewheel', preventScroll);	
					},
				};
				
			}();
		
			var asyncUpload = function(tgt, i) {
				console.log(tgt, i);
				if (!i) {
					var i = 0;
				}
				var xh = new XMLHttpRequest();
				xh.onreadystatechange = function() {
					if (this.readyState === 4 && this.status === 200) {
						var tmp = document.createElement('div');
						tmp.innerHTML = this.responseText;
						console.log(tmp);
						var update_ul;
						if (window.location.href.match('postmsg')) {
							update_ul = document.getElementsByTagName('form')[0]
									.getElementsByTagName('b')[2];
						} else {
							update_ul = document
									.getElementsByClassName('quickpost-body')[0]
									.getElementsByTagName('b')[0];
						}
						var current = update_ul.innerHTML
								.match(/Uploading: (\d+)\/(\d+)\)/);
						var tmp_input = tmp.getElementsByClassName('img')[0]
								.getElementsByTagName('input')[0];
						if (tmp_input.value) {
							if (tmp_input.value.substring(0, 4) == '<img') {
								quickReplyInsert(tmp_input.value);
								if ((i + 1) == current[2]) {
									update_ul.innerHTML = "Your Message";
								} else {
									update_ul.innerHTML = "Your Message (Uploading: "
											+ (i + 2) + "/" + current[2] + ")";
								}
							}
						}
						i++;
						if (i < tgt.length) {
							asyncUpload(tgt, i);
						}
					}
				};
				var http = 'https';
				if (window.location.href.indexOf('https:') == -1)
					http = 'http';
				xh.open('post', http + '://u.endoftheinter.net/u.php', true);
				var formData = new FormData();
				formData.append('file', tgt[i]);
				xh.withCredentials = "true";
				xh.send(formData);
			};
		
			var quickReplyInsert = function(text) {
				var quickreply = document.getElementsByTagName('textarea')[0];
				var qrtext = quickreply.value;
				var oldtxt = qrtext.split('---');
				var newtxt = '';
				for (var i = 0; i < oldtxt.length - 1; i++) {
					newtxt += oldtxt[i];
				}
				newtxt += text + "\n---" + oldtxt[oldtxt.length - 1];
				quickreply.value = newtxt;
			};
			
			return {
				popup: popup,
				optionsMenu: optionsMenu,
				asyncUpload: asyncUpload,
				quickReplyInsert: quickReplyInsert				
			};
			
		}();
		
		// Get config from background page and call init method
		CHROMELL.getConfig(init);
		
		return {
			DOM: DOM,
			utils: utils,
			cacheEvent: function(event) {
					_cachedEvent = event;
			},
			cachedEvent: function() {					
					return _cachedEvent;
			}
		};
		
	}();
	
	return CHROMELL;
	
})( CHROMELL || {} );