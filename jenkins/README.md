# Jenkins CI/CD for Tournament Arena

This folder contains the Jenkins pipeline configuration for the Tournament Arena project.

## Files

- `Jenkinsfile` - CI/CD pipeline for test, security, build, and production-ready stages

## Pipeline overview

The Jenkins pipeline is designed for a devsecops workflow and includes the following stages:

1. Checkout
2. Environment validation
3. Backend setup
4. Frontend setup
5. Code quality and tests
   - Django checks
   - Django unit tests
   - Frontend lint
6. Security scanning
   - Bandit for Python
   - pip-audit for Python dependencies
   - npm audit for frontend dependencies
7. Build artifacts
   - Django static files
   - Frontend production build
8. Archive artifacts
9. Production-ready stage for `main` branch

## Prerequisites

Before using this pipeline in Jenkins, make sure the Jenkins agent has:

- Git installed
- Python 3 installed
- Node.js and npm installed
- Access to the project repository
- Internet access to install Python and npm packages

## Jenkins setup

### 1. Install required Jenkins plugins

Install these plugins in Jenkins:

- Git Plugin
- Pipeline
- Blue Ocean (optional)
- HTML Publisher (optional)
- NodeJS Plugin (optional)

### 2. Create a new pipeline job

- Go to Jenkins Dashboard
- Click New Item
- Choose Pipeline
- Set the repository URL
- Under Pipeline, choose:
  - Definition: Pipeline script from SCM
  - SCM: Git
  - Repository URL: your project Git URL
  - Script Path: `jenkins/Jenkinsfile`

### 3. Branch configuration

The production-ready stage is restricted to the `main` branch.

## Run locally on a Linux machine

You can also test the same steps manually from the project root:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py check
python manage.py test

decativate

cd ../frontend
npm install
npm run lint
npm run build
```

## Security tools

This pipeline uses:

```bash
pip install bandit pip-audit
bandit -r backend
pip-audit -r backend/requirements.txt --progress-spinner off
npm audit --audit-level=high
```

## Production readiness

The production stage currently runs only on the `main` branch and prints a deployment-ready message. You can extend this stage to:

- SSH deploy to a server
- Build Docker images
- Push to a registry
- Deploy to Kubernetes
- Run smoke tests after deployment

## Recommended next improvements

- Add Docker build stage
- Add deployment to staging and production
- Add SonarQube scanning
- Add Trivy image scanning
- Add notification to Slack or email

## Useful links

- Jenkins docs: https://www.jenkins.io/doc/
- Django docs: https://docs.djangoproject.com/en/5.1/
- Vite docs: https://vite.dev/
