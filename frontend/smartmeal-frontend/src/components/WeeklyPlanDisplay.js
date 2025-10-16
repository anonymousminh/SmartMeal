import React, { useState } from 'react';

const WeeklyPlanDisplay = ({ weeklyPlan, onGenerateGroceryList, loading }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);

  const days = [
    { id: 'monday', label: 'Monday', emoji: '📅' },
    { id: 'tuesday', label: 'Tuesday', emoji: '📅' },
    { id: 'wednesday', label: 'Wednesday', emoji: '📅' },
    { id: 'thursday', label: 'Thursday', emoji: '📅' },
    { id: 'friday', label: 'Friday', emoji: '📅' },
    { id: 'saturday', label: 'Saturday', emoji: '🎉' },
    { id: 'sunday', label: 'Sunday', emoji: '🎉' }
  ];

  const meals = [
    { id: 'breakfast', label: 'Breakfast', emoji: '🌅', color: 'yellow' },
    { id: 'lunch', label: 'Lunch', emoji: '☀️', color: 'orange' },
    { id: 'dinner', label: 'Dinner', emoji: '🌙', color: 'purple' }
  ];

  const getMealColorClasses = (color) => {
    const colorMap = {
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const toggleMealDetails = (dayId, mealId) => {
    const key = `${dayId}-${mealId}`;
    setExpandedMeal(expandedMeal === key ? null : key);
  };

  if (!weeklyPlan) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Ready to plan your week?
        </h3>
        <p className="text-gray-500">
          Fill out your preferences above to generate a personalized 7-day meal plan!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary Cards */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Weekly Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {weeklyPlan.budget_summary?.estimated_total_cost || '$--'}
            </div>
            <div className="text-sm text-green-800">Estimated Cost</div>
            <div className="text-xs text-green-600 mt-1">
              {weeklyPlan.budget_summary?.within_budget ? '✅ Within Budget' : '⚠️ Over Budget'}
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {weeklyPlan.nutrition_summary?.total_calories_per_day || '--'}
            </div>
            <div className="text-sm text-blue-800">Calories/Day</div>
            <div className="text-xs text-blue-600 mt-1">Average intake</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {weeklyPlan.nutrition_summary?.protein_grams_per_day || '--'}g
            </div>
            <div className="text-sm text-purple-800">Protein/Day</div>
            <div className="text-xs text-purple-600 mt-1">Daily average</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {weeklyPlan.consolidated_grocery_list?.length || 0}
            </div>
            <div className="text-sm text-orange-800">Grocery Items</div>
            <div className="text-xs text-orange-600 mt-1">To purchase</div>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🗓️</span>
          Your Weekly Meal Plan
        </h3>
        
        <div className="space-y-4">
          {days.map(day => (
            <div key={day.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedDay(selectedDay === day.id ? null : day.id)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">{day.emoji}</span>
                    {day.label}
                  </h4>
                  <span className="text-gray-500">
                    {selectedDay === day.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {(selectedDay === day.id || selectedDay === null) && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {meals.map(meal => {
                      const mealData = weeklyPlan.weekly_plan?.[day.id]?.[meal.id];
                      const isExpanded = expandedMeal === `${day.id}-${meal.id}`;
                      
                      return (
                        <div key={meal.id} className={`rounded-lg border p-3 ${getMealColorClasses(meal.color)}`}>
                          <div 
                            className="cursor-pointer"
                            onClick={() => toggleMealDetails(day.id, meal.id)}
                          >
                            <h5 className="font-medium text-sm mb-1 flex items-center justify-between">
                              <span className="flex items-center">
                                <span className="mr-1">{meal.emoji}</span>
                                {meal.label}
                              </span>
                              <span className="text-xs">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </h5>
                            <p className="text-sm font-semibold">
                              {mealData?.recipe_name || 'Not planned'}
                            </p>
                          </div>
                          
                          {isExpanded && mealData && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                              <div className="mb-2">
                                <h6 className="text-xs font-medium mb-1">Ingredients:</h6>
                                <ul className="text-xs space-y-1">
                                  {mealData.ingredients?.slice(0, 3).map((ingredient, idx) => (
                                    <li key={idx}>• {ingredient.quantity} {ingredient.name}</li>
                                  ))}
                                  {mealData.ingredients?.length > 3 && (
                                    <li className="text-opacity-70">... and {mealData.ingredients.length - 3} more</li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <h6 className="text-xs font-medium mb-1">Instructions:</h6>
                                <p className="text-xs">
                                  {mealData.instructions?.[0] || 'Instructions not available'}
                                  {mealData.instructions?.length > 1 && '...'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Grocery List Button */}
      <div className="text-center">
        <button
          onClick={() => onGenerateGroceryList(weeklyPlan.consolidated_grocery_list)}
          disabled={loading || !weeklyPlan.consolidated_grocery_list}
          className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none flex items-center space-x-2 mx-auto"
        >
          <span>🛒</span>
          <span>Generate Complete Grocery List</span>
          {weeklyPlan.consolidated_grocery_list && (
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
              {weeklyPlan.consolidated_grocery_list.length} items
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default WeeklyPlanDisplay;