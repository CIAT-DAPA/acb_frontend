def remote = [:]

pipeline {

    agent any

    environment {
        //user = credentials('lamaar_user')
        //host = credentials('lamaar_host')
        //name = credentials('lamaar_host')
       // ssh_key = credentials('lamaar_key')
    }

    stages {
        stage('Ssh to connect Herschel server') {
            steps {
                script {
                    // Set up remote SSH connection parameters
                    remote.allowAnyHosts = true
                    remote.identityFile = ssh_key
                    remote.user = user
                    remote.name = name
                    remote.host = host
                    
                }
            }
        }
        stage('Update Code') {
            steps {
                script {
                    try {
                        sshCommand remote: remote, command: """
                            cd /var/www/docs/bulletin_builder/acb_frontend
                            git checkout main
                            git pull origin main
                        """
                    } catch (Exception e) {
                        echo "Git Pull Error: ${e.message}"
                        error("Failed to update code: ${e.message}")
                    }
                }
            }
        }
        stage('Download latest release') {
            steps {
                script {
                    sshCommand remote: remote, command: """
                        cd /var/www/docs/bulletin_builder/acb_frontend/src
                        npm install
                        npm run build
                        cd /var/www/docs/bulletin_builder/acb_frontend
                        pm2 stop bulletin_builder_frontend || pm2 delete bulletin_builder_frontend
                        pm2 start ecosystem.config.js
                    """
                }
            }
        }
    }
    
    post {
        failure {
            script {
                echo 'fail :c'
            }
        }

        success {
            script {
                echo 'everything went very well!!'
            }
        }
    }
 
}