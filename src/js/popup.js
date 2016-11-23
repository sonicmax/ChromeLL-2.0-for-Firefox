var cfg = JSON.parse(localStorage['ChromeLL-Config']);
var ignoratorData = {};

function openBookmark(evt) {
	window.open("http://boards.endoftheinter.net/topics/"
			+ document.savedtags.bookmark.value);
}	

function openControl(evt) {
	window.open("http://endoftheinter.net/tag.php?tag="
			+ document.tagcontrol.tag.value);
}

function openOptions() {
	chrome.runtime.sendMessage({
		need: "options"
	});
	window.close();
}

function showHidden(evt, type) {
	var el = evt.target;
	var value = el.parentNode.getElementsByClassName('i_data')[0].innerHTML;
	
	chrome.runtime.sendMessage({
		need: "showIgnorated",
		type: type,
		value: value
	});
	
	el.parentNode.style.display = 'none';
}

function populateMenus() {
	var tags = cfg.saved_tags;
	var userTags = cfg.bookmark_data;
	var tagcps = cfg.tag_admin;
	var bookmarkMenu = document.getElementById("bookmarks");
	var tagMenu = document.getElementById("tags");
	for (var x in tags) {
			var name = x;
			var link = tags[x];
			var opt = document.createElement("option");
			opt.textContent = name;
			opt.value = link;
			bookmarkMenu.appendChild(opt);
	}
	for (var x in userTags) {
			var name = x;
			var link = userTags[x];
			var opt = document.createElement("option");
			opt.textContent = name;
			opt.value = link;
			bookmarkMenu.appendChild(opt);
	}	
	for(var i = 0, len = tagcps.length; i < len; i++) {
			var name = tagcps[i];
			var opt = document.createElement("option");
			opt.textContent = name;
			tagMenu.appendChild(opt);
	}
}

function addListeners() {
	document.getElementById('worksafe').addEventListener('change', (ev) => {
		if (ev.path[0].checked) {
			cfg.hide_nws_gfycat = true;
			localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
			return;
		}
		else if (!ev.path[0].checked) {
			cfg.hide_nws_gfycat = false;
			localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
			return;
		}
	});
	document.getElementById('bookmarks').addEventListener('change', openBookmark);
	document.getElementById('tags').addEventListener('change', openControl);
	document.getElementById('options').addEventListener('click', openOptions);
}

function handleIgnorator() {
	if (cfg.ignorator && cfg.ignorator_list 
			|| !cfg.ignorator && cfg.ignore_keyword && cfg.ignore_keyword_list) {
				
		chrome.runtime.sendMessage({ need: "noIgnores" }, (response) => {
			
			// prevents "Cannot read property 'data' of undefined" error if no users are currently being ignored
			if (!response.noIgnores) {
				
				chrome.runtime.sendMessage({ need: "getIgnored" }, (response) => {
					
					ignoratorData = response.ignorator.data;
					
					if (response.ignorator.data.users) {
						
						for (var i in response.ignorator.data.users) {
							
							var insert = document.createElement('div');
							insert.className = 'user_ignore';
							
							var show = document.createElement('span');
							show.title = 'show topics by ' + i + ' on this page';
							show.className = 'show_hidden';
							show.innerHTML = 'x';
							
							show.addEventListener('click', (evt) => {								
								showHidden(evt, 'user');
							});
							
							insert.innerHTML = '<span class="rm_num">' + response.ignorator.data.users[i].total + '</span><span class="i_data">' + i + '</span>';
							insert.insertBefore(show, null);
							document.getElementById('js_insert').insertBefore(insert, null);
						}
					}
					
					if (response.ignorator.data.keywords) {
						
						for (var i in response.ignorator.data.keywords) {
							
							var insert = document.createElement('div');
							insert.className = 'keyword_ignore';
							insert.innerHTML = '<span class="rm_num">' + response.ignorator.data.keywords[i].total + '</span>' + '<span class="i_data">' + i + '</span>';
							
							var show = document.createElement('span');
							show.title = 'show topics containing ' + i + ' on this page';
							show.className = 'show_hidden';
							show.innerHTML = 'x';

							show.addEventListener('click', (evt) => {
								showHidden(evt, 'keyword');
							});							
							
							insert.insertBefore(show, null);
							document.getElementById('js_insert').insertBefore(insert, null);
						}
					}
					
				});
			}
			
		});
	}
}

document.addEventListener('DOMContentLoaded', () => {
	var slider = document.getElementById('worksafe');
	var history = document.getElementById('a_msg_history');
	cfg.hide_nws_gfycat ? slider.checked = true : slider.checked = false;
	if (cfg.sort_history) {
		history.href = 'http://boards.endoftheinter.net/history.php?b';
	}		
	populateMenus();
	handleIgnorator();
	addListeners();
});
