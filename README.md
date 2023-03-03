# film-bot
Telegram bot for memorizing movies and series of interest to the user.

## Stack:
Node.js
- [Telegraf](https://github.com/telegraf/telegraf)
- [Docker & docker compose](https://docs.docker.com/get-started/)
- [MongoDB](https://www.mongodb.com/docs/drivers/node/current/)
- [Axios](https://github.com/axios/axios) - http client
- [Cheerio](https://github.com/cheeriojs/cheerio) - jQuery implementation for node.js

## Get started:
 
### Repo init:
```bash
git clone https://github.com/Predare/film-bot.git
```

### NPM modules init:
```bash
# go to film-bot/app
cd path/to/film-bot/app
npm install
```

### TG bot init:
make and fill .env file (example .env.example) 
```bash
echo -e "# .env
PORT=3000
WEBHOOK_DOMAIN=bot.example.com
BOT_TOKEN=<bot token>" >> .env
```

### Docker init:
```bash
# back to film-bot root dir 
cd .. 
# Make and fill docker.env file (example docker.env.example)
echo -e "# docker.env
MONGO_INITDB_ROOT_USERNAME: <username>
MONGO_INITDB_ROOT_PASSWORD: <password>
MONGO_URL: mongodb://<username>:<password>@mongo:27017/
MONGO_USERNAME: <username>
MONGO_PASSWORD: <password>" >> docker.env
```
### Docker up:
docker compose up

### Docker down:
```bash
docker compose down
```

### More info on <a href="https://docs.docker.com/compose/">docker compose</a> 

