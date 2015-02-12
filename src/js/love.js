var lovelinks = {
	init: function(config) {
		var date = new Date();
		var dd = date.getDate();
		var mm = date.getMonth() + 1;
		if (mm == 2 && dd == 14) {
			if (config.user_id == 13547 || config.user_id == 5599) {
				if (document.readyState == 'loading') {
					document.addEventListener('DOMContentLoaded', function() {
						lovelinks.addCSSRules();
					});
				}
				else {
					lovelinks.addCSSRules();
				}
			}
		}
	},
	addCSSRules: function() {
		var sheet = document.styleSheets[0];
		sheet.insertRule('div { border-radius: 6px; }', 1);
		var cssSelectors = ['.message-top', '.infobar', '.userbar', 'tr', 'td', 'th'];
		for (var i = 0, len = cssSelectors.length; i < len; i++) {
			var selector = cssSelectors[i];
			sheet.insertRule(selector + ' a:link { color: #661733 !important; }', 1);
			sheet.insertRule(selector + ' a:visited { color: #330433 !important; }', 1);
			sheet.insertRule(selector + ' a:hover { color: #BA239C !important; }', 1);
		}
		sheet.insertRule('body { background-image: url("http://i4.endoftheinter.net/i/n/378c1d4b824ecaf13e99f1bbdbac35fd/heart_tiles.png")', 1);
		sheet.insertRule('.quoted-message { background-color: #EDCAE6 !important; color: #0D030B !important; border-left: 0px !important; }', 1);
		sheet.insertRule('.message-top { background-color: #EDB4E2 !important; color: #0D030B !important; }', 1);
		sheet.insertRule('.quickpost-body { background-color: #EDB4E2 !important; color: #0D030B !important; }', 1);
		sheet.insertRule('.quickpost-canvas { background-color: #EDB4E2 !important; color: #0D030B !important; }', 1);
		sheet.insertRule('.quickpost-canvas a { color: purple !important; }', 1);
		sheet.insertRule('.userbar { background: linear-gradient(to bottom, rgba(255,179,218,1) 0%,rgba(255,129,194,1) 55%) !important; color: #0D030B !important; }', 1);
		sheet.insertRule('.block_desc { background-color: #EDCAE6 !important; color: #0D030B !important; border-left: 0px !important; }', 1);
		sheet.insertRule('.block_desc a { color: black !important; }', 1);
		sheet.insertRule('.infobar { background: linear-gradient(to bottom, rgba(255,217,237,1) 0%,rgba(255,191,224,1) 55%) !important; color: #0D030B !important; }', 1);
		sheet.insertRule('.userpic { background: linear-gradient(135deg, rgba(252,199,240,1) 8%,rgba(229,139,205,1) 100%,rgba(168,0,119,1) 100%,rgba(219,54,164,1) 100%) !important; color: #0D030B !important; color: F74F4F !important; border-left: 0px !important; }', 1);
		sheet.insertRule('th { border-radius: 6px; background: linear-gradient(to bottom, rgba(255,217,237,1) 0%,rgba(255,191,224,1) 55%) !important; color: #0D030B !important; }', 1);
		sheet.insertRule('tr { border-radius: 6px; background: linear-gradient(to bottom, rgba(255,233,244,1) 0%,rgba(255,219,238,1) 55%) !important; color: #0D030B !important; }', 1);
		sheet.insertRule('td { border-radius: 6px; background: linear-gradient(to bottom, rgba(255,233,244,1) 0%,rgba(255,219,238,1) 55%) !important; color: #0D030B !important; }', 1);
		sheet.insertRule('small { color: black !important; }', 1);
		sheet.insertRule('[highlighted] { background: linear-gradient(to bottom, rgba(255,165,212,1) 13%,rgba(254,108,183,1) 55%,rgba(255,165,212,1) 87%,rgba(255,165,212,1) 100%) !important; }', 1);
		sheet.insertRule('.menubar a:link { color: #6E155D !important; }', 1);
		sheet.insertRule('.menubar a:visited { color: #1C0618 !important; }', 1);
		sheet.insertRule('.menubar a:hover { color: #BA239C !important; }', 1);
		sheet.insertRule('.menubar span { background-color: white !important; }', 1);
		sheet.insertRule('h1 { color: #1C0618 !important; }', 1);
		sheet.insertRule('h2 { color: #1C0618 !important; }', 1);
		sheet.insertRule('h2 a:link { color: #6E155D !important; }', 1);
		sheet.insertRule('h2 a:visited { color: #1C0618 !important; }', 1);
		sheet.insertRule('h2 a:hover { color: #BA239C !important; }', 1);
		sheet.insertRule('span { color: #1C0618 !important; }', 1);
		sheet.insertRule('.quickpost-nub { background-color: white !important; }', 1);
		sheet.insertRule('form { color: black !important; }', 1);	
		sheet.insertRule('.tag-div { background-color: white !important; }', 1);
		sheet.insertRule('.tag-div a { color: purple !important; }', 1);
		sheet.insertRule('#cozpop { content: url(http://i2.endoftheinter.net/i/n/d8c28f3337f428fc7b119617ba8ce2fc/my%20fox.jpg); }', 1);
		sheet.insertRule('img[style*="position: absolute; right: 10px; margin-top: -45px;"] { content: url(http://i4.endoftheinter.net/i/n/7757cbfaa8e20594a92bd86fcefa7896/heart__free_avatar_by_thedeathofsen-d3lb5q8.gif); }', 1);		
		
		var title = document.getElementsByTagName('h1')[0] || document.getElementsByTagName('h2')[0];
		var rnd = Math.floor(Math.random() * 10) + 1;
		var donger;
		switch(rnd) {
				case 1:
						donger = '( ˘ ³˘)♥ ';
						break;
				case 2:
						donger = '(＾・ω・＾)♥ ';
						break;
				case 3:
						donger = 'ƪ(♥ﻬ♥)ʃ ';
						break;								
				case 4:
						donger = '(✿ ♥‿♥) ';
						break;								
				case 5:
						donger = '(❛ ◡ ❛)❤ ';
						break;			
				case 6:
						donger = '(ღ˘❤˘ღ) ';
						break;
				case 7:
						donger = 'ʕ　❤ᴥ❤ʔ ';
						break;
				case 8:
						donger = '(▰˘◡˘▰)❤ ';
						break;
				case 9:
						donger = '(づ｡❤‿‿❤｡)づ ';
						break;
				case 10:
						donger = '(≖ˇωˇ≖)♥ ';
						break;								
				default:
						donger = '( ˘ ³˘)♥ ';
						break;
		}			
		title.innerHTML = donger + '&nbsp' + title.innerHTML + '~';				
		document.title = '♥ ' + document.title + ' ♥';
	}
};

chrome.runtime.sendMessage({
	need: "config"
}, function(config) {
	lovelinks.init(config.data);
});