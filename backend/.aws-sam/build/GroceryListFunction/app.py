import json

def generate_grocery_list(recipe, pantry_ingredients):
    """Compare recipe ingredients with pantry ingredients to find what is missing"""

    # Normalize pantry ingredients for easy lookup
    pantry_set = {item.lower() for item in pantry_ingredients}

    misssing_ingredients = []

    recipe_ingredients = recipe.get("ingredients", [])

    for ingredient in recipe_ingredients:
        # Check if ingredient name is in the pantry set
        if ingredient["name"].lower() not in pantry_set:
            misssing_ingredients.append(ingredient)

    return misssing_ingredients

def lambda_handler(event, context):
    """The main Lambda handler function"""

    try:
        # Extract recipe and pantry ingredients from the event body
        body = json.loads(event.get("body", "{}"))
        recipe = body.get("recipe")
        pantry_ingredients = body.get("pantry_ingredients", [])

        if not recipe or "ingredients" not in recipe:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "A valid recipe object must be provided."})
            }

        # Generate the grocery list
        grocery_list = generate_grocery_list(recipe, pantry_ingredients)

        return {
            "statusCode": 200,
            "headers": {
                "Content_Type": "application/json"
            },
            "body": json.dumps({"grocery_list": grocery_list})
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }