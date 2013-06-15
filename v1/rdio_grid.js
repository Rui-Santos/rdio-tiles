/*
* Rdio Heavy Rotation Grid
* Unminified: /js/rdio_tiles.js
* @preserve */
(function() {
	window.RdioTiles = {
		instances: [],
		init: function() {
            var self = this;

			// don't render for mobile users
			if (window.innerWidth < 768) {
				return;
			}

			// loop through all of the hooks and create grids
			var hooks = document.querySelectorAll('.rdio-grid');
            var META_HEIGHT = 25;

            for (var i; i < hooks.length; i++) {
                var string = '';
                var frame = document.createElement('iframe');
                var grid = {
                    el: hooks[i],
                    src: 'http://rdio-grid.number61.net/v1/?username=' + hooks[i].getAttribute("data-user") + '&columns=' + hooks[i].getAttribute("data-columns") + '&rows=' + hooks[i].getAttribute("data-rows"),
                    username: hooks[i].getAttribute("data-user"),
                    columns: parseInt(hooks[i].getAttribute("data-columns"), 10),
                    rows: parseInt(hooks[i].getAttribute("data-rows"), 10)
                };

                frame.setAttribute('src', grid.src);

                grid.el.style.width = '100%';
                grid.el.style.display = 'block';

				this.instances.push(grid);

                maintainHeight(grid);
			}

            function maintainHeight(grid) {
                grid.el.style.height = Math.floor((parseInt(grid.el.style.width, 10) / grid.columns) * grid.rows) + META_HEIGHT + 'px';
            }

            window.addEventListener('resize', function() {
                for (var i = 0; i < self.instances.length; i++) {
                    maintainHeight(self.instances[i]);
                }
            });
		}
	};

	window.RdioTiles.init();
}());