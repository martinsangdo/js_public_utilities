#!/bin/sh

# Use sed to find the placeholder and replace it with the $API_URL variable
# -i means "in-place" (edit the file directly)
sed -i "s|__API_URL__|$API_URL|g" /usr/share/nginx/html/report.html

# Start Nginx in the foreground (standard Docker practice)
nginx -g 'daemon off;'