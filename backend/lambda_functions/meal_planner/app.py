import json
import boto3
import os

# Initialize the Amazon Bedrock runtime client
bedrock_runtime = boto3.client(service_name="bedrock-runtime")

# Get the model ID from environment variables
MODEL_ID = os.environ.get("MODEL_ID", "anthropic.claude-sonnet-4-20250514-v1:0")

def generate_recipe(ingredients):
    """Generates a recipe using Amazon Bedrock."""

    # Create a clear and structured prompt for the model
    prompt = f"""You are an expert chef. Based on the following ingredients, create a single, simple recipe.
    The user has: {', '.join(ingredients)}. Please provide the recipe in a valid JSON format with the following keys:
    "recipe_name" (string), "ingredients" (a list of maps, each with "name" and "quantity" keys), and "instructions" (a list of strings)."""

    # Define the request body for the Bedrock API
    request_body = {
        "anthropic_version": "",
        "max_tokens": 2048,
        "messages": [
            {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": prompt
                }]
            }
        ]
    }

    try:
        # Invoke the model
        response = bedrock_runtime.invoke_model(
            body=json.dumps(request_body),
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json"
        )

        # Parse the response body
        response_body = json.loads(response.get("body").read())
        recipe_text = response_body["content"][0]["text"]

        # The model output is a JSON string, so we parse it
        return json.loads(recipe_text)

    except Exception as e:
        print(f"Error generating recipe: {e}")
        raise

def lambda_handler(event, context):
    """The main Lambda handler function."""

    try:
        # Extract ingredients from the incoming event
        # The structure: {"ingredients": ["chicken", "rice", "spinach"]}
        body = json.loads(event.get("body", "{}"))
        ingredients = body.get("ingredients", [])

        if not ingredients:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Ingredients list cannot be empty."})
            }

        # Generate the recipe
        recipe = generate_recipe(ingredients)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(recipe)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
