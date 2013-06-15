/*
* Rdio Heavy Rotation Grid
* Unminified: /js/rdio_tiles.js
* @preserve */
(function() {
    var ANIMATE = (function(s) {
        return 'WebkitAnimation' in s ||
                  'MozAnimation' in s ||
                   'msAnimation' in s ||
                     'Animation' in s;
    }(document.body.style));

    function Grid() {
        var self = this;
        var query = window.location.search.split('?')[1].split('&');
        var queryLength = query.length;
        var key, value, kv;

        this.config = {};
        this.element = document.body.appendChild(document.createElement('div'));
        this.element.className = "rdio-grid-container";

        for (var i = 0; i < queryLength; i++) {
            kv = query[i].split('=');
            key = kv[0];
            value = kv[1];
            this.config[key] = value;
        }

        //this.element = args.element;
        this.tiles = [];
        this.tooltips = [];

        // constructor for a single tile
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
            };

            this.init();
        }

        // constructor for a popover
        function Popover(args) {
            this.data = args.data;
            this.event = args.event;

            this.init = function() {
                var width, half, left, top, point;
                var artist = (this.data.artist === 'Various Artists') ? this.data.artist : '<a href="http://rdio.com' + this.data.artistUrl + '" target="_blank">' + this.data.artist + '</a>';
                var windowWidth = $(window).width();
                this.el = $('<div class="rdio-popover"><div class="point"></div><h2><a href="http://rdio.com' + this.data.url + '" target="_blank">' + this.data.name + '</a></h2><p>' + artist + ' (' + this.data.releaseDate.split('-')[0] + ')</p></div>').appendTo('body');

                point = this.el.find('.point');
                width = this.el.outerWidth();
                half = width / 2;
                height = this.el.outerHeight();
                left = this.event.pageX;
                top = this.event.pageY - height - 8;

                // collision detection with the right edge of the container
                if (left + half > windowWidth) {
                    left = windowWidth - half;
                    point.css('left', (this.event.pageX - left) + half + 'px');
                }

                // collision detection with the left edge of the container
                if (left - half < 0) {
                    left = half;
                    point.css('left', (this.event.pageX - left) + half + 'px');
                }

                // collision detection with the top of the container
                if (height > this.event.pageY) {
                    top = this.event.pageY + 8;
                    this.el.addClass('point-up');
                }

                this.el.css({
                    left: left + 'px',
                    top: top + 'px'
                });
            };

            this.init();
        }

        this.resize = function() {
            var containerWidth = self.element.clientWidth;
            var tileWidth = 100 / self.config.columns;
            var tileHeight = Math.floor(containerWidth / self.config.columns);

            self.deselectTile();

            self.forEach(function(tile) {
                tile.element.style.width = tileWidth + '%';
                tile.element.style.height = tileHeight + 'px';
            });
        };

        this.forEach = function(fn) {
            // loop through the tiles and apply fn to each
            var i = 0;
            var length = self.tiles.length;

            for (i; i < length; i++) {
                fn(self.tiles[i]);
            }
        };

        this.selectTile = function(args) {
            var event = args.event;
            var tile = args.tile;

            $(tile.element).addClass('selected');
            $(self.element).addClass('tile-selected');

            self.makePopover({
                tile: tile,
                event: event
            });
        };

        this.deselectTile = function(args) {
            var tile = args && args.tile ? args.tile : '';
            $(self.element).removeClass('tile-selected');

            if (tile) {
                $(tile.element).removeClass('selected');
            } else {
                $(self.element).find('figure').removeClass('selected');
            }

            self.killPopover();
        };

        this.makePopover = function(args) {
            var tile = args.tile;
            var event = args.event;

            self.killPopover();

            self.popover = new Popover({
                data: tile.data,
                event: event
            });

            return self.popover;
        };

        this.killPopover = function() {
            if (self.popover) {
                var el = self.popover.el;

                if (ANIMATE) {
                    self.popover.el.on('animationend msAnimationEnd webkitAnimationEnd', function() {
                        el.remove();
                    });
                } else {
                    el.remove();
                }

                self.popover.el.addClass('removing');
                self.popover = null;
            }
        };

        this.fetch = function(args) {
            var R = window.R;
            var _args = args || {};

            $(self.element).attr('data-status', 'loading');

            if (!R) {
                setTimeout(function() {
                    self.fetch(_args);
                }, 50);
                return;
            }

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
                                if (_args.success) {_args.success(response);}
                            },
                            error: function(response) {
                                if (_args.error) {_args.error(response);}
                            }
                        });

                    },
                    error: function(response) {
                        if (_args.error) {_args.error(response);}
                    }
                });
            });
        };

        this.init = function() {
            self.fetch({
                success: function(response) {
                    var i = 0;
                    var listItems = "";
                    var icon, album;
                    var length = response.result.length;

                    self.response = response;

                    $(self.element)
                        .append('<div class="meta"><span>Heavy Rotation for <a href="http://www.rdio.com' + self.user.url + '" target="_blank">' + self.config.username + '</a> (Powered by Rdio&reg;)</span></div>')
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
            });
        };

        this.init();
    }

    var grid = new Grid();
}());