import json
import boto3
import os

# Initialize the Bedrock client
bedrock_runtime = boto3.client(service_name='bedrock-runtime', region_name='us-west-2')

def lambda_handler(event, context):
    """Generate grocery list from meal plan and pantry ingredients."""
    
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": get_cors_headers(),
            "body": json.dumps({"message": "CORS preflight successful"})
        }
    
    try:
        print("📥 Received event:", json.dumps(event, indent=2))
        
        # Parse the request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
            
        print("📝 Parsed body:", json.dumps(body, indent=2))
        
        # Extract meal plan and pantry ingredients
        meal_plan = body.get('meal_plan', [])
        pantry_ingredients = body.get('pantry_ingredients', [])
        
        print(f"🍽️ Meal plan: {meal_plan}")
        print(f"🥫 Pantry ingredients: {pantry_ingredients}")
        
        # Validate inputs
        if not meal_plan or len(meal_plan) == 0:
            return create_error_response(400, "Meal plan cannot be empty.")
        
        # Generate grocery list
        result = generate_grocery_list(meal_plan, pantry_ingredients)
        
        return {
            "statusCode": 200,
            "headers": get_cors_headers(),
            "body": json.dumps(result)
        }

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        return create_error_response(400, f"Invalid JSON format: {str(e)}")
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return create_error_response(500, f"Internal server error: {str(e)}")

def create_error_response(status_code, message):
    """Create a standardized error response with CORS headers."""
    return {
        "statusCode": status_code,
        "headers": get_cors_headers(),
        "body": json.dumps({"error": message})
    }

def get_cors_headers():
    """Get comprehensive CORS headers."""
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400"
    }

def generate_grocery_list(meal_plan, pantry_ingredients):
    """Generate consolidated grocery list from meal plan and categorize items."""
    
    print("🛒 Generating and categorizing grocery list...")
    
    pantry_set = set(ingredient.lower().strip() for ingredient in pantry_ingredients)
    consolidated_ingredients = {}
    total_recipe_ingredients = 0
    skipped_ingredients = []
    
    for recipe in meal_plan:
        recipe_name = recipe.get('recipe_name', 'Unknown Recipe')
        ingredients = recipe.get('ingredients', [])
        
        for ingredient in ingredients:
            ingredient_name = ingredient.get('name', '').lower().strip()
            ingredient_quantity = ingredient.get('quantity', 'as needed')
            total_recipe_ingredients += 1
            
            if ingredient_name in pantry_set:
                skipped_ingredients.append({
                    "name": ingredient_name.title(),
                    "quantity": ingredient_quantity,
                    "reason": "already in pantry"
                })
                continue
            
            if ingredient_name in consolidated_ingredients:
                    existing_quantity = consolidated_ingredients[ingredient_name]['quantity']
                    consolidated_ingredients[ingredient_name]['quantity'] = f"{existing_quantity}, {ingredient_quantity}"
            else:
                consolidated_ingredients[ingredient_name]['quantity'] = ingredient_quantity
    
    # Prepare items for categorization by Bedrock
    items_to_categorize = [
        {"name": name.title(), "quantity": data['quantity']}
        for name, data in consolidated_ingredients.items()
    ]

    categorized_items = []
    if items_to_categorize:
        try:
            categorized_items = categorize_items_with_bedrock(items_to_categorize)
            print(f"✅ Bedrock categorized {len(categorized_items)} items.")
        except Exception as e:
            print(f"⚠️ Failed to categorize items with Bedrock: {e}. Returning uncategorized list.")
            # Fallback to uncategorized if Bedrock fails
            categorized_items = [{
                "name": item['name'],
                "quantity": item['quantity'],
                "category": "Uncategorized"
            } for item in items_to_categorize]

    # Group by category
    categorized_grocery_list = {}
    for item in categorized_items:
        category = item.get('category', 'Uncategorized')
        if category not in categorized_grocery_list:
            categorized_grocery_list[category] = []
        categorized_grocery_list[category].append({
            "name": item['name'],
            "quantity": item['quantity']
        })
    
    # Convert to list of categories for frontend
    final_grocery_list = [
        {"category": category, "items": items}
        for category, items in categorized_grocery_list.items()
    ]

    response = {
        "grocery_list": final_grocery_list,
        "summary": {
            "total_items_needed": len(items_to_categorize),
            "total_recipe_ingredients": total_recipe_ingredients,
            "items_already_available": len(skipped_ingredients),
            "skipped_ingredients": skipped_ingredients,
            "is_empty": len(items_to_categorize) == 0
        }
    }
    
    print(f"✅ Generated grocery list with {len(items_to_categorize)} items, {len(final_grocery_list)} categories.")
    return response

def categorize_items_with_bedrock(items):
    """Uses Bedrock to categorize a list of grocery items."""
    
    model_id = 'anthropic.claude-3-haiku-20240307-v1:0'
    item_names = [item['name'] for item in items]
    
    prompt = f"""You are an expert grocery categorizer. Your task is to categorize a list of grocery items into common supermarket sections. The categories should be general (e.g., Produce, Dairy, Meat, Pantry, Frozen, Bakery, Snacks, Beverages, Household, Spices, Other).

For each item, provide its original name, quantity, and the assigned category. If an item doesn't fit neatly, use 'Pantry' or 'Other'.

**Grocery Items to Categorize:**
{json.dumps(items, indent=2)}

Return ONLY a valid JSON array of objects, where each object has 'name', 'quantity', and 'category' fields. Do not include any text before or after the JSON.

Example output:
```json
[
  {{"name": "Milk", "quantity": "1 gallon", "category": "Dairy"}},
  {{"name": "Apples", "quantity": "5", "category": "Produce"}}
]
```
"""
    
    response = bedrock_runtime.invoke_model(
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2000,
        "messages": [
            {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": prompt
                }]
            }
        ]
    }),
    modelId=model_id,
    contentType='application/json',
    accept='application/json'
)

    response_body = json.loads(response.get('body').read())
    raw_content = response_body['content'][0]['text']

    categorized_json = extract_json_from_text(raw_content)
    if not categorized_json:
        raise ValueError("Bedrock did not return valid JSON for categorization.")

    return categorized_json

def extract_json_from_text(text):
    """Extracts a JSON object from a string, even if it's wrapped in a markdown"""
    try:
        # Find the start of the JSON object
        json_start = text.find('{')
        # Find the end of the JSON object
        json_end = text.rfind('}') + 1

        # Try to find array first
        array_start = text.find('[')
        array_end = text.rfind(']') + 1
        if array_start != -1 and array_end != -1:
            json_start = array_start
            json_end = array_end
        else:
            # Then try to find object
            obj_start = text.find('{')
            obj_end = text.rfind('}') + 1
            if obj_start != -1 and obj_end != -1:
                json_start = obj_start
                json_end = obj_end

        if json_start != -1 and json_end != -1:
            json_str = text[json_start:json_end]
            return json.loads(json_str)
        return None
    except (json.JSONDecodeError, IndexError):
        return None