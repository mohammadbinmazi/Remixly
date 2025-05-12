pipeline {
    agent any

    environment {
        BACKEND_IMAGE = 'remixly-backend:latest'
        FRONTEND_IMAGE = 'remixly-frontend:latest'
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/mohammadbinmazi/Remixly.git'
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                dir('backend') {
                    sh 'docker build -t $BACKEND_IMAGE .'
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $FRONTEND_IMAGE .'
                }
            }
        }

        stage('Run with Docker Compose') {
            steps {
                sh 'docker-compose down || true'  // Stop any running containers first
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed.'
        }
        always {
            echo 'Cleaning up...'
            sh 'docker system prune -f'
        }
    }
}
