# Jenkins SonarQube Scan for Tournament Arena

This folder contains the Jenkins pipeline used to scan the Tournament Arena
source code with SonarQube.

## Files

- `Jenkinsfile` - checks out the repository and runs the SonarQube scanner

The pipeline does not install dependencies, run tests, build the application,
run security scans, or deploy the application.

## Prerequisites

The Jenkins agent must have:

- Git installed and available on `PATH`
- A Unix shell with `sh` support (Linux agent, Docker agent, or WSL)
- Java installed (required by the SonarQube scanner)
- Network access to the SonarQube server
- Permission to check out the project repository

The pipeline scans these directories:

- `backend`
- `frontend`

Virtual environments, dependencies, generated files, media, static files,
frontend build output, and minified JavaScript are excluded.

## Configure SonarQube

### 1. Create a SonarQube project

In SonarQube:

1. Open **Projects** and select **Create project**.
2. Select **Manually**.
3. Set the project key to:

   ```text
   tournament-arena
   ```

4. Set the project display name to `TournamentArena`.
5. Create or select a project token when SonarQube asks for authentication.

Keep the token private. Do not put it in the `Jenkinsfile` or commit it to the
repository.

### 2. Add SonarQube to Jenkins

Install the **SonarQube Scanner for Jenkins** plugin, then go to:

**Manage Jenkins > System > SonarQube servers**

Add a server with:

- **Name:** `Sonar`
- **Server URL:** the URL of your SonarQube server
- **Authentication token:** the SonarQube project or global token

The server name must be exactly `Sonar`, because the pipeline uses:

```groovy
withSonarQubeEnv('Sonar')
```

### 3. Configure the scanner tool

Go to:

**Manage Jenkins > Tools > SonarQube Scanner installations**

Add a scanner installation with:

- **Name:** `SonarQube Scanner`
- **Install automatically:** enabled, or select an existing scanner installation

The tool name must be exactly `SonarQube Scanner`, because the pipeline uses:

```groovy
tool 'SonarQube Scanner'
```

## Jenkins setup

### 1. Install required plugins

Install these Jenkins plugins:

- Pipeline
- Git
- SonarQube Scanner for Jenkins

### 2. Create the pipeline job

1. Open the Jenkins dashboard.
2. Select **New Item**.
3. Enter a job name and choose **Pipeline**.
4. Under **Pipeline**, set **Definition** to `Pipeline script from SCM`.
5. Select **Git** as the SCM.
6. Enter the project repository URL and credentials if the repository is private.
7. Set **Script Path** to:

   ```text
   tournamentArena/jenkins/Jenkinsfile
   ```

   If the Jenkins job uses `tournamentArena` as its repository root, use:

   ```text
   jenkins/Jenkinsfile
   ```

8. Save the job and select **Build Now**.

The pipeline checks out the repository first, then runs the SonarQube scan.
Open the build log to confirm that the scanner connected to the server and
uploaded the analysis.

## Verify the scan

After a successful build:

1. Open the SonarQube dashboard.
2. Open the `TournamentArena` project.
3. Review bugs, vulnerabilities, code smells, coverage, and the quality gate.

The current Jenkinsfile uploads the analysis but does not wait for or fail on
the SonarQube quality gate. A quality-gate stage can be added later if you want
Jenkins to block builds that do not meet the configured gate.

## Troubleshooting

### `No tool named SonarQube Scanner`

Create a SonarQube Scanner installation under **Manage Jenkins > Tools** and
use the exact name `SonarQube Scanner`.

### `SonarQube server Sonar not found`

Add the server under **Manage Jenkins > System > SonarQube servers** and use
the exact name `Sonar`.

### `sonar-scanner: not found`

Confirm that the scanner installation is configured and that the Jenkins agent
can use it. Also verify that Java is installed on the agent.

### The pipeline fails at `sh`

This Jenkinsfile requires a Unix-compatible Jenkins agent. Run the job on a
Linux agent, a Docker-based agent, or an agent with WSL configured.

### The scan cannot connect to SonarQube

Check the SonarQube URL, Jenkins credentials, firewall rules, and network
access from the Jenkins agent to the SonarQube server.

## Useful links

- Jenkins documentation: https://www.jenkins.io/doc/
- SonarQube documentation: https://docs.sonarsource.com/sonarqube/
- SonarQube Scanner for Jenkins: https://docs.sonarsource.com/sonarqube-server/latest/devops-platform-integration/jenkins-integration/
