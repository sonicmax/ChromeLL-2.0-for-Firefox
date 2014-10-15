var config = {};
var ignorated = {
	total_ignored : 0,
	data : {
		users : {},
		keywords : {}
	}
};
var topicList = {
	ignorator_topiclist : function(tr, i) {
		if (!config.ignorator) {
			return;
		}
		var ignores = config.ignorator_list.split(',');
		ignores = topicListHelper.handleCsv(ignores);
		var username;
		if (tr.getElementsByTagName('td')[1]) {
			username = tr.getElementsByTagName('td')[1];
			for (var f = 0, len = ignores.length; f < len; f++) {
				if (username.innerHTML.indexOf('<td>Human</td>') > -1) {
					return;
				}			
				else if (username.getElementsByTagName('a')[0]
						&& username.getElementsByTagName('a')[0].innerHTML
								.toLowerCase() == ignores[f]) {
					if (config.debug)
						console
								.log('found topic to remove: \"'
										+ tr.getElementsByTagName('td')[0]
												.getElementsByTagName('a')[0].innerHTML
												.toLowerCase()
										+ "\" author: " + ignores[f]
										+ " topic: " + i);
					username.parentNode.style.display = 'none';
					username.parentNode.className = "hidden_tr";
					ignorated.total_ignored++;
					if (!ignorated.data.users[ignores[f]]) {
						ignorated.data.users[ignores[f]] = {};
						ignorated.data.users[ignores[f]].total = 1;
						ignorated.data.users[ignores[f]].trs = [ i ];
					} else {
						ignorated.data.users[ignores[f]].total++;
						ignorated.data.users[ignores[f]].trs.push(i);
					}
				}
			}
		}
	},
	ignore_keyword : function(tr, i) {
		if (!config.ignore_keyword_list) {
			return;
		}
		var keywords;
		var re = false;
		try {
			keywords = JSON.parse(config.ignore_keyword_list);
			if (config.debug) {
				console.log("JSON keywords");
			}
			re = true;
		} catch (e) {
			keywords = config.ignore_keyword_list.split(',');
			keywords = topicListHelper.handleCsv(keywords);
		}
		var title;
		var match = false;
		var reg;
		if (tr.getElementsByTagName('td')[0]) {
			title = tr.getElementsByTagName('td')[0];
			for (var f = 0; f < keywords.length; f++) {
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
					match = title.getElementsByTagName('a')[0].innerHTML
							.match(reg);
				} else {
					match = title.getElementsByTagName('a')[0].innerHTML
							.toLowerCase().indexOf(
									keywords[f].toLowerCase()) != -1;
				}
				if (match) {
					if (config.debug)
						console
								.log('found topic to remove: \"'
										+ tr.getElementsByTagName('td')[0]
												.getElementsByTagName('a')[0].innerHTML
												.toLowerCase()
										+ "\" keyword: " + keywords[f]
										+ " topic: " + i);
					title.parentNode.style.display = 'none';
					title.parentNode.className = "hidden_tr";
					ignorated.total_ignored++;
					if (!ignorated.data.keywords[keywords[f]]) {
						ignorated.data.keywords[keywords[f]] = {};
						ignorated.data.keywords[keywords[f]].total = 1;
						ignorated.data.keywords[keywords[f]].trs = [ i ];
					} else {
						ignorated.data.keywords[keywords[f]].total++;
						ignorated.data.keywords[keywords[f]].trs.push(i);
					}
					// break;
				}
			}
		}
	},
	/*append_tags : function(tr) {
		console.log('does this actually work');
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
	page_jump_buttons : function(tr) {
		var inbox;
		if (window.location.href.indexOf('inbox.php') > -1) {
			if (!config.page_jump_buttons_pm) {
				return;
			}
			inbox = true;
		}
		var insert;
		var tmp, topic;
		if (tr.getElementsByTagName('td')[0]) {
			insert = document.createElement('span');
			if (inbox) {
				insert.style.cssFloat = 'right';
			}
			insert.addEventListener('click',
					topicListHelper.jumpHandlerTopic, false);
			try {
				topic = tr.getElementsByTagName('td')[0]
						.getElementsByTagName('a');
				tmp = topic[0].href.match(/(topic|thread)=([0-9]+)/)[2];
				insert.innerHTML = '<a href="##' + tmp
						+ '" id="jumpWindow">#</a> <a href="##' + tmp
						+ '" id="jumpLast">&gt;</a>';
				if (inbox) {
					tr.getElementsByTagName('td')[0]
							.insertBefore(
							insert, null);				
				}
				else {
					tr.getElementsByTagName('td')[0]
							.getElementsByClassName('fr')[0]
							.insertBefore(
							insert, null);
				}					
			} catch (e) {
				if (config.debug) {
					console.log('locked topic?');
				}	
				topic = tr.getElementsByTagName('td')[0]
						.getElementsByTagName('span')[0]
						.getElementsByTagName('a');
				tmp = topic[0].href.match(/(topic|thread)=([0-9]+)/)[2];
				insert.innerHTML = '<a href="##' + tmp
						+ '" id="jumpWindow">#</a> <a href="##' + tmp
						+ '" id="jumpLast">&gt;</a>';
				tr.getElementsByTagName('td')[0]
						.getElementsByClassName('fr')[0].insertBefore(
						insert, null);
			}
		}
	},
	enable_keyword_highlight : function(tr) {
		var title;
		var keys = {};
		var re = false;
		for (var j = 0; config.keyword_highlight_data[j]; j++) {
			try {
				keys[j] = {};
				keys[j].match = JSON
						.parse(config.keyword_highlight_data[j].match);
				keys[j].bg = config.keyword_highlight_data[j].bg;
				keys[j].color = config.keyword_highlight_data[j].color;
				re = true;
			} catch (e) {
				keys[j] = {};
				keys[j].match = config.keyword_highlight_data[j].match
						.split(',');
				keys[j].match = topicListHelper.handleCsv(keys[j].match);
				keys[j].bg = config.keyword_highlight_data[j].bg;
				keys[j].color = config.keyword_highlight_data[j].color;
			}
		}
		var reg;
			title = tr.getElementsByTagName('td')[0]
					.getElementsByClassName('fl')[0].getElementsByTagName('a')[0].innerHTML;
			for (var j = 0; keys[j]; j++) {
				for (var k = 0; keys[j].match[k]; k++) {
					if (keys[j].match[k].substring(0, 1) == '/') {
						reg = new RegExp(keys[j].match[k].substring(1,
								keys[j].match[k].lastIndexOf('/')),
								keys[j].match[k].substring(keys[j].match[k]
										.lastIndexOf('/') + 1,
										keys[j].match[k].length));
						match = title.match(reg);
					} else {
						reg = keys[j].match[k].toLowerCase();
						match = title.toLowerCase().indexOf(reg) != -1;
					}
					if (match) {
						tr.getElementsByTagName('td')[0].style.background = '#'
								+ keys[j].bg;
						tr.getElementsByTagName('td')[0].style.color = '#'
								+ keys[j].color;
						for (var m = 0; tr.getElementsByTagName('td')[0]
								.getElementsByTagName('a')[m]; m++) {
							tr.getElementsByTagName('td')[0]
									.getElementsByTagName('a')[m].style.color = '#'
									+ keys[j].color;
						}
						if (config.debug) {
							console.log('highlight topic ' + title
									+ ' keyword ' + reg);
						}
					}
				}
			}
	},
	enable_tag_highlight : function(tr) {
		var keys = {};
		for (var j = 0; config.tag_highlight_data[j]; j++) {
			keys[j] = {};
			keys[j].match = config.tag_highlight_data[j].match.split(',');
			keys[j].match = topicListHelper.handleCsv(keys[j].match);
			keys[j].bg = config.tag_highlight_data[j].bg;
			keys[j].color = config.tag_highlight_data[j].color;
		}
		tags = tr.getElementsByTagName('td')[0]
				.getElementsByClassName('fr')[0].getElementsByTagName('a');
		for (var j = 0; tags[j]; j++) {
			for (var k = 0; keys[k]; k++) {
				for (var l = 0; keys[k].match[l]; l++) {
					if (tags[j].innerHTML.toLowerCase().match(
							keys[k].match[l])) {
						for (var m = 0; tr
								.getElementsByTagName('td')[m]; m++) {
							if (tr.getElementsByTagName('td')[m].style.background == '') {
								tr.getElementsByTagName('td')[m].style.background = '#'
										+ keys[k].bg;
								tr.getElementsByTagName('td')[m].style.color = '#'
										+ keys[k].color;
								for (var n = 0; tr
										.getElementsByTagName('td')[m]
										.getElementsByTagName('a')[n]; n++) {
									tr.getElementsByTagName('td')[m]
											.getElementsByTagName('a')[n].style.color = '#'
											+ keys[k].color;
								}
								break;
							}
						}
						if (config.debug)
							console.log('highlight topic ' + tr
									+ ' tag ' + keys[k].match[l]);
					}
				}
			}
		}
	},
	userhl_topiclist : function(tr) {
		if (!config.enable_user_highlight) {
			return;
		}
		var user;
		if (tr.getElementsByTagName('td')[1]
				.getElementsByTagName('a')[0]) {
			user = tr.getElementsByTagName('td')[1]
					.getElementsByTagName('a')[0].innerHTML.toLowerCase();
			if (config.user_highlight_data[user]) {
				if (config.debug) {
					console.log('highlighting topic by ' + user);
				}
				for (var j = 0; tr.getElementsByTagName('td')[j]; j++) {
					tr.getElementsByTagName('td')[j].style.background = '#'
							+ config.user_highlight_data[user].bg;
					tr.getElementsByTagName('td')[j].style.color = '#'
							+ config.user_highlight_data[user].color;
				}
				for (var j = 0; tr.getElementsByTagName('a')[j]; j++) {
					tr.getElementsByTagName('a')[j].style.color = '#'
							+ config.user_highlight_data[user].color;
				}
				tr.className = 'highlighted_tr';
			}
		}
	},
	zebra_tables : function(tr, i) {
		/*if (tr.className !== 'live_tr' && i === 0) {
			var i = 1;
		}*/
		if (i % 2 === 0) {
			for (var j = 0; tr.getElementsByTagName('td')[j]; j++) {
				if (tr.getElementsByTagName('td')[j].style.background === '')
					tr.getElementsByTagName('td')[j].style.background = '#'
							+ config.zebra_tables_color;
			}
		}
	}
}

