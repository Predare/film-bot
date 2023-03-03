import * as mainScene from './main.js';

export async function SceneOnAction(actualScene, actionId, newSceneId) {
    actualScene.action(actionId, async ctx => await ctx.scene.enter(newSceneId));
}
export const backToFilmMenuAction = `BACK_TO_FILM_MENU`;
export async function BackToFilmMenu(ctx) {
    await ctx.scene.enter(mainScene.mainScene.id);
}

export function SetTextParenthesis(year) {
    return year ? `(${year})` : '';
}

export function EscapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&"); // $& means the whole matched string
}