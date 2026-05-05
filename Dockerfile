# Use Nginx to serve the static HTML files
FROM nginx:alpine

# Copy the static files to the Nginx default public directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
