import React, { useState } from 'react';

const WeeklyPlannerForm = ({ onSubmit, loading }) => {
  const [preferences, setPreferences] = useState({
    dietary: [],
    budget: 100,
    nutrition_goals: 'balanced',
    servings: 2,
    meal_types: ['breakfast', 'lunch', 'dinner']
  });

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
    { id: 'vegan', label: 'Vegan', emoji: '🌱' },
    { id: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
    { id: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
    { id: 'keto', label: 'Keto', emoji: '🥑' },
    { id: 'paleo', label: 'Paleo', emoji: '🍖' },
    { id: 'low-carb', label: 'Low-Carb', emoji: '🥒' },
    { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' }
  ];

  const nutritionOptions = [
    { value: 'balanced', label: 'Balanced Diet', description: 'Well-rounded nutrition' },
    { value: 'high_protein', label: 'High Protein', description: 'Focus on protein intake' },
    { value: 'low_carb', label: 'Low Carb', description: 'Minimize carbohydrates' },
    { value: 'heart_healthy', label: 'Heart Healthy', description: 'Cardiovascular wellness' },
    { value: 'weight_loss', label: 'Weight Loss', description: 'Calorie-conscious meals' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (preferences.dietary.length === 0) {
      const confirmed = window.confirm('No dietary preferences selected. Continue with all food types?');
      if (!confirmed) return;
    }

    onSubmit(preferences);
  };

  const handleDietaryChange = (dietId) => {
    if (preferences.dietary.includes(dietId)) {
      setPreferences({
        ...preferences,
        dietary: preferences.dietary.filter(d => d !== dietId)
      });
    } else {
      setPreferences({
        ...preferences,
        dietary: [...preferences.dietary, dietId]
      });
    }
  };

  const handleMealTypeChange = (mealType) => {
    if (preferences.meal_types.includes(mealType)) {
      if (preferences.meal_types.length > 1) {
        setPreferences({
          ...preferences,
          meal_types: preferences.meal_types.filter(m => m !== mealType)
        });
      }
    } else {
      setPreferences({
        ...preferences,
        meal_types: [...preferences.meal_types, mealType]
      });
    }
  };

  const getBudgetLabel = (budget) => {
    if (budget < 75) return 'Budget-Friendly';
    if (budget < 150) return 'Moderate';
    if (budget < 250) return 'Premium';
    return 'Luxury';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-3">📅</span>
          Plan Your Perfect Week
        </h3>
        <p className="text-gray-600">
          Let our AI create a personalized 7-day meal plan with budget and nutrition controls.
        </p>
      </div>

      {/* Dietary Preferences Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-700">
            🍽️ Dietary Preferences
          </label>
          {preferences.dietary.length > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {preferences.dietary.length} selected
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          Select any dietary restrictions or preferences (optional)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dietaryOptions.map((diet) => (
            <label 
              key={diet.id} 
              className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                preferences.dietary.includes(diet.id)
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={preferences.dietary.includes(diet.id)}
                onChange={() => handleDietaryChange(diet.id)}
                className="sr-only"
              />
              <span className="text-lg">{diet.emoji}</span>
              <span className="text-sm font-medium">{diet.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Budget Section */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-700">
          💰 Weekly Budget: ${preferences.budget}
        </label>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {getBudgetLabel(preferences.budget)}
            </span>
            <span className="text-sm text-gray-500">
              ~${Math.round(preferences.budget / 7)}/day
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={preferences.budget}
            onChange={(e) => setPreferences({...preferences, budget: parseInt(e.target.value)})}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$50</span>
            <span>$175</span>
            <span>$300</span>
          </div>
        </div>
      </div>

      {/* Nutrition Goals Section */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-700">
          🎯 Nutrition Focus
        </label>
        <div className="grid gap-3">
          {nutritionOptions.map((option) => (
            <label 
              key={option.value}
              className={`flex items-center justify-between cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                preferences.nutrition_goals === option.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="nutrition_goals"
                  value={option.value}
                  checked={preferences.nutrition_goals === option.value}
                  onChange={(e) => setPreferences({...preferences, nutrition_goals: e.target.value})}
                  className="text-green-600 focus:ring-green-500"
                />
                <div>
                  <div className="font-medium text-gray-800">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Servings Section */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-700">
          👥 Number of Servings
        </label>
        <select
          value={preferences.servings}
          onChange={(e) => setPreferences({...preferences, servings: parseInt(e.target.value)})}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="1">1 person</option>
          <option value="2">2 people</option>
          <option value="3">3 people</option>
          <option value="4">4 people</option>
          <option value="6">6 people</option>
          <option value="8">8 people</option>
        </select>
      </div>

      {/* Meal Types Section */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-gray-700">
          🍳 Meals to Plan
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
            { id: 'lunch', label: 'Lunch', emoji: '☀️' },
            { id: 'dinner', label: 'Dinner', emoji: '🌙' }
          ].map((meal) => (
            <label 
              key={meal.id}
              className={`flex items-center justify-center space-x-2 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${
                preferences.meal_types.includes(meal.id)
                  ? 'border-purple-500 bg-purple-50 text-purple-800'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={preferences.meal_types.includes(meal.id)}
                onChange={() => handleMealTypeChange(meal.id)}
                className="sr-only"
              />
              <span className="text-lg">{meal.emoji}</span>
              <span className="text-sm font-medium">{meal.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Your Weekly Plan...</span>
            </>
          ) : (
            <>
              <span>📅</span>
              <span>Generate Weekly Meal Plan</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <span className="mr-2">📋</span>
          Plan Summary
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• {preferences.meal_types.length} meal{preferences.meal_types.length !== 1 ? 's' : ''} per day for {preferences.servings} {preferences.servings === 1 ? 'person' : 'people'}</div>
          <div>• Budget: ${preferences.budget}/week ({getBudgetLabel(preferences.budget)})</div>
          <div>• Focus: {nutritionOptions.find(n => n.value === preferences.nutrition_goals)?.label}</div>
          {preferences.dietary.length > 0 && (
            <div>• Dietary: {preferences.dietary.join(', ')}</div>
          )}
        </div>
      </div>
    </form>
  );
};

export default WeeklyPlannerForm;