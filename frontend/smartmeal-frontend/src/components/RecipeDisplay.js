import React, { useState } from 'react';

const RecipeDisplay = ({ recipes, onGenerateGroceryList }) => {
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [filterDiet, setFilterDiet] = useState('all');

  const handleRecipeSelection = (recipe) => {
    const isSelected = selectedRecipes.some(r => r.recipe_name === recipe.recipe_name);
    if (isSelected) {
      setSelectedRecipes(selectedRecipes.filter(r => r.recipe_name !== recipe.recipe_name));
    } else {
      setSelectedRecipes([...selectedRecipes, recipe]);
    }
  };

  const handleGenerateGroceryList = () => {
    if (selectedRecipes.length === 0) {
      alert('Please select at least one recipe to generate a grocery list!');
      return;
    }
    onGenerateGroceryList(selectedRecipes);
  };

  const toggleRecipeExpansion = (index) => {
    setExpandedRecipe(expandedRecipe === index ? null : index);
  };

  const estimateCookingTime = (instructions) => {
    const stepCount = instructions?.length || 0;
    return Math.max(15, stepCount * 5); // Estimate 5 minutes per step, minimum 15 minutes
  };

  const getDifficultyLevel = (instructions) => {
    const stepCount = instructions?.length || 0;
    if (stepCount <= 4) return { level: 'Easy', color: 'text-green-600', bg: 'bg-green-100' };
    if (stepCount <= 7) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Hard', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const filteredRecipes = recipes.filter(recipe => {
    if (filterDiet === 'all') return true;
    return recipe.recipe_name.toLowerCase().includes(filterDiet.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Generated Recipes</h2>
          <p className="text-gray-600">{recipes.length} recipes found</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter Dropdown */}
          <select
            value={filterDiet}
            onChange={(e) => setFilterDiet(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Recipes</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten-free">Gluten-Free</option>
          </select>

          {/* Generate Grocery List Button */}
          {selectedRecipes.length > 0 && (
            <button 
              onClick={handleGenerateGroceryList}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>🛒</span>
              Generate Grocery List ({selectedRecipes.length})
            </button>
          )}
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {filteredRecipes.map((recipe, index) => {
          const isSelected = selectedRecipes.some(r => r.recipe_name === recipe.recipe_name);
          const isExpanded = expandedRecipe === index;
          const cookingTime = estimateCookingTime(recipe.instructions);
          const difficulty = getDifficultyLevel(recipe.instructions);

          return (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              {/* Recipe Header */}
              <div className="bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 leading-tight">
                      {recipe.recipe_name}
                    </h3>
                    
                    {/* Recipe Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 bg-white bg-opacity-70 px-2 py-1 rounded-full">
                        <span>⏱️</span>
                        <span className="font-medium">{cookingTime} mins</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white bg-opacity-70 px-2 py-1 rounded-full">
                        <span>👥</span>
                        <span className="font-medium">2-4 servings</span>
                      </div>
                      <div className={`flex items-center gap-1 ${difficulty.bg} px-2 py-1 rounded-full`}>
                        <span>📊</span>
                        <span className={`font-medium ${difficulty.color}`}>{difficulty.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <label className="flex items-center space-x-2 cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleRecipeSelection(recipe)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                    />
                    <span className="text-sm font-medium text-gray-700">Select</span>
                  </label>
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-6">
                {/* Ingredients Section */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center text-lg">
                    <span className="mr-2">🥘</span>
                    Ingredients ({recipe.ingredients?.length || 0})
                  </h4>
                  <div className="grid gap-2">
                    {recipe.ingredients?.slice(0, isExpanded ? undefined : 4).map((ingredient, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-800 capitalize">
                          {ingredient.name}
                        </span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          {ingredient.quantity}
                        </span>
                      </div>
                    ))}
                    
                    {!isExpanded && recipe.ingredients?.length > 4 && (
                      <button
                        onClick={() => toggleRecipeExpansion(index)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium py-2 transition-colors"
                      >
                        + {recipe.ingredients.length - 4} more ingredients
                      </button>
                    )}
                  </div>
                </div>

                {/* Instructions Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-800 flex items-center text-lg">
                      <span className="mr-2">📝</span>
                      Instructions
                    </h4>
                    <button
                      onClick={() => toggleRecipeExpansion(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      {isExpanded ? 'Show Less' : 'Show All'}
                    </button>
                  </div>
                  
                  <ol className="space-y-3">
                    {recipe.instructions?.slice(0, isExpanded ? undefined : 3).map((step, idx) => (
                      <li key={idx} className="flex gap-3 group">
                        <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 group-hover:bg-blue-600 transition-colors">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed">{step}</span>
                      </li>
                    ))}
                    
                    {!isExpanded && recipe.instructions?.length > 3 && (
                      <li className="flex gap-3">
                        <span className="w-7 h-7 flex items-center justify-center text-sm text-gray-400">
                          ...
                        </span>
                        <span className="text-gray-500 italic">
                          {recipe.instructions.length - 3} more steps
                        </span>
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600">No recipes match your current filter.</p>
          <button
            onClick={() => setFilterDiet('all')}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeDisplay;