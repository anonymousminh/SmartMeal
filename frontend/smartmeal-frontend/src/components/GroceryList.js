import React, { useState } from 'react';

const GroceryList = ({ items, summary }) => {
  const [checkedItems, setCheckedItems] = useState(new Set());

  const handleItemCheck = (index) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(index)) {
      newCheckedItems.delete(index);
    } else {
      newCheckedItems.add(index);
    }
    setCheckedItems(newCheckedItems);
  };

  const progress = items.length > 0 ? (checkedItems.size / items.length) * 100 : 0;

  // Handle empty grocery list case
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Your Grocery List</h2>
        
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">
            Great news! You have everything you need!
          </h3>
          <p className="text-gray-600 mb-4">
            All ingredients for your selected recipes are already in your pantry.
          </p>
          
          {summary && summary.skipped_ingredients && summary.skipped_ingredients.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-green-800 mb-2">
                Ingredients you already have:
              </h4>
              <div className="space-y-1">
                {summary.skipped_ingredients.map((ingredient, index) => (
                  <div key={index} className="text-sm text-green-700">
                    ✓ {ingredient.quantity} {ingredient.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Plan Another Meal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Your Grocery List</h2>
      
      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.total_items_needed}</div>
              <div className="text-sm text-blue-800">Items to buy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.items_already_available}</div>
              <div className="text-sm text-green-800">Already have</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{summary.total_recipe_ingredients}</div>
              <div className="text-sm text-gray-800">Total ingredients</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((summary.items_already_available / summary.total_recipe_ingredients) * 100)}%
              </div>
              <div className="text-sm text-purple-800">Pantry coverage</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Shopping Progress</span>
          <span>{checkedItems.size} of {items.length} items</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center space-x-3 p-3 rounded-lg border ${
              checkedItems.has(index) 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={checkedItems.has(index)}
              onChange={() => handleItemCheck(index)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span 
              className={`flex-1 ${
                checkedItems.has(index) 
                  ? 'line-through text-gray-500' 
                  : 'text-gray-800'
              }`}
            >
              {item.quantity} {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroceryList;