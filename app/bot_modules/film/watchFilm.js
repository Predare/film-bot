import {Scenes, Markup} from "telegraf";
export let scene = new Scenes.BaseScene('FILM_WATCH_SCENE');
export const scenes = [scene];
import * as cheerio from 'cheerio';
import axios from "axios";
import path from 'node:path';

export function init(client){
    //FILM WATCH
    scene.use((ctx) => WatchFilm(ctx));
    scene.enter(ctx => {
        ctx.session.myData = {};
        let welcomeMessage = `Какой фильм хотите посмотреть?`;
        ctx.replyWithMarkdownV2(welcomeMessage);
    });

    //FILM WATCH CHOOSE 
    scene.enter((ctx) => {
        let welcomeMessage = `\nВыбирете нужный фильм`;
        const buttonsArray = [];
        ctx.session.filmsList.forEach( (element, index) => buttonsArray.push( [Markup.button.callback( `${element.name} ${element.year}` , `FILM_DETAIL_INFO_SCENE ${index}`)] ));
        buttonsArray.push( [Markup.button.callback( `Вернуться` , 'FILM_MENU_ACTION')] );
        const buttons = Markup.inlineKeyboard(buttonsArray);
        ctx.replyWithMarkdownV2(welcomeMessage, buttons);
    });

    scene.action(/FILM_DETAIL_INFO_SCENE (\W*\w*)/, ctx => {
        const filmIndex = parseInt(ctx.match[1], 10);
        const film = ctx.session.filmsList[filmIndex];
        ctx.reply(`${film.name} ${film.year}`);
        let link = 'https://' + film.link.replace('sr/1/',''); 
        ctx.reply(link);
        
    });

    scene.action('FILM_MENU_ACTION', ctx => ctx.scene.enter(filmTypeScene.id));

}


async function WatchFilm(ctx){
    const fileName = ctx.message.text;
    const URL = `https://www.kinopoisk.ru/index.php?kp_query=${fileName}`;
    let body = await axios.get(URL);
    body = body.data;
    let $ = cheerio.load(body);
    let searchResults = $('.search_results p.name');

    let filmsList = [];
    searchResults.each( function (i, elem) 
    {
        let film = new Object();
        film.link = path.join( 'www.kinopoisk.ru', $(elem).find('a').attr('href'));
        film.name = $(elem).find('a').text();
        film.year = $(elem).find('span').text();
        filmsList.push(film);
    });
    ctx.session.filmsList = filmsList;
    ctx.scene.enter(filmWatchChooseScene.id);
}

