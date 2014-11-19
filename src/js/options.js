$(document)
		.ready(
				function() {
					$('.options_navigation_link').click(
							function() {
								toLink = $(this).attr('id').split('_link')[0];

								selectedPage = $('.navbar-item-selected').attr(
										"id").split('_link')[0];

								if (toLink == selectedPage) {
									// Already on the page, clicking does not
									// refresh the page!
									return true;
								}

								$('#' + selectedPage + '_link').removeClass(
										"navbar-item-selected");
								$('#' + toLink + '_link').addClass(
										"navbar-item-selected");

								$('#' + selectedPage + '_page').removeClass(
										"shown").addClass("hidden");
								$('#' + toLink + '_page').removeClass("hidden")
										.addClass("shown");

								if (toLink == "supersecretabout") {
									$('body').css("background-color", "#000");
								} else {
									$('body').css("background-color",
											"transparent");
								}
							});				
					// restore config settings
					if (localStorage['ChromeLL-Config'] == ''
							|| localStorage['ChromeLL-Config'] == undefined) {
						console.log("Blank Config. Rebuilding");		
						
						config.getDefault(function(defaultConfig) {
							localStorage['ChromeLL-Config'] = defaultConfig;
						});
						
						if (localStorage['chromeLL_userhighlight']
								&& localStorage['chromeLL_userhighlight'] != '') {
							config.restoreV1();
						}
						else {
							config.init();
						}				
					}
					else {
						config.init();
					}
				});

