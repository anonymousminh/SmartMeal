import json
import boto3
from botocore.exceptions import ClientError
import os

def lambda_handler(event, context):
    """The main Lambda handler function."""
    
    try:
        print("📥 Received event:", json.dumps(event, indent=2))
        
        # Parse the request body
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
            
        print("📝 Parsed body:", json.dumps(body, indent=2))
        
        # Extract ingredients and dietary preferences
        ingredients = body.get('ingredients', [])
        dietary_preferences = body.get('dietary_preferences', [])
        
        print(f"🥘 Ingredients: {ingredients}")
        print(f"🥗 Dietary preferences: {dietary_preferences}")
        
        # Validate inputs
        if not ingredients or len(ingredients) == 0:
            return create_error_response(400, "Ingredients list cannot be empty.")
        
        # Filter out empty ingredients
        valid_ingredients = [ing.strip() for ing in ingredients if ing and ing.strip()]
        
        if not valid_ingredients:
            return create_error_response(400, "Please provide valid ingredients.")
        
        print(f"✅ Valid ingredients: {valid_ingredients}")
        
        # Generate recipes using Bedrock
        recipes = generate_recipes_with_bedrock(valid_ingredients, dietary_preferences)
        
        return {
            "statusCode": 200,
            "headers": get_cors_headers(),
            "body": json.dumps({"recipes": recipes})
        }

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        return create_error_response(400, f"Invalid JSON format: {str(e)}")
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return create_error_response(500, f"Internal server error: {str(e)}")

def create_error_response(status_code, message):
    """Create a standardized error response."""
    return {
        "statusCode": status_code,
        "headers": get_cors_headers(),
        "body": json.dumps({"error": message})
    }

def get_cors_headers():
    """Get CORS headers."""
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept"
    }

def generate_recipes_with_bedrock(ingredients, dietary_preferences):
    """Generate recipes using Amazon Bedrock."""
    
    try:
        print("🤖 Initializing Bedrock client...")
        
        # Initialize Bedrock client - try multiple regions
        regions_to_try = ['us-west-2', 'us-east-1', 'eu-west-1']
        bedrock_runtime = None
        
        for region in regions_to_try:
            try:
                bedrock_runtime = boto3.client('bedrock-runtime', region_name=region)
                print(f"✅ Bedrock client initialized in region: {region}")
                break
            except Exception as e:
                print(f"❌ Failed to initialize Bedrock in {region}: {e}")
                continue
        
        if not bedrock_runtime:
            print("❌ Failed to initialize Bedrock client in any region")
            return create_fallback_recipes(ingredients, dietary_preferences)
        
        # Create the prompt
        ingredients_text = ", ".join(ingredients)
        dietary_text = ", ".join(dietary_preferences) if dietary_preferences else "none"
        
        # Simplified prompt that's more likely to work
        prompt = f"""Create 2 simple recipes using these ingredients: {ingredients_text}

Dietary preferences: {dietary_text}

Return only a JSON array in this exact format:
[
  {{
    "recipe_name": "Recipe 1 Name",
    "ingredients": [
      {{"name": "ingredient1", "quantity": "1 cup"}},
      {{"name": "ingredient2", "quantity": "2 pieces"}}
    ],
    "instructions": [
      "Step 1",
      "Step 2",
      "Step 3"
    ]
  }},
  {{
    "recipe_name": "Recipe 2 Name", 
    "ingredients": [
      {{"name": "ingredient1", "quantity": "500g"}},
      {{"name": "ingredient3", "quantity": "1 tbsp"}}
    ],
    "instructions": [
      "Step 1",
      "Step 2", 
      "Step 3"
    ]
  }}
]"""

        print(f"🤖 Sending prompt to Bedrock...")
        print(f"📝 Prompt: {prompt[:200]}...")
        
        # Try different model IDs
        model_ids_to_try = [
            'anthropic.claude-3-haiku-20240307-v1:0',
            'anthropic.claude-3-sonnet-20240229-v1:0',
            'anthropic.claude-v2:1'
        ]
        
        response_text = None
        
        for model_id in model_ids_to_try:
            try:
                print(f"🔄 Trying model: {model_id}")
                
                response = bedrock_runtime.invoke_model(
                    modelId=model_id,
                    body=json.dumps({
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 1500,
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    })
                )
                
                # Parse response
                response_body = json.loads(response['body'].read())
                response_text = response_body['content'][0]['text']
                
                print(f"✅ Got response from {model_id}")
                print(f"📥 Response: {response_text[:200]}...")
                break
                
            except ClientError as e:
                print(f"❌ Model {model_id} failed: {e}")
                continue
            except Exception as e:
                print(f"💥 Unexpected error with {model_id}: {e}")
                continue
        
        if not response_text:
            print("❌ All models failed, using fallback")
            return create_fallback_recipes(ingredients, dietary_preferences)
        
        # Clean and parse the response
        response_text = response_text.strip()
        
        # Remove any markdown formatting
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '').strip()
        
        print(f"🧹 Cleaned response: {response_text[:200]}...")
        
        # Try to parse the JSON response
        try:
            recipes = json.loads(response_text)
            if isinstance(recipes, list) and len(recipes) > 0:
                print(f"✅ Successfully parsed {len(recipes)} recipes")
                return recipes
            else:
                print("⚠️ Invalid recipe format, using fallback")
                return create_fallback_recipes(ingredients, dietary_preferences)
        except json.JSONDecodeError as e:
            print(f"⚠️ Failed to parse Bedrock JSON: {e}")
            print(f"📄 Raw response: {response_text}")
            return create_fallback_recipes(ingredients, dietary_preferences)
            
    except Exception as e:
        print(f"💥 Unexpected Bedrock error: {e}")
        return create_fallback_recipes(ingredients, dietary_preferences)

def create_fallback_recipes(ingredients, dietary_preferences):
    """Create simple fallback recipes when Bedrock fails."""
    
    print("🔄 Creating fallback recipes...")
    
    # Use the first few ingredients for variety
    primary_ingredient = ingredients[0] if ingredients else "mixed ingredients"
    secondary_ingredient = ingredients[1] if len(ingredients) > 1 else "vegetables"
    
    return [
        {
            "recipe_name": f"Simple {primary_ingredient.title()} Dish",
            "ingredients": [
                {"name": ing, "quantity": "as needed"} for ing in ingredients[:4]
            ] + [
                {"name": "salt", "quantity": "to taste"},
                {"name": "pepper", "quantity": "to taste"},
                {"name": "olive oil", "quantity": "2 tbsp"}
            ],
            "instructions": [
                f"Prepare all ingredients: {', '.join(ingredients[:3])}",
                "Heat olive oil in a large pan over medium heat",
                f"Add {primary_ingredient} and cook until done",
                "Season with salt and pepper to taste",
                "Serve hot and enjoy!"
            ]
        },
        {
            "recipe_name": f"Quick {secondary_ingredient.title()} Recipe",
            "ingredients": [
                {"name": ing, "quantity": "1 portion"} for ing in ingredients[-3:]
            ] + [
                {"name": "garlic", "quantity": "2 cloves"},
                {"name": "butter", "quantity": "2 tbsp"}
            ],
            "instructions": [
                "Preheat your cooking surface to medium heat",
                f"Combine {secondary_ingredient} with other ingredients",
                "Cook for 10-15 minutes until ready",
                "Adjust seasoning as needed",
                "Serve immediately while hot"
            ]
        }
    ]