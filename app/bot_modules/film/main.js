import { Scenes, Markup } from "telegraf";
import * as utils from './utils.js';
import * as add from './addFilm.js';
import * as show from './showFilm.js';
import * as random from './randomFilm.js';
import * as customFilm from './addCustomFilm.js';

export const mainScene = new Scenes.BaseScene('FILM_SCENE');
export const listScene = show.scene;
export const randomScene = random.scene;
export const scenes = [mainScene].concat(add.scenes, show.scenes, random.scenes, customFilm.scenes);
const showActionId = "FILM_SHOW_ACTION";
const randomActionId = "FILM_RANDOM_ACTION";

export let mongoClient;

export async function init(client){
    mongoClient = client;
    await mainScene.enter( async (ctx) => {
        let welcomeMessage = `Напишите название нужного фильма в чат чтобы добавить его в фильмотеку\n
Действия:
*Фильмотека* \\- показать вашу фильмотеку
*Случайно* \\- выбрать случайный фильм из фильмотеки`;
        const buttons = Markup.inlineKeyboard([
            Markup.button.callback('Случайно', randomActionId),
            Markup.button.callback('Фильмотека', showActionId),
          ])
          await ctx.replyWithMarkdownV2(welcomeMessage, buttons);
    });
    mainScene.command(["list"], ctx => ctx.scene.enter(listScene.id));
    mainScene.command(["random"], ctx => ctx.scene.enter(randomScene.id));
    await add.init(client, mainScene);//Load add func in main scene
    show.init(client);
    random.init(client);
    customFilm.init(client);

    await utils.SceneOnAction(mainScene, showActionId, listScene.id);
    await utils.SceneOnAction(mainScene, randomActionId, randomScene.id);
}