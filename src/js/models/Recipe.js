import axios from 'axios';
import { key, proxy } from '../config';

export default class Recipe {
    constructor(id) {
        this.id = id;
    }

    async getRecipe() {
        try {
            const recipe = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            this.title = recipe.data.recipe.title;
            this.author = recipe.data.recipe.publisher;
            this.image = recipe.data.recipe.image_url;
            this.url = recipe.data.recipe.source_url;
            this.ingredients = recipe.data.recipe.ingredients;
        } catch (error) {
            alert('Something went wrong :(');
        }
    }

    calculateTime() {
        // Предположим, что на каждые 3 ингридиента время приготовления рецепта  увеличиается на 15 минут
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }

    calculateServings() {
        // Представим, что каждый рецепт для 4 человек :)
        this.servings = 4;
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoon', 'teaspoons', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const units = [...unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(element => {
            // 1) Все ингридиенты приводятся к одному виду
            let ingredient = element.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });

            // 2) Убирает скобки и все, что внутри них
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');

            // 3) Разделяет меры измерения и их численное количество в объекте
            const arrIng = ingredient.split(' ');
            const unitIdx = arrIng.findIndex(elem => units.includes(elem));

            let objIng;
             if (unitIdx > -1) {
                // Есть мера измерения
                const arrCount = arrIng.slice(0, unitIdx);

                let count;
                if (arrCount.length === 1) {
                    count = eval(arrIng[0].replace('-', '+')); 
                } else {
                    count = eval(arrIng.slice(0, unitIdx).join('+'));
                }
                objIng = {
                    count,
                    unit: arrIng[unitIdx],
                    ingredient: arrIng.slice(unitIdx + 1).join(' ')
                };

             } else if (parseInt(arrIng[0], 10)) {
                //  Нет меры измерения, но есть число
                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ')
                };
             } else if(unitIdx === -1) {
                //  Нет меры измерения и нет числа
                objIng = {
                     count: 1,
                     unit: '',
                     ingredient
                 };
             }
            return objIng;
        });
        this.ingredients = newIngredients;
    }

    updateServing(type) {
        // Обновляет количество ингридиентов в зависимости от выбранного количество порций
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;
        
        this.ingredients.forEach(element => {
            element.count *= (newServings / this.servings);
        });

        this.servings = newServings;
    }
}
