import {Scenes, Markup} from "telegraf";
import * as utils from './utils.js';

export let scene = new Scenes.BaseScene('FILM_SHOW_ACTION');
export const scenes = [scene];

const detailFilmAction = 'FILM_DETAIL_INFO_SCENE';
let mongoClient;

export function init(client){
    mongoClient = client;
    scene.enter(ctx => ShowFilms(mongoClient, ctx));
    scene.action(/FILM_DETAIL_INFO_SCENE (\W*\w*)/, ShowFilmDetails);
    scene.action(/DELETE_FILM_ACTION (\W*\w*)/, DeleteFilm);
    scene.action(utils.backToFilmMenuAction, async ctx => await utils.BackToFilmMenu(ctx));
}


async function ShowFilms(client, ctx){
    try{
        await client.connect();
        const botDB = await client.db('botDB');
        const filmsCollection = await botDB.collection('films');
        //filmsCollection.drop( { writeConcern: { w: 1 } } ); //Clear collection
        const projection = {  _id: 1, title: 1, date: 1, year: 1, link: 1 };
        const cursorResult = await filmsCollection.find({ userID: ctx.from.id }).project(projection);

        let buttons = [];//Array to save film markup buttons
        let filmsInfo = [];//Array to save film info
        await cursorResult.forEach(doc => 
        {
            let buttonText = doc["title"];
            buttonText += doc['year'] ? ` (${doc['year']})` : '';
            buttons.push([Markup.button.callback(`${buttonText}`, `${detailFilmAction} ${filmsInfo.length}`)]);
            let info = new Object();
            info.title = doc['title'];
            info.year = doc['year'];
            info.link = doc['link'];
            info.date = doc['date'];
            info.id = doc['_id'];
            filmsInfo.push( info ); 
        });
        await cursorResult.close();
        if(filmsInfo.length <= 0){//If documents count 0, return 
            await ctx.reply('Ваш список фильмов пуст.\nПожалуйста, добавьте фильм в свою фильмотеку');
            await utils.BackToFilmMenu(ctx);
            return;
        };
        ctx.session.filmsListDBResult = filmsInfo;
        const backbutton = [Markup.button.callback("Вернуться", utils.backToFilmMenuAction)];
        buttons.push(backbutton);
        await ctx.replyWithMarkdownV2('Выбирете фильм из списка чтобы увидеть его описание',Markup.inlineKeyboard(buttons));
    } catch (e) {
        console.error(e);
    }finally {
        await client.close();
    }
}

async function ShowFilmDetails(ctx){
    const filmIndex = parseInt(ctx.match[1], 10);
    const film = ctx.session.filmsListDBResult[filmIndex];
    const backbutton = Markup.button.callback("Вернуться", utils.backToFilmMenuAction);
    const deletebutton = Markup.button.callback("Удалить", `DELETE_FILM_ACTION ${filmIndex}`);
    let link = film.link.replace('sr/1/',''); 
    let resultText = film.title;
    resultText += film.year ? ` (${film.year})\n` : '\n';
    resultText += link;
    await ctx.reply(`${resultText}`, Markup.inlineKeyboard([backbutton,deletebutton]));
}

async function DeleteFilm(ctx){
    const filmIndex = parseInt(ctx.match[1], 10);
    const film = ctx.session.filmsListDBResult[filmIndex];

    try {
        await mongoClient.connect();
        const botDB = await mongoClient.db('botDB');
        const filmsCollection = await botDB.collection('films');
        const query = { _id: film.id };
        const result = await filmsCollection.deleteOne(query);
        let title = utils.EscapeMarkdown(film.title);
        let year = utils.EscapeMarkdown(utils.SetTextParenthesis(film.year));
        let replyText = `Фильм *${title}* *${year}* удалён`;
        console.log(` A document was deleted with the _id: ${result.insertedId}`);
        await ctx.replyWithMarkdownV2(replyText);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoClient.close();
        await utils.BackToFilmMenu(ctx)
    }
}