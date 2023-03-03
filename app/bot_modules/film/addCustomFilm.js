import {Scenes, Markup} from "telegraf";
import * as utils from './utils.js';
import * as mainScene from './main.js';

export const scene = new Scenes.BaseScene('FILM_ADD_CUSTOM_SCENE'); 
export const scenes = [scene];
const saveCustomFilmAction = 'FILM_CUSTOM_SAVE_ACTION';
const addFilmDescriptionAction = 'FILM_CUSTOM_ADD_DESCR_ACTION';
let client;
export function init(){
    client = mainScene.mongoClient;
    scene.enter(AddFilmDescription);
    scene.hears(/\W*\w*/,VerifyFilmInfo);
    scene.action(saveCustomFilmAction, Save);
    scene.action(addFilmDescriptionAction, AddFilmDescription);
}

async function AddFilmDescription (ctx){
    ctx.session.customFilmDescription = '';
    const title = utils.EscapeMarkdown(ctx.session.customFilmName);
    const backButton = Markup.button.callback("Вернуться", utils.backToFilmMenuAction);
    const markupButtons = Markup.inlineKeyboard([backButton]);
    let replyText = `Фильм будет сохранён под названием: ${title}\nУкажите заметку к фильму\\(например ссылку или путь к файлу на компьютере\\)`;
    try{
        await ctx.replyWithMarkdownV2(replyText,markupButtons);
    }catch(e){
        console.error(e);
    }
}

async function VerifyFilmInfo(ctx){
    ctx.session.customFilmDescription = ctx.message.text;
    const addButton = Markup.button.callback("Добавить", saveCustomFilmAction);
    const backButton = Markup.button.callback("Вернуться", addFilmDescriptionAction);
    const markupButtons = Markup.inlineKeyboard([addButton,backButton]);
    const title = utils.EscapeMarkdown(ctx.session.customFilmName);
    const description = utils.EscapeMarkdown(ctx.message.text);
    let replyText = `Добавить указанный фильм\\?\n${title}\n${description}`;
    try{
        await ctx.replyWithMarkdownV2(replyText,markupButtons);
    }catch(e){
        console.error(e);
    }
}

async function Save(ctx){
    const userID = ctx.from.id;
    const title = ctx.session.customFilmName;
    const description = ctx.session.customFilmDescription;
    const date = new Date().toLocaleString("ru-RU", { timeZone: 'Europe/Moscow' });
    const botDB = await client.db('botDB');
    const filmsCollection = await botDB.collection('films');
    const filmDoc = { userID: userID, title: title, date: date, year: '', link: description };
    let replyText;
    try {
        await client.connect();
        const result = await filmsCollection.insertOne(filmDoc);
        console.log(` A document was inserted with the _id: ${result.insertedId}`);
        let escapedTitle = utils.EscapeMarkdown(title);
        replyText = `Фильм *${escapedTitle}* успешно сохранён\\!`
    } catch (e) {
        console.error(e);
        replyText = utils.EscapeMarkdown('Произошла ошибка! Фильм не сохранился. Пожалуйста, попробуйте позже.');
    } finally {
        await client.close();
        await ctx.replyWithMarkdownV2(replyText);
        utils.BackToFilmMenu(ctx);
    }
}