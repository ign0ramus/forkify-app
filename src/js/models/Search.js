import axios from 'axios';
import { key, proxy } from '../config';

export default class Search {
    constructor(query) {
        this.query = query;
    }

    async getResults() {
        try {
            const search = await axios(`https://forkify-api.herokuapp.com/api/search?&q=${this.query}`);
            
            this.results = search.data.recipes;
        } catch (error) {
            alert('Something went wrong :(');
        }
    }
}