var config = {
	functions: {
		cleanIgnorator: function() {
			var cfg = JSON.parse(localStorage['ChromeLL-Config']);
			cfg.ignorator_backup = cfg.ignorator_list;
			var cleanIgnorator = cfg.clean_ignorator;
			var list = cfg.ignorator_list;
			var oldIgnorator = list.split(',');
			var xhr, url, temp, users, newIgnorator, currentTime;
			for (var i = 1; oldIgnorator[i]; i++) {
				oldIgnorator[i] = oldIgnorator[i].trim();
			}
			var json = {
					"userList": [],
					"removeBanned": ""
			}
			json.userList = oldIgnorator;
			json.removeBanned = cleanIgnorator;
			xhr = new XMLHttpRequest();
			url = 'http://eti-stats.herokuapp.com/tools/api/clean_ignorator/';
			xhr.open("POST", url, true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.onreadystatechange = function () {
				if (xhr.status == 503) {
					document.getElementById('ignorateinfo').innerText = "eti-stats is down - try again later";
					return;
				}
				if (xhr.readyState == 4 && xhr.status == 200) {
					temp = JSON.parse(xhr.responseText);
					users = temp.userList;
					newIgnorator = users.toString();
					cfg.ignorator_list = newIgnorator;
					localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
					document.getElementById('ignorateinfo').innerText = "ignorator cleaned - reloading page in 3 seconds...";
					setTimeout(function () {
						location.reload();
					}, 3000);
				}
			}
			xhr.send(JSON.stringify(json));
			currentTime = new Date().getTime();
			cfg.last_clean = currentTime;
			localStorage['ChromeLL-Config'] = JSON.stringify(cfg);	
		},
		rateLimiter: function() {
			var cfg = JSON.parse(localStorage['ChromeLL-Config']);
			if (cfg.ignorator_list == "") {
				document.getElementById('ignorateinfo').innerText = "no ignorator list found..."
				return;
			}
			var currentTime = new Date().getTime();
			var timeLeft = currentTime - cfg.last_clean;
			if (timeLeft > 86400000) {
				document.getElementById('ignorateinfo').innerText = "running ignorator cleaner..."
				updateIgnorator();
			} else {
				var totalseconds = ((86400000 - timeLeft) / 1000);
				var hours = Math.floor(totalseconds / 3600);
				var totalminutes = Math.floor(totalseconds / 60);
				var minutes = totalminutes - (hours * 60);
				var seconds = Math.floor(totalseconds - (totalminutes * 60))
				if (hours == 1) {
					hours = hours + " hour, ";
				} else if (hours != 1) {
					hours = hours + " hours, ";
				}
				if (minutes == 1) {
					minutes = minutes + " minute, and ";
				} else if (minutes != 1) {
					minutes = minutes + " minutes, and ";
				}
				if (seconds == 1) {
					seconds = seconds + " second.";
				} else if (seconds != 1) {
					seconds = seconds + " seconds."
				}	
				document.getElementById('ignorateinfo').innerText = "try again in " + hours + minutes + seconds;
			}
		},
		restoreIgnorator: function() {
			var cfg = JSON.parse(localStorage['ChromeLL-Config']);
			var backup = cfg.ignorator_backup;
			if (confirm('Are you sure you want to restore last ignorator backup?')) {
				if (backup == "") {
					document.getElementById('ignorateinfo').innerHTML = "no backup found...";
					return;
				} else if (backup == cfg.ignorator_list) {
					document.getElementById('ignorateinfo').innerHTML = "current list and backup are identical...";
					return;
				} else {
					cfg.ignorator_list = backup;
					localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
					document.getElementById('ignorateinfo').innerHTML = "backup restored - reloading page in 3 seconds...";
					setTimeout(function () {
						location.reload();
					}, 3000);
				}
			}
			else {
				return;
			}
		},
		ignoratorClick: function(evt) {
			document.getElementById('ignorator_messagelist').checked = evt.target.checked;
			document.getElementById('ignorator_topiclist').checked = evt.target.checked;
			config.save();
		},
		highlightClick: function(evt) {
			document.getElementById('userhl_messagelist').checked = evt.target.checked;
			document.getElementById('userhl_topiclist').checked = evt.target.checked;
			config.save();
		},
		downloadClick: function() {
			document.getElementById('downloadcfg').click();
		},
		restoreClick: function() {
			document.getElementById('restorecfg').click();
		},
		showTextarea: function() {
			document.getElementById('old_cfg_options').style.display = "none";
			document.getElementsByClassName('old_cfg_options')[0].style.display = "inline";			
			config.show();
		},		
		processConfig: function(textfile) {
			var base64;
			try {
				if (typeof textfile === 'string') {
					newCfg = JSON.parse(textfile);
				}
				else if (document.getElementById('cfg_ta').value != '') {
					newCfg = JSON.parse(document.getElementById('cfg_ta').value);
				}		
				var myCfg = JSON.parse(localStorage['ChromeLL-Config']);
				for (var i in newCfg) {
					myCfg[i] = newCfg[i];				
				}
				myCfg.last_saved = new Date().getTime();
				localStorage['ChromeLL-Config'] = JSON.stringify(myCfg);
			} catch (e) {
				console.log('This doesnt look like a config', e);
				base64 = config.functions.decodeBase64(document.getElementById('cfg_ta').value);
				config.restoreV1(base64);
			}
			location.reload();
		},
		resetConfig: function() {
			var reset = confirm("Are you sure you want to reset your settings?");
			if (reset === true) {
				config.getDefault(function(defaultCfg) {
					localStorage['ChromeLL-Config'] = defaultCfg;
					location.reload();
				});
			}
			else {
				return;
			}
		},	
		decodeBase64: function() {
			var Base64 = {
				_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
				decode: function(input) {
					var output = "";
					var chr1, chr2, chr3;
					var enc1, enc2, enc3, enc4;
					var i = 0;

					input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

					while (i < input.length) {

						enc1 = this._keyStr.indexOf(input.charAt(i++));
						enc2 = this._keyStr.indexOf(input.charAt(i++));
						enc3 = this._keyStr.indexOf(input.charAt(i++));
						enc4 = this._keyStr.indexOf(input.charAt(i++));

						chr1 = (enc1 << 2) | (enc2 >> 4);
						chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
						chr3 = ((enc3 & 3) << 6) | enc4;

						output = output + String.fromCharCode(chr1);

						if (enc3 != 64) {
							output = output + String.fromCharCode(chr2);
						}
						if (enc4 != 64) {
							output = output + String.fromCharCode(chr3);
						}

					}

					output = Base64._utf8_decode(output);

					return output;

				},
				_utf8_decode: function(utftext) {
					var string = "";
					var i = 0;
					var c = c1 = c2 = 0;

					while (i < utftext.length) {

						c = utftext.charCodeAt(i);

						if (c < 128) {
							string += String.fromCharCode(c);
							i++;
						} else if ((c > 191) && (c < 224)) {
							c2 = utftext.charCodeAt(i + 1);
							string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
							i += 2;
						} else {
							c2 = utftext.charCodeAt(i + 1);
							c3 = utftext.charCodeAt(i + 2);
							string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
							i += 3;
						}

					}

					return string;
				}
			}
			return JSON.parse(Base64.decode(cfg));
		},
		emptyCache: function() {
			chrome.storage.local.remove('imagemap', function() {
				console.log('Cleared imagemap cache.');
				location.reload();
			});
		}
	},
	listeners : {
		click: function() {
			// key-value pairs contain element id and function for event handler
			var elements = {
				'ignorator': 'ignoratorClick',
				'enable_user_highlight': 'highlightClick',
				'loadcfg': 'processConfig',
				'resetcfg': 'resetConfig',
				'forceignorator': 'cleanIgnorator',
				'restoreignorator': 'restoreIgnorator',
				'downloadbutton': 'downloadClick',
				'restorebutton': 'restoreClick',
				'old_cfg_options': 'showTextarea',
				'cache_empty': 'emptyCache'
			};
			var element, functionName;
			for (var i in elements) {
				element = document.getElementById(i);
				functionName = elements[i];
				element.addEventListener('click', config.functions[functionName]);
			}
		},
		change: function() {
			var restorecfg = document.getElementById('restorecfg');
			var keyup_timer;
			// use debouncing to prevent script from calling config.save after every keystroke
			document.addEventListener('keyup', function() {
				clearTimeout(keyup_timer);
				keyup_timer = setTimeout(config.save, 500)
			});
			document.addEventListener('change', config.save);
			
			restorecfg.addEventListener('change', function(evt) {
				config.restoreFromText(evt);
			});
		},
		menuVisibility: function() {
			// array contains div ids of hidden menus
			var hiddenOptions = ['history_menubar', 'context_menu', 'dramalinks', 'user_info_popup'];
			var element;
			for (var i = 0, len = hiddenOptions.length; i < len; i++) {
				// add listener to each checkbox
				element = document.getElementById(hiddenOptions[i]);
				element.addEventListener('change', config.ui.hideMenus);
			}
		}
	},
	ui: {
		hideMenus: function() {
			var hiddenOptions = {'history_menubar' : 'history_options', 
					'context_menu' : 'context_options', 
					'dramalinks' : 'dramalinks_options', 
					'user_info_popup' : 'doubleclick_options'};
			var box, menu;
			for (var key in hiddenOptions) {
				box = document.getElementById(key);
				menu = document.getElementById(hiddenOptions[key]);		
				// only display hidden menus if checkbox is ticked
				box.checked ? menu.style.display = 'initial' : menu.style.display = 'none';
			}
		},
		setColorPicker: function() {
			$('.color').ColorPicker({
				onChange : function(hsb, hex, rgb, el) {
					el.value = hex;
					config.save();
				},
				onSubmit : function(hsb, hex, rgb, el) {
					$(el).val(hex);
					$(el).ColorPickerHide();
					config.save();
				},
				livePreview : true,
				color : "",
				onBeforeShow : function() {
					$(this).ColorPickerSetColor(this.value);
				}
			});
		},		
		addDiv: {
			userHighlight: function() {
				var ins = document.getElementById('user_highlight').getElementsByClassName(
						'user_name')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "user_highlight_data";
				ins.style.display = "block";
				document.getElementById('user_highlight').insertBefore(ins, null);
				config.ui.setColorPicker();
			},
			bookmarkName: function() {
				var ins = document.getElementById('bookmarked_tags').getElementsByClassName(
						'bookmark_name')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "bookmark_data";
				ins.style.display = "block";
				document.getElementById('bookmarked_tags').insertBefore(ins, null);		
			},
			snippetName: function() {
				var ins = document.getElementById('snippets').getElementsByClassName(
						'snippet_name')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "snippet_data";
				ins.style.display = "block";
				document.getElementById('snippets').insertBefore(ins, null);		
			},
			keywordHighlight: function() {
				var ins = document.getElementById('keyword_highlight')
						.getElementsByClassName('keyword')[0].parentNode.parentNode
						.cloneNode(true);
				ins.className = "keyword_highlight_data";
				ins.style.display = "block";
				document.getElementById('keyword_highlight').insertBefore(ins, null);
				config.ui.setColorPicker();
			},
			tagHighlight: function() {
				var ins = document.getElementById('tag_highlight').getElementsByClassName(
						'tag')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "tag_highlight_data";
				ins.style.display = "block";
				document.getElementById('tag_highlight').insertBefore(ins, null);
				config.ui.setColorPicker();	
			},
			postTemplate: function() {
				var ins = document.getElementById('post_template').getElementsByClassName(
						'template_text')[0].parentNode.parentNode.cloneNode(true);
				ins.className = "post_template_data";
				ins.style.display = "block";
				document.getElementById('post_template').insertBefore(ins, null);	
			}
		}
	},
	save: function() {
		var cfg = JSON.parse(localStorage['ChromeLL-Config']);
			inputs = $(":checkbox");
			for (var i in inputs) {
				cfg[inputs[i].id] = inputs[i].checked;
			}
			var textboxes = $(":text");
			for (var i in textboxes) {
				if (textboxes[i].className && textboxes[i].className == ('cache_filenames')) {
					// do nothing
					return;
				}
				else {
					cfg[textboxes[i].id] = textboxes[i].value;
				}
			}
			var userhlData = document.getElementById('user_highlight')
					.getElementsByClassName('user_highlight_data');
			var name;
			cfg.user_highlight_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('user_name')[0].value
						.toLowerCase();
				if (name != '') {
					cfg.user_highlight_data[name] = {};
					cfg.user_highlight_data[name].bg = userhlData[i]
							.getElementsByClassName('header_bg')[0].value;
					userhlData[i].getElementsByClassName('user_name')[0].style.background = '#'
							+ cfg.user_highlight_data[name].bg;
					cfg.user_highlight_data[name].color = userhlData[i]
							.getElementsByClassName('header_color')[0].value;
					userhlData[i].getElementsByClassName('user_name')[0].style.color = '#'
							+ cfg.user_highlight_data[name].color;
				}
			}
			// get bookmark data from option page, save to config
			var userhlData = document.getElementById('bookmarked_tags')
					.getElementsByClassName('bookmark_data');
			cfg.bookmark_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('bookmark_name')[0].value;
				if (name != '') {
					cfg.bookmark_data[name] = userhlData[i]
							.getElementsByClassName('bookmark_tag')[0].value;
				}
			}
			// get snippet data from option page, save to config
			userhlData = document.getElementById('snippets')
					.getElementsByClassName('snippet_data');
			cfg.snippet_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('snippet_name')[0].value;
				name = name.trim();
				if (name != '') {
					cfg.snippet_data[name] = userhlData[i]
							.getElementsByClassName('snippet')[0].value;
				}
			}
			userhlData = document.getElementById('keyword_highlight')
					.getElementsByClassName('keyword_highlight_data');
			cfg.keyword_highlight_data = {};
			var j = 0;
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('keyword')[0].value
						.toLowerCase();
				if (name != '') {
					cfg.keyword_highlight_data[j] = {};
					cfg.keyword_highlight_data[j].match = name;
					cfg.keyword_highlight_data[j].bg = userhlData[i]
							.getElementsByClassName('keyword_bg')[0].value;
					userhlData[i].getElementsByClassName('keyword')[0].style.background = '#'
							+ cfg.keyword_highlight_data[j].bg;
					cfg.keyword_highlight_data[j].color = userhlData[i]
							.getElementsByClassName('keyword_color')[0].value;
					userhlData[i].getElementsByClassName('keyword')[0].style.color = '#'
							+ cfg.keyword_highlight_data[j].color;
					j++;
				}
			}
			userhlData = document.getElementById('tag_highlight')
					.getElementsByClassName('tag_highlight_data');
			cfg.tag_highlight_data = {};
			var j = 0;
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('tag')[0].value
						.toLowerCase();
				if (name != '') {
					cfg.tag_highlight_data[j] = {};
					cfg.tag_highlight_data[j].match = name;
					cfg.tag_highlight_data[j].bg = userhlData[i]
							.getElementsByClassName('tag_bg')[0].value;
					userhlData[i].getElementsByClassName('tag')[0].style.background = '#'
							+ cfg.tag_highlight_data[j].bg;
					cfg.tag_highlight_data[j].color = userhlData[i]
							.getElementsByClassName('tag_color')[0].value;
					userhlData[i].getElementsByClassName('tag')[0].style.color = '#'
							+ cfg.tag_highlight_data[j].color;
					j++;
				}
			}
			userhlData = document.getElementById('post_template')
					.getElementsByClassName('post_template_data');
			cfg.post_template_data = {};
			for (var i = 0; userhlData[i]; i++) {
				name = userhlData[i].getElementsByClassName('template_title')[0].value;
				if (name != '') {
					cfg.post_template_data[name] = {};
					cfg.post_template_data[name].text = userhlData[i]
							.getElementsByClassName('template_text')[0].value;
				}
			}
			cfg.clear_notify = document.getElementById('clear_notify').value;
			cfg.last_saved = new Date().getTime();
			localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
			allBg.init_listener(cfg);	
	},
	getDefault: function(callback) {
		var defaultURL = chrome.extension.getURL('/src/json/defaultconfig.json');
		var temp, defaultConfig;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", defaultURL, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				temp = JSON.parse(xhr.responseText);
				defaultConfig = JSON.stringify(temp);
				callback(defaultConfig);
			}
		}
		xhr.send();	
	},
	restoreFromText: function(evt) {
		// check that file is .txt before passing to loadcfg function
		var file = evt.target.files[0];
		if (!file.type.match('text.*')) {
			alert("Not a text file...");
			return;
		}
		else {
			var reader = new FileReader();
			reader.onload = function(evt) {
				var textFile = evt.target.result;
				config.functions.processConfig(textFile);
			}
			reader.readAsText(file);
		}	
	},	
	restoreV1: function(oC) {
		var cfg = JSON.parse(localStorage['ChromeLL-Config']);
		var hls = oC.conf['chromeLL_userhighlight'].split(';');
		var hl = Array();
		cfg.user_highlight_data = {};
		for (var i = 0; hls[i]; i++) {
			hl = hls[i].split(':');
			console.log(hl[0]);
			cfg.user_highlight_data[hl[0]] = {};
			cfg.user_highlight_data[hl[0]].bg = hl[1];
			cfg.user_highlight_data[hl[0]].color = hl[3];
		}
		var boolSettings = {
			"force_https" : "chromeLL_forcehttps",
			"short_title" : "chromeLL_shorttitle",
			"float_userbar" : "chromeLL_floatbars",
			"ignorator" : "chromeLL_ignoretopicsbyon",
			"ignorator_list" : "chromeLL_ignoretopicsby",
			"enable_user_highlight" : "chromeLL_userhighlighton",
			"number_posts" : "chromeLL_numberposts",
			"enable_user_highlight" : "chromeLL_userhighlighton"
		}
		for ( var i in boolSettings) {
			if (oC.conf[i] == "true")
				cfg[i] = true;
		}
		cfg.ignorator_list = oC.conf['chromeLL_ignoretopicsby'];
		cfg.ignore_keyword_list = oC.conf['chromeLL_ignoretopics'];
		cfg.last_saved = new Date().getTime();
		console.log(cfg);
		localStorage['ChromeLL-Config'] = JSON.stringify(cfg);	
	},
	show: function() {
		document.getElementById('cfg_ta').value = localStorage['ChromeLL-Config'];
	},
	download: function(textfile) {
		config.save();
		var cfg = localStorage['ChromeLL-Config'];
		var data = new Blob([cfg], {type: 'text/plain'})
		var textfile = window.URL.createObjectURL(data);
		return textfile;	
	},	
	init: function() {
		console.log('loading config');
		var cfg = JSON.parse(localStorage['ChromeLL-Config']);
		var checkboxes = $(":checkbox");
		for ( var i in checkboxes) {
			checkboxes[i].checked = cfg[checkboxes[i].id];
		}
		var textboxes = $(":text");
		for (var i in textboxes) {
			if (textboxes[i].name
					&& (textboxes[i].name.match('(user|keyword|tag)_highlight_') 
							|| textboxes[i].name.match('user_book') 
							|| textboxes[i].name.match('snippet') 
							|| textboxes[i].name.match('rep_ignore') 
							|| textboxes[i].name.match('users') 
							|| textboxes[i].name.match('token') 
							|| textboxes[i].name.match('post_template'))) {
				// console.log('found a textbox to ignore: ' + textboxes[i]);
			} else if (cfg[textboxes[i].id]) {
				textboxes[i].value = cfg[textboxes[i].id];
			}
		}
		for ( var j in cfg.user_highlight_data) {
			document.getElementsByClassName('user_name')[document
					.getElementsByClassName('user_name').length - 1].value = j;
			document.getElementsByClassName('header_bg')[document
					.getElementsByClassName('header_bg').length - 1].value = cfg.user_highlight_data[j].bg;
			document.getElementsByClassName('header_color')[document
					.getElementsByClassName('header_color').length - 1].value = cfg.user_highlight_data[j].color;
			config.ui.addDiv.userHighlight();
		}
		for ( var j in cfg.bookmark_data) {
			document.getElementsByClassName('bookmark_name')[document
					.getElementsByClassName('bookmark_name').length - 1].value = j;
			document.getElementsByClassName('bookmark_tag')[document
					.getElementsByClassName('bookmark_tag').length - 1].value = cfg.bookmark_data[j];
			config.ui.addDiv.bookmarkName();
		}
		for ( var j in cfg.snippet_data) {
			document.getElementsByClassName('snippet_name')[document
					.getElementsByClassName('snippet_name').length - 1].value = j;
			document.getElementsByClassName('snippet')[document
					.getElementsByClassName('snippet').length - 1].value = cfg.snippet_data[j];
			config.ui.addDiv.snippetName();
		}
		for (var j = 0; cfg.keyword_highlight_data[j]; j++) {
			document.getElementsByClassName('keyword')[document
					.getElementsByClassName('keyword').length - 1].value = cfg.keyword_highlight_data[j].match;
			document.getElementsByClassName('keyword_bg')[document
					.getElementsByClassName('keyword_bg').length - 1].value = cfg.keyword_highlight_data[j].bg;
			document.getElementsByClassName('keyword_color')[document
					.getElementsByClassName('keyword_color').length - 1].value = cfg.keyword_highlight_data[j].color;
			config.ui.addDiv.keywordHighlight();
		}
		for (var j = 0; cfg.tag_highlight_data[j]; j++) {
			document.getElementsByClassName('tag')[document
					.getElementsByClassName('tag').length - 1].value = cfg.tag_highlight_data[j].match;
			document.getElementsByClassName('tag_bg')[document
					.getElementsByClassName('tag_bg').length - 1].value = cfg.tag_highlight_data[j].bg;
			document.getElementsByClassName('tag_color')[document
					.getElementsByClassName('tag_color').length - 1].value = cfg.tag_highlight_data[j].color;
			config.ui.addDiv.tagHighlight();
		}
		for ( var j in cfg.post_template_data) {
			document.getElementsByClassName('template_text')[document
					.getElementsByClassName('template_text').length - 1].value = cfg.post_template_data[j].text;
			document.getElementsByClassName('template_title')[document
					.getElementsByClassName('template_title').length - 1].value = j;
			config.ui.addDiv.postTemplate();
		}
		document.getElementById('clear_notify').value = cfg.clear_notify;
		document.addEventListener('keyup', function(evt) {
			if (!evt.target.name)
				return;
			if (evt.target.name == "user_highlight_username") {
				var datas = document.getElementById('user_highlight')
						.getElementsByClassName('user_name');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					config.ui.addDiv.userHighlight();
			}

			if (evt.target.name == "user_book_name") {
				var datas = document.getElementById('bookmarked_tags')
						.getElementsByClassName('bookmark_name');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					config.ui.addDiv.bookmarkName();
			}
			
			if (evt.target.name == "user_snippet") {
				var datas = document.getElementById('snippets')
						.getElementsByClassName('snippet_name');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					config.ui.addDiv.snippetName();
			}

			if (evt.target.name == "post_template_title") {
				var datas = document.getElementById('post_template')
						.getElementsByClassName('template_title');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					config.ui.addDiv.postTemplate();
			}
			if (evt.target.name == "keyword_highlight_keyword") {
				var datas = document.getElementById('keyword_highlight')
						.getElementsByClassName('keyword');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					config.ui.addDiv.keywordHighlight();
			}
			if (evt.target.name == "tag_highlight_keyword") {
				var datas = document.getElementById('tag_highlight')
						.getElementsByClassName('tag');
				var empty = false;
				for (var i = 1; datas[i]; i++) {
					if (datas[i].value == '')
						empty = true;
				}
				if (!empty)
					config.ui.addDiv.tagHighlight();
			}
		});
		// show version
		var app = chrome.app.getDetails();
		document.getElementById('version').innerText = app.version;
		document.getElementById('downloadcfg').href = config.download();
		// show size on disk of imagemap cache
		chrome.storage.local.getBytesInUse("imagemap", function(bytes) {
			var megabytes = bytes / 1048576;
			// round to 2 decimal places
			document.getElementById('cache_size').innerHTML = Math.round(megabytes * 100) / 100;
		});
		// display table of imagemap cache contents
		chrome.storage.local.get("imagemap", function(cached) {
			var table = document.getElementById('cache_contents');
			var cachedImagemap = cached.imagemap;
			if (!cachedImagemap) {
				var empty = document.createElement('tr');
				empty.innerHTML = 'Empty';
				table.appendChild(empty);
				return;
			}
			else {		
				var table = document.getElementById('cache_contents');
				var firstRow = document.createElement('tr');				
				var firstData = document.createElement('td');
				var secondData = document.createElement('td');	
				firstData.innerHTML = '<b>Filename:</b>';
				secondData.innerHTML = '<b>URL:</b>';
				table.appendChild(firstRow);
				firstRow.appendChild(firstData);
				firstRow.appendChild(secondData);
				for (var i in cachedImagemap) {
					var cachedImage = cachedImagemap[i];
					var tableRow = document.createElement('tr');				
					var filenameData = document.createElement('td');
					var urlData = document.createElement('td');								
					var filename = cachedImage.filename;
					var fullsize = cachedImage.fullsize;
					if (fullsize.length > 100) {
						var url = fullsize.substring(0, 99) + '...';
					}
					else {
						var url = fullsize;
					}
					var data = cachedImage.data;
					tableRow.id = i;
					// filename table row contains input field
					filenameData.innerHTML = '<input type="text" class="cache_filenames" id="' + filename 
							+ '" value="' + filename +'" style="width:400px;">';
					urlData.innerHTML = '<a class="cache_url" title="' + fullsize + '" href="' + data + '">' + url + '</a>';
					table.appendChild(tableRow);
					tableRow.appendChild(filenameData);
					tableRow.appendChild(urlData);
				}
			}
		});
		if (document.readyState == 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				config.ui.hideMenus();
				config.ui.setColorPicker();
				config.listeners.menuVisibility();
				config.listeners.click();
				config.listeners.change();
				config.save();
			});
		} else {
			config.ui.hideMenus();
			config.ui.setColorPicker();
			config.listeners.menuVisibility();
			config.listeners.click();
			config.listeners.change();
			config.save();
		}		
	}
}
