import json
import boto3
import os

# Initialize the Amazon Bedrock runtime client
bedrock_runtime = boto3.client(service_name="bedrock-runtime", region_name="us-west-2")

# Get the model ID from environment variables
MODEL_ID = os.environ.get("MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

def generate_recipes(ingredients, preferences):
    """Generates multiple recipes using Amazon Bedrock, considering dietary preferences."""

    # Construct the dietary preferences string
    if preferences:
        pref_string = ", ".join(preferences)
        prompt_part_preferences = f"The user's dietary preferences are: {pref_string}."
    else:
        prompt_part_preferences = "The user has no specific dietary preferences."

    # Create a clear and structured prompt for the model
    prompt = f"""You are an expert chef. Based on the following ingredients and dietary preferences, create a list of 2 simple recipes. The user has: {', '.join(ingredients)}. {prompt_part_preferences} Please provide the recipes in a valid JSON format with a single key \"recipes\", which is a list of recipe objects. Each recipe object should have the following keys: \"recipe_name\" (string), \"ingredients\" (a list of maps, each with \"name\" and \"quantity\" keys), and \"instructions\" (a list of strings)."""

    # Define the request body for the Bedrock API
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096, # Increased max_tokens for multiple recipes
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
        recipes_text = response_body["content"][0]["text"]

        # The model output is a JSON string, so we parse it
        return json.loads(recipes_text)

    except Exception as e:
        print(f"Error generating recipes: {e}")
        raise

def lambda_handler(event, context):
    """The main Lambda handler function."""

    try:
        # Support both API Gateway proxy (event["body"] is a JSON string)
        # and direct invocation (test event where keys are at top level).
        raw_body = event.get("body") if isinstance(event, dict) else None

        if raw_body:
            if isinstance(raw_body, str):
                body = json.loads(raw_body)
            else:
                body = raw_body
        elif isinstance(event, dict) and ("ingredients" in event or "dietary_preferences" in event):
            body = event
        else:
            body = {}

        ingredients = body.get("ingredients", [])
        preferences = body.get("dietary_preferences", [])

        if not ingredients:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Ingredients list cannot be empty."})
            }

        # Generate the recipes
        recipes = generate_recipes(ingredients, preferences)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(recipes)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
