function sortHistory() {
	var el = document.getElementsByTagName('table')[0]
			.getElementsByTagName('a');
	for (var i = 0; el[i]; i++) {
		if (el[i].href.indexOf('history.php') != -1) {
			el[i].href = el[i].href + "?b";
		}
	}
}

function addControlPanels() {
	var adminTags, modTags, isAdmin, isMod;
	
	var adminArray = [];
	var modArray = [];
	var tagArray = [];
	
	var profile = document.documentElement.innerText;
	
	if (profile.indexOf("Edit My Profile") > -1) {
		var tds = document.getElementsByTagName("td");
		
		for (var i = 0; i < tds.length; i++) {
			var td = tds[i];
			
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
				$(that).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; " 
						+ "background: " + color 
						+ ";'><a href='" + url 
						+ "'>&nbsp<b>[Edit Tag]</b></a></span>"));
			},
			
			function () {
				$(this).find("span:last").remove();				
			}
		);
	}
}

function historyExpandSearch() {
	// Todo: what did this actually do? And why doesn't it work lol
	// document.getElementById('search_bar').style.display = 'block';
}

browser.runtime.sendMessage({ need : "config" }).then(response => {
	
	var config = response.data;
	
	if (config.sort_history) {
		sortHistory();
	}
	
	if (config.history_expand_search) {
		historyExpandSearch();
	}
	
	addControlPanels();	
	
});
