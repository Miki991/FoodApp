const key = '00c765b4b5add7f8f6bd5e5cba9b05a7';
const appID = 'e277f834';
const input = document.querySelector('.keyword-input');
const searchButton = document.querySelector('.search-button');
const recipesList = document.querySelector('#recipes');
const previousPage = document.querySelector('.pagination-left');
const nextPage = document.querySelector('.pagination-right');
const inputPage = document.querySelector('.go-to input[type=number]');
const goButton = document.querySelector('.go');
const onError = document.querySelector('.on-error');
const paginationBars = document.querySelector('.pagination');
let page = document.querySelector('.page-number');




class Create {
    static listResults (recipes)  {
        recipes.forEach((recipe) => {
            this.createRecipe(recipe);
        });
    }

    static createRecipe (recipe) {
        let caloriesNumber = Math.round(recipe.recipe.calories);
    
        let image = `<img src=${recipe.recipe.image} />`;
        let title = `<h3>${recipe.recipe.label}</h3>`;
        let calories = `<div class="calories">${caloriesNumber}</div>`;
        let labelsWrapper = `<div class="labels">${this.setLabels(recipe.recipe.healthLabels) + this.setLabels(recipe.recipe.dietLabels)}</div>`; 
        
        let wrapper = document.createElement('div');
        wrapper.classList.add('recipe-element');
        wrapper.setAttribute('id', `${recipe.recipe.shareAs}`);
        recipes.appendChild(wrapper);
        wrapper.innerHTML = image + title + calories + labelsWrapper;
        wrapper.addEventListener('click', this.addClick);
    }


    static addClick (e) {
        window.open(e.target.closest('.recipe-element').id,'_blank');
    }


    static setLabels (labels) {
        let labelsText = '';
    
        labels.forEach((label) => {
            labelsText += '<span class="label">' + label + '</span>';
        });
    
        return labelsText;
    }
}


class Setup {
    // Setting number of results at the top of page
    static resultNumber (result) {
        const results = document.querySelector('.recipe-count-number');
        results.textContent = result.count;
    }


    static setPagination (requestResult) {
        paginationBars.style.display = 'block';

        if (requestResult.count == 0) {
            paginationBars.style.display = 'none';
        }
    }


    // All page styles for the first page are reset in case user activates event listener for search button more than once
    static resetStyles () {
        page.textContent = 1;
        previousPage.setAttribute('disabled', true);
        nextPage.removeAttribute('disabled', true);
        onError.style.display = 'none';
    }


    // Getting highest possible page number based on number of results for disabling 'next page' button
    static pagesNumber = results => Math.ceil(results.count / 10)


    // In case active page is 1, button 'previous page' is disabled. In case active page is last, button 'next page' is disabled.
    static disablingButtons (pageNumber, requestResult) {
        pageNumber == 1 && previousPage.setAttribute('disabled', true);
        
        if (pageNumber == this.pagesNumber(requestResult) || pageNumber > this.pagesNumber(requestResult)) {
            nextPage.setAttribute('disabled', true);
        } else {
            nextPage.removeAttribute('disabled', true);
        }
    }
}





// Getting correct URL string for request by combining all filled 'input' and 'select' fields
const getUrl = () => {
    let health = document.querySelector('select[name=health]');
    let diet = document.querySelector('select[name=diet]');
    let url;

    if (input.value && health.value && diet.value) {
        url = `https://api.edamam.com/search?q=${input.value}&app_id=${appID}&app_key=${key}&health=${health.value}&diet=${diet.value}`;
    } else if (input.value && health.value) {
        url = `https://api.edamam.com/search?q=${input.value}&app_id=${appID}&app_key=${key}&health=${health.value}`;
    } else if (input.value && diet.value) {
        url = `https://api.edamam.com/search?q=${input.value}&app_id=${appID}&app_key=${key}&diet=${diet.value}`;
    } else {
        url = `https://api.edamam.com/search?q=${input.value}&app_id=${appID}&app_key=${key}`;
    }

    const caloriesRange = () => {
        let min = document.querySelector('.calories-min').value;
        let max = document.querySelector('.calories-max').value;
        let urlPart;
        
        if (min && max) {
            urlPart = `&calories=${min}-${max}`;
        } else if (min) {
            urlPart = `&calories=${min}%2B`;
        } else if (max) {
            urlPart = `&calories=${max}`;
        } else {
            urlPart = '';
        }
    
        return urlPart;
    }

    return url + caloriesRange();
}


// Creating URL string part which returns exact results needed, used in 'getMoreRecipes' function
const resultsPerPage = (from, to) => {
    let results = `&from=${from}&to=${to}`;

    return results; 
}


const getRecipes = () => {
    recipesList.innerHTML = '';
    let pageNumber = parseInt(page.textContent);

    fetch(getUrl())
    .then(response => response.json())
    .then(response => {
        let requestResult = response;
        let recipes = response.hits;

        console.log(requestResult);
        return {requestResult, recipes};
    })
    .then(data => {
        Create.listResults(data.recipes);
        Setup.setPagination(data.requestResult);
        Setup.resetStyles();
        Setup.resultNumber(data.requestResult);
        Setup.disablingButtons(pageNumber, data.requestResult);
        onError.style.display = 'none';
    })
    .catch(() => {
        onError.style.display = 'block';
        paginationBars.style.display = 'none';
    })
}


const getMoreRecipes = (from, to) => {
    recipesList.innerHTML = '';
    let pageNumber = parseInt(page.textContent);

    fetch(getUrl() + resultsPerPage(from, to))
    .then(response => response.json())
    .then(response => {
        let requestResult = response;
        let recipes = response.hits;

        console.log(requestResult);
        return {requestResult, recipes};
    })
    .then(data => {
        Create.listResults(data.recipes);
        Setup.resultNumber(data.requestResult);
        Setup.setPagination(data.requestResult);
        Setup.disablingButtons(pageNumber, data.requestResult);
        onError.style.display = 'none';
        inputPage.value = '';
    })
    .catch(() => {
        onError.style.display = 'block';
        paginationBars.style.display = 'none';
    })
}


// Event listener function for 'previous page' and 'next page' buttons
const go = e => {
    let pageNumber = parseInt(page.textContent);
    
    if (e.target === previousPage) {
        if (pageNumber >= 2) {
            pageNumber -= 1;
        } 
    } else if (e.target === nextPage) {
        // Removing 'disabled' attribute from 'previous page' button as soon as page turns 2
        previousPage.removeAttribute('disabled', true);
        pageNumber += 1;
    }

    page.textContent = pageNumber;
    getMoreRecipes((pageNumber-1)*10, pageNumber*10);
}


// Event listener function for 'go to page' button
const goToPage = () => {
    let somePage = parseInt(inputPage.value);

    somePage > 1 && previousPage.removeAttribute('disabled', true);
    page.textContent = somePage;

    getMoreRecipes((somePage-1)*10, somePage*10);
}



input.addEventListener('keyup', e => {
    e.target.value && searchButton.removeAttribute('disabled', true);
});

searchButton.addEventListener('click', getRecipes);
previousPage.addEventListener('click', go);
nextPage.addEventListener('click', go);
goButton.addEventListener('click', goToPage);