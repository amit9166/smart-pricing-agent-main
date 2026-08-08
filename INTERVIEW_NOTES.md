# Interview Notes & Architectural Highlights

This document serves as a technical reference explaining key architectural decisions, design patterns, and engineering tradeoffs made during development.

---

## 1. LangGraph vs. Linear Chains
Linear chain models (e.g. LangChain Sequential Chain) assume a rigid step-by-step progress. Real-world autonomous agents require dynamic decision-making and loop backs.
* **Why LangGraph**: It treats the execution as a StateGraph. This allows cycles, conditional routing (e.g. bypass scraping if cache is valid), and state recovery if nodes fail.
* **Shared State Pattern**: The state structure (`AgentState`) is a typed dictionary passed between nodes. Each node returns only the attributes it modifies, reducing side effects and ensuring clean, reproducible execution.

---

## 2. SOLID Principles Applied
* **Single Responsibility (SRP)**:
  - Each agent node (Monitoring, Sentiment, memory, Pricing, Execution) has one specific job. The scraper does not calculate pricing rules, and the pricing rules logic is isolated from database writes.
  - In Express, routers only route, models only define schemas, and controllers handle request/response formatting.
* **Open/Closed Principle (OCP)**:
  - The business rules validation in `pricing_agent.py` is structured modularly. We can append new pricing bounds (e.g. "Weekend Surcharge Rule") without modifying the LLM client or database models.
* **Dependency Inversion (DIP)**:
  - The scraping tool `playwright_scraper.py` accepts URLs and selector parameters, abstracts out the underlying Chromium details, and includes a fallback mock scraper. The consumer does not care whether live browsers or simulation runs generate the outputs.

---

## 3. Vector Database & ChromaDB Memory Design
In dynamic pricing, letting an LLM hallucinate prices randomly is dangerous.
* **Retrieval Augmented Generation (RAG)**: Before making a pricing recommendation, the **Memory Agent** queries ChromaDB persistent vector storage using a semantic embedding representing the current product state, sentiment levels, and SKU code.
* **Self-Improving Memory Loop**: Whenever the **Execution Agent** updates a product price, it writes a case record back to ChromaDB: `Product X price changed to Y due to rule Z`.
* **Gemini Embedding Integration**: We created a custom `GeminiEmbeddingFunction` class for ChromaDB that requests vector listings from Gemini (`text-embedding-004`), with a robust term-frequency hashing fallback to guarantee service continuity during offline test runs.

---

## 4. Safety Fail-safes & Deterministic Business Rules
We implement a hybrid AI-deterministic model:
* **The Rule**: Never trust raw LLM outputs for financial decisions.
* **Implementation**: The Pricing Agent invokes Gemini to recommend the optimal price (reasoning about demand spikes, social hype, competitor matches), but passes this suggestion to a deterministic rule engine:
  - **Price floor**: Minimum 20% margin above cost price.
  - **Price ceiling**: Maximum 10% price increase limit.
  - **Discount limit**: Maximum 15% discount limit.
  - **Extreme pricing filter**: Ignores competitor prices that are < 50% or > 200% of our cost price.

---

## 5. Offline Resiliency (Mock Scrapers & Simulator Fallbacks)
To ensure the application is portfolio-ready and can be demonstrated in any environment (including offline or when API keys are not supplied):
* **Scraper Fallback**: If Chromium fails to run or target URLs time out, Playwright catches the error and executes `run_mock_scraper`, which returns realistic simulated competitor price fluctuations.
* **Gemini API Fallback**: If `GEMINI_API_KEY` is not detected, both the sentiment agent and pricing agent fall back to heuristic simulators that output realistic JSON structures, ensuring a fully operational front-to-back demonstration out-of-the-box.
