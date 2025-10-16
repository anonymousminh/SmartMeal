import React, { useState } from 'react';
import IngredientForm from './components/IngredientForm';
import RecipeDisplay from './components/RecipeDisplay';
import GroceryList from './components/GroceryList';
import LoadingSpinner from './components/LoadingSpinner';
import WeeklyPlannerForm from './components/WeeklyPlannerForm';
import WeeklyPlanDisplay from './components/WeeklyPlanDisplay';
import './App.css';

// Your working API Gateway URL
const API_BASE_URL = 'https://1bnu0ap0yi.execute-api.us-west-2.amazonaws.com/Prod';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [grocerySummary, setGrocerySummary] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pantryIngredients, setPantryIngredients] = useState([]);
  const [activeTab, setActiveTab] = useState('quick-recipes');

  // Existing functions (generateRecipes, generateGroceryList) remain the same
  const generateRecipes = async (ingredients, dietaryPreferences) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: ingredients,
          dietary_preferences: dietaryPreferences
        }),
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.recipes && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
        setPantryIngredients(ingredients);
        setError(`✅ Successfully generated ${data.recipes.length} recipes!`);
      } else {
        throw new Error('Invalid response format: missing recipes array');
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(`❌ Failed to generate recipes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateGroceryList = async (selectedRecipes) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/grocery-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meal_plan: selectedRecipes,
          pantry_ingredients: pantryIngredients
        }),
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.grocery_list !== undefined) {
        setGroceryList(data.grocery_list);
        setGrocerySummary(data.summary);
        setActiveTab('grocery');
        
        if (data.summary && data.summary.is_empty) {
          setError(`🎉 Perfect! You have all ${data.summary.items_already_available} ingredients needed!`);
        } else {
          setError(`✅ Successfully generated grocery list with ${data.grocery_list.length} items!`);
        }
      } else {
        throw new Error('Invalid response format: missing grocery_list');
      }
      
    } catch (err) {
      console.error('Error generating grocery list:', err);
      setError(`❌ Failed to generate grocery list: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New function for weekly planning (placeholder for now)
  const generateWeeklyPlan = async (preferences) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: This will be implemented in Day 11
      // For now, we'll create a mock response
      console.log('Weekly plan preferences:', preferences);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock weekly plan data
      const mockWeeklyPlan = {
        weekly_plan: {
          monday: {
            breakfast: { recipe_name: 'Oatmeal with Berries', ingredients: [], instructions: [] },
            lunch: { recipe_name: 'Grilled Chicken Salad', ingredients: [], instructions: [] },
            dinner: { recipe_name: 'Salmon with Quinoa', ingredients: [], instructions: [] }
          },
          // ... other days would be here
        },
        budget_summary: {
          estimated_total_cost: `$${preferences.budget - 10}`,
          within_budget: true
        },
        nutrition_summary: {
          total_calories_per_day: 2000,
          protein_grams_per_day: 150
        },
        consolidated_grocery_list: [
          { name: 'Chicken Breast', quantity: '2 lbs' },
          { name: 'Salmon Fillet', quantity: '1 lb' },
          { name: 'Mixed Greens', quantity: '2 bags' }
        ]
      };
      
      setWeeklyPlan(mockWeeklyPlan);
      setError('✅ Weekly meal plan generated! (Mock data - full implementation coming in Day 11)');
      
    } catch (err) {
      console.error('Error generating weekly plan:', err);
      setError(`❌ Failed to generate weekly plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'quick-recipes',
      label: 'Quick Recipes',
      emoji: '🍳',
      description: 'Generate recipes from ingredients you have'
    },
    {
      id: 'weekly-planning',
      label: 'Weekly Planning',
      emoji: '📅',
      description: 'Plan a full week with budget & nutrition'
    },
    {
      id: 'grocery',
      label: 'Grocery List',
      emoji: '🛒',
      description: 'Your shopping list'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            🍽️ SmartMeal AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your intelligent meal planning and grocery list assistant powered by AI
          </p>
        </header>

        {/* Success/Error Messages */}
        {error && (
          <div className={`border px-6 py-4 rounded-lg mb-6 flex items-center animate-fade-in ${
            error.includes('✅') || error.includes('🎉')
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            <span className="mr-2">
              {error.includes('✅') || error.includes('🎉') ? '✅' : '❌'}
            </span>
            {error}
          </div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex-1 py-4 px-6 text-center transition-all duration-200 relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-2xl">{tab.emoji}</span>
                  <span className="font-semibold">{tab.label}</span>
                  <span className="text-xs opacity-75">{tab.description}</span>
                </div>
                {/* Badge for grocery list */}
                {tab.id === 'grocery' && groceryList.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {groceryList.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'quick-recipes' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">What's in your kitchen?</h2>
              <IngredientForm onSubmit={generateRecipes} loading={loading} />
            </div>

            {loading && <LoadingSpinner />}
            
            {recipes.length > 0 && !loading && (
              <RecipeDisplay 
                recipes={recipes} 
                onGenerateGroceryList={generateGroceryList}
              />
            )}
          </div>
        )}

        {activeTab === 'weekly-planning' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <WeeklyPlannerForm onSubmit={generateWeeklyPlan} loading={loading} />
            </div>

            {loading && <LoadingSpinner />}
            
            {weeklyPlan && !loading && (
              <WeeklyPlanDisplay 
                weeklyPlan={weeklyPlan} 
                onGenerateGroceryList={generateGroceryList}
                loading={loading}
              />
            )}
          </div>
        )}

        {activeTab === 'grocery' && (
          <div className="space-y-8">
            {loading && <LoadingSpinner />}
            
            {!loading && (groceryList.length > 0 ? (
              <GroceryList items={groceryList} summary={grocerySummary} />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                <div className="text-6xl mb-4">🍳➡️🛒</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Ready to create your grocery list?
                </h3>
                <p className="text-gray-500 mb-6">
                  Generate recipes or plan your week first, then create your personalized shopping list!
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setActiveTab('quick-recipes')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Quick Recipes
                  </button>
                  <button
                    onClick={() => setActiveTab('weekly-planning')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Weekly Planning
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;