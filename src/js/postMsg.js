var postMsg = {
	batch_uploader : function() {
		var ulBox = document.createElement('input');
		ulBox.type = 'file';
		ulBox.multiple = true;
		ulBox.value = "Batch Upload";
		ulBox.id = "batch_uploads";
		var ulButton = document.createElement('input');
		ulButton.type = "button";
		ulButton.value = "Batch Upload";
		ulButton.addEventListener('click', postMsgHelper.startBatchUpload);
		document.getElementsByTagName('form')[0].insertBefore(ulBox, null);
		document.getElementsByTagName('form')[0].insertBefore(ulButton, ulBox);
	},
	post_before_preview : function() {
		var post, preview;
		var m = document.getElementsByTagName('form')[document
				.getElementsByTagName('form').length - 1]
				.getElementsByTagName('input');
		for (var i = 0; i < m.length; i++) {
			if (m[i].name == 'preview') {
				preview = m[i];
			}
			if (m[i].name == 'submit') {
				post = m[i];
			}
		}
		post.parentNode.removeChild(post);
		preview.parentNode.insertBefore(post, preview);
	},
	quick_imagemap: function() {
		var inputElements = document.getElementsByTagName('input');
		var lastButton = inputElements[inputElements.length - 1];
		var button = document.createElement('button');
		var divider = document.createTextNode(' ');
		var search = document.createElement('input');
		button.textContent = "Browse Imagemap";					
		button.id = "quick_image";
		search.placeholder = "Search Imagemap...";
		search.id = "image_search";
		lastButton.parentNode.appendChild(divider);
		lastButton.parentNode.appendChild(button);
		lastButton.parentNode.appendChild(divider);
		lastButton.parentNode.appendChild(search);
	},
	create_topic_buttons : function() {
		if (document.body.innerHTML.indexOf('Create New Topic') == -1 
		|| document.getElementById('b')) {
			// wrong page, or buttons already exist
			return;
		}
		var txt = document.getElementById('message');
		var input = document.getElementsByTagName('input')[0];
		var tokendesc = document.getElementById('token_desc');
		// deal with tagless topics/etc
		if (!tokendesc) {
			tokendesc = document.getElementsByTagName('em')[0];
		}
		var br = document.createElement('br');
		tokendesc.appendChild(br);
		var insM = document.createElement('input');
		insM.value = 'Mod';
		insM.name = 'Mod';
		insM.type = 'button';
		insM.addEventListener("click", postMsgHelper.qpTagButton, false);
		insM.id = 'mod';
		insM.tabIndex = -1;
		var insQ = document.createElement('input');
		insQ.value = 'Quote';
		insQ.name = 'Quote';
		insQ.type = 'button';
		insQ.addEventListener("click", postMsgHelper.qpTagButton, false);
		insQ.id = 'quote';
		insQ.tabIndex = -1;
		var insS = document.createElement('input');
		insS.value = 'Spoiler';
		insS.name = 'Spoiler';
		insS.type = 'button';
		insS.addEventListener("click", postMsgHelper.qpTagButton, false);
		insS.id = 'spoiler';
		insS.tabIndex = -1;
		var insP = document.createElement('input');
		insP.value = 'Preformated';
		insP.name = 'Preformated';
		insP.type = 'button';
		insP.addEventListener("click", postMsgHelper.qpTagButton, false);
		insP.id = 'pre';
		insP.tabIndex = -1;
		var insU = document.createElement('input');
		insU.value = 'Underline';
		insU.name = 'Underline';
		insU.type = 'button';
		insU.addEventListener("click", postMsgHelper.qpTagButton, false);
		insU.id = 'u';
		insU.tabIndex = -1;
		var insI = document.createElement('input');
		insI.value = 'Italic';
		insI.name = 'Italic';
		insI.type = 'button';
		insI.addEventListener("click", postMsgHelper.qpTagButton, false);
		insI.id = 'i';
		insI.tabIndex = -1;
		var insB = document.createElement('input');
		insB.value = 'Bold';
		insB.name = 'Bold';
		insB.type = 'button';
		insB.addEventListener("click", postMsgHelper.qpTagButton, false);
		insB.id = 'b';
		insB.tabIndex = -1;
		tokendesc.insertBefore(insM, tokendesc.nextSibling.lastChild);
		tokendesc.insertBefore(insQ, insM);
		tokendesc.insertBefore(insS, insQ);
		tokendesc.insertBefore(insP, insS);
		tokendesc.insertBefore(insU, insP);
		tokendesc.insertBefore(insI, insU);
		tokendesc.insertBefore(insB, insI);
		tokendesc.insertBefore(document.createElement('br'), insB);
	},
	quickpost_tag_buttons : function() {
		if (document.body.innerHTML.indexOf('Create New Topic') > -1) {
			return;
		}
		var m = document.getElementsByTagName('form')[document
				.getElementsByTagName('form').length - 1];
		if (!m) {
			return;
		}
		var txt = document.getElementById('message');
		txt.focus();
		var insM = document.createElement('input');
		insM.value = 'Mod';
		insM.name = 'Mod';
		insM.type = 'button';
		insM.id = 'mod';
		insM.addEventListener("click", postMsgHelper.qpTagButton, false);
		var insQ = document.createElement('input');
		insQ.value = 'Quote';
		insQ.name = 'Quote';
		insQ.type = 'button';
		insQ.addEventListener("click", postMsgHelper.qpTagButton, false);
		insQ.id = 'quote';
		var insS = document.createElement('input');
		insS.value = 'Spoiler';
		insS.name = 'Spoiler';
		insS.type = 'button';
		insS.addEventListener("click", postMsgHelper.qpTagButton, false);
		insS.id = 'spoiler';
		var insP = document.createElement('input');
		insP.value = 'Preformated';
		insP.name = 'Preformated';
		insP.type = 'button';
		insP.addEventListener("click", postMsgHelper.qpTagButton, false);
		insP.id = 'pre';
		var insU = document.createElement('input');
		insU.value = 'Underline';
		insU.name = 'Underline';
		insU.type = 'button';
		insU.addEventListener("click", postMsgHelper.qpTagButton, false);
		insU.id = 'u';
		var insI = document.createElement('input');
		insI.value = 'Italic';
		insI.name = 'Italic';
		insI.type = 'button';
		insI.addEventListener("click", postMsgHelper.qpTagButton, false);
		insI.id = 'i';
		var insB = document.createElement('input');
		insB.value = 'Bold';
		insB.name = 'Bold';
		insB.type = 'button';
		insB.addEventListener("click", postMsgHelper.qpTagButton, false);
		insB.id = 'b';
		m.insertBefore(insM, m.getElementsByTagName('textarea')[0]);
		m.insertBefore(insQ, insM);
		m.insertBefore(insS, insQ);
		m.insertBefore(insP, insS);
		m.insertBefore(insU, insP);
		m.insertBefore(insI, insU);
		m.insertBefore(insB, insI);
		m.insertBefore(document.createElement('br'), m
				.getElementsByTagName('textarea')[0]);
	},
	
	drop_batch_uploader: function() {
		var textarea = document.getElementById('message') || document.getElementsByTagName('textarea')[0];
		
		textarea.addEventListener('drop', (evt) => {
			
			var reader = new FileReader();
			
			for (let i = 0, len = evt.dataTransfer.files.length; i < len; i++) {
				
				allPages.asyncUploadHandler(evt.dataTransfer.files[i], (output) => {
					
					allPages.insertIntoMessage(output);
					
				});
			}
			
			evt.preventDefault();
			
		});
	},
	
	snippet_listener : function() {
		const TAB_KEY = 'Tab';
		const SHIFT_KEY = 'Shift';
		
		var ta = document.getElementById('message');
		var caret;
		
		ta.addEventListener('keydown', (event) => {
			if (event.key === TAB_KEY) {
				// prevent default action for tab key so we can attach our own
				event.preventDefault();
				caret = postMsgHelper.findCaret(ta);
				postMsgHelper.snippetHandler(ta.value, caret);
			}
		});
	}
}

