var imagemap = function() {
	var imagemapCache = {};
	var currentPage = 1;
	var lastPage = '?';
	
	/**
	 *	Called after user clicks Browse Imagemap button
	 */
	var init = function() {
	
		openDatabase(function() {
				getImagemap(processResponse);		
		});
	};
	
	/**
	 *	Opens connection to database in background page.
	 */
	var openDatabase = function(callback) {
		chrome.runtime.sendMessage({ need: 'openDatabase' }, callback);
	};
	
	/**
	 *	Opens XHR to get current page of imagemap (1 by default)
	 */
	var getImagemap = function(callback) {
		var page = ''
		
		if (currentPage > 1) {
			page = '?page=' + currentPage;
		}

		var url = window.location.protocol + '//images.endoftheinter.net/imagemap.php' + page;
		
		chrome.runtime.sendMessage({
				need: "xhr",
				url: url
		}, function(response) {
				var html = document.createElement('html');
				html.innerHTML = response;		
				callback.call(imagemap, html);
		});			
	};
		
	var processResponse = function(imagemap) {

		scrapeImagegrid(imagemap, function(imageGrid) {		
			var infobar = imagemap.getElementsByClassName('infobar')[1];
			var anchors = infobar.getElementsByTagName('a');
			
			// Find size of imagemap by checking the page navigation anchor tags
			lastPage = anchors[anchors.length - 1].innerHTML;
			
			// Ready to create imagemap popup and cache the thumbnails (if necessary)
			createPopup(imageGrid);
			sendToEncoder(imageGrid);
		});
	};

	var scrapeImagegrid = function(imagemap, callback) {
		// Returns modified grid of images from imagemap for popup
		var imageGrid = imagemap.getElementsByClassName('image_grid')[0];
		var imgs = imageGrid.getElementsByTagName('img')

		loadImagesFromCache(imgs, function() {
			var blockDescs = imageGrid.getElementsByClassName('block_desc');
			
			for (var i = 0, len = blockDescs.length; i < len; i++) {
				var blockDesc = blockDescs[i];
				blockDesc.style.display = 'none';
			}
			
			var gridBlocks = imageGrid.getElementsByClassName('grid_block');
			for (var i = 0, len = gridBlocks.length; i < len; i++) {
				var gridBlock = gridBlocks[i];
				gridBlock.title = "Click to copy image code to clipboard";
			}
			
			callback(imageGrid);		
		});
		
	};
	
	var loadImagesFromCache = function(imgs, callback) {
		// Check database for img.src and replace with base64 string when possible.
		// Wait for all db queries to complete before continuing
		for (let i = 0, len = imgs.length; i < len; i++) {
			let img = imgs[i];

			chrome.runtime.sendMessage({
					need: 'queryDb',
					src: img.src
			}, function(result) {
				
				if (result.data) {
					img.dataset.oldsrc = img.src;
					img.src = result.data;
				}
				
				if (i == len - 1) {
					callback();
				}
				
			});
		}
	}
	
	var createPopup = function(imageGrid, searchResults) {
		var div = document.createElement('div');
		var width = window.innerWidth;
		var height = window.innerHeight;
		var bodyClass = document.getElementsByClassName('body')[0];
		var anchorHeight;
		
		// Style main div
		div.id = "map_div";
		div.style.position = "fixed";
		div.style.width = (width * 0.95) + 'px';
		div.style.height = (height * 0.475) + 'px';
		div.style.left = (width - (width * 0.975)) + 'px';
		div.style.top = (height - (height * 0.975)) + 'px';
		div.style.boxShadow = "5px 5px 7px black";		
		div.style.borderRadius = '6px';	
		div.style.opacity = 1;
		div.style.backgroundColor = 'white';
		div.style.overFlow = 'scroll';
		
		// We need to style the image grid slightly differently depending on whether we have search results to display
		if (searchResults) {			
			var header = document.createElement('div');
			var text = document.createTextNode('Displaying results for query "' + query + '" :');
			header.appendChild(text);
			header.style.color = 'black';
			header.style.position = 'relative';
			header.style.left = '15px';
			header.style.right = '15px';
			header.style.top = '15px';
			header.style.cssFloat = 'left';
			header.style.textAlign = 'left';
			header.style.width = '100%';
			header.style.fontSize = '16px';
			div.appendChild(header);				
			// Account for size of header when sizing image grid
			imageGrid.style.maxHeight = ((height * 0.95) / 2) - 51 + 'px';
			imageGrid.style.maxWidth = (width * 0.95) - 21 + 'px';
		}
		else {
			// Subtract 6px to prevent scrollbar from overlapping rounded corners
			imageGrid.style.maxWidth = (width * 0.95) - 6 + 'px';
			imageGrid.style.maxHeight = ((height * 0.95) / 2)  - 6 + 'px';
		}
		
		// These style properties are set for all instances of popup
		imageGrid.style.position = 'relative';
		imageGrid.style.top = '5px';
		imageGrid.style.overflow = 'scroll';
		imageGrid.style.overflowX = 'hidden';
		
		// Reduce opacity of background page
		bodyClass.style.opacity = 0.3;
		
		// Decide where we should append image grid
		if (searchResults) {
			header.appendChild(imageGrid);
		}
		else {
			div.appendChild(imageGrid);
		}
		
		// Ready to append popup and hide scrollbar of background page
		document.body.appendChild(div);
		document.body.style.overflow = 'hidden';
		
		// Prevent scroll events inside imagemap div from scrolling the rest of the page
		bodyClass.addEventListener('mousewheel', preventScroll);
		
		// Add click listeners to close popup/copy img code to clipboard when appropriate
		bodyClass.addEventListener('click', closePopup);
		
		div.addEventListener('click', function(evt) {
			clickHandler(evt);
			evt.preventDefault();
		});
		
		if (!searchResults) {
			// Load new page after user has scrolled to bottom of existing page.
			imageGrid.addEventListener('scroll', debouncer);
		}
	};
	
	var sendToEncoder = function(imageGrid) {
		// Iterate over images and send to encoder method
		var imgs = imageGrid.getElementsByTagName('img');
		
		for (var i = 0, len = imgs.length; i < len; i++) {
			var img = imgs[i];
			var src = img.src;

			// Images without oldsrc dataset need to be cached
			if (!img.dataset.oldsrc) {
				// We need to look in different places for loaded and placeholder image hrefs
				if (img.parentNode.className === 'img-loaded') {		
					var href = img.parentNode.parentNode.href;
				}
				else {
					var href = img.parentNode.href;
				}
				
				encodeToBase64(src, href);
			}
		}
	};
	
	var encodeToBase64 = function(src, href) {
		// Draw each image to canvas so we can encode it as base64 string	
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		
		var img = new Image;
		img.crossOrigin = 'Anonymous';
		
		img.onload = function() {
			canvas.height = this.height;
			canvas.width = this.width;
			context.drawImage(this, 0, 0);	
			
			var imageData = {
					'dataUri': canvas.toDataURL(),
					'src': src, 
					'href': href
			};
			
			// We are now ready to cache image data
			cacheImageData(imageData);
		};
		
		// Use cors-anywhere server to deal with CORS restrictions
		img.src = window.location.protocol + '//cors-for-chromell.herokuapp.com/' + src;
	};
	
	var cacheImageData = function(imageData) {
		var cacheData = {};
		var dataUri = imageData.dataUri;
		var href = imageData.href;
		var src = imageData.src;
		// Thumbnails are always jpgs - fullsize image could have a different file format (found in href)			
		var extension = href.match(/\.(gif|jpg|png)$/i)[0];
		var fullsize = src.replace('.jpg', extension);
		fullsize = fullsize.replace('dealtwith.it/i/t', 'endoftheinter.net/i/n');
		var filename = fullsize.match(/\/([^/]*)$/)[1];						
		filename = decodeURIComponent(filename);
		
		if (!filename || !fullsize || !dataUri) {
			// This probably shouldn't happen
			console.log('Error while caching image: ', '\n', src, filename, fullsize, dataUri);
			return;
		}
		else {
			cacheData[src] = {"src": src, "filename": filename, "fullsize": fullsize, "data": dataUri};

			chrome.runtime.sendMessage({
					need: 'addToDatabase',
					data: cacheData
			});			
		}
	};
	
	var debouncerId = '';
	
	var debouncer = function() {
		clearTimeout(debouncerId);
		debouncerId = setTimeout(scrollHandler, 250);
	};
	
	var scrollHandler = function(imageGrid) {
		var imageGrid = document.getElementsByClassName('image_grid')[0]
		// Check whether user is at end of current page - subtract 5 pixels from clientHeight 
		// to account for large zoom levels)
		if (imageGrid.scrollTop >= imageGrid.scrollHeight - imageGrid.clientHeight - 5) {			
			if (currentPage === lastPage) {
				// No more pages to load
				return;
			}
			else {
				// Load next page and append to current grid 
				currentPage++;
				getImagemap(function(imagemap) {
					
					scrapeImagegrid(imagemap, function(newGrid) {
						imageGrid.appendChild(newGrid);
						sendToEncoder(newGrid);
					});
					
				});
			}
		}
	};
	
	var clickHandler = function(evt) {
		if (evt.target.id == 'image_search') {
			return;
		}
		
		else if (evt.target.tagName === 'IMG') {
			var clipboard = {};
								
			src = evt.target.dataset.oldsrc || evt.target.src;
						
			if (evt.target.parentNode.tagName === 'A') {
				// We need to replace thumbnail extension with fullsize extension
				var regex = /\.(gif|jpg|png)$/i;
				var fullsizeExtension = evt.target.parentNode.href.match(regex)[0];
				src = src.replace('.jpg', fullsizeExtension);
			}
			
			// Formulate request with LLML img code string
			var request = {
				need: 'copy',
				data:  '<img src="' + src.replace('dealtwith.it/i/t', 'endoftheinter.net/i/n') + '" />'
			};
			
			// Pass data to background page so we can copy it to clipboard
			chrome.runtime.sendMessage(request);
		}
		// Always close popup after click event, even if user didn't click on an image
		closePopup();				
		
		evt.preventDefault();
	};
	
	var closePopup = function() {		
		var div = document.getElementById('map_div') || document.getElementById('search_results');
		var bodyClass = document.getElementsByClassName('body')[0];
		if (div) {
			document.body.removeChild(div);
		}
		bodyClass.style.opacity = 1;
		document.body.style.overflow = 'initial';
		bodyClass.removeEventListener('mousewheel', preventScroll);		
		currentPage = 1;
		
		// Remove event listeners
		document.removeEventListener('click', clickHandler);
		document.removeEventListener('mousewheel', preventScroll);
				
		// Close database connection
		chrome.runtime.sendMessage({ need: 'closeDatabase' });		
		
	};
	
	var preventScroll = function(evt) {
		evt.preventDefault();
	};
	
	var search = function() {

		var init = function() {
			var query = document.getElementById('image_search').value;
			
			// Check that query contains characters other than whitespace
			if (/\S/.test(query)) {
				
				if (!document.getElementById('search_results')) {
					createPopup(query);						
				}

				else {
					var oldGrid = document.getElementById('results_grid') || document.getElementById('no_results_grid');
					
					if (oldGrid) {
						oldGrid.remove();					
					}
					
					document.getElementById('loading_image').style.display = 'block';							
				}
				
				lookupInDb(query, function(results) {
					processResults(results, query);				
				});
			}
			
			else {
				// Detected empty search box after keyup event - close imagemap popup (if it exists)
				if (document.getElementById('search_results')) {
					closePopup();
				}
			}
			
		};
		
		var lookupInDb = function(query, callback) {
			var request = {
					need: 'searchDatabase',
					query: query			
			};
			
			openDatabase(function() {
				chrome.runtime.sendMessage(request, callback);
			});									
		};
		
		var processResults = function(results, query) {
			if (results.length === 0) {
				// No matches - call updatePopup with false value
				updatePopup(false, query);
			}
			else {
				// Format search results to be displayed in popup
				formatResults(results, query);
			}
		};
		
		var formatResults = function(data, query) {
			var grid = document.createElement('div');	
			grid.className = 'image_grid';
			grid.id = 'results_grid';
			grid.style.clear = 'left';
			
			for (var i in data) {
				var block = document.createElement('div');
				block.className = 'grid_block';
				var img = document.createElement('img');
				img.dataset.oldsrc = data[i].fullsize;				
				img.setAttribute('searchresult', true);
				img.src = data[i].data;
				block.className = 'grid_block';
				block.style.display = 'inline';
				block.appendChild(img);
				grid.appendChild(block);						
			}
			
			updatePopup(grid, query);
		};
		
		var createPopup = function(query) {
			var header = document.createElement('div');
			var image = document.createElement('img');
			var imageURL = chrome.extension.getURL('/src/images/loading.png');
			image.id = 'loading_image';
			image.style.display = 'block';
			image.style.marginLeft = 'auto';
			image.style.marginRight = 'auto';
			image.style.marginTop = 'auto';
			image.style.marginBottom = 'auto';
			image.src = imageURL;					
			header.innerHTML = 'Displaying results for query "<span id="query">' + query + '</span>" :';					
			var div = document.createElement('div');
			var width = window.innerWidth;
			var height = window.innerHeight;
			var bodyClass = document.getElementsByClassName('body')[0];		
			div.id = "search_results";
			div.style.position = "fixed";				
			div.style.width = (width * 0.95) + 'px';
			div.style.height = (height * 0.95) / 2 + 'px';
			div.style.left = (width - (width * 0.975)) + 'px';
			div.style.top = (height - (height * 0.975)) + 'px';
			div.style.boxShadow = "5px 5px 7px black";		
			div.style.borderRadius = '6px';	
			div.style.backgroundColor = 'white';
			div.style.overFlow = 'scroll';
			header.style.color = 'black';
			header.style.position = 'relative';
			header.style.left = '15px';
			header.style.right = '15px';
			header.style.top = '15px';
			header.style.cssFloat = 'left';
			header.style.textAlign = 'left';
			header.style.width = '100%';
			header.style.fontSize = '16px';
			header.id = 'results_header';
			div.appendChild(header);
			div.appendChild(image);
			document.body.appendChild(div);					
			document.body.style.overflow = 'hidden';
			bodyClass.addEventListener('mousewheel', preventScroll);
			bodyClass.addEventListener('click', closePopup);
			document.addEventListener('click', clickHandler);
		};
		
		var updatePopup = function(results, query) {
			document.getElementById('loading_image').style.display = 'none';
			var popup = document.getElementById('search_results');
			var oldGrid = document.getElementById('results_grid') || document.getElementById('no_results_grid');
			var header = document.getElementById('results_header');	
			var querySpan = document.getElementById('query');
			var width = window.innerWidth;
			var height = window.innerHeight;					
			if (querySpan.innerHTML != query) {				
				querySpan.innerHTML = query;
			}
			if (!results) {
				var textDiv = document.createElement('div');
				var text = document.createTextNode('No matches found.');
				textDiv.id = 'no_results_grid'
				textDiv.style.position = 'relative';
				textDiv.style.top = '5px';
				textDiv.appendChild(text);
				if (oldGrid) {
					if (oldGrid.id === 'no_results_grid') {
						return;
					}
					else {
						oldGrid.remove();	
						header.appendChild(textDiv);
						return;
					}
				}
				else {
					header.appendChild(textDiv);
					return;
				}
			}
			else {
				results.style.maxHeight = ((height * 0.95) / 2) - 51 + 'px';
				results.style.maxWidth = (width * 0.95) - 21 + 'px';
				results.style.position = 'relative';
				results.style.top = '5px';
				results.style.overflow = 'scroll';
				results.style.overflowX = 'hidden';
				if (oldGrid) {
					oldGrid.remove();
				}
				header.appendChild(results);
			}
		};
		
		return { init: init };
		
	}();
	
	return {
		init: init,
		search : search
	};
	
}();