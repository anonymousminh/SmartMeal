import json
from unittest import skip
import boto3
from botocore.exceptions import ClientError

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
        
        # Generate grocery list (returns dict with grocery_list and summary)
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
    """Generate consolidated grocery list from meal plan."""
    
    print("🛒 Generating grocery list...")
    
    # Convert pantry ingredients to lowercase for comparison
    pantry_set = set(ingredient.lower().strip() for ingredient in pantry_ingredients)
    print(f"🥫 Pantry set: {pantry_set}")
    
    # Dictionary to consolidate ingredients
    consolidated_ingredients = {}
    total_recipe_ingredients = 0
    skipped_ingredients = []
    
    # Process each recipe in the meal plan
    for recipe in meal_plan:
        recipe_name = recipe.get('recipe_name', 'Unknown Recipe')
        ingredients = recipe.get('ingredients', [])
        
        print(f"📝 Processing recipe: {recipe_name}")
        
        for ingredient in ingredients:
            ingredient_name = ingredient.get('name', '').lower().strip()
            ingredient_quantity = ingredient.get('quantity', 'as needed')
            total_recipe_ingredients += 1
            
            # Skip if ingredient is in pantry
            if ingredient_name in pantry_set:
                print(f"⏭️ Skipping {ingredient_name} (in pantry)")
                skipped_ingredients.append({
                    "name": ingredient_name.title(),
                    "quantity": ingredient_quantity,
                    "reason": "already in pantry"
                })
                continue
            
            # Consolidate quantities
            if ingredient_name in consolidated_ingredients:
                # Simple consolidation - combine quantities
                existing_quantity = consolidated_ingredients[ingredient_name]
                consolidated_ingredients[ingredient_name] = f"{existing_quantity}, {ingredient_quantity}"
            else:
                consolidated_ingredients[ingredient_name] = ingredient_quantity
    
    # Convert to list format
    grocery_list = [
        {
            "name": name.title(),
            "quantity": quantity
        }
        for name, quantity in consolidated_ingredients.items()
    ]

    # Create response with metadata
    response = {
        "grocery_list": grocery_list,
        "summary": {
            "total_items_needed": len(grocery_list),
            "total_recipe_ingredients": total_recipe_ingredients,
            "items_already_available": skipped_ingredients,
            "items_already_available_count": len(skipped_ingredients),
            "is_empty": len(grocery_list) == 0
        }
    }
    
    print(f"✅ Generated grocery list with {len(grocery_list)} items")
    print(f"📊 Summary: {response['summary']}")
    return response