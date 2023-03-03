import { Scenes, Markup } from "telegraf";
import * as cheerio from 'cheerio';
import axios from "axios";
import path from 'node:path';
import * as utils from './utils.js';
import * as customFilm from './addCustomFilm.js';
import { v4 as uuidv4 } from 'uuid';

const filmChooseScene = new Scenes.BaseScene('FILM_CHOOSE_SCENE');
export const scenes = [filmChooseScene];

export async function init(client, scene) {
    scene.action(utils.backToFilmMenuAction, async ctx => await utils.BackToFilmMenu(ctx));
    scene.hears(/\W*\w*/,(ctx) => SearchFilmByName(ctx));

    const filmSaveActionId = "ADD_FILM_SAVE_ACTION";
    const filmShowInfoActionId = 'ADD_FILM_SHOW_INFO_ACTION';
    const filmCustomActionId= 'ADD_FILM_CUSTOM_ACTION';
    filmChooseScene.action(filmCustomActionId, async ctx => await ctx.scene.enter(customFilm.scene.id));
    filmChooseScene.action(utils.backToFilmMenuAction, ctx => utils.BackToFilmMenu(ctx));
    filmChooseScene.enter( async ctx => {
        const filmButtonsArray = [];//buttons with found film names;
        ctx.session.filmsList.forEach( (element, index) => 
        {
            let textYear = utils.SetTextParenthesis(element.year)
            let replyText = `${element.name} ${textYear}`;
            let filmSessionIdentfier = uuidv4();
            ctx.session[filmSessionIdentfier] = element; 
            filmButtonsArray.push( [Markup.button.callback( `${replyText}` , `${filmShowInfoActionId} ${filmSessionIdentfier}`)] );
        });
        const backbutton = Markup.button.callback("Вернуться", utils.backToFilmMenuAction);
        const customFilmButton = Markup.button.callback("Свой фильм", filmCustomActionId);
        filmButtonsArray.push([backbutton,customFilmButton]);
        const markupButtons = Markup.inlineKeyboard(filmButtonsArray);
        await ctx.replyWithMarkdownV2('Выбирете нужный фильм из списка',markupButtons);
    });

    filmChooseScene.action(/ADD_FILM_SHOW_INFO_ACTION ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/, async ctx => {
        const film = ctx.session[ctx.match[1]];
        let title = utils.EscapeMarkdown(film.name);
        let link = 'https://' + film.link.replace('sr/1/',''); 
        let textLink = utils.EscapeMarkdown(link);
        let textYear = utils.EscapeMarkdown(utils.SetTextParenthesis(film.year));
        const backButton = Markup.button.callback("Вернуться", utils.backToFilmMenuAction);
        const saveButton =  Markup.button.callback("Добавить", `${filmSaveActionId} ${ctx.match[1]}`);
        const markupButtons = Markup.inlineKeyboard([saveButton,backButton]);
        let replyText = `${title} ${textYear}\n${textLink}`;
        await ctx.replyWithMarkdownV2(replyText,markupButtons);
    });

    filmChooseScene.action(/ADD_FILM_SAVE_ACTION ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/, async ctx => {
        const film = ctx.session[ctx.match[1]];
        let title = utils.EscapeMarkdown(film.name);
        let link = 'https://' + film.link.replace('sr/1/',''); 
        let textYear = utils.EscapeMarkdown(utils.SetTextParenthesis(film.year));
        let replyText = `Фильм *${title} ${textYear}* сохранён\\!`;
        try{
            let filmDBInfo = {title: film.name, year: film.year, link: link};
            await SaveFilm(client,ctx, filmDBInfo);
            await ctx.replyWithMarkdownV2(replyText);
        }catch(e){
            console.error(e);
        }finally{
            await utils.BackToFilmMenu(ctx);
        }
    });

}

/**
 * Save film in MongoDB
 * @param {*} client MongoDB client 
 * @param {*} ctx 
 * @param {*} filmInfo Film information for saving in DB
 */
async function SaveFilm(client,ctx, filmInfo){
    try {
        await client.connect();
        const userID = ctx.from.id;
        const date = new Date().toLocaleString("ru-RU", { timeZone: 'Europe/Moscow' });
        const botDB = await client.db('botDB');
        const filmsCollection = await botDB.collection('films');
        const filmDoc = { userID: userID, title: filmInfo.title, date: date, year: filmInfo.year, link: filmInfo.link };
        const result = await filmsCollection.insertOne(filmDoc);
        console.log(` A document was inserted with the _id: ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        //ctx.scene.enter(filmTypeScene.id);
    }
}

/**
 * Search films by specified name in context
 * @param {*} ctx  
 */
async function SearchFilmByName(ctx) {
    const fileName = ctx.session.customFilmName = ctx.message.text;
    let kinopoiskResult = await ParseKinopoisk(ctx,fileName);
    ctx.session.filmsList = Array.isArray(kinopoiskResult) && kinopoiskResult.length ? kinopoiskResult : await ParseYandex(ctx,fileName);
    await ctx.scene.enter(filmChooseScene.id);
}

async function ParseKinopoisk(ctx,fileName){
    const URL = `https://www.kinopoisk.ru/index.php?kp_query=${fileName}`;
    let body = await axios.get(URL);
    body = body.data;
    let $ = cheerio.load(body);
    let searchResults = $('.search_results p.name');

    let filmsList = [];
    searchResults.each(function (i, elem) {
        let film = new Object();
        film.link = path.join('www.kinopoisk.ru', $(elem).find('a').attr('href'));
        film.name = $(elem).find('a').text();
        film.year = $(elem).find('span').text();
        filmsList.push(film);
    });
    return filmsList;
}

async function ParseYandex(ctx,fileName){
    const URL = `https://ru.wikipedia.org/w/index.php?fulltext=1&go=Перейти&search=фильм+${fileName}&title=Служебная%3AПоиск&ns0=1`;
    let body = await axios.get(URL);
    body = body.data;
    let $ = cheerio.load(body);
    let searchResults = $('.searchResultImage .mw-search-result-heading');
    if(searchResults.length > 5)searchResults = searchResults.slice(0,5);
    let filmsList = [];
    searchResults.each(function (i, elem) {
        let film = new Object();
        film.link = 'ru.wikipedia.org' + $(elem).find('a').attr('href');
        film.name = $(elem).find('a').attr('title');
        film.year = '';
        filmsList.push(film);
    });
    return filmsList;
}