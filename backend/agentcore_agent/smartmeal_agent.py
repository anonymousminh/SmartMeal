"""
SmartMeal AI Agent — Amazon Bedrock AgentCore + Strands Agents.
Orchestrates recipe suggestions, weekly meal planning, and grocery list generation via tools.
"""
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent

from smartmeal_tools import suggest_recipes, create_weekly_meal_plan, generate_grocery_list

app = BedrockAgentCoreApp()

SYSTEM_PROMPT = """You are SmartMeal, a helpful meal and grocery planning assistant.
You have access to these tools:
1. suggest_recipes(ingredients, dietary_preferences) — Get 2 recipes from a list of ingredients and optional dietary preferences (e.g. vegetarian, gluten-free).
2. create_weekly_meal_plan(dietary, budget, servings, meal_types, nutrition_goals) — Create a 7-day meal plan with breakfast, lunch, dinner. Budget in dollars, servings per meal, optional meal_types (e.g. breakfast, lunch, dinner), nutrition_goals (e.g. balanced, high-protein).
3. generate_grocery_list(meal_plan_json, pantry_ingredients) — From a meal plan (JSON array of recipes with recipe_name and ingredients), produce a consolidated grocery list. pantry_ingredients is a list of items the user already has.

Use the tools when the user asks for recipes, a weekly plan, or a grocery list. When returning recipe or plan data, summarize clearly and include key details (names, ingredients, steps) so the user can cook and shop. If the user provides ingredients or preferences, call the appropriate tool and then present the results in a friendly way."""

agent = Agent(
    tools=[suggest_recipes, create_weekly_meal_plan, generate_grocery_list],
    model="anthropic.claude-3-haiku-20240307-v1:0",
    system_prompt=SYSTEM_PROMPT,
)


@app.entrypoint
def agent_invocation(payload, context=None):
    """Handler for AgentCore invocations. Payload should include 'prompt'."""
    user_message = payload.get(
        "prompt",
        "Hello! I'm SmartMeal. You can ask me for recipe suggestions from ingredients, a weekly meal plan, or a grocery list. What would you like?",
    )
    result = agent(user_message)
    return {"result": result.message}


if __name__ == "__main__":
    app.run()
