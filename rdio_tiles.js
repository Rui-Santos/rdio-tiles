/*
* Rdio Heavy Rotation Grid
* @preserve */
(function() {
	window.r_tiles = {
		config: {
			animate: (function(s) {
				return 'WebkitAnimation' in s ||
			              'MozAnimation' in s ||
			               'msAnimation' in s ||
			                 'Animation' in s;
			}(document.body.style))
		},
		grids: [],
		init: function() {
			// loop through all of the hooks and create grids
			var hooks = document.querySelectorAll('.rdio-tiles');
			var length = hooks.length;
			var i = 0;
			var grid;

			// don't render for mobile users
			if ($(window).width() < 768) {
				return;
			}

			for (i; i < length; i++) {
				grid = new Grid({
					element: hooks[i],
					config: {
						username: hooks[i].getAttribute("data-user"),
						columns: parseInt(hooks[i].getAttribute("data-columns"), 10),
						rows: parseInt(hooks[i].getAttribute("data-rows"), 10)
					}
				});
				this.grids.push(grid);
			}
		}
	}

	function Tile(args) {
		var self = this;
		this.art = args.art;
		this.url = args.data.shortUrl;
		this.data = args.data;
		
		this.init = function() {
			this.element = document.createElement('figure');
			this.element.style.backgroundImage = args.art;
			this.element.setAttribute("data-url", this.url);
			$(this.element).data('object', this);
		}
		this.init();
	}

	function Popover(args) {
		this.data = args.data;
		this.event = args.event;

		this.init = function() {
			var width, half, left, top, point;
			var artist = (this.data.artist === 'Various Artists') ? this.data.artist : '<a href="http://rdio.com' + this.data.artistUrl + '">' + this.data.artist + '</a>';
			var windowWidth = $(window).width();
			this.el = $('<div class="rdio-popover"><div class="point"></div><h2><a href="http://rdio.com' + this.data.url + '">' + this.data.name + '</a></h2><p>' + artist + '</p><p>' + this.data.releaseDate.split('-')[0] + '</p></div>').appendTo('body');
			
			point = this.el.find('.point');
			width = this.el.outerWidth();
			half = width / 2;
			height = this.el.outerHeight();
			left = this.event.pageX;
			top = this.event.pageY - height - 8;

			// collision detection with the right edge of the screen
			if (left + half > windowWidth) {
				left = windowWidth - half;
				point.css('left', (this.event.pageX - left) + half + 'px');
			}

			// collision detection with the left edge of the screen
			if (left - half < 0) {
				left = half;
				point.css('left', (this.event.pageX - left) + half + 'px');
			}

			this.el.css({
				left: left + 'px',
				top: top + 'px'
			});
		}

		this.init();
	}

 	function Grid(args) {
		var self = this;
		var args = args || {};
		
		this.element = args.element;
		this.tiles = [];
		this.tooltips = [];

		this.config = args.config || {};
		this.config.columns = args.config.columns ? args.config.columns : 5;
		this.config.rows = args.config.rows ? args.config.rows : 2;

		this.resize = function() {
			var containerWidth = self.element.clientWidth;
			var tileWidth = Math.floor(containerWidth / self.config.columns);

			self.deselectTile();

			self.forEach(function(tile) {
				tile.element.style.width = tileWidth + 'px';
				tile.element.style.height = tileWidth + 'px';	
			});
		}

		this.forEach = function(fn) {
			// loop through the tiles and apply fn to each
			var i = 0;
			var length = self.tiles.length;

			for (i; i < length; i++) {
				fn(self.tiles[i]);
			}
		}

		this.selectTile = function(args) {
			var event = args.event;
			var tile = args.tile;
			
			$(tile.element).addClass('selected');
			$(self.element).addClass('tile-selected');
	
			self.makePopover({
				tile: tile,
				event: event
			});
		}

		this.deselectTile = function(args) {
			var tile = args && args.tile ? args.tile : '';			
			$(self.element).removeClass('tile-selected');
			
			if (tile) {
				$(tile.element).removeClass('selected');
			} else {
				$(self.element).find('figure').removeClass('selected');
			}
			
			self.killPopover();
		}

		this.makePopover = function(args) {
			var tile = args.tile;
			var event = args.event;
			
			self.killPopover();
			
			self.popover = new Popover({
				data: tile.data,
				event: event
			});

			return self.popover;
		}

		this.killPopover = function() {
			if (self.popover) {
				var el = self.popover.el;
				
				if (r_tiles.config.animate) {
					self.popover.el.on('animationend msAnimationEnd webkitAnimationEnd', function() {
						el.remove();
					});
				} else {
					el.remove();
				}

				self.popover.el.addClass('removing');
				self.popover = null;
			}
		}

		this.fetch = function(args) {
			var R = window.R;
			var args = args || {};
			
			if (!R) {
				setTimeout(function() {
					self.fetch(args);
				}, 50);
				return;
			}

			self.element.setAttribute("data-status", "fetching");

			R.ready(function() {
				// fetch the user's id
				R.request({
					method: "findUser",
					content: {
						vanityName: self.config.username
					},
					success: function(response) {
						self.user = response.result;
						
						// fetch the user's heavy rotation
						R.request({
							method: "getHeavyRotation",
							content: {
								user: self.user.key,
								type: "albums",
								limit: (self.config.columns * self.config.rows) + ""
							},
							success: function(response) {
								if (args.success) {args.success(response);};
							},
							error: function(response) {
								if (args.error) {args.error(response);};
							}
						});

					},
					error: function(response) {
						if (args.error) {args.error(response);};
					}
				})
			});
		}

		this.init = function() {
			self.fetch({
				success: function(response) {					
					var i = 0;
					var listItems = "";
					var icon, album;
					var length = response.result.length;

					self.response = response;

					$(self.element)
						.append('<div class="meta"><span>Heavy Rotation for <a href="http://www.rdio.com' + self.user.url + '">' + self.config.username + '</a> (powered by Rdio&reg;)</span></div>')
						.attr("data-status", "rendered");
					
					// add the tiles
					for (i; i < length; i++) {
						icon = response.result[i].icon.split('/');
						icon.pop();

						album = new Tile({
							art: "url(" + icon.join('/') + '/square-400.jpg)',
							data: response.result[i]
						});

						self.element.appendChild(album.element);
						self.tiles.push(album);
					}
					
					// event handlers
					$(self.element).on((document.documentElement.touchend ? "touchend" : "click"), 'figure', function(e) {
						if ($(this).hasClass('selected')) {
							self.deselectTile({
								tile: $(this).data('object'),
								event: e
							});
							return;
						}

						$(self.element).find('figure').removeClass('selected');

						self.selectTile({
							tile: $(this).data('object'),
							event: e
						});
					});

					self.resize();

					window.addEventListener('resize', function(){
						self.resize();
					});
				},
				error: function(response) {
					console.log(response);
				}
			})
		}

		this.init();
	}

	r_tiles.init();

}())