// ================================================
//  드라마 DRAMA.KR  —  Jenkinsfile
//  CI/CD Pipeline for Static Site Deployment
// ================================================

pipeline {

    agent any

    environment {
        APP_NAME   = 'dramakr'
        BUILD_DIR  = 'dist'
        DEPLOY_DIR = '/var/www/html/dramakr'   // Update to your server path
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📦 Checking out source...'
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                echo '🔍 Validating project files...'
                script {
                    ['index.html','style.css','data.js','app.js'].each { f ->
                        if (!fileExists(f)) error("Missing: ${f}")
                        echo "  ✅ ${f}"
                    }
                }
            }
        }

        stage('Build') {
            steps {
                echo '🏗️  Building dist package...'
                sh """
                    rm -rf ${BUILD_DIR} && mkdir -p ${BUILD_DIR}
                    cp index.html style.css data.js app.js ${BUILD_DIR}/
                    echo "Build: #${BUILD_NUMBER} | $(date)" > ${BUILD_DIR}/build.txt
                """
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Smoke testing build...'
                script {
                    ['index.html','style.css','data.js','app.js'].each { f ->
                        def size = sh(script:"wc -c < ${BUILD_DIR}/${f}", returnStdout:true).trim().toInteger()
                        if (size < 500) error("${f} too small (${size} bytes)")
                        echo "  ✅ ${f} — ${size} bytes"
                    }
                    def dramaCount = sh(script:"grep -c 'title:' ${BUILD_DIR}/data.js", returnStdout:true).trim()
                    echo "  📺 Drama entries found: ${dramaCount}"
                }
            }
        }

        stage('Deploy') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                echo "🚀 Deploying to ${DEPLOY_DIR}..."
                sh "mkdir -p ${DEPLOY_DIR} && cp -r ${BUILD_DIR}/* ${DEPLOY_DIR}/"
            }
        }

        stage('Archive') {
            steps {
                archiveArtifacts artifacts: "${BUILD_DIR}/**/*", fingerprint: true
                echo '📁 Artifacts archived'
            }
        }
    }

    post {
        success { echo "✅ 드라마 DRAMA.KR — Build #${BUILD_NUMBER} deployed!" }
        failure { echo "❌ Build #${BUILD_NUMBER} failed. Check logs." }
        always  { cleanWs() }
    }
}
