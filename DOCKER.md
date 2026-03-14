# Docker Guide

This project now runs in Docker with two containers:

- `backend` for the Node.js + Express API
- `frontend` for the React application

MongoDB is not containerized here because this project is already using MongoDB Atlas.

The frontend will be available on `http://localhost:3001`.
The backend will be available on `http://localhost:5001`.

## 1. What files were added

### Root

- `docker-compose.yml`
- `DOCKER.md`

### Backend

- `server/Dockerfile`
- `server/.dockerignore`

### Frontend

- `client/Dockerfile`
- `client/.dockerignore`

## 2. How to run the project

From the project root:

```bash
docker compose up --build
```

To run it in the background:

```bash
docker compose up --build -d
```

To stop it:

```bash
docker compose down
```

## 3. Explanation of `docker-compose.yml`

```yaml
services:
```

This starts the list of containers that Docker Compose will manage.

```yaml
  backend:
```

This creates the backend service.

```yaml
    build:
      context: ./server
      dockerfile: Dockerfile
```

This tells Docker to build the backend image using the `server/Dockerfile`.

```yaml
    env_file:
      - ./server/.env
```

This tells Docker to read backend environment variables from `server/.env`.

```yaml
    ports:
      - "5001:5001"
```

This maps your machine's port `5001` to the backend container's port `5001`.

```yaml
  frontend:
```

This creates the React frontend service.

```yaml
    build:
      context: ./client
      dockerfile: Dockerfile
```

This tells Docker to build the frontend image from the `client` folder.

```yaml
    depends_on:
      - backend
```

This means the frontend starts after the backend container starts.

```yaml
    env_file:
      - ./client/.env
```

This tells Docker to read frontend environment variables from `client/.env`.

```yaml
    environment:
      HOST: 0.0.0.0
```

React must listen on `0.0.0.0` inside a container so your host machine can access it.

```yaml
This overrides only the `HOST` value so the React dev server is reachable from outside the container.

```yaml
    ports:
      - "3001:3001"
```

This maps your machine's port `3001` to the frontend container's port `3001`.

## 4. Explanation of `server/Dockerfile`

```dockerfile
FROM node
```

This uses the official Node image, so Node.js and npm are already available.

```dockerfile
WORKDIR /app
```

This sets `/app` as the working directory inside the container.

```dockerfile
COPY package*.json ./
RUN npm install
```

This copies `package.json` and `package-lock.json` first, then installs dependencies.

This is a common Docker optimization because dependency installation can be cached.

```dockerfile
COPY . .
```

This copies the rest of the backend project files into the container.

```dockerfile
EXPOSE 5000
```

This documents that the backend uses port `5000` inside the container.

```dockerfile
CMD ["npm", "start"]
```

This tells the container what command to run when it starts.

## 5. Explanation of `client/Dockerfile`

The client Dockerfile is almost the same as the backend one. The difference is:

```dockerfile
ENV HOST=0.0.0.0
ENV PORT=3001
```

These environment variables make React run in a way that is reachable from outside the container.

```dockerfile
EXPOSE 3001
CMD ["npm", "start"]
```

This tells Docker that the frontend uses port `3001` inside the container and starts it with React's start script.

## 6. Explanation of `.dockerignore`

`.dockerignore` works like `.gitignore`, but for Docker builds.

It prevents unnecessary or sensitive files from being sent into the Docker build context.

For example:

- `node_modules` should not be copied because the container installs its own dependencies
- `build` output should not be copied into the frontend image unless intentionally needed

In this project, `.env` is intentionally allowed into the image because you asked for a private/local Docker setup and are not publishing the image.

## 7. Important beginner note

When you use Docker Compose here:

- your code runs inside containers
- your app does not use your local `node_modules`
- your app still uses MongoDB Atlas for the database

## 8. Useful commands

See running containers:

```bash
docker ps
```

See logs:

```bash
docker compose logs
```

See logs for one service:

```bash
docker compose logs backend
docker compose logs frontend
```

Rebuild after changing Dockerfiles:

```bash
docker compose up --build
```
