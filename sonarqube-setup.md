# SonarQube Docker Setup

## Quick Start

1. **Start SonarQube:**
   ```bash
   docker-compose -f docker-compose-sonarqube.yml up -d
   ```

2. **Access SonarQube:**
   - URL: http://localhost:9000
   - Default credentials: admin / admin

3. **Stop SonarQube:**
   ```bash
   docker-compose -f docker-compose-sonarqube.yml down
   ```

## Manual Download (if needed)

If you want to download SonarQube manually:
1. Visit https://www.sonarsource.com/products/sonarqube/downloads/
2. Download the Community Edition zip file
3. Extract to a local directory

## Configuration Notes

- **Database:** PostgreSQL 15 with persistent data
- **Version:** SonarQube 9.9.4 Community Edition
- **Ports:** 9000 (web interface)
- **Data persistence:** All data is preserved in Docker volumes

## Next Steps

1. Log in and change the default admin password
2. Generate a project token for your code analysis
3. Configure your CI/CD pipeline or local scanner to use SonarQube

## Troubleshooting

- If SonarQube fails to start, check Docker logs: `docker logs sonarqube`
- Ensure port 9000 is not already in use
- For performance issues, increase JVM memory in sonar.properties
