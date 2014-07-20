var cfg = JSON.parse(localStorage['ChromeLL-Config']);

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
var tags = cfg.saved_tags;
var userTags = cfg.bookmark_data;
var menu = document.getElementById("bookmarks");

for (var x in tags) {
    var name = x;
    var link = tags[x];
    var opt = document.createElement("option");
    opt.textContent = name;
    opt.value = link;
    menu.appendChild(opt);
}

for (var x in userTags) {
    var name = x;
    var link = userTags[x];
    var opt = document.createElement("option");
    opt.textContent = name;
    opt.value = link;
    menu.appendChild(opt);
}

var tagcps = cfg.tag_admin;
var menu = document.getElementById("tags");

for(var i=0, len=tagcps.length; i < len; i++){
    var name = tagcps[i];
    var opt = document.createElement("option");
    opt.textContent = name;
    menu.appendChild(opt);
}

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
						if (response.data === true) {
							document.getElementById('a_msg_history').href = 'http://boards.endoftheinter.net/history.php?b';
						}
					});
	
	var insert;
	if (cfg.ignorator && cfg.ignorator_list) {
    chrome.extension
        .sendRequest({
                need: "noIgnored"
            },
            function (response) {
            // prevents "Cannot read property 'data' of undefined" error if no users are currently being ignored
                if (!response.noIgnores) {
                    chrome.extension
                    .sendRequest({
                            need: "getIgnored"
                        },
                        function (response) {
                            ignoratorData = response.ignorator.data;
                            if (response.ignorator.data.users) {
                                for (var i in response.ignorator.data.users) {
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
                                            function (evt) {
                                                showHidden(
                                                    evt.target.parentNode
                                                    .getElementsByClassName('i_data')[0].innerHTML,
                                                    evt.target);
                                            });
                                    insert.innerHTML = '<span class="rm_num">' + response.ignorator.data.users[i].total + '</span><span class="i_data">' + i + '</span>';
                                    insert.insertBefore(show, null);
                                    document.getElementById('js_insert')
                                        .insertBefore(insert, null);
                                }
                            }
                            if (response.ignorator.data.keywords) {
                                for (var i in response.ignorator.data.keywords) {
                                    insert = document.createElement('div');
                                    insert.className = 'keyword_ignore';
                                    insert.innerHTML = '<span class="rm_num">' + response.ignorator.data.keywords[i].total + '</span>' + i;
                                    document.getElementById('js_insert')
                                        .insertBefore(insert, null);
                                }
                            }
                        });
                }
            });
	}
};
