# Brewgorithm Training

Lambda function that kicks off an EC2 instance to run the Brewgorithm Trainer

## Use-Case

This Lambda function is used to start the Menu Place and Availability Dispatchers - We need these to run on a schedule; we're shooting for around once a week right now..

The lambda function will spin up an EC2 instance from an ECS optimized AMI that already has Docker installed, run the Brewgorithm Trainer, and commit the new models to dev directly. The instance is configured to terminate on shut down.

## Deploying

This project is set to deploy using Serverless. The various options are configured in the `serverless.yml` while environment-specific information should be in the `serverless.override.yml` file.
