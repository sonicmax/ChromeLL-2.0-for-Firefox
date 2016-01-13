(function(CHROMELL) {

	CHROMELL.profile = function() {

		var init = function(config) {
			
			CHROMELL.whenDOMReady(function() {
				
				if (CHROMELL.config.sort_history) {
					sortHistory();
				}
				
				addControlPanelLinks();
			});
			
		};
		
		var sortHistory = function() {
			var el = document.getElementsByTagName('table')[0]
					.getElementsByTagName('a');
			for (var i = 0; el[i]; i++) {
				if (el[i].href.indexOf('history.php') != -1) {
					el[i].href = el[i].href + "?b";
				}
			}
		};
		
		var addControlPanelLinks = function () {
			var tags = [];
			var profile = document.documentElement.innerText;
		
			if (profile.indexOf("Edit My Profile") > -1) {
				var tds = document.getElementsByTagName("td");
				for (var i = 0; i < tds.length; i++) {
					var td = tds[i];
					
					if (td.innerText.indexOf("Administrator of") > -1) {
						var adminTags = tds[i + 1].getElementsByTagName('a');
					}
					
					if (td.innerText.indexOf("Moderator of") > -1) {
						var modTags = tds[i + 1].getElementsByTagName('a');
					}
				}
				
				if (adminTags) {
					adminArray = Array.prototype.slice.call(adminTags);
				}
				if (modTags) {
					modArray = Array.prototype.slice.call(modTags);
				}
				
				var tags = adminArray.concat(modArray);
				
				for (var i = 0; i < tags.length; i++) {
					tags[i].classList.add('control');
				}
				
				$("a.control").hoverIntent(
					// Display control panel link on hover
					function () {
						var that = this;
						var color = $("table.grid tr td").css("background-color");
						var tag = that.innerText;
						var url = window.location.protocol + "//endoftheinter.net/tag.php?tag=" + tag;

						$(that).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; " 
								+ "background: " + color 
								+ ";'><a href='" + url 
								+ "'>&nbsp<b>[Edit Tag]</b></a></span>"));
					},
					// Remove link after hover event
					function () {
						$(this).find("span:last").remove();
					}
				);
			}
		};
		
		// Get config from background page and pass it to init method
		CHROMELL.getConfig(init);
		
	}();
	
})( CHROMELL || {} );
