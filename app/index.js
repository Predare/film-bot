import { Telegraf, Scenes, Markup, session} from "telegraf";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import * as filmScenes from './bot_modules/film/main.js';


dotenv.config();
const client = new MongoClient(process.env.MONGO_URL);


//Bot and scenes init
// Handler factories
const { enter, leave } = Scenes.Stage;
const bot = new Telegraf(process.env.BOT_TOKEN);
const scenes = filmScenes.scenes;
const stage = new Scenes.Stage(scenes);
 
init();

async function init(){
    await filmScenes.init(client);
    //Bot and scenes run
    bot.use(session());
    bot.use(stage.middleware());
    //Bot general commands
    bot.command(["start",'add'], ctx => ctx.scene.enter(filmScenes.mainScene.id));
    bot.command(["list"], ctx => ctx.scene.enter(filmScenes.listScene.id));
    bot.command(["random"], ctx => ctx.scene.enter(filmScenes.randomScene.id));
    await bot.launch();
    console.log('Bot launched');
}

// Enable graceful stop
process.once('SIGINT', async () => {bot.stop('SIGINT'); await client.close()});
process.once('SIGTERM', async () => {bot.stop('SIGTERM'); await client.close()});