import React, { useState } from 'react';

const DIETARY_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'paleo',
  'low-carb',
  'mediterranean'
];

const IngredientForm = ({ onSubmit, loading }) => {
  const [ingredients, setIngredients] = useState('');
  const [selectedDiets, setSelectedDiets] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!ingredients.trim()) {
      alert('Please enter some ingredients!');
      return;
    }

    const ingredientList = ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    onSubmit(ingredientList, selectedDiets);
  };

  const handleDietaryChange = (diet) => {
    if (selectedDiets.includes(diet)) {
      setSelectedDiets(selectedDiets.filter(d => d !== diet));
    } else {
      setSelectedDiets([...selectedDiets, diet]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">
          Available Ingredients
        </label>
        <input
          id="ingredients"
          type="text"
          placeholder="e.g., chicken breast, rice, broccoli, onion"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500">
          Enter ingredients separated by commas
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Dietary Preferences (optional)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DIETARY_OPTIONS.map((diet) => (
            <label key={diet} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDiets.includes(diet)}
                onChange={() => handleDietaryChange(diet)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm capitalize">{diet}</span>
            </label>
          ))}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Generating Recipes...' : 'Generate Recipes'}
      </button>
    </form>
  );
};

export default IngredientForm;