FROM oven/bun:1.2.5-debian AS base

# Set the working directory
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY ./src .
COPY ./package.json .
COPY ./bun.lockb .

# Install the project dependencies
RUN bun ci

RUN apt update && apt install ffmpeg curl -y

# Make the app's ports available to the outside world
EXPOSE 8081

# Define the command to run the app
CMD ["bun", "run", "start-bun-prod"]