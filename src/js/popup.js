//get user config for later
var cfg = JSON.parse(localStorage['ChromeLL-Config']);

//functions for dropdown menus
function openBookmark(evt) {
	window.open("http://boards.endoftheinter.net/topics/"
			+ document.savedtags.bookmark.value);
}	

function openControl(evt) {
	window.open("http://endoftheinter.net/tag.php?tag="
			+ document.tagcontrol.tag.value);
}

function openOptions() {
	window.open(chrome.extension.getURL('options.html'));
}

function showHidden(i, el) {
	console.log(ignoratorData.users[i].trs);
	chrome.extension.sendRequest({
		need : "showIgnorated",
		ids : ignoratorData.users[i].trs
	});
	el.parentNode.style.display = 'none';
}
var ignoratorData = {};
window.onload = function() {
//get saved tags from config file
var tags = cfg.saved_tags;
var userTags = cfg.bookmark_data;
var menu = document.getElementById("bookmarks");

//populate dropdown list with cfg.saved_tags
for (var x in tags) {
    var name = x;
    var link = tags[x];
    var opt = document.createElement("option");
    opt.textContent = name;
    opt.value = link;
    menu.appendChild(opt);
}
//populate list with cfg.user_bookmarks
for (var x in userTags) {
    var name = x;
    var link = userTags[x];
    var opt = document.createElement("option");
    opt.textContent = name;
    opt.value = link;
    menu.appendChild(opt);
}

//get tag admin list from config file
var tagcps = cfg.tag_admin;
var menu = document.getElementById("tags");

//populate dropdown list with admin/mod tags
for(var i=0, len=tagcps.length; i < len; i++){
    var name = tagcps[i];
    var opt = document.createElement("option");
    opt.textContent = name;
    menu.appendChild(opt);
}

//EventListeners for popup.html
	document.getElementById('bookmarks').addEventListener('change', openBookmark);
	document.getElementById('tags').addEventListener('change', openControl);
	document.getElementById('options').addEventListener('click', openOptions);
	
	chrome.extension
			.sendRequest(
					{
						need : "config",
						sub : "sort_history"
					},
					function(response) {
						// console.log(response);
						if (response.data === true) {
							document.getElementById('a_msg_history').href = 'http://boards.endoftheinter.net/history.php?b';
						}
					});
	var insert;
	chrome.extension
			.sendRequest(
					{
						need : "getIgnored"
					},
					function(response) {
						// this gives "undefined" errors in console if no ignorator list exists
						// console.log(response.ignorator);
						// console.log(response.ignorator.data.users);
						ignoratorData = response.ignorator.data;
						// document.getElementById('info_test_display').innerHTML
						// = response.scope;
						if (response.ignorator.data.users) {
							for ( var i in response.ignorator.data.users) {
								// console.log('user', i);
								insert = document.createElement('div');
								insert.className = 'user_ignore';
								var show = document.createElement('span');
								show.title = 'show ' + i + ' on this page';
								show.className = 'show_hidden';
								show.innerHTML = 'x';
								var current = response.ignorator.data.users[i];
								show
										.addEventListener(
												'click',
												function(evt) {
													showHidden(
															evt.target.parentNode
																	.getElementsByClassName('i_data')[0].innerHTML,
															evt.target);
												});
								insert.innerHTML = '<span class="rm_num">'
										+ response.ignorator.data.users[i].total
										+ '</span><span class="i_data">' + i
										+ '</span>';
								insert.insertBefore(show, null);
								document.getElementById('js_insert')
										.insertBefore(insert, null);
							}
						}
						if (response.ignorator.data.keywords) {
							for ( var i in response.ignorator.data.keywords) {
								// console.log('keyword', i);
								insert = document.createElement('div');
								insert.className = 'keyword_ignore';
								insert.innerHTML = '<span class="rm_num">'
										+ response.ignorator.data.keywords[i].total
										+ '</span>' + i;
								document.getElementById('js_insert')
										.insertBefore(insert, null);
							}
						}
					});
};