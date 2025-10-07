import json

def generate_consolidated_grocery_list(meal_plan, pantry_ingredients):
    """Generates a single, consolidated grocery list from a meal plan."""
    
    # Normalize pantry ingredients for easy lookup (lowercase, set)
    pantry_set = {item.lower() for item in pantry_ingredients}
    
    # Use a dictionary to consolidate ingredients and their quantities
    consolidated_list = {}
    
    # Iterate over each recipe in the meal plan
    for recipe in meal_plan:
        recipe_ingredients = recipe.get("ingredients", [])
        for ingredient in recipe_ingredients:
            ingredient_name = ingredient["name"].lower()
            
            # Check if the ingredient is in the pantry
            if ingredient_name not in pantry_set:
                quantity = ingredient.get("quantity", "some")
                
                # If ingredient is already in our list, append the quantity
                if ingredient_name in consolidated_list:
                    consolidated_list[ingredient_name]["quantity"] += f", {quantity}"
                # Otherwise, add it as a new entry
                else:
                    consolidated_list[ingredient_name] = {
                        "name": ingredient["name"], # Keep original casing for display
                        "quantity": quantity
                    }
    
    # Convert the dictionary back to a list for the final output
    return list(consolidated_list.values())

def lambda_handler(event, context):
    """The main Lambda handler function."""
    
    try:
        # Extract meal plan and pantry ingredients from the event body
        body = json.loads(event.get("body", "{}"))
        meal_plan = body.get("meal_plan", [])
        pantry_ingredients = body.get("pantry_ingredients", [])
        
        if not meal_plan:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "A valid meal_plan array must be provided."})
            }
        
        # Generate the consolidated grocery list
        grocery_list = generate_consolidated_grocery_list(meal_plan, pantry_ingredients)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({"grocery_list": grocery_list})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
