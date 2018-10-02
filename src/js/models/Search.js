import axios from 'axios';
import { key, proxy } from '../config';

export default class Search {
    constructor(query) {
        this.query = query;
    }

    async getResults() {
        try {
            const search = await axios(`${proxy}https://www.food2fork.com/api/search?key=${key}&q=${this.query}`);
            
            this.results = search.data.recipes;
        } catch (error) {
            alert('Something went wrong :(');
        }
    }
}