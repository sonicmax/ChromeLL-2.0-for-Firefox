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
	},
	page_jump_buttons : function() {
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
	}
}
var profileHelper = {
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
profileHelper.init();

function addControlPanel() {
    var profile = document.documentElement.innerText;
    if (profile.indexOf("Edit My Profile") > -1) {
        if (document.getElementsByTagName('body')[0].className == 'regular') {
            var testChange = document.getElementsByTagName('td')[2].innerHTML;
            if (testChange.indexOf("Formerly") > -1) {
                var adminTags = document.getElementsByTagName('td')[9].getElementsByTagName('a');
                var modTags = document.getElementsByTagName('td')[11].getElementsByTagName('a');
            } else {
                var adminTags = document.getElementsByTagName('td')[7].getElementsByTagName('a');
                var modTags = document.getElementsByTagName('td')[9].getElementsByTagName('a');
            }
        } else if (document.getElementsByTagName('body')[0].className == 'classic') {
            var testChange = document.getElementsByTagName('td')[3].innerHTML;
            if (testChange.indexOf("Formerly") > -1) {
                var adminTags = document.getElementsByTagName('td')[10];
                var modTags = document.getElementsByTagName('td')[12];
            } else {
                var adminTags = document.getElementsByTagName('td')[8];
                var modTags = document.getElementsByTagName('td')[10];
            }
        }

        var adminArray = [];
        for (var i = 0; i < adminTags.length; i++) {
            adminArray[i] = adminTags[i];
            adminArray[i].classList.add('control');
        }

        var modArray = [];
        for (var i = 0; i < modTags.length; i++) {
            modArray[i] = modTags[i];
            modArray[i].classList.add('control');
        }

        var timeout;
        $("a.control").hover(
            function () {
                var that = this;
                timeout = setTimeout(function () {
                    var color = $("table.grid tr td").css("background-color");
                    var tag = that.innerText;
                    var url = "http://endoftheinter.net/tag.php?tag=" + tag;
                    $(that).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; background: " 
										+ color + ";'><a href='" + url + "'>&nbsp<b>[Edit Tag]</b></a></span>"));
                }, 400);

            }, function () {
                clearTimeout(timeout);
                $(this).find("span:last").remove();
            }
        );
    }
}
addControlPanel();