var postMsgHelper = {
	create_topic_observer : function() {
		var observer = new MutationObserver((mutations) => {
			// makes sure that create_topic_buttons are visible after tags have been added/removed
			var mutation;
			for (var i = 0, len = mutations.length; i < len; i++) {
				mutation = mutations[i];
				// check for mutations to tag description field
				if (mutation.target.id == 'token_desc') {
					if (mutation.addedNodes.length > 1 
							&& mutation.addedNodes[1].tagName == "EM") {
						// warning displayed (topic has no tags, incompatible tags, or too many tags)
						postMsg.create_topic_buttons();
					}
					if (mutation.removedNodes.length > 1 
							&& mutation.removedNodes[1].tagName == "EM") {
						// warning removed
						postMsg.create_topic_buttons();
					}
					if (mutation.addedNodes.length > 1 
							&& mutation.addedNodes[1].tagName == "B") {
						// second/third/fourth tag has been added to topic
						postMsg.create_topic_buttons();
					}
				}
			}
		});
		observer.observe(document, {
			subtree: true,
			characterData: true,
			childList: true,
			attributes: true
		});
	},
	findCaret : function(ta) {
		var caret = 0;
		if (ta.selectionStart || ta.selectionStart == '0') {
			caret = ta.selectionStart; 
		}
		return (caret);
	},
	snippetHandler : function(ta, caret) {
		var text = ta.substring(0, caret);
		var words, word, snippet, temp, index, newCaret;
		var message = document.getElementById('message');
		if (text.indexOf(' ') > -1) {
			words = text.split(' ');
			word = words[words.length - 1];
			if (word.indexOf('\n') > -1) {
				// makes sure that line breaks are accounted for
				words = word.split('\n');
				word = words[words.length - 1];
			}
		}
		else if (text.indexOf('\n') > -1) {
			// line break(s) in text - no spaces
			words = text.split('\n');
			word = words[words.length - 1];
		}
		else {
			// first word in post
			word = text;
		}
		for (var key in config.snippet_data) {
			if (key === word) {
				snippet = config.snippet_data[key];
				index = text.lastIndexOf(word);
				temp = text.substring(0, index);
				ta = ta.replace(text, temp + snippet);
				message.value = ta;
				// manually move caret to end of pasted snippet
				// as replacing message.value moves caret to end of input
				newCaret = ta.lastIndexOf(snippet) + snippet.length;
				message.setSelectionRange(newCaret, newCaret);
			}
		}
	},
	startBatchUpload : function(evt) {
		var chosen = document.getElementById('batch_uploads');
		if (chosen.files.length == 0) {
			alert('Select files and then click "Batch Upload"');
			return;
		}
		document.getElementsByTagName('form')[0].getElementsByTagName('b')[2].innerHTML += " (Uploading: 1/"
				+ chosen.files.length + ")";
		for (var i = 0; chosen.files[i]; i++) {
			allPages.asyncUpload(chosen.files[i]);
		}
	},
	qpTagButton : function(e) {
		if (e.target.tagName != 'INPUT') {
			return 0;
		}
		// from foxlinks
		var tag = e.target.id;
		var open = new RegExp("\\*", "m");
		var ta = document.getElementById('message');
		var st = ta.scrollTop;
		var before = ta.value.substring(0, ta.selectionStart);
		var after = ta.value.substring(ta.selectionEnd, ta.value.length);
		var select = ta.value.substring(ta.selectionStart, ta.selectionEnd);

		if (ta.selectionStart == ta.selectionEnd) {
			if (open.test(e.target.value)) {
				e.target.value = e.target.name;
				var focusPoint = ta.selectionStart + tag.length + 3;
				ta.value = before + "</" + tag + ">" + after;
			} else {
				e.target.value = e.target.name + "*";
				var focusPoint = ta.selectionStart + tag.length + 2;
				ta.value = before + "<" + tag + ">" + after;
			}

			ta.selectionStart = focusPoint;
		} else {
			var focusPoint = ta.selectionStart + (tag.length * 2)
					+ select.length + 5;
			ta.value = before + "<" + tag + ">" + select + "</" + tag + ">"
					+ after;
			ta.selectionStart = before.length;
		}

		ta.selectionEnd = focusPoint;
		ta.scrollTop = st;
		ta.focus();
	},
	imagemapDebouncer: '',
	imagemapHelper: function() {
		
		var button = document.getElementById('quick_image');
		
		button.addEventListener('click', (evt) => {
				// imagemap object located in imagemap.js
				imagemap.init();
				evt.preventDefault();
		});
		
		var input = document.getElementById('image_search');
		
		input.addEventListener('keyup', () => {
			
			clearTimeout(postMsgHelper.imagemapDebouncer);
			
			this.imagemapDebouncer = setTimeout(() => {
				// imagemap object located in imagemap.js
				imagemap.search.init.call(imagemap.search);
			}, 250);	
			
		});	
	},
	
	init : function() {
		chrome.runtime.sendMessage({ need : "config" }, (response) => {
			config = response.data;
			
			var pm = '';
			
			if (!window.location.href.match('boards')) {
				pm = "_pm";
			}	
		
			for (var i in postMsg) {
				if (config[i + pm]) {
					try {
						postMsg[i]();
					} catch (err) {
						console.log("error in " + i + ":", err);
					}
				}
			}
			
			if (config.create_topic_buttons && !pm) {
				postMsgHelper.create_topic_observer();
			}
			
			if (config.quick_imagemap && pm) {
				postMsg.quick_imagemap();
				postMsgHelper.imagemapHelper();				
			}
		});
	}
}

postMsgHelper.init();
