# SmartMeal – AI Meal & Grocery Planner

SmartMeal is an AI-powered meal and grocery planner that suggests recipes from your ingredients, generates step-by-step cooking instructions, and creates consolidated grocery lists with budget and nutrition awareness. Built for the AWS AI Agent Global Hackathon.

## Features

- **Recipe suggestions** – Enter ingredients and dietary preferences; get AI-generated recipes powered by Amazon Bedrock (Claude).
- **Weekly meal planning** – Plan a full week of meals with dietary goals, budget, and nutrition targets.
- **Grocery list** – Generate a consolidated shopping list from selected recipes or your weekly plan, with optional budget and nutrition filters.
- **Nutrition overview** – View nutrition charts and budget/nutrition panels for recipes and weekly plans.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Tailwind CSS, Recharts, Axios |
| **Backend** | AWS SAM, API Gateway, Lambda (Python 3.11) |
| **AI** | Amazon Bedrock (Claude) for recipe and meal planning |
| **Data** | DynamoDB (Users, Recipes, Pantry Items) |

## Project Structure

```
smartmeal/
├── backend/                    # AWS serverless backend
│   ├── template.yaml           # SAM template (API, Lambdas, DynamoDB)
│   ├── samconfig.toml          # SAM deploy configuration
│   └── lambda_functions/
│       ├── meal_planner/       # Single-recipe suggestions from ingredients
│       ├── weekly_meal_planner/# Weekly meal plan generation
│       └── grocery_list/       # Consolidated grocery list from meal plan
├── frontend/
│   └── smartmeal-frontend/     # React app
│       ├── src/
│       │   ├── App.js
│       │   └── components/    # IngredientForm, RecipeDisplay, GroceryList, etc.
│       └── package.json
├── documents/
│   └── smartmeal_plan.md       # 15-day development plan
└── README.md
```

## Prerequisites

- **Backend:** [AWS CLI](https://aws.amazon.com/cli/) configured, [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html), Python 3.11+
- **Frontend:** Node.js 18+, npm

## Getting Started

### 1. Deploy the backend (AWS)

From the project root:

```bash
cd backend
sam build
sam deploy --guided
```

After deploy, note the **API Gateway endpoint** from the stack outputs (e.g. `SmartMealApiEndpoint`).

### 2. Run the frontend

```bash
cd frontend/smartmeal-frontend
npm install
npm start
```

Set the API base URL in the app (e.g. in `src/App.js` as `API_BASE_URL`) to your deployed API Gateway URL so the frontend calls your backend.

### 3. (Optional) Local API testing

You can invoke Lambdas locally with SAM:

```bash
cd backend
sam local invoke MealPlannerFunction -e events/meal_planner_event.json
```

(Add sample event JSON files under `backend/events/` as needed.)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/Prod/recipes` | Get recipe suggestions from ingredients and dietary preferences |
| `POST` | `/Prod/weekly-plan` | Generate a weekly meal plan (diet, budget, nutrition) |
| `POST` | `/Prod/grocery-list` | Get consolidated grocery list from a meal plan + optional pantry |

Request/response shapes are defined by the Lambda handlers in `backend/lambda_functions/*/app.py`.

