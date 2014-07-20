var profile = {
	sort_history : function() {
		var el = document.getElementsByTagName('table')[0]
				.getElementsByTagName('a');
		for (var i = 0; el[i]; i++) {
			if (el[i].href.indexOf('history.php') != -1) {
				el[i].href = el[i].href + "?b";
			}
		}
	},
	history_expand_search : function() {
		document.getElementById('search_bar').style.display = 'block';
	}
	/*page_jump_buttons : function() {
		var trs = document.getElementsByTagName('table')[0]
				.getElementsByTagName('tr');
		var insert;
		var tmp;
		for (var i = 1; trs[i]; i++) {
			insert = document.createElement('span');
			insert.style.float = 'right';
			insert.addEventListener('click', profileHelper.jumpHandler, false);
			tmp = trs[i].getElementsByTagName('td')[1]
					.getElementsByTagName('a')[0].href.match(/topic=([0-9]+)/)[1];
			insert.innerHTML = '<a href="##' + tmp
					+ '" id="jumpWindow">#</a> <a href="##' + tmp
					+ '" id="jumpLast">&gt;</a>';
			trs[i].getElementsByTagName('td')[1].insertBefore(insert, null);
		}
	}*/
}
/*var profileHelper = {
	jumpHandler : function(ev) {
		var a = ev.srcElement.parentNode.parentNode.parentNode
				.getElementsByTagName('td')[2]
		var last = Math.ceil(a.innerHTML.split('<')[0] / 50);
		if (ev.srcElement.id == 'jumpWindow') {
			pg = prompt("Page Number (" + last + " total)", "Page");
			if (pg == undefined || pg == "Page") {
				return 0;
			}
		} else {
			pg = last;
		}
		window.location = ev.srcElement.parentNode.parentNode.parentNode
				.getElementsByTagName('td')[1].getElementsByTagName('a')[0].href
				+ '&page=' + pg;
	},
	init : function() {
		chrome.extension.sendRequest({
			need : "config"
		}, function(conf) {
			config = conf.data;
			for ( var i in profile) {
				if (config[i]) {
					try {
						profile[i]();
					} catch (err) {
						console.log("error in " + i + ":", err);
					}
				}
			}
		});
	}
}
profileHelper.init();*/

function addControlPanel() {
    var tds;
    var td;
    var adminTags;
    var modTags;
    var adminArray = [];
    var modArray = [];
    var tagArray = [];
    var isAdmin;
    var isMod;
    var profile = document.documentElement.innerText;
    if (profile.indexOf("Edit My Profile") > -1) {
        tds = document.getElementsByTagName("td");
        for (var i = 0; i < tds.length; i++) {
            td = tds[i];
            if (td.innerText.indexOf("Administrator of") > -1) {
                adminTags = tds[i + 1].getElementsByTagName('a');
                isAdmin = true;
            }
            if (td.innerText.indexOf("Moderator of") > -1) {
                modTags = tds[i + 1].getElementsByTagName('a');
                isMod = true;
            }
        }
        if (isAdmin) {
        adminArray = Array.prototype.slice.call(adminTags);
        }
        if (isMod) {
        modArray = Array.prototype.slice.call(modTags);
        }
        tagArray = adminArray.concat(modArray);
        for (var i = 0; i < tagArray.length; i++) {
            tagArray[i].classList.add('control');
        }

        $("a.control").hoverIntent(
            function () {
                var that = this;
                var color = $("table.grid tr td").css("background-color");
                var tag = that.innerText;
                var url = "http://endoftheinter.net/tag.php?tag=" + tag;
                $(that).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; background: " + color + ";'><a href='" + url + "'>&nbsp<b>[Edit Tag]</b></a></span>"));
            }, function () {
                $(this).find("span:last").remove();
            }
        );
    }
}
addControlPanel();
