#!/bin/bash

echo "SASSin'"
sass rdio_grid.scss:rdio_grid.css

echo "Jekyllin'"
#jekyll

echo "Deployin'"
#jekyll-s3

echo "Done!"
terminal-notifier -title Build\ Complete -message Deployed\ to\ number61.net