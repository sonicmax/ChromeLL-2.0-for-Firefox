var config = {};
var allPages = {
	history_menubar : function() {
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
		/*
		 * else{ if(config.sort_history) link.href =
		 * '//endoftheinter.net/history.php?b'; else link.href =
		 * '//endoftheinter.net/history.php';
		 * document.getElementsByClassName('menubar')[0].insertBefore(link,
		 * null);
		 * document.getElementsByClassName('menubar')[0].insertBefore(sep,
		 * link); }
		 */
	},
	float_userbar : function() {
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
	},
	float_userbar_bottom : function() {
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
	},
	short_title : function() {
		document.title = document.title.replace(/End of the Internet - /i, '');
	},
	user_info_popup : function() {
		chrome.extension.sendRequest({
			need : "insertcss",
			file : "src/css/arrowbox.css"
		}, function(r) {
			var links = [ "PM", "GT", "BT", "HIGHLIGHT",
					"UNHIGHLIGHT", "IGNORATE" ];
			var popup = document.createElement('div');
			popup.id = "user-popup-div";
			var info = document.createElement('div');
			info.id = 'popup_info';
			var user = document.createElement('div');
			user.id = 'popup_user';
			for ( var i = 0; links[i]; i++) {
				var ins = document.createElement('span');
				ins.className = 'popup_link';
				ins.innerHTML = links[i];
				ins.addEventListener('click', commonFunctions.popupClick);
				info.insertBefore(ins, null);
			}
			popup.insertBefore(user, null);
			popup.insertBefore(info, null);
			document.body.insertBefore(popup, null);
			document.body.addEventListener('dblclick',
					commonFunctions.handlePopup);
			document.addEventListener('click', function(e) {
				if (e.target.className != 'popup_link')
					commonFunctions.hidePopup(e)
			});
			/*
			 * try{ var arrow, arrow_user; for(var i = 1;
			 * document.getElementsByTagName('tr')[i]; i++){ arrow =
			 * document.createElement('span'); arrow.className = "arrow";
			 * arrow_user = document.createElement('span'); arrow_user.className =
			 * "arrow";
			 * document.getElementsByTagName('tr')[i].getElementsByTagName('td')[0].insertBefore(arrow,
			 * document.getElementsByTagName('tr')[i].getElementsByTagName('td')[0].getElementsByTagName('a')[0]);
			 * document.getElementsByTagName('tr')[i].getElementsByTagName('td')[1].insertBefore(arrow_user,
			 * document.getElementsByTagName('tr')[i].getElementsByTagName('td')[1].getElementsByTagName('a')[0]); }
			 * }catch(e){ }
			 */
		});
	},
	dramalinks : function() {
		if (config.hide_dramalinks_topiclist
				&& !window.location.href.match(/topics/i))
			return;
		commonFunctions.getDrama();
	}
}

var commonFunctions = {
	foxlinks_quote : function() {
		var mcol = "#" + config['foxlinks_quotes_color'];
		var m = document.getElementsByClassName('quoted-message');
		var n;
		for ( var i = 0; m[i]; i++) {
			var quot_msg = m[i];
			var quot_msg_style = quot_msg.style;
			quot_msg_style.borderStyle = 'solid';
			quot_msg_style.borderWidth = '2px';
			quot_msg_style.borderRadius = '5px';
			quot_msg_style.marginRight = '30px';
			quot_msg_style.marginLeft = '10px';
			quot_msg_style.paddingBottom = '10px';
			quot_msg_style.marginTop = '0px';
			quot_msg_style.borderColor = mcol;
			n = quot_msg.getElementsByClassName('message-top')[0];
			if (n) {
				if (n.style.background == '') {
					n.style.background = mcol;
				} else {
					quot_msg_style.borderColor = n.style.background;
				}
				n.style.marginTop = '0px';
				n.style.paddingBottom = '2px';
				n.style.marginLeft = '-6px';
			}
		}
	},
	asyncUpload : function(tgt, i) {
		if (!i)
			var i = 0;
		var xh = new XMLHttpRequest();
		xh.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200) {
				var tmp = document.createElement('div');
				tmp.innerHTML = this.responseText;
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
						commonFunctions.quickReplyInsert(tmp_input.value);
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
					commonFunctions.asyncUpload(tgt, i);
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
	},
	handlePopup : function(evt) {
		try {
			var user = false;
			if (evt.target.parentNode.parentNode.parentNode.parentNode.className === "message-container") {
				user = evt.target.parentNode.parentNode.parentNode.parentNode
						.getElementsByTagName('a')[0];
			} else {
				user = evt.target.getElementsByTagName('a')[0];
			}
			commonFunctions.currentUser = user.innerHTML;
			commonFunctions.currentID = user.href.match(/user=(\d+)/)[1];
			var gs = '';
			if (!config.hide_gs) {
			if (commonFunctions.currentID > 22682) {
				gs = ' (gs)\u2076';
			} else if (commonFunctions.currentID > 21289) {
				gs = ' (gs)\u2075';
			} else if (commonFunctions.currentID > 20176) {
				gs = ' (gs)\u2074';
			} else if (commonFunctions.currentID > 15258) {
				gs = ' (gs)\u00B3';
			} else if (commonFunctions.currentID > 13498) {
				gs = ' (gs)\u00B2';
			} else if (commonFunctions.currentID > 10088) {
				gs = ' (gs)';
			}
			}
			// load user profile
			var xhr = new XMLHttpRequest();
			xhr.open("GET", user, true);
			xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == 200) {			
					var html = document.createElement('html');
					html.innerHTML = xhr.responseText;
					var htmlobj = ($(html.innerHTML).find("td"));
					
					// scrape information from profile
					var profileRep = $(htmlobj).filter(function () {
							return $(this).text() == "Reputation";
					}).closest("tr").text();
					commonFunctions.rep = profileRep.replace('Reputation', '');
					
					var profileStatus = $(htmlobj).filter(function () {
							return $(this).text() == "Status";
					}).closest("tr").text();
					commonFunctions.punish = profileStatus.replace('Status', '').trim();
					
					var oldUsername = $(htmlobj).filter(function () {
							return $(this).text() == "Formerly";
					}).closest("tr").text();
					commonFunctions.oldName = oldUsername.replace('Formerly', '').trim();

					// prepare popup menu for updates
					var formerly = document.getElementById("namechange");
					var displayOnline = document.getElementById('online');
					var displayPunish = document.getElementById('punish');
					var displayRep = document.getElementById('rep');
					
					// update popup menu elements
					displayRep.innerHTML = '<br>' + commonFunctions.rep;
					if (config.show_old_name) {
					    if (oldUsername.indexOf("Formerly") > -1) {
					        formerly.innerHTML = "<br>Formerly known as: <b>" + commonFunctions.oldName + '</b>';
					    }
					}
					if (html.innerHTML.indexOf('online now') > -1) {
					    displayOnline.innerHTML = '(online now)';
					}
					if (commonFunctions.punish.indexOf('Suspended') > -1) {
					    displayPunish.innerHTML = '<b>Suspended until: </b>' + commonFunctions.punish.substring(17);
					}
					if (commonFunctions.punish.indexOf('Banned') > -1) {
					    displayPunish.innerHTML = '<b>Banned</b>';
					}
			}
			}
			xhr.send();
			// create popup menu
			document.getElementById('popup_user').innerHTML = '<div id="username">' + commonFunctions.currentUser + " " + gs + ' <span class="popup_uid">' + commonFunctions.currentID + '</div>'
			+ '<span class="popup_uid"><div id="namechange"> </div>'
			+ '<span class="popup_uid"><p><div id="rep"><br>loading...</div></p>' 
			+ '<div id="online"></div><div id="punish"></div><div id="clip"></div></span>';
			var mTop = 10;
			var mLeft = -35;
			var popup_div_style = document.getElementById('user-popup-div').style;
			popup_div_style.top = (evt.pageY + mTop) + "px";
			popup_div_style.left = (evt.pageX + mLeft) + "px";
			popup_div_style.display = 'block';
			if (document.selection)
				document.selection.empty();
			else if (window.getSelection)
				window.getSelection().removeAllRanges();
		} catch (e) {
			// ignore - element not useful for user data
		}
	},
	hidePopup : function() {
		document.getElementById('user-popup-div').style.display = 'none';
	},
	popupClick : function(evt) {
		var type = evt.target.innerHTML;
		if (config.debug)
			console.log(type, commonFunctions.currentUser);
		switch (type) {
		case "IGNORATE?":
			if (!config.ignorator_list || config.ignorator_list == '') {
				config.ignorator_list = commonFunctions.currentUser;
			} else {
				config.ignorator_list += ", " + commonFunctions.currentUser;
			}
			chrome.extension.sendRequest({
				need : "save",
				name : "ignorator_list",
				data : config.ignorator_list
			});
			if (typeof (messageList) != 'undefined')
				messageList.ignorator_messagelist();
			else
				topicList.ignorator_topiclist();
			commonFunctions.hidePopup();
			evt.target.innerHTML = "IGNORATE";
			break;
		case "IGNORATE":
			evt.target.innerHTML = "IGNORATE?";
			break;
		case "PM":
			chrome.extension.sendRequest({
				need : "opentab",
				url : "http://endoftheinter.net/postmsg.php?puser="
						+ commonFunctions.currentID
			});
			commonFunctions.hidePopup();
			break;
		case "GT":
			chrome.extension.sendRequest({
				need : "opentab",
				url : "http://endoftheinter.net/token.php?type=2&user="
						+ commonFunctions.currentID
			});
			commonFunctions.hidePopup();
			break;
		case "BT":
			chrome.extension.sendRequest({
				need : "opentab",
				url : "http://endoftheinter.net/token.php?type=1&user="
						+ commonFunctions.currentID
			});
			commonFunctions.hidePopup();
			break;
		case "HIGHLIGHT":
			var user = commonFunctions.currentUser.toLowerCase();
			config.user_highlight_data[user] = {};
			config.user_highlight_data[user].bg = Math.floor(
					Math.random() * 16777215).toString(16);
			config.user_highlight_data[user].color = Math.floor(
					Math.random() * 16777215).toString(16);
			chrome.extension.sendRequest({
				need : "save",
				name : "user_highlight_data",
				data : config.user_highlight_data
			});
			if (typeof (messageList) != 'undefined') {
				messageList.userhl_messagelist();
				if (config.foxlinks_quotes)
					commonFunctions.foxlinks_quote();
			} else {
				topicList.userhl_topiclist();
			}
			break;
		case "UNHIGHLIGHT":
			delete config.user_highlight_data[commonFunctions.currentUser
					.toLowerCase()];
			chrome.extension.sendRequest({
				need : "save",
				name : "user_highlight_data",
				data : config.user_highlight_data
			});
			commonFunctions.hidePopup();
			if (typeof (messageList) != 'undefined') {
				var message_tops = document
						.getElementsByClassName('message-top');
				for ( var i = 0; i < message_tops.length; i++) {
					message_tops[i].style.background = '';
					message_tops[i].style.color = '';
					var top_atags = message_tops[i].getElementsByTagName('a');
					for ( var j = 0; j < curr_top_atags.length; j++)
						top_atags[j].style.color = '';
				}
				messageList.userhl_messagelist();
				if (config.foxlinks_quotes)
					commonFunctions.foxlinks_quote();
			} else {
				var tds = document.getElementsByTagName('td');
				for ( var i = 0; i < tds.length; i++) {
					tds[i].style.background = '';
					tds[i].style.color = '';
					var td_atags = tds[i].getElementsByTagName('a');
					for ( var j = 0; j < td_atags.length; j++)
						td_atags[j].style.color = '';
				}
				topicList.userhl_topiclist();
				if (config.zebra_tables)
					topicList.zebra_tables();
			}
			break;
		}
	},
	quickReplyInsert : function(text) {
		var quickreply = document.getElementsByTagName('textarea')[0];
		var qrtext = quickreply.value;
		var oldtxt = qrtext.split('---');
		var newtxt = '';
		for ( var i = 0; i < oldtxt.length - 1; i++) {
			newtxt += oldtxt[i];
		}
		newtxt += text + "\n---" + oldtxt[oldtxt.length - 1];
		quickreply.value = newtxt;
	},
	getDrama : function() {
		chrome.extension.sendRequest({
			need : "dramalinks"
		}, function(response) {
			commonFunctions.insertDramalinks(response.data,
					config.hide_dramalinks);
			if (config.hide_dramalinks)
				commonFunctions.hideDrama();
		});
	},
	hideDrama : function() {
		var t = document.getElementById("dramalinks_ticker");
		try {
			var color = t.getElementsByTagName('div')[0].style.background;
			var hone = document.getElementsByTagName('h1')[0];
			hone.style.color = color;
			hone.ondblclick = commonFunctions.switchDrama;
		} catch (e) {
			// dramalinks ticker did not load for some reason, ignore it
		}
	},
	switchDrama : function() {
		document.getElementById("dramalinks_ticker").style.display == 'none' ? document
				.getElementById("dramalinks_ticker").style.display = 'block'
				: document.getElementById("dramalinks_ticker").style.display = 'none';
		if (document.selection)
			document.selection.empty();
		else if (window.getSelection)
			window.getSelection().removeAllRanges();
	},
	insertDramalinks: function(dramas, hide) {
		try {
			var ticker = document.createElement("center");
			var update = document.createElement("center");
			// ticker.innerHTML="Dramalinks loading...";
			ticker.id = "dramalinks_ticker";
			update.innerHTML = "";
			update.id = "dramalinks_update";
			var h1 = document.getElementsByTagName('h1')[0];
			if (config.dramalinks_below_topic 
					&& document.getElementsByTagName('h2')[0])
				h1 = document.getElementsByTagName('h2')[0];
				h1.parentNode.insertBefore(ticker, h1.nextSibling);
				h1.parentNode.insertBefore(update, h1.nextSibling);
			if (hide) {
				document.getElementById("dramalinks_ticker").style.display = 'none';
			}
			if (!dramas) {
				dramas = "Dramalinks loading...";
				// wait for message from background page before updating dramalinks
				chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
					if (msg.action == 'updatedrama') {
						if (config.hide_dramalinks_topiclist 
								&& !window.location.href.match(/topics/i)) {
							return;
						}
						commonFunctions.updateDramaTicker();
					}
				});
			}
			document.getElementById("dramalinks_ticker").innerHTML = dramas;
		} catch (e) {}
	},
	updateDramaTicker: function() {
		chrome.extension.sendRequest({
			need: "dramalinks"
		}, function(response) {
			dramas = response.data,
			document.getElementById("dramalinks_ticker").innerHTML = dramas;
		});
	}
}

chrome.extension.sendRequest({
	need : "config"
}, function(response) {
	config = response.data;
	for ( var i in allPages) {
		if (response.data[i]) {
			try {
				allPages[i]();
			} catch (err) {
				console.log("error in " + i + ":", err);
			}
		}
	}
});