# Autonomous Testing

## Fuzzy/Property-Based E2E Testing

#### Bombabil
E2E Property-Based testing library

#### Why?
This kind of testing can hit hard to reach corners of the app.
The promise: small amount of test code for large amount of coverage

#### Failures can be hard to interpret
Use LLM agent to interpret failure and code changes to diagnose issues and suggest fixes


## Autonomous E2E Tests

Write & execute one-off playright tests on the fly.
Report results automaticaly and diagnose issues using an LLM agent.

### Why?
  
#### Code is cheap 
Generating one-off tests at the time of need is possible with LLMs.

#### E2E test repos do not scale
Possible code paths grow exponentially as features are added. E2E test repos
cannot practically cover complex app.

## Flue Agents
Agent harness framework for sandboxing.
