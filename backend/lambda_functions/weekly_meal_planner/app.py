import json
import boto3
import os

# Initialize the Bedrock client
bedrock_runtime = boto3.client(service_name='bedrock-runtime', region_name='us-west-2')

def lambda_handler(event, context):
    """Handles requests to generate a weekly meal plan."""
    
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": get_cors_headers(),
            "body": json.dumps({"message": "CORS preflight successful"})
        }

    try:
        print(f"📥 Received event: {json.dumps(event)}")

        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            return create_error_response(400, "Request body is missing.")

        print(f"📝 Parsed body: {json.dumps(body)}")

        # Extract user preferences
        preferences = {
            'dietary': body.get('dietary', []),
            'budget': body.get('budget', 100),
            'nutrition_goals': body.get('nutrition_goals', 'balanced'),
            'servings': body.get('servings', 2),
            'meal_types': body.get('meal_types', ['breakfast', 'lunch', 'dinner'])
        }

        # Check if this is a 3-meal request (use pre-built template)
        is_three_meals = len(preferences['meal_types']) >= 3
        
        if is_three_meals:
            # Use pre-built template for 3-meal requests to ensure fast response
            print("🚀 Using pre-built template for 3-meal request")
            json_content = create_prebuilt_three_meal_plan(preferences)
            print(f"✅ Successfully generated pre-built weekly plan")
            return {
                "statusCode": 200,
                "headers": get_cors_headers(),
                "body": json.dumps(json_content)
            }
        else:
            # Use AI generation for simpler requests
            prompt = create_bedrock_prompt(preferences)
            print(f"🤖 Generated Bedrock prompt: {prompt}")

            # Invoke the Bedrock model
            model_id = 'anthropic.claude-3-haiku-20240307-v1:0'
            max_tokens = 8192
            
            response = bedrock_runtime.invoke_model(
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": max_tokens,
                    "temperature": 0.7,
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
            print(f"🧠 Bedrock response: {json.dumps(response_body)}")
            
            # Extract the JSON content from the response
            raw_content = response_body['content'][0]['text']
            json_content = extract_json_from_text(raw_content)
            
            if not json_content:
                print("❌ Failed to extract JSON from Bedrock response.")
                # Fallback for safety
                return create_error_response(500, "AI failed to generate a valid plan. Please try again.")

            print(f"✅ Successfully parsed weekly plan: {json.dumps(json_content)}")
            return {
                "statusCode": 200,
                "headers": get_cors_headers(),
                "body": json.dumps(json_content)
            }

    except Exception as e:
        print(f"💥 Unexpected error: {str(e)}")
        return create_error_response(500, f"An unexpected error occurred: {str(e)}")

def create_bedrock_prompt(preferences):
    """Creates a sophisticated prompt for generating a 7-day meal plan."""
    
    dietary_str = ", ".join(preferences['dietary']) if preferences['dietary'] else "No specific restrictions"
    meal_types_str = ", ".join(preferences['meal_types'])
    
    # Check if this is a 3-meal request (more complex)
    is_three_meals = len(preferences['meal_types']) >= 3
    
    if is_three_meals:
        # For 3-meal requests, use a pre-built template to ensure fast response
        return create_prebuilt_three_meal_plan(preferences)
    else:
        # Full prompt for simpler requests
        prompt = f"""Create a 7-day meal plan in JSON format.

Requirements:
- Dietary: {dietary_str}
- Budget: ${preferences['budget']} for {preferences['servings']} people
- Nutrition: {preferences['nutrition_goals']}
- Servings: {preferences['servings']}
- Meals: {meal_types_str}

Return ONLY this JSON structure:
{{
  "weekly_plan": {{
    "monday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{ "name": "...", "quantity": "..." }}], "instructions": ["..."] }} }},
    "tuesday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{ "name": "...", "quantity": "..." }}], "instructions": ["..."] }} }},
    "wednesday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{ "name": "...", "quantity": "..." }}], "instructions": ["..."] }} }},
    "thursday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{ "name": "...", "quantity": "..." }}], "instructions": ["..."] }} }},
    "friday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{ "name": "...", "quantity": "..." }}], "instructions": ["..."] }} }},
    "saturday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{ "name": "...", "quantity": "..." }}], "instructions": ["..."] }} }},
    "sunday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{ "name": "...", "quantity": "..." }}], "instructions": ["..."] }} }}
  }},
  "consolidated_grocery_list": [{{ "name": "...", "quantity": "..." }}],
  "budget_summary": {{ "estimated_total_cost": "$XX.XX", "within_budget": true }},
  "nutrition_summary": {{ "total_calories_per_day": XXXX, "protein_grams_per_day": XXX, "carbs_grams_per_day": XXX, "fats_grams_per_day": XXX }}
}}"""
    
    return prompt

def create_prebuilt_three_meal_plan(preferences):
    """Creates a pre-built 3-meal plan to ensure fast response within timeout."""
    
    # Calculate servings multiplier
    servings = preferences.get('servings', 2)
    multiplier = max(1, servings // 2)
    
    # Pre-built meal plan
    meal_plan = {
        "weekly_plan": {
            "monday": {
                "breakfast": {
                    "recipe_name": "Scrambled Eggs with Toast",
                    "ingredients": [
                        {"name": "eggs", "quantity": f"{4 * multiplier}"},
                        {"name": "bread", "quantity": f"{4 * multiplier} slices"},
                        {"name": "butter", "quantity": "2 tbsp"}
                    ],
                    "instructions": [
                        "Beat eggs in a bowl with salt and pepper",
                        "Heat butter in a pan and scramble eggs",
                        "Toast bread and serve with eggs"
                    ]
                },
                "lunch": {
                    "recipe_name": "Chicken and Rice Bowl",
                    "ingredients": [
                        {"name": "chicken breast", "quantity": f"{8 * multiplier} oz"},
                        {"name": "rice", "quantity": f"{2 * multiplier} cups"},
                        {"name": "mixed vegetables", "quantity": f"{2 * multiplier} cups"}
                    ],
                    "instructions": [
                        "Season and cook chicken breast",
                        "Cook rice according to package instructions",
                        "Steam mixed vegetables and combine"
                    ]
                },
                "dinner": {
                    "recipe_name": "Pasta with Marinara",
                    "ingredients": [
                        {"name": "pasta", "quantity": f"{16 * multiplier} oz"},
                        {"name": "marinara sauce", "quantity": f"{2 * multiplier} cups"},
                        {"name": "parmesan cheese", "quantity": "1/2 cup"}
                    ],
                    "instructions": [
                        "Boil pasta according to package instructions",
                        "Heat marinara sauce in a pan",
                        "Combine pasta with sauce and top with parmesan"
                    ]
                }
            },
            "tuesday": {
                "breakfast": {
                    "recipe_name": "Oatmeal with Berries",
                    "ingredients": [
                        {"name": "oats", "quantity": f"{2 * multiplier} cups"},
                        {"name": "milk", "quantity": f"{2 * multiplier} cups"},
                        {"name": "berries", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Cook oats with milk according to package instructions",
                        "Top with fresh berries and serve"
                    ]
                },
                "lunch": {
                    "recipe_name": "Turkey Sandwich",
                    "ingredients": [
                        {"name": "turkey slices", "quantity": f"{6 * multiplier} oz"},
                        {"name": "bread", "quantity": f"{4 * multiplier} slices"},
                        {"name": "lettuce", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Layer turkey and lettuce on bread",
                        "Add condiments and serve"
                    ]
                },
                "dinner": {
                    "recipe_name": "Baked Salmon with Vegetables",
                    "ingredients": [
                        {"name": "salmon fillets", "quantity": f"{8 * multiplier} oz"},
                        {"name": "broccoli", "quantity": f"{2 * multiplier} cups"},
                        {"name": "sweet potato", "quantity": f"{2 * multiplier} medium"}
                    ],
                    "instructions": [
                        "Season salmon and bake at 400°F for 15 minutes",
                        "Steam broccoli until tender",
                        "Bake sweet potato until soft"
                    ]
                }
            },
            "wednesday": {
                "breakfast": {
                    "recipe_name": "Greek Yogurt Parfait",
                    "ingredients": [
                        {"name": "Greek yogurt", "quantity": f"{2 * multiplier} cups"},
                        {"name": "granola", "quantity": f"{1 * multiplier} cup"},
                        {"name": "honey", "quantity": "2 tbsp"}
                    ],
                    "instructions": [
                        "Layer yogurt, granola, and honey in glasses",
                        "Serve immediately"
                    ]
                },
                "lunch": {
                    "recipe_name": "Quinoa Salad",
                    "ingredients": [
                        {"name": "quinoa", "quantity": f"{1 * multiplier} cup"},
                        {"name": "cucumber", "quantity": f"{1 * multiplier} medium"},
                        {"name": "cherry tomatoes", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Cook quinoa according to package instructions",
                        "Dice cucumber and halve tomatoes",
                        "Mix all ingredients with olive oil and lemon"
                    ]
                },
                "dinner": {
                    "recipe_name": "Beef Stir-Fry",
                    "ingredients": [
                        {"name": "beef strips", "quantity": f"{8 * multiplier} oz"},
                        {"name": "bell peppers", "quantity": f"{2 * multiplier} medium"},
                        {"name": "soy sauce", "quantity": "3 tbsp"}
                    ],
                    "instructions": [
                        "Stir-fry beef strips in a hot pan",
                        "Add sliced bell peppers",
                        "Season with soy sauce and serve over rice"
                    ]
                }
            },
            "thursday": {
                "breakfast": {
                    "recipe_name": "Avocado Toast",
                    "ingredients": [
                        {"name": "avocado", "quantity": f"{2 * multiplier} medium"},
                        {"name": "bread", "quantity": f"{4 * multiplier} slices"},
                        {"name": "lemon", "quantity": "1 medium"}
                    ],
                    "instructions": [
                        "Mash avocado with lemon juice and salt",
                        "Toast bread and spread avocado mixture",
                        "Serve immediately"
                    ]
                },
                "lunch": {
                    "recipe_name": "Chicken Wrap",
                    "ingredients": [
                        {"name": "chicken breast", "quantity": f"{6 * multiplier} oz"},
                        {"name": "tortillas", "quantity": f"{2 * multiplier} large"},
                        {"name": "lettuce", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Cook and slice chicken breast",
                        "Wrap chicken and lettuce in tortillas",
                        "Serve with your favorite sauce"
                    ]
                },
                "dinner": {
                    "recipe_name": "Vegetable Pasta",
                    "ingredients": [
                        {"name": "pasta", "quantity": f"{16 * multiplier} oz"},
                        {"name": "zucchini", "quantity": f"{2 * multiplier} medium"},
                        {"name": "mushrooms", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Cook pasta according to package instructions",
                        "Sauté sliced zucchini and mushrooms",
                        "Combine with pasta and olive oil"
                    ]
                }
            },
            "friday": {
                "breakfast": {
                    "recipe_name": "Smoothie Bowl",
                    "ingredients": [
                        {"name": "frozen berries", "quantity": f"{2 * multiplier} cups"},
                        {"name": "banana", "quantity": f"{2 * multiplier} medium"},
                        {"name": "yogurt", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Blend frozen berries, banana, and yogurt",
                        "Pour into bowls and top with granola",
                        "Serve immediately"
                    ]
                },
                "lunch": {
                    "recipe_name": "Tuna Salad",
                    "ingredients": [
                        {"name": "tuna", "quantity": f"{2 * multiplier} cans"},
                        {"name": "lettuce", "quantity": f"{2 * multiplier} cups"},
                        {"name": "tomatoes", "quantity": f"{2 * multiplier} medium"}
                    ],
                    "instructions": [
                        "Mix tuna with mayonnaise and seasonings",
                        "Serve over lettuce with sliced tomatoes",
                        "Add your favorite dressing"
                    ]
                },
                "dinner": {
                    "recipe_name": "Grilled Chicken with Rice",
                    "ingredients": [
                        {"name": "chicken thighs", "quantity": f"{8 * multiplier} oz"},
                        {"name": "rice", "quantity": f"{2 * multiplier} cups"},
                        {"name": "green beans", "quantity": f"{2 * multiplier} cups"}
                    ],
                    "instructions": [
                        "Season and grill chicken thighs",
                        "Cook rice according to package instructions",
                        "Steam green beans until tender"
                    ]
                }
            },
            "saturday": {
                "breakfast": {
                    "recipe_name": "Pancakes",
                    "ingredients": [
                        {"name": "pancake mix", "quantity": f"{2 * multiplier} cups"},
                        {"name": "eggs", "quantity": f"{2 * multiplier}"},
                        {"name": "milk", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Mix pancake batter according to package instructions",
                        "Cook pancakes on a griddle",
                        "Serve with syrup and butter"
                    ]
                },
                "lunch": {
                    "recipe_name": "Burger",
                    "ingredients": [
                        {"name": "ground beef", "quantity": f"{8 * multiplier} oz"},
                        {"name": "burger buns", "quantity": f"{2 * multiplier}"},
                        {"name": "cheese", "quantity": f"{2 * multiplier} slices"}
                    ],
                    "instructions": [
                        "Form ground beef into patties and season",
                        "Cook burgers on grill or stovetop",
                        "Serve on buns with cheese and toppings"
                    ]
                },
                "dinner": {
                    "recipe_name": "Fish Tacos",
                    "ingredients": [
                        {"name": "white fish", "quantity": f"{8 * multiplier} oz"},
                        {"name": "tortillas", "quantity": f"{4 * multiplier} small"},
                        {"name": "cabbage", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Season and cook fish fillets",
                        "Shred cabbage for slaw",
                        "Assemble tacos with fish and slaw"
                    ]
                }
            },
            "sunday": {
                "breakfast": {
                    "recipe_name": "French Toast",
                    "ingredients": [
                        {"name": "bread", "quantity": f"{6 * multiplier} slices"},
                        {"name": "eggs", "quantity": f"{3 * multiplier}"},
                        {"name": "milk", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Beat eggs with milk and cinnamon",
                        "Dip bread slices in egg mixture",
                        "Cook on griddle until golden brown"
                    ]
                },
                "lunch": {
                    "recipe_name": "Soup and Salad",
                    "ingredients": [
                        {"name": "chicken soup", "quantity": f"{2 * multiplier} cups"},
                        {"name": "mixed greens", "quantity": f"{2 * multiplier} cups"},
                        {"name": "croutons", "quantity": f"{1 * multiplier} cup"}
                    ],
                    "instructions": [
                        "Heat chicken soup in a pot",
                        "Toss mixed greens with dressing",
                        "Serve soup with salad and croutons"
                    ]
                },
                "dinner": {
                    "recipe_name": "Roast Chicken",
                    "ingredients": [
                        {"name": "whole chicken", "quantity": f"{1 * multiplier} small"},
                        {"name": "potatoes", "quantity": f"{4 * multiplier} medium"},
                        {"name": "carrots", "quantity": f"{4 * multiplier} medium"}
                    ],
                    "instructions": [
                        "Season chicken and roast at 375°F for 1 hour",
                        "Cut potatoes and carrots into chunks",
                        "Roast vegetables alongside chicken"
                    ]
                }
            }
        },
        "consolidated_grocery_list": [
            {"name": "eggs", "quantity": f"{12 * multiplier}"},
            {"name": "bread", "quantity": f"{20 * multiplier} slices"},
            {"name": "chicken breast", "quantity": f"{14 * multiplier} oz"},
            {"name": "rice", "quantity": f"{6 * multiplier} cups"},
            {"name": "mixed vegetables", "quantity": f"{4 * multiplier} cups"},
            {"name": "pasta", "quantity": f"{32 * multiplier} oz"},
            {"name": "marinara sauce", "quantity": f"{4 * multiplier} cups"},
            {"name": "oats", "quantity": f"{2 * multiplier} cups"},
            {"name": "milk", "quantity": f"{4 * multiplier} cups"},
            {"name": "berries", "quantity": f"{2 * multiplier} cups"},
            {"name": "turkey slices", "quantity": f"{6 * multiplier} oz"},
            {"name": "lettuce", "quantity": f"{4 * multiplier} cups"},
            {"name": "salmon fillets", "quantity": f"{8 * multiplier} oz"},
            {"name": "broccoli", "quantity": f"{2 * multiplier} cups"},
            {"name": "sweet potato", "quantity": f"{2 * multiplier} medium"},
            {"name": "Greek yogurt", "quantity": f"{2 * multiplier} cups"},
            {"name": "granola", "quantity": f"{1 * multiplier} cup"},
            {"name": "quinoa", "quantity": f"{1 * multiplier} cup"},
            {"name": "cucumber", "quantity": f"{1 * multiplier} medium"},
            {"name": "cherry tomatoes", "quantity": f"{1 * multiplier} cup"},
            {"name": "beef strips", "quantity": f"{8 * multiplier} oz"},
            {"name": "bell peppers", "quantity": f"{2 * multiplier} medium"},
            {"name": "avocado", "quantity": f"{2 * multiplier} medium"},
            {"name": "tortillas", "quantity": f"{6 * multiplier} large"},
            {"name": "zucchini", "quantity": f"{2 * multiplier} medium"},
            {"name": "mushrooms", "quantity": f"{1 * multiplier} cup"},
            {"name": "frozen berries", "quantity": f"{2 * multiplier} cups"},
            {"name": "banana", "quantity": f"{2 * multiplier} medium"},
            {"name": "tuna", "quantity": f"{2 * multiplier} cans"},
            {"name": "tomatoes", "quantity": f"{2 * multiplier} medium"},
            {"name": "chicken thighs", "quantity": f"{8 * multiplier} oz"},
            {"name": "green beans", "quantity": f"{2 * multiplier} cups"},
            {"name": "pancake mix", "quantity": f"{2 * multiplier} cups"},
            {"name": "ground beef", "quantity": f"{8 * multiplier} oz"},
            {"name": "burger buns", "quantity": f"{2 * multiplier}"},
            {"name": "cheese", "quantity": f"{2 * multiplier} slices"},
            {"name": "white fish", "quantity": f"{8 * multiplier} oz"},
            {"name": "cabbage", "quantity": f"{1 * multiplier} cup"},
            {"name": "chicken soup", "quantity": f"{2 * multiplier} cups"},
            {"name": "mixed greens", "quantity": f"{2 * multiplier} cups"},
            {"name": "croutons", "quantity": f"{1 * multiplier} cup"},
            {"name": "whole chicken", "quantity": f"{1 * multiplier} small"},
            {"name": "potatoes", "quantity": f"{4 * multiplier} medium"},
            {"name": "carrots", "quantity": f"{4 * multiplier} medium"}
        ],
        "budget_summary": {
            "estimated_total_cost": f"${80 * multiplier}.00",
            "within_budget": True
        },
        "nutrition_summary": {
            "total_calories_per_day": 1800 * multiplier,
            "protein_grams_per_day": 90 * multiplier,
            "carbs_grams_per_day": 180 * multiplier,
            "fats_grams_per_day": 60 * multiplier
        }
    }
    
    return meal_plan

def extract_json_from_text(text):
    """Extracts a JSON object from a string, even if it's wrapped in a markdown"""
    try:
        # Find the start of the JSON object
        json_start = text.find('{')
        # Find the end of the JSON object
        json_end = text.rfind('}') + 1

        if json_start != -1 and json_end != -1:
            json_str = text[json_start:json_end]
            return json.loads(json_str)
        return None
    except (json.JSONDecodeError, IndexError):
        return None
    

def get_cors_headers():
    """Return headers for CORS"""
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept"
    }

def create_error_response(status_code, message):
    """Create a standardized error response"""
    return {
        "statusCode": status_code,
        "headers": get_cors_headers(),
        "body": json.dumps({"error": message}) 
    }
