library 'Utilities'

// Only save the last 5 builds for each branch.
// Builds & logs from a branch will be automatically removed when the branch is removed
// (Although a re-scan may be necessary)
properties([
    buildDiscarder(logRotator(numToKeepStr: '5')),

    // Building at the same time can cause race conditions if we're deploying; build
    // one at a time.
    disableConcurrentBuilds()
])

node("ubuntu-docker") {
  linuxCleanup()
  checkout scm

  try {
    notifyBuild('STARTED')
    prepareAndRunCI()
  } catch (e) {
    // If there was an exception thrown, the build failed
    currentBuild.result = "FAILED"
    throw e
  } finally {
    linuxCleanup()

    // Success or failure, always send notifications
    notifyBuild(currentBuild.result)
  }
}

def prepareAndRunCI() {
    // Define the variables to be used
    String IMAGE_NAME          // The final Docker image name we are building and deploying.
    String IMAGE_NAME_TEMP     // Temporary image name so multiple builds do not clash.
    String ECR_REGION          // The Elastic Container Registry Region
    String OVERRIDE_FILE       // Environment-specific Serverless configuration

    IMAGE_NAME       = "menu-executor-lambda"
    IMAGE_NAME_TEMP  = "${IMAGE_NAME}-${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
    TOOLS_IMAGE_NAME = "${IMAGE_NAME_TEMP}-tools"
    ECR_REGION       = "${env.ECR_REPOSITORY_REGION}"

    // Login to ECR so that we may access the base image and later push the built
    // image up.
    stage("Login to AWS Registry") {
      loginToAWSRegistry(ECR_REGION)
    }


    switch (env.BRANCH_NAME) {
      // Set our variables as appropriate for the branch we're on.
      case "dev":
        OVERRIDE_FILE   = "menu_executor_serverless_qa"
        break;
      case "master":
        OVERRIDE_FILE   = "menu_executor_serverless_production"
        break;
      default:
        break;
    }

    // Continuous deployment will only be setup for `dev` and `master` branches.
    if ( (env.BRANCH_NAME == "dev") || (env.BRANCH_NAME == "master") ) {
      stage("Build container") {
        configFileProvider([configFile(fileId: "${OVERRIDE_FILE}", targetLocation: 'serverless.override.yml')]) {
          sh "docker build -f Dockerfile.ci -t ${TOOLS_IMAGE_NAME} ."
        }
      }

      stage("Deploy Function") {
        withCredentials([string(credentialsId: 'aws-access-key-id', variable: 'access_key'), string(credentialsId: 'aws-secret-access-key', variable: 'access_secret')]) {
              sh "docker run --rm -e AWS_ACCESS_KEY_ID=${access_key} -e AWS_SECRET_ACCESS_KEY=${access_secret} ${TOOLS_IMAGE_NAME} npm run deploy"
        }
      }
    }
}
