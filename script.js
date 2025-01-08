let recipeForm = document.getElementById('submitForm');
let recipeName = document.getElementById('recipeName');
let ingredients = document.getElementById('ingredients');
let steps = document.getElementById('steps');
let recipeImage = document.getElementById('recipeImage');
let displayArea = document.getElementById('displayArea');
let recipes = [];
let isEditMode = false; // Flag to indicate whether it's in edit mode
let searchBox = document.getElementById('searchBox');
let sortOptions = document.getElementById('sortOptions');


// Fetch recipes from FastAPI server using a GET request
fetch('https://my-recipes-4wwm.onrender.com/recipes')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  })
  .then(initialRecipes => {
    recipes = initialRecipes; // Store the fetched recipes in the array
    refreshDisplay(); // Call refreshDisplay after fetching recipes
  })
  .catch(error => {
    console.error('Error fetching recipes:', error.message);
  });

// Add event listener to the form submit button
recipeForm.addEventListener('click', async function (event) {
  event.preventDefault();

  let enteredRecipeName = recipeName.value;
  let enteredIngredients = ingredients.value;
  let enteredSteps = steps.value;
  let enteredUrl = recipeImage.value;

  let newRecipe = {
    name: enteredRecipeName,
    ingredients: enteredIngredients.split(',').map(item => item.trim()), // Assuming ingredients are comma-separated
    steps: enteredSteps.split(',').map(item => item.trim()),
    image: enteredUrl
  };

  try {
    if (isEditMode) {
      // Handle edit mode
      const recipeToEdit = recipes.find(recipe => recipe.id === isEditMode);
      recipeToEdit.name = enteredRecipeName;
      recipeToEdit.ingredients = enteredIngredients.split(',').map(item => item.trim());
      recipeToEdit.steps = enteredSteps.split(',').map(item => item.trim());
      recipeToEdit.image = enteredUrl;

      const response = await fetch(`https://my-recipes-4wwm.onrender.com/recipes/${recipeToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeToEdit),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const updatedRecipe = await response.json();
      console.log('Recipe updated:', updatedRecipe);

      isEditMode = false; // Reset edit mode
      document.getElementById('submitForm').textContent = 'Add Recipe'; // Change button text back to 'Add Recipe'
    } else {
      // Handle add mode
      const response = await fetch('https://my-recipes-4wwm.onrender.com/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecipe),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const createdRecipe = await response.json();
      console.log('Recipe created:', createdRecipe);
    }

    // Refresh the display after successfully adding/updating the recipe
    refreshDisplay();

    // Clear form for submission of recipe
    recipeName.value = '';
    ingredients.value = '';
    steps.value = '';
    recipeImage.value = '';
  } catch (error) {
    console.error('Error:', error.message);
  }
});

searchBox.addEventListener('input', filterRecipes);
sortOptions.addEventListener('change', sortRecipes);

function filterRecipes() {
  let searchQuery = searchBox.value.toLowerCase();
  let filteredRecipes = recipes.filter(recipe => {
    return recipe.name.toLowerCase().includes(searchQuery) || 
           recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchQuery));
  });
  displayArea.innerHTML = '';
  filteredRecipes.forEach(recipe => displayRecipe(recipe));
}

function sortRecipes() {
  let sortOrder = sortOptions.value;
  recipes.sort((a,b) => {
    if (sortOrder === 'name') {
      return a.name.localCompare(b.name);
    } else if (sortOrder === 'ingredients') {
      return a.ingredients.length - b.ingredients.length;
    }
  });
  refreshDisplay();
}

// Add event listener to the edit button
async function editRecipe(recipeId) {
  isEditMode = recipeId; // Set edit mode to true
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  document.getElementById('submitForm').textContent = 'Update Recipe'; // Change button text to 'Update Recipe'
  const recipeToEdit = recipes.find(recipe => recipe.id === recipeId);
  recipeName.value = recipeToEdit.name;
  ingredients.value = recipeToEdit.ingredients.join(', ');
  steps.value = recipeToEdit.steps.join(', ');
  recipeImage.value = recipeToEdit.image;
}

function displayRecipe(recipe, index) {
  // Create a div for HTML with new recipe information
  let recipeDiv = document.createElement('div');
  recipeDiv.className = 'recipe';
  recipeDiv.innerHTML = `
    <h3>${recipe.name}</h3>
    <div class="recipeContainer">
      <div class="recipeImage">
        <img src="${recipe.image}" alt="${recipe.name}">
      </div>
      <div class="recipeDetails">
        <p>Ingredients: ${recipe.ingredients.join(', ')}</p>
        <p>Steps: ${recipe.steps.join(', ')}</p>
      </div>
    </div>
    <button class="deleteButton" onclick="deleteRecipe(${recipe.id})">Delete Recipe</button>
    <button class="editButton" onclick="editRecipe(${recipe.id})">Edit Recipe</button>
  `;

  displayArea.appendChild(recipeDiv);
}

async function deleteRecipe(recipeId) {
  try {
    const response = await fetch(`https://my-recipes-4wwm.onrender.com/recipes/${recipeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Recipe deleted:', data);

    // Refresh the display after successfully deleting the recipe
    refreshDisplay();
    alert('Recipe was deleted.');
  } catch (error) {
    console.error('Error deleting recipe:', error.message);
  }
}

async function refreshDisplay() {
  try {
    // Clear the display area
    displayArea.innerHTML = '<h2>Your Recipes:</h2>';

    // Fetch recipes from FastAPI server using a GET request
    const response = await fetch('https://my-recipes-4wwm.onrender.com/recipes');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    recipes = await response.json();

    // Display all fetched recipes
    recipes.forEach(recipe => displayRecipe(recipe));
  } catch (error) {
    console.error('Error refreshing display:', error.message);
  }
}