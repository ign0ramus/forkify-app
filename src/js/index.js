// Контроллер приложения
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import { domElements, renderLoader, clearLoader} from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

/** Cостояние приложения содержит
 * - Объект поиска (Search)
 * - Объект рецепта (Recipe)
 * - Объект списка покупок (List)
 * - Пролайканные рецепты (Likes)
 */
const state = {};

/**
 * Контроллер поиска
 */
const controlSearch = async () => {
    // 1) Получить запрос от модуля Searchview
    const query = searchView.getInput();

    if (query) {
        // 2) Создать новый объект Search и добавить в state
        state.search = new Search(query);

        // 3) UI ожидает результата
        searchView.clearResults();
        searchView.clearInput();
        renderLoader(domElements.searchRes);

        try {
            // 4) Поиск рецептов
            await state.search.getResults();

            // 5) Отобразить результат на UI
            clearLoader();
            searchView.renderResults(state.search.results);
        } catch (error) {
            alert('Something wrong with the search...');
            clearLoader();
        }
    }
};

// Обработка поиска
domElements.searchForm.addEventListener('submit', event => {
    event.preventDefault();
    controlSearch();
});

// Обработка кликов по кнопкам навигации на страницах результатов
domElements.searchResPages.addEventListener('click', event => {
    const button = event.target.closest('.btn-inline');
    if (button) {
        const goToPage = parseInt(button.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.results, goToPage);
    }
});

/**
 * Контроллер рецепта
 */
const controlRecipe = async () => {
    // Получает id из url
    const id = window.location.hash.replace('#', '');
    
    if (id) {
        // UI ожидает результата
        recipeView.clearRecipe();
        renderLoader(domElements.recipe);

        // Подсветить выбранный рецепт
        if (state.search) {
            searchView.highlightSelected(id);
        }

        // Создать новый объект Recipe
        state.recipe = new Recipe(id);

        try {
            // Получить данные рецепта и парсить ингридиенты
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Посчитать время приготовления и количество порций
            state.recipe.calculateServings();
            state.recipe.calculateTime();

            // Отобразить результат
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch (error) {
            alert('Error processing recipe!');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * Контроллер списка покупок
 */
const controlList = () => {
    // Создать новый список, если еще нет
    if (!state.list) {
        state.list = new List();
    }

    // Добавить каждый ингридиент в список (List)
    state.recipe.ingredients.forEach(elem => {
        const item = state.list.addItem(elem.count, elem.unit, elem.ingredient);
        listView.renderItem(item);
    });
};

// Обработчик кликов по кнопкам удаления ингридиентов и изменения количества
domElements.shopping.addEventListener('click', event => {
    const id = event.target.closest('.shopping__item').dataset.itemid;

    // Кнопка удаления
    if (event.target.matches('.shopping__delete, .shopping__delete *')) {
        // Удалить из состояния
        state.list.deleteItem(id);
        // Удалить из UI
        listView.deleteItem(id);
    // кнопка изменения количества    
    } else if (event.target.matches('.shopping__count-value')) {
        const val = parseFloat(event.target.value, 10);
        if (val > 1) {
            state.list.updateCount(id, val);
        }
    } 
});

/**
 * Контроллер лайков
 */
const controlLike = () => {
    if (!state.likes) {
        state.likes = new Likes;
    } 

    // Пользователь еще не лайкнул текущий рецепт
    const curId = state.recipe.id;
    if (!state.likes.isLiked(curId)) {
        // Добавить лайк в состояние
        const newLike = state.likes.addLike(curId, state.recipe.title, state.recipe.author, state.recipe.image);
        // Активировать кнопку лайка
        likesView.toggleLikeBtn(true);

        // Добавить на UI
        likesView.renderLike(newLike);

    // Пользователь лайкнул текущий рецепт
    } else {
        // Удалить лайк из состояния
        state.likes.deleteLike(curId);

        // Деактивировать кнопку лайка
        likesView.toggleLikeBtn(false);

        // Удалить из UI
        likesView.deleteLike(curId);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};


// Загрузить пролайканные рецепты на страницу из localstorage
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Восстановить лайки из local storage
    state.likes.readStorage();
    
    // Показывает меню лайков, если лайки есть
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Показывает пролайканные рецепты в меню лайков
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Обработчик кликов по кнопкам рецепта
domElements.recipe.addEventListener('click', event => {
    if (event.target.matches('.btn-decrease, .btn-decrease *')) {
        // Уменьшение количества порций
        if (state.recipe.servings > 1) {
            state.recipe.updateServing('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (event.target.matches('.btn-increase, .btn-increase *')) {
        // Увеличение количества порций
        state.recipe.updateServing('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (event.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Добавляет ингридиенты в список покупок
        controlList();
    } else if (event.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});


