import React, { useState } from 'react';
import IngredientForm from './components/IngredientForm';
import RecipeDisplay from './components/RecipeDisplay';
import GroceryList from './components/GroceryList';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// API Gateway URL - FIXED: Removed trailing slash
const API_BASE_URL = 'https://1bnu0ap0yi.execute-api.us-west-2.amazonaws.com/Prod';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pantryIngredients, setPantryIngredients] = useState([]);
  const [activeTab, setActiveTab] = useState('recipes');

  const generateRecipes = async (ingredients, dietaryPreferences) => {
    setLoading(true);
    setError(null);
    
    console.log('🚀 Starting recipe generation...');
    console.log('📝 Ingredients:', ingredients);
    console.log('🥗 Dietary preferences:', dietaryPreferences);
    console.log('🌐 API URL:', `${API_BASE_URL}/recipes`);
    
    try {
      const requestBody = {
        ingredients: ingredients,
        dietary_preferences: dietaryPreferences
      };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        mode: 'cors'
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Received data:', data);
        
        if (data.recipes && Array.isArray(data.recipes)) {
          setRecipes(data.recipes);
          setPantryIngredients(ingredients);
          setError(`✅ Successfully generated ${data.recipes.length} recipes!`);
        } else {
          console.warn('⚠️ Unexpected response format:', data);
          setError('⚠️ Received unexpected response format from server');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          // Error text is not JSON, use as is
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        setError(`❌ Failed to generate recipes: ${errorMessage}`);
      }
    } catch (err) {
      console.error('💥 Network/Fetch Error:', err);
      console.error('💥 Error name:', err.name);
      console.error('💥 Error message:', err.message);
      
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('🌐 Network error: Unable to connect to the server. Please check:\n• Your internet connection\n• If the API Gateway URL is correct\n• If CORS is properly configured');
      } else if (err.name === 'AbortError') {
        setError('⏱️ Request timeout: The server is taking too long to respond');
      } else {
        setError(`💥 Unexpected error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateGroceryList = async (selectedRecipes) => {
    setLoading(true);
    setError(null);
    
    console.log('🛒 Starting grocery list generation...');
    console.log('📝 Selected recipes:', selectedRecipes);
    console.log('🥫 Pantry ingredients:', pantryIngredients);
    
    try {
      const requestBody = {
        meal_plan: selectedRecipes,
        pantry_ingredients: pantryIngredients
      };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/grocery-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        mode: 'cors'
      });
      
      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Received grocery list:', data);
        
        if (data.grocery_list && Array.isArray(data.grocery_list)) {
          setGroceryList(data.grocery_list);
          setActiveTab('grocery');
          setError(`✅ Successfully generated grocery list with ${data.grocery_list.length} items!`);
        } else {
          console.warn('⚠️ Unexpected response format:', data);
          setError('⚠️ Received unexpected response format from server');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch (e) {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        setError(`❌ Failed to generate grocery list: ${errorMessage}`);
      }
    } catch (err) {
      console.error('💥 Network/Fetch Error:', err);
      setError(`💥 Failed to generate grocery list: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test API connectivity
  const testAPIConnection = async () => {
    console.log('🔍 Testing API connection...');
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'OPTIONS',
        mode: 'cors'
      });
      console.log('🔍 OPTIONS response:', response.status);
    } catch (err) {
      console.error('🔍 OPTIONS test failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍽️ SmartMeal AI
          </h1>
          <p className="text-lg text-gray-600">
            Your intelligent meal planning and grocery list assistant
          </p>
          {/* Debug button - remove in production */}
          <button 
            onClick={testAPIConnection}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            🔍 Test API Connection (Debug)
          </button>
        </header>

        {error && (
          <div className={`border px-4 py-3 rounded mb-4 whitespace-pre-line ${
            error.includes('✅') 
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'recipes'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('recipes')}
          >
            Generate Recipes
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'grocery'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('grocery')}
          >
            Grocery List
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">What's in your kitchen?</h2>
              <IngredientForm onSubmit={generateRecipes} loading={loading} />
            </div>

            {loading && <LoadingSpinner />}
            
            {recipes.length > 0 && (
              <RecipeDisplay 
                recipes={recipes} 
                onGenerateGroceryList={generateGroceryList}
              />
            )}
          </div>
        )}

        {activeTab === 'grocery' && (
          <div className="space-y-6">
            {groceryList.length > 0 ? (
              <GroceryList items={groceryList} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">
                  Generate recipes first, then create your grocery list!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;