#!/bin/bash
set -ev

case "$TRAVIS_BRANCH" in
"dev")
    SERVERLESS_FILE_NAME=brewgorithm_training_serverless_qa
    ;;
"master")
    SERVERLESS_FILE_NAME=brewgorithm_training_serverless_production
    ;;
*)
    exit 1; # Unsupported deployment branch.
    ;;
esac

# Download our Serverless configuration files.
pip install --user awscli
aws s3 sync s3://${AWS_S3_CONFIGURATION_BUCKET}/brewgorithm-training .

# Ensure it has the correct name that Serverless expects.
cp ${SERVERLESS_FILE_NAME} serverless.override.yml

# Ensure serverless plugins are installed.
docker run -e AWS_DEFAULT_REGION=${AWS_ECS_REGION} -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} -v $(pwd):/opt/app --entrypoint="" ratebeerofficial/serverless npm i

# Deploy via serverless.
docker run -e AWS_DEFAULT_REGION=${AWS_ECS_REGION} -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} -v $(pwd):/opt/app ratebeerofficial/serverless deploy -v
