import React, { useState } from 'react';

const GroceryList = ({ items }) => {
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [sortBy, setSortBy] = useState('alphabetical');

  const handleItemCheck = (index) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(index)) {
      newCheckedItems.delete(index);
    } else {
      newCheckedItems.add(index);
    }
    setCheckedItems(newCheckedItems);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = items.map((item, index) => 
      `${checkedItems.has(index) ? '✓' : '☐'} ${item.name} - ${item.quantity}`
    ).join('\n');
    const blob = new Blob([`SmartMeal Grocery List\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartmeal-grocery-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChecked = () => {
    setCheckedItems(new Set());
  };

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'category':
        // Simple categorization based on common ingredients
        const getCategory = (name) => {
          const lowerName = name.toLowerCase();
          if (['chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey'].some(meat => lowerName.includes(meat))) return 'meat';
          if (['milk', 'cheese', 'yogurt', 'butter'].some(dairy => lowerName.includes(dairy))) return 'dairy';
          if (['apple', 'banana', 'orange', 'berry', 'grape'].some(fruit => lowerName.includes(fruit))) return 'produce';
          if (['bread', 'pasta', 'rice', 'cereal'].some(grain => lowerName.includes(grain))) return 'grains';
          return 'other';
        };
        return getCategory(a.name).localeCompare(getCategory(b.name));
      default:
        return 0;
    }
  });

  const checkedCount = checkedItems.size;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="mr-3 text-3xl">🛒</span>
              Your Grocery List
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrint}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 bg-white bg-opacity-70"
              >
                🖨️ Print
              </button>
              <button 
                onClick={handleDownload}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 bg-white bg-opacity-70"
              >
                📥 Download
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>{checkedCount} of {totalCount} items collected</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="alphabetical">Sort A-Z</option>
              <option value="category">Sort by Category</option>
            </select>
            
            {checkedCount > 0 && (
              <button
                onClick={clearChecked}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear Checked ({checkedCount})
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg">No items in your grocery list yet.</p>
              <p className="text-sm mt-2">Generate recipes first, then create your grocery list!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedItems.map((item, originalIndex) => {
                const index = items.findIndex(i => i.name === item.name && i.quantity === item.quantity);
                const isChecked = checkedItems.has(index);
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                      isChecked 
                        ? 'bg-green-50 border-green-200 opacity-75' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <button
                        onClick={() => handleItemCheck(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isChecked
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {isChecked && <span className="text-sm">✓</span>}
                      </button>
                      
                      <span 
                        className={`font-medium capitalize transition-all duration-200 ${
                          isChecked ? 'text-gray-500 line-through' : 'text-gray-800'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      isChecked 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total items: {totalCount}</span>
              <span>Estimated shopping time: {Math.max(15, totalCount * 2)} minutes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;