var topicListHelper = {
	jumpHandlerTopic : function(ev) {
		var a, history, inbox;
		if (window.location.href.indexOf('history.php') > -1) {
			history = true;
			a = ev.srcElement.parentNode.parentNode.parentNode.parentNode
					.parentNode.getElementsByTagName('td')[2];
		}
		else if (window.location.href.indexOf('inbox.php') > -1) {
			inbox = true;
			a = ev.srcElement.parentNode.parentNode.nextSibling.nextSibling;
		}
		else {
			a = ev.srcElement.parentNode.parentNode.parentNode.parentNode
					.getElementsByTagName('td')[2];
		}
		var last = Math.ceil(a.innerHTML.split('<')[0] / 50);
		if (ev.srcElement.id == 'jumpWindow') {
			pg = prompt("Page Number (" + last + " total)", "Page");
			if (pg == undefined || pg == "Page") {
				return 0;
			}
		} else {
			pg = last;
		}
		if (history) {
			window.location = ev.srcElement.parentNode.parentNode.parentNode.getElementsByTagName('a')[0].href
					+ '&page=' + pg;
		}
		else if (inbox) {
			window.location = ev.srcElement.parentNode.parentNode.firstChild.href 
					+ '&page=' + pg;
		}
		else {
			window.location = ev.srcElement.parentNode.parentNode.parentNode.parentNode
					.getElementsByTagName('td')[0].getElementsByTagName('a')[0].href
					+ '&page=' + pg;
		}
	},
	getTopics : function() {
		return document.getElementsByClassName('grid')[0]
				.getElementsByTagName('tr');
	},
	handleCsv : function(ignores) {
		for (var r = 0; r < ignores.length; r++) {
			var d = 0;
			while (ignores[r].substring(d, d + 1) == ' ') {
				d++;
			}
			ignores[r] = ignores[r].substring(d, ignores[r].length)
					.toLowerCase();
			;
		}
		return ignores;
	},
	chkTags : function() {
		var atags = document.getElementById('bookmarks').getElementsByTagName(
				'span');
		var ctags = {};
		for (var i = 0; atags[i]; i++) {
			if (!atags[i].className) {
				ctags[atags[i].getElementsByTagName('a')[0].innerHTML] = atags[i]
						.getElementsByTagName('a')[0].href
						.match('\/topics\/(.*)$')[1];
			}
		}
		chrome.runtime.sendMessage({
			need : "save",
			name : "saved_tags",
			data : ctags
		});
	},
	init : function() {
		topicListHelper.globalPort = chrome.runtime.connect();
		chrome.runtime.sendMessage({
			need : "config"
		}, function(conf) {
			config = conf.data;
			var trs = document.getElementsByClassName('grid')[0]
					.getElementsByTagName('tr');
			var tr;
			var pm = '';
			if (window.location.href.match('inbox.php'))
				pm = "_pm";
			try {
				// ignore first node in trs (not a topic)				
				for (j = 1, len = trs.length; j < len; j++) {
				 tr = trs[j];
					for (var i in topicList) {
						if (config[i + pm]) {
							// pass tr node & index to function
							topicList[i](tr, j);
						}
					}
				}
			} catch (err) {
				console.log("error in " + i + ":", err);
			}
			// send ignorator data to background script
			topicListHelper.globalPort.postMessage({
				action : 'ignorator_update',
				ignorator : ignorated,
				scope : "topicList"
			});			
			try {
				topicListHelper.chkTags();
			} catch (e) {
				console.log("Error finding tags");
			}
		});
		topicListHelper.globalPort.onMessage.addListener(function(msg) {
			// ignorator_update is handled by background script
			if (msg.action !== 'ignorator_update') {
				switch (msg.action) {
					case "showIgnorated":
						if (config.debug) {
							console.log("showing hidden trs", msg.ids);
						}
						var tr = document.getElementsByTagName('tr');
						for (var i; i = msg.ids.pop();) {
							tr[i].style.display = '';
							tr[i].style.opacity = '.7';
						}
						break;
					default:
						if (config.debug) {
							console.log('invalid action', msg);
						}
						break;
				}
			}
		});
	}
}

topicListHelper.init();