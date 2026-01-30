"""
SmartMeal agent tools: recipe suggestions, weekly meal plan, grocery list.
Each tool calls Amazon Bedrock (Claude) and returns a JSON string for the agent to use.
"""
import json
import boto3
from botocore.exceptions import ClientError

try:
    from strands import tool
except ImportError:
    def tool(f):
        return f  # no-op if Strands not installed (e.g. tests)

BEDROCK_REGION = "us-west-2"
MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"


def _get_bedrock():
    return boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)


def _invoke_bedrock(prompt: str, max_tokens: int = 2000) -> str:
    """Invoke Claude on Bedrock and return the raw text response."""
    try:
        client = _get_bedrock()
        response = client.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
        body = json.loads(response["body"].read())
        return body["content"][0]["text"].strip()
    except (ClientError, KeyError, json.JSONDecodeError) as e:
        return json.dumps({"error": str(e)})


def _extract_json(text: str):
    """Extract a JSON array or object from markdown-wrapped text."""
    text = text.strip()
    for prefix in ("```json", "```"):
        if text.startswith(prefix):
            text = text.split(prefix, 1)[-1].replace("```", "").strip()
    for start, end in (("[", "]"), ("{", "}")):
        i, j = text.find(start), text.rfind(end)
        if i != -1 and j != -1:
            try:
                return json.loads(text[i : j + 1])
            except json.JSONDecodeError:
                pass
    return None


@tool
def suggest_recipes(ingredients: list[str], dietary_preferences: list[str] | None = None) -> str:
    """
    Suggest 2 recipes that use the given ingredients and respect dietary preferences.

    Args:
        ingredients: List of ingredient names (e.g. chicken, rice, broccoli).
        dietary_preferences: Optional list (e.g. vegetarian, gluten-free).
    """
    dietary = ", ".join(dietary_preferences or []) or "none"
    ing = ", ".join(ingredients) if isinstance(ingredients, list) else str(ingredients)
    prompt = f"""Create 2 simple recipes using these ingredients: {ing}
Dietary preferences: {dietary}

Return only a JSON array of 2 objects. Each object must have:
- "recipe_name": string
- "ingredients": array of {{"name": string, "quantity": string}}
- "instructions": array of step strings

Example shape:
[{{"recipe_name": "...", "ingredients": [{{"name": "...", "quantity": "..."}}], "instructions": ["Step 1", "Step 2"]}}]
"""
    raw = _invoke_bedrock(prompt, max_tokens=1500)
    out = _extract_json(raw)
    if isinstance(out, list) and len(out) > 0:
        return json.dumps({"recipes": out})
    return json.dumps({"recipes": [], "raw_error": raw[:500]})


@tool
def create_weekly_meal_plan(
    dietary: list[str] | None = None,
    budget: int = 100,
    servings: int = 2,
    meal_types: list[str] | None = None,
    nutrition_goals: str = "balanced",
) -> str:
    """
    Create a 7-day meal plan with breakfast, lunch, and dinner.

    Args:
        dietary: Dietary restrictions (e.g. vegetarian, keto).
        budget: Weekly budget in dollars.
        servings: Number of servings per meal.
        meal_types: Meals to plan (e.g. breakfast, lunch, dinner).
        nutrition_goals: e.g. balanced, high-protein, low-carb.
    """
    meal_types = meal_types or ["breakfast", "lunch", "dinner"]
    dietary_str = ", ".join(dietary or []) or "none"
    meals_str = ", ".join(meal_types)
    prompt = f"""Create a 7-day meal plan for {servings} people, ${budget} weekly budget.
Dietary: {dietary_str}. Meals per day: {meals_str}. Nutrition: {nutrition_goals}.

Return ONLY valid JSON in this shape (short recipe names and 1–2 line instructions are fine):
{{
  "weekly_plan": {{
    "monday": {{ "breakfast": {{ "recipe_name": "...", "ingredients": [{{"name":"...","quantity":"..."}}], "instructions": ["..."] }}, "lunch": {{ ... }}, "dinner": {{ ... }} }},
    "tuesday": {{ ... }}, "wednesday": {{ ... }}, "thursday": {{ ... }}, "friday": {{ ... }}, "saturday": {{ ... }}, "sunday": {{ ... }}
  }},
  "consolidated_grocery_list": [{{ "name": "...", "quantity": "..." }}],
  "budget_summary": {{ "estimated_total_cost": "$XX", "within_budget": true }},
  "nutrition_summary": {{ "total_calories_per_day": number, "protein_grams_per_day": number }}
}}
"""
    raw = _invoke_bedrock(prompt, max_tokens=4000)
    out = _extract_json(raw)
    if isinstance(out, dict):
        return json.dumps(out)
    return json.dumps({"error": "Invalid plan", "raw": raw[:800]})


@tool
def generate_grocery_list(meal_plan_json: str, pantry_ingredients: list[str] | None = None) -> str:
    """
    From a meal plan (list of recipes with recipe_name and ingredients), produce a consolidated
    grocery list, excluding items already in the pantry.

    Args:
        meal_plan_json: JSON string - array of {recipe_name, ingredients: [{name, quantity}]}.
        pantry_ingredients: Items already at home (e.g. salt, olive oil).
    """
    try:
        plan = json.loads(meal_plan_json) if isinstance(meal_plan_json, str) else meal_plan_json
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid meal_plan_json"})
    if not isinstance(plan, list):
        plan = plan.get("recipes", plan.get("meal_plan", []))
    pantry_set = {str(x).lower().strip() for x in (pantry_ingredients or [])}
    consolidated = {}
    for recipe in plan:
        for ing in recipe.get("ingredients", []):
            name = (ing.get("name") or "").lower().strip()
            qty = ing.get("quantity", "as needed")
            if name in pantry_set:
                continue
            if name in consolidated:
                consolidated[name]["quantity"] = consolidated[name]["quantity"] + ", " + qty
            else:
                consolidated[name] = {"quantity": qty}
    items = [{"name": k.title(), "quantity": v["quantity"]} for k, v in consolidated.items()]
    return json.dumps({"grocery_list": items, "total_items": len(items)})
