var lovelinks = {
	
	/** 
	 *  Combining CSS and JS in this manner is pretty awful - but chrome.tabs.insertCSS() 
	 *  causes a flash of unstyled content, and we have to wait for DOMContentLoaded to fire 
	 *  before we can use the addRule() method. Appending a style element to document.head
	 *  is much faster. The unminified version of minifiedCssString can be found in src/css/lovelinks.css
	 */ 
	 
	minifiedCssString: 'a:link{color:#661733!important}a:visited{color:#330433!important}a:hover{color:#BA239C!important}div{border-radius:6px}body{background-image:url(https://i4.endoftheinter.net/i/n/378c1d4b824ecaf13e99f1bbdbac35fd/heart_tiles.png)!important}body.snow{background-color:#ccf!important}.quoted-message{background-color:#EDCAE6!important;color:#0D030B!important;border-left:0!important}.quoted-message div:not(.message-top):not(.imgs){background-color:#D4ABCC!important;color:#0D030B!important;border-left:0!important}.quoted-message div:not(.message-top):not(.imgs) div:not(.message-top):not(.imgs){background-color:#B593AE!important;color:#0D030B!important;border-left:0!important}.message-top,.quickpost-canvas{background-color:#EDB4E2!important;color:#0D030B!important}.quickpost-body{ackground-color:#EDB4E2!important;color:#0D030B!important}.quickpost-canvas a{color:purple!important}.block_desc,.infobar,.userbar{color:#0D030B!important}.quickpost-nub{background-color:#fff!important}.userbar{background:linear-gradient(to bottom,rgba(255,179,218,1) 0,rgba(255,129,194,1) 55%)!important}.infobar{background:linear-gradient(to bottom,rgba(255,217,237,1) 0,rgba(255,191,224,1) 55%)!important}.block_desc{background-color:#BFA6BA!important;border-left:0!important}.block_desc a,small{color:#000!important}td,th,tr{border-radius:6px;color:#0D030B!important}th{background:linear-gradient(to bottom,rgba(255,217,237,1) 0,rgba(255,191,224,1) 55%)!important}td,tr{background:linear-gradient(to bottom,rgba(255,233,244,1) 0,rgba(255,219,238,1) 55%)!important}[highlighted]:not(a){background:linear-gradient(to bottom,rgba(255,165,212,1) 13%,rgba(254,108,183,1) 55%,rgba(255,165,212,1) 87%,rgba(255,165,212,1) 100%)!important}.menubar{border:0!important}#bookmarks a:link,.menubar a:link{color:#6E155D!important}#bookmarks a:visited,.menubar a:visited{color:#1C0618!important}#bookmarks a:hover,.menubar a:hover,h2 a:hover{color:#BA239C!important}#hold_menu,.tag-div a{color:purple!important}#bookmarks span,.menubar span,span.menubar{background-color:#fff!important}.snow #bookmarks span,.snow .menubar,.snow span.menubar{background-color:#ccf!important}#hold_menu,.tag-div{background-color:#fff!important}h1,h2,h2 a:visited,span{color:#1C0618!important}h2 a:link{color:#6E155D!important}form{color:#000!important}#cozpop{content:url(http://i2.endoftheinter.net/i/n/d8c28f3337f428fc7b119617ba8ce2fc/my%20fox.jpg)}img[style*="position: absolute; right: 10px; margin-top: -45px;"]{content:url(http://i4.endoftheinter.net/i/n/7757cbfaa8e20594a92bd86fcefa7896/heart__free_avatar_by_thedeathofsen-d3lb5q8.gif)}#nextpage{background-color:#D1A3F0!important;color:#4B2A82!important}.control span{background:linear-gradient(to bottom,rgba(255,233,244,1) 0,rgba(255,219,238,1) 55%)!important;color:#0D030B!important}',
	
	init: function(config) {
		if (config.user_id == 13547 || config.user_id == 5599) {
			
			if (config.fun_css) {

				if (config.debug) {
					// Use lovelinks.css for easier debugging
					chrome.runtime.sendMessage({
						need: "insertcss",
						file: "src/css/lovelinks.css"
					});					
				}
				
				else {
				this.addStyle();
				}
				
				if (document.readyState == 'loading') {
					document.addEventListener('DOMContentLoaded', () => {
						this.addDongerToTitle();
					});
					
				}
				else {
					this.addDongerToTitle();
				}
			}
		}
	},
	
	/**
	 *  Creates style element using minifiedCssString as the innerHTML.
	 *  Appending to document.head means that we don't have to wait for DOMContentLoaded to fire
	 */
	
	addStyle: function() {
    var node = document.createElement('style');
    node.innerHTML = this.minifiedCssString;
    document.head.appendChild(node);
	},	
	
	addDongerToTitle: function() {
		const dongers = ['( ˘ ³˘)♥ ', '(＾・ω・＾)♥ ', 'ƪ(♥ﻬ♥)ʃ ', '(✿ ♥‿♥) ',  '(´❤‿❤`)*ﾟ✲*☆❤ ', '(ღ˘³˘ღ) ', 'ʕ　❤ᴥ❤ʔ ', '(▰˘◡˘▰)❤ ', '(づ｡❤‿‿❤｡)づ ', '(≖ˇωˇ≖)♥ '];		
		
		var title = document.getElementsByTagName('h1')[0] || document.getElementsByTagName('h2')[0];
		var rnd = Math.floor(Math.random() * 10);		
		
		title.innerHTML = dongers[rnd] + '&nbsp' + title.innerHTML + '~';
		document.title = '♥ ' + document.title + ' ♥';
	}
};

chrome.runtime.sendMessage({
	need: "config"
}, (config) => {
	lovelinks.init.call(lovelinks, config.data);
});