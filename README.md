# SmartMeal – AI Meal & Grocery Planner

SmartMeal is an **AI agent** meal and grocery planner built for the **AWS AI Agent Global Hackathon**. It suggests recipes from your ingredients, generates step-by-step cooking instructions, and creates consolidated grocery lists wi ness. The app includes:

- **Agent path:** An **Amazon Bedrock AgentCore** agent using **Strands Agents** and tools (recipe suggestions, weekly meal plan, grocery list). Deploy with the AgentCore starter toolkit and invoke via API Gateway `/agent`.
- **Lambda path:** Existing Lambdas that call Bedrock directly (`invoke_model`) for `/recipes`, `/weekly-plan`, and `/grocery-list`—no agent orchestration.

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
| **AI (agent)** | Amazon Bedrock AgentCore + Strands Agents + Claude (tools: recipes, weekly plan, grocery list) |
| **AI (Lambda)** | Amazon Bedrock (Claude) — `invoke_model` for /recipes, /weekly-plan, /grocery-list |
| **Data** | DynamoDB (Users, Recipes, Pantry Items) |

## Project Structure

```
smartmeal/
├── backend/                    # AWS serverless backend
│   ├── template.yaml           # SAM template (API, Lambdas, DynamoDB)
│   ├── samconfig.toml          # SAM deploy configuration
│   ├── agentcore_agent/        # Bedrock AgentCore agent (Strands + tools)
│   │   ├── smartmeal_agent.py  # Agent entrypoint (BedrockAgentCoreApp + Strands Agent)
│   │   ├── smartmeal_tools.py  # Tools: suggest_recipes, create_weekly_meal_plan, generate_grocery_list
│   │   └── requirements.txt
│   └── lambda_functions/
│       ├── meal_planner/       # Single-recipe suggestions (Bedrock invoke_model)
│       ├── weekly_meal_planner/# Weekly meal plan (Bedrock / simple fallback)
│       ├── grocery_list/      # Consolidated grocery list from meal plan
│       └── agent_invoker/     # Lambda that invokes AgentCore Runtime (POST /agent)
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
- **AgentCore agent:** Python 3.10+, [AgentCore starter toolkit](https://github.com/aws/bedrock-agentcore-starter-toolkit) (`pip install bedrock-agentcore-starter-toolkit`), Bedrock model access (e.g. Claude)
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

### 2. Deploy the SmartMeal agent (Bedrock AgentCore) — for the AI agent path

From the project root:

```bash
pip install bedrock-agentcore bedrock-agentcore-starter-toolkit strands-agents boto3
cd backend/agentcore_agent
agentcore configure -e smartmeal_agent.py
agentcore deploy
```

After deploy, note the **agent runtime ARN** from the output (or from `.bedrock_agentcore.yaml`). Set it on the Agent Invoker Lambda so the API can call the agent:

- **Option A:** In AWS Console → Lambda → `AgentInvokerFunction` → Configuration → Environment variables → set `AGENT_RUNTIME_ARN` to your agent runtime ARN.
- **Option B:** In `backend/template.yaml`, set `AGENT_RUNTIME_ARN` under `AgentInvokerFunction` → Environment → Variables, then redeploy with `sam build && sam deploy`.

Test the agent locally (optional):

```bash
cd backend/agentcore_agent
python smartmeal_agent.py   # starts server on port 8080
# In another terminal:
curl -X POST http://localhost:8080/invocations -H "Content-Type: application/json" -d '{"prompt": "I have chicken and rice. Give me 2 recipes."}'
```

### 3. Run the frontend

```bash
cd frontend/smartmeal-frontend
npm install
npm start
```

Set the API base URL in the app (e.g. in `src/App.js` as `API_BASE_URL`) to your deployed API Gateway URL so the frontend calls your backend.

### 4. (Optional) Local API testing

You can invoke Lambdas locally with SAM:

```bash
cd backend
sam local invoke MealPlannerFunction -e events/meal_planner_event.json
```

(Add sample event JSON files under `backend/events/` as needed.)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/Prod/agent` | **Agent path:** Invoke the SmartMeal AgentCore agent. Body: `{"prompt": "..."}`. Returns `{"result": "..."}`. Requires `AGENT_RUNTIME_ARN` set after `agentcore deploy`. |
| `POST` | `/Prod/recipes` | Get recipe suggestions from ingredients and dietary preferences (Lambda + Bedrock) |
| `POST` | `/Prod/weekly-plan` | Generate a weekly meal plan (diet, budget, nutrition) (Lambda + Bedrock) |
| `POST` | `/Prod/grocery-list` | Get consolidated grocery list from a meal plan + optional pantry (Lambda + Bedrock) |

Request/response shapes are defined by the Lambda handlers in `backend/lambda_functions/*/app.py`. The agent accepts a natural-language `prompt` and uses its tools (suggest_recipes, create_weekly_meal_plan, generate_grocery_list) to respond.

