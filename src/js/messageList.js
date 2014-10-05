var config = [];
var ignorated = {
	total_ignored : 0,
	data : {
		users : {}
	}
};
// for rep ignorator
/*var usersFromPage = [];
var cachedResponses = [];
var userFilter;
var repFilter;
var token;
var configTimeout;*/

// set up an observer for when img-placeholders get populated
var img_observer = new MutationObserver(function(mutations) {
var mutation;
	for (var i = 0, len = mutations.length; i < len; i++) {
		mutation = mutations[i];
		// find all fullsize imgs
		if (mutation.addedNodes.length > 0
				&& mutation.addedNodes[0].src
					.match(/.*\/i\/n\/.*/)) {
			// pass to resize_imgs method
			messageListLivelinks.resize_imgs(mutation.target.parentNode);
		}
		if (mutation.type === 'attributes') {
			// once they're loaded, thumbnails have /i/t/ in their
			// url where fullsize have /i/n/
			if (mutation.attributeName == "class"
					&& mutation.target.getAttribute('class') == "img-loaded"
					&& mutation.target.childNodes[0].src
							.match(/.*\/i\/t\/.*/)) {
				if(config.debug) console.log("found thumbnail");
				/*
				 * set up the onclick and do some dom manip that the
				 * script originally did - i think only removing href
				 * actually matters
				 */
				mutation.target.parentNode.addEventListener('click',
						messageListHelper.expandThumbnail);
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
});

var link_observer = new MutationObserver(function(mutations) {
	var mutation;
	for (var h = 0, len = mutations.length; h < len; h++) {
		mutation = mutations[h];
		if (mutation.type == "childList" 
				&& mutation.target.getAttribute("class") == "message-top" 
				&& mutation.target.nextSibling.nodeName == "TABLE") {
			var link, wikiLink, vidLink, imageLink, gfyLink;
			var posts = mutation.target.nextSibling;
			var links = posts.getElementsByClassName("l");
			for (var i = links.length - 1; i >= 0; i--) {
				link = links[i];
				if (link.title.indexOf("/index.php") == 0) {
					wikiLink = link;
					wikiLink.className = "wiki";
					wikiLink.addEventListener("click", messageListHelper.wikiFix);	
				} else if ((link.title.indexOf("youtube.com/") > -1) 
						|| (link.title.indexOf("youtu.be/") > -1)) {
					vidLink = link;
					vidLink.className = "youtube";
					// give each video link a unique id for embed/hide functions
					vidLink.id = vidLink.href + "&" + Math.random().toString(16).slice(2);
				} else if (link.title.indexOf("/imap/") == 0) {
					imageLink = link;
					imageLink.className = "imap";
					imageLink.addEventListener("click", messageListHelper.imageFix);
				} else if (link.title.indexOf("http://gfycat.com/") > -1) {
					gfyLink = link;
					if (gfyLink.className != "gfycat") {
						gfyLink.className = "gfycat";
					}
				}
			}
		}
	}
	if (config.embed_on_hover) {
		$("a.youtube").hoverIntent(
			function() {
				var that = this;
				var color = $("table.message-body tr td.message").css("background-color");
				if (that.className == "youtube") {
					$(that).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; background: " + color + ";'><a id='" + that.id + "' class='embed' href='javascript:void(0)'>&nbsp<b>[Embed]</b></a></span>"));
				}
			}, function() {
				var that = this;
				if (that.className == "youtube") {
					$(that).find("span").remove();
				}
			}
		);
		$("table.message-body").on("click", "a.embed", messageListHelper.embedYoutube);
		$("table.message-body").on("click", "a.hide", messageListHelper.hideYoutube);
	}
	$(document).ready(function() {
		$("a.wiki").click(function(event) {
			event.preventDefault();
		});
		$("a.imap").click(function(event) {
			event.preventDefault();
		});
		$("div.youtube").click(function(event) {
			event.preventDefault();
		});
	});
});

link_observer.observe(document, {
		subtree: true,
		characterData: true,
		childList: true,
		attributes: true
});

/*function repIgnorator() {
	// called from messageListHelper.init
	var msg_observer = new MutationObserver(function(mutations) {
		var childNodes;
		var color;
		var mutation;
		// todo - stop using global vars
		userFilter = config.rep_ignorator_userids;
		repFilter = JSON.stringify(config.rep_ignorator_filter).replace(/"|{|}/g, '');
		for (var h = 0, len = mutations.length; h < len; h++) {
			mutation = mutations[h];
			if (mutation.addedNodes.length == 1 && mutation.target.getAttribute('class') == 'message-top' 
					&& mutation.addedNodes[0].innerHTML.indexOf('Notes') > -1) {
				// loop through childNodes of message-top to find profile link
				childNodes = mutation.target.childNodes;
				for (var i = 0, len = childNodes.length; i < len; i++) {
					childNode = childNodes[i];
					if (childNode.nodeName == 'A' && childNode.href.indexOf('profile.php?user=') > -1) {
						// get user id, compare against filter array
						userId = childNode.href.match(/\?user=([0-9]+)/)[1];
						for (var i = 0, len = userFilter.length; i < len; i++) {
							filterId = userFilter[i];
							if (userId == filterId) {
								// hide post & add button/rep info to message-top
								color = $(mutation.target).css('background-color');
								mutation.target.nextSibling.parentNode.style.opacity = 0.15;
								mutation.target.nextSibling.parentNode.lastChild.style.display = 'none';
								$(mutation.target).append(' | ' + '<span style="z-index: 1; background: ' + color 
								+ ';"><a class="showpost" id ="' + mutation.target.parentNode.getAttribute('id') 
								+ '" href="javascript:void(0)"><b>[Show Post?]</b></a>' + ' | ' + repFilter + '</span>');
								$(mutation.target).on("click", "a.showpost", messageListHelper.showHiddenPost);
							}
						}
					}
				}
			}
		}
	});
	msg_observer.observe(document, {
		subtree: true,
		characterData: true,
		childList: true,
		attributes: true
	});
}*/

var messageList = {
	click_expand_thumbnail : function() {
		// rewritten by xdrvonscottx

		if( config.debug ) console.log("finding thumbnails...");
		
		// find all the placeholders before the images are loaded
		var phold = document.getElementsByClassName("img-placeholder");

		for ( var i = 0; i < phold.length; i++) {
			if(phold[i].parentNode.parentNode.getAttribute('class') !== 'userpic-holder') {
				img_observer.observe(phold[i], {
					attributes : true,
					childList: true
				});
			}
		}
	},
	drag_resize_image : function() {
		// console.log(document.getElementsByClassName('img'));
	},
	user_notes : function() {
		if (!config.usernote_notes)
			config.usernote_notes = {};
		document.addEventListener('click', function(tgt) {
			if (tgt.target.id == 'notebook') {
				messageListHelper.openNote(tgt.target);
			}
		});
		messageListHelper.addNotebox(document
				.getElementsByClassName('message-top'));
	},
	ignorator_messagelist : function() {
		if (!config.ignorator)
			return;
		var s;
		ignorated.total_ignored = 0;
		messageListHelper.ignores = config.ignorator_list.split(',');
		for (var r = 0; r < messageListHelper.ignores.length; r++) {
			var d = 0;
			while (messageListHelper.ignores[r].substring(d, d + 1) == ' ') {
				d++;
			}
			messageListHelper.ignores[r] = messageListHelper.ignores[r]
					.substring(d, messageListHelper.ignores[r].length)
					.toLowerCase();
		}
		for (var j = 0; document.getElementsByClassName('message-top')[j]; j++) {
			s = document.getElementsByClassName('message-top').item(j);
			for (var f = 0; messageListHelper.ignores[f]; f++) {
				if (s.getElementsByTagName('a').item(0).innerHTML.toLowerCase() == messageListHelper.ignores[f]) {
					s.parentNode.style.display = 'none';
					if (config.debug)
						console.log('removed post by '
								+ messageListHelper.ignores[f]);
					ignorated.total_ignored++;
					if (!ignorated.data.users[messageListHelper.ignores[f]]) {
						ignorated.data.users[messageListHelper.ignores[f]] = {};
						ignorated.data.users[messageListHelper.ignores[f]].total = 1;
						ignorated.data.users[messageListHelper.ignores[f]].trs = [ j ];
					} else {
						ignorated.data.users[messageListHelper.ignores[f]].total++;
						ignorated.data.users[messageListHelper.ignores[f]].trs
								.push(j);
					}
				}
			}
		}
		messageListHelper.globalPort.postMessage({
			action : 'ignorator_update',
			ignorator : ignorated,
			scope : "messageList"
		});
	},
	imagemap_on_infobar : function() {
		function getUrlVars(urlz) {
			var vars = [], hash;
			var hashes = urlz.slice(urlz.indexOf('?') + 1).split('&');
			for (var i = 0; i < hashes.length; i++) {
				hash = hashes[i].split('=');
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
				if (hash[1] != null && hash[1].indexOf("#") >= 0) {
					vars[hash[0]] = hash[1].slice(0, hash[1].indexOf("#"));
				}
			}
			return vars;
		}

		var divs = document.getElementsByClassName("infobar")[0];
		var get = getUrlVars(window.location.href);
		var page = location.pathname;

		if (page == "/imagemap.php" && get["topic"] != undefined) {
			var as2 = divs.getElementsByTagName("a");
			for (var j = 0; j < as2.length; j++) {
				if (as2[j].href.indexOf("imagemap.php?") > 0) {
					as2[j].href = as2[j].href + "&board=" + get["board"];
				}
			}
			divs.innerHTML = divs.innerHTML
					+ " | <a href='/showmessages.php?board=" + get["board"]
					+ "&topic=" + get["topic"]
					+ "' title='Back to Topic'>Back to Topic</a>";
		} else if (page == "/showmessages.php") {
			divs.innerHTML = divs.innerHTML
					+ " | <a href='/imagemap.php?board=" + get["board"]
					+ "&topic=" + get["topic"]
					+ "' title='Imagemap'>Imagemap</a>";
		}
	},
	batch_uploader : function() {
		var ulBox = document.createElement('input');
		ulBox.type = 'file';
		ulBox.multiple = true;
		// ulBox.value = "Batch Upload";
		ulBox.id = "batch_uploads";
		var ulButton = document.createElement('input');
		ulButton.type = "button";
		ulButton.value = "Batch Upload";
		ulButton.addEventListener('click', messageListHelper.startBatchUpload);
		document.getElementsByClassName('quickpost-body')[0].insertBefore(
				ulBox, null);
		document.getElementsByClassName('quickpost-body')[0].insertBefore(
				ulButton, ulBox);
	},
	post_title_notification : function() {
		// use page visibility api to clear unread post count
		document.addEventListener("visibilitychange", messageListHelper.clearUnreadPosts);
		// keep old event listeners for backup
		document.addEventListener('scroll', messageListHelper.clearUnreadPosts);
		document.addEventListener('mousemove', messageListHelper.clearUnreadPosts);
	},
	quickpost_on_pgbottom : function() {
		chrome.extension.sendRequest({
			need : "insertcss",
			file : "src/css/quickpost_on_pgbottom.css"
		});
	},
	resize_imgs : function() {
		for (var i = 0; document.getElementsByTagName('img')[i]; i++) {
			messageListHelper
					.resizeImg(document.getElementsByTagName('img')[i]);
		}
	},
	loadquotes : function() {
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
	quickpost_tag_buttons : function() {
		var m = document.getElementsByClassName('quickpost-body')[0];
		var txt = document.getElementsByName('message')[0];
		var insM = document.createElement('input');
		insM.value = 'Mod';
		insM.name = 'Mod';
		insM.type = 'button';
		insM.id = 'mod';
		insM.addEventListener("click", messageListHelper.qpTagButton, false);
		var insA = document.createElement('input');
		insA.value = 'Admin';
		insA.name = 'Admin';
		insA.type = 'button';
		insA.addEventListener("click", messageListHelper.qpTagButton, false);
		insA.id = 'adm';
		var insQ = document.createElement('input');
		insQ.value = 'Quote';
		insQ.name = 'Quote';
		insQ.type = 'button';
		insQ.addEventListener("click", messageListHelper.qpTagButton, false);
		insQ.id = 'quote';
		var insS = document.createElement('input');
		insS.value = 'Spoiler';
		insS.name = 'Spoiler';
		insS.type = 'button';
		insS.addEventListener("click", messageListHelper.qpTagButton, false);
		insS.id = 'spoiler';
		var insP = document.createElement('input');
		insP.value = 'Preformated';
		insP.name = 'Preformated';
		insP.type = 'button';
		insP.addEventListener("click", messageListHelper.qpTagButton, false);
		insP.id = 'pre';
		var insU = document.createElement('input');
		insU.value = 'Underline';
		insU.name = 'Underline';
		insU.type = 'button';
		insU.addEventListener("click", messageListHelper.qpTagButton, false);
		insU.id = 'u';
		var insI = document.createElement('input');
		insI.value = 'Italic';
		insI.name = 'Italic';
		insI.type = 'button';
		insI.addEventListener("click", messageListHelper.qpTagButton, false);
		insI.id = 'i';
		var insB = document.createElement('input');
		insB.value = 'Bold';
		insB.name = 'Bold';
		insB.type = 'button';
		insB.addEventListener("click", messageListHelper.qpTagButton, false);
		insB.id = 'b';
		m.insertBefore(insM, m.getElementsByTagName('textarea')[0]);
		m.insertBefore(insQ, insM);
		m.insertBefore(insS, insQ);
		m.insertBefore(insP, insS);
		m.insertBefore(insU, insP);
		m.insertBefore(insI, insU);
		m.insertBefore(insB, insI);
		m.insertBefore(document.createElement('br'), insB);
	},
	filter_me: function() {
		var tops = document.getElementsByClassName('message-top');
		if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
			// anonymous topic - check quickpost-body for human number
			var human = document.getElementsByClassName('quickpost-body')[0]
				.getElementsByTagName('a')[0].innerText.replace('Human #', '');
			if (isNaN(human)) {
				// user hasn't posted in topic
				return;
			}
			var me = '&u=-' + human;
		} else {
			var me = '&u=' + document.getElementsByClassName('userbar')[0]
				.getElementsByTagName('a')[0].href
				.match(/\?user=([0-9]+)/)[1];
		}
		var txt = 'Filter Me';
		var topic = window.location.href.match(/topic=([0-9]+)/)[1];
		var fmh;
		if (window.location.href.indexOf(me) == -1) {
			fmh = window.location.href.split('?')[0] + '?topic=' + topic + me;
		} else {
			fmh = window.location.href.replace(me, '');
			txt = 'Unfilter Me';
		}
		document.getElementsByClassName('infobar')[0].innerHTML += ' | <a href="' 
				+ fmh + '">' + txt + '</a>';
	},
	expand_spoilers : function() {
		var ains = document.createElement('span');
		ains.id = 'chromell_spoilers';
		document.addEventListener('click', messageListHelper.toggleSpoilers,
				false);
		ains.innerHTML = ' | <a href="##" id="chromell_spoiler">Expand Spoilers</a>';
		var la = document.getElementsByClassName('infobar')[0]
				.getElementsByClassName('a');
		document.getElementsByClassName('infobar')[0].insertBefore(ains,
				la[la.size]);
	},
	drop_batch_uploader : function() {
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
	highlight_tc : function() {
		var tcs = messageListHelper.getTcMessages();
		if (!tcs)
			return;
		for (var i = 0; i < tcs.length; i++) {
			if (config.tc_highlight_color) {
				tcs[i].getElementsByTagName('a')[0].style.color = '#'
						+ config.tc_highlight_color;
			}
		}
	},
	label_tc : function() {
		var tcs = messageListHelper.getTcMessages();
		if (!tcs)
			return;
		var ipx, inner;
		for (var i = 0; i < tcs.length; i++) {
			ipx = document.createElement('span');
			inner = ' | <b>TC</b>';
			if (config.tc_label_color != '') {
				inner = ' | <font color="#' + config.tc_label_color
						+ '"><b>TC</b></font>';
			}
			ipx.innerHTML = inner;
			tcs[i].insertBefore(ipx,
					tcs[i].getElementsByTagName('a')[0].nextSibling);
		}
	},
	label_self_anon : function() {
		if (!window.location.href.match('archives')) {
			var tops = document.getElementsByClassName('message-top');
			if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {				
				var self = document.getElementsByClassName('quickpost-body')[0]
						.getElementsByTagName('a')[0].innerText;
				var top, humanToCheck, span;
				for (var i = 0, len = tops.length; i < len; i++) {
					top = tops[i];
					humanToCheck = top.getElementsByTagName('a')[0];
					if (humanToCheck.innerText == self) {			
							span = document.createElement('span');
							span.innerHTML = ' | <b>(Me)</b>';
							top.insertBefore(span, humanToCheck.nextSibling);
					}
				}
			}
		}
	},
	post_before_preview : function() {
		var m = document.getElementsByClassName('quickpost-body')[0]
				.getElementsByTagName('input');
		var preview;
		var post;
		for (var i = 0; m[i]; i++) {
			if (m[i].name == 'preview') {
				preview = m[i];
			}
			if (m[i].name == 'post') {
				post = m[i];
			}
		}
		post.parentNode.removeChild(post);
		preview.parentNode.insertBefore(post, preview);
	},
	like_button: function() {
		if (!window.location.href.match("archives")) {
			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.src = chrome.extension.getURL("src/js/like.js");
			head.appendChild(script);
			for (var i = 0; document.getElementsByClassName("message-top").item(i); i++) {
				document.getElementsByClassName("message-top").item(i).getElementsByTagName("a")[2] &&
				(document.getElementsByClassName("message-top").item(i).innerHTML 
						+= ' | <a href="##like' + i + '" onclick="like(this);">Like</a>')
			}
		}
	},
	hide_deleted : function() {
		var msgs = document.getElementsByClassName('message-container');
		for (var i = 0; msgs[i]; i++) {
			if (msgs[i].getElementsByClassName('message-top')[0]
					.getElementsByTagName('em')[0]
					&& msgs[i].getElementsByClassName('message-top')[0]
							.getElementsByTagName('em')[0].innerHTML !== 'Moderator') {
				msgs[i].getElementsByClassName('message-body')[0].style.display = 'none';
				var a = document.createElement('a');
				a.href = '##' + i;
				a.innerHTML = 'Show Message';
				a.addEventListener('click', function(evt) {
					var msg = evt.target.parentNode.parentNode
							.getElementsByClassName('message-body')[0];
					console.log(evt.target);
					msg.style.display === 'none' ? msg.style.display = 'block'
							: msg.style.display = 'none';
				});
				msgs[i].getElementsByClassName('message-top')[0].innerHTML += ' | ';
				msgs[i].getElementsByClassName('message-top')[0].insertBefore(
						a, null);
			}
		}
	},
	number_posts : function() {
		var page;
		if (!window.location.href.match(/page=/)) {
			page = 1;
		} else {
			page = window.location.href.match(/page=(\d+)/)[1];
		}
		var posts = document.getElementsByClassName('message-container');
		var id;
		for (var i = 0; posts[i]; i++) {
			var postnum = document.createElement('span');
			postnum.className = "PostNumber";
			id = ((i + 1) + (50 * (page - 1)));
			if (id < 1000)
				id = "0" + id;
			if (id < 100)
				id = "0" + id;
			if (id < 10)
				id = "0" + id;
			postnum.innerHTML = " | #" + id;
			postnum.id = "message-number";
			posts[i].getElementsByClassName('message-top')[0].insertBefore(
					postnum, null);
		}
	},
	post_templates : function() {
		var sep, sepIns, qr;
		var cDiv = document.createElement('div');
		cDiv.style.display = 'none';
		cDiv.id = 'cdiv';
		document.body.insertBefore(cDiv, null);
		messageListHelper.postEvent = document.createEvent('Event');
		messageListHelper.postEvent.initEvent('postTemplateInsert', true, true);
		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.src = chrome.extension.getURL('src/js/topicPostTemplate.js');
		document.getElementsByTagName('head')[0].appendChild(newScript);
		for (var i = 0; document.getElementsByClassName('message-top')[i]; i++) {
			if (document.getElementsByClassName('message-top')[i].parentNode.className != 'quoted-message') {
				sep = document.createElement('span');
				sep.innerHTML = " | ";
				sep.className = "post_template_holder";
				sepIns = document.createElement('span');
				sepIns.className = 'post_template_opts';
				sepIns.innerHTML = '[';
				qr = document.createElement('a');
				qr.href = "##" + i;
				qr.innerHTML = "&gt;"
				qr.className = "expand_post_template";
				sepIns.addEventListener("click",
						messageListHelper.postTemplateAction);
				sepIns.insertBefore(qr, null);
				sepIns.innerHTML += ']';
				sep.insertBefore(sepIns, null);
				document.getElementsByClassName('message-top')[i].insertBefore(
						sep, null);
			}
		}
	},
	userhl_messagelist : function() {
		if (!config.enable_user_highlight)
			return;
		var messages = document.getElementsByClassName('message-container');
		var user;
		if (!config.no_user_highlight_quotes) {
			for (var i = 0; messages[i]; i++) {
				for (var k = 0; messages[i]
						.getElementsByClassName('message-top')[k]; k++) {
					try {
						user = messages[i]
								.getElementsByClassName('message-top')[k]
								.getElementsByTagName('a')[0].innerHTML
								.toLowerCase();
					} catch (e) {
						break;
					}
					if (config.user_highlight_data[user]) {
						if (config.debug)
							console.log('highlighting post by ' + user);
						messages[i].getElementsByClassName('message-top')[k].style.background = '#'
								+ config.user_highlight_data[user].bg;
						messages[i].getElementsByClassName('message-top')[k].style.color = '#'
								+ config.user_highlight_data[user].color;
						for (var j = 0; messages[i]
								.getElementsByClassName('message-top')[k]
								.getElementsByTagName('a')[j]; j++) {
							messages[i].getElementsByClassName('message-top')[k]
									.getElementsByTagName('a')[j].style.color = '#'
									+ config.user_highlight_data[user].color;
						}
					}
				}
			}
		} else {
			for (var i = 0; messages[i]; i++) {
				user = messages[i].getElementsByClassName('message-top')[0]
						.getElementsByTagName('a')[0].innerHTML.toLowerCase();
				if (config.user_highlight_data[user]) {
					if (config.debug)
						console.log('highlighting post by ' + user);
					messages[i].getElementsByClassName('message-top')[0].style.background = '#'
							+ config.user_highlight_data[user].bg;
					messages[i].getElementsByClassName('message-top')[0].style.color = '#'
							+ config.user_highlight_data[user].color;
					for (var j = 0; messages[i]
							.getElementsByClassName('message-top')[0]
							.getElementsByTagName('a')[j]; j++) {
						messages[i].getElementsByClassName('message-top')[0]
								.getElementsByTagName('a')[j].style.color = '#'
								+ config.user_highlight_data[user].color;
					}
				}
			}
		}
	},
	foxlinks_quotes : function() {
		commonFunctions.foxlinks_quote();
	},
	load_next_page : function() {
		document.getElementById('u0_3').addEventListener('dblclick',
				messageListHelper.loadNextPage);
	},
	pm_title : function() {
		var me = document.getElementsByClassName('userbar')[0]
				.getElementsByTagName('a')[0].innerHTML.match(/(.*) \(\d+\)/)[1];
		var other = '';
		for (var i = 0; document.getElementsByClassName('message-top')[i]; i++) {
			if (document.getElementsByClassName('message-top')[i]
					.getElementsByTagName('a')[0].innerHTML !== me) {
				other = document.getElementsByClassName('message-top')[i]
						.getElementsByTagName('a')[0].innerHTML;
				break;
			}
		}
		document.title = "PM - " + other;
	},
	snippet_listener : function() {
		var ta = document.getElementsByName('message')[0];
		var text, range, word, caret, snippet;
		ta.addEventListener('keydown', function(event) {
			if (event.keyIdentifier == 'U+0009') {
				// prevent default action for tab key so we can attach our own
				event.preventDefault();
				caret = messageListHelper.findCaret(ta);
				messageListHelper.snippetHandler(ta.value, caret);
			}
		});
	}
}

var messageListHelper = {
	ignores : {},
	gfycatLoader : function() {
		var gfycats = document.getElementsByClassName('gfycat');
		gfycats = Array.prototype.slice.call(gfycats);
		var gfycat, position, height;
		height = window.innerHeight;
		for (var i = 0, len = gfycats.length; i < len; i++) {
			gfycat = gfycats[i];
			// check whether element is visible to user
			position = gfycat.getBoundingClientRect();
			if (position.top > height) {
				// ignore hidden elements
			}
			else if (gfycat.getAttribute('name') != 'embedded'
					&& gfycat.getAttribute('name') != 'placeholder') {
				messageListHelper.placeholderGfy(gfycat);
			}
			else if (gfycat.getAttribute('name') == 'placeholder') {
				messageListHelper.embedGfy(gfycat);
			}
		}
	},
	autoscrollCheck : function (mutation) {
		var elPosition = mutation.getBoundingClientRect();
		if (mutation.style.display == 'none'
				|| document.getElementById('following') 
				|| document.getElementById('takemeback') 
				|| document.getElementById('divtop')
				|| elPosition.top > window.innerHeight) {
			return false;
		} else {
			return true;
		}
	},
	findCaret : function(ta) {
		var caret = 0;
		if (ta.selectionStart || ta.selectionStart == '0') {
			caret = ta.selectionStart; 
		}
		return (caret);
	},
	snippetHandler : function(ta, caret) {
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
		for (var key in config.snippet_data) {
			if (key === word) {
				snippet = config.snippet_data[key];
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
	},
	addDivListeners : function(div, divAlert, divTop, divMsg, oldPosition, mutation) {
		var divScroll = document.getElementById('scrollpost');
		var divShow = document.getElementById('showinpopup');
		var divClose = document.getElementById('closepopup');
		var divFollow, divReturn;
		// listener for [Scroll to post] option
		divScroll.addEventListener('click', function() {
			$.scrollTo((mutation), 800);
			divAlert.innerHTML = '<div class = "message-top">' 
				+ '<a id="takemeback" href="javascript:void(0)"><b>[Click to return]</b></a> | '
				+ '<a id="scrollnew" href="javascript:void(0)"><b>[Follow live posts]</b></a> | '
				+ '<a id="closepopup" href="javascript:void(0)"><b>[x]</b></a>'
				+ '</div>';		 
			divReturn = document.getElementById('takemeback');
			divReturn.addEventListener('click', function() {
				$.scrollTo((oldPosition), 500);
				$(div).animate({'margin-bottom': '-100%', 'opacity': '0'},
					{queue: false, duration: 500});
				setTimeout(function() {
					$('body').find(div).remove();
				}, 500); 
			}); 
			divFollow = document.getElementById('scrollnew');
			divFollow.addEventListener('click', function() {
				divAlert.innerHTML = '<div class = "message-top">'
					+ '<a id="following" href="javascript:void(0)"><b>[Following new posts - click to cancel]</b></a>'
					+ '</div>';
				// removing element with id of "following" disables autoscroll
				document.getElementById('following').addEventListener('click', function() {
					$(div).animate({'margin-bottom': '-100%', 'opacity': '0'},
						{queue: false, duration: 500});
					setTimeout(function() {
						$('body').find(div).remove();
					}, 500); 
				});
			});
			document.getElementById('closepopup').addEventListener('click', function() {
				$(div).animate({'margin-bottom': '-100%', 'opacity': '0'},
					{queue: false, duration: 500});
				setTimeout(function() {
					$('body').find(div).remove();
				}, 500); 
			});			
		});		
		// listener for [Show in popup] option
		divShow.addEventListener('click', function() {
			$(document).find(divAlert).remove();
			$(div).append(divTop);
			$(div).append(divMsg);
			// setTimeout to prevent 'click' function from firing as soon as div is displayed
			setTimeout(function () {
				div.addEventListener('click', function() {
					$(div).animate({'margin-bottom': '-100%', 'opacity': '0'},
						{queue: false, duration: 500});
					setTimeout(function() {
						$('body').find(div).remove();
					}, 500); 
				});
			}, 50);
		});		
		// listener for [x] option (closes popup)
		divClose.addEventListener('click', function() {
			$(div).animate({'margin-bottom': '-100%', 'opacity': '0'},
				{queue: false, duration: 500});
			setTimeout(function() {
				$('body').find(div).remove();
			}, 500); 
		});
	},
	startBatchUpload : function(evt) {
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
	postTemplateAction : function(evt) {
		if (evt.target.className === "expand_post_template") {
			var ins = evt.target.parentNode;
			ins.removeChild(evt.target);
			var ia = document.createElement('a');
			ia.innerHTML = "&lt;"
			ia.className = "shrink_post_template";
			ia.href = '##';
			ins.innerHTML = '[';
			ins.insertBefore(ia, null);
			for ( var i in config.post_template_data) {
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
		if (evt.target.className === "shrink_post_template") {
			var ins = evt.target.parentNode;
			evt.target.parentNode.removeChild(evt.target);
			var ia = document.createElement('a');
			ia.innerHTML = "&gt;"
			ia.className = "expand_post_template";
			ia.href = '##';
			ins.innerHTML = '[';
			ins.insertBefore(ia, null);
			ins.innerHTML += ']';
		}
		if (evt.target.className === "post_template_title") {
			evt.target.id = 'post_action';
			var cdiv = document.getElementById('cdiv');
			var d = {};
			d.text = config.post_template_data[evt.target.parentNode.className].text;
			cdiv.innerText = JSON.stringify(d);
			cdiv.dispatchEvent(messageListHelper.postEvent);
		}
	},
	getTcMessages : function() {
		if (!config.tcs)
			config.tcs = {};
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
			if (!config.tcs[topic]) {
				console.log('Unknown TC!');
				return;
			}
			tc = config.tcs[topic].tc;
		}
		if (!config.tcs[topic]) {
			config.tcs[topic] = {};
			config.tcs[topic].tc = tc;
			config.tcs[topic].date = new Date().getTime();
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
		messageListHelper.saveTcs();
		return tcs;
	},
	toggleSpoilers : function(el) {
		if (el.srcElement.id != 'chromell_spoiler') {
			return;
		}
		var spans = document.getElementsByClassName('spoiler_on_close');
		var nnode;
		for (var i = 0; spans[i]; i++) {
			nnode = spans[i].getElementsByTagName('a')[0];
			messageListHelper.toggleSpoiler(nnode);
		}
	},
	toggleSpoiler : function(obj) {
		while (!/spoiler_(?:open|close)/.test(obj.className)) {
			obj = obj.parentNode;
		}
		obj.className = obj.className.indexOf('closed') != -1 ? obj.className
				.replace('closed', 'opened') : obj.className.replace('opened',
				'closed');
		return false;
	},
	expandThumbnail : function(evt) {
		if (config.debug)
			console.log("in expandThumbnail");
		var num_children = evt.target.parentNode.parentNode.childNodes.length;
		// first time expanding - only span
		if (num_children == 1) {
			if (config.debug)
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
			newspan.insertBefore(newimg);
			evt.target.parentNode.parentNode.insertBefore(newspan,
					evt.target.parentNode);
			evt.target.parentNode.style.display = "none"; // hide old img
		}
		// has been expanded before - just switch which node is hidden
		else if (num_children == 2) {
			if (config.debug)
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
		} else if (config.debug)
			console
					.log("I don't know what's going on with this image - weird number of siblings");
	},
	dragEvent : false,
	dragEventUpdater : function(evt) {
		if (messageListHelper.dragEvent) {
			console.log(evt);
		}
	},
	addNotebox : function(tops) {
		if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
			if (config.debug) {
				console.log('HA Topic - skipping usernotes');
			}
			return;
		}
		var top;
		for (var i = 0, len = tops.length; i < len; i++) {
			top = tops[i];
			// check to prevent problems when anon posts are quoted in normal topics
			if (top.getElementsByTagName('a')[0].innerText != "⇗") {
				var notebook = document.createElement('a');
				notebook.id = 'notebook';
				top.innerHTML += " | ";
				var tempID = top.getElementsByTagName('a')[0].href
						.match(/user=(\d+)$/i)[1];
				notebook.innerHTML = (config.usernote_notes[tempID] != undefined && config.usernote_notes[tempID] != '') ? 'Notes*'
						: 'Notes';
				notebook.href = "##note" + tempID;
				top.appendChild(notebook);
			}
		}
	},
	openNote : function(el) {
		var userID = el.href.match(/note(\d+)$/i)[1];
		if (document.getElementById("notepage")) {
			var pg = document.getElementById('notepage');
			userID = pg.parentNode.getElementsByTagName('a')[0].href
					.match(/user=(\d+)$/i)[1];
			config.usernote_notes[userID] = pg.value;
			pg.parentNode.removeChild(pg);
			messageListHelper.saveNotes();
		} else {
			var note = config.usernote_notes[userID];
			page = document.createElement('textarea');
			page.id = 'notepage';
			page.value = (note == undefined) ? "" : note;
			page.style.width = "100%";
			page.style.opacity = '.6';
			el.parentNode.appendChild(page);
		}
	},
	saveNotes : function() {
		chrome.extension.sendRequest({
			need : "save",
			name : "usernote_notes",
			data : config.usernote_notes
		}, function(rsp) {
			console.log(rsp);
		});
	},
	resizeImg : function(el) {
		// console.log(el.width, config.img_max_width);
		var width = el.width;
		if (width > config.img_max_width) {
			if (config.debug)
				console.log('resizing:', el);
			el.height = (el.height / (el.width / config.img_max_width));
			el.parentNode.style.height = el.height + 'px';
			el.width = config.img_max_width;
			el.parentNode.style.width = config.img_max_width + 'px';
		}
	},
	saveTcs : function() {
		var max = 40;
		var lowest = Infinity;
		var lowestTc;
		var numTcs = 0;
		for ( var i in config.tcs) {
			if (config.tcs[i].date < lowest) {
				lowestTc = i;
				lowest = config.tcs[i].date;
			}
			numTcs++;
		}
		if (numTcs > max)
			delete config.tcs[lowestTc];
		chrome.extension.sendRequest({
			need : "save",
			name : "tcs",
			data : config.tcs
		});
	},
	clearUnreadPosts : function(evt) {
		if (messageListHelper.hasJustScrolled) {
			messageListHelper.hasJustScrolled = false;
			return;
		}
		if (document.hidden) {
			return;
		}
		if (document.title.match(/\(\d+\+?\)/)) {
			var newTitle = document.title.replace(/\(\d+\+?\) /, "");
			document.title = newTitle;
			// chrome bug, title does not always update on windows
			// setTimeout(function(){
			// document.title = newTitle;
			// }, 500);
		}
	},
	quoteHandler: function() {
		var that = this;
		var bgColor = $(event.target.parentNode).css('background-color');
		// create hidden notification so we can use fadeIn() later
		$(that).append($('<span id="copied" style="display: none; position: absolute; z-index: 1; left: 100; ' 
				+ 'background: ' + bgColor 
				+ ';"><a href="javascript.void(0)">&nbsp<b>[copied to clipboard]</b></a></span>'));
		var quoteID = that.id;
		var quotedMsg = document.querySelector('[msgid="' + quoteID + '"]');
		var html = quotedMsg.innerHTML;
		var htmlElements = quotedMsg.getElementsByTagName("*");
		var htmlToRemove, htmlElement, imageHandled, first, last, pre;
		var link = {};
		var spoiler = {};
		var quote = {};
		// remove sig from html
		if (html.indexOf('---') > -1) {
			html = '<quote msgid="' + quoteID + '">' + html.substring(0, (html.lastIndexOf('---'))) + '</quote>';
		} else {
			html = '<quote msgid="' + quoteID + '">' + html + '</quote>';
		}
		for (var i = 0, len = htmlElements.length; i < len; i++) {
			// iterate through elements in document and find/replace relevant parts of copied html
			// so that formatting is maintained in quoted post
			htmlElement = htmlElements[i];
			link.content = '';
			imageHandled = false;
			if (htmlElement.className == 'pr') {
				// handle pre tags
				pre = htmlElement.outerHTML;
				pre = pre.replace('<span class="pr">', '<pre>');
				pre = pre.replace('</span>', '</pre>');
				html = html.replace(htmlElement.outerHTML, pre);
			}
			if (htmlElement.firstChild) {
				//  handle images
				if (htmlElement.firstChild.className == 'img-loaded' 
						&& htmlElement.outerHTML.indexOf('<span class="img-loaded"') !== 0) {
					link.content = htmlElement.firstChild.innerHTML;
					link.content = link.content.replace('<img src="', '');
					link.first = link.content.indexOf('"');
					link.last = link.content.indexOf('">');
					link.toRemove = link.content.substring(link.first, link.last);
					link.content = link.content.replace(link.toRemove, '');
					link.content = link.content.replace('">', '');
					link.content = link.content.replace('//', 'http://');
					link.content = link.content.replace('dealtwith.it', 'endoftheinter.net');
					link.content = '<img src="' + link.content + '" />' + "\n";
					imageHandled = true;
				} else if (htmlElement.firstChild.className == 'img-placeholder' 
						&& htmlElement.outerHTML.indexOf('<span class="img-placeholder"') !== 0) {
					link.content = htmlElement.outerHTML;
					link.first = link.content.indexOf('imgsrc="');
					link.last = link.content.indexOf('" href');
					link.toRemove = link.content.substring(0, link.first);
					link.content = link.content.replace(link.toRemove, '');
					link.toRemove = link.content.substring(link.last, link.content.length);
					link.content = link.content.replace(link.toRemove, '');
					link.content = link.content.replace('imgsrc="', '');
					link.content = link.content.replace(' href="//images.en', '');
					link.content = '<img src="' + link.content + ' />' + "\n";
					imageHandled = true;
				}
			}
			if (htmlElement.tagName == 'A' && !imageHandled) {
				// handle links
				if (htmlElement.title.indexOf("/showmessages.php") > -1) {
					link.content = htmlElement.title.replace('/showmessages.php'
							, 'http://boards.endoftheinter.net/showmessages.php');
				} else if (htmlElement.className == 'jump-arrow' 
						|| htmlElement.id == 'notebook' 
						|| htmlElement.parentElement.attributes.className == 'spoiler_on_close' 
						|| htmlElement.parentElement.attributes.className == 'spoiler_on_open' 
						|| htmlElement.outerHTML.indexOf('<a class="caption" href="#">') == 0) {
					// ignore these elements
					link.content = '';
				} else {
					link.content = htmlElement.href;
				}
			}
			if (link.content) {
				html = html.replace(htmlElement.outerHTML, link.content);
			}
			if (htmlElement.className == 'spoiler_closed') {
				// handle spoiler tagged content
				spoiler.contents = '';
				spoiler.toReplace = htmlElement.outerHTML;
				spoiler.closed = htmlElement.getElementsByClassName('spoiler_on_close');
				spoiler.open = spoiler.closed[0].nextSibling.innerText;
				spoiler.title = spoiler.closed[0].innerText.replace(/<|\/>/g, '');
				first = spoiler.closed[0].innerText.replace(' />', '>');
				last = first.replace('<', '</');
				if (spoiler.closed[0].getElementsByClassName('imgs')) {
					spoiler.imgs = htmlElement.getElementsByClassName('imgs');
					for (var j = 0, l = spoiler.imgs.length; j < l; j++) {
						spoiler.img = spoiler.imgs[j];
						spoiler.imgurl = spoiler.img.firstChild.getAttribute('imgsrc');
						spoiler.contents += '<img src="' + spoiler.imgurl + '" />' + '\n';
					}
					spoiler.finished = '<spoiler caption="' + spoiler.title + '">' + spoiler.contents + '</spoiler>';
				} else {
					spoiler.contents = spoiler.open.replace(first, '');
					spoiler.contents = spoiler.contents.replace(last, '');
					spoiler.finished = '<spoiler caption="' + spoiler.title + '">' + spoiler.contents + '</spoiler>';
				}
				if (html.indexOf(spoiler.toReplace) > -1) {
					html = html.replace(spoiler.toReplace, spoiler.finished);
				}
			}
			if (htmlElement.className == 'quoted-message') {
				quote.msgid = htmlElement.attributes.msgid.value;
				if (!quote.msgid) {
					quote.finished = '<quote>' + htmlElement.innerText + '</quote>';
				} else if (htmlElement.lastChild.data) {
					quote.finished = '<quote msgid="' + quote.msgid + '">' + htmlElement.lastChild.data + '</quote>';
				} else if (htmlElement.getElementsByClassName('thumbnailed_image')) {
					quote.html = htmlElement.lastChild.innerHTML;
					first = quote.html.indexOf('imgsrc="');
					last = quote.html.indexOf('lass="');
					quote.img = quote.html.substring(first, last);
					quote.img = quote.img.replace(/imgsrc/g, '<img src');
					quote.img = quote.img.replace(/" c/g, '" />');
					quote.finished = '<quote msgid="' + quote.msgid + '">' + quote.img + '</quote>';
				}
				// todo - maintain proper html for nested quotes
				quote.finished = quote.finished.replace(/|⇗ | Notes/g, '');
				html = html.replace(htmlElement.outerHTML, quote.finished);
			}
		}
		// clean up html
		html = html.replace(/<div class="imgs">/g, '');
		html = html.replace(/<div style="clear:both">/g, '');
		html = html.replace(/<\/div>/g, '');
		html = html.replace(/<br>/g, '');
		html = html.replace(/&lt;/g, '<');
		html = html.replace(/&gt;/g, '>');
		// plain text quoting - needs separate option
		/*var text = quotedMsg.innerText;
		var quotedText = '<quote msgid="' + quoteID + '">' + text.substring(0, (text.lastIndexOf('---') - 1)) + '</quote>';*/
		var json = {
			"quote": ""
		};
		json.quote = html;
		chrome.runtime.sendMessage(json, function(response) {
			// copies json data to clipboard
			if (config.debug) console.log(response.clipboard);
		});
		$("#copied").fadeIn(200);
		setTimeout(function() {
			$(that).find("span:last").fadeOut(400);
		}, 1500);
		setTimeout(function() {
			$(that).find("span:last").remove();
		}, 2000);
	},
	archiveQuoteButtons: function() {
		var hostname = window.location.hostname;
		var topicId = window.location.search.replace("?topic=", "");
		var links;
		var msgs;
		var containers;
		var container;
		var tops = [];
		var msgId;
		var quote;
		if (hostname.indexOf("archives") > -1) {
			links = document.getElementsByTagName("a");
			msgs = document.getElementsByClassName("message");
			containers = document.getElementsByClassName("message-container");
			for (var i = 0, len = containers.length; i < len; i++) {
				container = containers[i];
				tops[i] = container.getElementsByClassName("message-top")[0];
				msgId = msgs[i].getAttribute("msgid");
				quote = document.createElement("a");
				quoteText = document.createTextNode("Quote");
				space = document.createTextNode(" | ");
				quote.appendChild(quoteText);
				quote.href = "javascript:void(0)";
				quote.id = msgId;
				quote.className = "archivequote";
				tops[i].appendChild(space);
				tops[i].appendChild(quote);
			}
		}
		// todo - event handler/links for plain text quoting
		$("div.message-top").on("click", "a.archivequote", messageListHelper.quoteHandler);
	},
	init : function() {
		messageListHelper.archiveQuoteButtons();
		chrome.extension.sendRequest({
			need : "config",
			tcs : true
		}, function(conf) {
			messageListHelper.globalPort = chrome.extension.connect();
			config = conf.data;
			config.tcs = conf.tcs;
			/*if (config.ignorate_by_rep) {
					repIgnorator();
					messageListHelper.getUserIds();
			}*/
			var pm = '';
			if (window.location.href.match('inboxthread'))
				pm = "_pm";
			for ( var i in messageList) {
				if (config[i + pm]) {
					try {
						messageList[i]();
					} catch (err) {
						console.log("error in " + i + ":", err);
					}
				}
			}
			if (config.embed_gfycat) {
				setTimeout(function() {
					messageListHelper.gfycatLoader();
				}, 500);
				window.addEventListener('scroll', messageListHelper.gfycatLoader);
			}
			messageListHelper.globalPort.onMessage.addListener(function(msg) {
				switch (msg.action) {
				case "ignorator_update":
					messageListHelper.globalPort.postMessage({
						action : 'ignorator_update',
						ignorator : ignorated,
						scope : "messageList"
					});
					break;
				case "showIgnorated":
					if (config.debug)
						console.log("showing hidden msg", msg.ids);
					var tr = document.getElementsByClassName('message-top');
					for (var i = 0; i < msg.ids.length; i++) {
						if (config.debug)
							console.log(tr[msg.ids[i]]);
						tr[msg.ids[i]].parentNode.style.display = 'block';
						tr[msg.ids[i]].parentNode.style.opacity = '.7';
					}
					break;
				default:
					if (config.debug)
						console.log('invalid action', msg);
					break;
				}
			});

			if (config.new_page_notify) {
				if (config.debug) {
					console.log('listening for new page');
				}

				var target = document.getElementById('nextpage');
				var observer = new MutationObserver(function(mutations) {
					mutations.forEach(function(mutation) {
						if (mutation.type === 'attributes' && target.style.display === 'block') {
							chrome.extension.sendRequest({
								need: "notify",
								title: "New Page Created",
								message: document.title
							});
						}
					});
				});
				var obsconfig = {
					attributes: true
				};
				observer.observe(target, obsconfig);
			}
		});
	},
	loadNextPage : function() {
		var page = 1;
		if (window.location.href.match('asyncpg')) {
			page = parseInt(window.location.href.match('asyncpg=(\d+)')[1]);
		} else if (window.location.href.match('page')) {
			page = parseInt(window.location.href.match('page=(\d+)')[1]);
		}
		page++;
		var topic = window.location.href.match('topic=(\d+)')[1];
	},
	qpTagButton : function(e) {
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
	livelinks : function(mutation) {
	console.log(mutation);
		var pm = '';
		if (window.location.href.match('inboxthread'))
			pm = "_pm";
			for (var i in messageListLivelinks) {
				if (config[i + pm]) {
					try {
						messageListLivelinks[i](mutation);
					} catch (err) {
						console.log("error in livelinks " + i + ":", err);
					}
				}
			}
	},
	wikiFix: function() {
		window.open(this.href.replace("boards", "wiki"));
	},
	imageFix: function () {
		window.open(this.href.replace("boards", "images"));
	},
	placeholderGfy: function(gfyLink) {
		var url, splitURL, code, xhrURL, xhr, temp, width, height, position;
		url = gfyLink.getAttribute('href');
		splitURL = url.split('/').slice(-1);
		code = splitURL.join('/');
		xhrURL = 'http://gfycat.com/cajax/get/' + code;
		xhr = new XMLHttpRequest();
		xhr.open("GET", xhrURL, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				// gfycat api provides width & height
				temp = JSON.parse(xhr.responseText);
				width = temp.gfyItem.width;
				height = temp.gfyItem.height;
				url = temp.gfyItem.webmUrl;
				if (config.resize_gfys 
						&& width > config.gfy_max_width) {
					// scale iframe to match gfy_max_width value
					height = (height / (width / config.gfy_max_width));
					width = config.gfy_max_width;
				}
				// create placeholder
				gfyLink.outerHTML = '<div class="gfycat" name="placeholder" id="' + url + '">' 
						+ '<video width="' + width + '" height="' + height + '" autoplay loop >'
						+ '</video></div>';
				// check if placeholder is visible
				position = document.getElementById(url).getBoundingClientRect();
				if (position.top > window.innerHeight) {
					return;
				} else {
					messageListHelper.gfycatLoader();
				}
			}
		}
		xhr.send();
	},
	embedGfy: function(gfycat) {
		console.log(gfycat);
		var video = gfycat.getElementsByTagName('video')[0];
		gfycat.setAttribute('name', 'embedded');
		video.src = gfycat.id;
	},
	embedYoutube: function() {
		var that = this;
		if (!that.embedded) {
			var toEmbed = document.getElementById(that.id);
			if (toEmbed.className == "youtube") {		
				var color = $("table.message-body tr td.message").css("background-color");
				var videoCode;
				var embedHTML;
				var regExp = /^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/;
				var match = that.id.match(regExp);
				if (match && match[2].length == 11) {
					videoCode = match[2];
				} else {
					videoCode = match;
				}
				embedHTML = "<span style='display: inline; position: absolute; z-index: 1; left: 100; background: " + color + ";'>" 
									+ "<a id='" + that.id + "' class='hide' href='javascript:void(0)'>&nbsp<b>[Hide]</b></a></span>" 
									+ "<br><div class='youtube'>" 
									+ "<iframe id='" + "yt" + that.id + "' type='text/html' width='640' height='390'" 
									+ "src='https://www.youtube.com/embed/" + videoCode + "?autoplay='0' frameborder='0'/>" 
									+ "</div>";
				$(toEmbed).find("span:last").remove();
				toEmbed.className = "hideme";
				toEmbed.innerHTML += embedHTML;
				that.embedded = true;
			}
		}
	},
	hideYoutube: function() {
		var that = this;
		if (!that.hidden) {
			var toEmbed = document.getElementById(that.id);
			$(toEmbed).find("iframe:last").remove();
			$(toEmbed).find("br:last").remove();
			$(toEmbed).find("div:last").remove();
			toEmbed.className = "youtube";
			that.hidden = true;
		}
	}//,
	/*showHiddenPost: function() {
	// shows posts hidden by rep ignorator
	// (doesn't work for quoted posts - yet)
		var that = this;
		var messageContainer = document.getElementById(that.id);
		var messageBody = messageContainer.getElementsByClassName('message-body')[0];
		console.log(messageContainer);
		console.log(messageBody);
		if (messageBody.style.display = 'none') {
			messageContainer.style.opacity = 1;
			messageBody.style.display = 'inline';
		} else if (messageBody.style.display = 'inline') {
			messageContainer.style.opacity = 0.15;
			messageBody.style.display = 'none';
		}
	}
	getUserIds: function() {
		var links = ($("div.message-top").find("a"));
		var allIds = [];
		var id;
		for (var i = 0, len = links.length; i < len; i++) {
			link = links[i];
			if (link.href.indexOf('profile.php?user=') > -1) {
					id = link.href.match(/\?user=([0-9]+)/)[1];
					allIds.push(parseInt(id));
			}
		}
		usersFromPage = allIds.filter(function(elem, pos) {
			return allIds.indexOf(elem) == pos;
		})
		messageListHelper.checkUserIds();
	},
	checkUserIds: function() {
		userFilter = config.rep_ignorator_userids;
		checkedUsers = config.rep_ignorator_checked;
		token = config.rep_ignorator_token;
		if (!userFilter && !checkedUsers && !token) {
			// wait for config
			configTimeout = setTimeout(repIgnorator.checkUserIds, 100);
			return;
		} else {
			clearTimeout(configTimeout);
			var json = {
					"tok": "",
					"users": []
			};
			var usersForRequest = [];
			// request contains unique ids from page that havent already been checked
			usersForRequest = $(usersFromPage).not(checkedUsers).get();
			json.tok = token;
			json.users = usersForRequest;
			console.log(json);
			if (json.users.length == 0) {
					console.log("nope");
					return;
			}
			var xhr = new XMLHttpRequest();
			// need to set up server before we can use any of this
			var url = ''
			xhr.open("POST", url, true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4 && xhr.status == 200) {
					var temp = JSON.parse(xhr.responseText);
					console.log(temp);
					if (temp.err == "pending") {
					console.log("server response not ready yet");
					return;
					}
					else {
					// cache response
					config.rep_ignorator_userids = temp.users.concat(userFilter);
					config.rep_ignorator_checked = usersForRequest.concat(checkedUsers);
					
					chrome.extension.sendRequest({
					need : "save",
					name : "rep_ignorator_userids",
					data : config.rep_ignorator_userids
					});
					chrome.extension.sendRequest({
					need : "save",
					name : "rep_ignorator_checked",
					data : config.rep_ignorator_checked
					});
					}
				}
			}
			console.log("sending xhr");
			xhr.send(JSON.stringify(json));
		}
	}*/
}

var messageListLivelinks = {
	click_expand_thumbnail : function(el) {
		if(config.debug) console.log('livelinks message received - checking for thumbnails');
		
		var phold = el.getElementsByClassName("img-placeholder");
		for(i = 0; i<phold.length; i++){
			if(phold[i].parentNode.parentNode.getAttribute('class') !== "userpic-holder") {
				img_observer.observe(phold[i], {attributes:true});
			}
		}
	},
	ignorator_messagelist : function(mutation) {
		if (!config.ignorator) { 
			return;
		}
		// might need this later
		/*if (mutation.style.display == "none") {
			console.log("already hidden - ignoring");
			return;
		}*/
		var tops = mutation.getElementsByClassName('message-top'); 
		var top;
		for (var e = 0, len = tops.length; e < len; e++) {
			top = tops[e];
			// sometimes top is undefined
			if (top) {
				for (var f = 0, len = messageListHelper.ignores.length; f < len; f++) {
					if (top.getElementsByTagName('a')[0].innerHTML.toLowerCase() == messageListHelper.ignores[f]) {
						top.parentNode.style.display = "none";
						if (config.debug) {
							console.log('removed livelinks post by '
									+ messageListHelper.ignores[f]);
						ignorated.total_ignored++;
						}
						if (!ignorated.data.users[messageListHelper.ignores[f]]) {
							ignorated.data.users[messageListHelper.ignores[f]] = 1;
						} else {
							ignorated.data.users[messageListHelper.ignores[f]]++;
						}
						messageListHelper.globalPort.postMessage({
							action : 'ignorator_update',
							ignorator : ignorated
						});
					}
				}
			}
		}
	},
	resize_imgs : function(mutation) {
		for (var i = 0; mutation.getElementsByTagName('img')[i]; i++) {
			messageListHelper.resizeImg(mutation.getElementsByTagName('img')[i]);
		}
	},
	user_notes : function(el) {
		if (el.getElementsByClassName('message-top')[0].innerHTML.indexOf('notebook') == -1) {
			messageListHelper.addNotebox(el.getElementsByClassName('message-top'));
		}
	},
	autoscroll_livelinks: function(mutation) {
		if (document.hidden 
				&& messageListHelper.autoscrollCheck (mutation) ) {
			$.scrollTo(mutation);
		}
	},
	autoscroll_livelinks_active : function(mutation) {
		if (!document.hidden 
				&& messageListHelper.autoscrollCheck (mutation) ) {
			$.scrollTo((mutation), 800);
		}
	},
	autoscroll_livelinks_menu : function(mutation) {
		if (document.hidden || mutation.style.display == 'none' 
				|| document.getElementById('takemeback') 
				|| document.getElementById('divtop')) {
				return;
		}
		if (document.getElementById('following')) {
			$.scrollTo((mutation), 800);		
		}
		var elPosition = mutation.getBoundingClientRect();
		// check that livelinks post is off screen
		if (elPosition.top > window.innerHeight) {
			var oldPosition = window.scrollY;
			var top, userTop, splitTop, partToRemove, newTop, img;
			var quote, quoteTemp, quoteOmitHTML;
			var div, divAlert, divTop, divMsg, divScroll, divShow, divClose;
			// get relevant data from livelinks mutation
			var msg = mutation.getElementsByClassName('message-body')[0].getElementsByTagName('td')[0];
			var msgHTML = msg.innerHTML;
			var tops = mutation.getElementsByClassName('message-top');
			var quotes = mutation.getElementsByClassName('quoted-message');
			var imgs = mutation.getElementsByClassName('imgs');
			var backColor = $('table.message-body tr td.message').css('background-color');
			var bottomColor = $('body, table.classic tr td').css('background-color');
			// replace imgs divs with placeholder text
			if (imgs.length > 0) {
				for (var i = 0, len = imgs.length; i < len; i++) {
					img = imgs[i];
					msgHTML = msgHTML.replace(img.outerHTML, '[images removed] <br>');
				}
			}
			// truncate message tops
			for (var i = 0, len = tops.length; i < len; i++) {
				top = tops[i];
				splitTop = top.innerText.split('|').slice(2);
				partToRemove = splitTop.join('|');
				newTop = top.innerText.replace(partToRemove, '');
				// replace diagonal arrow (ascii: &#8663)
				newTop = newTop.replace('⇗', '');
				if (i == 0) {
					userTop = '<div class="message-top">' + newTop + '</div>';
				} else {
					msgHTML = msgHTML.replace(top.innerHTML, '<div class="message-top">' + newTop + '</div>');
				}
			}
			// replace "quoted text omitted" link
			if (quotes.length > 0) {
				quoteTemp = quotes[quotes.length - 1].getElementsByTagName('a');
				quoteOmitHTML = quoteTemp[quoteTemp.length - 1].outerHTML;
				if (quoteOmitHTML) {
					msgHTML = msgHTML.replace(quoteOmitHTML, '<u>[quoted text omitted]</u>');
				}
			}
			// create divs for popup
			div = document.createElement('div');
			divAlert = document.createElement('div');
			divTop = document.createElement('div');
			divMsg = document.createElement('div');
			// style divs before appending to document body
			div.style.background = bottomColor;
			div.style.boxShadow = "5px 5px 1.2em black";
			div.style.position = 'fixed';
			div.style.width = 100;
			div.style.bottom = 0;
			div.style.marginBottom = '-100%';
			div.id = 'newpost';
			divTop.innerHTML = userTop;
			divTop.id = 'divtop';
			divTop.title = 'Click to hide';
			divMsg.style.background = backColor;
			divMsg.title = 'Click to hide';
			divMsg.innerHTML = msgHTML;
			// todo - use js instead of html strings
			divAlert.innerHTML = '<div class ="message-top">' + '<b>New Livelinks post</b> | ' 
				+ '<a id ="scrollpost" href="javascript:void(0)"><b>[Scroll to post]</b></a> | ' 
				+ '<a id ="showinpopup" href="javascript:void(0)"><b>[Display in popup]</b></a> | ' 
				+ '<a id ="closepopup" href="javascript:void(0)"><b>[x]</b></a>' + '</div>';
			$(div).append(divAlert);
			if (!document.getElementById('newpost')) {
				$('body').append(div);
				$(div).animate({'margin-bottom': '0'}, {
					queue: false,
					duration: 500
				});
				messageListHelper.divExists = true;
			}
			messageListHelper.addDivListeners(div, divAlert, divTop, divMsg, oldPosition, mutation);
		}
	},
	post_title_notification : function(el) {
		if (el.style.display === "none") {
			if (config.debug) {
				console.log('not updating for ignorated post');
			}
			return;
		}
		if (el.getElementsByClassName('message-top')[0]
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
	},
	notify_quote_post : function(el) {
		if (!el.getElementsByClassName('quoted-message'))
			return;
		if (el.getElementsByClassName('message-top')[0]
				.getElementsByTagName('a')[0].innerHTML == document
				.getElementsByClassName('userbar')[0].getElementsByTagName('a')[0].innerHTML
				.replace(/ \((\d+)\)$/, ""))
			return;
		var not = false;
		var msg = el.getElementsByClassName('quoted-message');
		for (var i = 0; msg[i]; i++) {
			if (msg[i].getElementsByClassName('message-top')[0]
					.getElementsByTagName('a')[0].innerHTML == document
					.getElementsByClassName('userbar')[0]
					.getElementsByTagName('a')[0].innerHTML.replace(
					/ \((.*)\)$/, "")) {
				if (msg[i].parentNode.className != 'quoted-message')
					not = true;
			}
		}
		if (not) {
			chrome.extension.sendRequest({
				need : "notify",
				title : "Quoted by "
						+ el.getElementsByClassName('message-top')[0]
								.getElementsByTagName('a')[0].innerHTML,
				message : document.title.replace(/End of the Internet - /i, '')
			}, function(data) {
				console.log(data);
			});
		}
	},
	highlight_tc : function(el) {
		var topic = window.location.href.match(/topic=(\d+)/)[1];
		if (el.getElementsByClassName('message-top')[0]
				.getElementsByTagName('a')[0].innerHTML.toLowerCase() == config.tcs[topic].tc) {
			el.getElementsByClassName('message-top')[0]
					.getElementsByTagName('a')[0].style.color = '#'
					+ config.tc_highlight_color;
		}
	},
	label_tc : function(el) {
		var tcs = messageListHelper.getTcMessages();
		if (!tcs) {
			return;
		}
		var ipx, inner, tops, top, tcname, elname;
		tcname = tcs[0].getElementsByTagName('a')[0].innerText;
		tops = el.getElementsByClassName('message-top');
		for (var i = 0; tops[i]; i++) {
			top = tops[i];
			elname = top.getElementsByTagName('a')[0].innerText;
			if (tcname == elname && el.innerHTML.indexOf('TC') == -1) {
				ipx = document.createElement('span');
				inner = ' | <b>TC</b>';
				if (config.tc_label_color != '') {
					inner = ' | <font color="#' + config.tc_label_color + '"><b>TC</b></font>';
					ipx.innerHTML = inner;
					top.insertBefore(ipx, top.getElementsByTagName('a')[0].nextSibling);
				}
				// avoid error where user has ticked option but not selected text color
				else {
					inner = ' | <b>TC</b>';
					ipx.innerHTML = inner;
					top.insertBefore(ipx, top.getElementsByTagName('a')[0].nextSibling);
				}
			}
		}
	},
	like_button : function(el) {
		if (el.getElementsByClassName('message-top')[0].innerHTML.indexOf('Like') == -1) {
			if (el.getElementsByClassName('message-top')[0]
					.getElementsByTagName('a')[2]); {
				el.getElementsByClassName('message-top')[0].innerHTML += ' | <a href="##like" onclick="like(this);">Like</a>';
			}
		}
	},
	number_posts : function(el) {
		if (el.getElementsByClassName('message-top')[0].innerHTML.indexOf('PostNumber') == -1) {
			var top = el.getElementsByClassName('message-top')[0];
			var lastPost = document.getElementsByClassName('PostNumber')[document
					.getElementsByClassName('PostNumber').length - 1];
			var number = lastPost.innerHTML.match(/#(\d+)/)[1];
			var post = document.createElement('span');
			var id = (parseInt(number, 10) + 1);
			if (id < 1000)
				id = "0" + id;
			if (id < 100)
				id = "0" + id;
			if (id < 10)
				id = "0" + id;
			post.className = "PostNumber";
			post.innerHTML = " | #" + id;
			top.insertBefore(post, null);
		}
	},
	userhl_messagelist : function(el) {
		if (!config.enable_user_highlight)
			return;
		if (!config.no_user_highlight_quotes) {
			for (var k = 0; el.getElementsByClassName('message-top')[k]; k++) {
				try {
					user = el.getElementsByClassName('message-top')[k]
							.getElementsByTagName('a')[0].innerHTML
							.toLowerCase();
				} catch (e) {
					break;
				}
				if (config.user_highlight_data[user]) {
					if (config.debug)
						console.log('highlighting post by ' + user);
					el.getElementsByClassName('message-top')[k].style.background = '#'
							+ config.user_highlight_data[user].bg;
					el.getElementsByClassName('message-top')[k].style.color = '#'
							+ config.user_highlight_data[user].color;
					for (var j = 0; el.getElementsByClassName('message-top')[k]
							.getElementsByTagName('a')[j]; j++) {
						el.getElementsByClassName('message-top')[k]
								.getElementsByTagName('a')[j].style.color = '#'
								+ config.user_highlight_data[user].color;
					}
					if (k == 0
							&& config.notify_userhl_post
							&& el.getElementsByClassName('message-top')[0]
									.getElementsByTagName('a')[0].innerHTML != document
									.getElementsByClassName('userbar')[0]
									.getElementsByTagName('a')[0].innerHTML
									.replace(/ \((\d+)\)$/, "")) {
						chrome.extension
								.sendRequest(
										{
											need : "notify",
											message : document.title.replace(
													/End of the Internet - /i,
													''),
											title : "Post by "
													+ el
															.getElementsByClassName('message-top')[0]
															.getElementsByTagName('a')[0].innerHTML
										}, function(data) {
											console.log(data);
										});
					}
				}
			}
		} else {
			user = el.getElementsByClassName('message-top')[0]
					.getElementsByTagName('a')[0].innerHTML.toLowerCase();
			if (config.user_highlight_data[user]) {
				if (config.debug)
					console.log('highlighting post by ' + user);
				el.getElementsByClassName('message-top')[0].style.background = '#'
						+ config.user_highlight_data[user].bg;
				el.getElementsByClassName('message-top')[0].style.color = '#'
						+ config.user_highlight_data[user].color;
				for (var j = 0; el.getElementsByClassName('message-top')[0]
						.getElementsByTagName('a')[j]; j++) {
					el.getElementsByClassName('message-top')[0]
							.getElementsByTagName('a')[j].style.color = '#'
							+ config.user_highlight_data[user].color;
				}
				if (config.notify_userhl_post
						&& el.getElementsByClassName('message-top')[0]
								.getElementsByTagName('a')[0].innerHTML != document
								.getElementsByClassName('userbar')[0]
								.getElementsByTagName('a')[0].innerHTML
								.replace(/ \((\d+)\)$/, "")) {
					chrome.extension.sendRequest({
						need : "notify",
						message : document.title.replace(
								/End of the Internet - /i, ''),
						title : "Post by "
								+ el.getElementsByClassName('message-top')[0]
										.getElementsByTagName('a')[0].innerHTML
					}, function(data) {
						console.log(data);
					});
				}
			}
		}
	},
	foxlinks_quotes : function(el) {
		messageList.foxlinks_quotes();
	}
}
messageListHelper.init();
var livelinks = new MutationObserver(function(mutations) {
	var mutation;
	for (var i = 0, len = mutations.length; i < len; i++) {
		mutation = mutations[i];
		if (!mutation.target.lastChild.firstChild 
				|| !mutation.target.lastChild.firstChild.className) {
			return;
		}
		if (mutation.target.lastChild.firstChild.getAttribute('class') == 'message-container') {
			// send new message container to livelinks method
			messageListHelper.livelinks(mutation.target.lastChild.firstChild);
		}
}
});
livelinks.observe(document, {
		subtree: true,
		childList: true
});
