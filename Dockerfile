# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy only package files first (for layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of your app
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Set NODE_ENV to production (optional, can also do in compose)
ENV NODE_ENV=production

# Start the app using your start script (respects "type": "module")
CMD [ "npm", "start" ]
