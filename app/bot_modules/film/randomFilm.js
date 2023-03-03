import {Scenes, Markup} from "telegraf";
import * as utils from './utils.js';

let mongoClient;
export const scene = new Scenes.BaseScene('FILM_RANDOM_SCENE');
export const scenes = [scene];

export function init(client){
    mongoClient = client;
    scene.enter(ShowFilm);
    scene.action(`DELETE_FILM_ACTION`, DeleteFilm);
    scene.action(utils.backToFilmMenuAction, async ctx => await utils.BackToFilmMenu(ctx));
}

async function ShowFilm(ctx){
    try{
        await mongoClient.connect();
        const botDB = await mongoClient.db('botDB');
        const filmsCollection = await botDB.collection('films');
        const count = await filmsCollection.countDocuments();
        if(count <= 0){//If documents count 0, return 
            await ctx.reply('Ваш список фильмов пуст.\nПожалуйста, добавьте фильм в свою фильмотеку');
            await utils.BackToFilmMenu(ctx);
            return;
        }
        const randomIndex = getRandomArbitrary(1, count);
        const projection = { title: 1, date: 1, year: 1, link: 1 };
        const cursorResult = await filmsCollection.find({ userID: ctx.from.id }).limit(randomIndex).skip(randomIndex - 1).project(projection);
        const docArray = await cursorResult.toArray();
        if(docArray.length <= 0){//If documents count 0, return 
            await ctx.reply('Ваш список фильмов пуст.\nПожалуйста, добавьте фильм в свою фильмотеку');
            await utils.BackToFilmMenu(ctx);
            return;
        }
        const randomFilm = docArray[0];
        let year = utils.SetTextParenthesis(randomFilm['year']);
        let titleYear = utils.EscapeMarkdown(`${randomFilm['title']} ${year}`);
        let link = utils.EscapeMarkdown(randomFilm['link']);
        let filmDescr = `*${titleYear}*\n${link}`;
        filmDescr = filmDescr;
        const backbutton = Markup.button.callback("Вернуться", utils.backToFilmMenuAction);
        ctx.session.randomFilmId = randomFilm['_id'];
        const deletebutton = Markup.button.callback("Удалить", `DELETE_FILM_ACTION`);
        await cursorResult.close();
        await ctx.replyWithMarkdownV2(filmDescr,Markup.inlineKeyboard([backbutton,deletebutton]));
    }catch(e){
        console.log(e);
    }finally{
        await mongoClient.close();
    }
}

async function DeleteFilm(ctx){
    const filmIndex = ctx.session.randomFilmId;
    try{
        await mongoClient.connect();
        const botDB = await mongoClient.db('botDB');
        const filmsCollection = await botDB.collection('films');
        const result = await filmsCollection.deleteOne({ _id:filmIndex });
        if (result.deletedCount === 1) {
            console.log("Successfully deleted one document.");
          } else {
            console.log("No documents matched the query. Deleted 0 documents.");
          }
    }catch(e){
        console.log(e);
    }finally{
        await mongoClient.close();
        await utils.BackToFilmMenu(ctx);
    }
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}